-- Fix RLS Policies for Kina Resort Booking System
-- Run this SQL in your Supabase SQL Editor to fix the 403 errors and admin update issues
-- This adds the missing policies and fixes admin update permissions

-- ============================================================================
-- STEP 1: Create helper function for admin checks (fixes "permission denied for table users")
-- ============================================================================

-- Create a helper function to check if user is admin/staff
-- This function has SECURITY DEFINER so it can access auth.users table
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin_or_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_staff() TO anon;

-- ============================================================================
-- STEP 2: Fix admin policies (remove direct auth.users queries)
-- ============================================================================

-- Drop existing admin policies that query auth.users directly
DROP POLICY IF EXISTS "Admin can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can view all booking services" ON booking_services;

-- Create new admin policies using the helper function
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
-- STEP 3: Add missing public read policies
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read for availability" ON bookings;
DROP POLICY IF EXISTS "Allow public read by email" ON bookings;
DROP POLICY IF EXISTS "Allow public read booking services for availability" ON booking_services;
DROP POLICY IF EXISTS "Allow public read booking services" ON booking_services;

-- Policy: Allow anonymous users to read bookings for availability checking
-- This allows the calendar and availability checks to work without authentication
-- Only confirmed bookings affect availability, but we allow reading pending for display
CREATE POLICY "Allow public read for availability" ON bookings
    FOR SELECT
    USING (status IN ('pending', 'confirmed'));

-- Policy: Allow anonymous users to view bookings by email (for user bookings page)
-- This allows users to view their own bookings by email without authentication
CREATE POLICY "Allow public read by email" ON bookings
    FOR SELECT
    USING (true); -- Allow reading any booking by email (users can only query their own via application logic)

-- Policy: Allow anonymous users to read booking_services for availability checking
-- This is needed for the calendar and availability checks to work
-- Note: The application code filters to only count 'confirmed' bookings for availability
CREATE POLICY "Allow public read booking services for availability" ON booking_services
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_services.booking_id
            AND bookings.status IN ('pending', 'confirmed')
        )
    );

-- Policy: Allow anonymous users to read all booking_services (for viewing bookings by email)
-- This allows the booking services to be loaded when viewing bookings
CREATE POLICY "Allow public read booking services" ON booking_services
    FOR SELECT
    USING (true);

-- ============================================================================
-- STEP 4: Add admin delete policy (allows admins to delete bookings)
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admin can delete bookings" ON bookings;

-- Create policy allowing admins to delete any booking
CREATE POLICY "Admin can delete bookings" ON bookings
    FOR DELETE
    USING (is_admin_or_staff());

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_services')
ORDER BY tablename, policyname;

