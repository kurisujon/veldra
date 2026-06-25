BEGIN;

-- 1. Create Enums
CREATE TYPE finding_severity AS ENUM ('High', 'Medium', 'Low');
CREATE TYPE finding_category AS ENUM (
  'Name Mismatch',
  'Address Mismatch',
  'Date Mismatch',
  'Age Calculation Issue',
  'School Gap',
  'Missing Information'
);
CREATE TYPE finding_status AS ENUM ('Open', 'Accepted', 'Resolved', 'Ignored');

-- 2. Drop the placeholder findings table
DROP TABLE IF EXISTS public.findings CASCADE;

-- 3. Create full findings table
CREATE TABLE public.findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity finding_severity NOT NULL,
  category finding_category NOT NULL,
  status finding_status NOT NULL DEFAULT 'Open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create join table finding_documents
CREATE TABLE public.finding_documents (
  finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  PRIMARY KEY (finding_id, document_id)
);

-- 5. Indexes
CREATE INDEX idx_findings_case_id ON public.findings(case_id);
CREATE INDEX idx_findings_status ON public.findings(status);
CREATE INDEX idx_finding_documents_finding_id ON public.finding_documents(finding_id);
CREATE INDEX idx_finding_documents_document_id ON public.finding_documents(document_id);

-- 6. Row Level Security
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finding_documents ENABLE ROW LEVEL SECURITY;

-- 7. Policies for findings
CREATE POLICY "Reviewers select findings" ON public.findings
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert findings" ON public.findings
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update findings" ON public.findings
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers delete findings" ON public.findings
  FOR DELETE TO authenticated
  USING (public.get_user_role() = 'Admin');

-- 8. Policies for finding_documents
CREATE POLICY "Reviewers select finding_documents" ON public.finding_documents
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert finding_documents" ON public.finding_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update finding_documents" ON public.finding_documents
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers delete finding_documents" ON public.finding_documents
  FOR DELETE TO authenticated
  USING (public.get_user_role() = 'Admin');

COMMIT;
