# BRIEFING — 2026-06-22T02:10:30Z

## Mission
Investigate Veldra's backend patterns and formulate a detailed design for Milestone 3 (Backend Server Actions & Types) for Phase 4.

## 🔒 My Identity
- Archetype: Backend Explorer 3
- Roles: Backend Explorer, Architect
- Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_explorer_m3_3/
- Original parent: 8668de1e-b542-4cdc-bfce-1fdb861ab4e0
- Milestone: Milestone 3 (Backend Server Actions & Types)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- CODE_ONLY network mode: no external HTTP/client calls
- Follow project agent rules (strict TS, no arbitrary Tailwinds, no client-side trust, etc.)
- Do NOT write or execute any code files outside the agent directory

## Current Parent
- Conversation ID: 8668de1e-b542-4cdc-bfce-1fdb861ab4e0
- Updated: 2026-06-22T02:10:30Z

## Investigation State
- **Explored paths**:
  - `src/features/cases/actions/index.ts` (Existing server actions pattern)
  - `src/lib/supabase/*` (Supabase SSR client setup)
  - `supabase/migrations/20260622000000_phase4_documents.sql` (Phase 4 documents database schema, RPC functions, and RLS)
  - `src/types/database.ts` (TypeScript types for the database)
- **Key findings**:
  - The documents table strictly checks document types via standard constraints: `'PSABirth' | 'PSAMarriage' | 'TOR' | 'SF10' | 'Diploma'`.
  - RPC function `upload_document_record` does not accept a custom document ID, but it returns the generated UUID.
  - Generated files should be stored under `cases/{case_id}/{document_id}`.
- **Unexplored areas**:
  - Frontend components upload progress and UI layout matching (Milestones 4 and 5 task for Gemini).

## Key Decisions Made
- Separate document types, validation, and actions into features domain: `src/features/documents/types.ts`, `src/features/documents/validation.ts`, `src/features/documents/actions.ts`.
- Client-side generate UUID for storage filepath layout mapping, then insert metadata via database RPC.
- Perform rollback storage deletion if database registration fails during upload to prevent file orphans.
- Perform database query of document details prior to deletion in `deleteDocument` to retrieve `case_id` dynamically, enabling targeted route invalidation.

## Artifact Index
- /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_explorer_m3_3/analysis.md — Detailed design for Milestone 3
