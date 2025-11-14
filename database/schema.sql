-- Kina Resort Booking System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Bookings table - Main booking information
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id VARCHAR(50) UNIQUE NOT NULL, -- Human-readable ID like BK-123456
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    guests_adults INTEGER NOT NULL DEFAULT 1,
    guests_children INTEGER NOT NULL DEFAULT 0,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    booking_type VARCHAR(20) NOT NULL DEFAULT 'Online', -- 'Online' or 'Walk-In'
    payment_mode VARCHAR(50), -- 'gcash', 'bank', 'card'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID, -- Optional: link to user account if authenticated
    notes TEXT -- Additional notes from admin
);

-- Booking services table - Stores individual services in a booking (rooms, cottages, function halls)
CREATE TABLE IF NOT EXISTS booking_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL, -- 'Standard Room', 'Open Cottage', 'Grand Function Hall', etc.
    service_type VARCHAR(50) NOT NULL, -- 'room', 'cottage', 'functionHall'
    quantity INTEGER NOT NULL DEFAULT 1,
    service_check_in DATE NOT NULL, -- Service-specific check-in (may differ from booking check-in)
    service_check_out DATE NOT NULL, -- Service-specific check-out (may differ from booking check-out)
    price_per_unit DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_service_name ON booking_services(service_name);
CREATE INDEX IF NOT EXISTS idx_booking_services_check_in ON booking_services(service_check_in);
CREATE INDEX IF NOT EXISTS idx_booking_services_check_out ON booking_services(service_check_out);
CREATE INDEX IF NOT EXISTS idx_booking_services_dates ON booking_services(service_check_in, service_check_out);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check for date conflicts
-- This function checks if a service is available for the given date range
CREATE OR REPLACE FUNCTION check_service_availability(
    p_service_name VARCHAR,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_total_capacity INTEGER;
    v_booked_quantity INTEGER;
BEGIN
    -- Get total capacity for the service
    SELECT CASE
        WHEN p_service_name IN ('Grand Function Hall', 'Intimate Function Hall') THEN 1
        WHEN p_service_name = 'Standard Room' THEN 4
        WHEN p_service_name IN ('Open Cottage', 'Standard Cottage', 'Family Cottage') THEN 4
        ELSE 0
    END INTO v_total_capacity;
    
    -- Count booked quantity for overlapping dates
    -- Only count CONFIRMED bookings for availability (pending bookings don't block availability)
    SELECT COALESCE(SUM(bs.quantity), 0) INTO v_booked_quantity
    FROM booking_services bs
    INNER JOIN bookings b ON bs.booking_id = b.id
    WHERE bs.service_name = p_service_name
        AND b.status = 'confirmed' -- Only confirmed bookings affect availability
        AND (b.id != p_exclude_booking_id OR p_exclude_booking_id IS NULL)
        AND (
            -- Check for date overlap: new booking overlaps with existing booking
            (bs.service_check_in <= p_check_out AND bs.service_check_out >= p_check_in)
        );
    
    -- Return available quantity
    RETURN GREATEST(0, v_total_capacity - v_booked_quantity);
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert bookings (for public booking form)
CREATE POLICY "Allow public booking insert" ON bookings
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow anonymous users to read bookings for availability checking
-- This allows the calendar and availability checks to work without authentication
CREATE POLICY "Allow public read for availability" ON bookings
    FOR SELECT
    USING (status IN ('pending', 'confirmed'));

-- Policy: Allow anonymous users to view bookings by email (for user bookings page)
CREATE POLICY "Allow public read by email" ON bookings
    FOR SELECT
    USING (true); -- Allow reading any booking by email (users can only query their own via application logic)

-- Policy: Users can view their own bookings (if authenticated)
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT
    USING (
        auth.uid() = user_id OR 
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Helper function to check if user is admin/staff
-- Uses SECURITY DEFINER to access auth.users table
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

-- Policy: Admin/Staff can view all bookings
CREATE POLICY "Admin can view all bookings" ON bookings
    FOR SELECT
    USING (is_admin_or_staff());

-- Policy: Admin/Staff can update bookings
CREATE POLICY "Admin can update bookings" ON bookings
    FOR UPDATE
    USING (is_admin_or_staff())
    WITH CHECK (is_admin_or_staff());

-- Policy: Users can cancel their own pending bookings
-- Note: This is handled by application logic, RLS allows updates for pending bookings
CREATE POLICY "Users can cancel own pending bookings" ON bookings
    FOR UPDATE
    USING (status = 'pending')
    WITH CHECK (status = 'cancelled');

-- Policy: Anyone can insert booking services (when creating booking)
CREATE POLICY "Allow public booking services insert" ON booking_services
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow anonymous users to read booking_services for availability checking
-- This is needed for the calendar and availability checks to work
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
CREATE POLICY "Allow public read booking services" ON booking_services
    FOR SELECT
    USING (true);

-- Policy: Users can view services for their bookings
CREATE POLICY "Users can view own booking services" ON booking_services
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_services.booking_id
            AND (
                bookings.user_id = auth.uid() OR
                bookings.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            )
        )
    );

-- Policy: Admin can view all booking services
CREATE POLICY "Admin can view all booking services" ON booking_services
    FOR SELECT
    USING (is_admin_or_staff());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON bookings TO anon, authenticated;
GRANT ALL ON booking_services TO anon, authenticated;

-- ============================================================================
-- TEST USERS SETUP
-- ============================================================================
-- This section creates test users for development/testing purposes
-- These users will be created in Supabase's auth.users table

-- Function to create a user with email and password
-- Note: This function must be run with elevated privileges (SECURITY DEFINER)
-- It uses the current Supabase instance_id automatically
CREATE OR REPLACE FUNCTION create_test_user(
    p_email TEXT,
    p_password TEXT,
    p_user_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
    v_instance_id UUID;
BEGIN
    -- Get the current Supabase instance_id
    SELECT id INTO v_instance_id FROM auth.instances LIMIT 1;
    
    -- If no instance found, use a default (shouldn't happen in Supabase)
    IF v_instance_id IS NULL THEN
        v_instance_id := '00000000-0000-0000-0000-000000000000'::UUID;
    END IF;
    
    -- Check if user already exists
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE instance_id = v_instance_id 
    AND email = LOWER(p_email);
    
    -- Hash the password using bcrypt (Supabase uses bcrypt)
    -- Using 10 rounds (standard for Supabase)
    v_encrypted_pw := crypt(p_password, gen_salt('bf', 10));
    
    -- If user exists, update it; otherwise, insert new user
    IF v_user_id IS NOT NULL THEN
        -- Update existing user
        UPDATE auth.users SET
            encrypted_password = v_encrypted_pw,
            raw_user_meta_data = p_user_metadata,
            updated_at = NOW()
        WHERE id = v_user_id;
    ELSE
        -- Generate a new UUID for the user
        v_user_id := uuid_generate_v4();
        
        -- Insert new user into auth.users table
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            v_instance_id,
            v_user_id,
            'authenticated',
            'authenticated',
            LOWER(p_email), -- Normalize email to lowercase
            v_encrypted_pw,
            NOW(), -- email_confirmed_at (auto-confirm for testing)
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}'::JSONB, -- raw_app_meta_data
            p_user_metadata, -- raw_user_meta_data (for role, etc.)
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
    END IF;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create test users
-- Admin user
SELECT create_test_user(
    'admin@kinaresort.com',
    'admin123',
    '{"role": "admin", "first_name": "Admin", "last_name": "User"}'::JSONB
);

-- Regular user 1
SELECT create_test_user(
    'user@gmail.com',
    'user123',
    '{"role": "user", "first_name": "Test", "last_name": "User"}'::JSONB
);

-- Regular user 2
SELECT create_test_user(
    'user2@gmail.com',
    'user123',
    '{"role": "user", "first_name": "Test", "last_name": "User 2"}'::JSONB
);

-- Clean up: Drop the function after use (optional, can keep for future use)
-- DROP FUNCTION IF EXISTS create_test_user(TEXT, TEXT, JSONB);

-- ============================================================================
-- TEST USERS CREATED:
-- ============================================================================
-- Admin Account:
--   Email: admin@kinaresort.com
--   Password: admin123
--   Role: admin
--
-- User Account 1:
--   Email: user@gmail.com
--   Password: user123
--   Role: user
--
-- User Account 2:
--   Email: user2@gmail.com
--   Password: user123
--   Role: user
-- ============================================================================

