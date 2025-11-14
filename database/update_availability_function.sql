-- Update the check_service_availability function to only count confirmed bookings
-- Run this SQL in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION check_service_availability(
    p_service_name VARCHAR,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_total_capacity INTEGER;
    v_booked_quantity INTEGER;
BEGIN
    -- Get total capacity for the service
    SELECT CASE
        WHEN p_service_name IN ('Grand Function Hall', 'Intimate Function Hall') THEN 1
        WHEN p_service_name = 'Standard Room' THEN 4
        WHEN p_service_name IN ('Open Cottage', 'Standard Cottage', 'Family Cottage') THEN 4
        ELSE 0
    END INTO v_total_capacity;
    
    -- Count booked quantity for overlapping dates
    -- Only count CONFIRMED bookings for availability (pending bookings don't block availability)
    SELECT COALESCE(SUM(bs.quantity), 0) INTO v_booked_quantity
    FROM booking_services bs
    INNER JOIN bookings b ON bs.booking_id = b.id
    WHERE bs.service_name = p_service_name
        AND b.status = 'confirmed' -- Only confirmed bookings affect availability
        AND (b.id != p_exclude_booking_id OR p_exclude_booking_id IS NULL)
        AND (
            -- Check for date overlap: new booking overlaps with existing booking
            (bs.service_check_in <= p_check_out AND bs.service_check_out >= p_check_in)
        );
    
    -- Return available quantity
    RETURN GREATEST(0, v_total_capacity - v_booked_quantity);
END;
$$ LANGUAGE plpgsql;

