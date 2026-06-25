-- Migration: Phase 7 Exports

CREATE TABLE IF NOT EXISTS export_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    package_url TEXT NOT NULL,
    format TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE export_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewers select export_packages phase7"
  ON export_packages FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert export_packages phase7"
  ON export_packages FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update export_packages phase7"
  ON export_packages FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Admin delete export_packages phase7"
  ON export_packages FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'Admin');

CREATE INDEX IF NOT EXISTS idx_export_packages_case_id ON export_packages(case_id);
