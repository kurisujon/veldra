-- Atomically clears the extraction-owned data before a reviewer re-runs extraction.
-- Direct DELETE remains Admin-only; this narrowly scoped RPC is the Reviewer path.

BEGIN;

CREATE OR REPLACE FUNCTION public.replace_document_extraction_data(
    p_extraction_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_user_role := public.get_user_role();
    IF v_user_role NOT IN ('Admin', 'Reviewer') THEN
        RAISE EXCEPTION 'Not authorized to replace extraction data';
    END IF;

    PERFORM 1
    FROM public.document_extractions
    WHERE id = p_extraction_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Extraction not found';
    END IF;

    -- Cascades remove field_evidence for the old fields.
    DELETE FROM public.document_fields
    WHERE document_extraction_id = p_extraction_id;

    -- Cascades remove ocr_spans and any remaining field_evidence references.
    DELETE FROM public.ocr_pages
    WHERE extraction_id = p_extraction_id;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_document_extraction_data(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_document_extraction_data(UUID) TO authenticated;

COMMIT;
