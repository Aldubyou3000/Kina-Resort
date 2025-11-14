-- Complete Fix for Admin RLS Policies
-- Run this SQL in your Supabase SQL Editor
-- This fixes the "permission denied" error when admins try to update bookings

-- ============================================================================
-- STEP 1: Drop and recreate the function with proper permissions
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
    v_jwt := auth.jwt();
    
    -- Extract role from JWT claims (user_metadata and app_metadata are in the JWT)
    v_user_meta_role := v_jwt->'user_metadata'->>'role';
    v_app_meta_role := v_jwt->'app_metadata'->>'role';
    
    -- Return true if role is admin or staff
    RETURN (v_user_meta_role IN ('admin', 'staff') OR v_app_meta_role IN ('admin', 'staff'));
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION is_admin_or_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_staff() TO anon;

-- ============================================================================
-- STEP 2: Drop and recreate admin policies
-- ============================================================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admin can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can view all booking services" ON booking_services;

-- Create new policies using the helper function
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

-- Check function exists and has correct permissions
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proowner::regrole as owner
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

-- Test the function (this will show if it works for the current user)
-- Note: This will only work if you're logged in as admin
-- In SQL Editor, auth.uid() will be NULL because there's no session
-- This is NORMAL - the function works correctly from your application
SELECT 
  auth.uid() as your_user_id,
  is_admin_or_staff() as function_returns_admin,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as your_email;

-- ============================================================================
-- STEP 4: Test the function with a specific user ID (for SQL Editor testing)
-- ============================================================================

-- This test simulates checking if a specific user is admin
-- Replace 'YOUR_USER_ID' with your actual admin user ID from Supabase
-- You can find it in: Authentication → Users → Click on admin@kinaresort.com
SELECT 
  id as user_id,
  email,
  raw_user_meta_data->>'role' as user_meta_role,
  raw_app_meta_data->>'role' as app_meta_role,
  CASE 
    WHEN (raw_user_meta_data->>'role') IN ('admin', 'staff') THEN true
    WHEN (raw_app_meta_data->>'role') IN ('admin', 'staff') THEN true
    ELSE false
  END as should_be_admin
FROM auth.users 
WHERE email = 'admin@kinaresort.com';

