# Handoff Report — Milestone 2 of Phase 4

## 1. Observation

- **Placeholder `documents` Table**:
  Defined in `supabase/migrations/0001_architecture_hardening.sql` (lines 12–17) as:
  ```sql
  CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    type TEXT,
    status TEXT
  );
  ```
  Modified in `supabase/migrations/0002_phase3c_remediation.sql` (lines 105–107) to add audit columns:
  ```sql
  ALTER TABLE documents 
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  ```
  Enabled RLS and set policies in `0002_phase3c_remediation.sql` (lines 65–68), including restricting deletion to `'Admin'`:
  ```sql
  CREATE POLICY "Reviewers delete documents" ON documents FOR DELETE TO authenticated USING (get_user_role() = 'Admin');
  ```
  An index on `case_id` was created in `0002_phase3c_remediation.sql` (line 97):
  ```sql
  CREATE INDEX idx_documents_case_id ON documents(case_id);
  ```

- **Roles Table and Constraints**:
  Defined in `0001_architecture_hardening.sql` (lines 2–5):
  ```sql
  CREATE TABLE user_roles (
    user_id UUID PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Reviewer'))
  );
  ```
  The helper function `get_user_role()` in `0002_phase3c_remediation.sql` (lines 2–4):
  ```sql
  CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
    SELECT role FROM user_roles WHERE user_id = auth.uid();
  $$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
  ```

- **Required Database Schema (from `PROJECT.md`)**:
  Columns for `documents`:
  - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
  - `case_id` UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE
  - `type` TEXT NOT NULL
  - `file_path` TEXT NOT NULL UNIQUE
  - `file_name` TEXT NOT NULL
  - `file_size` INTEGER NOT NULL
  - `mime_type` TEXT NOT NULL
  - `status` TEXT NOT NULL DEFAULT 'uploaded'
  - `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
  - `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

- **Required RPC Interfaces**:
  - `upload_document_record(p_case_id UUID, p_type TEXT, p_file_path TEXT, p_file_name TEXT, p_file_size INTEGER, p_mime_type TEXT) RETURNS UUID`
  - `delete_document(p_document_id UUID) RETURNS VOID`
  - Both must run as `SECURITY DEFINER SET search_path = public` and verify user roles.

---

## 2. Logic Chain

1. **Placeholder Drop Necessity**:
   Because a placeholder `documents` table already exists with dependent RLS policies and indexes, we cannot simply use `CREATE TABLE documents`. To cleanly implement all new required columns (e.g. `file_path UNIQUE`, `file_size`, `mime_type`) and make `case_id` and `type` `NOT NULL`, we must execute `DROP TABLE IF EXISTS public.documents CASCADE;` which safely clears policies and indexes.

2. **Supabase Storage Configuration**:
   Applicant files are uploaded to a private bucket named `'documents'`. We must initialize this bucket by inserting into the `storage.buckets` table with `public = false`. To secure the bucket, we define RLS policies on the `storage.objects` table.

3. **Schema Qualification in Storage Policies**:
   Because the `storage.objects` table resides in the `storage` schema, search paths for storage policies do not default to `public`. Any call to `get_user_role()` within storage RLS must be schema-qualified as `public.get_user_role()` to avoid runtime lookup failures.

4. **Omitting storage.objects DELETE policy for Reviewers**:
   By omitting a direct DELETE policy for authenticated reviewers on the `storage.objects` table, we prevent direct storage API deletions from the client. This forces file deletions to go through the `delete_document` RPC, which deletes both the storage object record and the database metadata record inside a single atomic transaction.

5. **Uploader Ownership Verification**:
   `PROJECT.md` specifies that Reviewers can only delete "their own uploads". However, the target schema in `PROJECT.md` does not contain a uploader/user field.
   - **Option A (Storage Metadata)**: Resolve uploader identity by querying `owner` in `storage.objects` using the file's path. This maintains strict database schema alignment with `PROJECT.md`.
   - **Option B (Database Audit Column)**: Add an `uploaded_by UUID NOT NULL REFERENCES auth.users(id)` column to the `documents` table. This decouples database verification from the `storage` schema.
   We recommend Option B for safety and performance, but formulate full strategies for both.

---

## 3. Caveats

- **Option A Deletion Dependency**:
  If Option A is selected, the server action *must* execute the `delete_document` RPC *before* performing any client-side storage deletions. If the storage file is deleted first, `storage.objects` will no longer contain the owner ID, causing ownership checks to return NULL and potentially failing the database record deletion.
- **Storage Schema Policy Alteration**:
  Applying RLS policies to `storage.objects` requires the migrating user role (such as the default `postgres` role used by migrations) to have permissions to alter policies on the `storage` schema.

---

## 4. Conclusion

We have formulated a complete database and storage SQL strategy for Phase 4 Milestone 2.
- Dropping the placeholder table using `CASCADE` and recreating the `documents` table.
- Initializing the private `documents` bucket in `storage.buckets`.
- Implementing `upload_document_record` and `delete_document` as `SECURITY DEFINER` RPCs with `search_path = public`.
- Defining storage policies with `public.get_user_role()`.
- Proposing Option A (storage lookup) and Option B (adding `uploaded_by`) to handle uploader tracking.

The complete SQL scripts and detailed strategies are saved in `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_explorer_m2_1/analysis.md`.

---

## 5. Verification Method

1. **Local Migration Run**:
   Apply the migration file to a local database using Supabase CLI:
   ```bash
   supabase db reset
   ```
   Check for syntax or compile errors.

2. **Column Constraint Verification**:
   Run an insert script simulating a violation of the document type `CHECK` constraint:
   ```sql
   INSERT INTO public.documents (case_id, type, file_path, file_name, file_size, mime_type)
   VALUES ('some-case-uuid', 'InvalidDocumentType', 'cases/123/doc1', 'file.pdf', 1024, 'application/pdf');
   -- Expected outcome: CHECK constraint violation error.
   ```

3. **Reviewer Delete Constraint Verification (Option A / Option B)**:
   Simulate a Reviewer attempting to delete a file uploaded by another user:
   ```sql
   -- Set simulated auth session context
   SELECT set_config('request.jwt.claims', '{"sub": "reviewer-a-uuid", "role": "authenticated"}', true);
   -- Call delete_document on a document uploaded by reviewer-b-uuid
   SELECT delete_document('document-b-uuid');
   -- Expected outcome: Exception 'Unauthorized: You can only delete your own uploads' is raised.
   ```

4. **Type Checking and Builds**:
   Regenerate typescript definitions and run build checks:
   ```bash
   supabase gen types typescript --local > src/types/database.ts
   npm run build
   ```
   Ensure compilation finishes successfully with no warnings.
