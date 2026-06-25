# DB and Storage Strategy for Phase 4 Milestone 2

This report presents the database and storage strategy for Milestone 2 of Phase 4 (Document Uploads and Management) in Project Veldra. It contains observations of the current database configuration, logical reasoning for our architectural choices, potential caveats, the complete recommended SQL migration script, and independent verification methods.

---

## 1. Observation

By inspecting the workspace, database files, and documentation, the following specific details were observed:

1. **Current Schema & Placeholders**:
   - `supabase/migrations/0001_architecture_hardening.sql` (lines 12–17) defined a simple placeholder `documents` table:
     ```sql
     CREATE TABLE documents (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
       type TEXT,
       status TEXT
     );
     ```
   - `supabase/migrations/0002_phase3c_remediation.sql` enabled Row Level Security on the `documents` table (line 38) and defined four base policies (lines 65–68):
     - `Reviewers select documents`: allows Admin and Reviewer to read.
     - `Reviewers insert documents`: allows Admin and Reviewer to insert.
     - `Reviewers update documents`: allows Admin and Reviewer to update.
     - `Reviewers delete documents`: allows Admin to delete.
   - `0002_phase3c_remediation.sql` (lines 105–107) also altered `documents` to add audit columns:
     ```sql
     ALTER TABLE documents 
     ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
     ```
   - An index exists on `documents(case_id)` (line 97):
     ```sql
     CREATE INDEX idx_documents_case_id ON documents(case_id);
     ```

2. **Role Verification & Functions**:
   - `get_user_role()` is defined as a `SECURITY DEFINER` function with `SET search_path = public` in `0002_phase3c_remediation.sql` (lines 2–4). It reads from the `user_roles` table.
   - The user roles are strictly checked via `get_user_role() IN ('Admin', 'Reviewer')`.

3. **Required Specifications (from `PROJECT.md`)**:
   - Re-creation of `documents` with:
     - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
     - `case_id` UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE
     - `type` TEXT NOT NULL (Enum labels: PSABirth, PSAMarriage, TOR, SF10, Diploma)
     - `file_path` TEXT NOT NULL UNIQUE
     - `file_name` TEXT NOT NULL
     - `file_size` INTEGER NOT NULL
     - `mime_type` TEXT NOT NULL
     - `status` TEXT NOT NULL DEFAULT 'uploaded'
     - `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
     - `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - RPC function `upload_document_record`:
     - Arguments: `p_case_id` (UUID), `p_type` (TEXT), `p_file_path` (TEXT), `p_file_name` (TEXT), `p_file_size` (INTEGER), `p_mime_type` (TEXT).
     - Returns: `UUID` (inserted document ID).
     - Security: `SECURITY DEFINER SET search_path = public`.
     - Role Check: `Admin` and `Reviewer` roles allowed.
   - RPC function `delete_document`:
     - Arguments: `p_document_id` (UUID).
     - Returns: `VOID`.
     - Security: `SECURITY DEFINER SET search_path = public`.
     - Role Check: `Admin` (delete all) or `Reviewer` (delete their own uploads).

---

## 2. Logic Chain

1. **Table Redefinition**:
   - Since a placeholder `documents` table already exists with policies and an index on it, running a naive `CREATE TABLE documents` will fail.
   - To implement the new required fields cleanly and robustly, the existing `documents` table should be dropped using `DROP TABLE IF EXISTS documents CASCADE;`. The `CASCADE` ensures that any existing policies or indexes bound to the placeholder table are also dropped without error.
   - We then recreate `documents` with the exact schema matching `PROJECT.md` and add a `CHECK (type IN ('PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma'))` to prevent invalid document types at the database level.
   - We must recreate the index `idx_documents_case_id ON documents(case_id)` to ensure fast queries.

2. **Ownership Verification Strategy (Reviewers delete their own uploads)**:
   - The specifications require that `Reviewers` can delete "their own uploads", whereas `Admins` can delete all.
   - However, the `documents` schema in `PROJECT.md` does not have a user identifier field (such as `uploaded_by` or `user_id`).
   - We propose two options to resolve this:
     - **Option A (Strict Schema Adherence)**: Resolve ownership via a lookup on the `storage.objects` table. When a file is uploaded to Supabase Storage, Supabase records the uploader's user ID in the `owner` column of `storage.objects`. We can find the owner of the document using `SELECT owner FROM storage.objects WHERE bucket_id = 'documents' AND name = file_path`. This keeps the `documents` schema exactly as specified in `PROJECT.md`.
     - **Option B (Recommended Architecture/Security Enhancement)**: Add an `uploaded_by` column (`UUID NOT NULL REFERENCES auth.users(id)`) to the `documents` table. This decouples the database deletion from the storage deletion sequence, avoids dependency on the `storage` schema, and provides an explicit database-level audit trail.
   - We provide SQL implementations for both options. **Option B is highly recommended** for stability, performance, and clean type-safety.

3. **Storage Bucket & Policies**:
   - The Supabase storage bucket `documents` needs to be initialized. This is done by inserting a record into the `storage.buckets` table:
     ```sql
     INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
     VALUES ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[])
     ON CONFLICT (id) DO NOTHING;
     ```
   - For RLS policies on the `storage.objects` table, we must qualify `get_user_role()` as `public.get_user_role()`. Because storage operates in the `storage` schema, it cannot resolve `get_user_role()` from the search path unless schema-qualified or if the search path is altered.
   - `Reviewers` and `Admins` are allowed to upload and read files. For deletion, we enforce `public.get_user_role() = 'Admin' OR (public.get_user_role() = 'Reviewer' AND auth.uid() = owner)`. This perfectly matches the deletion permissions.

4. **RPC Security**:
   - Both RPC functions are set as `SECURITY DEFINER` and `SET search_path = public` to prevent search path hijacking (satisfying strict security requirements).
   - They retrieve the caller's UUID using `auth.uid()` and role using `get_user_role()`. They perform verification and raise an exception if unauthorized.
   - When a document is created or deleted, an audit entry is automatically inserted into the `activity_logs` table (using `DOCUMENT_UPLOADED` and `DOCUMENT_DELETED` action types), fulfilling the requirements of `docs/AUDIT_LOGGING.md`.

---

## 3. Caveats

1. **Option A (Storage Lookup) Deletion Order**:
   - If Option A is chosen, the `delete_document` RPC *must* be called *before* the storage object is removed from Supabase Storage. If the storage object is removed first, the database query `SELECT owner FROM storage.objects...` will return `NULL`, making the database think ownership is unverified and preventing the Reviewer from deleting the record.
   - This caveat is completely avoided by choosing Option B (adding the `uploaded_by` column).

2. **Storage Schema Permissions**:
   - Writing policies on `storage.objects` assumes that the migration is run by a user with permission to modify the `storage` schema policies (which is standard for Supabase migrations run via the CLI/Dashboard).

3. **Case State Checking**:
   - The RPC functions do not enforce the status of the case (e.g. preventing uploads if the case is `Archived`). This is left to the application-level Server Actions, but can easily be added to the database level if desired.

---

## 4. Conclusion & Recommended SQL Migration

Below are the complete SQL scripts for both Option A and Option B.

### Recommended: Option B (With `uploaded_by` Audit Column)

This is the recommended strategy. It adds an `uploaded_by` column to explicitly track which reviewer uploaded each document.

```sql
-- 1. Clean up existing placeholder table and dependent RLS/Indexes
DROP TABLE IF EXISTS documents CASCADE;

-- 2. Create the reconstructed documents table with all required columns and uploaded_by
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma')),
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id), -- Tracks the uploader directly
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Recreate index for query optimization
CREATE INDEX idx_documents_case_id ON documents(case_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS Policies on documents table
CREATE POLICY "Reviewers select documents" ON documents FOR SELECT TO authenticated
  USING (get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert documents" ON documents FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update documents" ON documents FOR UPDATE TO authenticated
  USING (get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));

-- Direct deletion is restricted to Admins. Reviewers delete via the secure RPC.
CREATE POLICY "Admins can delete documents" ON documents FOR DELETE TO authenticated
  USING (get_user_role() = 'Admin');

-- 6. Setup Supabase Storage Bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- private bucket
  52428800, -- 50MB in bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 7. Setup Storage RLS Policies (qualifying public schema)
DROP POLICY IF EXISTS "Reviewers can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Reviewers can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Reviewers can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Reviewers can delete documents" ON storage.objects;

CREATE POLICY "Reviewers can read documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers can update documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers can delete documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents' AND (
      public.get_user_role() = 'Admin' OR 
      (public.get_user_role() = 'Reviewer' AND auth.uid() = owner)
    )
  );

-- 8. Create Secure RPC: upload_document_record
CREATE OR REPLACE FUNCTION upload_document_record(
  p_case_id UUID,
  p_type TEXT,
  p_file_path TEXT,
  p_file_name TEXT,
  p_file_size INTEGER,
  p_mime_type TEXT
) RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
  v_user_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  v_role := get_user_role();

  -- Role Verification
  IF v_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Verify case exists
  IF NOT EXISTS (SELECT 1 FROM cases WHERE id = p_case_id) THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  -- Insert Document
  INSERT INTO documents (
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

  -- Insert Activity Log
  INSERT INTO activity_logs (
    case_id,
    user_id,
    role,
    action_type,
    description
  ) VALUES (
    p_case_id,
    v_user_id,
    v_role,
    'DOCUMENT_UPLOADED',
    'Uploaded document: ' || p_file_name || ' (' || p_type || ')'
  );

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Create Secure RPC: delete_document
CREATE OR REPLACE FUNCTION delete_document(
  p_document_id UUID
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_case_id UUID;
  v_file_name TEXT;
  v_uploaded_by UUID;
BEGIN
  v_user_id := auth.uid();
  v_role := get_user_role();

  -- Role Verification
  IF v_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get document details
  SELECT case_id, file_name, uploaded_by INTO v_case_id, v_file_name, v_uploaded_by
  FROM documents 
  WHERE id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- If user is a Reviewer, they can only delete their own uploads
  IF v_role = 'Reviewer' AND v_uploaded_by <> v_user_id THEN
    RAISE EXCEPTION 'Unauthorized to delete this document';
  END IF;

  -- Delete from documents table
  DELETE FROM documents WHERE id = p_document_id;

  -- Log Activity
  INSERT INTO activity_logs (
    case_id,
    user_id,
    role,
    action_type,
    description
  ) VALUES (
    v_case_id,
    v_user_id,
    v_role,
    'DOCUMENT_DELETED',
    'Deleted document: ' || v_file_name
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

### Alternative: Option A (Strict adherence to specified columns in `PROJECT.md`)

This alternative does not add the `uploaded_by` column. It checks ownership dynamically by looking up the corresponding record in `storage.objects`.

```sql
-- 1. Clean up existing placeholder table and dependent RLS/Indexes
DROP TABLE IF EXISTS documents CASCADE;

-- 2. Create the reconstructed documents table matching PROJECT.md exactly
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma')),
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Recreate index for query optimization
CREATE INDEX idx_documents_case_id ON documents(case_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS Policies on documents table
CREATE POLICY "Reviewers select documents" ON documents FOR SELECT TO authenticated
  USING (get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers insert documents" ON documents FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers update documents" ON documents FOR UPDATE TO authenticated
  USING (get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Admins can delete documents" ON documents FOR DELETE TO authenticated
  USING (get_user_role() = 'Admin');

-- 6. Setup Supabase Storage Bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 7. Setup Storage RLS Policies (qualifying public schema)
DROP POLICY IF EXISTS "Reviewers can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Reviewers can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Reviewers can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Reviewers can delete documents" ON storage.objects;

CREATE POLICY "Reviewers can read documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers can update documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'))
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('Admin', 'Reviewer'));

CREATE POLICY "Reviewers can delete documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents' AND (
      public.get_user_role() = 'Admin' OR 
      (public.get_user_role() = 'Reviewer' AND auth.uid() = owner)
    )
  );

-- 8. Create Secure RPC: upload_document_record
CREATE OR REPLACE FUNCTION upload_document_record(
  p_case_id UUID,
  p_type TEXT,
  p_file_path TEXT,
  p_file_name TEXT,
  p_file_size INTEGER,
  p_mime_type TEXT
) RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
  v_user_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  v_role := get_user_role();

  -- Role Verification
  IF v_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Verify case exists
  IF NOT EXISTS (SELECT 1 FROM cases WHERE id = p_case_id) THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  -- Insert Document
  INSERT INTO documents (
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

  -- Insert Activity Log
  INSERT INTO activity_logs (
    case_id,
    user_id,
    role,
    action_type,
    description
  ) VALUES (
    p_case_id,
    v_user_id,
    v_role,
    'DOCUMENT_UPLOADED',
    'Uploaded document: ' || p_file_name || ' (' || p_type || ')'
  );

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Create Secure RPC: delete_document
CREATE OR REPLACE FUNCTION delete_document(
  p_document_id UUID
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_case_id UUID;
  v_file_name TEXT;
  v_file_path TEXT;
  v_owner_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_role := get_user_role();

  -- Role Verification
  IF v_role NOT IN ('Admin', 'Reviewer') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get document details
  SELECT case_id, file_name, file_path INTO v_case_id, v_file_name, v_file_path
  FROM documents 
  WHERE id = p_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  -- If user is a Reviewer, verify they own the corresponding storage object
  IF v_role = 'Reviewer' THEN
    SELECT owner INTO v_owner_id 
    FROM storage.objects 
    WHERE bucket_id = 'documents' AND name = v_file_path;

    IF v_owner_id IS NULL OR v_owner_id <> v_user_id THEN
      RAISE EXCEPTION 'Unauthorized to delete this document';
    END IF;
  END IF;

  -- Delete from documents table
  DELETE FROM documents WHERE id = p_document_id;

  -- Log Activity
  INSERT INTO activity_logs (
    case_id,
    user_id,
    role,
    action_type,
    description
  ) VALUES (
    v_case_id,
    v_user_id,
    v_role,
    'DOCUMENT_DELETED',
    'Deleted document: ' || v_file_name
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## 5. Verification Method

Once the implementer creates the migration file (e.g. `supabase/migrations/20260622000000_phase4_documents.sql`), they can verify the migration and security controls using the following steps:

1. **Local Database Migration**:
   - Apply the migration locally using the Supabase CLI:
     ```bash
     supabase db reset
     ```
   - Ensure the schema compiles and applies without error.

2. **Verify Schema & Constraints**:
   - Connect to the local Postgres database and verify the tables, constraints, and policies:
     ```sql
     -- Verify type check constraint
     INSERT INTO public.documents (case_id, type, file_path, file_name, file_size, mime_type)
     VALUES ('00000000-0000-0000-0000-000000000000', 'InvalidType', 'test', 'test.pdf', 100, 'application/pdf');
     -- Expected result: Fail with CHECK constraint violation
     ```

3. **Verify RPC Function Execution & Role Verification**:
   - Write test scripts (similar to `test_rpc2.ts`) or run SQL commands as a simulated user.
   - For example, mock user authentication in SQL:
     ```sql
     -- Set mock auth context for a Reviewer
     SELECT set_config('request.jwt.claims', '{"sub": "reviewer-user-id", "role": "authenticated"}', true);
     -- Ensure reviewer-user-id is in user_roles table as 'Reviewer'
     INSERT INTO public.user_roles (user_id, role) VALUES ('reviewer-user-id', 'Reviewer') ON CONFLICT DO NOTHING;
     
     -- Test calling upload_document_record
     -- Expected result: Document inserts successfully, activity log is created.
     ```

4. **Verify Storage Bucket Configuration**:
   - Verify that the `documents` bucket exists and has correct constraints:
     ```sql
     SELECT id, name, public, file_size_limit, allowed_mime_types 
     FROM storage.buckets 
     WHERE id = 'documents';
     ```

5. **Type Generation & Build**:
   - Regenerate typescript definitions:
     ```bash
     supabase gen types typescript --local > src/types/database.ts
     ```
   - Verify that the types file compiles correctly (no type errors in the project):
     ```bash
     npm run build
     ```
