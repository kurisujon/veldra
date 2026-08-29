-- migration: 20260826000000_zero_trust_extraction.sql
-- Description: Creates canonical EvidenceSpan mapping tables (ocr_pages, ocr_spans, field_evidence) for Phase 11.6 Zero-Trust architecture. Add explicit states to document_fields.

BEGIN;

-- =========================================================================
-- 1. Create Tables: ocr_pages, ocr_spans, field_evidence
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.ocr_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extraction_id UUID NOT NULL REFERENCES public.document_extractions(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    provider_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ocr_pages_extraction_id ON public.ocr_pages(extraction_id);

CREATE TABLE IF NOT EXISTS public.ocr_spans (
    id TEXT PRIMARY KEY, -- We use TEXT because provider spans (e.g., SPAN_001, or GCP ID) might be strings. Alternatively, UUID. We will use TEXT as required by canonical EvidenceSpan map.
    extraction_id UUID NOT NULL REFERENCES public.document_extractions(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES public.ocr_pages(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    bounding_box JSONB, -- { x, y, width, height }
    ocr_confidence NUMERIC,
    block_type TEXT, -- 'word', 'line', 'paragraph', 'key_value'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ocr_spans_extraction_id ON public.ocr_spans(extraction_id);
CREATE INDEX idx_ocr_spans_page_id ON public.ocr_spans(page_id);

CREATE TABLE IF NOT EXISTS public.field_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_field_id UUID NOT NULL REFERENCES public.document_fields(id) ON DELETE CASCADE,
    ocr_span_id TEXT NOT NULL REFERENCES public.ocr_spans(id) ON DELETE CASCADE,
    evidence_role TEXT, -- e.g. 'value', 'label', 'supporting'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_field_evidence_document_field_id ON public.field_evidence(document_field_id);
CREATE INDEX idx_field_evidence_ocr_span_id ON public.field_evidence(ocr_span_id);

-- =========================================================================
-- 2. Alter document_fields for Zero-Trust State
-- =========================================================================

-- We preserve 'status' (legacy enum), 'source_text', 'page_number', 'bounding_box'
-- We add 'state' to support explicit extraction states (candidate, verified, not_present, unreadable, ambiguous)
-- We use TEXT with a CHECK constraint instead of ENUM to avoid complex migration issues with legacy systems.
DO $$ BEGIN
    ALTER TABLE public.document_fields ADD COLUMN state TEXT DEFAULT 'candidate';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

ALTER TABLE public.document_fields
ADD CONSTRAINT check_document_fields_state
CHECK (state IN ('candidate', 'verified', 'not_present', 'unreadable', 'ambiguous'));

-- =========================================================================
-- 3. Enable RLS
-- =========================================================================

ALTER TABLE public.ocr_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_spans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_evidence ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. RLS Policies (Admins & Reviewers)
-- =========================================================================

-- ocr_pages
CREATE POLICY "Reviewers select ocr_pages" ON public.ocr_pages
    FOR SELECT TO authenticated USING (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert ocr_pages" ON public.ocr_pages
    FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update ocr_pages" ON public.ocr_pages
    FOR UPDATE TO authenticated USING (public.get_user_role() IN ('Admin', 'Reviewer')) WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers delete ocr_pages" ON public.ocr_pages
    FOR DELETE TO authenticated USING (public.get_user_role() = 'Admin');

-- ocr_spans
CREATE POLICY "Reviewers select ocr_spans" ON public.ocr_spans
    FOR SELECT TO authenticated USING (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert ocr_spans" ON public.ocr_spans
    FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update ocr_spans" ON public.ocr_spans
    FOR UPDATE TO authenticated USING (public.get_user_role() IN ('Admin', 'Reviewer')) WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers delete ocr_spans" ON public.ocr_spans
    FOR DELETE TO authenticated USING (public.get_user_role() = 'Admin');

-- field_evidence
CREATE POLICY "Reviewers select field_evidence" ON public.field_evidence
    FOR SELECT TO authenticated USING (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert field_evidence" ON public.field_evidence
    FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update field_evidence" ON public.field_evidence
    FOR UPDATE TO authenticated USING (public.get_user_role() IN ('Admin', 'Reviewer')) WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers delete field_evidence" ON public.field_evidence
    FOR DELETE TO authenticated USING (public.get_user_role() = 'Admin');

COMMIT;
