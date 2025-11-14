-- Require Authentication for Booking Creation
-- This ensures only users with accounts can create bookings
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Remove public insert policies (allow anyone to create bookings)
-- ============================================================================

-- Drop the public booking insert policy
DROP POLICY IF EXISTS "Allow public booking insert" ON bookings;

-- Drop the public booking services insert policy
DROP POLICY IF EXISTS "Allow public booking services insert" ON booking_services;

-- ============================================================================
-- STEP 2: Create authenticated-only insert policies
-- ============================================================================

-- Policy: Only authenticated users can insert bookings
-- This requires users to be logged in (auth.uid() must not be null)
-- The user_id will be automatically set from the authenticated session
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

-- Policy: Only authenticated users can insert booking services
-- This is linked to bookings, so it also requires authentication
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
-- STEP 3: Ensure admin/staff can also insert bookings (for walk-in bookings)
-- ============================================================================

-- Policy: Admin/Staff can insert bookings (for walk-in bookings or manual entry)
-- Note: For INSERT policies, only WITH CHECK is allowed (not USING)
DROP POLICY IF EXISTS "Admin can insert bookings" ON bookings;
CREATE POLICY "Admin can insert bookings" ON bookings
    FOR INSERT
    WITH CHECK (is_admin_or_staff());

-- Policy: Admin/Staff can insert booking services
-- Note: For INSERT policies, only WITH CHECK is allowed (not USING)
DROP POLICY IF EXISTS "Admin can insert booking services" ON booking_services;
CREATE POLICY "Admin can insert booking services" ON booking_services
    FOR INSERT
    WITH CHECK (is_admin_or_staff());

-- ============================================================================
-- STEP 4: Verify policies
-- ============================================================================

-- List all INSERT policies for bookings and booking_services tables
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_services')
AND cmd = 'INSERT'
ORDER BY tablename, policyname;

-- ============================================================================
-- SUMMARY:
-- ============================================================================
-- After running this script:
-- 1. Only authenticated users (logged in) can create bookings
-- 2. Public/unauthenticated users will get permission denied errors
-- 3. Admin/staff can still create bookings (for walk-in bookings)
-- 4. All bookings must have user_id set to the authenticated user's ID
-- ============================================================================

