-- DEBUG: Why Cancel Button Still Not Working
-- Run this to diagnose the issue
-- Replace 'YOUR_BOOKING_ID' with the actual booking ID from the error

-- ============================================================================
-- STEP 1: Check what the get_user_email() function returns
-- ============================================================================

-- This will show what email the function thinks the current user has
SELECT 
    auth.uid() as current_user_id,
    get_user_email() as current_user_email_from_jwt,
    auth.jwt() as full_jwt_token;

-- ============================================================================
-- STEP 2: Check a specific booking and see if it matches
-- ============================================================================

-- Replace 'YOUR_BOOKING_ID' with the actual booking ID (e.g., 'c1c08827-fba4-4277-a35c-533180d6c766')
SELECT 
    b.id,
    b.booking_id,
    b.user_id,
    b.email as booking_email,
    b.status,
    auth.uid() as current_user_id,
    get_user_email() as current_user_email,
    is_admin_or_staff() as is_admin,
    -- Check ownership conditions
    (b.user_id IS NOT NULL AND b.user_id = auth.uid()) as owns_by_user_id,
    (b.email = get_user_email()) as owns_by_email,
    (b.email ILIKE get_user_email()) as owns_by_email_case_insensitive,
    (b.status = 'pending') as is_pending,
    (COALESCE(is_admin_or_staff(), false) = false) as is_not_admin,
    -- Check USING clause (can we see/select this booking?)
    (
        auth.uid() IS NOT NULL
        AND b.status = 'pending'
        AND COALESCE(is_admin_or_staff(), false) = false
        AND (
            (b.user_id IS NOT NULL AND b.user_id = auth.uid())
            OR
            (b.email = get_user_email())
        )
    ) as using_clause_passes,
    -- Check WITH CHECK clause (can we update to cancelled?)
    (
        auth.uid() IS NOT NULL
        AND 'cancelled' = 'cancelled'  -- new status
        AND COALESCE(is_admin_or_staff(), false) = false
        AND (
            (b.user_id IS NOT NULL AND b.user_id = auth.uid())
            OR
            (b.email = get_user_email())
        )
    ) as with_check_clause_passes
FROM bookings b
WHERE b.id = 'YOUR_BOOKING_ID';  -- REPLACE THIS!

-- ============================================================================
-- STEP 3: Check all UPDATE policies on bookings table
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
-- STEP 4: Check if there are multiple conflicting policies
-- ============================================================================

-- Sometimes multiple policies can conflict
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,  -- Should be 'PERMISSIVE' (OR logic) not 'RESTRICTIVE' (AND logic)
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'bookings' AND cmd = 'UPDATE';

