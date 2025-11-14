-- Update is_admin_or_staff() function to only check for 'admin' role
-- Since we only have 2 roles: 'user' and 'admin'
-- Run this SQL in your Supabase SQL Editor

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
    
    -- Return true if role is 'admin' (we only have 'user' and 'admin' roles)
    RETURN (v_user_meta_role = 'admin' OR v_app_meta_role = 'admin');
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin_or_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_staff() TO anon;

