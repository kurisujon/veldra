# Analysis — Database Schema & Storage Strategy for Phase 4 Milestone 2

This report presents the database schema and storage strategy for Milestone 2 of Phase 4 (Document Uploads and Management) in Project Veldra. It evaluates the current schema, defines a robust SQL strategy for table and storage bucket setup, presents a detailed analysis of ownership verification (Option A vs Option B), and provides a complete, drop-in SQL migration script along with verification methods.

---

## 1. Executive Summary

Milestone 2 establishes the database and storage foundation for Case-Centric Document Uploads. Based on a thorough review of the workspace's migration history, requirements, and design constraints:
- We recreate the placeholder `documents` table to store complete file metadata (`file_path`, `file_name`, `file_size`, `mime_type`) and enforce strict type categorization.
- We configure a private `documents` bucket in Supabase Storage with tight constraints on file sizes and MIME types.
- We write Row Level Security (RLS) policies for both the `documents` table and `storage.objects` table using schema-qualified helper functions (`public.get_user_role()`) to prevent environment-specific resolution errors.
- We implement two security-hardened RPC functions (`upload_document_record` and `delete_document`) as `SECURITY DEFINER` with `search_path = public` to enforce role verification and write automated audit trails.
- We outline the trade-offs of tracking uploader ownership via the Storage schema (Option A) vs. a direct audit column (Option B), providing detailed SQL scripts for both. We recommend Option B for architectural decoupling, but supply Option A for strict schema compliance with `PROJECT.md`.

---

## 2. Current State & Database Context

By examining `supabase/migrations/` and documentation, we identified the following database details:

1. **Existing Placeholders**:
   - `supabase/migrations/0001_architecture_hardening.sql` created a placeholder `documents` table:
     ```sql
     CREATE TABLE documents (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
       type TEXT,
       status TEXT
     );
     ```
   - `supabase/migrations/0002_phase3c_remediation.sql` enabled RLS on `documents`, defined basic policies restricting SELECT/INSERT/UPDATE to `Admin` and `Reviewer` roles, restricted DELETE to `Admin`, added indexes on `case_id`, and added `created_at` and `updated_at` audit columns.

2. **Roles and Permissions**:
   - User roles are restricted to `'Admin'` and `'Reviewer'` by a CHECK constraint on `user_roles.role` in migration `0001`.
   - The role of the current user is retrieved server-side via `get_user_role()`, which is a `SECURITY DEFINER` function query on `user_roles`.

3. **Requirement Gap**:
   - The current placeholder table lacks essential metadata: `file_path`, `file_name`, `file_size`, and `mime_type`.
   - `case_id` and `type` are currently nullable in the database, whereas the interface contract in `PROJECT.md` requires them to be `NOT NULL`.

To resolve these discrepancies cleanly, the migration must drop the placeholder table with `DROP TABLE ... CASCADE` to remove all bound indexes and policies, and then reconstruct it according to specs.

---

## 3. SQL Strategy Formulation

### 3.1 Table Recreation (`documents`)
The rebuilt table will strictly define all required columns:
- `case_id` references `cases(id) ON DELETE CASCADE` and is marked `NOT NULL`.
- `type` is marked `NOT NULL` with a check constraint limiting values to `'PSABirth'`, `'PSAMarriage'`, `'TOR'`, `'SF10'`, and `'Diploma'`.
- `file_path` is marked `NOT NULL UNIQUE` to prevent path collisions.
- `status` is marked `NOT NULL DEFAULT 'uploaded'`.
- Recreate index `idx_documents_case_id ON documents(case_id)` to optimize relational queries.

### 3.2 Row Level Security (RLS) on `documents` Table
- **Select, Insert, Update**: Permitted for authenticated users with role `'Admin'` or `'Reviewer'`.
- **Delete**: Restructured. The table RLS policy allows direct SQL deletes only for `'Admin'`. Regular `'Reviewer'` users must perform deletions via the secure `delete_document` RPC, which performs ownership checks and ensures atomic cleanup.

### 3.3 Storage Configuration (`documents` bucket)
- Sensitive applicant documents containing PII must reside in a private bucket. We insert a record into `storage.buckets` setting `public = false`.
- We configure a maximum file size limit of `52428800` bytes (50MB) and restrict MIME types to `application/pdf`, `image/jpeg`, and `image/png`.

### 3.4 Storage RLS Policies (`storage.objects` table)
- **Select / Insert / Update**: Permitted for authenticated users with role `'Admin'` or `'Reviewer'`.
- **Schema Qualification**: RLS policies on the `storage` schema must qualify the role helper as `public.get_user_role()` to prevent runtime errors when PostgreSQL attempts to resolve the search path.
- **Delete Policy**: We explicitly omit direct client-side delete policies (or lock down delete to Admin). Reviewers must delete files via the `delete_document` RPC, ensuring that files cannot be deleted from storage without removing the matching database record, which prevents orphan files.

### 3.5 RPC: `upload_document_record`
- Defined as `SECURITY DEFINER SET search_path = public` to avoid search path hijacking.
- Verifies that the user role is `'Admin'` or `'Reviewer'`.
- Verifies that the case exists.
- Inserts document metadata into `public.documents`.
- Automatically logs a `DOCUMENT_UPLOADED` action to the `activity_logs` audit trail.

### 3.6 RPC: `delete_document`
- Defined as `SECURITY DEFINER SET search_path = public`.
- Verifies that the user role is `'Admin'` or `'Reviewer'`.
- Fetches the document's `case_id`, `file_name`, and path.
- Validates deletion permissions: `'Admin'` can delete any document. `'Reviewer'` can only delete documents they uploaded.
- Deletes the storage metadata in `storage.objects` and the database record in `public.documents` inside a single atomic transaction.
- Logs a `DOCUMENT_DELETED` action in `activity_logs`.

---

## 4. Key Design Decision: Option A vs. Option B

A primary architectural decision is how to track who uploaded a document to verify that a `'Reviewer'` is only deleting their own upload.

### Option A: Query Storage Metadata (`storage.objects.owner`)
- **Mechanism**: The RPC queries the `owner` column in the `storage.objects` table using the document's `file_path`. Supabase Storage automatically writes the uploader's user ID to this column when a file is uploaded.
- **Pros**: Matches the exact database schema columns specified in `PROJECT.md` without adding any columns.
- **Cons**: Creates a tight cross-schema dependency on `storage.objects`. If a file is deleted from storage prior to calling the RPC, the lookup returns `NULL`, which requires fallback logic to prevent blocking deletions.

### Option B: Add `uploaded_by` Column to `public.documents`
- **Mechanism**: We add an `uploaded_by UUID NOT NULL REFERENCES auth.users(id)` column to the `documents` table, which is set to the uploader's ID during insertion.
- **Pros**: Self-contained, robust schema design. Avoids cross-schema lookups. Simplifies RLS delete policies on the table and avoids any edge cases with missing files.
- **Cons**: Minor deviation from the schema contract in `PROJECT.md`, although it is standard practice to append auditing columns (as was done with `created_at` and `updated_at`).

### Recommendation
**Option B** is highly recommended for backend durability and cleaner TypeScript typing. However, we provide complete scripts for both.

---

## 5. SQL Implementation Scripts

### Option A: Strict Adherence to `PROJECT.md` (Resolves Owner via Storage)

```sql
-- migration: <timestamp>_phase4_documents.sql
-- Description: Sets up documents table, storage bucket, RLS, and RPCs (Option A)

BEGIN;

-- 1. Table Recreation (documents)
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
);

-- Recreate index on case_id for performance on joins
CREATE INDEX idx_documents_case_id ON public.documents(case_id);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies on public.documents
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

-- Admin can delete all. Reviewers can delete if they are the storage owner of the file.
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

-- 3. Storage Configuration (documents bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false, 
  52428800, -- 50MB in bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[];

-- 4. Storage RLS Policies (storage.objects)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert for documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow update for documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete for documents bucket" ON storage.objects;

-- Allow Admins and Reviewers to view objects in the documents bucket
CREATE POLICY "Allow select for documents bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

-- Allow Admins and Reviewers to upload objects in the documents bucket
CREATE POLICY "Allow insert for documents bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

-- Allow Admins and Reviewers to update objects in the documents bucket
CREATE POLICY "Allow update for documents bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

-- We explicitly omit a DELETE policy for storage.objects for Reviewers/Authenticated
-- to prevent direct API deletions. Direct deletes are restricted to Admins.
CREATE POLICY "Allow delete for documents bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() = 'Admin');

-- 5. RPC Functions

/**
 * Inserts a document metadata record into the documents table and logs activity.
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
  v_user_id := auth.uid();
  v_user_role := get_user_role();

  IF v_user_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cases WHERE id = p_case_id) THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

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
  v_file_name TEXT;
BEGIN
  v_user_id := auth.uid();
  v_user_role := get_user_role();

  IF v_user_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT file_path, case_id, file_name INTO v_file_path, v_case_id, v_file_name 
  FROM public.documents 
  WHERE id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- Ownership check for Reviewers
  IF v_user_role = 'Reviewer' THEN
    SELECT owner INTO v_owner 
    FROM storage.objects 
    WHERE bucket_id = 'documents' 
      AND name = v_file_path;

    -- If uploader is known and doesn't match the current user, block the deletion
    IF v_owner IS NOT NULL AND v_owner <> v_user_id THEN
      RAISE EXCEPTION 'Unauthorized: You can only delete your own uploads';
    END IF;
  END IF;

  -- Perform atomic deletion of storage object (Security Definer bypasses RLS)
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
    'Deleted document: ' || v_file_name
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
```

---

### Option B: Recommended Strategy (With `uploaded_by` Audit Column)

```sql
-- migration: <timestamp>_phase4_documents.sql
-- Description: Sets up documents table, storage bucket, RLS, and RPCs (Option B)

BEGIN;

-- 1. Table Recreation (documents)
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
  uploaded_by UUID NOT NULL REFERENCES auth.users(id), -- Direct uploader tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recreate index on case_id for performance on joins
CREATE INDEX idx_documents_case_id ON public.documents(case_id);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies on public.documents
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

-- Admin can delete all. Reviewers can delete if they are the direct uploader.
CREATE POLICY "Reviewers delete documents" ON public.documents
  FOR DELETE TO authenticated
  USING (get_user_role() = 'Admin' OR (get_user_role() = 'Reviewer' AND uploaded_by = auth.uid()));

-- 3. Storage Configuration (documents bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false, 
  52428800, -- 50MB in bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[];

-- 4. Storage RLS Policies (storage.objects)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert for documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow update for documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete for documents bucket" ON storage.objects;

-- Allow Admins and Reviewers to view objects in the documents bucket
CREATE POLICY "Allow select for documents bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

-- Allow Admins and Reviewers to upload objects in the documents bucket
CREATE POLICY "Allow insert for documents bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

-- Allow Admins and Reviewers to update objects in the documents bucket
CREATE POLICY "Allow update for documents bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

-- We explicitly omit a DELETE policy for storage.objects for Reviewers/Authenticated
-- to prevent direct API deletions. Direct deletes are restricted to Admins.
CREATE POLICY "Allow delete for documents bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() = 'Admin');

-- 5. RPC Functions

/**
 * Inserts a document metadata record into the documents table and logs activity.
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
  v_user_id := auth.uid();
  v_user_role := get_user_role();

  IF v_user_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cases WHERE id = p_case_id) THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

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
  v_file_name TEXT;
BEGIN
  v_user_id := auth.uid();
  v_user_role := get_user_role();

  IF v_user_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT file_path, case_id, uploaded_by, file_name INTO v_file_path, v_case_id, v_uploaded_by, v_file_name 
  FROM public.documents 
  WHERE id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- Ownership check for Reviewers
  IF v_user_role = 'Reviewer' AND v_uploaded_by <> v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own uploads';
  END IF;

  -- Perform atomic deletion of storage object (Security Definer bypasses RLS)
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
    'Deleted document: ' || v_file_name
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
```

---

## 6. Verification Methods

The following tests verify that the migration is secure, correct, and maintains build safety:

1. **Migration Apply and Compilation**:
   - Run the migration using local Supabase CLI:
     ```bash
     supabase db reset
     ```
   - Verify that the schema is created without database compiler errors.

2. **Constraint Verification**:
   - Verify type constraint by inserting an invalid document type:
     ```sql
     INSERT INTO public.documents (case_id, type, file_path, file_name, file_size, mime_type, uploaded_by)
     VALUES ('some-case-uuid', 'InvalidType', 'path', 'file.pdf', 100, 'application/pdf', 'some-user-uuid');
     -- Expected: Fails with CHECK constraint violation on `type`.
     ```

3. **RPC Role Verification**:
   - Test execution as a non-authenticated user or unauthorized role:
     ```sql
     -- Execute without auth context
     SELECT upload_document_record('some-case-uuid', 'PSABirth', 'path', 'file.pdf', 100, 'application/pdf');
     -- Expected: Fails with 'Unauthorized' exception.
     ```

4. **Reviewer Ownership Restriction**:
   - Simulating user session for Reviewer A attempting to delete a document uploaded by Reviewer B:
     ```sql
     -- Mock auth context for Reviewer A
     SELECT set_config('request.jwt.claims', '{"sub": "reviewer-a-id", "role": "authenticated"}', true);
     -- Attempt to call delete_document for a document record where uploaded_by = 'reviewer-b-id'
     SELECT delete_document('document-b-id');
     -- Expected: Fails with 'Unauthorized: You can only delete your own uploads' exception.
     ```

5. **TypeScript and Build Integrity**:
   - Generate database types to ensure they are synchronized:
     ```bash
     supabase gen types typescript --local > src/types/database.ts
     ```
   - Run Next.js linting and build validation:
     ```bash
     npm run build
     npm run lint
     ```
     Ensure that the changes are cleanly integrated and both commands pass with zero warnings.
