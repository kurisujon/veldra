BEGIN;

-- Repair: add missing columns to generated_drafts if they don't exist
DO $$ BEGIN
  CREATE TYPE draft_status AS ENUM ('Draft', 'Finalized');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE draft_type AS ENUM ('Affidavit', 'AddressLetter', 'GapLetter');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add missing columns safely
ALTER TABLE public.generated_drafts
  ADD COLUMN IF NOT EXISTS status draft_status NOT NULL DEFAULT 'Draft';

ALTER TABLE public.generated_drafts
  ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';

ALTER TABLE public.generated_drafts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure type column has correct type (may already exist)
-- If type column exists with wrong type, this handles it gracefully
DO $$ BEGIN
  ALTER TABLE public.generated_drafts ALTER COLUMN type TYPE draft_type USING type::draft_type;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Create draft_findings join table (idempotent)
CREATE TABLE IF NOT EXISTS public.draft_findings (
  draft_id UUID NOT NULL REFERENCES public.generated_drafts(id) ON DELETE CASCADE,
  finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  PRIMARY KEY (draft_id, finding_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_drafts_status ON public.generated_drafts(status);
CREATE INDEX IF NOT EXISTS idx_generated_drafts_case_id ON public.generated_drafts(case_id);
CREATE INDEX IF NOT EXISTS idx_draft_findings_draft_id ON public.draft_findings(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_findings_finding_id ON public.draft_findings(finding_id);

-- Enable RLS
ALTER TABLE public.generated_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_findings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generated_drafts (idempotent)
DROP POLICY IF EXISTS "Reviewers select drafts" ON public.generated_drafts;
CREATE POLICY "Reviewers select drafts" ON public.generated_drafts
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('Admin', 'Reviewer'));

DROP POLICY IF EXISTS "Reviewers insert drafts" ON public.generated_drafts;
CREATE POLICY "Reviewers insert drafts" ON public.generated_drafts
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

DROP POLICY IF EXISTS "Reviewers update drafts" ON public.generated_drafts;
CREATE POLICY "Reviewers update drafts" ON public.generated_drafts
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

DROP POLICY IF EXISTS "Admins delete drafts" ON public.generated_drafts;
CREATE POLICY "Admins delete drafts" ON public.generated_drafts
  FOR DELETE TO authenticated
  USING (public.get_user_role() = 'Admin');

-- RLS Policies for draft_findings (idempotent)
DROP POLICY IF EXISTS "Reviewers select draft_findings" ON public.draft_findings;
CREATE POLICY "Reviewers select draft_findings" ON public.draft_findings
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('Admin', 'Reviewer'));

DROP POLICY IF EXISTS "Reviewers insert draft_findings" ON public.draft_findings;
CREATE POLICY "Reviewers insert draft_findings" ON public.draft_findings
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

DROP POLICY IF EXISTS "Admins delete draft_findings" ON public.draft_findings;
CREATE POLICY "Admins delete draft_findings" ON public.draft_findings
  FOR DELETE TO authenticated
  USING (public.get_user_role() = 'Admin');

-- Extend cases status enum
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'DraftGenerated';
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'ReadyForExport';

COMMIT;
