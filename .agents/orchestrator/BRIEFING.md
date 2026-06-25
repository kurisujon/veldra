# BRIEFING — 2026-06-22T19:18:21+08:00

## Mission
Orchestrate the design, implementation, and integration of Phase 6 (Legal Draft Generation) of Veldra, maintaining the strict role split between Claude (Backend) and Gemini (UI & Docs).

## 🔒 My Identity
- Archetype: Teamwork Orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/orchestrator/
- Original parent: parent
- Original parent conversation ID: bb4488c7-c28e-447a-9634-cefd2766ea89

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/PROJECT.md
1. **Decompose**: Decompose the Phase 6 requirements into milestones:
   - Milestone 1: E2E Playwright Test Suite Planning & Design (Dual Track setup).
   - Milestone 2: Backend migrations, RLS policies, live db type regeneration (Claude's role).
   - Milestone 3: Server actions (generateDrafts, updateDraftContent, finalizeDraft, getDraftsByCase) with Zod validation (Claude's role).
   - Milestone 4: Frontend UI DraftEditor React component, and Case Detail Page integration (Gemini's role).
   - Milestone 5: Verification (Run verification: builds, lints, and E2E tests).
   - Milestone 6: Documentation (GEMINI.md, AGENTS.md, docs/DATA_MODELS.md updates - Gemini's role).
2. **Dispatch & Execute**:
   - **Direct (iteration loop)**: Spawn explorers, workers, and reviewers, enforcing the strict backend/frontend split.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed at 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Decompose Phase 6 requirements and update plan/progress.md [done]
  2. Implement E2E Test Suite [pending]
  3. Implement Backend Migration & Schema (Claude) [pending]
  4. Implement Server Actions with Zod (Claude) [pending]
  5. Implement Frontend DraftEditor & Case Detail page integration (Gemini) [pending]
  6. Verify build, lint, and E2E tests [pending]
  7. Update documentation and close phase (Gemini) [pending]
- **Current phase**: 1
- **Current focus**: Decompose requirements and plan milestones.

## 🔒 Key Constraints
- Strict role split: Claude handles database migrations, PostgreSQL RPCs, RLS policies, server actions, and type updates. Gemini handles React UI components, page integration, and documentation. Neither agent may touch the other's domain.
- All new components must be documented in docs/COMPONENT_RULES.md before use.
- Build/type safety: npm run build and npm run lint must complete with zero errors.
- RLS enabled, security definer set search_path = public, no user_id/role accepted as client-side parameters.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.

## Current Parent
- Conversation ID: bb4488c7-c28e-447a-9634-cefd2766ea89
- Updated: 2026-06-22T19:18:21+08:00

## Key Decisions Made
- Decompose Phase 6 into separate milestones aligning with the backend/frontend split.
- Dual track design: Set up E2E tests first to ensure independent requirement verification.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| Gemini UI & Testing Developer | teamwork_preview_worker | Implement Phase 6 E2E Test Suite | in-progress | 8dee6892-0312-4997-9547-5c53063fe620 |

## Succession Status
- Succession required: no
- Spawn count: 2 / 16
- Pending subagents: 8dee6892-0312-4997-9547-5c53063fe620
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: task-83
- Safety timer: none

## Artifact Index
- /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/orchestrator/progress.md — Heartbeat and step-by-step progress checklist
- /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/orchestrator/ORIGINAL_REQUEST.md — Original user request and instructions
