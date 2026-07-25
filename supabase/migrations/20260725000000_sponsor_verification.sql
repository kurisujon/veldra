-- Create sponsors table
CREATE TABLE sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for sponsors
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users on sponsors"
ON sponsors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert to authenticated users on sponsors"
ON sponsors FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update to authenticated users on sponsors"
ON sponsors FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow delete to authenticated users on sponsors"
ON sponsors FOR DELETE TO authenticated USING (true);

-- Alter documents table
ALTER TABLE documents ADD COLUMN owner_type TEXT NOT NULL DEFAULT 'applicant' CHECK (owner_type IN ('applicant', 'sponsor'));
ALTER TABLE documents ADD COLUMN sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE;

-- Alter findings table
ALTER TABLE findings ADD COLUMN finding_scope TEXT NOT NULL DEFAULT 'applicant_only' CHECK (finding_scope IN ('applicant_only', 'sponsor_only', 'applicant_and_sponsor'));

-- Extend documents.type CHECK constraint to include sponsor document types
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_type_check
  CHECK (type IN ('PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma', 'ValidID', 'BankStatement', 'ProofOfBilling'));

-- Extend finding_category enum to include 'Identity' for sponsor cross-reference findings
ALTER TYPE finding_category ADD VALUE IF NOT EXISTS 'Identity';

-- Extend finding_severity enum to include 'Warning' for sponsor-scoped findings
ALTER TYPE finding_severity ADD VALUE IF NOT EXISTS 'Warning';

-- RPC to add sponsor (max 2)
CREATE OR REPLACE FUNCTION add_sponsor_to_case(
  p_case_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_relationship TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sponsor_count INT;
  v_new_sponsor_id UUID;
BEGIN
  -- Authenticate
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Count existing sponsors
  SELECT COUNT(*) INTO v_sponsor_count FROM sponsors WHERE case_id = p_case_id;
  IF v_sponsor_count >= 2 THEN
    RAISE EXCEPTION 'A case can have a maximum of 2 sponsors.';
  END IF;

  -- Insert sponsor
  INSERT INTO sponsors (case_id, first_name, last_name, relationship)
  VALUES (p_case_id, p_first_name, p_last_name, p_relationship)
  RETURNING id INTO v_new_sponsor_id;

  RETURN v_new_sponsor_id;
END;
$$;
