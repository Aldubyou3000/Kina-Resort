-- Fix User Cancel Booking Policy
-- This ensures users can cancel their own pending bookings
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Check current policies
-- ============================================================================

-- List all UPDATE policies on bookings table
SELECT 
    policyname, 
    cmd,
    qual,  -- USING clause
    with_check  -- WITH CHECK clause
FROM pg_policies 
WHERE tablename = 'bookings' AND cmd = 'UPDATE'
ORDER BY policyname;

-- ============================================================================
-- STEP 2: Drop and recreate the user cancel policy with better conditions
-- ============================================================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can cancel own pending bookings" ON bookings;

-- Create policy that explicitly checks for non-admin users
-- This uses a subquery to check if user has admin role in metadata
CREATE POLICY "Users can cancel own pending bookings" ON bookings
    FOR UPDATE
    USING (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Booking must belong to the user
        AND user_id = auth.uid()
        -- Booking must be pending
        AND status = 'pending'
        -- User must NOT be admin (check JWT claims)
        -- If is_admin_or_staff() returns NULL or FALSE, allow the update
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
-- STEP 4: Verify the policy was created
-- ============================================================================

SELECT 
    policyname, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'bookings' 
    AND policyname = 'Users can cancel own pending bookings'
    AND cmd = 'UPDATE';

-- ============================================================================
-- STEP 5: Test the policy (optional - for debugging)
-- ============================================================================

-- This query will show what the policy sees for a specific user
-- Replace 'YOUR_USER_ID' with the actual user ID from the error logs
-- SELECT 
--     auth.uid() as current_user_id,
--     is_admin_or_staff() as is_admin,
--     COALESCE(is_admin_or_staff(), false) as is_admin_safe
-- FROM bookings
-- WHERE id = 'YOUR_BOOKING_ID'
-- LIMIT 1;

-- ============================================================================
-- SUMMARY:
-- ============================================================================
-- This fix:
-- 1. Uses COALESCE to handle NULL values from is_admin_or_staff()
-- 2. Explicitly checks that is_admin_or_staff() returns false
-- 3. Only allows updates if user_id matches AND status is pending
-- 4. Only allows status to be changed to 'cancelled'
--
-- The key change is using COALESCE(is_admin_or_staff(), false) = false
-- This ensures that if is_admin_or_staff() returns NULL (unknown), we treat it as false (not admin)
-- This is safer than NOT is_admin_or_staff() which might fail if the function returns NULL

