// Date range picker utilities
function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateString(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Update availability badges with real database data
async function updateAvailabilityBadges(container) {
  if (!container) {
    console.warn('updateAvailabilityBadges: container is null');
    return;
  }
  
  const badges = container.querySelectorAll('.availability-badge[data-service][data-date]');
  console.log(`updateAvailabilityBadges: Found ${badges.length} badges to update`);
  
  if (badges.length === 0) {
    console.warn('updateAvailabilityBadges: No badges found with data-service and data-date attributes');
    return;
  }
  
  // Import availability utility
  const { getServiceAvailabilityForDate } = await import('../utils/availability.js');
  
  // Update each badge
  const updatePromises = Array.from(badges).map(async (badge) => {
    const serviceName = badge.getAttribute('data-service');
    const dateStr = badge.getAttribute('data-date');
    
    if (!serviceName || !dateStr) {
      console.warn('updateAvailabilityBadges: Badge missing serviceName or dateStr', { serviceName, dateStr });
      return;
    }
    
    try {
      // Get availability from database (same as calendar tab)
      const availability = await getServiceAvailabilityForDate(serviceName, dateStr);
      const total = availability.total || (serviceName.includes('Function Hall') ? 1 : 4);
      const available = availability.available ?? 0;
      
      console.log(`updateAvailabilityBadges: ${serviceName} on ${dateStr} - Available: ${available}/${total}, Status: ${availability.status}`);
      
      // Update badge text - show availability like calendar tab
      // For function halls (total=1): show "1" if available, "0" if not
      // For rooms/cottages (total>1): show "X/Y" format
      let badgeText;
      if (total === 1) {
        badgeText = available > 0 ? '1' : '0';
      } else {
        if (available === 0) {
          badgeText = '0';
        } else if (available === total) {
          badgeText = total.toString();
        } else {
          badgeText = `${available}/${total}`;
        }
      }
      
      badge.textContent = badgeText;
      
      // Update badge class based on availability status (same logic as calendar tab)
      badge.classList.remove('badge-loading', 'badge-available', 'badge-low', 'badge-full', 'badge-error');
      
      // Use status from availability if available, otherwise calculate
      const status = availability.status || (available === 0 ? 'fully-booked' : (available <= Math.ceil(total * 0.25) ? 'low-stock' : 'available'));
      
      if (status === 'fully-booked' || available === 0) {
        badge.classList.add('badge-full');
      } else if (status === 'low-stock' || available <= Math.ceil(total * 0.25)) {
        badge.classList.add('badge-low');
      } else {
        badge.classList.add('badge-available');
      }
    } catch (error) {
      console.error(`Error updating availability badge for ${serviceName} on ${dateStr}:`, error);
      badge.textContent = '?';
      badge.classList.remove('badge-loading');
      badge.classList.add('badge-error');
    }
  });
  
  await Promise.all(updatePromises);
  console.log('updateAvailabilityBadges: All badges updated');
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const date = parseDateString(dateStr);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1; // Minimum 1 day
}

// Create single-date calendar for function halls
function createSingleDateCalendar(selectedDate, onSelect, minDate = null, viewMonth = null, serviceNames = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateString(today);
  
  // Parse min date if provided
  let minDateObj = null;
  if (minDate) {
    minDateObj = typeof minDate === 'string' ? parseDateString(minDate) : minDate;
    minDateObj.setHours(0, 0, 0, 0);
  }
  
  // Use provided viewMonth or default to current month
  let currentMonth = viewMonth ? new Date(viewMonth) : new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  function renderCalendar(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    let html = `
      <div class="single-calendar-month">
        <div class="single-calendar-header">
          <button type="button" class="single-calendar-nav-btn" data-action="prev">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h4>${monthNames[month]} ${year}</h4>
          <button type="button" class="single-calendar-nav-btn" data-action="next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
        <div class="single-calendar-grid">
          <div class="single-calendar-day-name">Su</div>
          <div class="single-calendar-day-name">Mo</div>
          <div class="single-calendar-day-name">Tu</div>
          <div class="single-calendar-day-name">We</div>
          <div class="single-calendar-day-name">Th</div>
          <div class="single-calendar-day-name">Fr</div>
          <div class="single-calendar-day-name">Sa</div>
    `;
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      html += '<div class="single-calendar-day empty"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      cellDate.setHours(0, 0, 0, 0);
      const dateStr = formatDateString(cellDate);
      const isPast = cellDate < today;
      const isBeforeMin = minDateObj && cellDate < minDateObj;
      const isDisabled = isPast || isBeforeMin;
      const isSelected = dateStr === selectedDate;
      
      // Get availability badges for specified services
      let availabilityBadges = '';
      if (serviceNames && Array.isArray(serviceNames) && serviceNames.length > 0 && !isDisabled) {
        // Generate badges - will be updated with real data asynchronously
        const badges = serviceNames.map(serviceName => {
          // Placeholder badge - will be updated with real availability
          const total = (serviceName.includes('Function Hall')) ? 1 : 4;
          return `<span class="availability-badge badge-loading" data-service="${serviceName}" data-date="${dateStr}">...</span>`;
        }).join('');
        availabilityBadges = `<div class="availability-badges">${badges}</div>`;
      }
      
      html += `
        <button 
          type="button"
          class="single-calendar-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}"
          ${isDisabled ? 'disabled' : ''}
          data-date="${dateStr}"
        >
          <span class="day-number">${day}</span>
          ${availabilityBadges}
        </button>
      `;
    }
    
    html += '</div></div>';
    return html;
  }
  
  const calendarHtml = renderCalendar(currentMonth);
  
  return {
    html: `
      <div class="single-date-picker">
        <div class="single-calendar-container">
          ${calendarHtml}
        </div>
        <div class="single-picker-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.date-range-popover').remove()">Cancel</button>
          <button type="button" class="btn-primary" onclick="this.closest('.date-range-popover').remove()">Done</button>
        </div>
      </div>
    `,
    calendarMonthHtml: calendarHtml,
    currentMonth: currentMonth,
    updateAvailability: async (container) => {
      await updateAvailabilityBadges(container);
    }
  };
}

// Generate mock availability data for rooms, cottages, and function halls
function generateAvailability(dateStr, type) {
  const date = parseDateString(dateStr);
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Simulate realistic booking patterns
  const weekendFactor = isWeekend ? 0.4 : 0.15;
  const randomFactor = (dayOfMonth % 7) / 10;
  
  if (type === 'room') {
    const total = 4;
    const booked = Math.floor((weekendFactor + randomFactor) * total);
    return Math.max(0, total - booked);
  } else if (type === 'cottage') {
    const total = 4; // Total cottages of each type
    const booked = Math.floor((weekendFactor + randomFactor * 0.5) * total);
    return Math.max(0, total - booked);
  } else if (type === 'functionHall') {
    // Function halls: 2 total (Grand + Intimate)
    const total = 2;
    const booked = Math.floor((weekendFactor + randomFactor * 0.8) * total);
    return Math.max(0, total - booked);
  }
  return 0;
}

// Create single-month calendar for date range with availability
function createDateRangeCalendar(startDate, endDate, onSelect, minDate = null, maxDate = null, viewMonth = null, serviceNames = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateString(today);
  
  // Parse min/max dates if provided as strings
  let minDateObj = null;
  let maxDateObj = null;
  if (minDate) {
    minDateObj = typeof minDate === 'string' ? parseDateString(minDate) : minDate;
    minDateObj.setHours(0, 0, 0, 0);
  }
  if (maxDate) {
    maxDateObj = typeof maxDate === 'string' ? parseDateString(maxDate) : maxDate;
    maxDateObj.setHours(0, 0, 0, 0);
  }
  
  // Use provided viewMonth or default to current month
  let currentMonth = viewMonth ? new Date(viewMonth) : new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  function renderCalendar(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    let html = `
      <div class="range-calendar-month">
        <div class="range-calendar-header">
          <button type="button" class="range-calendar-nav-btn" data-action="prev">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h4>${monthNames[month]} ${year}</h4>
          <button type="button" class="range-calendar-nav-btn" data-action="next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
        <div class="range-calendar-grid">
          <div class="range-calendar-day-name">Su</div>
          <div class="range-calendar-day-name">Mo</div>
          <div class="range-calendar-day-name">Tu</div>
          <div class="range-calendar-day-name">We</div>
          <div class="range-calendar-day-name">Th</div>
          <div class="range-calendar-day-name">Fr</div>
          <div class="range-calendar-day-name">Sa</div>
    `;
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      html += '<div class="range-calendar-day empty"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      cellDate.setHours(0, 0, 0, 0);
      const dateStr = formatDateString(cellDate);
      const isPast = cellDate < today; // Allow today to be selected
      const isBeforeMin = minDateObj && cellDate < minDateObj;
      const isAfterMax = maxDateObj && cellDate > maxDateObj;
      const isDisabled = isPast || isBeforeMin || isAfterMax;
      const isStart = dateStr === startDate;
      const isEnd = dateStr === endDate;
      const isInRange = startDate && endDate && dateStr > startDate && dateStr < endDate;
      
      // Get availability badges for specified services
      let availabilityBadges = '';
      if (serviceNames && Array.isArray(serviceNames) && serviceNames.length > 0 && !isDisabled) {
        // Generate badges - will be updated with real data asynchronously
        const badges = serviceNames.map(serviceName => {
          // Placeholder badge - will be updated with real availability
          const total = (serviceName.includes('Function Hall')) ? 1 : 4;
          return `<span class="availability-badge badge-loading" data-service="${serviceName}" data-date="${dateStr}">...</span>`;
        }).join('');
        availabilityBadges = `<div class="availability-badges">${badges}</div>`;
      }
      
      html += `
        <button 
          class="range-calendar-day ${isDisabled ? 'disabled' : ''} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''} ${isInRange ? 'in-range' : ''}"
          ${isDisabled ? 'disabled' : ''}
          data-date="${dateStr}"
        >
          <span class="day-number">${day}</span>
          ${availabilityBadges}
        </button>
      `;
    }
    
    html += '</div></div>';
    return html;
  }
  
  const calendarHtml = renderCalendar(currentMonth);
  
  return {
    html: `
      <div class="date-range-picker">
        <div class="range-calendars-container">
          ${calendarHtml}
        </div>
        <div class="range-picker-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.date-range-popover').remove()">Cancel</button>
          <button type="button" class="btn-primary" onclick="this.closest('.date-range-popover').remove()">Done</button>
        </div>
      </div>
    `,
    calendarMonthHtml: calendarHtml,
    currentMonth: currentMonth,
    updateAvailability: async (container) => {
      await updateAvailabilityBadges(container);
    }
  };
}

// Main booking form component
export function createBookingForm(packageName, packageDetails) {
  // Check if this is a function hall booking
  const isFunctionHall = packageDetails?.category === 'functionHall';
  const isCottage = packageDetails?.category === 'cottage';
  
  // If function hall, return function hall specific form
  if (isFunctionHall) {
    return createFunctionHallForm(packageName, packageDetails);
  }
  
  // If cottage only, return cottage specific form
  if (isCottage) {
    return createCottageForm(packageName, packageDetails);
  }
  
  // Otherwise return the standard room/cottage form
  return `
    <div class="booking-dialog">
      <div class="booking-dialog-header">
        <h2>Book Your Stay</h2>
        <button class="dialog-close" onclick="this.closest('.modal').remove()" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="booking-dialog-content">
        <form id="comprehensive-booking-form">
          <!-- Guest Information -->
          <section class="form-section">
            <h3 class="section-title">Guest Information</h3>
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <input type="text" id="fullName" name="fullName" required placeholder="Juan Dela Cruz" class="form-input">
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required placeholder="juan@example.com" class="form-input">
            </div>
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" required placeholder="+63 912 345 6789" class="form-input">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="adults">Adults</label>
                <input type="number" id="adults" name="adults" min="1" max="4" value="1" required class="form-input">
              </div>
              <div class="form-group">
                <label for="children">Children</label>
                <input type="number" id="children" name="children" min="0" max="3" value="0" class="form-input">
              </div>
            </div>
            <div id="guest-error" class="error-message" style="display: none;"></div>
          </section>
          
          <!-- Room Details -->
          <section class="form-section">
            <div class="service-header">
              <div>
                <h3 class="section-title">Room Details</h3>
                <p class="section-subtitle">${packageName} - ${packageDetails?.price || '₱2,000 per day'}</p>
              </div>
              <div id="room-availability-indicator" class="availability-indicator">
                <span class="availability-text">Select dates to see availability</span>
              </div>
            </div>
            <div class="form-group">
              <label for="numRooms">Number of Rooms <span class="label-hint">(Max 4)</span></label>
              <input type="number" id="numRooms" name="numRooms" min="1" max="4" value="1" required class="form-input">
            </div>
            <div class="form-group">
              <label>Select Dates</label>
              <button type="button" class="date-range-btn" id="room-date-range-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <div class="date-range-btn-content">
                  <div class="date-range-section">
                    <span class="date-range-label">Check-in</span>
                    <span class="date-range-value" id="room-checkin-text">Add date</span>
                  </div>
                  <div class="date-range-divider"></div>
                  <div class="date-range-section">
                    <span class="date-range-label">Check-out</span>
                    <span class="date-range-value" id="room-checkout-text">Add date</span>
                  </div>
                </div>
              </button>
              <input type="hidden" id="roomCheckIn" name="roomCheckIn">
              <input type="hidden" id="roomCheckOut" name="roomCheckOut">
              <div id="room-days" class="days-display" style="display: none;"></div>
            </div>
          </section>
          
          <!-- Cottage Selection (Optional) -->
          <section class="form-section">
            <label class="checkbox-label">
              <input type="checkbox" id="addCottages" name="addCottages">
              <span>Add Cottages <span class="optional-text">(Optional)</span></span>
            </label>
            <div id="cottage-section" class="cottage-section" style="display: none; position: relative;">
              <div class="cottage-row" data-service="Open Cottage">
                <div class="cottage-info">
                  <span class="cottage-name">Open Cottage</span>
                  <span class="cottage-price">₱300</span>
                  <div class="cottage-availability" data-service="Open Cottage">
                    <span class="availability-text">Select dates to see availability</span>
                  </div>
                </div>
                <div class="quantity-controls">
                  <button type="button" class="qty-btn" data-cottage="open" data-action="decrease">−</button>
                  <span class="qty-value" data-cottage="open">0</span>
                  <button type="button" class="qty-btn" data-cottage="open" data-action="increase">+</button>
                </div>
              </div>
              <div class="cottage-row" data-service="Standard Cottage">
                <div class="cottage-info">
                  <span class="cottage-name">Standard Cottage</span>
                  <span class="cottage-price">₱400</span>
                  <div class="cottage-availability" data-service="Standard Cottage">
                    <span class="availability-text">Select dates to see availability</span>
                  </div>
                </div>
                <div class="quantity-controls">
                  <button type="button" class="qty-btn" data-cottage="standard" data-action="decrease">−</button>
                  <span class="qty-value" data-cottage="standard">0</span>
                  <button type="button" class="qty-btn" data-cottage="standard" data-action="increase">+</button>
                </div>
              </div>
              <div class="cottage-row" data-service="Family Cottage">
                <div class="cottage-info">
                  <span class="cottage-name">Family Cottage</span>
                  <span class="cottage-price">₱500</span>
                  <div class="cottage-availability" data-service="Family Cottage">
                    <span class="availability-text">Select dates to see availability</span>
                  </div>
                </div>
                <div class="quantity-controls">
                  <button type="button" class="qty-btn" data-cottage="family" data-action="decrease">−</button>
                  <span class="qty-value" data-cottage="family">0</span>
                  <button type="button" class="qty-btn" data-cottage="family" data-action="increase">+</button>
                </div>
              </div>
              <div class="form-group" style="margin-top: 16px;">
                <label>Cottage Date Range</label>
                <button type="button" class="date-range-btn" id="cottage-date-range-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <div class="date-range-btn-content">
                    <div class="date-range-section">
                      <span class="date-range-label">Check-in</span>
                      <span class="date-range-value" id="cottage-checkin-text">Add date</span>
                    </div>
                    <div class="date-range-divider"></div>
                    <div class="date-range-section">
                      <span class="date-range-label">Check-out</span>
                      <span class="date-range-value" id="cottage-checkout-text">Add date</span>
                    </div>
                  </div>
                </button>
                <input type="hidden" id="cottageCheckIn" name="cottageCheckIn">
                <input type="hidden" id="cottageCheckOut" name="cottageCheckOut">
                <div id="cottage-days" class="days-display" style="display: none;"></div>
              </div>
            </div>
          </section>
          
          <!-- Payment Mode -->
          <section class="form-section">
            <h3 class="section-title">Payment Mode</h3>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="paymentMode" value="gcash" checked>
                <span>GCash</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="paymentMode" value="bank">
                <span>Bank Transfer</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="paymentMode" value="card">
                <span>Credit/Debit Card</span>
              </label>
            </div>
          </section>
          
          <!-- Cost Breakdown -->
          <section class="form-section cost-breakdown">
            <h3 class="section-title">Cost Breakdown</h3>
            <div id="breakdown-items"></div>
            <div class="breakdown-separator"></div>
            <div class="breakdown-total">
              <span>Grand Total:</span>
              <span id="grand-total">₱0</span>
            </div>
          </section>
          
          <!-- Terms & Submit -->
          <section class="form-section">
            <label class="checkbox-label">
              <input type="checkbox" id="acceptTerms" name="acceptTerms" required>
              <span>I agree to the terms and conditions</span>
            </label>
            <button type="submit" class="btn-submit">Confirm Booking</button>
          </section>
        </form>
      </div>
      
      <style>
        .modal .card {
          border: none;
          box-shadow: none;
          background: transparent;
          padding: 0;
          max-width: none;
          width: auto;
        }
        
        .booking-dialog {
          max-width: 42rem;
          width: 100%;
          background: hsl(0, 0%, 100%);
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        
        .booking-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid hsl(215, 20%, 88%);
          background: hsl(0, 0%, 100%);
        }
        
        .booking-dialog-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: hsl(215, 25%, 15%);
        }
        
        .dialog-close {
          background: transparent;
          border: none;
          color: hsl(215, 25%, 15%);
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          opacity: 0.6;
        }
        
        .dialog-close:hover {
          opacity: 1;
          background: hsl(195, 60%, 96%);
        }
        
        .booking-dialog-content {
          max-height: 85vh;
          overflow-y: auto;
          padding: 1.5rem;
          background: hsl(0, 0%, 100%);
        }
        
        .booking-dialog-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .booking-dialog-content::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .booking-dialog-content::-webkit-scrollbar-thumb {
          background: hsl(215, 20%, 88%);
          border-radius: 4px;
        }
        
        .form-section {
          margin-bottom: 2rem;
          padding: 0;
        }
        
        .form-section:last-child {
          margin-bottom: 0;
        }
        
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: hsl(215, 25%, 15%);
          margin: 0 0 1rem 0;
        }
        
        .section-subtitle {
          color: hsl(215, 15%, 50%);
          font-size: 0.875rem;
          margin: -0.5rem 0 1rem 0;
          font-weight: 400;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group:last-child {
          margin-bottom: 0;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: hsl(215, 25%, 15%);
          font-size: 0.875rem;
        }
        
        .label-hint {
          font-weight: 400;
          color: hsl(215, 15%, 50%);
          font-size: 0.8rem;
        }
        
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-family: inherit;
          transition: all 0.2s ease;
          box-sizing: border-box;
          background: hsl(0, 0%, 100%);
          color: hsl(215, 25%, 15%);
        }
        
        .form-input:hover {
          border-color: hsl(215, 20%, 80%);
        }
        
        .form-input:focus {
          outline: none;
          border-color: hsl(195, 85%, 45%);
          box-shadow: 0 0 0 3px hsla(195, 85%, 45%, 0.1);
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
        
        /* Clean Minimal Date Range Button - Check-in/Check-out Separation */
        .date-range-btn {
          width: 100%;
          padding: 1rem 1.5rem;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.75rem;
          background: hsl(0, 0%, 100%);
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          color: hsl(215, 25%, 15%);
          text-align: left;
          justify-content: flex-start;
          min-height: 64px;
        }
        
        .date-range-btn svg {
          flex-shrink: 0;
          color: hsl(195, 85%, 45%);
          width: 20px;
          height: 20px;
        }
        
        .date-range-btn:hover {
          border-color: hsl(195, 85%, 45%);
          background: hsl(195, 60%, 96%);
        }
        
        .date-range-btn-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }
        
        .date-range-section {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        .date-range-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: hsl(215, 15%, 50%);
          margin-bottom: 0.25rem;
          text-transform: none;
        }
        
        .date-range-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(215, 25%, 15%);
        }
        
        .date-range-divider {
          width: 1px;
          height: 32px;
          background: hsl(215, 20%, 88%);
          flex-shrink: 0;
        }
        
        .days-display {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: hsl(215, 15%, 50%);
        }
        
        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .checkbox-label input[type="checkbox"] {
          width: 1.125rem;
          height: 1.125rem;
          cursor: pointer;
          accent-color: hsl(195, 85%, 45%);
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        
        .checkbox-label span {
          color: hsl(215, 25%, 15%);
        }
        
        .optional-text {
          color: hsl(215, 15%, 50%);
          font-weight: 400;
        }
        
        .cottage-section {
          margin-top: 1rem;
          padding: 1rem;
          border: 1px solid hsl(215, 20%, 88%);
          border-left: 3px solid hsl(195, 85%, 45%);
          border-radius: 0.75rem;
          background: hsl(195, 60%, 96%);
        }
        
        .cottage-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid hsl(215, 20%, 88%);
        }
        
        .cottage-row:last-child {
          border-bottom: none;
        }
        
        .cottage-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .cottage-name {
          font-weight: 500;
          color: hsl(215, 25%, 15%);
        }
        
        .cottage-price {
          font-size: 0.875rem;
          color: hsl(215, 15%, 50%);
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .qty-btn {
          width: 2rem;
          height: 2rem;
          border: 1.5px solid hsl(215, 20%, 88%);
          border-radius: 0.5rem;
          background: hsl(0, 0%, 100%);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: hsl(215, 25%, 15%);
          transition: all 0.2s ease;
        }
        
        .qty-btn:hover:not(:disabled) {
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
          border-color: hsl(195, 85%, 45%);
        }
        
        .qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .qty-value {
          min-width: 2rem;
          text-align: center;
          font-weight: 600;
          color: hsl(215, 25%, 15%);
        }
        
        .radio-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        
        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.75rem;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background: hsl(0, 0%, 100%);
        }
        
        .radio-label:hover {
          border-color: hsl(195, 85%, 45%);
          background: hsl(195, 60%, 96%);
        }
        
        .radio-label input[type="radio"] {
          accent-color: hsl(195, 85%, 45%);
        }
        
        .radio-label input[type="radio"]:checked + span {
          font-weight: 600;
          color: hsl(215, 25%, 15%);
        }
        
        .radio-label span {
          color: hsl(215, 25%, 15%);
        }
        
        .cost-breakdown {
          background: hsl(195, 60%, 96%);
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.75rem;
          padding: 1.25rem;
        }
        
        #breakdown-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: hsl(215, 25%, 15%);
        }
        
        .breakdown-separator {
          height: 1px;
          background: hsl(215, 20%, 88%);
          margin: 0.75rem 0;
        }
        
        .breakdown-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.125rem;
          font-weight: 700;
          color: hsl(195, 85%, 45%);
        }
        
        .btn-submit {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.75rem;
        }
        
        .btn-submit:hover {
          background: hsl(195, 85%, 55%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px hsla(195, 85%, 45%, 0.3);
        }
        
        /* Clean Minimal Calendar - Teal/Blue Design System */
        .date-range-picker {
          background: hsl(0, 0%, 100%);
          border-radius: 0.75rem;
          padding: 1.5rem;
        }
        
        .range-calendars-container {
          display: block;
        }
        
        .range-calendar-month {
          min-width: 0;
        }
        
        .range-calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 0 1.5rem 0;
        }
        
        .range-calendar-header h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          text-align: center;
          flex: 1;
          color: hsl(215, 25%, 15%);
        }
        
        .range-calendar-nav-btn {
          background: transparent;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.5rem;
          padding: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(215, 25%, 15%);
          transition: all 0.2s ease;
        }
        
        .range-calendar-nav-btn:hover:not(:disabled) {
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
          border-color: hsl(195, 85%, 45%);
        }
        
        .range-calendar-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .range-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.375rem;
        }
        
        .range-calendar-day-name {
          text-align: center;
          font-weight: 500;
          font-size: 0.75rem;
          color: hsl(215, 15%, 50%);
          padding: 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .range-calendar-day {
          aspect-ratio: 1;
          min-height: 48px;
          border: 1px solid hsl(215, 20%, 88%);
          background: hsl(0, 0%, 100%);
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: hsl(215, 25%, 15%);
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0.375rem;
        }
        
        .range-calendar-day .day-number {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .range-calendar-day .availability-badges {
          position: absolute;
          bottom: 2px;
          right: 2px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-end;
        }
        
        .range-calendar-day .availability-badge {
          font-size: 0.5rem;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 4px;
          line-height: 1.2;
          white-space: nowrap;
        }
        
        .range-calendar-day .availability-badge.badge-available {
          background: hsl(142, 76%, 36%);
          color: hsl(0, 0%, 100%);
        }
        
        .range-calendar-day .availability-badge.badge-low {
          background: hsl(45, 93%, 47%);
          color: hsl(0, 0%, 100%);
        }
        
        .range-calendar-day .availability-badge.badge-full {
          background: hsl(0, 84%, 60%);
          color: hsl(0, 0%, 100%);
        }
        
        .range-calendar-day:hover:not(:disabled):not(.empty) {
          background: hsl(195, 60%, 96%);
          border-color: hsl(195, 85%, 45%);
        }
        
        .range-calendar-day.start,
        .range-calendar-day.end {
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
          border-color: hsl(195, 85%, 45%);
          font-weight: 600;
        }
        
        .range-calendar-day.start .day-number,
        .range-calendar-day.end .day-number {
          color: hsl(0, 0%, 100%);
        }
        
        .range-calendar-day.start .availability-badge,
        .range-calendar-day.end .availability-badge {
          opacity: 0.9;
        }
        
        .range-calendar-day.in-range {
          background: hsl(195, 60%, 96%);
          border-color: hsl(195, 85%, 45%);
        }
        
        .range-calendar-day.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          background: hsl(210, 30%, 96%);
        }
        
        .range-calendar-day.disabled .availability-badge {
          display: none;
        }
        
        .range-calendar-day.empty {
          border: none;
          background: transparent;
          cursor: default;
        }
        
        .range-picker-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid hsl(215, 20%, 88%);
        }
        
        .btn-secondary,
        .btn-primary {
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .btn-secondary {
          background: hsl(0, 0%, 100%);
          color: hsl(215, 25%, 15%);
          border: 1px solid hsl(215, 20%, 88%);
        }
        
        .btn-secondary:hover {
          background: hsl(195, 60%, 96%);
        }
        
        .btn-primary {
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
        }
        
        .btn-primary:hover {
          background: hsl(195, 85%, 55%);
        }
        
        @media (max-width: 768px) {
          .booking-dialog {
            max-width: calc(100vw - 2rem);
            margin: 1rem;
          }
          
          .booking-dialog-content {
            padding: 1.5rem;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .radio-group {
            grid-template-columns: 1fr;
          }
          
        }
      </style>
    </div>
  `;
}

// Cottage-only booking form
function createCottageForm(packageName, packageDetails) {
  return `
    <div class="booking-dialog">
      <div class="booking-dialog-header">
        <h2>Book Cottage</h2>
        <button class="dialog-close" onclick="this.closest('.modal').remove()" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="booking-dialog-content">
        <form id="comprehensive-booking-form">
          <!-- Guest Information -->
          <section class="form-section">
            <h3 class="section-title">Guest Information</h3>
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <input type="text" id="fullName" name="fullName" required placeholder="Juan Dela Cruz" class="form-input">
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required placeholder="juan@example.com" class="form-input">
            </div>
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" required placeholder="+63 912 345 6789" class="form-input">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="adults">Adults</label>
                <input type="number" id="adults" name="adults" min="1" value="1" required class="form-input">
              </div>
              <div class="form-group">
                <label for="children">Children</label>
                <input type="number" id="children" name="children" min="0" value="0" class="form-input">
              </div>
            </div>
            <div id="guest-error" class="error-message" style="display: none;"></div>
          </section>
          
          <!-- Cottage Selection -->
          <section class="form-section">
            <h3 class="section-title">Select Cottages</h3>
            <p class="section-subtitle">Choose one or more cottage types</p>
            <div class="cottage-section" style="display: block; position: relative;">
              <div class="cottage-row" data-service="Open Cottage">
                <div class="cottage-info">
                  <span class="cottage-name">Open Cottage</span>
                  <span class="cottage-price">₱300</span>
                  <div class="cottage-availability" data-service="Open Cottage">
                    <span class="availability-text">Select dates to see availability</span>
                  </div>
                </div>
                <div class="quantity-controls">
                  <button type="button" class="qty-btn" data-cottage="open" data-action="decrease">−</button>
                  <span class="qty-value" data-cottage="open">0</span>
                  <button type="button" class="qty-btn" data-cottage="open" data-action="increase">+</button>
                </div>
              </div>
              <div class="cottage-row" data-service="Standard Cottage">
                <div class="cottage-info">
                  <span class="cottage-name">Standard Cottage</span>
                  <span class="cottage-price">₱400</span>
                  <div class="cottage-availability" data-service="Standard Cottage">
                    <span class="availability-text">Select dates to see availability</span>
                  </div>
                </div>
                <div class="quantity-controls">
                  <button type="button" class="qty-btn" data-cottage="standard" data-action="decrease">−</button>
                  <span class="qty-value" data-cottage="standard">0</span>
                  <button type="button" class="qty-btn" data-cottage="standard" data-action="increase">+</button>
                </div>
              </div>
              <div class="cottage-row" data-service="Family Cottage">
                <div class="cottage-info">
                  <span class="cottage-name">Family Cottage</span>
                  <span class="cottage-price">₱500</span>
                  <div class="cottage-availability" data-service="Family Cottage">
                    <span class="availability-text">Select dates to see availability</span>
                  </div>
                </div>
                <div class="quantity-controls">
                  <button type="button" class="qty-btn" data-cottage="family" data-action="decrease">−</button>
                  <span class="qty-value" data-cottage="family">0</span>
                  <button type="button" class="qty-btn" data-cottage="family" data-action="increase">+</button>
                </div>
              </div>
              <div class="form-group" style="margin-top: 16px;">
                <label>Cottage Date Range</label>
                <button type="button" class="date-range-btn" id="cottage-date-range-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <div class="date-range-btn-content">
                    <div class="date-range-section">
                      <span class="date-range-label">Check-in</span>
                      <span class="date-range-value" id="cottage-checkin-text">Add date</span>
                    </div>
                    <div class="date-range-divider"></div>
                    <div class="date-range-section">
                      <span class="date-range-label">Check-out</span>
                      <span class="date-range-value" id="cottage-checkout-text">Add date</span>
                    </div>
                  </div>
                </button>
                <input type="hidden" id="cottageCheckIn" name="cottageCheckIn">
                <input type="hidden" id="cottageCheckOut" name="cottageCheckOut">
                <div id="cottage-days" class="days-display" style="display: none;"></div>
              </div>
            </div>
          </section>
          
          <!-- Payment Mode -->
          <section class="form-section">
            <h3 class="section-title">Payment Mode</h3>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="paymentMode" value="gcash" checked>
                <span>GCash</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="paymentMode" value="bank">
                <span>Bank Transfer</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="paymentMode" value="card">
                <span>Credit/Debit Card</span>
              </label>
            </div>
          </section>
          
          <!-- Cost Breakdown -->
          <section class="form-section cost-breakdown">
            <h3 class="section-title">Cost Breakdown</h3>
            <div id="breakdown-items"></div>
            <div class="breakdown-separator"></div>
            <div class="breakdown-total">
              <span>Grand Total:</span>
              <span id="grand-total">₱0</span>
            </div>
          </section>
          
          <!-- Terms & Submit -->
          <section class="form-section">
            <label class="checkbox-label">
              <input type="checkbox" id="acceptTerms" name="acceptTerms" required>
              <span>I agree to the terms and conditions</span>
            </label>
            <button type="submit" class="btn-submit">Confirm Booking</button>
          </section>
        </form>
      </div>
      
      <style>
        .modal .card {
          border: none;
          box-shadow: none;
          background: transparent;
          padding: 0;
          max-width: none;
          width: auto;
        }
        
        .booking-dialog {
          max-width: 42rem;
          width: 100%;
          background: hsl(0, 0%, 100%);
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        
        .booking-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid hsl(215, 20%, 88%);
          background: hsl(0, 0%, 100%);
        }
        
        .booking-dialog-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: hsl(215, 25%, 15%);
        }
        
        .dialog-close {
          background: transparent;
          border: none;
          color: hsl(215, 25%, 15%);
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          opacity: 0.6;
        }
        
        .dialog-close:hover {
          opacity: 1;
          background: hsl(195, 60%, 96%);
        }
        
        .booking-dialog-content {
          max-height: 85vh;
          overflow-y: auto;
          padding: 1.5rem;
          background: hsl(0, 0%, 100%);
        }
        
        .booking-dialog-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .booking-dialog-content::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .booking-dialog-content::-webkit-scrollbar-thumb {
          background: hsl(215, 20%, 88%);
          border-radius: 4px;
        }
        
        .form-section {
          margin-bottom: 2rem;
          padding: 0;
        }
        
        .form-section:last-child {
          margin-bottom: 0;
        }
        
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: hsl(215, 25%, 15%);
          margin: 0 0 1rem 0;
        }
        
        .section-subtitle {
          color: hsl(215, 15%, 50%);
          font-size: 0.875rem;
          margin: -0.5rem 0 1rem 0;
          font-weight: 400;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group:last-child {
          margin-bottom: 0;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: hsl(215, 25%, 15%);
          font-size: 0.875rem;
        }
        
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-family: inherit;
          transition: all 0.2s ease;
          box-sizing: border-box;
          background: hsl(0, 0%, 100%);
          color: hsl(215, 25%, 15%);
        }
        
        .form-input:hover {
          border-color: hsl(215, 20%, 80%);
        }
        
        .form-input:focus {
          outline: none;
          border-color: hsl(195, 85%, 45%);
          box-shadow: 0 0 0 3px hsla(195, 85%, 45%, 0.1);
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
        
        .date-range-btn {
          width: 100%;
          padding: 1rem 1.5rem;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.75rem;
          background: hsl(0, 0%, 100%);
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          color: hsl(215, 25%, 15%);
          text-align: left;
          justify-content: flex-start;
          min-height: 64px;
        }
        
        .date-range-btn svg {
          flex-shrink: 0;
          color: hsl(195, 85%, 45%);
          width: 20px;
          height: 20px;
        }
        
        .date-range-btn:hover {
          border-color: hsl(195, 85%, 45%);
          background: hsl(195, 60%, 96%);
        }
        
        .date-range-btn-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }
        
        .date-range-section {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        .date-range-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: hsl(215, 15%, 50%);
          margin-bottom: 0.25rem;
          text-transform: none;
        }
        
        .date-range-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(215, 25%, 15%);
        }
        
        .date-range-divider {
          width: 1px;
          height: 32px;
          background: hsl(215, 20%, 88%);
          flex-shrink: 0;
        }
        
        .days-display {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: hsl(215, 15%, 50%);
        }
        
        .cottage-section {
          margin-top: 1rem;
          padding: 1rem;
          border: 1px solid hsl(215, 20%, 88%);
          border-left: 3px solid hsl(195, 85%, 45%);
          border-radius: 0.75rem;
          background: hsl(195, 60%, 96%);
        }
        
        .cottage-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid hsl(215, 20%, 88%);
        }
        
        .cottage-row:last-child {
          border-bottom: none;
        }
        
        .cottage-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .cottage-name {
          font-weight: 500;
          color: hsl(215, 25%, 15%);
        }
        
        .cottage-price {
          font-size: 0.875rem;
          color: hsl(215, 15%, 50%);
        }
        
        .cottage-availability {
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
        }
        
        .cottage-availability.status-available {
          color: hsl(142, 76%, 36%);
        }
        
        .cottage-availability.status-low-stock {
          color: hsl(45, 93%, 47%);
        }
        
        .cottage-availability.status-fully-booked {
          color: hsl(0, 84%, 60%);
        }
        
        .cottage-availability .availability-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }
        
        .availability-text {
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .qty-btn {
          width: 2rem;
          height: 2rem;
          border: 1.5px solid hsl(215, 20%, 88%);
          border-radius: 0.5rem;
          background: hsl(0, 0%, 100%);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: hsl(215, 25%, 15%);
          transition: all 0.2s ease;
        }
        
        .qty-btn:hover:not(:disabled) {
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
          border-color: hsl(195, 85%, 45%);
        }
        
        .qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .qty-value {
          min-width: 2rem;
          text-align: center;
          font-weight: 600;
          color: hsl(215, 25%, 15%);
        }
        
        .radio-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        
        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.75rem;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background: hsl(0, 0%, 100%);
        }
        
        .radio-label:hover {
          border-color: hsl(195, 85%, 45%);
          background: hsl(195, 60%, 96%);
        }
        
        .radio-label input[type="radio"] {
          accent-color: hsl(195, 85%, 45%);
        }
        
        .radio-label input[type="radio"]:checked + span {
          font-weight: 600;
          color: hsl(215, 25%, 15%);
        }
        
        .radio-label span {
          color: hsl(215, 25%, 15%);
        }
        
        .cost-breakdown {
          background: hsl(195, 60%, 96%);
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.75rem;
          padding: 1.25rem;
        }
        
        #breakdown-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: hsl(215, 25%, 15%);
        }
        
        .breakdown-separator {
          height: 1px;
          background: hsl(215, 20%, 88%);
          margin: 0.75rem 0;
        }
        
        .breakdown-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.125rem;
          font-weight: 700;
          color: hsl(195, 85%, 45%);
        }
        
        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .checkbox-label input[type="checkbox"] {
          width: 1.125rem;
          height: 1.125rem;
          cursor: pointer;
          accent-color: hsl(195, 85%, 45%);
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        
        .checkbox-label span {
          color: hsl(215, 25%, 15%);
        }
        
        .btn-submit {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.75rem;
        }
        
        .btn-submit:hover {
          background: hsl(195, 85%, 55%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px hsla(195, 85%, 45%, 0.3);
        }
        
        .date-range-picker {
          background: hsl(0, 0%, 100%);
          border-radius: 0.75rem;
          padding: 1.5rem;
        }
        
        .range-calendars-container {
          display: block;
        }
        
        .range-calendar-month {
          min-width: 0;
        }
        
        .range-calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 0 1.5rem 0;
        }
        
        .range-calendar-header h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          text-align: center;
          flex: 1;
          color: hsl(215, 25%, 15%);
        }
        
        .range-calendar-nav-btn {
          background: transparent;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.5rem;
          padding: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(215, 25%, 15%);
          transition: all 0.2s ease;
        }
        
        .range-calendar-nav-btn:hover:not(:disabled) {
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
          border-color: hsl(195, 85%, 45%);
        }
        
        .range-calendar-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .range-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.375rem;
        }
        
        .range-calendar-day-name {
          text-align: center;
          font-weight: 500;
          font-size: 0.75rem;
          color: hsl(215, 15%, 50%);
          padding: 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .range-calendar-day {
          aspect-ratio: 1;
          min-height: 48px;
          border: 1px solid hsl(215, 20%, 88%);
          background: hsl(0, 0%, 100%);
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: hsl(215, 25%, 15%);
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0.375rem;
        }
        
        .range-calendar-day .day-number {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .range-calendar-day .availability-badges {
          position: absolute;
          bottom: 2px;
          right: 2px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-end;
        }
        
        .range-calendar-day .availability-badge {
          font-size: 0.5rem;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 4px;
          line-height: 1.2;
          white-space: nowrap;
        }
        
        .range-calendar-day .availability-badge.badge-available {
          background: hsl(142, 76%, 36%);
          color: hsl(0, 0%, 100%);
        }
        
        .range-calendar-day .availability-badge.badge-low {
          background: hsl(45, 93%, 47%);
          color: hsl(0, 0%, 100%);
        }
        
        .range-calendar-day .availability-badge.badge-full {
          background: hsl(0, 84%, 60%);
          color: hsl(0, 0%, 100%);
        }
        
        .range-calendar-day:hover:not(:disabled):not(.empty) {
          background: hsl(195, 60%, 96%);
          border-color: hsl(195, 85%, 45%);
        }
        
        .range-calendar-day.start,
        .range-calendar-day.end {
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
          border-color: hsl(195, 85%, 45%);
          font-weight: 600;
        }
        
        .range-calendar-day.start .day-number,
        .range-calendar-day.end .day-number {
          color: hsl(0, 0%, 100%);
        }
        
        .range-calendar-day.start .availability-badge,
        .range-calendar-day.end .availability-badge {
          opacity: 0.9;
        }
        
        .range-calendar-day.in-range {
          background: hsl(195, 60%, 96%);
          border-color: hsl(195, 85%, 45%);
        }
        
        .range-calendar-day.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          background: hsl(210, 30%, 96%);
        }
        
        .range-calendar-day.disabled .availability-badge {
          display: none;
        }
        
        .range-calendar-day.empty {
          border: none;
          background: transparent;
          cursor: default;
        }
        
        .range-picker-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid hsl(215, 20%, 88%);
        }
        
        .btn-secondary,
        .btn-primary {
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .btn-secondary {
          background: hsl(0, 0%, 100%);
          color: hsl(215, 25%, 15%);
          border: 1px solid hsl(215, 20%, 88%);
        }
        
        .btn-secondary:hover {
          background: hsl(195, 60%, 96%);
        }
        
        .btn-primary {
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
        }
        
        .btn-primary:hover {
          background: hsl(195, 85%, 55%);
        }
        
        @media (max-width: 768px) {
          .booking-dialog {
            max-width: calc(100vw - 2rem);
            margin: 1rem;
          }
          
          .booking-dialog-content {
            padding: 1.5rem;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .radio-group {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </div>
  `;
}

// Function Hall booking form
function createFunctionHallForm(packageName, packageDetails) {
  return `
    <div class="booking-dialog">
      <div class="booking-dialog-header">
        <h2>Book Function Hall</h2>
        <button class="dialog-close" onclick="this.closest('.modal').remove()" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="booking-dialog-content">
        <form id="comprehensive-booking-form">
          <!-- Guest Information -->
          <section class="form-section">
            <h3 class="section-title">Guest Information</h3>
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <input type="text" id="fullName" name="fullName" required placeholder="Juan Dela Cruz" class="form-input">
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required placeholder="juan@example.com" class="form-input">
            </div>
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" required placeholder="+63 912 345 6789" class="form-input">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="adults">Expected Guests</label>
                <input type="number" id="adults" name="adults" min="1" value="1" required class="form-input">
              </div>
            </div>
          </section>
          
          <!-- Function Hall Selection -->
          <section class="form-section">
            <h3 class="section-title">Select Function Hall(s)</h3>
            <p class="section-subtitle">You can select one or both function halls</p>
            
            <div class="function-hall-options">
              <label class="function-hall-checkbox">
                <input type="checkbox" id="grandHall" name="functionHalls" value="Grand Function Hall" data-price="15000">
                <div class="function-hall-card">
                  <div class="function-hall-info">
                    <div class="function-hall-header">
                      <h4>Grand Function Hall</h4>
                      <div class="function-hall-availability" data-service="Grand Function Hall">
                        <span class="availability-text">Select date to see availability</span>
                      </div>
                    </div>
                    <p class="function-hall-desc">Spacious grand function hall perfect for large events and celebrations.</p>
                    <div class="function-hall-price">₱15,000</div>
                  </div>
                </div>
              </label>
              
              <label class="function-hall-checkbox">
                <input type="checkbox" id="intimateHall" name="functionHalls" value="Intimate Function Hall" data-price="10000">
                <div class="function-hall-card">
                  <div class="function-hall-info">
                    <div class="function-hall-header">
                      <h4>Intimate Function Hall</h4>
                      <div class="function-hall-availability" data-service="Intimate Function Hall">
                        <span class="availability-text">Select date to see availability</span>
                      </div>
                    </div>
                    <p class="function-hall-desc">Intimate function hall ideal for smaller gatherings and events.</p>
                    <div class="function-hall-price">₱10,000</div>
                  </div>
                </div>
              </label>
            </div>
          </section>
          
          <!-- Date Selection -->
          <section class="form-section">
            <h3 class="section-title">Select Date</h3>
            <div class="form-group">
              <label>Event Date</label>
              <button type="button" class="date-range-btn" id="function-hall-date-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span class="date-range-value" id="function-hall-date-text">Select date</span>
              </button>
              <input type="hidden" id="functionHallDate" name="functionHallDate">
            </div>
          </section>
          
          <!-- Payment Mode -->
          <section class="form-section">
            <h3 class="section-title">Payment Mode</h3>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="paymentMode" value="gcash" checked>
                <span>GCash</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="paymentMode" value="bank">
                <span>Bank Transfer</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="paymentMode" value="card">
                <span>Credit/Debit Card</span>
              </label>
            </div>
          </section>
          
          <!-- Cost Breakdown -->
          <section class="form-section cost-breakdown">
            <h3 class="section-title">Cost Breakdown</h3>
            <div id="breakdown-items"></div>
            <div class="breakdown-separator"></div>
            <div class="breakdown-total">
              <span>Grand Total:</span>
              <span id="grand-total">₱0</span>
            </div>
          </section>
          
          <!-- Terms & Submit -->
          <section class="form-section">
            <label class="checkbox-label">
              <input type="checkbox" id="acceptTerms" name="acceptTerms" required>
              <span>I agree to the terms and conditions</span>
            </label>
            <button type="submit" class="btn-submit">Confirm Booking</button>
          </section>
        </form>
      </div>
      
      <style>
        .modal .card {
          border: none;
          box-shadow: none;
          background: transparent;
          padding: 0;
          max-width: none;
          width: auto;
        }
        
        .booking-dialog {
          max-width: 42rem;
          width: 100%;
          background: white;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        
        .booking-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid hsl(215, 20%, 88%);
          background: hsl(0, 0%, 100%);
        }
        
        .booking-dialog-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: hsl(215, 25%, 15%);
        }
        
        .dialog-close {
          background: transparent;
          border: none;
          color: hsl(215, 25%, 15%);
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          opacity: 0.6;
        }
        
        .dialog-close:hover {
          opacity: 1;
          background: hsl(195, 60%, 96%);
        }
        
        .booking-dialog-content {
          max-height: 85vh;
          overflow-y: auto;
          padding: 1.5rem;
          background: hsl(0, 0%, 100%);
        }
        
        .booking-dialog-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .booking-dialog-content::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .booking-dialog-content::-webkit-scrollbar-thumb {
          background: hsl(215, 20%, 88%);
          border-radius: 4px;
        }
        
        .form-section {
          margin-bottom: 2rem;
          padding: 0;
        }
        
        .form-section:last-child {
          margin-bottom: 0;
        }
        
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: hsl(215, 25%, 15%);
          margin: 0 0 1rem 0;
        }
        
        .section-subtitle {
          color: hsl(215, 15%, 50%);
          font-size: 0.875rem;
          margin: -0.5rem 0 1rem 0;
          font-weight: 400;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group:last-child {
          margin-bottom: 0;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: hsl(215, 25%, 15%);
          font-size: 0.875rem;
        }
        
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-family: inherit;
          transition: all 0.2s ease;
          box-sizing: border-box;
          background: hsl(0, 0%, 100%);
          color: hsl(215, 25%, 15%);
        }
        
        .form-input:hover {
          border-color: hsl(215, 20%, 80%);
        }
        
        .form-input:focus {
          outline: none;
          border-color: hsl(195, 85%, 45%);
          box-shadow: 0 0 0 3px hsla(195, 85%, 45%, 0.1);
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        .function-hall-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .function-hall-checkbox {
          display: block;
          cursor: pointer;
        }
        
        .function-hall-checkbox input[type="checkbox"] {
          display: none;
        }
        
        .function-hall-card {
          border: 2px solid hsl(215, 20%, 88%);
          border-radius: 0.75rem;
          padding: 1.25rem;
          background: hsl(0, 0%, 100%);
          transition: all 0.2s ease;
        }
        
        .function-hall-checkbox input[type="checkbox"]:checked + .function-hall-card {
          border-color: hsl(195, 85%, 45%);
          background: hsl(195, 60%, 96%);
          box-shadow: 0 0 0 3px hsla(195, 85%, 45%, 0.1);
        }
        
        .function-hall-card:hover {
          border-color: hsl(195, 85%, 45%);
        }
        
        .function-hall-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .function-hall-info h4 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: hsl(215, 25%, 15%);
        }
        
        /* Availability Indicators */
        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .availability-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }
        
        .availability-indicator.status-available {
          background: hsl(142, 76%, 36%, 0.1);
          color: hsl(142, 76%, 36%);
        }
        
        .availability-indicator.status-low-stock {
          background: hsl(45, 93%, 47%, 0.1);
          color: hsl(45, 93%, 47%);
        }
        
        .availability-indicator.status-fully-booked {
          background: hsl(0, 84%, 60%, 0.1);
          color: hsl(0, 84%, 60%);
        }
        
        .availability-indicator .availability-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        
        .availability-text {
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .cottage-availability {
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
        }
        
        .cottage-availability.status-available {
          color: hsl(142, 76%, 36%);
        }
        
        .cottage-availability.status-low-stock {
          color: hsl(45, 93%, 47%);
        }
        
        .cottage-availability.status-fully-booked {
          color: hsl(0, 84%, 60%);
        }
        
        .cottage-availability .availability-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }
        
        .function-hall-availability {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          white-space: nowrap;
        }
        
        .function-hall-availability.status-available {
          color: hsl(142, 76%, 36%);
        }
        
        .function-hall-availability.status-low-stock {
          color: hsl(45, 93%, 47%);
        }
        
        .function-hall-availability.status-fully-booked {
          color: hsl(0, 84%, 60%);
        }
        
        .function-hall-availability .availability-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }
        
        .function-hall-desc {
          margin: 0 0 0.75rem 0;
          color: hsl(215, 15%, 50%);
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .function-hall-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(195, 85%, 45%);
        }
        
        .date-range-btn {
          width: 100%;
          padding: 1rem 1.5rem;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.75rem;
          background: hsl(0, 0%, 100%);
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          color: hsl(215, 25%, 15%);
          text-align: left;
          justify-content: flex-start;
          min-height: 64px;
        }
        
        .date-range-btn svg {
          flex-shrink: 0;
          color: hsl(195, 85%, 45%);
          width: 20px;
          height: 20px;
        }
        
        .date-range-btn:hover {
          border-color: hsl(195, 85%, 45%);
          background: hsl(195, 60%, 96%);
        }
        
        .radio-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        
        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.75rem;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background: hsl(0, 0%, 100%);
        }
        
        .radio-label:hover {
          border-color: hsl(195, 85%, 45%);
          background: hsl(195, 60%, 96%);
        }
        
        .radio-label input[type="radio"] {
          accent-color: hsl(195, 85%, 45%);
        }
        
        .radio-label input[type="radio"]:checked + span {
          font-weight: 600;
        }
        
        .cost-breakdown {
          background: hsl(195, 60%, 96%);
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.75rem;
          padding: 1.25rem;
        }
        
        #breakdown-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: hsl(215, 25%, 15%);
        }
        
        .breakdown-separator {
          height: 1px;
          background: hsl(215, 20%, 88%);
          margin: 0.75rem 0;
        }
        
        .breakdown-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.125rem;
          font-weight: 700;
          color: hsl(195, 85%, 45%);
        }
        
        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .checkbox-label input[type="checkbox"] {
          width: 1.125rem;
          height: 1.125rem;
          cursor: pointer;
          accent-color: hsl(195, 85%, 45%);
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        
        .checkbox-label span {
          color: hsl(215, 25%, 15%);
        }
        
        .btn-submit {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.75rem;
        }
        
        .btn-submit:hover {
          background: hsl(195, 85%, 55%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px hsla(195, 85%, 45%, 0.3);
        }
        
        .single-date-picker {
          background: hsl(0, 0%, 100%);
          border-radius: 0.75rem;
          padding: 1.5rem;
        }
        
        .single-calendar-container {
          min-width: 0;
        }
        
        .single-calendar-month {
          min-width: 0;
        }
        
        .single-calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 0 1.5rem 0;
        }
        
        .single-calendar-header h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          text-align: center;
          flex: 1;
          color: hsl(215, 25%, 15%);
        }
        
        .single-calendar-nav-btn {
          background: transparent;
          border: 1px solid hsl(215, 20%, 88%);
          border-radius: 0.5rem;
          padding: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(215, 25%, 15%);
          transition: all 0.2s ease;
        }
        
        .single-calendar-nav-btn:hover:not(:disabled) {
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
          border-color: hsl(195, 85%, 45%);
        }
        
        .single-calendar-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .single-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.375rem;
        }
        
        .single-calendar-day-name {
          text-align: center;
          font-weight: 500;
          font-size: 0.75rem;
          color: hsl(215, 15%, 50%);
          padding: 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .single-calendar-day {
          aspect-ratio: 1;
          min-height: 48px;
          border: 1px solid hsl(215, 20%, 88%);
          background: hsl(0, 0%, 100%);
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: hsl(215, 25%, 15%);
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0.375rem;
        }
        
        .single-calendar-day .day-number {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .single-calendar-day .availability-badges {
          position: absolute;
          bottom: 2px;
          right: 2px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-end;
        }
        
        .single-calendar-day .availability-badge {
          font-size: 0.5rem;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 4px;
          line-height: 1.2;
          white-space: nowrap;
        }
        
        .single-calendar-day .availability-badge.badge-available {
          background: hsl(142, 76%, 36%);
          color: hsl(0, 0%, 100%);
        }
        
        .single-calendar-day .availability-badge.badge-low {
          background: hsl(45, 93%, 47%);
          color: hsl(0, 0%, 100%);
        }
        
        .single-calendar-day .availability-badge.badge-full {
          background: hsl(0, 84%, 60%);
          color: hsl(0, 0%, 100%);
        }
        
        .single-calendar-day:hover:not(:disabled):not(.empty) {
          background: hsl(195, 60%, 96%);
          border-color: hsl(195, 85%, 45%);
        }
        
        .single-calendar-day.selected {
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
          border-color: hsl(195, 85%, 45%);
          font-weight: 600;
        }
        
        .single-calendar-day.selected .day-number {
          color: hsl(0, 0%, 100%);
        }
        
        .single-calendar-day.selected .availability-badge {
          opacity: 0.9;
        }
        
        .single-calendar-day.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          background: hsl(210, 30%, 96%);
        }
        
        .single-calendar-day.disabled .availability-badge {
          display: none;
        }
        
        .single-calendar-day.empty {
          border: none;
          background: transparent;
          cursor: default;
        }
        
        .single-picker-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid hsl(215, 20%, 88%);
        }
        
        .single-picker-actions .btn-secondary,
        .single-picker-actions .btn-primary {
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .single-picker-actions .btn-secondary {
          background: hsl(0, 0%, 100%);
          color: hsl(215, 25%, 15%);
          border: 1px solid hsl(215, 20%, 88%);
        }
        
        .single-picker-actions .btn-secondary:hover {
          background: hsl(195, 60%, 96%);
        }
        
        .single-picker-actions .btn-primary {
          background: hsl(195, 85%, 45%);
          color: hsl(0, 0%, 100%);
        }
        
        .single-picker-actions .btn-primary:hover {
          background: hsl(195, 85%, 55%);
        }
        
        @media (max-width: 768px) {
          .booking-dialog {
            max-width: calc(100vw - 2rem);
            margin: 1rem;
          }
          
          .booking-dialog-content {
            padding: 1.5rem;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .radio-group {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </div>
  `;
}

export { formatDateString, parseDateString, formatDisplayDate, calculateDays, createDateRangeCalendar, createSingleDateCalendar };

