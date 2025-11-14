// Luxury Resort Card Component
export function createLuxuryCard(cardData) {
  const {
    image,
    title,
    price,
    description
  } = cardData;

  const card = document.createElement('div');
  card.className = 'luxury-card';
  
  card.innerHTML = `
    <div class="relative h-full w-full overflow-hidden">
      <!-- Background Image -->
      <img 
        src="${image}" 
        alt="${title}"
        class="w-full h-full object-cover"
        loading="lazy"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
      />
      <!-- Fallback background -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600" style="display: none;"></div>
      
      <!-- Content Container -->
      <div class="content-container">
        <!-- Always Visible Content -->
        <div class="always-visible">
          <h3 class="card-title">${title}</h3>
          <p class="card-price">${price}</p>
        </div>
        
        <!-- Hover-Only Content -->
        <div class="hover-content">
          <p class="card-description">${description}</p>
          <button 
            class="book-button"
            onclick="handleBookNow('${title}')"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
`;

  return card;
}

// Handle Book Now button click
window.handleBookNow = function(packageName) {
  // Import modal function dynamically
  import('./modal.js').then(({ openModal }) => {
    import('./toast.js').then(({ showToast }) => {
      import('./bookingForm.js').then(({ createBookingForm }) => {
        // Get package details from allPackages
        let packageDetails = null;
        const packages = window.getAllPackages ? window.getAllPackages() : null;
        if (packages) {
          for (const category in packages) {
            const found = packages[category].find(pkg => pkg.title === packageName);
            if (found) {
              packageDetails = found;
              break;
            }
          }
        }
        
        const formHTML = createBookingForm(packageName, packageDetails);
        
        // Open modal
        const modal = openModal(formHTML);
        
        // Initialize booking form functionality
        setTimeout(() => {
          initBookingForm(packageName, packageDetails, showToast, modal);
        }, 100);
      });
    });
  });
};

// Initialize booking form functionality
function initBookingForm(packageName, packageDetails, showToast, modal) {
  const form = document.getElementById('comprehensive-booking-form');
  if (!form) return;
  
  // Pre-fill user information if logged in
  const currentUser = window.kinaAuth?.getCurrentUser();
  if (currentUser) {
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    
    if (fullNameInput) {
      // Combine first and last name, or use email prefix if no last name
      const fullName = currentUser.lastName 
        ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
        : currentUser.firstName || currentUser.email?.split('@')[0] || '';
      fullNameInput.value = fullName;
    }
    
    if (emailInput && currentUser.email) {
      emailInput.value = currentUser.email;
    }
  }
  
  // Check if this is a function hall booking
  const isFunctionHall = packageDetails?.category === 'functionHall';
  
  if (isFunctionHall) {
    initFunctionHallForm(packageName, packageDetails, showToast, modal);
    return;
  }
  
  // State for room/cottage bookings
  let roomCheckIn = null;
  let roomCheckOut = null;
  let cottageCheckIn = null;
  let cottageCheckOut = null;
  const cottageQuantities = { open: 0, standard: 0, family: 0 };
  const cottagePrices = { open: 300, standard: 400, family: 500 };
  const roomPrice = 2000;
  
  // Import utilities
  import('./bookingForm.js').then(({ formatDisplayDate, calculateDays, formatDateString, parseDateString, createDateRangeCalendar }) => {
    import('../utils/availability.js').then(({ 
      getServiceAvailability, 
      getAvailabilityStatusClass,
      getAvailabilityStatusIcon,
      formatAvailabilityText
    }) => {
    
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
    
    adultsInput.addEventListener('change', validateGuests);
    childrenInput.addEventListener('change', validateGuests);
    
    // Date range picker for rooms
    const roomDateBtn = document.getElementById('room-date-range-btn');
    const roomDaysDisplay = document.getElementById('room-days');
    
    function openDateRangePicker(type, checkInId, checkOutId, textId, daysId) {
      // For cottage dates, require room dates to be selected first
      if (type === 'cottage' && (!roomCheckIn || !roomCheckOut)) {
        showToast('Please select room dates first', 'error');
        return;
      }
      
      const popover = document.createElement('div');
      popover.className = 'date-range-popover';
      popover.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: grid; place-items: center;';
      
      // For cottage dates, constrain to room date range
      const minDate = type === 'cottage' ? roomCheckIn : null;
      const maxDate = type === 'cottage' ? roomCheckOut : null;
      
      // Determine availability type
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
                  showToast('Cottage dates must be within the room date range', 'error');
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
                  // Update availability after re-render (small delay to ensure DOM is ready)
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
                    showToast('Cottage dates must be within the room date range', 'error');
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
                    showToast('Cottage dates must be within the room date range', 'error');
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
                  // Update availability after re-render (small delay to ensure DOM is ready)
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
                // Update availability after re-render
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
                // Update availability after re-render
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
            showToast(`Only ${availability.available} room(s) available. Quantity adjusted.`, 'warning');
          }
          if (availability.available === 0) {
            numRoomsInput.disabled = true;
            numRoomsInput.value = 0;
          } else {
            numRoomsInput.disabled = false;
            // Ensure value is within valid range
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
        roomDaysDisplay.textContent = `${days} ${days === 1 ? 'day' : 'days'}`;
        roomDaysDisplay.style.display = 'block';
        updateRoomAvailability();
      } else if (roomCheckIn) {
        if (checkinText) checkinText.textContent = formatDateForDisplay(roomCheckIn);
        if (checkoutText) checkoutText.textContent = 'Add date';
        roomDaysDisplay.style.display = 'none';
        updateRoomAvailability();
      } else {
        if (checkinText) checkinText.textContent = 'Add date';
        if (checkoutText) checkoutText.textContent = 'Add date';
        roomDaysDisplay.style.display = 'none';
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
    
    cottageDateBtn.addEventListener('click', () => openDateRangePicker('cottage', 'cottageCheckIn', 'cottageCheckOut', null, 'cottage-days'));
    
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
            
            // Disable increase button if at max availability
            if (increaseBtn) {
              if (currentQty >= availability.available || availability.available === 0) {
                increaseBtn.disabled = true;
              } else {
                increaseBtn.disabled = false;
              }
            }
            
            // Disable decrease button if at 0
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
              showToast(`Only ${availability.available} ${serviceName}(s) available. Quantity adjusted.`, 'warning');
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
          btn.disabled = false; // Will be updated when dates are selected
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
        cottageDaysDisplay.textContent = `${days} ${days === 1 ? 'day' : 'days'}`;
        cottageDaysDisplay.style.display = 'block';
        updateCottageAvailability();
      } else if (cottageCheckIn) {
        if (checkinText) checkinText.textContent = formatDateForDisplay(cottageCheckIn);
        if (checkoutText) checkoutText.textContent = 'Add date';
        cottageDaysDisplay.style.display = 'none';
        updateCottageAvailability();
      } else {
        if (checkinText) checkinText.textContent = 'Add date';
        if (checkoutText) checkoutText.textContent = 'Add date';
        cottageDaysDisplay.style.display = 'none';
        resetCottageAvailability();
      }
      updateCostBreakdown();
    }
    
    // Cottage toggle
    const addCottagesCheckbox = document.getElementById('addCottages');
    const cottageSection = document.getElementById('cottage-section');
    
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
    
    // Cottage quantity controls
    document.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cottage = btn.getAttribute('data-cottage');
        const action = btn.getAttribute('data-action');
        const qtyEl = document.querySelector(`.qty-value[data-cottage="${cottage}"]`);
        
        // Map cottage key to service name
        const serviceNameMap = {
          'open': 'Open Cottage',
          'standard': 'Standard Cottage',
          'family': 'Family Cottage'
        };
        const serviceName = serviceNameMap[cottage];
        
        // Get availability if dates are selected (async - will be handled in updateCottageAvailability)
        let maxAvailable = 4; // Default max
        // Note: Real-time availability check is done in updateCottageAvailability
        // This is a fallback for immediate UI feedback
        
        if (action === 'increase') {
          if (cottageQuantities[cottage] < maxAvailable) {
            cottageQuantities[cottage]++;
          } else {
            showToast(`Only ${maxAvailable} ${serviceName}(s) available.`, 'warning');
            return;
          }
        } else if (action === 'decrease' && cottageQuantities[cottage] > 0) {
          cottageQuantities[cottage]--;
        }
        
        qtyEl.textContent = cottageQuantities[cottage];
        
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
      const numRooms = parseInt(document.getElementById('numRooms').value) || 0;
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
      if (addCottagesCheckbox.checked && cottageCheckIn && cottageCheckOut) {
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
      
      grandTotalEl.textContent = `₱${total.toLocaleString()}`;
    }
    
    // Update breakdown on changes and validate room input
    const numRoomsInput = document.getElementById('numRooms');
    if (numRoomsInput) {
      numRoomsInput.addEventListener('change', async () => {
        // Validate against availability
        if (roomCheckIn && roomCheckOut) {
          try {
            const availability = await getServiceAvailability('Standard Room', roomCheckIn, roomCheckOut);
            const currentValue = parseInt(numRoomsInput.value) || 1;
            
            if (currentValue > availability.available) {
              numRoomsInput.value = Math.max(1, availability.available);
              showToast(`Only ${availability.available} room(s) available. Quantity adjusted.`, 'warning');
            } else if (currentValue < 1 && availability.available > 0) {
              numRoomsInput.value = 1;
            }
          } catch (error) {
            console.error('Error validating room availability:', error);
          }
        }
        updateCostBreakdown();
      });
      
      // Also validate on input event for real-time feedback
      numRoomsInput.addEventListener('input', async () => {
        if (roomCheckIn && roomCheckOut) {
          try {
            const availability = await getServiceAvailability('Standard Room', roomCheckIn, roomCheckOut);
            const currentValue = parseInt(numRoomsInput.value) || 0;
            
            if (currentValue > availability.available) {
              numRoomsInput.setCustomValidity(`Maximum ${availability.available} room(s) available`);
            } else {
              numRoomsInput.setCustomValidity('');
            }
          } catch (error) {
            console.error('Error validating room availability:', error);
          }
        }
      });
    }
    
    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Check terms and conditions first
      const acceptTermsCheckbox = document.getElementById('acceptTerms');
      const acceptTerms = acceptTermsCheckbox.checked;
      if (!acceptTerms) {
        showToast('Please accept the terms and conditions to continue', 'error');
        // Add visual feedback
        acceptTermsCheckbox.focus();
        acceptTermsCheckbox.style.outline = '2px solid #ef4444';
        acceptTermsCheckbox.style.outlineOffset = '2px';
        setTimeout(() => {
          acceptTermsCheckbox.style.outline = '';
          acceptTermsCheckbox.style.outlineOffset = '';
        }, 2000);
        // Scroll to checkbox
        acceptTermsCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      // Collect form data first
      const formData = new FormData(form);
      
      // Validation
      if (!validateGuests()) {
        showToast('Please fix guest count error', 'error');
        return;
      }
      
      // Room booking is REQUIRED - cannot book cottage only
      if (!roomCheckIn || !roomCheckOut) {
        showToast('Please select room dates. Room booking is required.', 'error');
        return;
      }
      
      const numRooms = parseInt(formData.get('numRooms')) || 0;
      if (numRooms < 1) {
        showToast('Please select at least 1 room. Room booking is required.', 'error');
        return;
      }
      
      // Validate room availability (async)
      try {
        const roomAvailability = await getServiceAvailability('Standard Room', roomCheckIn, roomCheckOut);
        if (numRooms > roomAvailability.available) {
          showToast(`Only ${roomAvailability.available} room(s) available for the selected dates.`, 'error');
          return;
        }
        
        if (addCottagesCheckbox.checked) {
          const hasCottages = Object.values(cottageQuantities).some(qty => qty > 0);
          if (hasCottages && (!cottageCheckIn || !cottageCheckOut)) {
            showToast('Please select cottage dates', 'error');
            return;
          }
          
          // Validate cottage availability
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
                  showToast(`Only ${cottageAvailability.available} ${name}(s) available for the selected dates.`, 'error');
                  return;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error validating availability:', error);
        showToast('Error checking availability. Please try again.', 'error');
        return;
      }
      
      // Create booking data with consistent structure for database
      const services = [];
      
      // Room booking is REQUIRED - always add room service
      services.push({
        name: 'Standard Room',
        quantity: numRooms,
        checkIn: roomCheckIn,
        checkOut: roomCheckOut
      });
      
      // Add cottage services (optional, but only if room is booked)
      if (addCottagesCheckbox.checked && cottageCheckIn && cottageCheckOut) {
        // Validate cottage dates are within room dates
        if (cottageCheckIn < roomCheckIn || cottageCheckOut > roomCheckOut) {
          showToast('Cottage dates must be within the room date range', 'error');
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
      
      // Use room dates as primary check-in/check-out (room is always required)
      const primaryCheckIn = roomCheckIn;
      const primaryCheckOut = roomCheckOut;
      
      // Ensure at least one service (room) is included
      if (services.length === 0) {
        showToast('Please select at least one room to book', 'error');
        return;
      }
      
      console.log('Creating booking with services:', services);
      
      const bookingData = {
        id: `BK-${Math.floor(100000 + Math.random() * 900000)}`, // Generate unique ID
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        guests: {
          adults: parseInt(formData.get('adults')),
          children: parseInt(formData.get('children') || '0')
        },
        services: services,
        checkIn: primaryCheckIn,
        checkOut: primaryCheckOut,
        type: 'Online',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      // Save to database
      import('../utils/database.js').then(({ createBooking }) => {
        createBooking({
          fullName: bookingData.fullName,
          email: bookingData.email,
          phone: bookingData.phone,
          guests: bookingData.guests,
          services: bookingData.services,
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          paymentMode: formData.get('paymentMode'),
          bookingType: 'Online'
        }).then(result => {
          if (result.success) {
            // Close modal on success
            if (modal && modal.close) {
              modal.close();
            } else {
              const modalElement = document.querySelector('.modal');
              if (modalElement) modalElement.remove();
            }
            
            showToast('Booking request submitted successfully!', 'success');
            console.log('Booking created successfully:', result.booking);
            
            // Redirect to bookings page after a short delay
            setTimeout(() => {
              location.hash = '#/bookings';
            }, 1500);
          } else {
            showToast(result.error || 'Failed to submit booking. Please try again.', 'error');
            console.error('Booking creation failed:', result.error);
            // Keep modal open on error so user can fix issues
          }
        }).catch(error => {
          console.error('Error submitting booking:', error);
          showToast('An error occurred. Please try again.', 'error');
          // Keep modal open on error so user can fix issues
        });
      });
    });
    });
  });
}

// Initialize function hall booking form
function initFunctionHallForm(packageName, packageDetails, showToast, modal) {
  const form = document.getElementById('comprehensive-booking-form');
  if (!form) return;
  
  // Pre-fill user information if logged in
  const currentUser = window.kinaAuth?.getCurrentUser();
  if (currentUser) {
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    
    if (fullNameInput) {
      // Combine first and last name, or use email prefix if no last name
      const fullName = currentUser.lastName 
        ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
        : currentUser.firstName || currentUser.email?.split('@')[0] || '';
      fullNameInput.value = fullName;
    }
    
    if (emailInput && currentUser.email) {
      emailInput.value = currentUser.email;
    }
  }
  
  let functionHallDate = null;
  const functionHallPrices = {
    'Grand Function Hall': 15000,
    'Intimate Function Hall': 10000
  };
  
  import('./bookingForm.js').then(({ formatDateString, parseDateString, formatDisplayDate, createSingleDateCalendar }) => {
    import('../utils/availability.js').then(({ 
      getServiceAvailabilityForDate,
      getAvailabilityStatusClass,
      getAvailabilityStatusIcon,
      formatAvailabilityText
    }) => {
    
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
            document.getElementById('functionHallDate').value = date || '';
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
              document.getElementById('functionHallDate').value = date;
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
                // Update availability after re-render (small delay to ensure DOM is ready)
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
                // Update availability after re-render
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
                // Update availability after re-render
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
              showToast('Please select a date', 'error');
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
    
    function updateFunctionHallAvailability() {
      if (!functionHallDate) {
        resetFunctionHallAvailability();
        return;
      }
      
      const functionHallServices = ['Grand Function Hall', 'Intimate Function Hall'];
      functionHallServices.forEach(serviceName => {
        const availability = getServiceAvailabilityForDate(serviceName, functionHallDate);
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
            showToast('Grand Function Hall is no longer available for the selected date.', 'warning');
          }
        } else if (serviceName === 'Intimate Function Hall' && intimateHallCheckbox) {
          intimateHallCheckbox.disabled = availability.available === 0;
          if (availability.available === 0 && intimateHallCheckbox.checked) {
            intimateHallCheckbox.checked = false;
            showToast('Intimate Function Hall is no longer available for the selected date.', 'warning');
          }
        }
      });
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
      if (functionHallDate) {
        dateText.textContent = formatDisplayDate(functionHallDate);
        updateFunctionHallAvailability();
      } else {
        dateText.textContent = 'Select date';
        resetFunctionHallAvailability();
      }
    }
    
    function updateCostBreakdown() {
      const breakdownItems = document.getElementById('breakdown-items');
      const grandTotalEl = document.getElementById('grand-total');
      let items = [];
      let total = 0;
      
      if (!functionHallDate) {
        breakdownItems.innerHTML = '<div style="color: var(--color-muted); text-align: center; padding: 10px 0;">Select date and function hall(s) to see pricing</div>';
        grandTotalEl.textContent = '₱0';
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
        breakdownItems.innerHTML = '<div style="color: var(--color-muted); text-align: center; padding: 10px 0;">Please select at least one function hall</div>';
        grandTotalEl.textContent = '₱0';
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
      breakdownItems.innerHTML = items.map(item => `
        <div class="breakdown-item">
          <span>${item.name}</span>
          <span>₱${item.amount.toLocaleString()}</span>
        </div>
      `).join('');
      
      grandTotalEl.textContent = `₱${total.toLocaleString()}`;
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
              showToast('Grand Function Hall is not available for the selected date.', 'error');
              return;
            }
          } catch (error) {
            console.error('Error checking availability:', error);
            e.target.checked = false;
            showToast('Error checking availability. Please try again.', 'error');
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
              showToast('Intimate Function Hall is not available for the selected date.', 'error');
              return;
            }
          } catch (error) {
            console.error('Error checking availability:', error);
            e.target.checked = false;
            showToast('Error checking availability. Please try again.', 'error');
            return;
          }
        }
        updateCostBreakdown();
      });
    }
    
    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Check terms and conditions
      const acceptTermsCheckbox = document.getElementById('acceptTerms');
      if (!acceptTermsCheckbox.checked) {
        showToast('Please accept the terms and conditions to continue', 'error');
        acceptTermsCheckbox.focus();
        acceptTermsCheckbox.style.outline = '2px solid #ef4444';
        acceptTermsCheckbox.style.outlineOffset = '2px';
        setTimeout(() => {
          acceptTermsCheckbox.style.outline = '';
          acceptTermsCheckbox.style.outlineOffset = '';
        }, 2000);
        acceptTermsCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      // Validation
      if (!functionHallDate) {
        showToast('Please select an event date', 'error');
        return;
      }
      
      // Validate availability (async)
      const selectedHalls = [];
      try {
        if (grandHallCheckbox && grandHallCheckbox.checked) {
          // Validate availability before adding
          const grandAvailability = await getServiceAvailabilityForDate('Grand Function Hall', functionHallDate);
          if (grandAvailability.available === 0) {
            showToast('Grand Function Hall is not available for the selected date.', 'error');
            grandHallCheckbox.checked = false;
            return;
          }
          selectedHalls.push('Grand Function Hall');
        }
        if (intimateHallCheckbox && intimateHallCheckbox.checked) {
          // Validate availability before adding
          const intimateAvailability = await getServiceAvailabilityForDate('Intimate Function Hall', functionHallDate);
          if (intimateAvailability.available === 0) {
            showToast('Intimate Function Hall is not available for the selected date.', 'error');
            intimateHallCheckbox.checked = false;
            return;
          }
          selectedHalls.push('Intimate Function Hall');
        }
      } catch (error) {
        console.error('Error validating availability:', error);
        showToast('Error checking availability. Please try again.', 'error');
        return;
      }
      
      if (selectedHalls.length === 0) {
        showToast('Please select at least one function hall', 'error');
        return;
      }
      
      // Collect form data with consistent structure for database
      const formData = new FormData(form);
      
      // Convert function halls to services array format
      const services = selectedHalls.map(hallName => ({
        name: hallName,
        quantity: 1,
        checkIn: functionHallDate,
        checkOut: functionHallDate // Function halls use single date
      }));
      
      const bookingData = {
        id: `BK-${Math.floor(100000 + Math.random() * 900000)}`, // Generate unique ID
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        guests: {
          adults: parseInt(formData.get('adults')),
          children: 0 // Function halls don't have children field
        },
        services: services,
        checkIn: functionHallDate,
        checkOut: functionHallDate, // Function halls use same date for check-in and check-out
        type: 'Online',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      // Save to database
      import('../utils/database.js').then(({ createBooking }) => {
        createBooking({
          fullName: bookingData.fullName,
          email: bookingData.email,
          phone: bookingData.phone,
          guests: bookingData.guests,
          services: bookingData.services,
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          paymentMode: formData.get('paymentMode'),
          bookingType: 'Online'
        }).then(result => {
          if (result.success) {
            // Close modal
            if (modal && modal.close) {
              modal.close();
            } else {
              const modalElement = document.querySelector('.modal');
              if (modalElement) modalElement.remove();
            }
            
            showToast('Function hall booking request submitted successfully!', 'success');
            // Redirect to bookings page after a short delay
            setTimeout(() => {
              location.hash = '#/bookings';
            }, 1500);
          } else {
            showToast(result.error || 'Failed to submit booking. Please try again.', 'error');
            // Reopen modal on error
            if (modal && modal.show) {
              modal.show();
            }
          }
        }).catch(error => {
          console.error('Error submitting booking:', error);
          showToast('An error occurred. Please try again.', 'error');
          // Reopen modal on error
          if (modal && modal.show) {
            modal.show();
          }
        });
      });
    });
    
    // Initial cost breakdown update
    updateCostBreakdown();
    resetFunctionHallAvailability();
    });
  });
}

// Create packages grid
export function createPackagesGrid(packages) {
  const grid = document.createElement('div');
  grid.className = 'packages-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8';
  
  packages.forEach(packageData => {
    const card = createLuxuryCard(packageData);
    grid.appendChild(card);
  });
  
  return grid;
}

// All packages data organized by category
export const allPackages = {
  cottages: [
    {
      image: 'images/kina1.jpg',
      title: 'Open Cottage',
      price: '₱300',
      description: 'Open-air cottage perfect for day use and gatherings.',
      category: 'cottages'
    },
    {
      image: 'images/kina2.jpg',
      title: 'Standard Cottage',
      price: '₱400',
      description: 'Standard cottage with basic amenities for your comfort.',
      category: 'cottages'
    },
    {
      image: 'images/kina3.jpg',
      title: 'Family Cottage',
      price: '₱500',
      description: 'Spacious family cottage ideal for larger groups.',
      category: 'cottages'
    }
  ],
  rooms: [
    {
      image: 'images/kina1.jpg',
      title: 'Standard Room',
      price: '₱2,000/Day',
      description: 'Comfortable standard room with essential amenities for your stay.',
      category: 'rooms'
    }
  ],
  functionHall: [
    {
      image: 'images/kina1.jpg',
      title: 'Grand Function Hall',
      price: '₱15,000',
      description: 'Spacious grand function hall perfect for large events and celebrations.',
      category: 'functionHall'
    },
    {
      image: 'images/kina2.jpg',
      title: 'Intimate Function Hall',
      price: '₱10,000',
      description: 'Intimate function hall ideal for smaller gatherings and events.',
      category: 'functionHall'
    }
  ]
};

// Combined packages for search/filter
export const samplePackages = [
  ...allPackages.cottages,
  ...allPackages.rooms,
  ...allPackages.functionHall
];

// Make allPackages available globally for booking form
window.getAllPackages = () => allPackages;
