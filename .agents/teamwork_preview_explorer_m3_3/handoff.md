# Handoff Report - Milestone 3 (Backend Server Actions & Types)

## 1. Observation
- **Migration & RPC Definitions**:
  - In `supabase/migrations/20260622000000_phase4_documents.sql`, the table check constraint restricts the document types strictly:
    ```sql
    CHECK (type IN ('PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma'))
    ```
  - The function `upload_document_record` (Lines 100-166) has the signature:
    ```sql
    CREATE OR REPLACE FUNCTION public.upload_document_record(
      p_case_id UUID,
      p_type TEXT,
      p_file_path TEXT,
      p_file_name TEXT,
      p_file_size INTEGER,
      p_mime_type TEXT
    ) RETURNS UUID
    ```
  - The function `delete_document` (Lines 174-232) has the signature:
    ```sql
    CREATE OR REPLACE FUNCTION public.delete_document(
      p_document_id UUID
    ) RETURNS VOID
    ```
- **Supabase Server Client**:
  - In `src/lib/supabase/index.ts`, the server client creator helper is exported:
    ```typescript
    export { createClient as createServerClient } from './server';
    ```
- **Validation Patterns**:
  - Existing patterns in `src/features/cases/actions/index.ts` use inline Zod validation schemas (`CreateCaseSchema` lines 23-27) and invoke `revalidatePath` after server mutation.

---

## 2. Logic Chain
- **Separation of Files**:
  - In order to comply with the feature folder layout and Milestone 3 scope, we must create `src/features/documents/types.ts`, `src/features/documents/validation.ts`, and `src/features/documents/actions.ts`.
- **Pre-Generated UUID for Storage**:
  - The `upload_document_record` RPC generates the DB ID on INSERT but does not accept the ID in the parameter list.
  - However, storage pathing must use `cases/{case_id}/{document_id}`.
  - Therefore, a UUID must be pre-generated (e.g., via `crypto.randomUUID()`) in the Server Action to create the storage file path, which is then sent to the RPC as `p_file_path`.
- **Atomicity & Cleanup**:
  - If the database registration RPC fails after storage ingestion has succeeded, the file will be orphaned.
  - Therefore, the server action code must capture this error and run `supabase.storage.from('documents').remove([filePath])` to clean up the storage artifact.
- **Dynamic Invalidation**:
  - `deleteDocument` needs `case_id` to run `revalidatePath` targeting the correct page.
  - Since the RPC does not return `case_id`, we fetch the document metadata first in the Server Action before executing the RPC deletion.

---

## 3. Caveats
- No local `SCOPE.md` exists in the repository. We reviewed global `PROJECT.md` and database migrations to construct the scope of work.
- Assumed that the client-side component (to be built by Gemini in M4/M5) will supply `FormData` with a valid browser-native `File` instance.

---

## 4. Conclusion
- The detailed design is complete and has been saved to `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_explorer_m3_3/analysis.md`. The design is fully type-safe, adheres to `strict: true` typescript rules, and does not contain any type bypasses or security risks.

---

## 5. Verification Method
- **Implementation Checks**:
  - Write files `types.ts`, `validation.ts`, and `actions.ts` under `src/features/documents/` as proposed.
  - Run type checking: `npx tsc --noEmit`.
  - Run linter: `npm run lint`.
- **Functionality Verification**:
  - Perform test uploads with non-PDF/JPEG/PNG files or files larger than 10MB to verify the Zod validations.
  - Check database and storage buckets to confirm objects are properly created under `cases/{case_id}/{document_id}`.
  - Inject an error to fail the metadata RPC during upload and verify that the file is cleanly deleted from the storage bucket.
