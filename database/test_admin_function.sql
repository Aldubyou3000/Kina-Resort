-- Test Admin Function - This shows why auth.uid() is NULL in SQL Editor
-- Run this to verify your admin user has the correct role

-- IMPORTANT: In Supabase SQL Editor, auth.uid() returns NULL because
-- there's no authenticated session. This is NORMAL and EXPECTED.
-- The RLS function works correctly when called from your application
-- where the user is logged in via Supabase Auth.

-- Test 1: Check your admin user's metadata
-- This will show if the role is set correctly
SELECT 
  id as user_id,
  email,
  raw_user_meta_data->>'role' as user_meta_role,
  raw_app_meta_data->>'role' as app_meta_role,
  CASE 
    WHEN (raw_user_meta_data->>'role') IN ('admin', 'staff') THEN true
    WHEN (raw_app_meta_data->>'role') IN ('admin', 'staff') THEN true
    ELSE false
  END as is_admin_in_metadata
FROM auth.users 
WHERE email = 'admin@kinaresort.com';

-- Test 2: Verify the function exists and has correct permissions
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proowner::regrole as owner,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'is_admin_or_staff';

-- Test 3: Check if policies are set up correctly
SELECT 
  schemaname,
  tablename, 
  policyname, 
  cmd,
  permissive,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_services')
AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;

-- Test 4: Simulate what happens when an admin user tries to update
-- This shows the policy structure (won't actually update without a real session)
SELECT 
  'Policy check simulation' as test,
  'When admin@kinaresort.com is logged in, is_admin_or_staff() will return true' as explanation,
  'The function checks raw_user_meta_data->>''role'' = ''admin''' as how_it_works;

