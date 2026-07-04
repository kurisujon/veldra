-- Migration: Add get_all_employees RPC (replaces auth.admin.listUsers dependency)
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
