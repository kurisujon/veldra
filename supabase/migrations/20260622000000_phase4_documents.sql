-- migration: 20260622000000_phase4_documents.sql
-- Description: Sets up documents schema, storage bucket, RLS, and RPCs for Phase 4.

BEGIN;

-- =========================================================================
-- 1. Table Recreation (documents)
-- =========================================================================

-- Drop the placeholder table and its dependencies (policies, indexes)
DROP TABLE IF EXISTS public.documents CASCADE;

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma')),
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recreate index on case_id for performance on joins
CREATE INDEX idx_documents_case_id ON public.documents(case_id);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 2. RLS Policies on public.documents
-- =========================================================================

CREATE POLICY "Reviewers select documents" ON public.documents
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update documents" ON public.documents
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers delete documents" ON public.documents
  FOR DELETE TO authenticated
  USING (
    public.get_user_role() = 'Admin' OR 
    (public.get_user_role() = 'Reviewer' AND uploaded_by = auth.uid())
  );

-- =========================================================================
-- 3. Storage Configuration (documents bucket)
-- =========================================================================

-- Insert the documents bucket into storage.buckets. 
-- The bucket is non-public as it contains sensitive student and visa PII.
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 4. Storage RLS Policies (storage.objects)
-- =========================================================================

-- Enable RLS on storage.objects if it is not already (Supabase default does this, skipped to avoid 42501 permission error)

-- Remove any old policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Allow select for documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert for documents bucket" ON storage.objects;

-- Allow Admins and Reviewers to view objects in the documents bucket
CREATE POLICY "Allow select for documents bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

-- Allow Admins and Reviewers to upload objects in the documents bucket
CREATE POLICY "Allow insert for documents bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

-- NOTE: We explicitly omit a DELETE policy for storage.objects.
-- This prevents direct API deletions from client code, ensuring files can only
-- be deleted via the delete_document RPC to preserve referential integrity.

-- =========================================================================
-- 5. RPC Functions
-- =========================================================================

/**
 * Inserts a document metadata record into the documents table and logs activity.
 * Designed with SECURITY DEFINER and search_path locked to public.
 */
CREATE OR REPLACE FUNCTION public.upload_document_record(
  p_case_id UUID,
  p_type TEXT,
  p_file_path TEXT,
  p_file_name TEXT,
  p_file_size INTEGER,
  p_mime_type TEXT
) RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
  v_user_role TEXT;
  v_user_id UUID;
  v_uploaded_by UUID;
BEGIN
  -- Get user info securely server-side
  v_user_id := auth.uid();
  v_user_role := public.get_user_role();

  -- Enforce role access
  IF v_user_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate that the referenced case exists
  IF NOT EXISTS (SELECT 1 FROM public.cases WHERE id = p_case_id) THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  -- Insert document metadata
  INSERT INTO public.documents (
    case_id, 
    type, 
    file_path, 
    file_name, 
    file_size, 
    mime_type,
    status,
    uploaded_by
  ) VALUES (
    p_case_id, 
    p_type, 
    p_file_path, 
    p_file_name, 
    p_file_size, 
    p_mime_type,
    'uploaded',
    v_user_id
  ) RETURNING id INTO v_document_id;

  -- Create activity log entry
  INSERT INTO public.activity_logs (
    case_id, 
    user_id, 
    role, 
    action_type, 
    description
  ) VALUES (
    p_case_id, 
    v_user_id, 
    v_user_role, 
    'DOCUMENT_UPLOADED', 
    'Uploaded ' || p_type || ' document: ' || p_file_name
  );

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


/**
 * Deletes a document record and its corresponding storage file atomically.
 * Enforces ownership checks: Reviewers can only delete their own uploads, Admins can delete all.
 * Designed with SECURITY DEFINER and search_path locked to public.
 */
CREATE OR REPLACE FUNCTION public.delete_document(
  p_document_id UUID
) RETURNS VOID AS $$
DECLARE
  v_file_path TEXT;
  v_uploaded_by UUID;
  v_user_role TEXT;
  v_user_id UUID;
  v_case_id UUID;
BEGIN
  -- Get user info securely server-side
  v_user_id := auth.uid();
  v_user_role := public.get_user_role();

  -- Enforce role access
  IF v_user_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Fetch file details and case context
  SELECT file_path, case_id, uploaded_by INTO v_file_path, v_case_id, v_uploaded_by
  FROM public.documents
  WHERE id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- Ownership validation for Reviewers
  IF v_user_role = 'Reviewer' AND v_uploaded_by <> v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own uploads';
  END IF;

  -- Perform atomic deletion of storage object
  DELETE FROM storage.objects 
  WHERE bucket_id = 'documents' 
    AND name = v_file_path;

  -- Perform deletion of document record
  DELETE FROM public.documents 
  WHERE id = p_document_id;

  -- Create activity log entry
  INSERT INTO public.activity_logs (
    case_id, 
    user_id, 
    role, 
    action_type, 
    description
  ) VALUES (
    v_case_id, 
    v_user_id, 
    v_user_role, 
    'DOCUMENT_DELETED', 
    'Deleted document at path: ' || v_file_path
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
