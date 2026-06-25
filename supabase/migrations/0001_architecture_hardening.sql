-- Create user roles table
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Reviewer'))
);

CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Placeholder tables
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT,
  status TEXT
);

CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE generated_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE export_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID,
  role TEXT,
  action_type TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fix RLS
DROP POLICY IF EXISTS "Allow authenticated full access to cases" ON cases;
DROP POLICY IF EXISTS "Allow authenticated full access to applicants" ON applicants;

CREATE POLICY "Reviewers can read cases" ON cases FOR SELECT TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers can insert cases" ON cases FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers can update cases" ON cases FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers can read applicants" ON applicants FOR SELECT TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers can insert applicants" ON applicants FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers can update applicants" ON applicants FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));

-- RPC for transactional creation
CREATE OR REPLACE FUNCTION create_case_with_applicant(
  p_first_name TEXT,
  p_last_name TEXT,
  p_date_of_birth DATE,
  p_user_id UUID,
  p_role TEXT
) RETURNS UUID AS $$
DECLARE
  v_case_id UUID;
BEGIN
  -- Insert Case
  INSERT INTO cases (status) VALUES ('Draft') RETURNING id INTO v_case_id;
  
  -- Insert Applicant
  INSERT INTO applicants (case_id, first_name, last_name, date_of_birth) 
  VALUES (v_case_id, p_first_name, p_last_name, p_date_of_birth);

  -- Insert Activity Log
  INSERT INTO activity_logs (case_id, user_id, role, action_type, description)
  VALUES (v_case_id, p_user_id, p_role, 'CASE_CREATED', 'Initial case created');

  RETURN v_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
