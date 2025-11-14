-- Fix: Allow users to view all their bookings (including cancelled and completed)
-- This ensures cancelled and checked-out (completed) bookings appear in the resort table
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Create helper function to get user email from JWT (avoids permission issues)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_jwt JSONB;
  v_email TEXT;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get JWT token (contains user email)
    v_jwt := auth.jwt();
    
    -- Extract email from JWT claims
    v_email := v_jwt->>'email';
    
    RETURN v_email;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email() TO anon;

-- ============================================================================
-- STEP 2: Update the "Users can view own bookings" policy to include email matching
-- This allows users to see ALL their bookings regardless of status (cancelled, completed, etc.)
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;

-- Create updated policy that matches by user_id OR email (from JWT)
-- This ensures users can see all their bookings, including cancelled and completed ones
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT
    USING (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Exclude admins (they use the admin policy)
        AND NOT is_admin_or_staff()
        -- Match by user_id OR email (for bookings created before user_id was set or mismatched user_id)
        AND (
            -- Case 1: Booking has user_id and it matches authenticated user
            (user_id IS NOT NULL AND user_id = auth.uid())
            OR
            -- Case 2: Booking email matches authenticated user's email (fallback for old bookings or mismatched user_id)
            (email = get_user_email())
        )
    );

-- ============================================================================
-- STEP 3: Update booking_services policy to match
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own booking services" ON booking_services;

-- Create updated policy
CREATE POLICY "Users can view own booking services" ON booking_services
    FOR SELECT
    USING (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Exclude admins (they use the admin policy)
        AND NOT is_admin_or_staff()
        AND EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_services.booking_id
            -- Match by user_id OR email (same logic as bookings policy)
            AND (
                (bookings.user_id IS NOT NULL AND bookings.user_id = auth.uid())
                OR
                (bookings.email = get_user_email())
            )
        )
    );

-- ============================================================================
-- SUMMARY:
-- ============================================================================
-- After running this script:
-- 
-- Users will be able to see ALL their bookings in the resort table, including:
--   - Cancelled bookings
--   - Completed (checked-out) bookings
--   - Pending bookings
--   - Confirmed bookings
--
-- The policy now matches bookings by both user_id and email (from JWT),
-- ensuring all user bookings are visible regardless of when they were created.

