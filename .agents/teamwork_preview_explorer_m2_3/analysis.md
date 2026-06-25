# Analysis — Milestone 2 SQL Strategy

## 1. Executive Summary
This report defines the SQL migration strategy for Phase 4 Milestone 2 of the Veldra project (Case-Centric Document Uploads and Management). It outlines the schema modifications for the `documents` table, storage bucket setup, storage RLS policies, table RLS policies, and two key security-hardened RPC functions (`upload_document_record` and `delete_document`). 

We present a complete, drop-in SQL migration script that respects all project constraints:
- Uses `SECURITY DEFINER` and explicitly locks down `search_path = public`.
- Derives user roles server-side using `get_user_role()` (no client trust).
- Secures database and storage deletion atomically, preventing orphan files or broken database records.

---

## 2. Current State & Schema Findings
Our investigation of `supabase/migrations/` revealed the following:
1. **Existing `documents` placeholder**: In `0001_architecture_hardening.sql`, a placeholder `documents` table was created with columns `id`, `case_id`, `type`, and `status`. In `0002_phase3c_remediation.sql`, audit columns `created_at` and `updated_at` were added, and RLS policies and an index on `case_id` were set up.
2. **Requirement Gap**: The placeholder table is missing essential file metadata columns: `file_path`, `file_name`, `file_size`, and `mime_type`. In addition, `type` and `case_id` are currently nullable, whereas the interface contract in `PROJECT.md` requires them to be `NOT NULL`.
3. **Storage Bucket**: There is currently no definition for a `documents` storage bucket in the migrations.

To resolve these, we propose dropping the existing placeholder table and recreating it cleanly to avoid migration conflicts, then establishing the storage bucket and relevant RLS policies.

---

## 3. SQL Strategy Formulation

### 3.1 Table Recreation (`documents`)
The `documents` table must store metadata for uploaded files linked to cases.
- `case_id` must reference `cases(id)` with `ON DELETE CASCADE`.
- `type` must restrict input to the predefined document types using a `CHECK` constraint: `CHECK (type IN ('PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma'))`.
- `file_path` must be unique to prevent namespace collisions.

### 3.2 RLS Policies (`documents` table)
Access is restricted to authenticated users with 'Admin' or 'Reviewer' roles:
- **Select / Insert / Update**: Permitted for 'Admin' and 'Reviewer'.
- **Delete**: Permitted for 'Admin' (all records) and 'Reviewer' (only their own uploads). We define table-level policies to match this logic.

### 3.3 Storage Configuration (`documents` bucket)
Sensitive client documents must be kept in a private bucket. We configure the `documents` bucket inside `storage.buckets` with `public = false`.

### 3.4 Storage RLS Policies (`storage.objects` table)
To ensure documents are only accessed and written through secure channels:
- **Select / Insert**: Allowed only if user role is 'Admin' or 'Reviewer' and `bucket_id = 'documents'`.
- **Delete**: We explicitly **omit** direct delete privileges from storage RLS policies. This forces clients to delete files through the `delete_document` RPC, guaranteeing atomic cleanup of database records and storage objects.

### 3.5 RPC Function: `upload_document_record`
Inserts the document metadata into the database and logs a `DOCUMENT_UPLOADED` action.
- Executed as `SECURITY DEFINER` with `search_path = public`.
- Validates the case exists.
- Inserts an audit log into `activity_logs`.

### 3.6 RPC Function: `delete_document`
Performs an atomic deletion of the database record and the corresponding file in `storage.objects`.
- Executed as `SECURITY DEFINER` with `search_path = public`.
- Enforces role-based delete rights (Reviewers can only delete their own uploads; Admins can delete any).
- Performs the deletion in a single database transaction.
- Logs a `DOCUMENT_DELETED` action.

---

## 4. Key Design Decisions & Trade-offs

### Ownership Verification: Option A vs Option B
Since `PROJECT.md` specifies that Reviewers can only delete "their uploads", we must track which user uploaded which document. We have two options:

*   **Option A: Retrieve Owner from Storage (`storage.objects.owner`)**
    *   *Mechanism*: The `delete_document` RPC queries the `storage.objects` table using the file's path to retrieve the `owner` (automatically populated with `auth.uid()` by Supabase Storage on upload).
    *   *Pros*: Fully adheres to the exact database schema in `PROJECT.md` without adding additional columns to the `public.documents` table.
    *   *Cons*: Relies on cross-schema queries to `storage.objects`.
*   **Option B: Add `uploaded_by` Column to `public.documents`**
    *   *Mechanism*: Add `uploaded_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id)` to the `documents` table.
    *   *Pros*: Self-contained database design. No cross-schema dependencies. Simplifies SQL queries.
    *   *Cons*: Introduces an extra column not explicitly detailed in `PROJECT.md`.

*Recommendation*: We present **Option A** as the primary solution in the migration script to maintain exact compliance with `PROJECT.md`. However, we include **Option B** as a commented alternative, should the implementer prefer a self-contained public schema.

---

## 5. Complete Recommended SQL Migration Script

Below is the complete SQL script designed for the implementation phase. It is structured to run as a single migration file.

```sql
-- migration: <timestamp>_phase4_documents.sql
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  
  -- Alternative Option B (uncomment if self-contained public ownership tracking is desired):
  -- , uploaded_by UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid()
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
  USING (get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update documents" ON public.documents
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));

-- For delete policy: Admins can delete all; Reviewers can delete if they are the uploader.
-- For Option A (retrieve from storage.objects):
CREATE POLICY "Reviewers delete documents" ON public.documents
  FOR DELETE TO authenticated
  USING (
    get_user_role() = 'Admin' OR 
    (
      get_user_role() = 'Reviewer' AND 
      EXISTS (
        SELECT 1 FROM storage.objects 
        WHERE bucket_id = 'documents' 
          AND name = public.documents.file_path 
          AND owner = auth.uid()
      )
    )
  );

-- For Option B (if using uploaded_by column, replace the above DELETE policy with):
-- CREATE POLICY "Reviewers delete documents" ON public.documents
--   FOR DELETE TO authenticated
--   USING (get_user_role() = 'Admin' OR (get_user_role() = 'Reviewer' AND uploaded_by = auth.uid()));

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

-- Enable RLS on storage.objects if it is not already
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remove any old policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Allow select for documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert for documents bucket" ON storage.objects;

-- Allow Admins and Reviewers to view objects in the documents bucket
CREATE POLICY "Allow select for documents bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND get_user_role() IN ('Admin', 'Reviewer'));

-- Allow Admins and Reviewers to upload objects in the documents bucket
CREATE POLICY "Allow insert for documents bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND get_user_role() IN ('Admin', 'Reviewer'));

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
BEGIN
  -- Get user info securely server-side
  v_user_id := auth.uid();
  v_user_role := get_user_role();

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
    status
  ) VALUES (
    p_case_id, 
    p_type, 
    p_file_path, 
    p_file_name, 
    p_file_size, 
    p_mime_type,
    'uploaded'
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
  v_owner UUID;
  v_user_role TEXT;
  v_user_id UUID;
  v_case_id UUID;
BEGIN
  -- Get user info securely server-side
  v_user_id := auth.uid();
  v_user_role := get_user_role();

  -- Enforce role access
  IF v_user_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Fetch file details and case context
  -- For Option A (retrieve from storage.objects):
  SELECT file_path, case_id INTO v_file_path, v_case_id 
  FROM public.documents 
  WHERE id = p_document_id;

  -- For Option B (if using uploaded_by column):
  -- SELECT file_path, case_id, uploaded_by INTO v_file_path, v_case_id, v_owner
  -- FROM public.documents
  -- WHERE id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- Ownership validation for Reviewers
  IF v_user_role = 'Reviewer' THEN
    -- Under Option A, resolve ownership from storage metadata:
    SELECT owner INTO v_owner 
    FROM storage.objects 
    WHERE bucket_id = 'documents' 
      AND name = v_file_path;

    -- If uploader is known and doesn't match the current user, block the deletion
    IF v_owner IS NOT NULL AND v_owner <> v_user_id THEN
      RAISE EXCEPTION 'Unauthorized: You can only delete your own uploads';
    END IF;
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
```
