import { showToast } from '../components/toast.js';
import { getUserBookings, cancelBooking, getBookingById } from '../utils/database.js';

// Format services for display
function formatServices(services) {
  if (!services || !Array.isArray(services) || services.length === 0) {
    return 'No services';
  }
  return services.map(s => `${s.service_name} (${s.quantity}x)`).join(', ');
}

// Format booking status for display
function formatStatus(status) {
  const statusMap = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'cancelled': 'Cancelled',
    'completed': 'Completed'
  };
  return statusMap[status] || status;
}

// Define cancel booking function OUTSIDE of BookingsPage to ensure it's always available
// This prevents the function from being lost or inaccessible when the page renders
window.kinaCancelBooking = async function(id, event) {
  // Prevent any default behavior that might cause page refresh
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  try {
    console.log('Cancel booking called with ID:', id);
    
    // Verify user is still logged in
    if (!window.kinaAuth || !window.kinaAuth.isLoggedIn()) {
      showToast('Your session has expired. Please log in again.', 'error');
      setTimeout(() => {
        location.hash = '#/auth';
      }, 1500);
      return false;
    }

    const user = window.kinaAuth.getCurrentUser();
    if (!user || !user.id) {
      showToast('Unable to verify your account. Please log in again.', 'error');
      setTimeout(() => {
        location.hash = '#/auth';
      }, 1500);
      return false;
    }

    // Fetch the current booking from database to get the latest status
    const booking = await getBookingById(id);
    if (!booking) {
      showToast('Booking not found', 'error');
      return false;
    }

    // Verify ownership before allowing cancellation
    if (booking.user_id && booking.user_id !== user.id) {
      showToast('You do not have permission to cancel this booking.', 'error');
      return false;
    }
    
    // If no user_id, check email match (for older bookings)
    if (!booking.user_id && booking.email !== user.email) {
      showToast('You do not have permission to cancel this booking.', 'error');
      return false;
    }
    
    if (booking.status === 'confirmed') {
      showToast('Cannot cancel confirmed bookings. Please contact support.', 'error');
      return false;
    }
    
    if (booking.status === 'cancelled') {
      showToast('Booking is already cancelled', 'info');
      return false;
    }
    
    // Show confirmation dialog
    const bookingId = booking.booking_id || booking.id;
    if (!confirm(`Are you sure you want to cancel booking ${bookingId}? This action cannot be undone.`)) {
      return false;
    }
    
    // Disable the cancel button to prevent double-clicks
    const cancelButton = document.querySelector(`button[data-booking-id="${id}"]`);
    if (cancelButton) {
      cancelButton.disabled = true;
      cancelButton.textContent = 'Cancelling...';
    }

    console.log('Calling cancelBooking with ID:', id);
    
    // Call the cancel function directly - don't skip ownership check since RLS will verify
    // The ownership check in this function is just for UI feedback, RLS is the real security
    const result = await cancelBooking(id);
    console.log('Cancel booking result:', result);
    
    if (!result) {
      console.error('Cancel booking returned null/undefined');
      showToast('Failed to cancel booking. Please try again.', 'error');
      if (cancelButton) {
        cancelButton.disabled = false;
        cancelButton.textContent = 'Cancel';
      }
      return false;
    }
    
    if (result.success === true) {
      console.log('Booking cancelled successfully!');
      showToast('Booking cancelled successfully', 'success');
      // Reload after showing success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      return true;
    } else {
      // Re-enable button on error
      if (cancelButton) {
        cancelButton.disabled = false;
        cancelButton.textContent = 'Cancel';
      }
      
      const errorMsg = result.error || 'Failed to cancel booking';
      console.error('Cancel booking failed:', errorMsg, result);
      
      // Only redirect to login for actual session expiration errors
      // Don't redirect for RLS/permission errors - those are different issues
      if (errorMsg.includes('session has expired') || errorMsg.includes('Please log in again')) {
        showToast(errorMsg, 'error');
        setTimeout(() => {
          location.hash = '#/auth';
        }, 2000);
      } else {
        // For RLS/permission errors, just show the error without redirecting
        showToast(errorMsg, 'error');
      }
      return false;
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    showToast('An error occurred. Please try again.', 'error');
    
    // Re-enable button on error
    const cancelButton = document.querySelector(`button[data-booking-id="${id}"]`);
    if (cancelButton) {
      cancelButton.disabled = false;
      cancelButton.textContent = 'Cancel';
    }
    return false;
  }
};

export async function BookingsPage(){
  // Require authentication - check if user is logged in
  if (!window.kinaAuth || !window.kinaAuth.isLoggedIn()) {
    return `
      <section class="container">
        <div class="section-head">
          <h2>My Bookings</h2>
        </div>
        <div style="text-align: center; padding: 60px 20px;">
          <p style="font-size: 1.1rem; color: var(--color-muted); margin-bottom: 24px;">
            You must be logged in to view your bookings.
          </p>
          <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <a href="#/auth" class="btn primary" style="padding: 12px 32px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">Log In</a>
            <a href="#/register" class="btn" style="padding: 12px 32px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block; border: 2px solid var(--color-accent); color: var(--color-accent);">Create Account</a>
          </div>
        </div>
      </section>
    `;
  }
  
  // Get authenticated user
  const user = window.kinaAuth.getCurrentUser();
  if (!user || !user.email) {
    return `
      <section class="container">
        <div class="section-head">
          <h2>My Bookings</h2>
        </div>
        <div style="text-align: center; padding: 60px 20px;">
          <p style="font-size: 1.1rem; color: var(--color-muted); margin-bottom: 24px;">
            Unable to retrieve user information. Please log in again.
          </p>
          <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <a href="#/auth" class="btn primary" style="padding: 12px 32px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">Log In</a>
          </div>
        </div>
      </section>
    `;
  }
  
  // Fetch bookings from database for authenticated user
  let allBookings = [];
  try {
    allBookings = await getUserBookings(user.id, user.email);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    showToast('Error loading bookings. Please try again.', 'error');
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Transform database bookings to display format
  const transformedBookings = allBookings.map(booking => {
    const serviceTitle = formatServices(booking.booking_services);
    return {
      id: booking.id,
      bookingId: booking.booking_id,
      serviceTitle: serviceTitle,
      guestName: booking.full_name,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      status: booking.status,
      email: booking.email
    };
  });
  
  // Separate bookings into current and past
  // Cancelled and completed bookings ALWAYS go to past bookings, regardless of checkout date
  const currentBookings = transformedBookings.filter(b => {
    // If cancelled or completed, always exclude from current
    const status = (b.status || '').toLowerCase();
    if (status === 'cancelled' || status === 'completed') {
      return false;
    }
    // For other statuses, check if checkout date is in the future
    const checkOut = new Date(b.checkOut);
    checkOut.setHours(0, 0, 0, 0);
    return checkOut >= today;
  });
  
  const pastBookings = transformedBookings.filter(b => {
    // Cancelled and completed bookings ALWAYS appear in past bookings
    const status = (b.status || '').toLowerCase();
    if (status === 'cancelled' || status === 'completed') {
      return true;
    }
    // For other statuses, check if checkout date is in the past
    const checkOut = new Date(b.checkOut);
    checkOut.setHours(0, 0, 0, 0);
    return checkOut < today;
  });

  // Note: window.kinaCancelBooking is now defined at the top of the file
  // This ensures it's always available when buttons are clicked

  window.showBookingsTab = (tab) => {
    const currentTab = document.getElementById('current-bookings');
    const pastTab = document.getElementById('past-bookings');
    const currentBtn = document.querySelector('.tab-btn[data-tab="current"]');
    const pastBtn = document.querySelector('.tab-btn[data-tab="past"]');
    
    if (tab === 'current') {
      currentTab.style.display = 'block';
      pastTab.style.display = 'none';
      currentBtn.classList.add('active');
      pastBtn.classList.remove('active');
    } else {
      currentTab.style.display = 'none';
      pastTab.style.display = 'block';
      currentBtn.classList.remove('active');
      pastBtn.classList.add('active');
    }
  };

  const currentRows = currentBookings.map(b => `
    <tr>
      <td>${b.bookingId || b.id}</td>
      <td>${b.guestName}</td>
      <td>${b.serviceTitle}</td>
      <td>${b.checkIn}</td>
      <td>${b.checkOut}</td>
      <td><span class="chip badge status-${b.status.toLowerCase()}">${formatStatus(b.status)}</span></td>
      <td>
        ${b.status === 'pending' ? `<button type="button" class="btn btn-cancel" data-booking-id="${b.id}" onclick="event.preventDefault(); event.stopPropagation(); window.kinaCancelBooking('${b.id}', event); return false;">Cancel</button>` : '-'}
      </td>
    </tr>
  `).join('');

  const pastRows = pastBookings.map(b => `
    <tr>
      <td>${b.bookingId || b.id}</td>
      <td>${b.guestName}</td>
      <td>${b.serviceTitle}</td>
      <td>${b.checkIn}</td>
      <td>${b.checkOut}</td>
      <td><span class="chip badge status-${b.status.toLowerCase()}">${formatStatus(b.status)}</span></td>
      <td>-</td>
    </tr>
  `).join('');

  return `
    <section class="container">
      <div class="section-head">
        <h2>My Bookings</h2>
      </div>
      <div class="bookings-controls">
        <div class="bookings-tabs">
          <button class="tab-btn active" data-tab="current" onclick="showBookingsTab('current')">Current Bookings</button>
          <button class="tab-btn" data-tab="past" onclick="showBookingsTab('past')">Past Bookings</button>
        </div>
      </div>
      
      <div id="current-bookings">
        <table class="table" aria-label="Current bookings table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Guest Name</th>
              <th>Services</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${currentBookings.length === 0 ? '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--color-muted);">No current bookings</td></tr>' : currentRows}</tbody>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="#/packages" class="btn primary" style="padding: 12px 32px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">Make a Booking</a>
        </div>
      </div>
      
      <div id="past-bookings" style="display: none;">
        <table class="table" aria-label="Past bookings table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Guest Name</th>
              <th>Services</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${pastBookings.length === 0 ? '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--color-muted);">No past bookings</td></tr>' : pastRows}</tbody>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="#/packages" class="btn primary" style="padding: 12px 32px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">Make a Booking</a>
        </div>
      </div>
      
      <style>
        .bookings-controls {
          margin-bottom: 20px;
        }
        
        .bookings-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        
        .tab-btn {
          padding: 10px 20px;
          border: 2px solid var(--color-accent);
          background: white;
          color: var(--color-accent);
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .tab-btn:hover {
          background: var(--color-bg);
        }
        
        .tab-btn.active {
          background: var(--color-accent);
          color: white;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .table th {
          background: var(--color-accent);
          color: white;
          padding: 16px;
          text-align: left;
          font-weight: 600;
        }
        
        .table td {
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }
        
        .table tr:hover {
          background: var(--color-bg);
        }
        
        .chip.badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .chip.badge.status-confirmed {
          background: #d4edda;
          color: #155724;
        }
        
        .chip.badge.status-pending {
          background: #fff3cd;
          color: #856404;
        }
        
        .chip.badge.status-cancelled {
          background: #f8d7da;
          color: #721c24;
        }
        
        .chip.badge.status-completed {
          background: #d1ecf1;
          color: #0c5460;
        }
        
        .btn-cancel {
          background: #ef4444;
          color: white;
          border: 1px solid #ef4444;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-cancel:hover {
          background: #dc2626;
          border-color: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
        }
        
        .btn-cancel:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
        }
        
        @media (max-width: 768px) {
          .bookings-tabs {
            flex-direction: column;
          }
          
          .tab-btn {
            width: 100%;
          }
          
          .table {
            font-size: 14px;
          }
          
          .table th,
          .table td {
            padding: 12px 8px;
          }
        }
      </style>
    </section>`;
}

// Export initialization function to ensure handlers are attached after page render
export function initBookingsPage() {
  // Simple initialization - just ensure the function is available
  // The onclick handlers in the HTML will work fine
  // No need to remove onclick or add event listeners - that was causing issues
  console.log('Bookings page initialized. Cancel function available:', typeof window.kinaCancelBooking);
}


