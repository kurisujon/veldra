-- Migration: Add delete_employee_account RPC

CREATE OR REPLACE FUNCTION delete_employee_account(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check caller is Admin
  IF (SELECT role FROM user_roles WHERE user_id = auth.uid()) <> 'Admin' THEN
    RETURN json_build_object('error', 'Forbidden: Admin access required');
  END IF;

  -- Ensure we don't delete ourselves
  IF p_user_id = auth.uid() THEN
    RETURN json_build_object('error', 'Cannot delete your own account');
  END IF;

  -- Delete from auth.users (this should cascade to user_roles due to ON DELETE CASCADE)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION delete_employee_account(UUID) TO authenticated;
