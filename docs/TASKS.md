# Tasks Tracker

## Backlog
- [ ] Implement advanced analytics for case processing (Phase 8).
- [ ] Build supervisor and admin dashboards (Phase 8).

## In Progress
- [ ] Phase 8: Dashboard & Analytics.
  - [ ] Wire up existing `get_dashboard_analytics` RPC.
  - [ ] Build metric cards (Total Cases, Open Findings, Avg. Resolution Time).
  - [ ] Build charts: Case status distribution, Findings by severity/category.
  - [ ] Sponsor-aware finding breakdowns.
  - [ ] Date range filtering.

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
