-- ROBUST FIX: Cancel Button Not Working
-- This version handles case-insensitive email matching and better JWT extraction
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Create a more robust helper function to get user email
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
    
    -- Try multiple ways to extract email from JWT
    -- Supabase stores email in different places depending on version
    -- NOTE: We don't query auth.users directly to avoid permission issues
    v_email := COALESCE(
        v_jwt->>'email',                    -- Direct email field (most common)
        v_jwt->'user_metadata'->>'email',   -- In user_metadata
        v_jwt->'app_metadata'->>'email'     -- In app_metadata
    );
    
    -- Convert to lowercase for case-insensitive comparison
    IF v_email IS NOT NULL THEN
        v_email := LOWER(TRIM(v_email));
    END IF;
    
    RETURN v_email;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email() TO anon;

-- ============================================================================
-- STEP 2: Drop ALL existing user cancel policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can cancel own pending bookings" ON bookings;
DROP POLICY IF EXISTS "Users can cancel own bookings" ON bookings;
DROP POLICY IF EXISTS "User can cancel pending bookings" ON bookings;

-- ============================================================================
-- STEP 3: Create the ROBUST policy with case-insensitive email matching
-- ============================================================================

CREATE POLICY "Users can cancel own pending bookings" ON bookings
    FOR UPDATE
    USING (
        -- User must be logged in
        auth.uid() IS NOT NULL
        -- Booking must be pending (can't cancel confirmed ones)
        AND status = 'pending'
        -- User must NOT be admin (admins use admin dashboard)
        AND COALESCE(is_admin_or_staff(), false) = false
        -- Check if EITHER user_id matches OR email matches (case-insensitive)
        AND (
            (user_id IS NOT NULL AND user_id = auth.uid())
            OR
            (LOWER(TRIM(email)) = get_user_email())  -- Case-insensitive email match
        )
    )
    WITH CHECK (
        -- User must be logged in
        auth.uid() IS NOT NULL
        -- Can only change status to 'cancelled'
        AND status = 'cancelled'
        -- User must NOT be admin
        AND COALESCE(is_admin_or_staff(), false) = false
        -- Check if EITHER user_id matches OR email matches (case-insensitive)
        -- This ensures the new row (after update) still belongs to the user
        AND (
            (user_id IS NOT NULL AND user_id = auth.uid())
            OR
            (LOWER(TRIM(email)) = get_user_email())  -- Case-insensitive email match
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
-- STEP 5: Test the get_user_email() function
-- ============================================================================

-- This should return your email when you're logged in
SELECT 
    auth.uid() as user_id,
    get_user_email() as extracted_email;

-- ============================================================================
-- SUMMARY:
-- ============================================================================
-- This fix:
-- 1. Extracts email from JWT in multiple ways (more robust)
-- 2. Uses case-insensitive email matching (handles "Email@Example.com" vs "email@example.com")
-- 3. Trims whitespace from emails (handles " email@example.com " vs "email@example.com")
-- 4. Checks both user_id and email matching
--
-- If this still doesn't work, run the debug_cancel_issue.sql script
-- to see exactly what's happening with your specific booking.

