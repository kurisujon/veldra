-- Phase 10: Advanced Three-Stage Verification Engine
-- New tables: comparison_results, sponsor_relationships, relationship_evidence

-- ============================================================
-- 1. comparison_results
-- Stores the result of every individual rule comparison.
-- ============================================================
CREATE TABLE IF NOT EXISTS comparison_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  comparison_scope TEXT NOT NULL CHECK (comparison_scope IN ('applicant_internal', 'sponsor_internal', 'applicant_sponsor')),
  rule_code TEXT NOT NULL,
  left_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  right_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  left_value TEXT,
  right_value TEXT,
  left_normalized TEXT,
  right_normalized TEXT,
  status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN ('pending', 'processing', 'verified', 'warning', 'mismatch', 'needs_review')),
  severity TEXT NOT NULL DEFAULT 'Warning' CHECK (severity IN ('High', 'Medium', 'Low', 'Warning')),
  method TEXT NOT NULL DEFAULT 'normalized' CHECK (method IN ('exact', 'normalized', 'fuzzy', 'calculated', 'semantic', 'manual_review')),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE comparison_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comparison_results_authenticated" ON comparison_results
  FOR ALL TO authenticated
  USING (get_user_role() IN ('Admin', 'Reviewer'));

-- ============================================================
-- 2. sponsor_relationships
-- Stores the declared and verified relationship between a case's
-- applicant and each sponsor, including evidence and status.
-- ============================================================
CREATE TABLE IF NOT EXISTS sponsor_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  declared_relationship TEXT NOT NULL,
  verified_relationship TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    verification_status IN (
      'verified',
      'partially_supported',
      'insufficient_evidence',
      'conflicting_evidence',
      'not_eligible',
      'needs_manual_review'
    )
  ),
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  review_notes TEXT,
  missing_evidence JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sponsor_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsor_relationships_authenticated" ON sponsor_relationships
  FOR ALL TO authenticated
  USING (get_user_role() IN ('Admin', 'Reviewer'));

-- ============================================================
-- 3. relationship_evidence
-- Individual evidence items supporting a sponsor_relationship.
-- Each row is one field from one document used as evidence.
-- ============================================================
CREATE TABLE IF NOT EXISTS relationship_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_relationship_id UUID NOT NULL REFERENCES sponsor_relationships(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  extracted_value TEXT,
  normalized_value TEXT,
  -- Role of this evidence in the chain:
  -- 'primary' = direct proof, 'supporting' = corroborating, 'missing' = required but absent
  evidence_role TEXT NOT NULL DEFAULT 'supporting' CHECK (evidence_role IN ('primary', 'supporting', 'missing')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE relationship_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relationship_evidence_authenticated" ON relationship_evidence
  FOR ALL TO authenticated
  USING (get_user_role() IN ('Admin', 'Reviewer'));

-- ============================================================
-- 4. Extend findings category enum for new Phase 10 categories
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'Employment Mismatch'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'finding_category')
  ) THEN
    ALTER TYPE finding_category ADD VALUE IF NOT EXISTS 'Employment Mismatch';
    ALTER TYPE finding_category ADD VALUE IF NOT EXISTS 'Income Discrepancy';
    ALTER TYPE finding_category ADD VALUE IF NOT EXISTS 'Document Validity';
    ALTER TYPE finding_category ADD VALUE IF NOT EXISTS 'Relationship Evidence';
  END IF;
EXCEPTION WHEN others THEN
  -- finding_category may be a TEXT column — skip enum extension
  NULL;
END $$;

-- ============================================================
-- 5. Extend findings scope to include 'relationship'
-- ============================================================
DO $$
BEGIN
  ALTER TABLE findings ADD COLUMN IF NOT EXISTS verification_stage TEXT DEFAULT 'applicant_internal';
EXCEPTION WHEN others THEN NULL;
END $$;
