# Handoff Report — Phase 4 Milestone 2

This handoff report is prepared by Backend Explorer 2 for the parent agent (Orchestrator) and the downstream implementation agent.

---

## 1. Observation

During our read-only investigation, the following files and definitions were examined:

1. **Existing Placeholders in Migrations**:
   - `supabase/migrations/0001_architecture_hardening.sql` (lines 12–17) defined the placeholder:
     ```sql
     CREATE TABLE documents (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
       type TEXT,
       status TEXT
     );
     ```
   - `supabase/migrations/0002_phase3c_remediation.sql` (line 38) enabled Row Level Security:
     ```sql
     ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
     ```
   - `0002_phase3c_remediation.sql` (lines 65–68) defined placeholder RLS policies:
     ```sql
     CREATE POLICY "Reviewers select documents" ON documents FOR SELECT TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer'));
     CREATE POLICY "Reviewers insert documents" ON documents FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
     CREATE POLICY "Reviewers update documents" ON documents FOR UPDATE TO authenticated USING (get_user_role() IN ('Admin', 'Reviewer')) WITH CHECK (get_user_role() IN ('Admin', 'Reviewer'));
     CREATE POLICY "Reviewers delete documents" ON documents FOR DELETE TO authenticated USING (get_user_role() = 'Admin');
     ```
   - `0002_phase3c_remediation.sql` (lines 105–107) added default audit columns:
     ```sql
     ALTER TABLE documents 
     ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
     ```
   - `0002_phase3c_remediation.sql` (line 97) created case_id index:
     ```sql
     CREATE INDEX idx_documents_case_id ON documents(case_id);
     ```

2. **Project Specification Requirements**:
   - `PROJECT.md` (lines 31–41) specifies the exact schema for the reconstructed `documents` table:
     - `id` UUID PRIMARY KEY
     - `case_id` UUID NOT NULL REFERENCES cases(id)
     - `type` TEXT NOT NULL (Enum labels: PSABirth, PSAMarriage, TOR, SF10, Diploma)
     - `file_path` TEXT NOT NULL UNIQUE
     - `file_name` TEXT NOT NULL
     - `file_size` INTEGER NOT NULL
     - `mime_type` TEXT NOT NULL
     - `status` TEXT NOT NULL DEFAULT 'uploaded'
     - `created_at` TIMESTAMPTZ, `updated_at` TIMESTAMPTZ
   - `PROJECT.md` (lines 44–54) defines the `upload_document_record` RPC function:
     - Arguments: `p_case_id` UUID, `p_type` TEXT, `p_file_path` TEXT, `p_file_name` TEXT, `p_file_size` INTEGER, `p_mime_type` TEXT.
     - Security: `SECURITY DEFINER SET search_path = public`.
     - Returns: UUID.
   - `PROJECT.md` (lines 56–62) defines the `delete_document` RPC function:
     - Arguments: `p_document_id` UUID.
     - Security: `SECURITY DEFINER SET search_path = public`.
     - Returns: VOID.
     - Role Verification: `Admin` can delete all, `Reviewer` can only delete their uploads.

3. **Current TypeScript Types**:
   - `src/types/database.ts` (lines 109–143) contains the type definition for `documents`, matching the placeholder database schema.

---

## 2. Logic Chain

1. **Clean Table Re-creation**:
   - Directly modifying columns of the placeholder table via multiple `ALTER TABLE` statements is verbose and error-prone. Recreating it using `DROP TABLE IF EXISTS documents CASCADE;` ensures a clean state, dropping the placeholder columns, indexes, and outdated RLS policies at once.
   - Re-creating the table with a check constraint `CHECK (type IN ('PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma'))` ensures type safety and complies with constraints of the platform.
   - We must explicitly recreate `idx_documents_case_id` on the new table.

2. **Verification of User Ownership during Deletion**:
   - Since the `PROJECT.md` schema for `documents` does not have a user identifier column, there is no direct way to know which user uploaded the document.
   - **Option A (Strict schema adherence)**: Query the `storage.objects` table. Storage records the uploader's user ID in the `owner` column of `storage.objects`. We lookup this owner using `SELECT owner FROM storage.objects WHERE name = file_path`.
   - **Option B (Recommended security enhancement)**: Add `uploaded_by UUID NOT NULL REFERENCES auth.users(id)` column to the `documents` table. This decouples the database deletion from the storage deletion sequence and provides a self-contained audit trail on the entity.
   - Both SQL strategies are designed and presented in the `analysis.md` report. Option B is recommended for long-term project stability.

3. **Storage Policies**:
   - In Supabase, policies for storage are defined on `storage.objects`. Because the storage schema executes policies under its own context, `get_user_role()` must be qualified as `public.get_user_role()`.
   - Deletion of storage objects is guarded with: `public.get_user_role() = 'Admin' OR (public.get_user_role() = 'Reviewer' AND auth.uid() = owner)`.

4. **Security & Search Path Compliance**:
   - Both RPC functions are defined as `SECURITY DEFINER` and `SET search_path = public`. This prevents search path hijacking attacks, as required by Supabase security guidelines.

---

## 3. Caveats

1. **Delete Call Ordering in Option A**:
   - If Option A (storage lookup) is used, the `delete_document` RPC must be called before deleting the file from storage. Otherwise, the storage record will be gone, ownership verification will fail, and a Reviewer will be blocked from deleting the database record. Option B avoids this issue completely.
2. **Migration Application**:
   - Applying migrations modifies global database state. The implementation agent must run `supabase db reset` locally to test it.

---

## 4. Conclusion

We have formulated a complete database and storage strategy, saving both the strict schema adherence SQL code (Option A) and the recommended enhanced SQL code (Option B) in `analysis.md`. The implementation agent can apply this strategy directly.

---

## 5. Verification Method

To verify the migration and SQL implementation:
1. Save the SQL script from `analysis.md` in `supabase/migrations/<timestamp>_phase4_documents.sql`.
2. Run `supabase db reset` to apply the migration.
3. Validate that types can be compiled:
   ```bash
   supabase gen types typescript --local > src/types/database.ts
   npm run build
   ```
4. Run manual or E2E tests (from Milestone 1 test track) to ensure case uploads and deletions work under Admin and Reviewer roles.
