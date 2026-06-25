# Project: Veldra - Phase 5 (Document Analysis and Findings Engine UI)

## Architecture
Veldra is built on Next.js 14 App Router, TypeScript, Tailwind CSS, and Supabase.
Phase 5 implements the Frontend UI for the Document Analysis and Findings Engine, allowing reviewers to trigger document analysis, view findings, compare documents side-by-side, and resolve discrepancies.

### Data Flow
1. User clicks "Run Analysis" on the Case Detail page (when case is in `Uploaded` or `NeedsReview` state).
2. The UI invokes `analyzeDocuments(caseId)` server action.
3. The server action deletes old findings, generates new mock findings, links documents via `finding_documents`, updates case status to `NeedsReview`, and calls `revalidatePath`.
4. The Case Detail page reloads. If the status is `NeedsReview`, a split-screen workspace is displayed.
5. The workspace fetches findings via `getFindingsByCase(caseId)` (a new server action to be added to `src/features/findings/actions/index.ts`) and displays them in a findings list using the `FindingCard` component.
6. Selecting a Finding in the list updates the state to show the linked documents in the `DocumentComparisonPanel`.
7. Reviewers can update a finding's status (Open, Accepted, Resolved, Ignored) using the status dropdown/controls on `FindingCard`, which invokes `updateFindingStatus` server action and triggers a page revalidate.

## Code Layout
- `src/features/findings/`
  - `components/`
    - `FindingCard.tsx` - Displays finding title, description, category, severity, status, and allows updating status.
    - `CaseFindingsWorkspace.tsx` - Layout container that coordinates the list of findings and the active document comparison panel.
  - `actions/`
    - `index.ts` - Added `getFindingsByCase(caseId)` server action. Includes existing `analyzeDocuments` and `updateFindingStatus`.
- `src/components/review/`
  - `DocumentComparisonPanel.tsx` - Displays two selected source documents side-by-side.
- `src/app/(dashboard)/cases/[id]/page.tsx` - Case Detail page integration.

## Interface Contracts

### 1. Database Schema
#### Table: `findings`
- `id` UUID PRIMARY KEY
- `case_id` UUID NOT NULL REFERENCES cases(id)
- `title` TEXT NOT NULL
- `description` TEXT NOT NULL
- `severity` ENUM ('High', 'Medium', 'Low')
- `category` ENUM ('Name Mismatch', 'Address Mismatch', 'Date Mismatch', 'Age Calculation Issue', 'School Gap', 'Missing Information')
- `status` ENUM ('Open', 'Accepted', 'Resolved', 'Ignored')

#### Table: `finding_documents`
- `finding_id` UUID REFERENCES findings(id)
- `document_id` UUID REFERENCES documents(id)

### 2. Server Actions
- `analyzeDocuments(caseId: string): Promise<{ success: boolean }>`
- `updateFindingStatus(findingId: string, caseId: string, status: 'Open' | 'Accepted' | 'Resolved' | 'Ignored'): Promise<{ success: boolean }>`
- `getFindingsByCase(caseId: string): Promise<any[]>` - New server action to fetch case findings and linked documents.

---

## Milestones

### M1. Test Track - Phase 5 E2E Test Suite (E2E Track)
- **Scope**: Write E2E Playwright tests to verify the document analysis triggers, status changes, finding updates, and split-screen comparison layout.
- **Dependencies**: None
- **Status**: PLANNED

### M2. Backend - Server Action for Findings Fetch (Claude/Gemini)
- **Scope**: Implement `getFindingsByCase(caseId)` in `src/features/findings/actions/index.ts` to retrieve findings and their linked document details.
- **Dependencies**: M1
- **Status**: PLANNED

### M3. Frontend - UI Components Implementation (Gemini)
- **Scope**: Implement `FindingCard` and `DocumentComparisonPanel` components using established design tokens. Ensure zero typescript errors.
- **Dependencies**: M2
- **Status**: PLANNED

### M4. Frontend - Case Detail Integration & Workspace (Gemini)
- **Scope**: Create `CaseFindingsWorkspace` to coordinate client-side selection state, and integrate "Run Analysis" + workspace into the Case Detail view page.
- **Dependencies**: M3
- **Status**: PLANNED

### M5. Verification & Testing (Gemini)
- **Scope**: Verify build, type safety, linting rules, and run Playwright E2E tests to ensure everything compiles and runs correctly.
- **Dependencies**: M4
- **Status**: PLANNED

### M6. Documentation Update (Gemini)
- **Scope**: Update `GEMINI.md`, `AGENTS.md`, and any relevant developer guides to reflect Phase 5 completion.
- **Dependencies**: M5
- **Status**: PLANNED
