-- FINAL FIX: User Cancel Booking Policy (Handles NULL user_id)
-- This ensures users can cancel their own pending bookings
-- Works for both bookings with user_id and bookings with only email
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Check current UPDATE policies (for debugging)
-- ============================================================================

SELECT 
    policyname, 
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'bookings' AND cmd = 'UPDATE'
ORDER BY policyname;

-- ============================================================================
-- STEP 2: Drop ALL existing user cancel policies (clean slate)
-- ============================================================================

-- Drop any existing user cancel policies (there might be multiple versions)
DROP POLICY IF EXISTS "Users can cancel own pending bookings" ON bookings;
DROP POLICY IF EXISTS "Users can cancel own bookings" ON bookings;
DROP POLICY IF EXISTS "User can cancel pending bookings" ON bookings;

-- ============================================================================
-- STEP 3: Create the correct policy with proper checks
-- ============================================================================

-- Create a policy that allows users (non-admin) to cancel their own pending bookings
-- This policy handles TWO cases:
-- 1. Bookings with user_id: user_id must match auth.uid()
-- 2. Bookings without user_id (older bookings): email must match authenticated user's email
-- 
-- This policy:
-- 1. Checks that user is authenticated
-- 2. Checks that booking belongs to the user (user_id matches OR email matches)
-- 3. Checks that booking is pending (can't cancel confirmed bookings)
-- 4. Checks that user is NOT admin (admins use admin policy)
-- 5. Only allows status to be changed to 'cancelled'

-- First, create a helper function to get user email (avoids permission issues)
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

-- Now create the policy using the helper function
CREATE POLICY "Users can cancel own pending bookings" ON bookings
    FOR UPDATE
    USING (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Booking must be pending (users can't cancel confirmed bookings)
        AND status = 'pending'
        -- User must NOT be admin (admins use the admin policy)
        -- Use COALESCE to handle NULL values safely
        AND COALESCE(is_admin_or_staff(), false) = false
        -- Booking must belong to the user: EITHER user_id matches OR email matches
        AND (
            -- Case 1: Booking has user_id and it matches authenticated user
            (user_id IS NOT NULL AND user_id = auth.uid())
            OR
            -- Case 2: Booking has no user_id, so check email match using helper function
            (user_id IS NULL AND email = get_user_email())
        )
    )
    WITH CHECK (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Can only change status to 'cancelled'
        AND status = 'cancelled'
        -- User must NOT be admin
        AND COALESCE(is_admin_or_staff(), false) = false
        -- Booking must belong to the user: EITHER user_id matches OR email matches
        AND (
            -- Case 1: Booking has user_id and it matches authenticated user
            (user_id IS NOT NULL AND user_id = auth.uid())
            OR
            -- Case 2: Booking has no user_id, so check email match using helper function
            (user_id IS NULL AND email = get_user_email())
        )
    );

-- ============================================================================
-- STEP 4: Verify the policy was created correctly
-- ============================================================================

SELECT 
    policyname, 
    cmd,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'bookings' 
    AND policyname = 'Users can cancel own pending bookings'
    AND cmd = 'UPDATE';

-- ============================================================================
-- STEP 5: Verify admin policy still exists (should not interfere)
-- ============================================================================

SELECT 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename = 'bookings' 
    AND policyname = 'Admin can update bookings'
    AND cmd = 'UPDATE';

-- ============================================================================
-- TROUBLESHOOTING QUERIES
-- ============================================================================

-- Check if a specific booking can be cancelled by current user:
-- (Replace YOUR_BOOKING_ID with an actual booking ID)
--
-- SELECT 
--     b.id,
--     b.booking_id,
--     b.user_id,
--     b.email,
--     b.status,
--     auth.uid() as current_user_id,
--     get_user_email() as current_user_email,
--     is_admin_or_staff() as is_admin,
--     -- Check ownership conditions
--     (b.user_id IS NOT NULL AND b.user_id = auth.uid()) as owns_by_user_id,
--     (b.user_id IS NULL AND b.email = get_user_email()) as owns_by_email,
--     (b.status = 'pending') as is_pending,
--     (COALESCE(is_admin_or_staff(), false) = false) as is_not_admin,
--     -- Final check: can cancel?
--     (
--         auth.uid() IS NOT NULL
--         AND b.status = 'pending'
--         AND COALESCE(is_admin_or_staff(), false) = false
--         AND (
--             (b.user_id IS NOT NULL AND b.user_id = auth.uid())
--             OR
--             (b.user_id IS NULL AND b.email = get_user_email())
--         )
--     ) as can_cancel
-- FROM bookings b
-- WHERE b.id = 'YOUR_BOOKING_ID';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This script:
-- 1. Drops any old/conflicting user cancel policies
-- 2. Creates a new policy that handles BOTH cases:
--    - Bookings with user_id (newer bookings)
--    - Bookings without user_id (older bookings, matched by email)
-- 3. Uses COALESCE to safely handle NULL values from is_admin_or_staff()
-- 4. Only allows users (not admins) to cancel their own pending bookings
-- 5. Verifies the policy was created correctly
--
-- After running this script, users should be able to cancel their own pending bookings,
-- regardless of whether the booking has a user_id or not.
--
-- The policy will block:
-- - Users trying to cancel other users' bookings
-- - Users trying to cancel confirmed bookings
-- - Admins (they should use the admin dashboard)
-- - Unauthenticated users

