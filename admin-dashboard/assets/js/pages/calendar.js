// Import database utilities
import { getAvailabilityForDate } from '../../../../assets/js/utils/database.js';

// Utility functions for date handling
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

// Get real availability data from database
async function generateAvailability(selectedDate) {
  try {
    const availability = await getAvailabilityForDate(selectedDate);
  
    // Transform to expected format
  return {
    rooms: {
        'Standard Room': availability['Standard Room'] || { total: 4, available: 4 }
      },
      cottages: {
        'Open Cottage': availability['Open Cottage'] || { total: 4, available: 4 },
        'Standard Cottage': availability['Standard Cottage'] || { total: 4, available: 4 },
        'Family Cottage': availability['Family Cottage'] || { total: 4, available: 4 }
      },
      functionHalls: {
        'Grand Function Hall': availability['Grand Function Hall'] || { total: 1, available: 1 },
        'Intimate Function Hall': availability['Intimate Function Hall'] || { total: 1, available: 1 }
      }
    };
  } catch (error) {
    console.error('Error generating availability:', error);
    // Return default availability on error
    return {
      rooms: {
        'Standard Room': { total: 4, available: 4 }
      },
      cottages: {
        'Open Cottage': { total: 4, available: 4 },
        'Standard Cottage': { total: 4, available: 4 },
        'Family Cottage': { total: 4, available: 4 }
    },
    functionHalls: {
        'Grand Function Hall': { total: 1, available: 1 },
        'Intimate Function Hall': { total: 1, available: 1 }
    }
  };
  }
}

function createCalendarHTML(viewDate, selectedDate) {
  // Parse viewDate (YYYY-MM-DD format)
  const viewDateObj = parseDateString(viewDate);
  const year = viewDateObj.getFullYear();
  const month = viewDateObj.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Get today's date (timezone-safe)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateString(today);
  
  let calendarHTML = `
    <div class="calendar-header">
      <button class="calendar-nav-btn" data-action="prev" aria-label="Previous month">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h3>${monthNames[month]} ${year}</h3>
      <button class="calendar-nav-btn" data-action="next" aria-label="Next month">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </div>
    <div class="calendar-grid">
      <div class="calendar-day-name">SU</div>
      <div class="calendar-day-name">MO</div>
      <div class="calendar-day-name">TU</div>
      <div class="calendar-day-name">WE</div>
      <div class="calendar-day-name">TH</div>
      <div class="calendar-day-name">FR</div>
      <div class="calendar-day-name">SA</div>
  `;
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarHTML += '<div class="calendar-day empty"></div>';
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);
    const dateStr = formatDateString(cellDate);
    const isPast = cellDate < today;
    const isSelected = dateStr === selectedDate;
    
    calendarHTML += `
      <button 
        class="calendar-day ${isPast ? 'disabled' : ''} ${isSelected ? 'selected' : ''}"
        ${isPast ? 'disabled' : ''}
        data-date="${dateStr}"
        aria-label="${monthNames[month]} ${day}, ${year}"
      >
        ${day}
      </button>
    `;
  }
  
  calendarHTML += '</div>';
  return calendarHTML;
}

function createServiceCard(serviceName, serviceType, price, available, total, category) {
  const isAvailable = available > 0;
  const badgeClass = isAvailable ? 'available' : 'fully-booked';
  const badgeText = isAvailable ? 'Available' : 'Fully Booked';
  
  return `
    <div class="service-card">
      <div class="service-badge ${badgeClass}">${badgeText}</div>
      <h3 class="service-name">${serviceName}</h3>
      <p class="service-type">${serviceType}</p>
      <div class="service-price">₱${price.toLocaleString()}${category === 'rooms' ? '/day' : category === 'cottages' ? '' : ''}</div>
      <div class="service-availability">${available} of ${total} available</div>
    </div>
  `;
}

function renderServices(availability) {
  let html = `
    <div class="services-container">
      <div class="services-section">
        <h2 class="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Rooms
        </h2>
        <div class="services-grid">
          ${createServiceCard('Standard Room', 'Room', 2000, availability.rooms['Standard Room'].available, availability.rooms['Standard Room'].total, 'rooms')}
        </div>
      </div>
      
      <div class="services-section">
        <h2 class="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Cottages
        </h2>
        <div class="services-grid">
          ${createServiceCard('Open Cottage', 'Cottage', 300, availability.cottages['Open Cottage'].available, availability.cottages['Open Cottage'].total, 'cottages')}
          ${createServiceCard('Standard Cottage', 'Cottage', 400, availability.cottages['Standard Cottage'].available, availability.cottages['Standard Cottage'].total, 'cottages')}
          ${createServiceCard('Family Cottage', 'Cottage', 500, availability.cottages['Family Cottage'].available, availability.cottages['Family Cottage'].total, 'cottages')}
        </div>
      </div>
      
      <div class="services-section">
        <h2 class="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
          </svg>
          Function Halls
        </h2>
        <div class="services-grid">
          ${createServiceCard('Grand Function Hall', 'Function Hall', 15000, availability.functionHalls['Grand Function Hall'].available, availability.functionHalls['Grand Function Hall'].total, 'functionHalls')}
          ${createServiceCard('Intimate Function Hall', 'Function Hall', 10000, availability.functionHalls['Intimate Function Hall'].available, availability.functionHalls['Intimate Function Hall'].total, 'functionHalls')}
        </div>
      </div>
    </div>
  `;
  return html;
}

export async function CalendarPage() {
  try {
    // Get today's date (timezone-safe)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDateString(today);
    
    // Get initial availability
    const initialAvailability = await generateAvailability(todayStr);
    
    return `
      <div class="calendar-page">
        <div class="calendar-page-header">
          <h3>Resort Booking Availability</h3>
          <p class="subtitle">View real-time availability for resort services.</p>
        </div>
        
        <div class="booking-layout">
          <aside class="calendar-sidebar">
            <div class="calendar-header-section">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <h2>Select Date</h2>
            </div>
            <div class="calendar-wrapper" data-calendar-wrapper>
              ${createCalendarHTML(todayStr, todayStr)}
            </div>
          </aside>
          
          <main class="services-main" data-services-main>
            ${renderServices(initialAvailability)}
          </main>
        </div>
      </div>
    `;
  } catch (e) {
    console.error('Calendar error:', e);
    return `
      <div class="error-message">
        <h3>Calendar unavailable</h3>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

// Initialize calendar functionality after page loads
export function initCalendarPage() {
  const wrapper = document.querySelector('[data-calendar-wrapper]');
  const servicesMain = document.querySelector('[data-services-main]');
  
  if (!wrapper || !servicesMain) return;
  
  // Initialize with today's date (timezone-safe)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateString(today);
  
  // Create a new date object for month navigation (avoid mutation issues)
  let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = todayStr; // Today's date string
  
  function updateCalendar() {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const viewDate = formatDateString(new Date(year, month, 1));
      wrapper.innerHTML = createCalendarHTML(viewDate, selectedDate);
      attachCalendarListeners();
    } catch (error) {
      console.error('Error updating calendar:', error);
    }
  }
  
  async function updateServices() {
    try {
      const availability = await generateAvailability(selectedDate);
      servicesMain.innerHTML = renderServices(availability);
    } catch (error) {
      console.error('Error updating services:', error);
    }
  }
  
  function attachCalendarListeners() {
    // Navigation buttons
    const prevBtn = wrapper.querySelector('[data-action="prev"]');
    const nextBtn = wrapper.querySelector('[data-action="next"]');
    
    if (prevBtn) {
      // Remove existing listeners by cloning
      const newPrevBtn = prevBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
      
      newPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Create new date to avoid mutation issues
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        currentDate = newDate;
        updateCalendar();
      });
    }
    
    if (nextBtn) {
      // Remove existing listeners by cloning
      const newNextBtn = nextBtn.cloneNode(true);
      nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
      
      newNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Create new date to avoid mutation issues
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        currentDate = newDate;
        updateCalendar();
      });
    }
    
    // Date selection
    const dateButtons = wrapper.querySelectorAll('.calendar-day[data-date]');
    dateButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const clickedDate = btn.getAttribute('data-date');
        if (!clickedDate || btn.disabled) return;
        
        selectedDate = clickedDate;
        
        // Update currentDate to show the month of the selected date
        const selectedDateObj = parseDateString(clickedDate);
        currentDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
        
        updateCalendar();
        await updateServices();
      });
    });
  }
  
  // Initialize calendar and services with today's date
  try {
    updateCalendar();
    updateServices();
  } catch (error) {
    console.error('Error initializing calendar:', error);
  }
}
