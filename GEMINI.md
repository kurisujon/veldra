# Project: Veldra

## Project Summary
Veldra is a Smart Document Verification Platform tailored for checking student visa application documents. It automates the extraction and cross-referencing of critical data across documents like PSA Birth Certificates, Transcripts, and Diplomas, flagging inconsistencies and generating necessary legal drafts. The product is a review workspace for document verification staff, strictly a tool, NOT a chatbot.

## Current Phase
**Dashboard & Analytics (Phase 8 Completed)**
- `get_dashboard_analytics` RPC upgraded with optional date filtering and `findings_by_scope`.
- `AnalyticsSummary`, `DiscrepancyBreakdown`, and `CaseAnalyticsBreakdown` components built.
- Sponsor-aware metrics (applicant_only / sponsor_only / applicant_and_sponsor) fully integrated.
- Phase 7.5 wiring completed: `SponsorList` on Case Dashboard, `runVerificationEngine` in `analyzeDocuments`, graceful fallback for missing `sponsors` table.

**Current Phase:** Phase 9 - Polish & QA

## Architecture Constraints
- Veldra uses a strict Case-Centric Architecture.
- Design tokens (Colors, Spacing, Radius) are fixed. No arbitrary values.
- Feature-based folder structure is mandatory.
- No undocumented components may be used or created.

## Design Principles
- Minimalist, professional, and human-centered.
- Clean and comfortable for long document review sessions.
- Fixed tokens: #FAFAF8 backgrounds, #5B6EF5 accents.
- Not "AI-looking".

## Development Rules
- Strict TypeScript enforcement.
- Reusable components only; no UI duplication.
- Strict adherence to Tailwind utility classes mapped to Design System tokens.

## Agent Responsibilities
- AI Agents must adhere strictly to the prohibited behaviors in `AGENTS.md`.
- Documentation must always precede code generation or architectural modifications.

## Required Reading Order of Documentation
When onboarding or generating new features, AI agents and developers must read documentation in this order:
1. `docs/PRODUCT_VISION.md`
2. `docs/INFORMATION_ARCHITECTURE.md`
3. `docs/CASE_WORKFLOW.md`
4. `docs/DATA_MODELS.md`
5. `docs/FINDINGS_SYSTEM.md`
6. `docs/FEATURE_REQUIREMENTS.md`
7. `docs/DESIGN_SYSTEM.md`
8. `docs/COMPONENT_RULES.md`
9. `docs/FOLDER_STRUCTURE.md`
10. `docs/DEVELOPMENT_RULES.md`
11. `docs/ROADMAP.md` *(for current phase context)*
12. `docs/TASKS.md` *(for in-progress and backlog tasks)*
13. `docs/MULTI_AGENT_ORCHESTRATION.md` *(for agent roles and orchestration workflow)*
