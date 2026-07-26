# Project Roadmap

## Phase 1: Documentation Foundation ✅
- Initial Requirements Gathering.
- Architecture scaffolding.

## Phase 1.5: Architecture Hardening ✅
- Transition to Case-Centric architecture.
- Fixed design tokens enforcement.
- Definition of core Data Models and Workflow.

## Phase 2: Project Setup ✅
- Next.js environment initialization.
- Tailwind CSS token configuration.

## Phase 3: Design System Implementation ✅
- Build the Mandatory Component Inventory (`components/ui`).

## Phase 4: Core Case Management ✅
- Case Dashboard and List Views.
- Data Models integration.

## Phase 5: Findings & Cross-Document Engine ✅
- Document Uploads, Extraction & Comparison Engine logic.
- FindingCard rendering and Case Findings Workspace.

## Phase 6: Draft Generation ✅
- DraftEditor integration.
- Templating logic for Affidavits and Letters.

## Phase 7: Export & Reporting ✅
- PDF generation, bundling, and Export Workspace.

## Phase 7.5: Sponsor Verification & Cross-Reference System ✅
- `sponsors` table with max-2-per-case enforcement via `SECURITY DEFINER` RPC.
- Extended `documents` table with `owner_type` and `sponsor_id` columns.
- Extended `findings` table with `finding_scope` column.
- New Zod schemas: `BankStatementSchema`, `ProofOfBillingSchema`.
- New Gemini extraction prompts for Bank Statements and Proof of Billing.
- Configurable deterministic Verification Rules Engine (`src/lib/comparison/engine.ts`).
- `AddSponsorModal` UI component.
- Document upload dropzone extended with sponsor document types.
- `FindingCard` updated with Sponsor / Cross-Entity visual badges.
- `Warning` severity and `Identity` category added to DB enums.
- Multi-Agent Orchestration Framework scaffolded (`skills/`, `agents/`).

## Phase 8: Dashboard & Analytics 🔄 (Current)
- Overview analytics for Case processing times, resolution rates.
- Advanced administrative dashboards.
- Sponsor-aware metrics (Applicant vs Sponsor findings breakdown).

## Phase 9: Polish & QA
- Performance audits, end-to-end testing, and final refinement.
