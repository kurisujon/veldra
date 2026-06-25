BEGIN;

-- 1. Create role enum
DO $$ BEGIN
    CREATE TYPE finding_field_role AS ENUM ('source_a', 'source_b', 'supporting');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create join table
CREATE TABLE IF NOT EXISTS public.finding_field_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
    document_field_id UUID NOT NULL REFERENCES public.document_fields(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    role finding_field_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX idx_ffr_finding_id ON public.finding_field_references(finding_id);
CREATE INDEX idx_ffr_document_field_id ON public.finding_field_references(document_field_id);
CREATE INDEX idx_ffr_document_id ON public.finding_field_references(document_id);

-- 4. Row Level Security
ALTER TABLE public.finding_field_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewers select finding_field_references" ON public.finding_field_references
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert finding_field_references" ON public.finding_field_references
    FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update finding_field_references" ON public.finding_field_references
    FOR UPDATE TO authenticated
    USING (public.get_user_role() IN ('Admin', 'Reviewer'))
    WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers delete finding_field_references" ON public.finding_field_references
    FOR DELETE TO authenticated
    USING (public.get_user_role() = 'Admin');

COMMIT;
