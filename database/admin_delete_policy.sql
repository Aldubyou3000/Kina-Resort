-- Admin Delete Policy for Bookings
-- Allows admins to delete bookings permanently
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Ensure is_admin_or_staff() function exists
-- ============================================================================

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
    
    -- Extract role from JWT claims
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
-- STEP 2: Create admin delete policy
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admin can delete bookings" ON bookings;

-- Create policy allowing admins to delete any booking
CREATE POLICY "Admin can delete bookings" ON bookings
    FOR DELETE
    USING (is_admin_or_staff());

-- ============================================================================
-- STEP 3: Verify the policy was created
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'bookings'
AND policyname = 'Admin can delete bookings';

