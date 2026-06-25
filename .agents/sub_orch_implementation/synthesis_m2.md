# Milestone 2 Synthesis: Database Schema & Storage Strategy

## Consensus
- **Table Re-creation**: The existing placeholder `documents` table needs to be dropped and recreated to incorporate the required Phase 4 columns: `file_path` (UNIQUE), `file_name`, `file_size`, and `mime_type`, along with making `type` and `case_id` `NOT NULL`.
- **Storage Bucket**: A private Supabase Storage bucket named `documents` must be created.
- **Access Policies**: Storage policies should allow authenticated 'Admin' and 'Reviewer' users to read and insert files.
- **RPC Security**: Both `upload_document_record` and `delete_document` must be defined as `SECURITY DEFINER` with `SET search_path = public` to prevent search path hijacking.
- **Activity Logging**: Each document upload or delete must log a corresponding record (`DOCUMENT_UPLOADED`, `DOCUMENT_DELETED`) in the `activity_logs` table.

## Resolved Conflicts
- **Ownership Verification (Option A vs Option B)**:
  - *Option A (Dynamic Lookup)*: Check `storage.objects.owner` inside the `delete_document` RPC to verify if the Reviewer is the uploader. This matches the exact `documents` schema specified in `PROJECT.md` (no extra columns).
  - *Option B (Audit Column)*: Add an `uploaded_by UUID REFERENCES auth.users(id)` column directly on `public.documents`.
  - *Resolution*: Option B is technically superior as it prevents cross-schema dependencies and race conditions where the storage file is deleted before the database lookup is performed. However, both options are valid. We will instruct the Backend Implementer to implement Option B as the primary choice for safety, but allow fallback to Option A if strict database schema conformity is preferred.

## Dissenting Views
None.

## Gaps
None. All explorers agree on the necessary database columns, constraints, and function signatures.
