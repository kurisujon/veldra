# Project: Veldra

## Project Summary
Veldra is a Smart Document Verification Platform tailored for checking student visa application documents. It automates the extraction and cross-referencing of critical data across documents like PSA Birth Certificates, Transcripts, and Diplomas, flagging inconsistencies and generating necessary legal drafts. The product is a review workspace for document verification staff, strictly a tool, NOT a chatbot.

## Current Phase
**Polish & QA (Phase 11 Completed)**
- Performance & code review complete; removed type bypasses across codebase.
- Playwright E2E suite generated (`e2e/` specs for auth, smoke, cases, docs, analysis, authorization, visual audit).
- Phase 10 Three-Stage Verification Engine fully operational with 3-tab `CaseFindingsWorkspace`.
- Phase 8 Analytics & Phase 7.5 Sponsor verification systems integrated.
- Phase 11.5 Evidence-Grounded AI Extraction Upgrade completed. Pipeline rebuilt with decoupled OCR, Zod-grounded extraction, cross-reference validation, fallback API key rotation, multi-signal confidence scoring, and model escalation. `ExtractionWorkspace` now strictly surfaces OCR source evidence.

**Current Phase:** Production Maintenance & Operational Readiness

## Workspace Skills & Commands
- **`demo-video-recorder`** (`/demo-video-recorder`): Generates a captioned Playwright demo video of one UI flow at a time. Call using `/demo-video-recorder`, `"record a demo for <flow>"`, `"make a walkthrough video"`, or `Use the demo-video-recorder skill`.
- **`project-progress-docs`** (`/project-progress-docs`): Reports progress and synchronizes project docs. Call using `/project-progress-docs`, `"update project status"`, or `Use the project-progress-docs skill`.

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

- **Phase 11.6-C Complete:** Canonical Evidence Map abstraction established. Observed Evidence -> Canonical Evidence Map -> future Candidate Extraction. AI has NO authority over the observed evidence layer.

- **Phase 11.6-D Complete:** Candidate Extraction. Refactored Gemini into a Layer 2 interpreter that only returns `evidenceSpanIds` and explicit states (candidate, not_present, etc). The AI can no longer fabricate evidence text or geometry.
- **Phase 11.6-E (Pre-F Gate) Complete:** Layer 3 Trust Boundary locked. The Comparison Engine strictly filters document fields and only consumes 'verified' state fields. AI candidates, legacy data, and unverified extractions are mathematically excluded via defensive application-level filters.
- **Phase 11.6-F Complete:** Document Profile Registry. Replaced generic schemas with strong typings (PSA Birth Certificate, Sponsor Valid ID, Affidavit of Support). Added Zod validation, normalization boundaries, explicit states, risk metrics, and integration with candidate extraction.
- **Phase 11.6-G Complete:** Field Reliability & Dual Extraction implemented. Evaluates deterministic FieldReliability on a per-field basis (escalating high-risk or low-confidence to Gemini 2.5 Pro). Pro extraction strictly inherits EvidenceMap authority and conflicts are handled deterministically.
- **Phase 11.6-H Complete:** Human Verification Workspace. Implemented strict RPC boundary for state transitions (candidate -> verified) using SECURITY DEFINER. Revoked arbitrary UPDATE on document_fields to enforce Layer 3 trust boundary. Upgraded ExtractionWorkspace UI to render FieldReliability and canonical states.
