-- Migration: Add evidence-tracking columns to document_fields and document_extractions
-- Date: 2026-08-17

BEGIN;

-- Add columns to document_fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_fields' AND column_name = 'source_text') THEN
        ALTER TABLE document_fields ADD COLUMN source_text TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_fields' AND column_name = 'page_number') THEN
        ALTER TABLE document_fields ADD COLUMN page_number INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_fields' AND column_name = 'bounding_box') THEN
        ALTER TABLE document_fields ADD COLUMN bounding_box JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_fields' AND column_name = 'ocr_confidence') THEN
        ALTER TABLE document_fields ADD COLUMN ocr_confidence NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_fields' AND column_name = 'evidence_status') THEN
        ALTER TABLE document_fields ADD COLUMN evidence_status TEXT DEFAULT 'uncertain';
    END IF;
END $$;

-- Add columns to document_extractions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_extractions' AND column_name = 'ocr_text') THEN
        ALTER TABLE document_extractions ADD COLUMN ocr_text TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_extractions' AND column_name = 'page_count') THEN
        ALTER TABLE document_extractions ADD COLUMN page_count INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_extractions' AND column_name = 'document_quality') THEN
        ALTER TABLE document_extractions ADD COLUMN document_quality TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_extractions' AND column_name = 'model_used') THEN
        ALTER TABLE document_extractions ADD COLUMN model_used TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_extractions' AND column_name = 'processing_duration_ms') THEN
        ALTER TABLE document_extractions ADD COLUMN processing_duration_ms INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_extractions' AND column_name = 'ocr_engine') THEN
        ALTER TABLE document_extractions ADD COLUMN ocr_engine TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_extractions' AND column_name = 'retry_count') THEN
        ALTER TABLE document_extractions ADD COLUMN retry_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_extractions' AND column_name = 'uncertain_field_count') THEN
        ALTER TABLE document_extractions ADD COLUMN uncertain_field_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create index on evidence_status for document_fields
CREATE INDEX IF NOT EXISTS idx_document_fields_evidence_status ON document_fields (evidence_status);

COMMIT;
