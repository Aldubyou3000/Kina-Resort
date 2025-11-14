// Admin Authentication using Supabase
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../../assets/js/config/supabaseConfig.js';

// Create custom storage for admin sessions (separate from resort website)
// This ensures admin dashboard and resort website have separate login sessions
const adminStorage = {
  getItem: (key) => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(`kina-admin-${key}`);
    }
    return null;
  },
  setItem: (key, value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`kina-admin-${key}`, value);
    }
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`kina-admin-${key}`);
    }
  }
};

// Create Supabase client with separate storage for admin sessions
// This prevents session sharing between admin dashboard and resort website
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: adminStorage  // Use separate storage for admin sessions
  }
});

class AdminAuth {
  constructor() {
    this.currentAdmin = null;
    this.trackedAdminId = null; // Track which admin ID we're managing to prevent cross-logout
    this.tokenRefreshTimeout = null; // Track token refresh to prevent false SIGNED_OUT
    this.init();
  }

  async init() {
    // NOTE: We do NOT clear resort sessions here because:
    // 1. Separate storage keys (kina-admin-* vs kina-resort-*) already provide isolation
    // 2. Each Supabase client uses its own storage, so sessions don't interfere
    // 3. Clearing resort sessions causes the cross-logout problem

    // First, try to restore from localStorage
    try {
      const storedSession = localStorage.getItem('admin_session');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed.user) {
          const metadata = parsed.user.user_metadata || {};
          const appMetadata = parsed.user.app_metadata || {};
          const role = metadata.role || appMetadata.role;
          if (role === 'admin') {
            this.currentAdmin = parsed.user;
            // Continue to verify with Supabase, but we have a fallback
          }
        }
      }
    } catch (error) {
      console.warn('Error restoring session from localStorage in init:', error);
    }

    // Check if admin is already logged in
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session || !session.user) {
        // Only clear if we don't have a cached admin from localStorage
        // This prevents logout on transient session errors
        if (!this.currentAdmin) {
          this.currentAdmin = null;
        }
        return;
      }

      // Try to get fresh user data, but don't fail if it errors
      let freshUser = null;
      try {
        const { data: { user }, error: getUserError } = await supabase.auth.getUser();
        if (!getUserError && user) {
          freshUser = user;
        }
      } catch (error) {
        console.warn('Error refreshing user data in init, using session user:', error);
        // Continue with session.user if getUser fails
      }

      const userToCheck = freshUser || session.user;
      const metadata = userToCheck.user_metadata || {};
      const appMetadata = userToCheck.app_metadata || {};
      const role = metadata.role || appMetadata.role;
      
      if (role === 'admin') {
        this.currentAdmin = userToCheck;
        this.trackedAdminId = userToCheck.id; // Track the admin ID we're managing
        // Save to localStorage for persistence
        try {
          localStorage.setItem('admin_session', JSON.stringify({
            user: userToCheck,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn('Error saving session to localStorage in init:', error);
        }
      } else if (role !== undefined && role !== null) {
        // Role is explicitly set and it's not admin - sign out
        console.warn('User does not have admin role, signing out');
        await supabase.auth.signOut();
        this.currentAdmin = null;
        this.trackedAdminId = null;
      } else {
        // Role is undefined/null - might be a metadata issue
        // Use session user and assume it's valid (will be checked again in checkSession)
        this.currentAdmin = session.user;
      }
    } catch (error) {
      console.error('Error in init:', error);
      // Don't clear currentAdmin on init errors - might be a transient issue
    }

    // Listen for auth state changes (especially token refresh)
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Admin auth state change:', event, session ? 'has session' : 'no session');
      
      // CRITICAL: Verify this event is for our tracked session
      // This prevents cross-logout when user/admin operations trigger auth events
      if (session && session.user) {
        // If we have a tracked admin, only process events for that admin
        if (this.trackedAdminId && session.user.id !== this.trackedAdminId) {
          console.log('Ignoring auth state change for different admin:', {
            event,
            ourAdminId: this.trackedAdminId,
            eventAdminId: session.user.id
          });
          return; // This event is for a different admin, ignore it
        }
        // Update tracked admin ID when we get a new session
        this.trackedAdminId = session.user.id;
      }
      
      if (event === 'SIGNED_IN' && session) {
        // Verify admin role first - only admins can access admin dashboard
        const metadata = session.user.user_metadata || {};
        const appMetadata = session.user.app_metadata || {};
        const role = metadata.role || appMetadata.role;
        
        if (role !== 'admin') {
          // Not an admin - sign them out immediately
          console.warn('Non-admin user detected in admin dashboard, signing out');
          supabase.auth.signOut();
          this.currentAdmin = null;
          this.trackedAdminId = null;
          localStorage.removeItem('admin_session');
          return;
        }
        
        // NOTE: We do NOT clear resort sessions here because:
        // 1. Separate storage keys (kina-admin-* vs kina-resort-*) already provide isolation
        // 2. Each Supabase client uses its own storage, so sessions don't interfere
        // 3. Clearing resort sessions causes the cross-logout problem
        
        // Set current admin
        this.currentAdmin = session.user;
        this.trackedAdminId = session.user.id;
        // Save to localStorage
        try {
          localStorage.setItem('admin_session', JSON.stringify({
            user: session.user,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn('Error saving session to localStorage:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        // CRITICAL: When SIGNED_OUT fires, session is null, so we need to check our current session
        // Get the current session from our storage to verify if this event is for us
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        // If we still have a session, this SIGNED_OUT event is NOT for us - ignore it
        if (currentSession && currentSession.user) {
          // Check if it's our tracked admin
          if (this.trackedAdminId && currentSession.user.id === this.trackedAdminId) {
            console.log('Ignoring SIGNED_OUT - admin still has active session for tracked admin');
            return; // This event is not for us, ignore it
          }
        }
        
        // If we don't have a session, verify this is actually for our tracked admin
        if (this.trackedAdminId) {
          // We had a tracked admin, so this might be a real signout
          // But wait a bit to see if TOKEN_REFRESHED comes (token refresh pattern)
          // Clear any existing timeout
          if (this.tokenRefreshTimeout) {
            clearTimeout(this.tokenRefreshTimeout);
          }
          
          // Wait 1000ms (1 second) to see if TOKEN_REFRESHED event comes (token refresh)
          // If no TOKEN_REFRESHED comes, then it's a real sign out
          this.tokenRefreshTimeout = setTimeout(async () => {
            // Double-check we still don't have a session
            const { data: { session: verifySession } } = await supabase.auth.getSession();
            if (!verifySession || !verifySession.user) {
              // No session - this is a real signout for our admin
              this.trackedAdminId = null;
              this.currentAdmin = null;
              localStorage.removeItem('admin_session');
            } else if (verifySession.user.id === this.trackedAdminId) {
              // Session restored - this was a false alarm (token refresh)
              console.log('Admin session restored after SIGNED_OUT - was token refresh');
              this.tokenRefreshTimeout = null;
              return;
            }
            this.tokenRefreshTimeout = null;
          }, 1000);
          return; // Don't process SIGNED_OUT immediately
        } else {
          // No tracked admin - this event is definitely not for us
          console.log('Ignoring SIGNED_OUT - no tracked admin');
          return;
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token was refreshed - verify admin role before updating
        if (session.user) {
          const metadata = session.user.user_metadata || {};
          const appMetadata = session.user.app_metadata || {};
          const role = metadata.role || appMetadata.role;
          
          if (role !== 'admin') {
            // Not an admin - sign them out
            console.warn('Non-admin token refreshed in admin dashboard, signing out');
            supabase.auth.signOut();
            this.currentAdmin = null;
            this.trackedAdminId = null;
            localStorage.removeItem('admin_session');
            return;
          }
          
          // Clear the SIGNED_OUT timeout since we got a token refresh
          if (this.tokenRefreshTimeout) {
            clearTimeout(this.tokenRefreshTimeout);
            this.tokenRefreshTimeout = null;
          }
          
          this.currentAdmin = session.user;
          this.trackedAdminId = session.user.id;
          // Update localStorage
          try {
            localStorage.setItem('admin_session', JSON.stringify({
              user: session.user,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.warn('Error saving session to localStorage:', error);
          }
        }
      } else if (event === 'USER_UPDATED' && session) {
        // User data was updated - verify admin role before refreshing
        if (session.user) {
          const metadata = session.user.user_metadata || {};
          const appMetadata = session.user.app_metadata || {};
          const role = metadata.role || appMetadata.role;
          
          if (role !== 'admin') {
            // Not an admin - sign them out
            console.warn('Non-admin user updated in admin dashboard, signing out');
            supabase.auth.signOut();
            this.currentAdmin = null;
            this.trackedAdminId = null;
            localStorage.removeItem('admin_session');
            return;
          }
          
          this.currentAdmin = session.user;
          this.trackedAdminId = session.user.id;
          try {
            localStorage.setItem('admin_session', JSON.stringify({
              user: session.user,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.warn('Error saving session to localStorage:', error);
          }
        }
      }
    });
  }

  async login(email, password) {
    try {
      // NOTE: We do NOT clear resort sessions here because:
      // 1. Separate storage keys (kina-admin-* vs kina-resort-*) already provide isolation
      // 2. Each Supabase client uses its own storage, so sessions don't interfere
      // 3. Clearing resort sessions causes the cross-logout problem

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        // Always refresh user data to get latest role from Supabase
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        const userToUse = freshUser || data.user;
        
        // Verify the user has admin role (only admins can access admin dashboard)
        const metadata = userToUse.user_metadata || {};
        const appMetadata = userToUse.app_metadata || {};
        const role = metadata.role || appMetadata.role;
        
        if (role !== 'admin') {
          // Not an admin, sign out immediately
          await supabase.auth.signOut();
          this.trackedAdminId = null;
          return { success: false, message: 'Access denied. Admin privileges required. Only admin accounts can access the admin dashboard.' };
        }
        
        this.currentAdmin = userToUse;
        this.trackedAdminId = userToUse.id;
        // Store session in localStorage for persistence
        localStorage.setItem('admin_session', JSON.stringify({
          user: userToUse,
          access_token: data.session.access_token
        }));
        return { success: true, user: userToUse };
      }

      return { success: false, message: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  }

  async logout() {
    try {
      // Clear timeout if exists
      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
        this.tokenRefreshTimeout = null;
      }
      
      await supabase.auth.signOut();
      this.currentAdmin = null;
      this.trackedAdminId = null;
      localStorage.removeItem('admin_session');
      // Clear all admin storage keys
      if (typeof window !== 'undefined') {
        const adminKeys = Object.keys(localStorage).filter(key => key.startsWith('kina-admin-'));
        adminKeys.forEach(key => localStorage.removeItem(key));
      }
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      this.currentAdmin = null;
      this.trackedAdminId = null;
      return { success: false, message: 'Error during logout' };
    }
  }

  isAuthenticated() {
    return this.currentAdmin !== null;
  }

  getCurrentAdmin() {
    return this.currentAdmin;
  }

  async checkSession() {
    try {
      // First, try to restore from localStorage if we don't have currentAdmin
      if (!this.currentAdmin) {
        try {
          const storedSession = localStorage.getItem('admin_session');
          if (storedSession) {
            const parsed = JSON.parse(storedSession);
            if (parsed.user) {
              // Verify the stored user has admin role
              const metadata = parsed.user.user_metadata || {};
              const appMetadata = parsed.user.app_metadata || {};
              const role = metadata.role || appMetadata.role;
              if (role === 'admin') {
                this.currentAdmin = parsed.user;
              }
            }
          }
        } catch (error) {
          console.warn('Error restoring session from localStorage:', error);
        }
      }
      
      // Get session with error handling
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // If no session or session error, check if we have cached admin
      if (sessionError || !session || !session.user) {
        // If we have a cached admin, keep it (session might be temporarily unavailable)
        if (this.currentAdmin) {
          // Verify cached admin still has admin role
          const metadata = this.currentAdmin.user_metadata || {};
          const appMetadata = this.currentAdmin.app_metadata || {};
          const role = metadata.role || appMetadata.role;
          if (role === 'admin') {
            return true; // Keep admin logged in even if session check fails
          }
        }
        // Only clear if we're certain there's no valid session and no cached admin
        if (!session) {
          this.currentAdmin = null;
        }
        return this.currentAdmin !== null;
      }

      // Try to refresh user data, but don't fail if it errors
      let freshUser = null;
      let getUserError = null;
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
          freshUser = user;
        } else {
          getUserError = error;
        }
      } catch (error) {
        console.warn('Error refreshing user data in checkSession, using session user:', error);
        getUserError = error;
        // Continue with session.user if getUser fails
      }

      // Use fresh user if available, otherwise fall back to session user
      const userToCheck = freshUser || session.user;
      
      // Extract role from user metadata
      const metadata = userToCheck.user_metadata || {};
      const appMetadata = userToCheck.app_metadata || {};
      const role = metadata.role || appMetadata.role;
      
      // Verify admin role (only admins can access admin dashboard)
      if (role === 'admin') {
        // Update currentAdmin with the user we're checking
        this.currentAdmin = userToCheck;
        this.trackedAdminId = userToCheck.id;
        // Save to localStorage for persistence across page reloads
        try {
          localStorage.setItem('admin_session', JSON.stringify({
            user: userToCheck,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn('Error saving session to localStorage:', error);
        }
        return true;
      } else if (role !== undefined && role !== null) {
        // Role is explicitly set and it's not admin - sign out immediately
        console.warn('Non-admin user detected in checkSession, signing out');
        await supabase.auth.signOut();
        this.currentAdmin = null;
        this.trackedAdminId = null;
        localStorage.removeItem('admin_session');
        return false;
      } else {
        // Role is undefined/null - might be a metadata issue
        // If we have a cached admin with admin role, keep it
        // Otherwise, reject - we can't verify admin status
        if (this.currentAdmin) {
          const cachedMetadata = this.currentAdmin.user_metadata || {};
          const cachedAppMetadata = this.currentAdmin.app_metadata || {};
          const cachedRole = cachedMetadata.role || cachedAppMetadata.role;
          if (cachedRole === 'admin') {
            // Keep cached admin if it was admin
            return true;
          }
        }
        // If no role found and no cached admin, reject - can't verify admin status
        console.warn('Cannot verify admin role in checkSession, signing out');
        await supabase.auth.signOut();
        this.currentAdmin = null;
        this.trackedAdminId = null;
        localStorage.removeItem('admin_session');
        return false;
      }
    } catch (error) {
      console.error('Unexpected error in checkSession:', error);
      // On unexpected errors, don't sign out - session might still be valid
      // Return true if we have a cached admin, false otherwise
      return this.currentAdmin !== null;
    }
  }
}

// Create global admin auth instance
export const adminAuth = new AdminAuth();

