// Availability utility for resort booking system
import { parseDateString, formatDateString } from '../components/bookingForm.js';
import { checkServiceAvailability } from './database.js';

// Service inventory configuration
const SERVICE_INVENTORY = {
  'Standard Room': { total: 4, category: 'rooms' },
  'Open Cottage': { total: 4, category: 'cottages' },
  'Standard Cottage': { total: 4, category: 'cottages' },
  'Family Cottage': { total: 4, category: 'cottages' },
  'Grand Function Hall': { total: 1, category: 'functionHalls' },
  'Intimate Function Hall': { total: 1, category: 'functionHalls' }
};

// Get daily availability from database
async function generateDailyAvailability(dateStr) {
  const services = Object.keys(SERVICE_INVENTORY);
  const availability = {};

  await Promise.all(
    services.map(async (serviceName) => {
      // For function halls, check single date
      if (serviceName.includes('Function Hall')) {
        const result = await checkServiceAvailability(serviceName, dateStr, dateStr);
        availability[serviceName] = result;
      } else {
        // For rooms and cottages, check single date (same as check-in and check-out)
        const result = await checkServiceAvailability(serviceName, dateStr, dateStr);
        availability[serviceName] = result;
      }
    })
  );

  return availability;
}

// Get availability for a specific service over a date range
export async function getServiceAvailability(serviceName, startDateStr, endDateStr) {
  try {
    // Use database function to check availability
    const result = await checkServiceAvailability(serviceName, startDateStr, endDateStr);
    return result;
  } catch (error) {
    console.error('Error getting service availability:', error);
    // Fallback to total capacity if error
    const totalCapacity = SERVICE_INVENTORY[serviceName]?.total || 0;
    return {
      available: 0,
      total: totalCapacity,
      status: 'error'
    };
  }
}

// Get availability for a single date (for function halls)
export async function getServiceAvailabilityForDate(serviceName, dateStr) {
  try {
    // Use database function to check availability for single date
    const result = await checkServiceAvailability(serviceName, dateStr, dateStr);
    return result;
  } catch (error) {
    console.error('Error getting service availability for date:', error);
    // Fallback to total capacity if error
    const totalCapacity = SERVICE_INVENTORY[serviceName]?.total || 0;
    return {
      available: 0,
      total: totalCapacity,
      status: 'error'
    };
  }
}

// Get availability status class for styling
export function getAvailabilityStatusClass(status) {
  return `status-${status}`;
}

// Get availability status icon
export function getAvailabilityStatusIcon(status) {
  switch (status) {
    case 'available':
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';
    case 'low-stock':
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
    case 'fully-booked':
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>';
    default:
      return '';
  }
}

// Format availability text
export function formatAvailabilityText(available, total) {
  if (available === 0) {
    return 'Fully Booked';
  } else if (available === 1 && total === 1) {
    return 'Available'; // For single-item services like function halls
  } else {
    return `Available: ${available}/${total} left`;
  }
}

// Get availability badge text for calendar day cells
export async function getAvailabilityBadge(serviceName, dateStr) {
  const availability = await getServiceAvailabilityForDate(serviceName, dateStr);
  
  if (availability.available === 0) {
    return '0';
  } else if (availability.available === availability.total) {
    return availability.total.toString();
  } else {
    return `${availability.available}/${availability.total}`;
  }
}

// Get all services availability for a date range (for calendar page)
export async function getAllServicesAvailability(startDateStr, endDateStr) {
  const services = Object.keys(SERVICE_INVENTORY);
  const result = {};
  
  await Promise.all(
    services.map(async (serviceName) => {
      result[serviceName] = await getServiceAvailability(serviceName, startDateStr, endDateStr);
    })
  );
  
  return result;
}

