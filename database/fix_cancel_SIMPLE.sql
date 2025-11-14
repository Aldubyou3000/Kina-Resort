-- SIMPLE FIX: Cancel Button - Most Direct Solution
-- This is the simplest possible fix that should definitely work
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Drop ALL existing user cancel policies (clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "Users can cancel own pending bookings" ON bookings;
DROP POLICY IF EXISTS "Users can cancel own bookings" ON bookings;
DROP POLICY IF EXISTS "User can cancel pending bookings" ON bookings;

-- ============================================================================
-- STEP 2: Create helper function (if it doesn't exist)
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
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    
    v_jwt := auth.jwt();
    v_email := v_jwt->>'email';
    
    -- Return lowercase trimmed email for consistent comparison
    IF v_email IS NOT NULL THEN
        RETURN LOWER(TRIM(v_email));
    END IF;
    
    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email() TO anon;

-- ============================================================================
-- STEP 3: Create the SIMPLEST possible policy
-- ============================================================================

-- This policy is very permissive for ownership checks
-- It allows cancellation if EITHER user_id matches OR email matches (case-insensitive)
CREATE POLICY "Users can cancel own pending bookings" ON bookings
    FOR UPDATE
    USING (
        -- Must be authenticated
        auth.uid() IS NOT NULL
        -- Must not be admin (handle NULL safely)
        AND COALESCE(is_admin_or_staff(), false) = false
        -- Booking must be pending
        AND status = 'pending'
        -- Ownership: user_id matches OR email matches (case-insensitive)
        AND (
            user_id = auth.uid()
            OR
            LOWER(TRIM(email)) = get_user_email()
        )
    )
    WITH CHECK (
        -- Must be authenticated
        auth.uid() IS NOT NULL
        -- Must not be admin (handle NULL safely)
        AND COALESCE(is_admin_or_staff(), false) = false
        -- Can only set status to cancelled
        AND status = 'cancelled'
        -- Ownership: user_id matches OR email matches (case-insensitive)
        AND (
            user_id = auth.uid()
            OR
            LOWER(TRIM(email)) = get_user_email()
        )
    );

-- ============================================================================
-- STEP 4: Verify it was created
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
-- STEP 5: Test the function
-- ============================================================================

-- Run this while logged in to see what email is extracted
SELECT 
    auth.uid() as your_user_id,
    get_user_email() as your_email_from_jwt;

