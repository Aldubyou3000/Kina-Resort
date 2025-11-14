// Authentication system using Supabase
import { openModal } from '../components/modal.js';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabaseConfig.js';
import { setAuthState } from './state.js';

// Create custom storage for resort website sessions (separate from admin dashboard)
// This ensures admin dashboard and resort website have separate login sessions
const resortStorage = {
  getItem: (key) => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(`kina-resort-${key}`);
    }
    return null;
  },
  setItem: (key, value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`kina-resort-${key}`, value);
    }
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`kina-resort-${key}`);
    }
  }
};

// Create Supabase client with separate storage for resort website sessions
// This prevents session sharing between admin dashboard and resort website
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: resortStorage  // Use separate storage for resort website sessions
  }
});

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.tokenRefreshTimeout = null; // Track token refresh to prevent false SIGNED_OUT
    this.isInitializing = true; // Track if we're still initializing
    this.trackedUserId = null; // Track which user ID we're managing to prevent cross-logout
    this.isLoggingOut = false; // Flag to prevent SIGNED_OUT handler from interfering during logout
    this.init();
  }

  async init() {
    // NOTE: We do NOT clear admin sessions here because:
    // 1. Separate storage keys (kina-resort-* vs kina-admin-*) already provide isolation
    // 2. Each Supabase client uses its own storage, so sessions don't interfere
    // 3. Clearing admin sessions causes the cross-logout problem

    try {
      // First, try to restore from localStorage as a fallback
      // This helps with page refreshes and ensures we don't lose the session
      try {
        const storedUser = localStorage.getItem('kina-resort-user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Only restore if it's recent (within last 7 days)
          if (parsedUser.timestamp && (Date.now() - parsedUser.timestamp < 7 * 24 * 60 * 60 * 1000)) {
            this.currentUser = parsedUser.user;
            // Update header immediately so user sees they're logged in
            this.updateHeaderForLoggedInUser();
            setAuthState({ role: parsedUser.user.role || 'user', user: parsedUser.user });
          }
        }
      } catch (error) {
        console.warn('Error restoring user from localStorage:', error);
      }

      // Check if user is already logged in via Supabase
      // Use retry logic in case of temporary network issues
      let session = null;
      let retries = 3;
      
      while (retries > 0 && !session) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data.session) {
            session = data.session;
            break;
          }
          // If error, wait a bit and retry
          if (retries > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.warn('Error getting session, retrying...', error);
          if (retries > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        retries--;
      }

      if (session && session.user) {
        // Check if logged in user is admin - admins should only use admin dashboard
        let userToCheck = session.user;
        try {
          const { data: { user: freshUser }, error: getUserError } = await supabase.auth.getUser();
          if (!getUserError && freshUser) {
            userToCheck = freshUser;
          }
        } catch (error) {
          console.warn('Error getting fresh user, using session user:', error);
        }

        const metadata = userToCheck.user_metadata || {};
        const appMetadata = userToCheck.app_metadata || {};
        const role = metadata.role || appMetadata.role;
        
        if (role === 'admin') {
          // Admin logged in to resort website - sign them out
          console.warn('Admin account detected in resort website, signing out');
          await supabase.auth.signOut();
          this.currentUser = null;
          localStorage.removeItem('kina-resort-user');
          this.updateHeaderForLoggedOut();
          setAuthState({ role: 'guest', user: null });
          this.isInitializing = false;
          return;
        }
        
        await this.setCurrentUser(session.user);
        // Track the user ID we're managing
        this.trackedUserId = session.user.id;
      } else if (!this.currentUser) {
        // No session found and no cached user - user is logged out
        this.currentUser = null;
        this.trackedUserId = null;
        this.updateHeaderForLoggedOut();
        setAuthState({ role: 'guest', user: null });
      }
    } catch (error) {
      console.error('Error in auth init:', error);
      // On error, try to use cached user if available
      if (!this.currentUser) {
        this.currentUser = null;
        this.trackedUserId = null;
        this.updateHeaderForLoggedOut();
        setAuthState({ role: 'guest', user: null });
      }
    } finally {
      this.isInitializing = false;
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session ? 'has session' : 'no session');
      
      // CRITICAL: Verify this event is for our tracked session
      // This prevents cross-logout when admin/user operations trigger auth events
      if (session && session.user) {
        // If we have a tracked user, only process events for that user
        if (this.trackedUserId && session.user.id !== this.trackedUserId) {
          console.log('Ignoring auth state change for different user:', {
            event,
            ourUserId: this.trackedUserId,
            eventUserId: session.user.id
          });
          return; // This event is for a different user, ignore it
        }
        // Update tracked user ID when we get a new session
        this.trackedUserId = session.user.id;
      }
      
      if (event === 'SIGNED_IN' && session) {
        // Check if user is admin - admins should only use admin dashboard
        const metadata = session.user.user_metadata || {};
        const appMetadata = session.user.app_metadata || {};
        const role = metadata.role || appMetadata.role;
        
        if (role === 'admin') {
          // Admin trying to login to resort website - sign them out immediately
          console.warn('Admin account detected in resort website auth state change, signing out');
          supabase.auth.signOut();
          this.currentUser = null;
          this.trackedUserId = null;
          this.updateHeaderForLoggedOut();
          setAuthState({ role: 'guest', user: null });
          return;
        }
        
        // NOTE: We do NOT clear admin sessions here because:
        // 1. Separate storage keys (kina-resort-* vs kina-admin-*) already provide isolation
        // 2. Each Supabase client uses its own storage, so sessions don't interfere
        // 3. Clearing admin sessions causes the cross-logout problem
        
        this.setCurrentUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        // If we're in the middle of a logout, ignore this event - logout() handles everything
        if (this.isLoggingOut) {
          console.log('SIGNED_OUT event during logout - ignoring (logout() handles cleanup)');
          return;
        }
        
        // CRITICAL: When SIGNED_OUT fires, session is null, so we need to check our current session
        // Get the current session from our storage to verify if this event is for us
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        // If we still have a session, this SIGNED_OUT event is NOT for us - ignore it
        if (currentSession && currentSession.user) {
          // Check if it's our tracked user
          if (this.trackedUserId && currentSession.user.id === this.trackedUserId) {
            console.log('Ignoring SIGNED_OUT - we still have an active session for our tracked user');
            return; // This event is not for us, ignore it
          }
        }
        
        // If we don't have a session, verify this is actually for our tracked user
        if (this.trackedUserId) {
          // We had a tracked user, so this might be a real signout
          // But wait a bit to see if TOKEN_REFRESHED comes (token refresh pattern)
          // Clear any existing timeout
          if (this.tokenRefreshTimeout) {
            clearTimeout(this.tokenRefreshTimeout);
          }
          
          // Don't log out during initialization (page load/refresh)
          if (this.isInitializing) {
            console.log('SIGNED_OUT during initialization, ignoring (likely token refresh)');
            return;
          }
          
          // Wait 1000ms (1 second) to see if TOKEN_REFRESHED event comes (token refresh)
          // If no TOKEN_REFRESHED comes, then it's a real sign out
          this.tokenRefreshTimeout = setTimeout(async () => {
            // Double-check we still don't have a session
            const { data: { session: verifySession } } = await supabase.auth.getSession();
            if (!verifySession || !verifySession.user) {
              // No session - this is a real signout for our user
              this.trackedUserId = null;
              this.currentUser = null;
              localStorage.removeItem('kina-resort-user');
              this.updateHeaderForLoggedOut();
              setAuthState({ role: 'guest', user: null });
            } else if (verifySession.user.id === this.trackedUserId) {
              // Session restored - this was a false alarm (token refresh)
              console.log('Session restored after SIGNED_OUT - was token refresh');
              this.tokenRefreshTimeout = null;
              return;
            }
            this.tokenRefreshTimeout = null;
          }, 1000);
          return; // Don't process SIGNED_OUT immediately
        } else {
          // No tracked user - this event is definitely not for us
          console.log('Ignoring SIGNED_OUT - no tracked user');
          return;
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Clear the SIGNED_OUT timeout since we got a token refresh
        if (this.tokenRefreshTimeout) {
          clearTimeout(this.tokenRefreshTimeout);
          this.tokenRefreshTimeout = null;
        }
        // Token was refreshed - check role before updating
        if (session.user) {
          const metadata = session.user.user_metadata || {};
          const appMetadata = session.user.app_metadata || {};
          const role = metadata.role || appMetadata.role;
          
          if (role === 'admin') {
            // Admin token refreshed in resort website - sign them out
            console.warn('Admin account token refreshed in resort website, signing out');
            supabase.auth.signOut();
            this.currentUser = null;
            this.trackedUserId = null;
            this.updateHeaderForLoggedOut();
            setAuthState({ role: 'guest', user: null });
            return;
          }
          
          this.setCurrentUser(session.user);
          this.trackedUserId = session.user.id;
        }
      } else if (event === 'USER_UPDATED' && session) {
        // User data was updated - check role before refreshing
        if (session.user) {
          const metadata = session.user.user_metadata || {};
          const appMetadata = session.user.app_metadata || {};
          const role = metadata.role || appMetadata.role;
          
          if (role === 'admin') {
            // Admin user updated in resort website - sign them out
            console.warn('Admin account updated in resort website, signing out');
            supabase.auth.signOut();
            this.currentUser = null;
            this.trackedUserId = null;
            this.updateHeaderForLoggedOut();
            setAuthState({ role: 'guest', user: null });
            return;
          }
          
          this.setCurrentUser(session.user);
          this.trackedUserId = session.user.id;
        }
      }
    });
  }

  async setCurrentUser(user) {
    // Always refresh user data from Supabase to get the latest metadata (including role)
    // This prevents stale role data from being used
    try {
      const { data: { user: freshUser }, error } = await supabase.auth.getUser();
      if (!error && freshUser) {
        user = freshUser; // Use fresh user data with latest metadata
      }
    } catch (error) {
      console.warn('Could not refresh user data, using provided user:', error);
      // Continue with provided user if refresh fails
    }
    
    // Extract user metadata - check both user_metadata and app_metadata for role
    const metadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};
    
    // Role can be in user_metadata or app_metadata, prefer user_metadata
    const role = metadata.role || appMetadata.role || 'user';
    
    // CRITICAL: If user is admin, sign them out immediately - admins should only use admin dashboard
    if (role === 'admin') {
      console.warn('Admin account detected in setCurrentUser, signing out from resort website');
      await supabase.auth.signOut();
      this.currentUser = null;
      this.trackedUserId = null;
      localStorage.removeItem('kina-resort-user');
      this.updateHeaderForLoggedOut();
      setAuthState({ role: 'guest', user: null });
      return;
    }
    
    // Track the user ID we're managing
    this.trackedUserId = user.id;
    
    this.currentUser = {
      id: user.id,
      email: user.email,
      firstName: metadata.first_name || user.email?.split('@')[0] || 'User',
      lastName: metadata.last_name || '',
      memberSince: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      loyaltyPoints: metadata.loyaltyPoints || 0,
      totalBookings: metadata.totalBookings || 0,
      role: role
    };
    
    // Save to localStorage for persistence across page refreshes
    try {
      localStorage.setItem('kina-resort-user', JSON.stringify({
        user: this.currentUser,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Error saving user to localStorage:', error);
    }
    
    // Update state with the correct role
    setAuthState({ 
      role: role, 
      user: this.currentUser 
    });
    
    this.updateHeaderForLoggedInUser();
  }

  async login(email, password) {
    try {
      // NOTE: We do NOT clear admin sessions here because:
      // 1. Separate storage keys (kina-resort-* vs kina-admin-*) already provide isolation
      // 2. Each Supabase client uses its own storage, so sessions don't interfere
      // 3. Clearing admin sessions causes the cross-logout problem

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        // Check if user is admin - admins should only use admin dashboard
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        const userToCheck = freshUser || data.user;
        const metadata = userToCheck.user_metadata || {};
        const appMetadata = userToCheck.app_metadata || {};
        const role = metadata.role || appMetadata.role;
        
        if (role === 'admin') {
          // Admin trying to login to resort website - sign them out
          await supabase.auth.signOut();
          return { 
            success: false, 
            message: 'Admin accounts can only access the admin dashboard. Please use the admin dashboard URL to log in.' 
          };
        }
        
        // Always refresh user data to get latest role from Supabase
        await this.setCurrentUser(data.user);
        return { success: true, user: this.currentUser };
      }

      return { success: false, message: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  }

  async register(userData) {
    try {
      // Check if user already exists by trying to sign in first
      // This prevents accidentally overwriting existing user roles
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession?.user?.email?.toLowerCase() === userData.email.toLowerCase()) {
        return { success: false, message: 'You are already logged in. Please logout first to create a new account.' };
      }

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            // Only set role to 'user' for new registrations
            // This will NOT overwrite existing admin roles because signUp creates a new user
            role: 'user',
            loyaltyPoints: 0,
            totalBookings: 0
          }
        }
      });

      if (error) {
        // Check if user already exists
        if (error.message.includes('already registered') || 
            error.message.includes('already exists') ||
            error.message.includes('User already registered')) {
          return { success: false, message: 'An account with this email already exists. Please login instead.' };
        }
        return { success: false, message: error.message };
      }

      if (data.user) {
        // Refresh user data to get the actual role from Supabase
        await this.setCurrentUser(data.user);
        return { success: true, user: this.currentUser };
      }

      return { success: false, message: 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  }

  async logout() {
    console.log('Logout function called');
    
    // Set flag to prevent SIGNED_OUT handler from interfering
    this.isLoggingOut = true;
    
    try {
      // STEP 1: Remove Facebook iframe that causes unload violations
      const facebookIframe = document.querySelector('iframe[src*="facebook.com"]');
      if (facebookIframe) {
        console.log('Removing Facebook iframe to prevent unload violations...');
        facebookIframe.remove();
      }
      
      // STEP 2: Cleanup app resources (animations, smooth scroll) synchronously
      if (typeof window.cleanupAppResources === 'function') {
        console.log('Cleaning up app resources...');
        try {
          window.cleanupAppResources();
        } catch (e) {
          console.warn('Error during cleanup:', e);
        }
      }
      
      // STEP 3: Clear all timeouts immediately
      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
        this.tokenRefreshTimeout = null;
      }
      
      // STEP 4: Clear local state FIRST (synchronously)
      this.currentUser = null;
      this.trackedUserId = null;
      localStorage.removeItem('kina_user');
      localStorage.removeItem('kina-resort-user');
      
      // Clear all resort storage keys
      if (typeof window !== 'undefined') {
        const resortKeys = Object.keys(localStorage).filter(key => key.startsWith('kina-resort-'));
        resortKeys.forEach(key => localStorage.removeItem(key));
      }
      console.log('Local storage cleared');
      
      // STEP 5: Update UI state synchronously
      setAuthState({ role: 'guest', user: null });
      try {
        this.updateHeaderForLoggedOut();
      } catch (e) {
        console.warn('Error updating header:', e);
      }
      
      // STEP 6: Sign out from Supabase (async, but we won't wait for it to complete)
      console.log('Signing out from Supabase...');
      // Fire and forget - don't await to prevent blocking
      supabase.auth.signOut().catch(err => {
        console.warn('Supabase signOut error (non-critical):', err);
      });
      
      // STEP 7: Force hard navigation using window.location.href
      // This bypasses unload event handlers and is the most reliable method
      console.log('Forcing hard navigation to home page...');
      
      // Use requestAnimationFrame to ensure DOM updates complete first
      requestAnimationFrame(() => {
        // Use setTimeout to ensure all synchronous code completes
        setTimeout(() => {
          const baseUrl = window.location.origin + window.location.pathname;
          const targetUrl = baseUrl + '#/';
          
          // Use window.location.replace() to prevent back button issues
          // This is more aggressive than href and bypasses unload handlers
          console.log('Navigating to:', targetUrl);
          window.location.replace(targetUrl);
        }, 50);
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even on error, clear everything and force navigation
      this.currentUser = null;
      this.trackedUserId = null;
      localStorage.removeItem('kina-resort-user');
      setAuthState({ role: 'guest', user: null });
      
      // Force navigation regardless of errors
      requestAnimationFrame(() => {
        setTimeout(() => {
          const baseUrl = window.location.origin + window.location.pathname;
          window.location.replace(baseUrl + '#/');
        }, 50);
      });
    }
  }

  isLoggedIn() {
    // Check both currentUser and session to handle initialization period
    if (this.currentUser !== null) {
      return true;
    }
    
    // During initialization, check session directly
    // This prevents false "not logged in" during page refresh
    if (this.isInitializing) {
      // Return true optimistically - init() will set currentUser if session exists
      // This prevents UI flickering during page load
      return true;
    }
    
    // If not initializing and no currentUser, check session one more time
    // This handles cases where currentUser might be null but session exists
    try {
      // Use synchronous check if possible, but this is async so we return false
      // The session check will happen in init() or on next operation
      return false;
    } catch (error) {
      return false;
    }
  }
  
  // Helper method to check session synchronously (for immediate checks)
  async checkSessionAsync() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        // If we have a session but no currentUser, restore it
        if (!this.currentUser) {
          const metadata = session.user.user_metadata || {};
          const appMetadata = session.user.app_metadata || {};
          const role = metadata.role || appMetadata.role;
          
          if (role !== 'admin') {
            await this.setCurrentUser(session.user);
          }
        }
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error checking session:', error);
      return this.currentUser !== null; // Fallback to currentUser
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  updateHeaderForLoggedInUser() {
    const loginLink = document.querySelector('a[href="#/auth"]');
    if (loginLink && this.currentUser) {
      loginLink.innerHTML = `
        <div class="user-menu" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: white;">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="user-name" style="color: white; font-weight: 600;">${this.currentUser.firstName}</span>
        </div>
      `;
      
      // Add click handler to show logout popup
      const userMenu = loginLink.querySelector('.user-menu');
      if (userMenu) {
        userMenu.onclick = (e) => {
          e.preventDefault();
          this.showLogoutPopup();
        };
      }
    }
    
    // Show bookings tab when user is logged in
    const bookingsLink = document.querySelector('a[href="#/bookings"]');
    if (bookingsLink) {
      const bookingsListItem = bookingsLink.closest('li[role="none"]');
      if (bookingsListItem) {
        bookingsListItem.hidden = false;
      }
    }
  }

  showLogoutPopup() {
    const modalContent = `
      <div style="padding: 24px; text-align: center;" onclick="event.stopPropagation();">
        <h3 style="margin: 0 0 16px 0; color: var(--color-text);">User Menu</h3>
        <p style="margin: 0 0 24px 0; color: var(--color-muted);">Hello, ${this.currentUser.firstName}!</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button 
            onclick="event.stopPropagation(); event.preventDefault(); window.handleKinaLogout(); return false;"
            class="btn primary" 
            style="padding: 10px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; background: var(--color-accent); color: white;"
          >
            Logout
          </button>
          <button 
            onclick="event.stopPropagation(); event.preventDefault(); window.handleKinaCancel(); return false;"
            class="btn" 
            style="padding: 10px 24px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; font-weight: 600; background: white; color: var(--color-text);"
          >
            Cancel
          </button>
        </div>
      </div>
    `;
    openModal(modalContent);
  }

  updateHeaderForLoggedOut() {
    const loginLink = document.querySelector('a[href="#/auth"]');
    if (loginLink) {
      loginLink.innerHTML = 'Login';
      loginLink.onclick = null;
      // Remove any user menu click handlers
      loginLink.removeAttribute('onclick');
    }
    
    // Hide bookings tab when user is logged out
    const bookingsLink = document.querySelector('a[href="#/bookings"]');
    if (bookingsLink) {
      const bookingsListItem = bookingsLink.closest('li[role="none"]');
      if (bookingsListItem) {
        bookingsListItem.hidden = true;
      }
    }
    
    // Call renderHeader if available to ensure header is updated
    if (typeof window !== 'undefined' && window.renderHeader) {
      window.renderHeader();
    }
  }
}

// Create global auth instance
window.kinaAuth = new AuthManager();

// Global logout handler - simple and reliable
window.handleKinaLogout = async function() {
  console.log('handleKinaLogout called');
  
  // Remove modal immediately
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
  }
  
  // Call logout - don't await since it handles navigation internally
  if (window.kinaAuth) {
    console.log('Calling kinaAuth.logout()');
    // Fire and forget - logout() handles navigation internally
    window.kinaAuth.logout().catch(err => {
      console.error('Logout error in handleKinaLogout:', err);
      // Even if logout fails, try to navigate
      const baseUrl = window.location.origin + window.location.pathname;
      window.location.replace(baseUrl + '#/');
    });
  } else {
    console.error('window.kinaAuth not found');
    // Fallback navigation if auth is not available
    const baseUrl = window.location.origin + window.location.pathname;
    window.location.replace(baseUrl + '#/');
  }
};

// Global cancel handler
window.handleKinaCancel = function() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
  }
};

// Export for use in other modules
export { AuthManager };
