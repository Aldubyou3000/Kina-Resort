// Import admin database utilities (uses admin Supabase client)
import { getAllBookings, getBookingById, updateBookingStatus, cancelBooking, deleteBooking, createWalkInBooking } from '../utils/adminDatabase.js';

// Format services for display (from database booking_services)
function formatServices(services) {
  if (!services || !Array.isArray(services) || services.length === 0) {
    return 'No services';
  }
  return services.map(s => `${s.service_name} (x${s.quantity})`).join(' • ');
}

// Format date for display (YYYY-MM-DD to readable format)
function formatDisplayDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr + 'T00:00:00');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Transform database booking to display format
function transformBooking(booking) {
  return {
    id: booking.id,
    bookingId: booking.booking_id || booking.id,
    fullName: booking.full_name,
    email: booking.email || 'N/A',
    phone: booking.phone,
    services: booking.booking_services || [],
    guests: {
      adults: booking.guests_adults || 0,
      children: booking.guests_children || 0
    },
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    type: booking.booking_type || 'Online',
    status: booking.status,
    createdAt: booking.created_at,
    totalAmount: booking.total_amount
  };
}

// Render booking rows
function renderBookingRows(bookings) {
  if (!bookings || bookings.length === 0) {
    return '<tr><td colspan="10" class="bookings-empty-state">No bookings found</td></tr>';
  }

  return bookings.map(booking => {
    const transformed = transformBooking(booking);
    return `
    <tr>
      <td><strong>${transformed.bookingId}</strong></td>
      <td>${transformed.fullName}</td>
      <td>
        <div class="bookings-contact">
          ${transformed.email && transformed.email !== 'N/A' ? `<span>${transformed.email}</span>` : ''}
          <span>${transformed.phone}</span>
        </div>
      </td>
      <td>
        <div class="bookings-service-cell">${formatServices(transformed.services)}</div>
      </td>
      <td>
        <div class="bookings-guests">
          <span class="bookings-guests-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            ${transformed.guests.adults} adults
          </span>
          <span class="bookings-guests-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="3"></circle>
            </svg>
            ${transformed.guests.children} children
          </span>
        </div>
      </td>
      <td>${formatDisplayDate(transformed.checkIn)}</td>
      <td>${formatDisplayDate(transformed.checkOut)}</td>
      <td>${transformed.type}</td>
      <td>
        <span class="bookings-status-badge bookings-status-${transformed.status}">${transformed.status}</span>
      </td>
      <td>
        <div class="bookings-action-menu" data-booking-id="${transformed.id}">
          <button class="bookings-action-trigger" aria-label="Actions">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
          <div class="bookings-action-dropdown">
            <button class="bookings-action-item" data-action="view">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              View
            </button>
            ${transformed.status === 'pending' ? `
            <button class="bookings-action-item" data-action="confirm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Approve
            </button>
            <button class="bookings-action-item" data-action="cancel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Cancel
            </button>
            ` : ''}
            ${transformed.status === 'confirmed' ? `
            <button class="bookings-action-item" data-action="checkout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              Checkout
            </button>
            ` : ''}
            ${transformed.status === 'cancelled' || transformed.status === 'completed' ? `
            <button class="bookings-action-item bookings-action-delete" data-action="delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete
            </button>
            ` : ''}
          </div>
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

// Handler functions for booking actions
async function handleViewBooking(bookingId) {
  try {
    const booking = await getBookingById(bookingId);
    if (!booking) {
      alert('Booking not found');
      return;
    }
    
    const transformed = transformBooking(booking);
    const servicesText = transformed.services.map(s => 
      `${s.service_name} (x${s.quantity}) - ${formatDisplayDate(s.service_check_in)} to ${formatDisplayDate(s.service_check_out)}`
    ).join('\n');
    
    const details = `
Booking ID: ${transformed.bookingId}
Guest: ${transformed.fullName}
Email: ${transformed.email}
Phone: ${transformed.phone}
Check-in: ${formatDisplayDate(transformed.checkIn)}
Check-out: ${formatDisplayDate(transformed.checkOut)}
Status: ${transformed.status}
Type: ${transformed.type}
Guests: ${transformed.guests.adults} adults, ${transformed.guests.children} children
Total Amount: ₱${parseFloat(transformed.totalAmount || 0).toLocaleString()}

Services:
${servicesText}
    `;
    
    alert(details);
  } catch (error) {
    console.error('Error viewing booking:', error);
    alert('Error loading booking details');
  }
}

async function handleConfirmBooking(bookingId) {
  // First, check if the booking exists and is not cancelled
  try {
    const booking = await getBookingById(bookingId);
    if (!booking) {
      alert('Booking not found');
      return;
    }
    
    if (booking.status === 'cancelled') {
      alert('Cannot approve a cancelled booking. Cancelled bookings cannot be approved.');
      return;
    }
    
    if (booking.status !== 'pending') {
      alert(`Cannot approve booking with status "${booking.status}". Only pending bookings can be approved.`);
      return;
    }
  } catch (error) {
    console.error('Error checking booking status:', error);
    alert('Error checking booking status. Please try again.');
    return;
  }
  
  if (!confirm('Are you sure you want to approve this booking? The status will change to confirmed and it will affect calendar availability.')) return;
  
  try {
    console.log('Admin dashboard: Approving booking:', bookingId);
    const result = await updateBookingStatus(bookingId, 'confirmed');
    console.log('Admin dashboard: Update result:', result);
    
    if (result.success) {
      alert('Booking approved successfully! Status updated to confirmed. The calendar availability has been updated.');
      // Refresh bookings without reloading the page
      await refreshBookings();
    } else {
      console.error('Failed to approve booking:', result.error);
      alert(result.error || 'Failed to approve booking. Make sure you are logged in as admin.');
    }
  } catch (error) {
    console.error('Error approving booking:', error);
    alert('An error occurred: ' + (error.message || 'Unknown error'));
  }
}

async function handleCancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  
  try {
    console.log('Admin dashboard: Cancelling booking:', bookingId);
    const result = await cancelBooking(bookingId);
    console.log('Admin dashboard: Cancel result:', result);
    
    if (result.success) {
      alert('Booking cancelled successfully');
      // Refresh bookings without reloading the page
      await refreshBookings();
    } else {
      console.error('Failed to cancel booking:', result.error);
      alert(result.error || 'Failed to cancel booking. Make sure you are logged in as admin.');
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    alert('An error occurred: ' + (error.message || 'Unknown error'));
  }
}

async function handleCheckoutBooking(bookingId) {
  if (!confirm('Are you sure you want to checkout this booking? This will mark it as completed (checked out).')) return;
  
  try {
    console.log('Admin dashboard: Checking out booking:', bookingId);
    const result = await updateBookingStatus(bookingId, 'completed');
    console.log('Admin dashboard: Checkout result:', result);
    
    if (result.success) {
      alert('Booking checked out successfully! Status updated to completed.');
      // Refresh bookings without reloading the page
      await refreshBookings();
    } else {
      console.error('Failed to checkout booking:', result.error);
      alert(result.error || 'Failed to checkout booking. Make sure you are logged in as admin.');
    }
  } catch (error) {
    console.error('Error checking out booking:', error);
    alert('An error occurred: ' + (error.message || 'Unknown error'));
  }
}

async function handleDeleteBooking(bookingId) {
  if (!confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) return;
  
  try {
    console.log('Admin dashboard: Deleting booking:', bookingId);
    const result = await deleteBooking(bookingId);
    console.log('Admin dashboard: Delete result:', result);
    
    if (result.success) {
      alert('Booking deleted successfully');
      // Refresh bookings without reloading the page
      await refreshBookings();
    } else {
      console.error('Failed to delete booking:', result.error);
      alert(result.error || 'Failed to delete booking. Make sure you are logged in as admin.');
    }
  } catch (error) {
    console.error('Error deleting booking:', error);
    alert('An error occurred: ' + (error.message || 'Unknown error'));
  }
}

export async function BookingsPage() {
  // Fetch bookings from database
  let allBookings = [];
  try {
    allBookings = await getAllBookings();
    // Store all bookings globally for filtering
    window._currentBookings = allBookings || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    // Continue with empty array instead of returning early
    allBookings = [];
    window._currentBookings = [];
  }
  
  // Show all bookings initially (filtering will be handled by filterAndRenderBookings)
  const bookingsCount = allBookings.length;
  const bookingRows = renderBookingRows(allBookings);

  return `
    <div class="bookings-page">
      <div class="bookings-page-header">
        <div>
          <h2 class="bookings-title">All Bookings</h2>
          <p class="bookings-subtitle">${bookingsCount} booking${bookingsCount !== 1 ? 's' : ''} found</p>
        </div>
        <div class="bookings-create-buttons">
          <button class="bookings-create-btn" data-type="room">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            New Room Booking
          </button>
          <button class="bookings-create-btn" data-type="cottage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            New Cottage Booking
          </button>
          <button class="bookings-create-btn" data-type="function-hall">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            New Function Hall Booking
          </button>
        </div>
      </div>

      <div class="bookings-filters">
        <div class="bookings-search-wrapper">
          <svg class="bookings-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search by guest name or contact..."
            class="bookings-search-input"
          />
        </div>
        <div class="bookings-filter-group">
          <select class="bookings-filter-select bookings-filter-status">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <select class="bookings-filter-select bookings-filter-type">
            <option value="all">All Types</option>
            <option value="walk-in">Walk-In</option>
            <option value="online">Online</option>
          </select>
          <select class="bookings-filter-select bookings-filter-service">
            <option value="all">All Services</option>
            <option value="Standard Room">Standard Room</option>
            <option value="Open Cottage">Open Cottage</option>
            <option value="Standard Cottage">Standard Cottage</option>
            <option value="Family Cottage">Family Cottage</option>
            <option value="Grand Function Hall">Grand Function Hall</option>
            <option value="Intimate Function Hall">Intimate Function Hall</option>
          </select>
          <button class="bookings-reset-btn">Reset</button>
        </div>
      </div>

      <div class="bookings-table-container">
        <table class="bookings-table">
          <thead>
            <tr>
              <th>BOOKING ID</th>
              <th>GUEST NAME</th>
              <th>CONTACT</th>
              <th>SERVICE</th>
              <th>GUESTS</th>
              <th>CHECK-IN</th>
              <th>CHECK-OUT</th>
              <th>TYPE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="bookings-table-body">
            ${bookingRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Refresh bookings from database without reloading page
async function refreshBookings() {
  try {
    const allBookings = await getAllBookings();
    window._currentBookings = allBookings;
    
    // Preserve current filter values
    const searchInput = document.querySelector('.bookings-search-input');
    const statusFilter = document.querySelector('.bookings-filter-status');
    const typeFilter = document.querySelector('.bookings-filter-type');
    const serviceFilter = document.querySelector('.bookings-filter-service');
    
    const searchTerm = (searchInput?.value || '').toLowerCase().trim();
    const statusValue = statusFilter?.value || 'all';
    const typeValue = typeFilter?.value || 'all';
    const serviceValue = serviceFilter?.value || 'all';
    
    // Apply filters
    let filteredBookings = allBookings.filter(booking => {
      const transformed = transformBooking(booking);
      
      // Search filter
      if (searchTerm) {
        const searchableText = [
          transformed.bookingId,
          transformed.fullName,
          transformed.email,
          transformed.phone,
          ...transformed.services.map(s => s.service_name)
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Status filter - only filter if not "all" and status exists
      if (statusValue !== 'all') {
        const bookingStatus = transformed.status ? transformed.status.toLowerCase() : '';
        if (bookingStatus !== statusValue.toLowerCase()) {
          return false;
        }
      }

      // Type filter
      if (typeValue !== 'all' && transformed.type.toLowerCase() !== typeValue.toLowerCase()) {
        return false;
      }

      // Service filter
      if (serviceValue !== 'all') {
        const hasService = transformed.services.some(s => s.service_name === serviceValue);
        if (!hasService) {
          return false;
        }
      }

      return true;
    });
    
    // Update table
    const tableBody = document.getElementById('bookings-table-body');
    const subtitle = document.querySelector('.bookings-subtitle');
    
    if (tableBody) {
      tableBody.innerHTML = renderBookingRows(filteredBookings);
      initActionMenus();
    }
    
    if (subtitle) {
      const count = filteredBookings.length;
      subtitle.textContent = `${count} booking${count !== 1 ? 's' : ''} found`;
    }
  } catch (error) {
    console.error('Error refreshing bookings:', error);
    alert('Error refreshing bookings. Please try again.');
  }
}

// Filter and render bookings
function filterAndRenderBookings() {
  const searchInput = document.querySelector('.bookings-search-input');
  const statusFilter = document.querySelector('.bookings-filter-status');
  const typeFilter = document.querySelector('.bookings-filter-type');
  const serviceFilter = document.querySelector('.bookings-filter-service');
  const tableBody = document.getElementById('bookings-table-body');
  const subtitle = document.querySelector('.bookings-subtitle');

  if (!tableBody) return;

  const searchTerm = (searchInput?.value || '').toLowerCase().trim();
  const statusValue = statusFilter?.value || 'all';
  const typeValue = typeFilter?.value || 'all';
  const serviceValue = serviceFilter?.value || 'all';

  // Get current bookings from the table (we need to store them globally)
  const allBookings = window._currentBookings || [];

  // Filter bookings
  let filteredBookings = allBookings.filter(booking => {
    const transformed = transformBooking(booking);
    
    // Search filter
    if (searchTerm) {
      const searchableText = [
        transformed.bookingId,
        transformed.fullName,
        transformed.email,
        transformed.phone,
        ...transformed.services.map(s => s.service_name)
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    // Status filter
    if (statusValue !== 'all' && transformed.status.toLowerCase() !== statusValue.toLowerCase()) {
      return false;
    }

    // Type filter
    if (typeValue !== 'all' && transformed.type.toLowerCase() !== typeValue.toLowerCase()) {
      return false;
    }

    // Service filter
    if (serviceValue !== 'all') {
      const hasService = transformed.services.some(s => s.service_name === serviceValue);
      if (!hasService) {
        return false;
      }
    }

    return true;
  });

  // Render filtered bookings
  tableBody.innerHTML = renderBookingRows(filteredBookings);

  // Update subtitle
  if (subtitle) {
    const count = filteredBookings.length;
    subtitle.textContent = `${count} booking${count !== 1 ? 's' : ''} found`;
  }

  // Re-initialize action menus for new rows
  initActionMenus();
}

// Initialize action menus
function initActionMenus() {
  const actionMenus = document.querySelectorAll('.bookings-action-menu');

  actionMenus.forEach(menu => {
    const trigger = menu.querySelector('.bookings-action-trigger');
    const dropdown = menu.querySelector('.bookings-action-dropdown');
    
    if (!trigger || !dropdown) return;
    
    // Remove any existing listeners by cloning (clean slate)
    const newMenu = menu.cloneNode(true);
    menu.parentNode.replaceChild(newMenu, menu);
    
    // Get booking ID from the new menu after cloning
    const bookingId = newMenu.getAttribute('data-booking-id');
    if (!bookingId) {
      console.error('Booking ID not found on menu element');
      return;
    }
    
    const newTrigger = newMenu.querySelector('.bookings-action-trigger');
    const newDropdown = newMenu.querySelector('.bookings-action-dropdown');
    
    newTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.bookings-action-menu').forEach(m => {
        if (m !== newMenu) m.classList.remove('active');
      });
      
      const isActive = newMenu.classList.contains('active');
      newMenu.classList.toggle('active');
      
      if (!isActive) {
        const rect = newTrigger.getBoundingClientRect();
        newDropdown.style.top = `${rect.bottom + 8}px`;
        newDropdown.style.right = `${window.innerWidth - rect.right}px`;
      }
    });

    // Handle action items
    const actionItems = newMenu.querySelectorAll('.bookings-action-item');
    actionItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = item.getAttribute('data-action');
        newMenu.classList.remove('active');
        
        if (action === 'view') {
          handleViewBooking(bookingId);
        } else if (action === 'confirm') {
          handleConfirmBooking(bookingId);
        } else if (action === 'cancel') {
          handleCancelBooking(bookingId);
        } else if (action === 'checkout') {
          handleCheckoutBooking(bookingId);
        } else if (action === 'delete') {
          handleDeleteBooking(bookingId);
        }
      });
    });
  });

  // Close menus when clicking outside (use event delegation)
  // Use a single global handler to avoid multiple listeners
  if (!window._bookingsOutsideClickHandler) {
    window._bookingsOutsideClickHandler = (e) => {
      if (!e.target.closest('.bookings-action-menu')) {
        document.querySelectorAll('.bookings-action-menu').forEach(menu => {
          menu.classList.remove('active');
        });
      }
    };
    document.addEventListener('click', window._bookingsOutsideClickHandler);
  }
}

// Handler for create booking buttons
async function handleCreateBooking(type) {
  // Import booking form component
  const { createBookingForm } = await import('../../../../assets/js/components/bookingForm.js');
  
  // Determine package details based on type
  let packageName, packageDetails;
  if (type === 'room') {
    packageName = 'Standard Room';
    packageDetails = {
      price: '₱2,000 per day',
      category: 'room'
    };
  } else if (type === 'cottage') {
    packageName = 'Cottage';
    packageDetails = {
      category: 'cottage'
    };
  } else if (type === 'function-hall') {
    packageName = 'Function Hall';
    packageDetails = {
      category: 'functionHall'
    };
  }

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: grid; place-items: center; padding: 1rem;';
  
  // Get form HTML
  const formHTML = createBookingForm(packageName, packageDetails);
  modal.innerHTML = formHTML;
  
  document.body.appendChild(modal);
  
  // Initialize the form with admin-specific logic
  initAdminBookingForm(type, packageName, packageDetails, modal);
}

// Initialize booking form for admin (reuses same logic as main site)
function initAdminBookingForm(type, packageName, packageDetails, modal) {
  const form = document.getElementById('comprehensive-booking-form');
  if (!form) return;
  
  const isFunctionHall = type === 'function-hall';
  const isCottage = type === 'cottage';
  
  if (isFunctionHall) {
    initAdminFunctionHallForm(packageName, packageDetails, modal);
  } else if (isCottage) {
    initAdminCottageForm(packageName, packageDetails, modal);
  } else {
    initAdminRoomForm(packageName, packageDetails, modal);
  }
}

// Simple toast function for admin
function showAdminToast(message, type = 'info') {
  // Create a simple toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 0.875rem;
    font-weight: 500;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize room booking form for admin (copy-paste from main site with admin database)
async function initAdminRoomForm(packageName, packageDetails, modal) {
  const form = document.getElementById('comprehensive-booking-form');
  if (!form) return;
  
  // Import utilities (same as main site)
  const { formatDisplayDate, calculateDays, formatDateString, parseDateString, createDateRangeCalendar } = await import('../../../../assets/js/components/bookingForm.js');
  const { getServiceAvailability, getAvailabilityStatusClass, getAvailabilityStatusIcon, formatAvailabilityText } = await import('../../../../assets/js/utils/availability.js');
  
  // State for room/cottage bookings (same as main site)
  let roomCheckIn = null;
  let roomCheckOut = null;
  let cottageCheckIn = null;
  let cottageCheckOut = null;
  const cottageQuantities = { open: 0, standard: 0, family: 0 };
  const cottagePrices = { open: 300, standard: 400, family: 500 };
  const roomPrice = 2000;
  
  // Guest validation
  const adultsInput = document.getElementById('adults');
  const childrenInput = document.getElementById('children');
  const guestError = document.getElementById('guest-error');
  
  function validateGuests() {
    const adults = parseInt(adultsInput.value) || 0;
    const children = parseInt(childrenInput.value) || 0;
    const total = adults + children;
    
    if (total > 4) {
      guestError.textContent = 'Total guests cannot exceed 4';
      guestError.style.display = 'block';
      return false;
    } else {
      guestError.style.display = 'none';
      return true;
    }
  }
  
  if (adultsInput) adultsInput.addEventListener('change', validateGuests);
  if (childrenInput) childrenInput.addEventListener('change', validateGuests);
  
  // Date range picker for rooms (COPY-PASTE from main site)
  const roomDateBtn = document.getElementById('room-date-range-btn');
  const roomDaysDisplay = document.getElementById('room-days');
  
  function openDateRangePicker(type, checkInId, checkOutId, textId, daysId) {
    // For cottage dates, require room dates to be selected first
    if (type === 'cottage' && (!roomCheckIn || !roomCheckOut)) {
      showAdminToast('Please select room dates first', 'error');
      return;
    }
    
    const popover = document.createElement('div');
    popover.className = 'date-range-popover';
    popover.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: grid; place-items: center;';
    
    // For cottage dates, constrain to room date range
    const minDate = type === 'cottage' ? roomCheckIn : null;
    const maxDate = type === 'cottage' ? roomCheckOut : null;
    
    // Determine service names based on type
    const serviceNames = type === 'room' 
      ? ['Standard Room']
      : ['Open Cottage', 'Standard Cottage', 'Family Cottage'];
    
    let currentMonth = new Date();
    currentMonth.setDate(1);
    let selectingStart = true;
    let tempStart = type === 'room' ? roomCheckIn : cottageCheckIn;
    let tempEnd = type === 'room' ? roomCheckOut : cottageCheckOut;
    
    function renderCalendar() {
      const calendar = createDateRangeCalendar(
        tempStart || null,
        tempEnd || null,
        null,
        minDate,
        maxDate,
        currentMonth,
        serviceNames
      );
      currentMonth = new Date(calendar.currentMonth);
      return calendar;
    }
    
    const calendar = renderCalendar();
    popover.innerHTML = `
      <div style="background: hsl(0, 0%, 100%); border-radius: 0.75rem; padding: 0; max-width: 500px; max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
        ${calendar.html}
      </div>
    `;
    
    document.body.appendChild(popover);
    
    // Handle date selection and navigation
    setTimeout(() => {
      const calendarContainer = popover.querySelector('.range-calendars-container');
      
      // Update availability badges with real database data (after DOM is ready)
      if (calendar.updateAvailability && calendarContainer) {
        calendar.updateAvailability(calendarContainer).catch(err => {
          console.error('Error updating availability:', err);
        });
      }
      
      function attachListeners() {
        // Date selection
        const dayButtons = popover.querySelectorAll('.range-calendar-day:not(.disabled):not(.empty)');
        dayButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const date = btn.getAttribute('data-date');
            
            // For cottage dates, validate against room date range
            if (type === 'cottage' && roomCheckIn && roomCheckOut) {
              if (date < roomCheckIn || date > roomCheckOut) {
                showAdminToast('Cottage dates must be within the room date range', 'error');
                return;
              }
            }
            
            if (selectingStart) {
              tempStart = date;
              tempEnd = null;
              selectingStart = false;
              // Update UI
              const calendar = createDateRangeCalendar(
                tempStart || null,
                null,
                null,
                minDate,
                maxDate,
                currentMonth,
                serviceNames
              );
              const monthContainer = calendarContainer.querySelector('.range-calendar-month');
              if (monthContainer) {
                monthContainer.outerHTML = calendar.calendarMonthHtml;
                // Update availability after re-render
                setTimeout(() => {
                  if (calendar.updateAvailability) {
                    calendar.updateAvailability(calendarContainer).catch(err => {
                      console.error('Error updating availability:', err);
                    });
                  }
                }, 50);
              }
              attachListeners();
            } else {
              // For cottage dates, validate end date is within room date range
              if (type === 'cottage' && roomCheckIn && roomCheckOut) {
                if (date < roomCheckIn || date > roomCheckOut) {
                  showAdminToast('Cottage dates must be within the room date range', 'error');
                  return;
                }
              }
              if (date < tempStart) {
                tempEnd = tempStart;
                tempStart = date;
              } else {
                tempEnd = date;
              }
              selectingStart = true;
              
              // Set values
              if (type === 'room') {
                roomCheckIn = tempStart;
                roomCheckOut = tempEnd;
                document.getElementById('roomCheckIn').value = tempStart;
                document.getElementById('roomCheckOut').value = tempEnd;
                updateRoomDateDisplay();
                // Clear cottage dates if they're outside the new room date range
                if (cottageCheckIn && cottageCheckOut) {
                  if (cottageCheckIn < tempStart || cottageCheckOut > tempEnd) {
                    cottageCheckIn = null;
                    cottageCheckOut = null;
                    document.getElementById('cottageCheckIn').value = '';
                    document.getElementById('cottageCheckOut').value = '';
                    updateCottageDateDisplay();
                  }
                }
              } else {
                // Validate cottage dates are within room date range
                if (tempStart < roomCheckIn || tempEnd > roomCheckOut) {
                  showAdminToast('Cottage dates must be within the room date range', 'error');
                  return;
                }
                cottageCheckIn = tempStart;
                cottageCheckOut = tempEnd;
                document.getElementById('cottageCheckIn').value = tempStart;
                document.getElementById('cottageCheckOut').value = tempEnd;
                updateCottageDateDisplay();
              }
              updateCostBreakdown();
              
              // Update UI with final selection
              const calendar = createDateRangeCalendar(
                tempStart || null,
                tempEnd || null,
                null,
                minDate,
                maxDate,
                currentMonth,
                serviceNames
              );
              const monthContainer = calendarContainer.querySelector('.range-calendar-month');
              if (monthContainer) {
                monthContainer.outerHTML = calendar.calendarMonthHtml;
                // Update availability after re-render
                setTimeout(() => {
                  if (calendar.updateAvailability) {
                    calendar.updateAvailability(calendarContainer).catch(err => {
                      console.error('Error updating availability:', err);
                    });
                  }
                }, 50);
              }
              attachListeners();
            }
          });
        });
        
        // Navigation buttons
        const prevBtn = popover.querySelector('[data-action="prev"]');
        const nextBtn = popover.querySelector('[data-action="next"]');
        
        if (prevBtn) {
          prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            const calendar = createDateRangeCalendar(
              tempStart || null,
              tempEnd || null,
              null,
              minDate,
              maxDate,
              currentMonth,
              serviceNames
            );
            const monthContainer = calendarContainer.querySelector('.range-calendar-month');
            if (monthContainer) {
              monthContainer.outerHTML = calendar.calendarMonthHtml;
              if (calendar.updateAvailability) {
                calendar.updateAvailability(calendarContainer).catch(err => {
                  console.error('Error updating availability:', err);
                });
              }
            }
            currentMonth = new Date(calendar.currentMonth);
            attachListeners();
          });
        }
        
        if (nextBtn) {
          nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
            const calendar = createDateRangeCalendar(
              tempStart || null,
              tempEnd || null,
              null,
              minDate,
              maxDate,
              currentMonth,
              serviceNames
            );
            const monthContainer = calendarContainer.querySelector('.range-calendar-month');
            if (monthContainer) {
              monthContainer.outerHTML = calendar.calendarMonthHtml;
              if (calendar.updateAvailability) {
                calendar.updateAvailability(calendarContainer).catch(err => {
                  console.error('Error updating availability:', err);
                });
              }
            }
            currentMonth = new Date(calendar.currentMonth);
            attachListeners();
          });
        }
      }
      
      attachListeners();
      
      // Close on backdrop click
      popover.addEventListener('click', (e) => {
        if (e.target === popover) {
          popover.remove();
        }
      });
    }, 100);
  }
  
  roomDateBtn.addEventListener('click', () => openDateRangePicker('room', 'roomCheckIn', 'roomCheckOut', 'room-date-range-text', 'room-days'));
  
  function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const date = parseDateString(dateStr);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${monthNames[date.getMonth()]} ${day}, ${year}`;
  }
  
  async function updateRoomAvailability() {
    const indicator = document.getElementById('room-availability-indicator');
    if (!indicator) return;
    
    if (!roomCheckIn || !roomCheckOut) {
      resetRoomAvailability();
      return;
    }
    
    try {
      const availability = await getServiceAvailability('Standard Room', roomCheckIn, roomCheckOut);
      const statusClass = getAvailabilityStatusClass(availability.status);
      const statusIcon = getAvailabilityStatusIcon(availability.status);
      const availabilityText = formatAvailabilityText(availability.available, availability.total);
      
      indicator.className = `availability-indicator ${statusClass}`;
      indicator.innerHTML = `
        <span class="availability-icon">${statusIcon}</span>
        <span class="availability-text">${availabilityText}</span>
      `;
      
      // Update max rooms input
      const numRoomsInput = document.getElementById('numRooms');
      if (numRoomsInput) {
        const currentValue = parseInt(numRoomsInput.value) || 1;
        numRoomsInput.max = Math.max(1, availability.available);
        numRoomsInput.min = 1;
        if (currentValue > availability.available) {
          numRoomsInput.value = Math.max(1, availability.available);
          showAdminToast(`Only ${availability.available} room(s) available. Quantity adjusted.`, 'info');
        }
        if (availability.available === 0) {
          numRoomsInput.disabled = true;
          numRoomsInput.value = 0;
        } else {
          numRoomsInput.disabled = false;
          if (currentValue < 1) {
            numRoomsInput.value = 1;
          }
        }
      }
    } catch (error) {
      console.error('Error updating room availability:', error);
      indicator.className = 'availability-indicator';
      indicator.innerHTML = '<span class="availability-text">Error loading availability</span>';
    }
  }
  
  function resetRoomAvailability() {
    const indicator = document.getElementById('room-availability-indicator');
    if (indicator) {
      indicator.className = 'availability-indicator';
      indicator.innerHTML = '<span class="availability-text">Select dates to see availability</span>';
    }
    const numRoomsInput = document.getElementById('numRooms');
    if (numRoomsInput) {
      numRoomsInput.disabled = false;
      numRoomsInput.max = 4;
    }
  }
  
  function updateRoomDateDisplay() {
    const checkinText = document.getElementById('room-checkin-text');
    const checkoutText = document.getElementById('room-checkout-text');
    
    if (roomCheckIn && roomCheckOut) {
      if (checkinText) checkinText.textContent = formatDateForDisplay(roomCheckIn);
      if (checkoutText) checkoutText.textContent = formatDateForDisplay(roomCheckOut);
      const days = calculateDays(roomCheckIn, roomCheckOut);
      if (roomDaysDisplay) {
        roomDaysDisplay.textContent = `${days} ${days === 1 ? 'day' : 'days'}`;
        roomDaysDisplay.style.display = 'block';
      }
      updateRoomAvailability();
    } else if (roomCheckIn) {
      if (checkinText) checkinText.textContent = formatDateForDisplay(roomCheckIn);
      if (checkoutText) checkoutText.textContent = 'Add date';
      if (roomDaysDisplay) roomDaysDisplay.style.display = 'none';
      updateRoomAvailability();
    } else {
      if (checkinText) checkinText.textContent = 'Add date';
      if (checkoutText) checkoutText.textContent = 'Add date';
      if (roomDaysDisplay) roomDaysDisplay.style.display = 'none';
      resetRoomAvailability();
    }
    updateCottageDateButtonState();
    updateCostBreakdown();
  }
  
  function updateCottageDateButtonState() {
    const cottageDateBtn = document.getElementById('cottage-date-range-btn');
    if (cottageDateBtn) {
      if (roomCheckIn && roomCheckOut) {
        cottageDateBtn.disabled = false;
        cottageDateBtn.style.opacity = '1';
        cottageDateBtn.style.cursor = 'pointer';
      } else {
        cottageDateBtn.disabled = true;
        cottageDateBtn.style.opacity = '0.5';
        cottageDateBtn.style.cursor = 'not-allowed';
      }
    }
  }
  
  // Cottage date range picker
  const cottageDateBtn = document.getElementById('cottage-date-range-btn');
  const cottageDaysDisplay = document.getElementById('cottage-days');
  
  // Initialize cottage date button state
  updateCottageDateButtonState();
  
  if (cottageDateBtn) {
    cottageDateBtn.addEventListener('click', () => openDateRangePicker('cottage', 'cottageCheckIn', 'cottageCheckOut', null, 'cottage-days'));
  }
  
  async function updateCottageAvailability() {
    if (!cottageCheckIn || !cottageCheckOut) {
      resetCottageAvailability();
      return;
    }
    
    const cottageServices = [
      { name: 'Open Cottage', key: 'open' },
      { name: 'Standard Cottage', key: 'standard' },
      { name: 'Family Cottage', key: 'family' }
    ];
    
    await Promise.all(
      cottageServices.map(async ({ name: serviceName, key }) => {
        try {
          const availability = await getServiceAvailability(serviceName, cottageCheckIn, cottageCheckOut);
          const statusClass = getAvailabilityStatusClass(availability.status);
          const statusIcon = getAvailabilityStatusIcon(availability.status);
          const availabilityText = formatAvailabilityText(availability.available, availability.total);
          
          const indicator = document.querySelector(`.cottage-availability[data-service="${serviceName}"]`);
          if (indicator) {
            indicator.className = `cottage-availability ${statusClass}`;
            indicator.innerHTML = `
              <span class="availability-icon">${statusIcon}</span>
              <span class="availability-text">${availabilityText}</span>
            `;
          }
          
          // Update quantity controls based on availability
          const increaseBtn = document.querySelector(`.qty-btn[data-cottage="${key}"][data-action="increase"]`);
          const decreaseBtn = document.querySelector(`.qty-btn[data-cottage="${key}"][data-action="decrease"]`);
          const currentQty = cottageQuantities[key] || 0;
          
          if (increaseBtn) {
            if (currentQty >= availability.available || availability.available === 0) {
              increaseBtn.disabled = true;
            } else {
              increaseBtn.disabled = false;
            }
          }
          
          if (decreaseBtn) {
            decreaseBtn.disabled = currentQty === 0;
          }
          
          // If current quantity exceeds availability, adjust it
          if (currentQty > availability.available) {
            cottageQuantities[key] = Math.max(0, availability.available);
            const qtyEl = document.querySelector(`.qty-value[data-cottage="${key}"]`);
            if (qtyEl) {
              qtyEl.textContent = cottageQuantities[key];
            }
            showAdminToast(`Only ${availability.available} ${serviceName}(s) available. Quantity adjusted.`, 'info');
          }
        } catch (error) {
          console.error(`Error updating availability for ${serviceName}:`, error);
          const indicator = document.querySelector(`.cottage-availability[data-service="${serviceName}"]`);
          if (indicator) {
            indicator.className = 'cottage-availability';
            indicator.innerHTML = '<span class="availability-text">Error loading availability</span>';
          }
        }
      })
    );
  }
  
  function resetCottageAvailability() {
    const indicators = document.querySelectorAll('.cottage-availability');
    indicators.forEach(el => {
      el.className = 'cottage-availability';
      el.innerHTML = '<span class="availability-text">Select dates to see availability</span>';
    });
    
    // Reset quantity control buttons
    document.querySelectorAll('.qty-btn').forEach(btn => {
      const cottage = btn.getAttribute('data-cottage');
      const action = btn.getAttribute('data-action');
      const currentQty = cottageQuantities[cottage] || 0;
      
      if (action === 'increase') {
        btn.disabled = false;
      } else if (action === 'decrease') {
        btn.disabled = currentQty === 0;
      }
    });
  }
  
  function updateCottageDateDisplay() {
    const checkinText = document.getElementById('cottage-checkin-text');
    const checkoutText = document.getElementById('cottage-checkout-text');
    
    if (cottageCheckIn && cottageCheckOut) {
      if (checkinText) checkinText.textContent = formatDateForDisplay(cottageCheckIn);
      if (checkoutText) checkoutText.textContent = formatDateForDisplay(cottageCheckOut);
      const days = calculateDays(cottageCheckIn, cottageCheckOut);
      if (cottageDaysDisplay) {
        cottageDaysDisplay.textContent = `${days} ${days === 1 ? 'day' : 'days'}`;
        cottageDaysDisplay.style.display = 'block';
      }
      updateCottageAvailability();
    } else if (cottageCheckIn) {
      if (checkinText) checkinText.textContent = formatDateForDisplay(cottageCheckIn);
      if (checkoutText) checkoutText.textContent = 'Add date';
      if (cottageDaysDisplay) cottageDaysDisplay.style.display = 'none';
      updateCottageAvailability();
    } else {
      if (checkinText) checkinText.textContent = 'Add date';
      if (checkoutText) checkoutText.textContent = 'Add date';
      if (cottageDaysDisplay) cottageDaysDisplay.style.display = 'none';
      resetCottageAvailability();
    }
    updateCostBreakdown();
  }
  
  // Cottage toggle
  const addCottagesCheckbox = document.getElementById('addCottages');
  const cottageSection = document.getElementById('cottage-section');
  
  if (addCottagesCheckbox && cottageSection) {
    addCottagesCheckbox.addEventListener('change', (e) => {
      cottageSection.style.display = e.target.checked ? 'block' : 'none';
      if (!e.target.checked) {
        cottageQuantities.open = 0;
        cottageQuantities.standard = 0;
        cottageQuantities.family = 0;
        cottageCheckIn = null;
        cottageCheckOut = null;
        document.querySelectorAll('.qty-value').forEach(el => el.textContent = '0');
        updateCostBreakdown();
      }
    });
  }
  
  // Cottage quantity controls
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cottage = btn.getAttribute('data-cottage');
      const action = btn.getAttribute('data-action');
      const qtyEl = document.querySelector(`.qty-value[data-cottage="${cottage}"]`);
      
      const serviceNameMap = {
        'open': 'Open Cottage',
        'standard': 'Standard Cottage',
        'family': 'Family Cottage'
      };
      const serviceName = serviceNameMap[cottage];
      
      let maxAvailable = 4; // Default max
      
      if (action === 'increase') {
        if (cottageQuantities[cottage] < maxAvailable) {
          cottageQuantities[cottage]++;
        } else {
          showAdminToast(`Only ${maxAvailable} ${serviceName}(s) available.`, 'info');
          return;
        }
      } else if (action === 'decrease' && cottageQuantities[cottage] > 0) {
        cottageQuantities[cottage]--;
      }
      
      if (qtyEl) qtyEl.textContent = cottageQuantities[cottage];
      
      // Update button states
      const increaseBtn = document.querySelector(`.qty-btn[data-cottage="${cottage}"][data-action="increase"]`);
      const decreaseBtn = document.querySelector(`.qty-btn[data-cottage="${cottage}"][data-action="decrease"]`);
      
      if (increaseBtn) {
        increaseBtn.disabled = cottageQuantities[cottage] >= maxAvailable || maxAvailable === 0;
      }
      if (decreaseBtn) {
        decreaseBtn.disabled = cottageQuantities[cottage] === 0;
      }
      
      updateCostBreakdown();
    });
  });
  
  // Cost breakdown calculation
  function updateCostBreakdown() {
    const breakdownItems = document.getElementById('breakdown-items');
    const grandTotalEl = document.getElementById('grand-total');
    let items = [];
    let total = 0;
    
    // Room costs
    const numRoomsInput = document.getElementById('numRooms');
    const numRooms = numRoomsInput ? parseInt(numRoomsInput.value) || 0 : 0;
    if (numRooms > 0 && roomCheckIn && roomCheckOut) {
      const days = calculateDays(roomCheckIn, roomCheckOut);
      const roomTotal = numRooms * roomPrice * days;
      items.push({
        name: `${packageName} × ${numRooms} (${days} ${days === 1 ? 'day' : 'days'})`,
        amount: roomTotal
      });
      total += roomTotal;
    }
    
    // Cottage costs
    if (addCottagesCheckbox && addCottagesCheckbox.checked && cottageCheckIn && cottageCheckOut) {
      const cottageDays = calculateDays(cottageCheckIn, cottageCheckOut);
      Object.keys(cottageQuantities).forEach(cottage => {
        const qty = cottageQuantities[cottage];
        if (qty > 0) {
          const cottageName = cottage === 'open' ? 'Open Cottage' : cottage === 'standard' ? 'Standard Cottage' : 'Family Cottage';
          const price = cottagePrices[cottage];
          const cottageTotal = qty * price * cottageDays;
          items.push({
            name: `${cottageName} × ${qty} (${cottageDays} ${cottageDays === 1 ? 'day' : 'days'})`,
            amount: cottageTotal
          });
          total += cottageTotal;
        }
      });
    }
    
    // Update UI
    if (breakdownItems) {
      if (items.length === 0) {
        breakdownItems.innerHTML = '<div style="color: var(--color-muted); text-align: center; padding: 10px 0;">Select dates to see pricing</div>';
      } else {
        breakdownItems.innerHTML = items.map(item => `
          <div class="breakdown-item">
            <span>${item.name}</span>
            <span>₱${item.amount.toLocaleString()}</span>
          </div>
        `).join('');
      }
    }
    
    if (grandTotalEl) {
      grandTotalEl.textContent = `₱${total.toLocaleString()}`;
    }
  }
  
  // Update breakdown on changes
  const numRoomsInput = document.getElementById('numRooms');
  if (numRoomsInput) {
    numRoomsInput.addEventListener('change', async () => {
      if (roomCheckIn && roomCheckOut) {
        try {
          const availability = await getServiceAvailability('Standard Room', roomCheckIn, roomCheckOut);
          const currentValue = parseInt(numRoomsInput.value) || 1;
          
          if (currentValue > availability.available) {
            numRoomsInput.value = Math.max(1, availability.available);
            showAdminToast(`Only ${availability.available} room(s) available. Quantity adjusted.`, 'info');
          } else if (currentValue < 1 && availability.available > 0) {
            numRoomsInput.value = 1;
          }
        } catch (error) {
          console.error('Error validating room availability:', error);
        }
      }
      updateCostBreakdown();
    });
  }
  
  // Form submission - uses admin database
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    
    // Check terms
    const acceptTermsCheckbox = document.getElementById('acceptTerms');
    if (!acceptTermsCheckbox || !acceptTermsCheckbox.checked) {
      showAdminToast('Please accept the terms and conditions to continue', 'error');
      return;
    }
    
    // Validation
    if (!validateGuests()) {
      showAdminToast('Please fix guest count error', 'error');
      return;
    }
    
    if (!roomCheckIn || !roomCheckOut) {
      showAdminToast('Please select room dates. Room booking is required.', 'error');
      return;
    }
    
    const numRooms = parseInt(formData.get('numRooms')) || 0;
    if (numRooms < 1) {
      showAdminToast('Please select at least 1 room. Room booking is required.', 'error');
      return;
    }
    
    // Validate availability
    try {
      const roomAvailability = await getServiceAvailability('Standard Room', roomCheckIn, roomCheckOut);
      if (numRooms > roomAvailability.available) {
        showAdminToast(`Only ${roomAvailability.available} room(s) available for the selected dates.`, 'error');
        return;
      }
      
      if (addCottagesCheckbox && addCottagesCheckbox.checked) {
        const hasCottages = Object.values(cottageQuantities).some(qty => qty > 0);
        if (hasCottages && (!cottageCheckIn || !cottageCheckOut)) {
          showAdminToast('Please select cottage dates', 'error');
          return;
        }
        
        if (hasCottages && cottageCheckIn && cottageCheckOut) {
          const cottageServices = [
            { name: 'Open Cottage', key: 'open' },
            { name: 'Standard Cottage', key: 'standard' },
            { name: 'Family Cottage', key: 'family' }
          ];
          
          for (const { name, key } of cottageServices) {
            const qty = cottageQuantities[key] || 0;
            if (qty > 0) {
              const cottageAvailability = await getServiceAvailability(name, cottageCheckIn, cottageCheckOut);
              if (qty > cottageAvailability.available) {
                showAdminToast(`Only ${cottageAvailability.available} ${name}(s) available for the selected dates.`, 'error');
                return;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error validating availability:', error);
      showAdminToast('Error checking availability. Please try again.', 'error');
      return;
    }
    
    // Create services array
    const services = [{
      name: 'Standard Room',
      quantity: numRooms,
      checkIn: roomCheckIn,
      checkOut: roomCheckOut
    }];
    
    // Add cottage services
    if (addCottagesCheckbox && addCottagesCheckbox.checked && cottageCheckIn && cottageCheckOut) {
      if (cottageCheckIn < roomCheckIn || cottageCheckOut > roomCheckOut) {
        showAdminToast('Cottage dates must be within the room date range', 'error');
        return;
      }
      
      if (cottageQuantities.open > 0) {
        services.push({
          name: 'Open Cottage',
          quantity: cottageQuantities.open,
          checkIn: cottageCheckIn,
          checkOut: cottageCheckOut
        });
      }
      if (cottageQuantities.standard > 0) {
        services.push({
          name: 'Standard Cottage',
          quantity: cottageQuantities.standard,
          checkIn: cottageCheckIn,
          checkOut: cottageCheckOut
        });
      }
      if (cottageQuantities.family > 0) {
        services.push({
          name: 'Family Cottage',
          quantity: cottageQuantities.family,
          checkIn: cottageCheckIn,
          checkOut: cottageCheckOut
        });
      }
    }
    
    // Create booking with admin database
    const result = await createWalkInBooking({
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      guests: {
        adults: parseInt(formData.get('adults')),
        children: parseInt(formData.get('children') || '0')
      },
      services: services,
      checkIn: roomCheckIn,
      checkOut: roomCheckOut,
      paymentMode: formData.get('paymentMode')
    });
    
    if (result.success) {
      modal.remove();
      showAdminToast('Walk-in booking created successfully!', 'success');
      // Refresh bookings
      await refreshBookings();
    } else {
      showAdminToast(result.error || 'Failed to create booking', 'error');
    }
  });
  
  // Initial cost breakdown update
  updateCostBreakdown();
}

// Initialize function hall booking form for admin (copy-paste from main site with admin database)
async function initAdminFunctionHallForm(packageName, packageDetails, modal) {
  const form = document.getElementById('comprehensive-booking-form');
  if (!form) return;
  
  const { formatDateString, parseDateString, formatDisplayDate, createSingleDateCalendar } = await import('../../../../assets/js/components/bookingForm.js');
  const { getServiceAvailabilityForDate, getAvailabilityStatusClass, getAvailabilityStatusIcon, formatAvailabilityText } = await import('../../../../assets/js/utils/availability.js');
  
  let functionHallDate = null;
  const functionHallPrices = {
    'Grand Function Hall': 15000,
    'Intimate Function Hall': 10000
  };
  
  // Function hall selection checkboxes
  const grandHallCheckbox = document.getElementById('grandHall');
  const intimateHallCheckbox = document.getElementById('intimateHall');
  
  // Date picker for function hall
  const dateBtn = document.getElementById('function-hall-date-btn');
  const dateText = document.getElementById('function-hall-date-text');
  
  let currentMonth = new Date();
  currentMonth.setDate(1);
  
  function openDatePicker() {
    const popover = document.createElement('div');
    popover.className = 'date-range-popover';
    popover.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: grid; place-items: center;';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDateString(today);
    
    function renderCalendar() {
      const calendar = createSingleDateCalendar(
        functionHallDate || null,
        (date) => {
          functionHallDate = date;
          const dateInput = document.getElementById('functionHallDate');
          if (dateInput) dateInput.value = date || '';
          updateDateDisplay();
          updateCostBreakdown();
          popover.remove();
        },
        todayStr,
        currentMonth,
        ['Grand Function Hall', 'Intimate Function Hall']
      );
      
      // Update currentMonth from calendar
      currentMonth = new Date(calendar.currentMonth);
      
      return calendar;
    }
    
    const calendar = renderCalendar();
    popover.innerHTML = `
      <div style="background: hsl(0, 0%, 100%); border-radius: 0.75rem; padding: 0; max-width: 500px; max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
        ${calendar.html}
      </div>
    `;
    
    document.body.appendChild(popover);
    
    // Handle date selection and navigation
    setTimeout(() => {
      const calendarContainer = popover.querySelector('.single-calendar-container');
      
      // Update availability badges with real database data (after DOM is ready)
      if (calendar.updateAvailability && calendarContainer) {
        calendar.updateAvailability(calendarContainer).catch(err => {
          console.error('Error updating availability:', err);
        });
      }
      
      function attachListeners() {
        // Date selection
        const dayButtons = popover.querySelectorAll('.single-calendar-day:not(.disabled):not(.empty)');
        dayButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const date = btn.getAttribute('data-date');
            if (!date || btn.disabled) return;
            
            functionHallDate = date;
            const dateInput = document.getElementById('functionHallDate');
            if (dateInput) dateInput.value = date;
            updateDateDisplay();
            updateCostBreakdown();
            
            // Update calendar to show selected date
            const calendar = createSingleDateCalendar(
              functionHallDate || null,
              null,
              todayStr,
              currentMonth,
              ['Grand Function Hall', 'Intimate Function Hall']
            );
            const monthContainer = calendarContainer.querySelector('.single-calendar-month');
            if (monthContainer) {
              monthContainer.outerHTML = calendar.calendarMonthHtml;
              // Update availability after re-render
              setTimeout(() => {
                if (calendar.updateAvailability) {
                  calendar.updateAvailability(calendarContainer).catch(err => {
                    console.error('Error updating availability:', err);
                  });
                }
              }, 50);
            }
            attachListeners();
          });
        });
        
        // Navigation buttons
        const prevBtn = popover.querySelector('[data-action="prev"]');
        const nextBtn = popover.querySelector('[data-action="next"]');
        
        if (prevBtn) {
          prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            const calendar = createSingleDateCalendar(
              functionHallDate || null,
              null,
              todayStr,
              currentMonth,
              ['Grand Function Hall', 'Intimate Function Hall']
            );
            const monthContainer = calendarContainer.querySelector('.single-calendar-month');
            if (monthContainer) {
              monthContainer.outerHTML = calendar.calendarMonthHtml;
              if (calendar.updateAvailability) {
                calendar.updateAvailability(calendarContainer).catch(err => {
                  console.error('Error updating availability:', err);
                });
              }
            }
            currentMonth = new Date(calendar.currentMonth);
            attachListeners();
          });
        }
        
        if (nextBtn) {
          nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
            const calendar = createSingleDateCalendar(
              functionHallDate || null,
              null,
              todayStr,
              currentMonth,
              ['Grand Function Hall', 'Intimate Function Hall']
            );
            const monthContainer = calendarContainer.querySelector('.single-calendar-month');
            if (monthContainer) {
              monthContainer.outerHTML = calendar.calendarMonthHtml;
              if (calendar.updateAvailability) {
                calendar.updateAvailability(calendarContainer).catch(err => {
                  console.error('Error updating availability:', err);
                });
              }
            }
            currentMonth = new Date(calendar.currentMonth);
            attachListeners();
          });
        }
      }
      
      attachListeners();
      
      // Handle Done button
      const doneBtn = popover.querySelector('.btn-primary');
      if (doneBtn) {
        doneBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (functionHallDate) {
            popover.remove();
          } else {
            showAdminToast('Please select a date', 'error');
          }
        });
      }
      
      // Close on backdrop click
      popover.addEventListener('click', (e) => {
        if (e.target === popover) {
          popover.remove();
        }
      });
    }, 100);
  }
  
  async function updateFunctionHallAvailability() {
    if (!functionHallDate) {
      resetFunctionHallAvailability();
      return;
    }
    
    const functionHallServices = ['Grand Function Hall', 'Intimate Function Hall'];
    await Promise.all(
      functionHallServices.map(async (serviceName) => {
        try {
          const availability = await getServiceAvailabilityForDate(serviceName, functionHallDate);
          const statusClass = getAvailabilityStatusClass(availability.status);
          const statusIcon = getAvailabilityStatusIcon(availability.status);
          const availabilityText = formatAvailabilityText(availability.available, availability.total);
          
          const indicator = document.querySelector(`.function-hall-availability[data-service="${serviceName}"]`);
          if (indicator) {
            indicator.className = `function-hall-availability ${statusClass}`;
            indicator.innerHTML = `
              <span class="availability-icon">${statusIcon}</span>
              <span class="availability-text">${availabilityText}</span>
            `;
          }
          
          // Disable checkbox if fully booked
          if (serviceName === 'Grand Function Hall' && grandHallCheckbox) {
            grandHallCheckbox.disabled = availability.available === 0;
            if (availability.available === 0 && grandHallCheckbox.checked) {
              grandHallCheckbox.checked = false;
              showAdminToast('Grand Function Hall is no longer available for the selected date.', 'info');
            }
          } else if (serviceName === 'Intimate Function Hall' && intimateHallCheckbox) {
            intimateHallCheckbox.disabled = availability.available === 0;
            if (availability.available === 0 && intimateHallCheckbox.checked) {
              intimateHallCheckbox.checked = false;
              showAdminToast('Intimate Function Hall is no longer available for the selected date.', 'info');
            }
          }
        } catch (error) {
          console.error(`Error updating availability for ${serviceName}:`, error);
        }
      })
    );
  }
  
  function resetFunctionHallAvailability() {
    const indicators = document.querySelectorAll('.function-hall-availability');
    indicators.forEach(el => {
      el.className = 'function-hall-availability';
      el.innerHTML = '<span class="availability-text">Select date to see availability</span>';
    });
    
    if (grandHallCheckbox) grandHallCheckbox.disabled = false;
    if (intimateHallCheckbox) intimateHallCheckbox.disabled = false;
  }
  
  function updateDateDisplay() {
    if (dateText) {
      if (functionHallDate) {
        dateText.textContent = formatDisplayDate(functionHallDate);
        updateFunctionHallAvailability();
      } else {
        dateText.textContent = 'Select date';
        resetFunctionHallAvailability();
      }
    }
  }
  
  function updateCostBreakdown() {
    const breakdownItems = document.getElementById('breakdown-items');
    const grandTotalEl = document.getElementById('grand-total');
    let items = [];
    let total = 0;
    
    if (!functionHallDate) {
      if (breakdownItems) {
        breakdownItems.innerHTML = '<div style="color: var(--color-muted); text-align: center; padding: 10px 0;">Select date and function hall(s) to see pricing</div>';
      }
      if (grandTotalEl) {
        grandTotalEl.textContent = '₱0';
      }
      return;
    }
    
    const selectedHalls = [];
    if (grandHallCheckbox && grandHallCheckbox.checked) {
      selectedHalls.push('Grand Function Hall');
    }
    if (intimateHallCheckbox && intimateHallCheckbox.checked) {
      selectedHalls.push('Intimate Function Hall');
    }
    
    if (selectedHalls.length === 0) {
      if (breakdownItems) {
        breakdownItems.innerHTML = '<div style="color: var(--color-muted); text-align: center; padding: 10px 0;">Please select at least one function hall</div>';
      }
      if (grandTotalEl) {
        grandTotalEl.textContent = '₱0';
      }
      return;
    }
    
    selectedHalls.forEach(hall => {
      const price = functionHallPrices[hall];
      items.push({
        name: hall,
        amount: price
      });
      total += price;
    });
    
    // Update UI
    if (breakdownItems) {
      breakdownItems.innerHTML = items.map(item => `
        <div class="breakdown-item">
          <span>${item.name}</span>
          <span>₱${item.amount.toLocaleString()}</span>
        </div>
      `).join('');
    }
    
    if (grandTotalEl) {
      grandTotalEl.textContent = `₱${total.toLocaleString()}`;
    }
  }
  
  // Event listeners
  if (dateBtn) {
    dateBtn.addEventListener('click', openDatePicker);
  }
  
  if (grandHallCheckbox) {
    grandHallCheckbox.addEventListener('change', async (e) => {
      // Validate availability when checkbox is checked
      if (e.target.checked && functionHallDate) {
        try {
          const availability = await getServiceAvailabilityForDate('Grand Function Hall', functionHallDate);
          if (availability.available === 0) {
            e.target.checked = false;
            showAdminToast('Grand Function Hall is not available for the selected date.', 'error');
            return;
          }
        } catch (error) {
          console.error('Error checking availability:', error);
          e.target.checked = false;
          showAdminToast('Error checking availability. Please try again.', 'error');
          return;
        }
      }
      updateCostBreakdown();
    });
  }
  
  if (intimateHallCheckbox) {
    intimateHallCheckbox.addEventListener('change', async (e) => {
      // Validate availability when checkbox is checked
      if (e.target.checked && functionHallDate) {
        try {
          const availability = await getServiceAvailabilityForDate('Intimate Function Hall', functionHallDate);
          if (availability.available === 0) {
            e.target.checked = false;
            showAdminToast('Intimate Function Hall is not available for the selected date.', 'error');
            return;
          }
        } catch (error) {
          console.error('Error checking availability:', error);
          e.target.checked = false;
          showAdminToast('Error checking availability. Please try again.', 'error');
          return;
        }
      }
      updateCostBreakdown();
    });
  }
  
  // Form submission - uses admin database
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check terms
    const acceptTermsCheckbox = document.getElementById('acceptTerms');
    if (!acceptTermsCheckbox || !acceptTermsCheckbox.checked) {
      showAdminToast('Please accept the terms and conditions to continue', 'error');
      return;
    }
    
    const formData = new FormData(form);
    
    if (!functionHallDate) {
      showAdminToast('Please select an event date', 'error');
      return;
    }
    
    // Validate availability
    const selectedHalls = [];
    try {
      if (grandHallCheckbox && grandHallCheckbox.checked) {
        const grandAvailability = await getServiceAvailabilityForDate('Grand Function Hall', functionHallDate);
        if (grandAvailability.available === 0) {
          showAdminToast('Grand Function Hall is not available for the selected date.', 'error');
          grandHallCheckbox.checked = false;
          return;
        }
        selectedHalls.push('Grand Function Hall');
      }
      if (intimateHallCheckbox && intimateHallCheckbox.checked) {
        const intimateAvailability = await getServiceAvailabilityForDate('Intimate Function Hall', functionHallDate);
        if (intimateAvailability.available === 0) {
          showAdminToast('Intimate Function Hall is not available for the selected date.', 'error');
          intimateHallCheckbox.checked = false;
          return;
        }
        selectedHalls.push('Intimate Function Hall');
      }
    } catch (error) {
      console.error('Error validating availability:', error);
      showAdminToast('Error checking availability. Please try again.', 'error');
      return;
    }
    
    if (selectedHalls.length === 0) {
      showAdminToast('Please select at least one function hall', 'error');
      return;
    }
    
    // Create services array
    const services = selectedHalls.map(hallName => ({
      name: hallName,
      quantity: 1,
      checkIn: functionHallDate,
      checkOut: functionHallDate
    }));
    
    // Create booking with admin database
    const result = await createWalkInBooking({
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      guests: {
        adults: parseInt(formData.get('adults')),
        children: 0
      },
      services: services,
      checkIn: functionHallDate,
      checkOut: functionHallDate,
      paymentMode: formData.get('paymentMode')
    });
    
    if (result.success) {
      modal.remove();
      showAdminToast('Walk-in function hall booking created successfully!', 'success');
      // Refresh bookings
      await refreshBookings();
    } else {
      showAdminToast(result.error || 'Failed to create booking', 'error');
    }
  });
  
  // Initial cost breakdown update
  updateCostBreakdown();
  resetFunctionHallAvailability();
}

// Initialize cottage-only booking form for admin (copy-paste from main site with admin database)
async function initAdminCottageForm(packageName, packageDetails, modal) {
  const form = document.getElementById('comprehensive-booking-form');
  if (!form) return;
  
  // Import utilities (same as main site)
  const { formatDisplayDate, calculateDays, formatDateString, parseDateString, createDateRangeCalendar } = await import('../../../../assets/js/components/bookingForm.js');
  const { getServiceAvailability, getAvailabilityStatusClass, getAvailabilityStatusIcon, formatAvailabilityText } = await import('../../../../assets/js/utils/availability.js');
  
  // State for cottage bookings only
  let cottageCheckIn = null;
  let cottageCheckOut = null;
  const cottageQuantities = { open: 0, standard: 0, family: 0 };
  const cottagePrices = { open: 300, standard: 400, family: 500 };
  
  // Guest validation
  const adultsInput = document.getElementById('adults');
  const childrenInput = document.getElementById('children');
  const guestError = document.getElementById('guest-error');
  
  function validateGuests() {
    const adults = parseInt(adultsInput.value) || 0;
    const children = parseInt(childrenInput.value) || 0;
    const total = adults + children;
    
    if (total > 4) {
      guestError.textContent = 'Total guests cannot exceed 4';
      guestError.style.display = 'block';
      return false;
    } else {
      guestError.style.display = 'none';
      return true;
    }
  }
  
  if (adultsInput) adultsInput.addEventListener('change', validateGuests);
  if (childrenInput) childrenInput.addEventListener('change', validateGuests);
  
  // Date range picker for cottages (COPY-PASTE from main site)
  const cottageDateBtn = document.getElementById('cottage-date-range-btn');
  const cottageDaysDisplay = document.getElementById('cottage-days');
  
  function openDateRangePicker() {
    const popover = document.createElement('div');
    popover.className = 'date-range-popover';
    popover.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: grid; place-items: center;';
    
    // Service names for cottages
    const serviceNames = ['Open Cottage', 'Standard Cottage', 'Family Cottage'];
    
    let currentMonth = new Date();
    currentMonth.setDate(1);
    let selectingStart = true;
    let tempStart = cottageCheckIn;
    let tempEnd = cottageCheckOut;
    
    function renderCalendar() {
      const calendar = createDateRangeCalendar(
        tempStart || null,
        tempEnd || null,
        null,
        null,
        null,
        currentMonth,
        serviceNames
      );
      currentMonth = new Date(calendar.currentMonth);
      return calendar;
    }
    
    const calendar = renderCalendar();
    popover.innerHTML = `
      <div style="background: hsl(0, 0%, 100%); border-radius: 0.75rem; padding: 0; max-width: 500px; max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
        ${calendar.html}
      </div>
    `;
    
    document.body.appendChild(popover);
    
    // Handle date selection and navigation
    setTimeout(() => {
      const calendarContainer = popover.querySelector('.range-calendars-container');
      
      // Update availability badges with real database data
      if (calendar.updateAvailability && calendarContainer) {
        calendar.updateAvailability(calendarContainer).catch(err => {
          console.error('Error updating availability:', err);
        });
      }
      
      function attachListeners() {
        // Date selection
        const dayButtons = popover.querySelectorAll('.range-calendar-day:not(.disabled):not(.empty)');
        dayButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const date = btn.getAttribute('data-date');
            
            if (selectingStart) {
              tempStart = date;
              tempEnd = null;
              selectingStart = false;
              // Update UI
              const calendar = createDateRangeCalendar(
                tempStart || null,
                null,
                null,
                null,
                null,
                currentMonth,
                serviceNames
              );
              const monthContainer = calendarContainer.querySelector('.range-calendar-month');
              if (monthContainer) {
                monthContainer.outerHTML = calendar.calendarMonthHtml;
                setTimeout(() => {
                  if (calendar.updateAvailability) {
                    calendar.updateAvailability(calendarContainer).catch(err => {
                      console.error('Error updating availability:', err);
                    });
                  }
                }, 50);
              }
              attachListeners();
            } else {
              if (date < tempStart) {
                tempEnd = tempStart;
                tempStart = date;
              } else {
                tempEnd = date;
              }
              selectingStart = true;
              
              // Set values
              cottageCheckIn = tempStart;
              cottageCheckOut = tempEnd;
              document.getElementById('cottageCheckIn').value = tempStart;
              document.getElementById('cottageCheckOut').value = tempEnd;
              updateCottageDateDisplay();
              updateCostBreakdown();
              
              // Update UI with final selection
              const calendar = createDateRangeCalendar(
                tempStart || null,
                tempEnd || null,
                null,
                null,
                null,
                currentMonth,
                serviceNames
              );
              const monthContainer = calendarContainer.querySelector('.range-calendar-month');
              if (monthContainer) {
                monthContainer.outerHTML = calendar.calendarMonthHtml;
                setTimeout(() => {
                  if (calendar.updateAvailability) {
                    calendar.updateAvailability(calendarContainer).catch(err => {
                      console.error('Error updating availability:', err);
                    });
                  }
                }, 50);
              }
              attachListeners();
            }
          });
        });
        
        // Navigation buttons
        const prevBtn = popover.querySelector('[data-action="prev"]');
        const nextBtn = popover.querySelector('[data-action="next"]');
        
        if (prevBtn) {
          prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            const calendar = createDateRangeCalendar(
              tempStart || null,
              tempEnd || null,
              null,
              null,
              null,
              currentMonth,
              serviceNames
            );
            const monthContainer = calendarContainer.querySelector('.range-calendar-month');
            if (monthContainer) {
              monthContainer.outerHTML = calendar.calendarMonthHtml;
              if (calendar.updateAvailability) {
                calendar.updateAvailability(calendarContainer).catch(err => {
                  console.error('Error updating availability:', err);
                });
              }
            }
            currentMonth = new Date(calendar.currentMonth);
            attachListeners();
          });
        }
        
        if (nextBtn) {
          nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
            const calendar = createDateRangeCalendar(
              tempStart || null,
              tempEnd || null,
              null,
              null,
              null,
              currentMonth,
              serviceNames
            );
            const monthContainer = calendarContainer.querySelector('.range-calendar-month');
            if (monthContainer) {
              monthContainer.outerHTML = calendar.calendarMonthHtml;
              if (calendar.updateAvailability) {
                calendar.updateAvailability(calendarContainer).catch(err => {
                  console.error('Error updating availability:', err);
                });
              }
            }
            currentMonth = new Date(calendar.currentMonth);
            attachListeners();
          });
        }
      }
      
      attachListeners();
      
      // Close on backdrop click
      popover.addEventListener('click', (e) => {
        if (e.target === popover) {
          popover.remove();
        }
      });
    }, 100);
  }
  
  if (cottageDateBtn) {
    cottageDateBtn.addEventListener('click', openDateRangePicker);
  }
  
  function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const date = parseDateString(dateStr);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${monthNames[date.getMonth()]} ${day}, ${year}`;
  }
  
  async function updateCottageAvailability() {
    if (!cottageCheckIn || !cottageCheckOut) {
      resetCottageAvailability();
      return;
    }
    
    const cottageServices = [
      { name: 'Open Cottage', key: 'open' },
      { name: 'Standard Cottage', key: 'standard' },
      { name: 'Family Cottage', key: 'family' }
    ];
    
    await Promise.all(
      cottageServices.map(async ({ name: serviceName, key }) => {
        try {
          const availability = await getServiceAvailability(serviceName, cottageCheckIn, cottageCheckOut);
          const statusClass = getAvailabilityStatusClass(availability.status);
          const statusIcon = getAvailabilityStatusIcon(availability.status);
          const availabilityText = formatAvailabilityText(availability.available, availability.total);
          
          const indicator = document.querySelector(`.cottage-availability[data-service="${serviceName}"]`);
          if (indicator) {
            indicator.className = `cottage-availability ${statusClass}`;
            indicator.innerHTML = `
              <span class="availability-icon">${statusIcon}</span>
              <span class="availability-text">${availabilityText}</span>
            `;
          }
          
          // Update quantity controls based on availability
          const increaseBtn = document.querySelector(`.qty-btn[data-cottage="${key}"][data-action="increase"]`);
          const decreaseBtn = document.querySelector(`.qty-btn[data-cottage="${key}"][data-action="decrease"]`);
          const currentQty = cottageQuantities[key] || 0;
          
          if (increaseBtn) {
            if (currentQty >= availability.available || availability.available === 0) {
              increaseBtn.disabled = true;
            } else {
              increaseBtn.disabled = false;
            }
          }
          
          if (decreaseBtn) {
            decreaseBtn.disabled = currentQty === 0;
          }
          
          // If current quantity exceeds availability, adjust it
          if (currentQty > availability.available) {
            cottageQuantities[key] = Math.max(0, availability.available);
            const qtyEl = document.querySelector(`.qty-value[data-cottage="${key}"]`);
            if (qtyEl) {
              qtyEl.textContent = cottageQuantities[key];
            }
            showAdminToast(`Only ${availability.available} ${serviceName}(s) available. Quantity adjusted.`, 'info');
          }
        } catch (error) {
          console.error(`Error updating availability for ${serviceName}:`, error);
          const indicator = document.querySelector(`.cottage-availability[data-service="${serviceName}"]`);
          if (indicator) {
            indicator.className = 'cottage-availability';
            indicator.innerHTML = '<span class="availability-text">Error loading availability</span>';
          }
        }
      })
    );
  }
  
  function resetCottageAvailability() {
    const indicators = document.querySelectorAll('.cottage-availability');
    indicators.forEach(el => {
      el.className = 'cottage-availability';
      el.innerHTML = '<span class="availability-text">Select dates to see availability</span>';
    });
    
    // Reset quantity control buttons
    document.querySelectorAll('.qty-btn').forEach(btn => {
      const cottage = btn.getAttribute('data-cottage');
      const action = btn.getAttribute('data-action');
      const currentQty = cottageQuantities[cottage] || 0;
      
      if (action === 'increase') {
        btn.disabled = false;
      } else if (action === 'decrease') {
        btn.disabled = currentQty === 0;
      }
    });
  }
  
  function updateCottageDateDisplay() {
    const checkinText = document.getElementById('cottage-checkin-text');
    const checkoutText = document.getElementById('cottage-checkout-text');
    
    if (cottageCheckIn && cottageCheckOut) {
      if (checkinText) checkinText.textContent = formatDateForDisplay(cottageCheckIn);
      if (checkoutText) checkoutText.textContent = formatDateForDisplay(cottageCheckOut);
      const days = calculateDays(cottageCheckIn, cottageCheckOut);
      if (cottageDaysDisplay) {
        cottageDaysDisplay.textContent = `${days} ${days === 1 ? 'day' : 'days'}`;
        cottageDaysDisplay.style.display = 'block';
      }
      updateCottageAvailability();
    } else if (cottageCheckIn) {
      if (checkinText) checkinText.textContent = formatDateForDisplay(cottageCheckIn);
      if (checkoutText) checkoutText.textContent = 'Add date';
      if (cottageDaysDisplay) cottageDaysDisplay.style.display = 'none';
      updateCottageAvailability();
    } else {
      if (checkinText) checkinText.textContent = 'Add date';
      if (checkoutText) checkoutText.textContent = 'Add date';
      if (cottageDaysDisplay) cottageDaysDisplay.style.display = 'none';
      resetCottageAvailability();
    }
    updateCostBreakdown();
  }
  
  // Cottage quantity controls
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cottage = btn.getAttribute('data-cottage');
      const action = btn.getAttribute('data-action');
      const qtyEl = document.querySelector(`.qty-value[data-cottage="${cottage}"]`);
      
      const serviceNameMap = {
        'open': 'Open Cottage',
        'standard': 'Standard Cottage',
        'family': 'Family Cottage'
      };
      const serviceName = serviceNameMap[cottage];
      
      let maxAvailable = 4; // Default max
      
      if (action === 'increase') {
        if (cottageQuantities[cottage] < maxAvailable) {
          cottageQuantities[cottage]++;
        } else {
          showAdminToast(`Only ${maxAvailable} ${serviceName}(s) available.`, 'info');
          return;
        }
      } else if (action === 'decrease' && cottageQuantities[cottage] > 0) {
        cottageQuantities[cottage]--;
      }
      
      if (qtyEl) qtyEl.textContent = cottageQuantities[cottage];
      
      // Update button states
      const increaseBtn = document.querySelector(`.qty-btn[data-cottage="${cottage}"][data-action="increase"]`);
      const decreaseBtn = document.querySelector(`.qty-btn[data-cottage="${cottage}"][data-action="decrease"]`);
      
      if (increaseBtn) {
        increaseBtn.disabled = cottageQuantities[cottage] >= maxAvailable || maxAvailable === 0;
      }
      if (decreaseBtn) {
        decreaseBtn.disabled = cottageQuantities[cottage] === 0;
      }
      
      updateCostBreakdown();
    });
  });
  
  // Cost breakdown calculation
  function updateCostBreakdown() {
    const breakdownItems = document.getElementById('breakdown-items');
    const grandTotalEl = document.getElementById('grand-total');
    let items = [];
    let total = 0;
    
    // Cottage costs only
    if (cottageCheckIn && cottageCheckOut) {
      const cottageDays = calculateDays(cottageCheckIn, cottageCheckOut);
      Object.keys(cottageQuantities).forEach(cottage => {
        const qty = cottageQuantities[cottage];
        if (qty > 0) {
          const cottageName = cottage === 'open' ? 'Open Cottage' : cottage === 'standard' ? 'Standard Cottage' : 'Family Cottage';
          const price = cottagePrices[cottage];
          const cottageTotal = qty * price * cottageDays;
          items.push({
            name: `${cottageName} × ${qty} (${cottageDays} ${cottageDays === 1 ? 'day' : 'days'})`,
            amount: cottageTotal
          });
          total += cottageTotal;
        }
      });
    }
    
    // Update UI
    if (breakdownItems) {
      if (items.length === 0) {
        breakdownItems.innerHTML = '<div style="color: var(--color-muted); text-align: center; padding: 10px 0;">Select dates and cottages to see pricing</div>';
      } else {
        breakdownItems.innerHTML = items.map(item => `
          <div class="breakdown-item">
            <span>${item.name}</span>
            <span>₱${item.amount.toLocaleString()}</span>
          </div>
        `).join('');
      }
    }
    
    if (grandTotalEl) {
      grandTotalEl.textContent = `₱${total.toLocaleString()}`;
    }
  }
  
  // Form submission - uses admin database
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    
    // Check terms
    const acceptTermsCheckbox = document.getElementById('acceptTerms');
    if (!acceptTermsCheckbox || !acceptTermsCheckbox.checked) {
      showAdminToast('Please accept the terms and conditions to continue', 'error');
      return;
    }
    
    // Validation
    if (!validateGuests()) {
      showAdminToast('Please fix guest count error', 'error');
      return;
    }
    
    if (!cottageCheckIn || !cottageCheckOut) {
      showAdminToast('Please select cottage dates', 'error');
      return;
    }
    
    // Check if at least one cottage is selected
    const hasCottages = Object.values(cottageQuantities).some(qty => qty > 0);
    if (!hasCottages) {
      showAdminToast('Please select at least one cottage', 'error');
      return;
    }
    
    // Validate availability
    try {
      const cottageServices = [
        { name: 'Open Cottage', key: 'open' },
        { name: 'Standard Cottage', key: 'standard' },
        { name: 'Family Cottage', key: 'family' }
      ];
      
      for (const { name, key } of cottageServices) {
        const qty = cottageQuantities[key] || 0;
        if (qty > 0) {
          const cottageAvailability = await getServiceAvailability(name, cottageCheckIn, cottageCheckOut);
          if (qty > cottageAvailability.available) {
            showAdminToast(`Only ${cottageAvailability.available} ${name}(s) available for the selected dates.`, 'error');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error validating availability:', error);
      showAdminToast('Error checking availability. Please try again.', 'error');
      return;
    }
    
    // Create services array (cottages only)
    const services = [];
    
    if (cottageQuantities.open > 0) {
      services.push({
        name: 'Open Cottage',
        quantity: cottageQuantities.open,
        checkIn: cottageCheckIn,
        checkOut: cottageCheckOut
      });
    }
    if (cottageQuantities.standard > 0) {
      services.push({
        name: 'Standard Cottage',
        quantity: cottageQuantities.standard,
        checkIn: cottageCheckIn,
        checkOut: cottageCheckOut
      });
    }
    if (cottageQuantities.family > 0) {
      services.push({
        name: 'Family Cottage',
        quantity: cottageQuantities.family,
        checkIn: cottageCheckIn,
        checkOut: cottageCheckOut
      });
    }
    
    // Create booking with admin database
    const result = await createWalkInBooking({
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      guests: {
        adults: parseInt(formData.get('adults')),
        children: parseInt(formData.get('children') || '0')
      },
      services: services,
      checkIn: cottageCheckIn,
      checkOut: cottageCheckOut,
      paymentMode: formData.get('paymentMode')
    });
    
    if (result.success) {
      modal.remove();
      showAdminToast('Walk-in cottage booking created successfully!', 'success');
      // Refresh bookings
      await refreshBookings();
    } else {
      showAdminToast(result.error || 'Failed to create booking', 'error');
    }
  });
  
  // Initial cost breakdown update
  updateCostBreakdown();
}

// Export init function for admin.js
export function initBookingsPage() {
  // Initialize after DOM is ready
  setTimeout(() => {
    // Reload bookings to ensure we have the latest data
    getAllBookings().then(allBookings => {
      window._currentBookings = allBookings;
      // Use filterAndRenderBookings to respect current filter selection (defaults to "all")
      filterAndRenderBookings();
    }).catch(error => {
      console.error('Error reloading bookings:', error);
    });
    
    const searchInput = document.querySelector('.bookings-search-input');
    const statusFilter = document.querySelector('.bookings-filter-status');
    const typeFilter = document.querySelector('.bookings-filter-type');
    const serviceFilter = document.querySelector('.bookings-filter-service');
    const resetBtn = document.querySelector('.bookings-reset-btn');

    // Initialize create booking buttons
    const createButtons = document.querySelectorAll('.bookings-create-btn');
    createButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        handleCreateBooking(type);
      });
    });

    // Initialize action menus
    initActionMenus();

    // Add filter event listeners
    if (searchInput) {
      searchInput.addEventListener('input', filterAndRenderBookings);
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', filterAndRenderBookings);
    }

    if (typeFilter) {
      typeFilter.addEventListener('change', filterAndRenderBookings);
    }

    if (serviceFilter) {
      serviceFilter.addEventListener('change', filterAndRenderBookings);
    }

    // Reset filters
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (typeFilter) typeFilter.value = 'all';
        if (serviceFilter) serviceFilter.value = 'all';
        filterAndRenderBookings();
      });
    }
  }, 0);
}

