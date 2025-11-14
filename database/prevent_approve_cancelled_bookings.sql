-- Prevent Approving Cancelled Bookings
-- This ensures that cancelled bookings cannot be approved (changed to 'confirmed')
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Create function to prevent approving cancelled bookings
-- ============================================================================

-- Function to check if a booking status update is valid
-- Prevents cancelled bookings from being changed to 'confirmed'
CREATE OR REPLACE FUNCTION prevent_approve_cancelled_bookings()
RETURNS TRIGGER AS $$
BEGIN
    -- If trying to update status to 'confirmed', check if current status is 'cancelled'
    IF NEW.status = 'confirmed' AND OLD.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot approve a cancelled booking. Cancelled bookings cannot be approved.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: Create trigger to enforce the constraint
-- ============================================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS check_cancelled_booking_approval ON bookings;

-- Create trigger that runs before update
CREATE TRIGGER check_cancelled_booking_approval
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'confirmed' AND OLD.status = 'cancelled')
    EXECUTE FUNCTION prevent_approve_cancelled_bookings();

-- ============================================================================
-- SUMMARY:
-- ============================================================================
-- This trigger prevents any booking with status 'cancelled' from being
-- updated to 'confirmed'. This provides database-level protection in addition
-- to the application-level checks.
--
-- The trigger will raise an error if someone tries to approve a cancelled booking,
-- ensuring data integrity even if the application-level checks are bypassed.
-- ============================================================================

