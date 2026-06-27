# BRIEFING — 2026-06-25T22:00:00+08:00

## Mission
Orchestrate the integration of Gemini 2.5 Flash as the primary document extraction engine in Veldra, maintaining the strict role split between Claude (Backend) and Gemini (UI & Docs).

## 🔒 My Identity
- Archetype: Teamwork Orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/orchestrator/
- Original parent: parent
- Original parent conversation ID: 1bcf15cb-451e-4c1b-8fbe-84ecee099c9f

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/PROJECT.md
1. **Decompose**: Decompose the Gemini 2.5 Flash document extraction integration into milestones:
   - Milestone 1: Central Gemini Client Setup (Claude)
   - Milestone 2: Zod Schemas & Prompt Templates (Claude)
   - Milestone 3: Single Entry Point & Extraction Persistence (Claude)
   - Milestone 4: UI Integration & Manual Trigger (Gemini)
   - Milestone 5: Verification & Documentation (Claude & Gemini)
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
  - M1: Central Gemini Client Setup [pending]
  - M2: Zod Schemas & Prompt Templates [pending]
  - M3: Single Entry Point & Extraction Persistence [pending]
  - M4: UI Integration & Manual Trigger [pending]
  - M5: Verification & Documentation [pending]
- **Current phase**: 1
- **Current focus**: Milestone 1 (Central Gemini Client Setup)

## 🔒 Key Constraints
- Strict role split: Claude (Architect/Backend Developer) handles database schema changes, PostgreSQL RPCs, RLS policies, server actions, and type definition updates. Gemini (UI Developer/Documentarian) handles React UI components, page integration, and markdown documentation updates.
- No TypeScript type bypasses (`as any`, `@ts-ignore`, etc.).
- No arbitrary Tailwind utility classes in UI code.
- All new components must be documented in docs/COMPONENT_RULES.md before use.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.

## Current Parent
- Conversation ID: 1bcf15cb-451e-4c1b-8fbe-84ecee099c9f
- Updated: 2026-06-25T21:05:45+08:00

## Key Decisions Made
- Centralize all Gemini configurations and API interactions in `src/lib/ai/` to keep clean separation from existing components.
- Use Gemini's native PDF and image parsing capabilities (multimodal inlineData) for high quality visual extraction instead of pre-extracting text, falling back gracefully to text OCR only if the file size/type requires it.
- Map the extracted fields to the existing `document_extractions` and `document_fields` schema.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| Claude Backend Developer | teamwork_preview_worker | Implement Milestones 1-3 | completed | c467d82f-d3e3-4eab-ac56-ee4391440b81 |
| Gemini UI Developer | teamwork_preview_worker | Implement Milestones 4-5 | completed | 9de28f9c-7b79-4645-b39e-15d4fa816e1c |
| Forensic Auditor | teamwork_preview_auditor | Audit integrity of implementation | completed | fed06b37-d978-4ea0-8ed5-2eba80642f76 |

## Succession Status
- Succession required: no
- Spawn count: 3 / 16
- Pending subagents: none
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: none
- Safety timer: none

## Artifact Index
- /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/orchestrator/progress.md — Heartbeat and step-by-step progress checklist
- /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/orchestrator/plan.md — Detailed milestone plan
- /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/orchestrator/context.md — Context and architecture overview
- /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/orchestrator/ORIGINAL_REQUEST.md — Original user request
