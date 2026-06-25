# Original User Request

## Initial Request — 2026-06-22T09:46:35Z

Implement **Phase 4 — Document Uploads and Management** for Veldra, a Smart Document Verification Platform for student visa application documents. The team is split: **Claude handles all backend work** (database, Supabase Storage, RPCs, RLS, server actions), and **Gemini handles all frontend UI and documentation updates**. Neither agent may touch the other's domain.

Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra

Integrity mode: development

## Required Reading (MUST read before writing any code)
Both agents MUST read the following files in this exact order before writing any code:
1. `AGENTS.md` — roles, prohibited behaviors, current system state
2. `GEMINI.md` — project summary, current phase, architecture constraints
3. `docs/PRODUCT_VISION.md`
4. `docs/INFORMATION_ARCHITECTURE.md`
5. `docs/DATA_MODELS.md`
6. `docs/DESIGN_SYSTEM.md`
7. `docs/COMPONENT_RULES.md`
8. `docs/DEVELOPMENT_RULES.md`

---

## Requirements

### R1. Backend — Supabase Storage Configuration (Claude)
Configure a Supabase Storage bucket for document uploads. The bucket must have secure RLS policies so that only authenticated, role-authorized users can upload or retrieve files. File type is unrestricted but must be validated server-side. The bucket name and structure must follow the case-centric architecture: files are stored under `cases/{case_id}/{document_id}`.

### R2. Backend — Documents Table & RPC (Claude)
The existing `documents` table placeholder must be fully implemented with columns for: `case_id`, `document_type` (label), `file_path` (storage path), `file_name`, `file_size`, `mime_type`, `uploaded_at`, and `status`. An RPC `upload_document_record` must be created using `SECURITY DEFINER SET search_path = public` to insert the document record after a successful storage upload. A `delete_document` RPC must also be created to remove both the storage object and the database record atomically. All RPCs must derive `user_id` and `role` from `auth.uid()` — never from the client.

### R3. Backend — Server Actions & Zod Validation (Claude)
Create server actions for: `uploadDocument(formData)`, `deleteDocument(documentId)`, and `getDocumentsByCase(caseId)`. All server actions must validate input with Zod before calling any Supabase function. No `as any`, `@ts-ignore`, or `@ts-expect-error` are permitted. The `src/types/database.ts` must be updated to reflect the new documents table columns and the new RPCs.

### R4. Frontend — Upload UI (Gemini)
Build a document upload component (`DocumentUpload`) inside `src/features/documents/components/`. It must: accept file drag-and-drop and click-to-browse input, display upload progress, show success/error states, and call the `uploadDocument` server action. The component must use existing Design System tokens only — no arbitrary Tailwind values (e.g., no `w-[300px]`).

### R5. Frontend — Document List & Management UI (Gemini)
Build a `DocumentList` component displaying all documents for the currently open case. Each document row must show: document type label, file name, upload date, file size, and a delete button. Clicking delete must call the `deleteDocument` server action and optimistically remove the row. Integrate this into the existing Case Detail page (`src/app/(dashboard)/cases/[id]/page.tsx`) using the existing AppShell and layout.

### R6. Documentation Update (Gemini)
After UI implementation is complete, Gemini must update:
- `GEMINI.md` — mark Phase 4 as complete, set Phase 5 as next
- `AGENTS.md` — update current system state to reflect Phase 4 completion
- `docs/DATA_MODELS.md` — document the fully implemented `documents` table schema

---

## Acceptance Criteria

### Build & Type Safety
- [ ] `npm run build` completes with zero TypeScript errors
- [ ] `npm run lint` completes with zero ESLint warnings or errors
- [ ] Zero occurrences of `as any`, `@ts-ignore`, `@ts-expect-error` in any new file

### Backend Integrity
- [ ] All new RPCs use `SECURITY DEFINER SET search_path = public`
- [ ] No `user_id` or `role` accepted as RPC parameters from the client
- [ ] RLS is enabled on the `documents` table with role-aware policies
- [ ] A new migration file exists in `supabase/migrations/` for all schema changes

### Frontend Compliance
- [ ] No arbitrary Tailwind values (`w-[...]`, `h-[...]`, `text-[...]`, etc.) in any new component
- [ ] All new components are documented in `docs/COMPONENT_RULES.md` before use
- [ ] Document upload and delete flows work end-to-end in the Case Detail page

### Documentation
- [ ] `GEMINI.md` reflects Phase 4 as complete
- [ ] `docs/DATA_MODELS.md` has the fully implemented `documents` table schema

## Follow-up — 2026-06-22T18:26:39+08:00

Implement the Phase 5 Frontend UI components for the Veldra Smart Document Verification Platform. The backend schema and server actions (`analyzeDocuments`, `updateFindingStatus`) are already implemented.

Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra
Integrity mode: development

## Requirements

### R1. FindingCard Component
Implement a `FindingCard` React component in `src/features/findings/components/` that displays the properties of a Finding (title, description, severity, category, status). It must allow reviewers to update the finding's status using the existing `updateFindingStatus` server action.

### R2. DocumentComparisonPanel Component
Implement a `DocumentComparisonPanel` component that displays two selected source documents side-by-side for comparison when a finding is selected. The comparison panel must use a **split-screen layout** (side-by-side with the findings list) inside the Case Detail view.

### R3. Integration
Integrate the "Run Analysis" trigger (calling `analyzeDocuments`) into the Case Detail view. When the case is in the `NeedsReview` state, render the `FindingCard` list on one side and the `DocumentComparisonPanel` on the other side.

## Acceptance Criteria

### UI Implementation
- [ ] The `FindingCard` component exists and successfully calls `updateFindingStatus` when a status is changed.
- [ ] The `DocumentComparisonPanel` exists and visually displays two documents.
- [ ] `npm run build` and `npm run lint` complete with zero errors or warnings.
- [ ] Zero occurrences of `as any`, `@ts-ignore`, `@ts-expect-error` in any new file.
- [ ] Component styling adheres strictly to existing Tailwind utility classes and Design System tokens.

## Follow-up — 2026-06-22T19:17:26+08:00

Implement Phase 6 (Legal Draft Generation) for the Veldra Smart Document Verification Platform. This phase involves generating legal drafts (Affidavits, Explanation Letters) based on the Findings identified in Phase 5.

**CRITICAL ROLE SPLIT — STRICT ENFORCEMENT:**
- **Claude (Opus/Sonnet) — Architect & Backend Developer:** All database schema migrations, PostgreSQL RPCs, RLS policies, server actions, and `database.ts` type updates. Must read required documentation before writing any code.
- **Gemini — UI Developer & Documentarian:** All React component UI, page integration, and documentation updates (`GEMINI.md`, `AGENTS.md`, `docs/DATA_MODELS.md`). Neither agent may touch the other's domain.

Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra
Integrity mode: development

## Required Reading (ALL agents MUST read in this exact order before writing any code)
1. `AGENTS.md` — roles, prohibited behaviors, current system state
2. `GEMINI.md` — project summary, current phase, architecture constraints
3. `docs/PRODUCT_VISION.md`
4. `docs/INFORMATION_ARCHITECTURE.md`
5. `docs/DATA_MODELS.md`
6. `docs/FINDINGS_SYSTEM.md`
7. `docs/FEATURE_REQUIREMENTS.md`
8. `docs/DESIGN_SYSTEM.md`
9. `docs/COMPONENT_RULES.md`
10. `docs/DEVELOPMENT_RULES.md`

---

## Requirements

### R1. Backend — Schema & Storage (Claude ONLY)
Implement the `generated_drafts` table with columns: `id`, `case_id`, `type` (Enum: Affidavit, AddressLetter, GapLetter), `content` (HTML/Rich Text), and `status` (Enum: Draft, Finalized). Implement a many-to-many join table `draft_findings` mapping drafts to the specific `findings` that triggered them. Enforce strict RLS policies using `get_user_role()` — no permissive `true` policies. All migrations must be placed in `supabase/migrations/`. Update `src/types/database.ts` by regenerating from the live schema.

### R2. Backend — Draft Generation Engine (Claude ONLY)
Create server actions in `src/features/drafts/actions/index.ts`:
- `generateDrafts(caseId)`: Queries all 'Accepted' findings for the case. Automatically generates an "Affidavit of Discrepancy" HTML content string for High-severity Name Mismatch findings. Automatically generates an "Explanation Letter" HTML string for Medium-severity Address or School Gap findings. Saves all generated drafts to the `generated_drafts` table. Updates the case status to 'Reviewed' after generation.
- `updateDraftContent(draftId, content)`: Updates the rich text content of a draft.
- `finalizeDraft(draftId, caseId)`: Sets draft status to 'Finalized'.
- `getDraftsByCase(caseId)`: Fetches all drafts for a case with their linked finding IDs.
All server actions MUST: validate inputs with Zod, derive `user_id` and `role` from `auth.uid()` server-side only, use no `as any`, `@ts-ignore`, or `@ts-expect-error`.

### R3. Frontend — Draft Editor UI (Gemini ONLY)
Build a `DraftEditor` React component in `src/features/drafts/components/` that:
- Displays the generated draft type and the finding(s) that triggered it.
- Allows inline editing of the draft HTML content using a `<textarea>` or equivalent.
- Has a "Save" button that calls `updateDraftContent` server action.
- Has a "Finalize" button that calls `finalizeDraft` server action and visually reflects the finalized state.
Adhere strictly to existing Design System tokens — no arbitrary Tailwind values (e.g., no `w-[300px]`).

### R4. Frontend — Case Detail Integration (Gemini ONLY)
Integrate the draft workflow into `src/app/(dashboard)/cases/[id]/page.tsx`:
- When case status is `Reviewed`, display a "Generate Drafts" button that calls `generateDrafts`.
- When case status is `DraftGenerated`, display the list of generated drafts using the `DraftEditor` component.
Document all new components in `docs/COMPONENT_RULES.md` before use.

### R5. Documentation (Gemini ONLY)
After all code is implemented and the build is clean:
- Update `GEMINI.md`: Mark Phase 6 as complete, set Phase 7 (Export & Reporting) as next.
- Update `AGENTS.md`: Update current system state to reflect Phase 6 completion.
- Update `docs/DATA_MODELS.md`: Document the fully implemented `generated_drafts` and `draft_findings` table schemas.

## Acceptance Criteria

### Backend & Architecture
- [ ] `supabase/migrations/` contains the new Phase 6 migration file.
- [ ] `src/types/database.ts` is regenerated and contains `generated_drafts` and `draft_findings` tables.
- [ ] All server actions use Zod validation with zero type bypasses.
- [ ] RLS is enabled on all new tables with role-aware policies using `get_user_role()`.
- [ ] No `user_id` or `role` accepted as parameters from the client.

### UI Implementation
- [ ] `DraftEditor` component exists in `src/features/drafts/components/`.
- [ ] Inline editing and finalization work correctly.
- [ ] Case Detail page conditionally renders draft workflow based on case status.
- [ ] `npm run build` completes with zero TypeScript errors.
- [ ] `npm run lint` completes with zero ESLint warnings or errors.
- [ ] Zero occurrences of `as any`, `@ts-ignore`, `@ts-expect-error` in any new file.
- [ ] No arbitrary Tailwind values in any new component.

### Documentation
- [ ] `GEMINI.md` reflects Phase 6 as complete.
- [ ] `docs/DATA_MODELS.md` documents the new tables.
- [ ] New components are added to `docs/COMPONENT_RULES.md`.

## Follow-up — 2026-06-24T13:50:38Z

Implement Phase 8 (Dashboard & Analytics) for the Veldra verification platform while also resolving a stubborn TypeScript compiler issue with a Supabase RPC call that prevents Next.js builds.

Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra
Integrity mode: development

## Requirements

### R1. Fix Supabase RPC Next.js Type Check Bug
The project currently fails `npm run build` due to a strict TypeScript inference issue with `supabase.rpc('create_case_with_applicant')` in `src/features/cases/actions/index.ts`. The error is "is not assignable to parameter of type 'undefined'". The agent must fix this type issue strictly without using `as any`, `@ts-ignore`, `@ts-expect-error`, or `unknown as`, adhering strictly to `AGENTS.md` rules.

### R2. Implement Phase 8 Dashboard UI (Mock Data)
Build the Dashboard UI at `src/app/(dashboard)/page.tsx` containing a high-level overview of active cases, recent activity, and system metrics. Utilize existing design tokens and Tailwind utility classes. For this initial pass, use **mock metrics** to validate the layout and design.

### R3. E2E Verification
Write a Playwright E2E test in the `tests/` directory to verify that the Dashboard loads and renders the mock metrics and layout correctly without errors.

## Acceptance Criteria

### Build Integrity
- [ ] Running `npm run build` completes successfully with 0 type errors.
- [ ] No strict typing bypasses (`as any`, `@ts-ignore`, etc.) are introduced to fix the RPC error.

### Dashboard Verification
- [ ] A new Playwright E2E test exists for the Dashboard.
- [ ] Running the Playwright test suite passes and verifies the dashboard renders the mock data correctly.
