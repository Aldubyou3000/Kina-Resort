// Admin Database utilities - Uses admin Supabase client
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../../assets/js/config/supabaseConfig.js';

// Create custom storage for admin sessions (separate from resort website)
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

// Create Supabase client with admin session storage
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: adminStorage  // Use separate storage for admin sessions
  }
});

/**
 * Get all bookings (for admin)
 * @param {Object} filters - Optional filters {status, startDate, endDate}
 * @returns {Promise<Array>}
 */
export async function getAllBookings(filters = {}) {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        booking_services (*)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.startDate) {
      query = query.gte('check_in', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('check_out', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all bookings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllBookings:', error);
    return [];
  }
}

/**
 * Get booking by ID
 * @param {string} bookingId - UUID of the booking
 * @returns {Promise<Object|null>}
 */
export async function getBookingById(bookingId) {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_services (*)
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return null;
    }

    return booking;
  } catch (error) {
    console.error('Error in getBookingById:', error);
    return null;
  }
}

/**
 * Update booking status (for admin)
 * @param {string} bookingId - UUID of the booking
 * @param {string} status - New status
 * @param {string} notes - Optional notes
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function updateBookingStatus(bookingId, status, notes = null) {
  try {
    // Prevent updating cancelled bookings to any other status (especially 'confirmed')
    if (status === 'confirmed') {
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching booking status:', fetchError);
        return { success: false, error: 'Could not verify booking status' };
      }
      
      if (booking && booking.status === 'cancelled') {
        return { success: false, error: 'Cannot approve a cancelled booking. Cancelled bookings cannot be approved.' };
      }
    }
    
    const updateData = { status };
    if (notes !== null) {
      updateData.notes = notes;
    }

    // Use admin Supabase client (has admin session)
    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in updateBookingStatus:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel booking (for admin)
 * @param {string} bookingId - UUID of the booking
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function cancelBooking(bookingId) {
  return updateBookingStatus(bookingId, 'cancelled');
}

/**
 * Delete booking permanently (for admin)
 * @param {string} bookingId - UUID of the booking
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteBooking(bookingId) {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      console.error('Error deleting booking:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in deleteBooking:', error);
    return { success: false, error: error.message };
  }
}

// Service pricing configuration (same as main database.js)
const SERVICE_PRICES = {
  'Standard Room': 2000,
  'Open Cottage': 300,
  'Standard Cottage': 400,
  'Family Cottage': 500,
  'Grand Function Hall': 15000,
  'Intimate Function Hall': 10000
};

// Helper functions
function calculateDays(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1; // Minimum 1 day
}

function getServiceType(serviceName) {
  if (serviceName.includes('Room')) return 'room';
  if (serviceName.includes('Cottage')) return 'cottage';
  if (serviceName.includes('Function Hall')) return 'functionHall';
  return 'other';
}

function generateBookingId() {
  const randomId = Math.floor(100000 + Math.random() * 900000);
  return `BK-${randomId}`;
}

/**
 * Create a walk-in booking (for admin)
 * @param {Object} bookingData - Booking data
 * @returns {Promise<{success: boolean, booking: Object|null, error: string|null}>}
 */
export async function createWalkInBooking(bookingData) {
  try {
    const {
      fullName,
      email,
      phone,
      guests,
      services,
      checkIn,
      checkOut,
      paymentMode
    } = bookingData;

    // Validate required fields
    if (!fullName || !email || !phone || !services || !checkIn || !checkOut) {
      return { success: false, booking: null, error: 'Missing required fields' };
    }

    // Calculate total amount
    let totalAmount = 0;
    const bookingServices = services.map(service => {
      const pricePerUnit = SERVICE_PRICES[service.name] || 0;
      const days = calculateDays(service.checkIn, service.checkOut);
      const serviceTotal = pricePerUnit * service.quantity * days;
      totalAmount += serviceTotal;

      return {
        service_name: service.name,
        service_type: getServiceType(service.name),
        quantity: service.quantity,
        service_check_in: service.checkIn,
        service_check_out: service.checkOut,
        price_per_unit: pricePerUnit,
        total_price: serviceTotal
      };
    });

    // Generate booking ID
    const bookingId = generateBookingId();

    // Insert booking (walk-in type, no user_id required)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_id: bookingId,
        full_name: fullName,
        email: email,
        phone: phone,
        guests_adults: guests?.adults || 1,
        guests_children: guests?.children || 0,
        check_in: checkIn,
        check_out: checkOut,
        booking_type: 'Walk-In',
        payment_mode: paymentMode,
        status: 'pending',
        total_amount: totalAmount,
        user_id: null // Walk-in bookings don't require user account
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating walk-in booking:', bookingError);
      return { success: false, booking: null, error: bookingError.message };
    }

    // Insert booking services
    const servicesWithBookingId = bookingServices.map(service => ({
      ...service,
      booking_id: booking.id
    }));

    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(servicesWithBookingId);

    if (servicesError) {
      // Rollback: delete the booking if services insert fails
      await supabase.from('bookings').delete().eq('id', booking.id);
      console.error('Error creating booking services:', servicesError);
      return { success: false, booking: null, error: servicesError.message };
    }

    // Fetch complete booking with services
    const completeBooking = await getBookingById(booking.id);

    return { success: true, booking: completeBooking, error: null };
  } catch (error) {
    console.error('Error in createWalkInBooking:', error);
    return { success: false, booking: null, error: error.message };
  }
}

