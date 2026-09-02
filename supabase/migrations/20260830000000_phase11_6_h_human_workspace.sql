-- migration: 20260830000000_phase11_6_h_human_workspace.sql
-- Description: Hardens document_fields state transitions via RPC and locks down arbitrary UPDATEs.

BEGIN;

-- 1. Revoke generic UPDATE from document_fields to prevent arbitrary client state mutation
DROP POLICY IF EXISTS "Reviewers update document_fields" ON public.document_fields;

-- We still need the AI pipeline or backend to update fields if necessary, but we can do that via service role.
-- For standard Reviewers, they can only update via the RPC.

-- 2. Create the secure state transition RPC
CREATE OR REPLACE FUNCTION public.verify_document_field(
    p_field_id UUID,
    p_action TEXT,
    p_corrected_value TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Executes with privileges of the creator (postgres/admin)
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
    v_current_state TEXT;
    v_new_state TEXT;
    v_normalized TEXT;
BEGIN
    -- 1. Authentication Check
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Authorization Check
    v_user_role := public.get_user_role();
    IF v_user_role NOT IN ('Admin', 'Reviewer') THEN
        RAISE EXCEPTION 'Not authorized to verify fields';
    END IF;

    -- 3. Fetch current field
    SELECT state INTO v_current_state
    FROM public.document_fields
    WHERE id = p_field_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Field not found';
    END IF;

    -- 4. Transition Logic
    IF p_action = 'accept' THEN
        IF v_current_state NOT IN ('candidate') THEN
            RAISE EXCEPTION 'Only candidate fields can be accepted';
        END IF;
        v_new_state := 'verified';
        
    ELSIF p_action = 'reject' THEN
        -- Depending on how reject works, it could mean 'not_present' or 'rejected'
        v_new_state := 'ambiguous'; -- or whatever explicit rejected state we mapped
        
    ELSIF p_action = 'correct' THEN
        v_new_state := 'verified';
    ELSE
        RAISE EXCEPTION 'Invalid verification action: %', p_action;
    END IF;

    -- 5. Execute Update
    UPDATE public.document_fields
    SET 
        state = v_new_state,
        reviewed_value = CASE WHEN p_action = 'correct' THEN p_corrected_value ELSE NULL END,
        final_value = CASE 
            WHEN p_action = 'correct' THEN p_corrected_value 
            WHEN p_action = 'accept' THEN normalized_value
            ELSE NULL 
        END,
        status = CASE WHEN p_action = 'reject' THEN 'Rejected' ELSE 'Accepted' END, -- Legacy sync
        reviewed_by = v_user_id,
        reviewed_at = NOW()
    WHERE id = p_field_id;

END;
$$;

COMMIT;
