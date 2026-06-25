BEGIN;

-- Repair: add missing 'type' column to generated_drafts
DO $$ BEGIN
  CREATE TYPE draft_type AS ENUM ('Affidavit', 'AddressLetter', 'GapLetter');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.generated_drafts
  ADD COLUMN IF NOT EXISTS type draft_type NOT NULL DEFAULT 'Affidavit';

COMMIT;
