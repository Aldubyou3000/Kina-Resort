-- Fix Roles and Permissions
-- Clear separation: user (resort website) and admin (admin dashboard)
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Fix SELECT policies - Remove auth.users table access
-- This fixes "permission denied for table users" error
-- ============================================================================

-- Fix: Users can view their own bookings (by user_id only, no auth.users query)
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT
    USING (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Exclude admins (they use the admin policy)
        AND NOT is_admin_or_staff()
        -- Match by user_id only (removed email fallback that queries auth.users)
        AND user_id = auth.uid()
    );

-- Fix: Users can view services for their own bookings
DROP POLICY IF EXISTS "Users can view own booking services" ON booking_services;
CREATE POLICY "Users can view own booking services" ON booking_services
    FOR SELECT
    USING (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Exclude admins (they use the admin policy)
        AND NOT is_admin_or_staff()
        AND EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_services.booking_id
            -- Match by user_id only (removed email fallback that queries auth.users)
            AND bookings.user_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 2: Ensure availability policies work for all users (including unauthenticated)
-- ============================================================================

-- Policy: Allow anyone to read bookings for availability checking
-- This allows the calendar and availability checks to work
DROP POLICY IF EXISTS "Allow public read for availability" ON bookings;
CREATE POLICY "Allow public read for availability" ON bookings
    FOR SELECT
    USING (status IN ('pending', 'confirmed'));

-- Policy: Allow anyone to read booking_services for availability checking
DROP POLICY IF EXISTS "Allow public read booking services for availability" ON booking_services;
CREATE POLICY "Allow public read booking services for availability" ON booking_services
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_services.booking_id
            AND bookings.status IN ('pending', 'confirmed')
        )
    );

-- ============================================================================
-- STEP 3: Ensure INSERT policies allow users to create bookings
-- ============================================================================

-- Policy: Users (role: 'user') can insert bookings
-- This allows users to create bookings in the resort website
DROP POLICY IF EXISTS "Allow authenticated users to insert bookings" ON bookings;
CREATE POLICY "Allow authenticated users to insert bookings" ON bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Ensure user_id matches the authenticated user
        AND user_id = auth.uid()
    );

-- Policy: Users can insert booking services
DROP POLICY IF EXISTS "Allow authenticated users to insert booking services" ON booking_services;
CREATE POLICY "Allow authenticated users to insert booking services" ON booking_services
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Ensure the booking belongs to the authenticated user
        AND EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_services.booking_id
            AND bookings.user_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 4: Ensure admin policies allow admins to manage bookings
-- ============================================================================

-- Policy: Admin can view all bookings (for admin dashboard)
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;
CREATE POLICY "Admin can view all bookings" ON bookings
    FOR SELECT
    USING (is_admin_or_staff());

-- Policy: Admin can view all booking services (for admin dashboard)
DROP POLICY IF EXISTS "Admin can view all booking services" ON booking_services;
CREATE POLICY "Admin can view all booking services" ON booking_services
    FOR SELECT
    USING (is_admin_or_staff());

-- Policy: Admin can insert bookings (for walk-in bookings in admin dashboard)
-- Note: is_admin_or_staff() checks for 'admin' role (not 'staff' since we only have 'user' and 'admin')
DROP POLICY IF EXISTS "Admin can insert bookings" ON bookings;
CREATE POLICY "Admin can insert bookings" ON bookings
    FOR INSERT
    WITH CHECK (is_admin_or_staff());

-- Policy: Admin can insert booking services
DROP POLICY IF EXISTS "Admin can insert booking services" ON booking_services;
CREATE POLICY "Admin can insert booking services" ON booking_services
    FOR INSERT
    WITH CHECK (is_admin_or_staff());

-- Policy: Admin can update bookings (for confirming/cancelling in admin dashboard)
DROP POLICY IF EXISTS "Admin can update bookings" ON bookings;
CREATE POLICY "Admin can update bookings" ON bookings
    FOR UPDATE
    USING (is_admin_or_staff())
    WITH CHECK (is_admin_or_staff());

-- Policy: Admin can delete bookings (for admin dashboard)
DROP POLICY IF EXISTS "Admin can delete bookings" ON bookings;
CREATE POLICY "Admin can delete bookings" ON bookings
    FOR DELETE
    USING (is_admin_or_staff());

-- ============================================================================
-- STEP 5: Allow users to cancel their own pending bookings
-- ============================================================================

-- Policy: Users can cancel their own pending bookings
-- Users can only cancel bookings that are still pending (not confirmed)
DROP POLICY IF EXISTS "Users can cancel own pending bookings" ON bookings;
CREATE POLICY "Users can cancel own pending bookings" ON bookings
    FOR UPDATE
    USING (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Exclude admins (they use the admin policy)
        AND NOT is_admin_or_staff()
        -- Booking must belong to the user
        AND user_id = auth.uid()
        -- Booking must be pending (users can't cancel confirmed bookings)
        AND status = 'pending'
    )
    WITH CHECK (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Exclude admins
        AND NOT is_admin_or_staff()
        -- Booking must belong to the user
        AND user_id = auth.uid()
        -- Can only change status to 'cancelled'
        AND status = 'cancelled'
    );

-- ============================================================================
-- STEP 6: Verify all policies
-- ============================================================================

-- List all policies for verification
SELECT 
    tablename, 
    policyname, 
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_services')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- SUMMARY:
-- ============================================================================
-- After running this script:
-- 
-- USER ROLE (resort website):
--   - Can create bookings (INSERT)
--   - Can view their own bookings (SELECT)
--   - Can cancel their own pending bookings (UPDATE)
--   - Can view availability calendar (SELECT via public policy)
--   - Cannot access admin dashboard features
--
-- ADMIN ROLE (admin dashboard):
--   - Can view all bookings (SELECT)
--   - Can create bookings (INSERT - for walk-in bookings)
--   - Can update bookings (UPDATE - confirm/cancel any booking)
--   - Can delete bookings (DELETE)
--   - Cannot use resort website features (separate session)
--
-- ============================================================================

