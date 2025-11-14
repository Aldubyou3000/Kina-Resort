-- SIMPLE FIX: If user can see booking, they can cancel it (if pending)
-- This reuses the SELECT policy ownership logic - no duplicate checks needed
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- THE LOGIC:
-- ============================================================================
-- If a booking appears in the user's booking table (they can see it),
-- then they created it and own it. So they should be able to cancel it
-- if it's pending. Simple!
--
-- We reuse the same ownership check from the SELECT policy:
-- - user_id matches OR email matches
-- That's it!

-- ============================================================================
-- STEP 1: Make sure we have the helper function
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
-- STEP 2: Drop old policy
-- ============================================================================

DROP POLICY IF EXISTS "Users can cancel own pending bookings" ON bookings;
DROP POLICY IF EXISTS "Users can cancel own bookings" ON bookings;
DROP POLICY IF EXISTS "User can cancel pending bookings" ON bookings;

-- ============================================================================
-- STEP 3: Create the simple policy
-- ============================================================================

-- The policy: If user can see the booking (same ownership check as SELECT),
-- and it's pending, they can cancel it.
CREATE POLICY "Users can cancel own pending bookings" ON bookings
    FOR UPDATE
    USING (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- User must NOT be admin (admins use admin policy)
        AND COALESCE(is_admin_or_staff(), false) = false
        -- Same ownership check as SELECT policy: if they can see it, they own it
        AND (
            (user_id IS NOT NULL AND user_id = auth.uid())
            OR
            (LOWER(TRIM(email)) = get_user_email())
        )
        -- Only allow if booking is pending
        AND status = 'pending'
    )
    WITH CHECK (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- User must NOT be admin
        AND COALESCE(is_admin_or_staff(), false) = false
        -- Same ownership check: if they can see it, they own it
        AND (
            (user_id IS NOT NULL AND user_id = auth.uid())
            OR
            (LOWER(TRIM(email)) = get_user_email())
        )
        -- Can only change status to 'cancelled'
        AND status = 'cancelled'
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
-- This policy is simple:
-- 1. If user can see the booking (same check as SELECT policy) → they own it
-- 2. If booking is pending → they can cancel it
-- 3. They can only set status to 'cancelled'
--
-- No complex logic, no duplicate checks. If it's in their booking table,
-- they can cancel it if it's pending. That's it!

