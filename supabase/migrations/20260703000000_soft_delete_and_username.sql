-- 1. Soft Delete Columns
ALTER TABLE cases ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE generated_drafts ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE export_packages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Username Column
ALTER TABLE user_roles ADD COLUMN username VARCHAR(255) UNIQUE DEFAULT NULL;

-- 3. RPC to get email by username for login
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT au.email INTO v_email
    FROM auth.users au
    JOIN user_roles ur ON au.id = ur.user_id
    WHERE ur.username = p_username;
    
    RETURN v_email;
END;
$$;

