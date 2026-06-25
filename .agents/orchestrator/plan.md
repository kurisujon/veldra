# Plan — Phase 6 (Legal Draft Generation)

Phase 6 implements the Legal Draft Generation engine and workspace for Veldra, enabling reviewers to automatically generate legal drafts (Affidavits of Discrepancy, Explanation Letters) based on accepted findings, edit them inline, and finalize them.

## Topology & Roles
- **Orchestrator**: Coordinates tasks, checks progress, runs verification via workers, and synthesizes results.
- **Claude (Opus/Sonnet) - Backend Specialist**:
  - Implement Supabase migrations (tables `generated_drafts`, `draft_findings`, and alter `case_status` enum to include `'DraftGenerated'`).
  - Implement server actions in `src/features/drafts/actions/index.ts` with Zod validation.
  - Regenerate database TypeScript definitions using the live database.
- **Gemini - UI & Documentation Specialist**:
  - Implement E2E Playwright tests (`tests/drafts.e2e.spec.ts`) before code implementation (Dual Track).
  - Implement `DraftEditor` React component in `src/features/drafts/components/DraftEditor.tsx`.
  - Integrate Drafts workflow into Case Detail Page (`src/app/(dashboard)/cases/[id]/page.tsx`).
  - Update project documentation (`GEMINI.md`, `AGENTS.md`, `docs/DATA_MODELS.md`, `docs/COMPONENT_RULES.md`).

## Milestones

### M1. Test Track - Playwright E2E Test Suite Setup (Tiers 1-4)
- **Objective**: Design and write E2E Playwright tests to verify the draft generation, editing, and finalization workflows.
- **Deliverables**: `tests/drafts.e2e.spec.ts` containing Tiers 1-4 tests (happy path, boundary conditions, cross-feature transitions, and real-world scenario).
- **Assigned to**: Gemini (UI & Testing Worker)

### M2. Backend - Database Schema Migrations & Types (Claude)
- **Objective**: Implement database changes for generated drafts and draft-findings relationships.
- **Deliverables**:
  - Migration file in `supabase/migrations/` adding `generated_drafts`, `draft_findings`, and altering `case_status` to add `'DraftGenerated'`.
  - Regenerated `src/types/database.ts`.
- **Assigned to**: Claude (Backend Worker)

### M3. Backend - Server Actions Implementation (Claude)
- **Objective**: Implement server actions for generating, updating, finalizing, and fetching drafts.
- **Deliverables**: `src/features/drafts/actions/index.ts` containing:
  - `generateDrafts(caseId)`
  - `updateDraftContent(draftId, content)`
  - `finalizeDraft(draftId, caseId)`
  - `getDraftsByCase(caseId)`
- **Assigned to**: Claude (Backend Worker)

### M4. Frontend - UI Components & Integration (Gemini)
- **Objective**: Build the `DraftEditor` component and integrate it into the Case Detail page.
- **Deliverables**:
  - `src/features/drafts/components/DraftEditor.tsx`
  - Integration in `src/app/(dashboard)/cases/[id]/page.tsx`
- **Assigned to**: Gemini (UI & Testing Worker)

### M5. Verification & Testing
- **Objective**: Run builds, lints, and E2E tests to ensure everything is verified and compliant.
- **Deliverables**: Clean build/lint reports and all passing tests.
- **Assigned to**: Gemini (UI & Testing Worker) / Challenger / Reviewer

### M6. Documentation Update (Gemini)
- **Objective**: Update project docs.
- **Deliverables**: Updates to `GEMINI.md`, `AGENTS.md`, `docs/DATA_MODELS.md`, and `docs/COMPONENT_RULES.md`.
- **Assigned to**: Gemini (UI & Testing Worker)

## Interface Contracts

### Database Schema
#### Table: `generated_drafts`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `case_id` UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE
- `type` TEXT NOT NULL (Enum values: 'Affidavit', 'AddressLetter', 'GapLetter')
- `content` TEXT NOT NULL (HTML/Rich text string)
- `status` TEXT NOT NULL DEFAULT 'Draft' (Enum values: 'Draft', 'Finalized')
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

#### Table: `draft_findings`
- `draft_id` UUID REFERENCES generated_drafts(id) ON DELETE CASCADE
- `finding_id` UUID REFERENCES findings(id) ON DELETE CASCADE
- PRIMARY KEY (draft_id, finding_id)

### Server Actions
- `generateDrafts(caseId: string): Promise<{ success: boolean }>`
- `updateDraftContent(draftId: string, content: string): Promise<{ success: boolean }>`
- `finalizeDraft(draftId: string, caseId: string): Promise<{ success: boolean }>`
- `getDraftsByCase(caseId: string): Promise<any[]>`
