-- Migration: Phase 9 Export Multi-Format

ALTER TABLE export_packages
  DROP COLUMN IF EXISTS package_url,
  DROP COLUMN IF EXISTS format;

ALTER TABLE export_packages
  ADD COLUMN pdf_path TEXT,
  ADD COLUMN docx_path TEXT,
  ADD COLUMN title TEXT,
  ADD COLUMN status TEXT,
  ADD COLUMN generated_by UUID,
  ADD COLUMN generated_at TIMESTAMPTZ;
