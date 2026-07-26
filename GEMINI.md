# Project: Veldra

## Project Summary
Veldra is a Smart Document Verification Platform tailored for checking student visa application documents. It automates the extraction and cross-referencing of critical data across documents like PSA Birth Certificates, Transcripts, and Diplomas, flagging inconsistencies and generating necessary legal drafts. The product is a review workspace for document verification staff, strictly a tool, NOT a chatbot.

## Current Phase
**Sponsor Verification & Cross-Reference System (Phase 7.5 Completed)**
- `sponsors` table implemented with max-2-per-case enforcement via `add_sponsor_to_case` SECURITY DEFINER RPC.
- `documents.owner_type` and `documents.sponsor_id` columns added — documents can now belong to Applicant or a Sponsor.
- `findings.finding_scope` column added — findings are categorized as `applicant_only`, `sponsor_only`, or `applicant_and_sponsor`.
- New Zod schemas: `BankStatementSchema`, `ProofOfBillingSchema` (in `src/lib/ai/schemas.ts`).
- New Gemini extraction prompts for Bank Statements and Proof of Billing (in `src/lib/ai/prompts.ts`).
- Configurable deterministic Verification Rules Engine created (`src/lib/comparison/engine.ts`).
- `AddSponsorModal` UI component built (`src/features/sponsors/components/`).
- `FindingCard` updated with `Sponsor` / `Cross-Entity` visual badges.
- `Warning` severity and `Identity` finding category added to DB enums.
- Multi-Agent Orchestration Framework scaffolded (`skills/`, `agents/`, `docs/MULTI_AGENT_ORCHESTRATION.md`).
- Gemini 2.5 Flash document extraction remains fully operational with structured output validation and multi-key rotation fallback.

**Current Phase:** Phase 8 - Dashboard & Analytics

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
