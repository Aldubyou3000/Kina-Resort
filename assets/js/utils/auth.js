// Simple authentication system for testing
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('kina_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.updateHeaderForLoggedInUser();
    }
  }

  // Test credentials for development
  getTestUsers() {
    return [
      {
        id: 'test1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'password123',
        memberSince: '2024-01-15',
        loyaltyPoints: 1250,
        totalBookings: 3
      },
      {
        id: 'test2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        password: 'password123',
        memberSince: '2024-03-20',
        loyaltyPoints: 850,
        totalBookings: 2
      }
    ];
  }

  login(email, password) {
    const users = this.getTestUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Remove password from stored user data
      const { password, ...userData } = user;
      this.currentUser = userData;
      localStorage.setItem('kina_user', JSON.stringify(userData));
      this.updateHeaderForLoggedInUser();
      return { success: true, user: userData };
    }
    
    return { success: false, message: 'Invalid email or password' };
  }

  register(userData) {
    // Check if email already exists
    const users = this.getTestUsers();
    const existingUser = users.find(u => u.email === userData.email);
    
    if (existingUser) {
      return { success: false, message: 'Email already registered' };
    }

    // Create new user
    const newUser = {
      id: 'user_' + Date.now(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      memberSince: new Date().toISOString().split('T')[0],
      loyaltyPoints: 0,
      totalBookings: 0
    };

    // Store in localStorage for this session
    const { password, ...userDataToStore } = newUser;
    this.currentUser = userDataToStore;
    localStorage.setItem('kina_user', JSON.stringify(userDataToStore));
    this.updateHeaderForLoggedInUser();
    
    return { success: true, user: userDataToStore };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('kina_user');
    this.updateHeaderForLoggedOut();
    location.hash = '#/';
  }

  isLoggedIn() {
    return this.currentUser !== null;
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
      
      // Add click handler to navigate to dashboard
      const userMenu = loginLink.querySelector('.user-menu');
      if (userMenu) {
        userMenu.onclick = (e) => {
          e.preventDefault();
          location.hash = '#/dashboard';
        };
      }
    }
  }

  updateHeaderForLoggedOut() {
    const loginLink = document.querySelector('a[href="#/auth"]');
    if (loginLink) {
      loginLink.innerHTML = 'Login';
      loginLink.onclick = null;
    }
  }
}

// Create global auth instance
window.kinaAuth = new AuthManager();

// Export for use in other modules
export { AuthManager };
