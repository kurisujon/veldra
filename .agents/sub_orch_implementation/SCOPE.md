# Scope: Implementation Track

## Architecture
Veldra Phase 4 Document Uploads and Management implementation. Split-team: Claude handles all backend, Gemini handles all frontend.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M2: Backend Schema & Storage | Configure Supabase Storage bucket, create database migrations with RLS policies, and define RPCs `upload_document_record` and `delete_document` (Claude) | None | DONE |
| 2 | M3: Backend Server Actions | Implement server actions `uploadDocument`, `deleteDocument`, `getDocumentsByCase` with Zod validations and update TS database types (Claude) | M2 | PLANNED |
| 3 | M4: Frontend Upload UI | Implement `DocumentUpload` component using Design System tokens (Gemini) | M3 | PLANNED |
| 4 | M5: Frontend List & Page Integration | Implement `DocumentList` with optimistic delete, and integrate into Case Detail view page (Gemini) | M4 | PLANNED |
| 5 | M6: Documentation & Verifications | Update GEMINI.md, AGENTS.md, docs/DATA_MODELS.md, and run linting/build checks (Gemini) | M5 | PLANNED |

## Interface Contracts
- See global PROJECT.md for server action signatures, DB table columns, and RPC signatures.
