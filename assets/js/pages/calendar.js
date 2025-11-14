import { showToast } from '../components/toast.js';
import { formatDateString, parseDateString } from '../components/bookingForm.js';
import { getAvailabilityForDate } from '../utils/database.js';

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

export async function CalendarPage(){
  try{
    // Get today's date (timezone-safe)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDateString(today);
    
    return `
      <section class="container booking-availability-page">
        <div class="section-head">
          <h1>Resort Booking Availability</h1>
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
            <div style="text-align: center; padding: 40px;">Loading availability...</div>
          </main>
        </div>
        
        <style>
          .booking-availability-page {
            max-width: 1400px;
            margin: 0 auto;
          }
          
          .booking-availability-page .section-head h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            color: var(--color-text);
          }
          
          .subtitle {
            color: var(--color-muted);
            font-size: 1.1rem;
            margin-top: 0;
          }
          
          .booking-layout {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 32px;
            margin-top: 32px;
          }
          
          .calendar-sidebar {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            height: fit-content;
            position: sticky;
            top: 120px;
          }
          
          .calendar-header-section {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
          }
          
          .calendar-header-section h2 {
            font-size: 1.25rem;
            margin: 0;
            color: var(--color-text);
          }
          
          .calendar-header-section svg {
            color: var(--color-accent);
          }
          
          .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          
          .calendar-header h3 {
            font-size: 1.1rem;
            margin: 0;
            color: var(--color-text);
          }
          
          .calendar-nav-btn {
            background: transparent;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-text);
            transition: all 0.2s ease;
          }
          
          .calendar-nav-btn:hover:not(:disabled) {
            background: var(--color-accent);
            color: white;
            border-color: var(--color-accent);
          }
          
          .calendar-nav-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 8px;
          }
          
          .calendar-day-name {
            text-align: center;
            font-weight: 600;
            font-size: 0.85rem;
            color: var(--color-muted);
            padding: 8px 0;
          }
          
          .calendar-day {
            aspect-ratio: 1;
            border: 1px solid var(--border);
            background: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            color: var(--color-text);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .calendar-day:hover:not(:disabled):not(.selected) {
            background: #f0f9ff;
            border-color: var(--color-accent);
          }
          
          .calendar-day.selected {
            background: var(--color-accent);
            color: white;
            border-color: var(--color-accent);
            font-weight: 600;
          }
          
          .calendar-day.disabled {
            opacity: 0.3;
            cursor: not-allowed;
            background: #f5f5f5;
          }
          
          .calendar-day.empty {
            border: none;
            background: transparent;
            cursor: default;
          }
          
          .services-main {
            min-width: 0;
            overflow-y: auto;
            max-height: calc(100vh - 250px);
            padding-right: 8px;
          }
          
          .services-main::-webkit-scrollbar {
            width: 8px;
          }
          
          .services-main::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .services-main::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 4px;
          }
          
          .services-main::-webkit-scrollbar-thumb:hover {
            background: var(--color-muted);
          }
          
          .services-container {
            display: flex;
            flex-direction: column;
            gap: 32px;
          }
          
          .services-section {
            background: white;
            border-radius: 16px;
            padding: 24px;
          }
          
          .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.5rem;
            margin: 0 0 20px 0;
            color: var(--color-text);
          }
          
          .section-title svg {
            color: var(--color-accent);
          }
          
          .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          }
          
          .service-card {
            position: relative;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
            background: white;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .service-card:hover {
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            transform: translateY(-2px);
          }
          
          .service-badge {
            position: absolute;
            top: 16px;
            right: 16px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .service-badge.available {
            background: #10b981;
            color: white;
          }
          
          .service-badge.fully-booked {
            background: #ef4444;
            color: white;
          }
          
          .service-name {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: var(--color-text);
            padding-right: 100px;
          }
          
          .service-type {
            font-size: 0.9rem;
            color: var(--color-muted);
            margin: 0 0 12px 0;
            text-transform: capitalize;
          }
          
          .service-price {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-accent);
            margin: 0 0 8px 0;
          }
          
          .service-availability {
            font-size: 0.85rem;
            color: var(--color-muted);
            margin: 0;
          }
          
          @media (max-width: 1024px) {
            .booking-layout {
              grid-template-columns: 1fr;
            }
            
            .calendar-sidebar {
              position: static;
            }
            
            .services-grid {
              grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            }
          }
          
          @media (max-width: 768px) {
            .booking-availability-page .section-head h1 {
              font-size: 2rem;
            }
            
            .services-main {
              max-height: calc(100vh - 200px);
            }
            
            .services-grid {
              grid-template-columns: 1fr;
            }
            
            .calendar-grid {
              gap: 4px;
            }
            
            .calendar-day {
              font-size: 0.8rem;
            }
          }
        </style>
      </section>
    `;
  }catch(e){
    showToast('Calendar unavailable','error');
    return `
      <section class="container">
        <div class="section-head">
          <h2>Calendar</h2>
          <p>Try again later.</p>
        </div>
      </section>`;
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
      showToast('Error updating calendar', 'error');
    }
  }
  
  async function updateServices() {
    try {
      servicesMain.innerHTML = '<div style="text-align: center; padding: 40px;">Loading availability...</div>';
      const availability = await generateAvailability(selectedDate);
      servicesMain.innerHTML = renderServices(availability);
    } catch (error) {
      console.error('Error updating services:', error);
      showToast('Error updating services', 'error');
      servicesMain.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--color-muted);">Error loading availability. Please try again.</div>';
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
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const clickedDate = btn.getAttribute('data-date');
        if (!clickedDate || btn.disabled) return;
        
        selectedDate = clickedDate;
        
        // Update currentDate to show the month of the selected date
        const selectedDateObj = parseDateString(clickedDate);
        currentDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
        
        updateCalendar();
        updateServices();
      });
    });
  }
  
  // Initialize calendar and services with today's date
  try {
    updateCalendar();
    updateServices(); // This is now async
  } catch (error) {
    console.error('Error initializing calendar:', error);
    showToast('Error initializing calendar', 'error');
  }
}
