-- Migration: Add get_all_employees and create_employee_account RPCs
-- (Replaces auth.admin.* dependency — works with new Supabase secret key format)

-- 1. RPC to list all employees (excludes Admin)
CREATE OR REPLACE FUNCTION get_all_employees()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username VARCHAR,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.user_id,
    au.email::TEXT,
    ur.username,
    ur.role::TEXT,
    ur.created_at
  FROM user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.role <> 'Admin'
  ORDER BY ur.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_employees() TO authenticated;

-- 2. RPC to create employee accounts directly in auth.users (no legacy JWT needed)
CREATE OR REPLACE FUNCTION create_employee_account(
  p_email TEXT,
  p_password TEXT,
  p_username TEXT,
  p_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check caller is Admin
  IF (SELECT role FROM user_roles WHERE user_id = auth.uid()) <> 'Admin' THEN
    RETURN json_build_object('error', 'Forbidden: Admin access required');
  END IF;

  -- Check email not already in use
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN json_build_object('error', 'Email is already in use');
  END IF;

  -- Check username not already in use
  IF EXISTS (SELECT 1 FROM user_roles WHERE username = p_username) THEN
    RETURN json_build_object('error', 'Username is already taken');
  END IF;

  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token,
    email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id, 'authenticated', 'authenticated',
    p_email, crypt(p_password, gen_salt('bf')), NOW(),
    json_build_object('provider', 'email', 'providers', json_build_array('email')),
    json_build_object('email', p_email, 'email_verified', true),
    NOW(), NOW(), '', '', '', ''
  );

  INSERT INTO user_roles (user_id, role, username)
  VALUES (v_user_id, p_role, p_username);

  RETURN json_build_object('success', true, 'user_id', v_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION create_employee_account(TEXT, TEXT, TEXT, TEXT) TO authenticated;
