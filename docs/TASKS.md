# Tasks Tracker

## Backlog
- (None)

## In Progress
- [ ] Phase 9: Polish & QA.
  - [x] Implement `loading.tsx` Suspense boundaries and Skeleton components for dashboards.
  - [x] Implement `error.tsx` boundaries for graceful failures.
  - [x] Polish empty states for cases, findings, and sponsors.
  - [x] Toast notifications for async server actions (success/error).
  - [ ] E2E Golden Path Verification (Case Creation -> Export).
  - [x] Clean up codebase (remove console logs, fix unused imports, verify build).

## Completed
- [x] Phase 1 Documentation Foundation.
- [x] Phase 1.5 Architecture Hardening.
- [x] Phase 2 Project Setup & Foundation.
- [x] Initialize Next.js project with TypeScript and Tailwind.
- [x] Configure `tailwind.config.ts` with fixed design system tokens.
- [x] Build mandatory UI component inventory.
- [x] Build Layout Foundation (AppShell, Sidebar, TopBar).
- [x] Phase 3 Design System Implementation.
- [x] Phase 4 Core Case Management (Cases Dashboard & List Views).
- [x] Phase 5 Document Uploads & Findings System.
- [x] Phase 6 Draft Generation Workspace.
- [x] Phase 7 Export & Reporting Workspace.
- [x] Phase 7.5 Sponsor Verification & Cross-Reference System.
  - [x] `sponsors` table + `add_sponsor_to_case` SECURITY DEFINER RPC.
  - [x] `owner_type`, `sponsor_id` columns on `documents`.
  - [x] `finding_scope` column on `findings`.
  - [x] `BankStatementSchema` + `ProofOfBillingSchema` Zod schemas.
  - [x] Gemini extraction prompts for sponsor documents.
  - [x] Configurable deterministic Verification Rules Engine.
  - [x] `AddSponsorModal` UI component.
  - [x] Sponsor document types in DocumentUpload dropzone.
  - [x] `FindingCard` with Sponsor/Cross-Entity badges + Warning severity.
  - [x] Multi-Agent Orchestration Framework (`skills/`, `agents/`).
  - [x] `SponsorList` integrated into Case Dashboard.
  - [x] `runVerificationEngine` wired into `analyzeDocuments`.
  - [x] Graceful fallback for `getSponsorsByCase` if migration pending.
- [x] Phase 8: Dashboard & Analytics.
  - [x] `get_dashboard_analytics` RPC upgraded with date filtering + `findings_by_scope`.
  - [x] `AnalyticsSummary` metric cards.
  - [x] `DiscrepancyBreakdown` (by category + top conflicting source pairs).
  - [x] `CaseAnalyticsBreakdown` (case status distribution + findings by scope).
  - [x] Sponsor-aware metrics fully integrated.
- [x] Phase 10: Advanced Three-Stage Verification Engine & UI.
  - [x] Schema migration for `comparison_results`, `sponsor_relationships`, `relationship_evidence`.
  - [x] AI extraction schemas for `SponsorValidID`, `SponsorCOE`, `SponsorITR`, `AffidavitOfSupport`.
  - [x] Normalization utilities (Names, Dates, Addresses, Institutions).
  - [x] Three-Stage Orchestrator (Applicant, Sponsor, Relationship chains).
  - [x] UI Redesign of `CaseFindingsWorkspace` to 3-tab layout (Applicant, Sponsor, Relationship).
  - [x] Display of Verified Matches alongside Discrepancies.

## Decision Log
- **[2026-06-21]**: Decided to use Next.js App Router for better server-side performance.
- **[2026-06-21]**: Banned the use of the word "AI" in user-facing copy to maintain a professional, grounded tone.
- **[2026-06-21]**: Renamed project from StudFlow to Veldra for premium, brandable identity.
- **[2026-06-21]**: Transitioned to Case-centric architecture; all documents and findings belong to an Applicant Case.
- **[2026-06-21]**: Established fixed Design Tokens (Colors, Radius, Spacing). No arbitrary values allowed.
- **[2026-06-21]**: Created a strict Findings System to manage discrepancy lifecycles.
- **[2026-06-21]**: Enforced mandatory component inventory and folder structure.
- **[2026-06-21]**: Initialized Supabase SSR client foundation for Phase 2. Setup `clsx` and `tailwind-merge` for UI components.
- **[2026-07-25]**: Completed Sponsor Verification & Cross-Reference System. Sponsors are strictly limited to 2 per case, enforced at the RPC level. All sponsor discrepancies are `Warning` severity — they never auto-fail a case.
- **[2026-07-25]**: Introduced configurable deterministic Verification Rules Engine (`src/lib/comparison/engine.ts`) to replace hardcoded field comparisons. AI strictly confined to extraction only.
- **[2026-07-25]**: Scaffolded Multi-Agent Orchestration Framework with Planner, Backend Executor (Claude), Frontend Executor (Gemini), QA, and Reviewer agents.
- **[2026-08-01]**: Overhauled engine to Phase 10 Three-Stage Verification. Enforced strict graph-based evidence chains for relationships (e.g., PSA -> Parent PSA -> Sponsor ID) instead of loose surname matching, saving granular passes and fails into `comparison_results` for a comprehensive audit trail.
