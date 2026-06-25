# Handoff Report — Milestone 2

This report provides the findings and SQL migration strategy for Phase 4 Milestone 2, ready for implementation by the designated backend implementer.

## 1. Observation
We observed the following state across the project repository:
*   **Placeholder documents table**: In `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/supabase/migrations/0001_architecture_hardening.sql` (lines 12-17):
    ```sql
    CREATE TABLE documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
      type TEXT,
      status TEXT
    );
    ```
*   **Audit columns and RLS on documents**: In `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/supabase/migrations/0002_phase3c_remediation.sql` (lines 64-68 and 105-107):
    ```sql
    CREATE POLICY "Reviewers select documents" ON documents FOR SELECT TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));
    CREATE POLICY "Reviewers insert documents" ON documents FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
    CREATE POLICY "Reviewers update documents" ON documents FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer')) WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
    CREATE POLICY "Reviewers delete documents" ON documents FOR DELETE TO authenticated USING (get_user_role() = 'Admin');
    ```
    ```sql
    ALTER TABLE documents 
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ```
*   **Project Contract**: In `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/PROJECT.md` (lines 30-67), the `documents` table requires:
    - Columns: `id`, `case_id`, `type`, `file_path`, `file_name`, `file_size`, `mime_type`, `status`, `created_at`, `updated_at`.
    - RPC `upload_document_record` (returns `UUID`) and RPC `delete_document` (returns `VOID`).
    - Both RPCs must verify roles via `get_user_role()` and be `SECURITY DEFINER SET search_path = public`.
    - Files uploaded to the private bucket `documents` at `cases/{case_id}/{document_id}`.

---

## 2. Logic Chain
1. **Schema Upgrade**: The placeholder `documents` table created in Migration `0001` and modified in Migration `0002` lacks key file metadata columns: `file_path`, `file_name`, `file_size`, and `mime_type`. In addition, `type` and `case_id` are currently nullable.
2. **Recreation Choice**: Since no user documents are currently stored in development, dropping the placeholder `documents` table and recreating it with all required columns and constraints (including a `CHECK` constraint for the document types: `PSABirth`, `PSAMarriage`, `TOR`, `SF10`, `Diploma`) is the cleanest and most robust method.
3. **Atomic Deletes**: To ensure database-storage consistency (avoiding orphan storage files or database records), the storage bucket `documents` must NOT have a direct client DELETE policy. Instead, deletions must run through the `delete_document` RPC. Since the RPC runs as `SECURITY DEFINER` (superuser privileges), it will bypass RLS to clean up `storage.objects` and `public.documents` inside a single transaction.
4. **Ownership Verification**: Since `PROJECT.md` specifies that Reviewers can only delete "their uploads", the `delete_document` RPC must verify uploader ownership. This is achieved by retrieving the `owner` of the object from `storage.objects` and comparing it to `auth.uid()`.

---

## 3. Caveats
*   **Supabase Schema Dependency**: Option A relies on querying the `owner` column in the `storage.objects` table. If Supabase changes this internal schema (unlikely), it could affect the policy or RPC. If this is a concern, Option B (adding an `uploaded_by` column directly to `public.documents`) can be used as an alternative (commented in `analysis.md`).

---

## 4. Conclusion
We have formulated a complete, secure, and drop-in SQL migration strategy that addresses all database and storage requirements of Milestone 2. The strategy ensures strict security validation (role-aware checks using `get_user_role()`), protects data integrity, and manages files atomically.

---

## 5. Verification Method
The SQL script can be verified by executing it in the Supabase database.
1. **Database Migration test**: Run the migration script and ensure the table `public.documents` is successfully dropped and recreated with the correct constraints and columns.
2. **Storage configuration verify**: Confirm that the `'documents'` bucket appears in the `storage.buckets` list and is marked as non-public.
3. **Access Control (RLS) check**:
   - Verify that non-authenticated or unauthorized users are unable to read or write to both the `public.documents` table and the `documents` storage bucket.
   - Verify that Admins and Reviewers have full read/write access.
4. **RPC Functionality check**:
   - Test `upload_document_record` with mock data and verify that a new document metadata row and activity log row are successfully created.
   - Test `delete_document` as a Reviewer on a document they did not upload, and verify it throws an "Unauthorized" exception.
   - Test `delete_document` as a Reviewer on a document they did upload, and verify it deletes both the database row and `storage.objects` entry.
