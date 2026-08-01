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
- `SponsorList` component integrated into Case Dashboard page.
- `runVerificationEngine` wired into `analyzeDocuments` findings action.
- `finding_scope` auto-calculated and persisted on analysis.
- Graceful fallback for `getSponsorsByCase` if migration not yet applied.

## Phase 8: Dashboard & Analytics ✅
- `get_dashboard_analytics` RPC with optional date filtering (`p_start_date`, `p_end_date`).
- `findings_by_scope` added to analytics response (applicant_only / sponsor_only / applicant_and_sponsor).
- `AnalyticsSummary` metric cards (Total Findings, Critical, Resolved Rate, Avg Time).
- `DiscrepancyBreakdown` (by category + top conflicting source pairs).
- `CaseAnalyticsBreakdown` (case status distribution + findings by origin scope).
- Sponsor-aware metrics fully integrated.

## Phase 10: Advanced Three-Stage Verification Engine ✅
- Segregation of rules into Applicant, Sponsor, and Relationship stages.
- New database tables: `comparison_results`, `sponsor_relationships`, `relationship_evidence`.
- Added strict verification of relationship claims via parent/grandparent linkage.
- `CaseFindingsWorkspace` UI overhaul with 3-tab layout and exact rule verification persistence.

## Phase 11: Polish & QA
- Performance audits, end-to-end testing, and final refinement.
