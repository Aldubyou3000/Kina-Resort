-- COMPLETE FIX: User Cancel Booking Policy
-- This ensures users can cancel their own pending bookings
-- Run this SQL in your Supabase SQL Editor
-- This script will fix the RLS policy blocking user cancellations

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
-- This policy:
-- 1. Checks that user is authenticated
-- 2. Checks that booking belongs to the user (user_id matches)
-- 3. Checks that booking is pending (can't cancel confirmed bookings)
-- 4. Checks that user is NOT admin (admins use admin policy)
-- 5. Only allows status to be changed to 'cancelled'

CREATE POLICY "Users can cancel own pending bookings" ON bookings
    FOR UPDATE
    USING (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Booking must belong to the user
        AND user_id = auth.uid()
        -- Booking must be pending (users can't cancel confirmed bookings)
        AND status = 'pending'
        -- User must NOT be admin (admins use the admin policy)
        -- Use COALESCE to handle NULL values safely
        AND COALESCE(is_admin_or_staff(), false) = false
    )
    WITH CHECK (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Booking must belong to the user
        AND user_id = auth.uid()
        -- Can only change status to 'cancelled'
        AND status = 'cancelled'
        -- User must NOT be admin
        AND COALESCE(is_admin_or_staff(), false) = false
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
-- TESTING (Optional - uncomment to test)
-- ============================================================================

-- To test if the policy works, you can run this query while logged in as a user:
-- (Replace YOUR_BOOKING_ID with an actual pending booking ID that belongs to the user)
--
-- UPDATE bookings
-- SET status = 'cancelled'
-- WHERE id = 'YOUR_BOOKING_ID'
--   AND user_id = auth.uid()
--   AND status = 'pending';
--
-- If it works, you should see "UPDATE 1"
-- If it fails, you'll see an RLS error

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If the policy still doesn't work, check:
-- 1. Is the user authenticated? (auth.uid() should not be NULL)
-- 2. Does the booking have a user_id that matches auth.uid()?
-- 3. Is the booking status 'pending'?
-- 4. Is is_admin_or_staff() returning false for the user?
--
-- You can check these with:
-- SELECT 
--     auth.uid() as current_user_id,
--     is_admin_or_staff() as is_admin,
--     b.id,
--     b.user_id,
--     b.status,
--     (b.user_id = auth.uid()) as user_owns_booking,
--     (b.status = 'pending') as is_pending,
--     (COALESCE(is_admin_or_staff(), false) = false) as is_not_admin
-- FROM bookings b
-- WHERE b.id = 'YOUR_BOOKING_ID';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This script:
-- 1. Drops any old/conflicting user cancel policies
-- 2. Creates a new policy with proper security checks
-- 3. Uses COALESCE to safely handle NULL values from is_admin_or_staff()
-- 4. Only allows users (not admins) to cancel their own pending bookings
-- 5. Verifies the policy was created correctly
--
-- After running this script, users should be able to cancel their own pending bookings.
-- The policy will block:
-- - Users trying to cancel other users' bookings
-- - Users trying to cancel confirmed bookings
-- - Admins (they should use the admin dashboard)
-- - Unauthenticated users


