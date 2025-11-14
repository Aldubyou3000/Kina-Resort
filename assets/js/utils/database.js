// Database utility functions for Supabase
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabaseConfig.js';

// Create custom storage for resort website sessions (matches auth.js)
// This ensures admin dashboard and resort website have separate login sessions
const resortStorage = {
  getItem: (key) => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(`kina-resort-${key}`);
    }
    return null;
  },
  setItem: (key, value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`kina-resort-${key}`, value);
    }
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`kina-resort-${key}`);
    }
  }
};

// Initialize Supabase client with session persistence
// Note: Admin dashboard uses separate storage, so sessions are NOT shared between admin and user accounts
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: resortStorage  // Use custom storage to match auth.js
  }
});

// Get authenticated Supabase client if available (for admin operations)
// Note: Admin dashboard uses separate storage, so sessions are NOT shared
async function getAuthenticatedClient() {
  // Check if we have an active session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session && !error && session.user) {
      // Verify session is not expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at > now) {
        // Client has a valid session, return it
        return supabase;
      } else {
        // Session expired, try to refresh
        console.warn('Session expired, attempting refresh...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshedSession && !refreshError) {
          return supabase;
        }
      }
    }
  } catch (e) {
    console.warn('Error checking session:', e);
  }
  
  // Fallback to default client (will work for public operations)
  return supabase;
}

// Generate unique booking ID
function generateBookingId() {
  // Generate a random 6-digit number
  const randomId = Math.floor(100000 + Math.random() * 900000);
  return `BK-${randomId}`;
}

// Service pricing configuration
const SERVICE_PRICES = {
  'Standard Room': 2000,
  'Open Cottage': 300,
  'Standard Cottage': 400,
  'Family Cottage': 500,
  'Grand Function Hall': 15000,
  'Intimate Function Hall': 10000
};

// Service capacity configuration
const SERVICE_CAPACITY = {
  'Standard Room': 4,
  'Open Cottage': 4,
  'Standard Cottage': 4,
  'Family Cottage': 4,
  'Grand Function Hall': 1,
  'Intimate Function Hall': 1
};

/**
 * Check if a service is available for the given date range
 * @param {string} serviceName - Name of the service
 * @param {string} checkIn - Check-in date (YYYY-MM-DD)
 * @param {string} checkOut - Check-out date (YYYY-MM-DD)
 * @param {string|null} excludeBookingId - Booking ID to exclude from check (for updates)
 * @returns {Promise<{available: number, total: number, status: string}>}
 */
export async function checkServiceAvailability(serviceName, checkIn, checkOut, excludeBookingId = null) {
  try {
    // Build query to count booked quantity
    // Only count CONFIRMED bookings for availability (pending bookings don't block availability)
    let query = supabase
      .from('booking_services')
      .select('quantity, booking_id, bookings!inner(*)')
      .eq('service_name', serviceName)
      .eq('bookings.status', 'confirmed'); // Only confirmed bookings affect availability

    // Exclude specific booking if provided
    if (excludeBookingId) {
      query = query.neq('booking_id', excludeBookingId);
    }

    // Check for date overlap: existing booking overlaps with requested dates
    // Overlap condition: existing_check_in <= requested_check_out AND existing_check_out >= requested_check_in
    query = query
      .lte('service_check_in', checkOut)
      .gte('service_check_out', checkIn);

    const { data, error } = await query;

    if (error) {
      console.error('Error checking availability:', error);
      // On error, return full availability (don't block bookings due to query errors)
      // This prevents the calendar from showing everything as booked when there's a query issue
      const totalCapacity = SERVICE_CAPACITY[serviceName] || 0;
      return { available: totalCapacity, total: totalCapacity, status: 'available' };
    }

    // Debug logging
    console.log(`[Availability] ${serviceName} for ${checkIn} to ${checkOut}:`, {
      data,
      dataLength: data?.length,
      quantities: data?.map(item => item.quantity)
    });

    // Calculate booked quantity
    const bookedQuantity = data ? data.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
    const totalCapacity = SERVICE_CAPACITY[serviceName] || 0;
    const available = Math.max(0, totalCapacity - bookedQuantity);

    // Determine status
    let status = 'available';
    if (available === 0) {
      status = 'fully-booked';
    } else if (available <= Math.ceil(totalCapacity * 0.25)) {
      status = 'low-stock';
    }

    return { available, total: totalCapacity, status };
  } catch (error) {
    console.error('Error in checkServiceAvailability:', error);
    // On error, return full availability (don't block bookings due to query errors)
    const totalCapacity = SERVICE_CAPACITY[serviceName] || 0;
    return { available: totalCapacity, total: totalCapacity, status: 'available' };
  }
}

/**
 * Check availability for multiple services
 * @param {Array<{serviceName: string, checkIn: string, checkOut: string, quantity: number}>} services
 * @param {string|null} excludeBookingId - Booking ID to exclude
 * @returns {Promise<{allAvailable: boolean, results: Array}>}
 */
export async function checkMultipleServicesAvailability(services, excludeBookingId = null) {
  const results = await Promise.all(
    services.map(async (service) => {
      // Support both 'name' and 'serviceName' for compatibility
      const serviceName = service.serviceName || service.name;
      const checkIn = service.checkIn || service.serviceCheckIn;
      const checkOut = service.checkOut || service.serviceCheckOut;
      const quantity = service.quantity || 1;
      
      const availability = await checkServiceAvailability(
        serviceName,
        checkIn,
        checkOut,
        excludeBookingId
      );
      return {
        ...service,
        serviceName: serviceName,
        checkIn: checkIn,
        checkOut: checkOut,
        quantity: quantity,
        ...availability,
        hasEnough: availability.available >= quantity
      };
    })
  );

  const allAvailable = results.every(r => r.hasEnough);
  return { allAvailable, results };
}

/**
 * Create a new booking
 * @param {Object} bookingData - Booking data
 * @returns {Promise<{success: boolean, booking: Object|null, error: string|null}>}
 */
export async function createBooking(bookingData) {
  try {
    const {
      fullName,
      email,
      phone,
      guests,
      services,
      checkIn,
      checkOut,
      paymentMode,
      bookingType = 'Online',
      userId = null
    } = bookingData;

    // ============================================================================
    // REQUIRE AUTHENTICATION: Check if user is logged in
    // ============================================================================
    let finalUserId = userId;
    let session = null;
    
    try {
      const { data: { session: userSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error checking session:', sessionError);
        return { 
          success: false, 
          booking: null, 
          error: 'Authentication error. Please log in to create a booking.' 
        };
      }
      
      session = userSession;
      
      if (!session || !session.user) {
        return { 
          success: false, 
          booking: null, 
          error: 'You must be logged in to create a booking. Please log in or create an account first.' 
        };
      }
      
      // Use the authenticated user's ID
      finalUserId = session.user.id;
      
      // Verify user_id matches if provided
      if (userId && userId !== finalUserId) {
        return { 
          success: false, 
          booking: null, 
          error: 'User ID mismatch. Please log in again.' 
        };
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      return { 
        success: false, 
        booking: null, 
        error: 'Authentication error. Please log in to create a booking.' 
      };
    }

    // Validate required fields
    if (!fullName || !email || !phone || !services || !checkIn || !checkOut) {
      return { success: false, booking: null, error: 'Missing required fields' };
    }
    
    // Ensure user_id is set (should always be set at this point, but double-check)
    if (!finalUserId) {
      return { 
        success: false, 
        booking: null, 
        error: 'User ID is missing. Please log in again.' 
      };
    }

    // Check availability for all services
    const availabilityCheck = await checkMultipleServicesAvailability(services);
    if (!availabilityCheck.allAvailable) {
      const unavailableServices = availabilityCheck.results
        .filter(r => !r.hasEnough)
        .map(r => `${r.serviceName} (need ${r.quantity}, available ${r.available})`)
        .join(', ');
      return {
        success: false,
        booking: null,
        error: `Not enough availability for: ${unavailableServices}`
      };
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

    // Insert booking
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
        booking_type: bookingType,
        payment_mode: paymentMode,
        status: 'pending',
        total_amount: totalAmount,
        user_id: finalUserId
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      console.error('Booking data attempted:', {
        booking_id: bookingId,
        email: email,
        user_id: finalUserId,
        hasSession: !!finalUserId
      });
      // Provide more helpful error message
      let errorMessage = bookingError.message;
      if (bookingError.code === '42501' || bookingError.message.includes('permission') || bookingError.message.includes('policy')) {
        if (!session || !session.user) {
          errorMessage = 'You must be logged in to create a booking. Please log in or create an account first.';
        } else {
          errorMessage = 'Permission denied. Please ensure you are logged in with a valid account. If the problem persists, contact support.';
        }
      }
      return { success: false, booking: null, error: errorMessage };
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
      console.error('Services data attempted:', servicesWithBookingId);
      // Provide more helpful error message
      let errorMessage = servicesError.message;
      if (servicesError.code === '42501' || servicesError.message.includes('permission') || servicesError.message.includes('policy')) {
        if (!session || !session.user) {
          errorMessage = 'You must be logged in to create a booking. Please log in or create an account first.';
        } else {
          errorMessage = 'Permission denied when creating booking services. Please ensure you are logged in with a valid account.';
        }
      }
      return { success: false, booking: null, error: errorMessage };
    }

    // Fetch complete booking with services
    const completeBooking = await getBookingById(booking.id);

    return { success: true, booking: completeBooking, error: null };
  } catch (error) {
    console.error('Error in createBooking:', error);
    return { success: false, booking: null, error: error.message };
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
 * Get booking by booking_id (human-readable ID)
 * @param {string} bookingId - Human-readable booking ID like BK-123456
 * @returns {Promise<Object|null>}
 */
export async function getBookingByBookingId(bookingId) {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_services (*)
      `)
      .eq('booking_id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return null;
    }

    return booking;
  } catch (error) {
    console.error('Error in getBookingByBookingId:', error);
    return null;
  }
}

/**
 * Get user bookings for authenticated user
 * @param {string} userId - Authenticated user ID (UUID)
 * @param {string} email - User email (for fallback matching)
 * @returns {Promise<Array>}
 */
export async function getUserBookings(userId, email) {
  try {
    // Verify user is authenticated and session is valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || !session.user) {
      console.error('User not authenticated:', sessionError);
      return [];
    }

    // Check if session is expired and try to refresh
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at <= now) {
      console.warn('Session expired, attempting refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshedSession || !refreshedSession.user) {
        console.error('Failed to refresh session:', refreshError);
        return [];
      }
      // Use refreshed session
      if (refreshedSession.user.id !== userId) {
        console.error('User ID mismatch after refresh - cannot access other user bookings');
        return [];
      }
    } else {
      // Verify the userId matches the authenticated user
      if (session.user.id !== userId) {
        console.error('User ID mismatch - cannot access other user bookings');
        return [];
      }
    }

    // Query bookings by user_id (primary) or email (fallback for bookings created before user_id was set)
    // RLS policies will ensure users can only see their own bookings
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_services (*)
      `)
      .or(`user_id.eq.${userId},email.eq.${email}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }

    // Additional security check: filter out any bookings that don't belong to this user
    // This is a defense-in-depth measure in case RLS policies fail
    const filteredData = (data || []).filter(booking => 
      booking.user_id === userId || booking.email === email
    );

    return filteredData;
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    return [];
  }
}

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
 * Update booking status
 * @param {string} bookingId - UUID of the booking
 * @param {string} status - New status
 * @param {string} notes - Optional notes
 * @param {boolean} skipOwnershipCheck - Skip ownership check (for admin operations)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function updateBookingStatus(bookingId, status, notes = null, skipOwnershipCheck = false) {
  try {
    // Verify session is still valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || !session.user) {
      return { 
        success: false, 
        error: 'Your session has expired. Please log in again.' 
      };
    }

    // DEBUG: Check user role in JWT to understand RLS blocking
    const jwt = session.access_token;
    if (jwt) {
      try {
        // Decode JWT to check role (JWT is base64 encoded)
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        const userRole = payload?.user_metadata?.role || payload?.app_metadata?.role || 'no-role';
        console.log('🔍 User role in JWT:', userRole);
        console.log('🔍 JWT payload (user_metadata):', payload?.user_metadata);
        console.log('🔍 JWT payload (app_metadata):', payload?.app_metadata);
        
        // If user has admin role, they should use admin dashboard, not resort website
        if (userRole === 'admin') {
          console.error('❌ Admin user trying to cancel booking via resort website - this should not happen');
          return {
            success: false,
            error: 'Admin accounts should use the admin dashboard to manage bookings.'
          };
        }
      } catch (e) {
        console.warn('Could not decode JWT for role check:', e);
      }
    }

    // If not skipping ownership check, verify the user owns this booking
    if (!skipOwnershipCheck) {
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('user_id, email')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return { 
          success: false, 
          error: 'Booking not found or you do not have permission to modify it.' 
        };
      }

      // Verify ownership: user_id must match OR email must match (for older bookings)
      const userId = session.user.id;
      const userEmail = session.user.email;
      
      if (booking.user_id && booking.user_id !== userId) {
        return { 
          success: false, 
          error: 'You do not have permission to modify this booking.' 
        };
      }
      
      // If no user_id but email doesn't match, also deny
      if (!booking.user_id && booking.email !== userEmail) {
        return { 
          success: false, 
          error: 'You do not have permission to modify this booking.' 
        };
      }
    }

    const updateData = { status };
    if (notes !== null) {
      updateData.notes = notes;
    }

    // Use authenticated client
    const client = await getAuthenticatedClient();
    
    // CRITICAL: Use .select() to verify rows were actually updated
    // Supabase update can succeed (no error) but update 0 rows if RLS blocks it
    const { data, error } = await client
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select(); // Select to verify update actually happened

    if (error) {
      console.error('Error updating booking status:', error);
      
      // Provide more helpful error messages
      if (error.code === '42501' || error.message.includes('row-level security') || error.message.includes('policy')) {
        // RLS policy blocked the update - this is NOT a session expiration
        // Don't redirect to login, just show the error
        console.error('❌ RLS Policy blocked the update:', error.message);
        return { 
          success: false, 
          error: 'Permission denied. Unable to cancel booking. The booking may not be cancellable, or there may be a permission issue. Please contact support if this persists.' 
        };
      }
      
      // Check for actual session errors (different error codes)
      if (error.code === 'PGRST301' || error.message.includes('JWT') || error.message.includes('expired')) {
        return { 
          success: false, 
          error: 'Your session has expired. Please log in again.' 
        };
      }
      
      return { success: false, error: error.message };
    }

    // CRITICAL: Check if any rows were actually updated
    // If data is empty or null, no rows were updated (RLS might have blocked it)
    if (!data || data.length === 0) {
      console.error('❌ UPDATE FAILED: No rows were updated - RLS policy may have blocked the update');
      console.error('Booking ID:', bookingId);
      console.error('Trying to set status to:', status);
      console.error('Session user ID:', session.user.id);
      console.error('Session user email:', session.user.email);
      
      // Try to fetch the booking to see what's wrong
      const { data: checkBooking, error: checkError } = await supabase
        .from('bookings')
        .select('id, status, user_id, email')
        .eq('id', bookingId)
        .single();
      
      if (checkError || !checkBooking) {
        console.error('❌ Could not fetch booking to check:', checkError);
        return { 
          success: false, 
          error: 'Booking not found or you do not have permission to modify it.' 
        };
      }
      
      console.error('📋 Booking details:', {
        id: checkBooking.id,
        status: checkBooking.status,
        user_id: checkBooking.user_id,
        email: checkBooking.email,
        session_user_id: session.user.id,
        user_id_match: checkBooking.user_id === session.user.id,
        email_match: checkBooking.email === session.user.email
      });
      
      // Check if booking is already cancelled
      if (checkBooking.status === 'cancelled' && status === 'cancelled') {
        return { 
          success: false, 
          error: 'Booking is already cancelled.' 
        };
      }
      
      // Check ownership
      if (checkBooking.user_id && checkBooking.user_id !== session.user.id) {
        console.error('❌ Ownership mismatch:', {
          booking_user_id: checkBooking.user_id,
          session_user_id: session.user.id
        });
        return { 
          success: false, 
          error: 'You do not have permission to modify this booking.' 
        };
      }
      
      // Check if booking has no user_id but email doesn't match
      if (!checkBooking.user_id && checkBooking.email !== session.user.email) {
        console.error('❌ Email mismatch:', {
          booking_email: checkBooking.email,
          session_email: session.user.email
        });
        return { 
          success: false, 
          error: 'You do not have permission to modify this booking.' 
        };
      }
      
      // If we get here, RLS policy is blocking the update
      // This could be because:
      // 1. The booking status is not 'pending' (RLS requires status = 'pending')
      // 2. The user is detected as admin (RLS requires NOT is_admin_or_staff())
      // 3. Some other RLS condition is not met
      console.error('❌ RLS POLICY BLOCKED: Update was blocked by Row Level Security policy');
      console.error('Possible reasons:');
      console.error('1. Booking status is not "pending" (current:', checkBooking.status, ')');
      console.error('2. User might be detected as admin');
      console.error('3. RLS policy conditions not met');
      
      return { 
        success: false, 
        error: `Permission denied. Unable to update booking. Current status: ${checkBooking.status}. Only pending bookings can be cancelled.` 
      };
    }

    console.log('Booking successfully updated:', data[0]);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in updateBookingStatus:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Cancel booking
 * @param {string} bookingId - UUID of the booking
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function cancelBooking(bookingId) {
  // Don't skip ownership check - let RLS policy handle it
  // The ownership check in kinaCancelBooking is just for UI feedback
  // RLS policy will ensure security at the database level
  return updateBookingStatus(bookingId, 'cancelled', null, false);
}

/**
 * Delete booking permanently
 * @param {string} bookingId - UUID of the booking
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteBooking(bookingId) {
  try {
    // Use authenticated client if available (for admin operations)
    const client = await getAuthenticatedClient();
    
    const { error } = await client
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

/**
 * Get availability for a date range (for calendar)
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {Promise<Object>}
 */
export async function getAvailabilityForDate(dateStr) {
  const services = Object.keys(SERVICE_CAPACITY);
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

/**
 * Get bookings for a date range (for calendar display)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>}
 */
export async function getBookingsForDateRange(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_services (*)
      `)
      .eq('status', 'confirmed') // Only confirmed bookings are shown in calendar
      .lte('check_in', endDate)
      .gte('check_out', startDate)
      .order('check_in', { ascending: true });

    if (error) {
      console.error('Error fetching bookings for date range:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBookingsForDateRange:', error);
    return [];
  }
}

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

// Export service configuration
export { SERVICE_PRICES, SERVICE_CAPACITY };

