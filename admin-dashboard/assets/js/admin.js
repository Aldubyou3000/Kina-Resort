// Admin Dashboard Router
import { OverviewPage } from './pages/overview.js';
import { BookingsPage, initBookingsPage } from './pages/bookings.js';
import { FacilitiesPage } from './pages/facilities.js';
import { CalendarPage, initCalendarPage } from './pages/calendar.js';
import { AuditLogsPage } from './pages/audit-logs.js';
import { adminAuth } from './utils/adminAuth.js';

const pages = {
  overview: OverviewPage,
  bookings: BookingsPage,
  facilities: FacilitiesPage,
  calendar: CalendarPage,
  'audit-logs': AuditLogsPage,
};

const pageInitializers = {
  calendar: initCalendarPage,
  bookings: initBookingsPage,
};

let currentPage = 'overview';

// Initialize navigation
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const contentArea = document.getElementById('admin-content');
  const pageTitle = document.querySelector('.page-title');

  // Add logout button to header
  const headerActions = document.querySelector('.header-actions');
  if (headerActions && !headerActions.querySelector('.logout-button')) {
    const admin = adminAuth.getCurrentAdmin();
    const logoutButton = document.createElement('button');
    logoutButton.className = 'logout-button';
    logoutButton.innerHTML = `
      <span>${admin?.email || 'Admin'}</span>
      <span>Logout</span>
    `;
    logoutButton.addEventListener('click', async () => {
      if (confirm('Are you sure you want to logout?')) {
        await adminAuth.logout();
        window.location.reload();
      }
    });
    headerActions.innerHTML = '';
    headerActions.appendChild(logoutButton);
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');

      // Update active state
      navLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');

      // Load page (loadPage will update the hash)
      loadPage(page);
    });
  });

  // Handle hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    const validPages = Object.keys(pages);
    const pageToLoad = hash && validPages.includes(hash) ? hash : 'overview';
    
    // Update active nav link
    navLinks.forEach((l) => {
      if (l.getAttribute('data-page') === pageToLoad) {
        l.classList.add('active');
      } else {
        l.classList.remove('active');
      }
    });
    
    loadPage(pageToLoad);
  });

  // Load initial page - always default to overview if no valid hash
  const hash = window.location.hash.slice(1);
  const validPages = Object.keys(pages);
  const initialPage = hash && validPages.includes(hash) ? hash : 'overview';
  
  // Update active nav link
  navLinks.forEach((l) => {
    if (l.getAttribute('data-page') === initialPage) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });
  
  loadPage(initialPage);
}

// Load page content
async function loadPage(pageName) {
  const contentArea = document.getElementById('admin-content');
  const pageTitle = document.querySelector('.page-title');
  const pageFunction = pages[pageName];

  if (!pageFunction) {
    contentArea.innerHTML = '<div class="error-message">Page not found</div>';
    return;
  }

  currentPage = pageName;
  contentArea.innerHTML = '<div class="loading-placeholder">Loading...</div>';

  try {
    const content = await pageFunction();
    contentArea.innerHTML = content;

    // Update page title
    const titles = {
      overview: 'Overview',
      bookings: 'Bookings',
      facilities: 'Facilities',
      calendar: 'Calendar',
      'audit-logs': 'Audit Logs',
    };
    pageTitle.textContent = titles[pageName] || 'Admin Dashboard';

    // Update URL hash
    window.location.hash = pageName;

    // Initialize page-specific functionality
    if (pageInitializers[pageName]) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        pageInitializers[pageName]();
      }, 0);
    }
  } catch (error) {
    console.error('Error loading page:', error);
    contentArea.innerHTML =
      '<div class="error-message">Error loading page. Please try again.</div>';
  }
}

// Show dashboard (after login)
function showDashboard() {
  // Clear the login form and show the dashboard layout
  document.body.innerHTML = `
    <div class="admin-layout">
      <!-- Sidebar Navigation -->
      <aside class="admin-sidebar" aria-label="Admin navigation">
        <div class="sidebar-header">
          <img
            src="../images/kina-logo1.png"
            alt="Kina Resort logo"
            class="sidebar-logo"
          />
          <h1 class="sidebar-title">Admin Dashboard</h1>
        </div>
        <nav class="sidebar-nav" role="navigation">
          <ul class="nav-list">
            <li>
              <a href="#overview" class="nav-link active" data-page="overview">
                <span class="nav-icon">📊</span>
                <span>Overview</span>
              </a>
            </li>
            <li>
              <a href="#bookings" class="nav-link" data-page="bookings">
                <span class="nav-icon">📅</span>
                <span>Bookings</span>
              </a>
            </li>
            <li>
              <a href="#facilities" class="nav-link" data-page="facilities">
                <span class="nav-icon">🏨</span>
                <span>Facilities</span>
              </a>
            </li>
            <li>
              <a href="#calendar" class="nav-link" data-page="calendar">
                <span class="nav-icon">📆</span>
                <span>Calendar</span>
              </a>
            </li>
            <li>
              <a href="#audit-logs" class="nav-link" data-page="audit-logs">
                <span class="nav-icon">📋</span>
                <span>Audit Logs</span>
              </a>
            </li>
          </ul>
        </nav>
        <div class="sidebar-footer">
          <a href="../index.html" class="back-link">← Back to Website</a>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="admin-main" id="admin-main">
        <header class="admin-header">
          <h2 class="page-title">Overview</h2>
          <div class="header-actions">
            <span class="user-info">Admin User</span>
          </div>
        </header>

        <div class="admin-content" id="admin-content">
          <!-- Content will be loaded here by JavaScript -->
          <div class="loading-placeholder">Loading...</div>
        </div>
      </main>
    </div>
  `;
  
  // Always start on overview page after login
  window.location.hash = 'overview';
  
  // Initialize navigation
  initNavigation();
}

// Show login form
function showLoginForm() {
  const body = document.body;
  body.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <img
            src="../images/kina-logo1.png"
            alt="Kina Resort logo"
            class="login-logo"
          />
          <h1 class="login-title">Admin Dashboard</h1>
          <p class="login-subtitle">Sign in to access the admin panel</p>
        </div>
        <form id="admin-login-form" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              autocomplete="email"
              placeholder="admin@example.com"
            />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <div style="position: relative; width: 100%;">
              <input
                type="password"
                id="password"
                name="password"
                required
                autocomplete="current-password"
                placeholder="Enter your password"
                style="width: 100%; padding-right: 45px; box-sizing: border-box;"
              />
              <button
                type="button"
                id="password-toggle"
                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; padding: 8px; color: #666; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 4px; transition: background-color 0.2s;"
                aria-label="Toggle password visibility"
                onmouseover="this.style.backgroundColor='rgba(0,0,0,0.05)'"
                onmouseout="this.style.backgroundColor='transparent'"
              >
                <svg id="password-eye" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
          <div id="login-error" class="error-message" style="display: none;"></div>
          <button type="submit" class="login-button">
            Sign In
          </button>
        </form>
      </div>
    </div>
  `;

  // Handle form submission
  const form = document.getElementById('admin-login-form');
  form.addEventListener('submit', handleLogin);
  
  // Handle password toggle
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('password-toggle');
  const passwordEye = document.getElementById('password-eye');
  
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      
      // Update icon
      if (passwordEye) {
        if (isPassword) {
          // Show eye-off icon
          passwordEye.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          `;
        } else {
          // Show eye icon
          passwordEye.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          `;
        }
      }
    });
  }
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('#email').value.trim();
  const password = form.querySelector('#password').value.trim();
  const errorDiv = document.getElementById('login-error');

  // Clear previous errors
  errorDiv.style.display = 'none';
  errorDiv.textContent = '';

  if (!email || !password) {
    errorDiv.textContent = 'Please fill in all fields';
    errorDiv.style.display = 'block';
    return;
  }

  // Disable button during login
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Signing in...';

  try {
    const result = await adminAuth.login(email, password);
    
    if (result.success) {
      // Show dashboard immediately without reload
      showDashboard();
    } else {
      errorDiv.textContent = result.message || 'Invalid email or password';
      errorDiv.style.display = 'block';
      submitButton.disabled = false;
      submitButton.textContent = 'Sign In';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = 'An error occurred. Please try again.';
    errorDiv.style.display = 'block';
    submitButton.disabled = false;
    submitButton.textContent = 'Sign In';
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  // Check if admin is authenticated
  const isAuthenticated = await adminAuth.checkSession();
  
  if (!isAuthenticated) {
    showLoginForm();
  } else {
    // Always start on overview page when authenticated
    window.location.hash = 'overview';
    initNavigation();
  }
});

