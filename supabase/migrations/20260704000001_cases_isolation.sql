-- Migration: Add case isolation (Reviewers only see their own cases, Admins see all)

-- 1. Add created_by column to cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Update create_case_with_applicant RPC to insert created_by
CREATE OR REPLACE FUNCTION public.create_case_with_applicant(p_first_name text, p_last_name text, p_date_of_birth date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_case_id UUID;
  v_user_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  v_role := get_user_role();

  IF v_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO cases (status, created_by) VALUES ('Draft', v_user_id) RETURNING id INTO v_case_id;
  
  INSERT INTO applicants (case_id, first_name, last_name, date_of_birth) 
  VALUES (v_case_id, p_first_name, p_last_name, p_date_of_birth);

  INSERT INTO activity_logs (case_id, user_id, role, action_type, description)
  VALUES (v_case_id, v_user_id, v_role, 'CASE_CREATED', 'Initial case created');

  RETURN v_case_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_case_with_applicant(p_first_name text, p_last_name text, p_date_of_birth date, p_user_id uuid, p_role text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  v_case_id UUID;
BEGIN
  -- Insert Case
  INSERT INTO cases (status, created_by) VALUES ('Draft', p_user_id) RETURNING id INTO v_case_id;
  
  -- Insert Applicant
  INSERT INTO applicants (case_id, first_name, last_name, date_of_birth) 
  VALUES (v_case_id, p_first_name, p_last_name, p_date_of_birth);

  -- Insert Activity Log
  INSERT INTO activity_logs (case_id, user_id, role, action_type, description)
  VALUES (v_case_id, p_user_id, p_role, 'CASE_CREATED', 'Initial case created');

  RETURN v_case_id;
END;
$$;

-- 3. Update RLS policies on cases table
DROP POLICY IF EXISTS "Reviewers select cases" ON cases;
DROP POLICY IF EXISTS "Reviewers insert cases" ON cases;
DROP POLICY IF EXISTS "Reviewers update cases" ON cases;
DROP POLICY IF EXISTS "Reviewers delete cases" ON cases;

CREATE POLICY "View cases" ON cases FOR SELECT TO authenticated
USING (get_user_role() = 'Admin' OR created_by = auth.uid());

CREATE POLICY "Insert cases" ON cases FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Update cases" ON cases FOR UPDATE TO authenticated
USING (get_user_role() = 'Admin' OR created_by = auth.uid());

CREATE POLICY "Delete cases" ON cases FOR DELETE TO authenticated
USING (get_user_role() = 'Admin' OR created_by = auth.uid());
