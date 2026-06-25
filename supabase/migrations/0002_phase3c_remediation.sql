-- 1. Secure RPC Functions and 2. Secure Audit Logging
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION create_case_with_applicant(
  p_first_name TEXT,
  p_last_name TEXT,
  p_date_of_birth DATE
) RETURNS UUID AS $$
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

  INSERT INTO cases (status) VALUES ('Draft') RETURNING id INTO v_case_id;
  
  INSERT INTO applicants (case_id, first_name, last_name, date_of_birth) 
  VALUES (v_case_id, p_first_name, p_last_name, p_date_of_birth);

  INSERT INTO activity_logs (case_id, user_id, role, action_type, description)
  VALUES (v_case_id, v_user_id, v_role, 'CASE_CREATED', 'Initial case created');

  RETURN v_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Fix Row Level Security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviewers can read cases" ON cases;
DROP POLICY IF EXISTS "Reviewers can insert cases" ON cases;
DROP POLICY IF EXISTS "Reviewers can update cases" ON cases;
DROP POLICY IF EXISTS "Reviewers can read applicants" ON applicants;
DROP POLICY IF EXISTS "Reviewers can insert applicants" ON applicants;
DROP POLICY IF EXISTS "Reviewers can update applicants" ON applicants;

-- cases
CREATE POLICY "Reviewers select cases" ON cases FOR SELECT TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers insert cases" ON cases FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers update cases" ON cases FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer')) WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers delete cases" ON cases FOR DELETE TO authenticated USING (get_user_role() = 'Admin');

-- applicants
CREATE POLICY "Reviewers select applicants" ON applicants FOR SELECT TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers insert applicants" ON applicants FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers update applicants" ON applicants FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer')) WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers delete applicants" ON applicants FOR DELETE TO authenticated USING (get_user_role() = 'Admin');

-- documents
CREATE POLICY "Reviewers select documents" ON documents FOR SELECT TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers insert documents" ON documents FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers update documents" ON documents FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer')) WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers delete documents" ON documents FOR DELETE TO authenticated USING (get_user_role() = 'Admin');

-- findings
CREATE POLICY "Reviewers select findings" ON findings FOR SELECT TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers insert findings" ON findings FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers update findings" ON findings FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer')) WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers delete findings" ON findings FOR DELETE TO authenticated USING (get_user_role() = 'Admin');

-- generated_drafts
CREATE POLICY "Reviewers select generated_drafts" ON generated_drafts FOR SELECT TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers insert generated_drafts" ON generated_drafts FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers update generated_drafts" ON generated_drafts FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer')) WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers delete generated_drafts" ON generated_drafts FOR DELETE TO authenticated USING (get_user_role() = 'Admin');

-- export_packages
CREATE POLICY "Reviewers select export_packages" ON export_packages FOR SELECT TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers insert export_packages" ON export_packages FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers update export_packages" ON export_packages FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer')) WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers delete export_packages" ON export_packages FOR DELETE TO authenticated USING (get_user_role() = 'Admin');

-- activity_logs
CREATE POLICY "Reviewers select activity_logs" ON activity_logs FOR SELECT TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));
CREATE POLICY "Reviewers insert activity_logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));

-- user_roles
CREATE POLICY "Users read their own role" ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 4. Add Missing Indexes
CREATE INDEX idx_applicants_case_id ON applicants(case_id);
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_findings_case_id ON findings(case_id);
CREATE INDEX idx_generated_drafts_case_id ON generated_drafts(case_id);
CREATE INDEX idx_export_packages_case_id ON export_packages(case_id);
CREATE INDEX idx_activity_logs_case_id ON activity_logs(case_id);
CREATE INDEX idx_cases_status ON cases(status);

-- 5. Add Missing Audit Columns
ALTER TABLE documents 
ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE findings 
ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE generated_drafts 
ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE export_packages 
ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE user_roles
ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
