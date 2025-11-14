-- FIX: Cancel Button Not Working - RLS Policy Issue
-- This fixes the problem where users can't cancel their own pending bookings
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- THE PROBLEM (Explained Simply):
-- ============================================================================
-- Imagine you have a toy box with a lock. The lock has TWO checks:
-- 1. Check if you own the toy (USING clause - checks the OLD toy)
-- 2. Check if you're allowed to change it (WITH CHECK clause - checks the NEW toy)
--
-- The problem was: The lock was checking "if the toy has your name tag AND it matches"
-- OR "if the toy has NO name tag AND the email matches"
--
-- But what if the toy HAS a name tag that doesn't match, but the email DOES match?
-- The lock would say "NO" even though you own it by email!
--
-- The fix: Check if EITHER the name tag matches OR the email matches,
-- regardless of whether a name tag exists or not.

-- ============================================================================
-- STEP 1: Make sure we have the helper function to get user email
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
-- STEP 2: Drop the old broken policy
-- ============================================================================

DROP POLICY IF EXISTS "Users can cancel own pending bookings" ON bookings;
DROP POLICY IF EXISTS "Users can cancel own bookings" ON bookings;
DROP POLICY IF EXISTS "User can cancel pending bookings" ON bookings;

-- ============================================================================
-- STEP 3: Create the FIXED policy
-- ============================================================================

-- The FIX: Check email match REGARDLESS of whether user_id exists
-- This way, if EITHER user_id matches OR email matches, it works!
CREATE POLICY "Users can cancel own pending bookings" ON bookings
    FOR UPDATE
    USING (
        -- User must be logged in
        auth.uid() IS NOT NULL
        -- Booking must be pending (can't cancel confirmed ones)
        AND status = 'pending'
        -- User must NOT be admin (admins use admin dashboard)
        AND COALESCE(is_admin_or_staff(), false) = false
        -- THE FIX: Check if EITHER user_id matches OR email matches
        -- This works for:
        -- - Bookings with matching user_id
        -- - Bookings without user_id (email match)
        -- - Bookings with mismatched user_id but matching email (legacy bookings)
        AND (
            (user_id IS NOT NULL AND user_id = auth.uid())
            OR
            (email = get_user_email())  -- If email matches, allow (even if user_id doesn't match)
        )
    )
    WITH CHECK (
        -- User must be logged in
        auth.uid() IS NOT NULL
        -- Can only change status to 'cancelled'
        AND status = 'cancelled'
        -- User must NOT be admin
        AND COALESCE(is_admin_or_staff(), false) = false
        -- THE FIX: Same logic here - check EITHER user_id OR email
        -- This ensures the new row (after update) still belongs to the user
        AND (
            (user_id IS NOT NULL AND user_id = auth.uid())
            OR
            (email = get_user_email())  -- If email matches, allow (even if user_id doesn't match)
        )
    );

-- ============================================================================
-- STEP 4: Verify the policy was created
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
-- SUMMARY:
-- ============================================================================
-- The problem was that the policy only checked email if user_id was NULL.
-- But if a booking had a user_id that didn't match, it wouldn't check the email.
--
-- The fix: Always check BOTH user_id AND email, so if EITHER matches, it works!
--
-- Now users can cancel their own pending bookings whether:
-- - The booking has a matching user_id
-- - The booking has no user_id but email matches
-- - The booking has a non-matching user_id but email matches

