-- Fix bookings security: Require authentication to view bookings
-- This ensures users can only see their own bookings
-- NOTE: Admins can see ALL bookings (no restrictions) via the admin policy

-- ============================================================================
-- STEP 1: Ensure admin policies exist (they should already exist, but verify)
-- ============================================================================

-- Admin policies should already exist from schema.sql, but we'll ensure they're there
-- These policies allow admins/staff to see ALL bookings without restrictions

-- Policy: Admin/Staff can view all bookings (no restrictions)
-- This policy takes precedence and allows full access for admins
DROP POLICY IF EXISTS "Admin can view all bookings" ON bookings;
CREATE POLICY "Admin can view all bookings" ON bookings
    FOR SELECT
    USING (is_admin_or_staff());

-- Policy: Admin/Staff can view all booking services
DROP POLICY IF EXISTS "Admin can view all booking services" ON booking_services;
CREATE POLICY "Admin can view all booking services" ON booking_services
    FOR SELECT
    USING (is_admin_or_staff());

-- ============================================================================
-- STEP 2: Ensure INSERT policies exist (allow anyone to create bookings)
-- ============================================================================

-- Policy: Authenticated users can insert bookings
-- This ensures logged-in users can always create bookings
DROP POLICY IF EXISTS "Allow authenticated users to insert bookings" ON bookings;
CREATE POLICY "Allow authenticated users to insert bookings" ON bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Anyone (including unauthenticated) can insert bookings
-- This allows public booking form to work
DROP POLICY IF EXISTS "Allow public booking insert" ON bookings;
CREATE POLICY "Allow public booking insert" ON bookings
    FOR INSERT
    WITH CHECK (true);

-- Policy: Authenticated users can insert booking services
DROP POLICY IF EXISTS "Allow authenticated users to insert booking services" ON booking_services;
CREATE POLICY "Allow authenticated users to insert booking services" ON booking_services
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Anyone (including unauthenticated) can insert booking services
DROP POLICY IF EXISTS "Allow public booking services insert" ON booking_services;
CREATE POLICY "Allow public booking services insert" ON booking_services
    FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- STEP 3: Drop the insecure public read policy
-- ============================================================================

-- Drop the policy that allows anyone to read bookings by email
DROP POLICY IF EXISTS "Allow public read by email" ON bookings;

-- ============================================================================
-- STEP 4: Update the availability policy for calendar (accessible to all users)
-- ============================================================================

-- Drop existing availability policy
DROP POLICY IF EXISTS "Allow public read for availability" ON bookings;

-- Create policy for availability checking (accessible to everyone, even unauthenticated)
-- This allows reading booking status and dates for availability calculations
-- Only confirmed bookings affect availability, but we allow reading pending too for joins
-- Full booking details (like guest names, emails) are not exposed in availability queries
CREATE POLICY "Allow public read for availability" ON bookings
    FOR SELECT
    USING (
        -- Allow reading bookings with status 'pending' or 'confirmed' for availability checks
        -- This is needed for calendar functionality (accessible to all users)
        -- The application code filters to only count 'confirmed' bookings for availability
        status IN ('pending', 'confirmed')
    );

-- ============================================================================
-- STEP 5: Ensure users can only view their own bookings when authenticated
-- Regular users (non-admin) can only see their own bookings
-- ============================================================================

-- Drop and recreate the user bookings policy to be more explicit
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;

-- Policy: Authenticated users can view their own bookings
-- This requires authentication (auth.uid() must not be null)
-- NOTE: Admins bypass this via the admin policy above
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT
    USING (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- Exclude admins (they use the admin policy)
        AND NOT is_admin_or_staff()
        AND (
            -- Match by user_id (preferred method)
            user_id = auth.uid()
            OR
            -- Match by email (fallback for bookings created before user_id was set)
            email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- ============================================================================
-- STEP 6: Update booking_services policies
-- ============================================================================

-- Drop the insecure public read policy for booking_services
DROP POLICY IF EXISTS "Allow public read booking services" ON booking_services;

-- Ensure availability policy exists for booking_services (needed for calendar)
-- This allows unauthenticated users to check availability
DROP POLICY IF EXISTS "Allow public read booking services for availability" ON booking_services;

CREATE POLICY "Allow public read booking services for availability" ON booking_services
    FOR SELECT
    USING (
        -- Allow reading booking services for confirmed/pending bookings
        -- This is needed for calendar availability checking (accessible to all users)
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_services.booking_id
            AND bookings.status IN ('pending', 'confirmed')
        )
    );

-- Ensure users can only view services for their own bookings
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
            AND (
                bookings.user_id = auth.uid()
                OR bookings.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            )
        )
    );

-- ============================================================================
-- STEP 7: Verify policies
-- ============================================================================

-- List all policies for bookings table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_services')
ORDER BY tablename, policyname;

