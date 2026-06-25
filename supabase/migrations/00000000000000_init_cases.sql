CREATE TYPE case_status AS ENUM ('Draft', 'Uploaded', 'Processing', 'NeedsReview', 'Reviewed', 'ReadyForExport', 'Exported', 'Archived');

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status case_status NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to cases" ON cases FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to applicants" ON applicants FOR ALL TO authenticated USING (true);
