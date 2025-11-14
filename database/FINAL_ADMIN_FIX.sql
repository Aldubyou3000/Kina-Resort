-- FINAL FIX: Admin Booking Confirmation
-- This uses JWT claims instead of querying auth.users table
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Drop and recreate function using JWT claims (NO auth.users query)
-- ============================================================================

DROP FUNCTION IF EXISTS is_admin_or_staff() CASCADE;

CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_jwt JSONB;
  v_user_meta_role TEXT;
  v_app_meta_role TEXT;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get JWT token (contains user metadata - no need to query auth.users table)
    -- This avoids "permission denied for table users" error
    v_jwt := auth.jwt();
    
    -- Extract role from JWT claims (user_metadata and app_metadata are in the JWT)
    v_user_meta_role := v_jwt->'user_metadata'->>'role';
    v_app_meta_role := v_jwt->'app_metadata'->>'role';
    
    -- Return true if role is admin or staff
    RETURN (v_user_meta_role IN ('admin', 'staff') OR v_app_meta_role IN ('admin', 'staff'));
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin_or_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_staff() TO anon;

-- ============================================================================
-- STEP 2: Drop and recreate admin policies
-- ============================================================================

DROP POLICY IF EXISTS "Admin can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can view all booking services" ON booking_services;

CREATE POLICY "Admin can update bookings" ON bookings
    FOR UPDATE
    USING (is_admin_or_staff())
    WITH CHECK (is_admin_or_staff());

CREATE POLICY "Admin can view all bookings" ON bookings
    FOR SELECT
    USING (is_admin_or_staff());

CREATE POLICY "Admin can view all booking services" ON booking_services
    FOR SELECT
    USING (is_admin_or_staff());

-- ============================================================================
-- STEP 3: Verify the setup
-- ============================================================================

-- Check function exists
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  pg_get_functiondef(oid) as function_code
FROM pg_proc 
WHERE proname = 'is_admin_or_staff';

-- Check policies were created
SELECT 
  schemaname,
  tablename, 
  policyname, 
  cmd,
  permissive
FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_services')
AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. This function uses JWT claims instead of querying auth.users table
-- 2. JWT tokens automatically contain user_metadata and app_metadata
-- 3. This avoids "permission denied for table users" errors
-- 4. The function will work when called from your application where users are logged in
-- 5. In SQL Editor, auth.uid() will be NULL (this is normal)

