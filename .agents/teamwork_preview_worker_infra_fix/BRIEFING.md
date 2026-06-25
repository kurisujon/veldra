# BRIEFING — 2026-06-22T10:09:04+08:00

## Mission
Fix testing infrastructure quality and robustness issues in db-utils.ts, auth-utils.ts, smoke.e2e.spec.ts, and playwright.config.ts.

## 🔒 My Identity
- Archetype: Test Infrastructure Worker
- Roles: implementer, qa, specialist
- Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_worker_infra_fix
- Original parent: af42697b-30c7-4630-b7a1-f8fc16a86c80
- Milestone: Milestone 1

## 🔒 Key Constraints
- CODE_ONLY network mode. No external HTTP requests.
- No cheating or hardcoding test results/facades.
- No TypeScript bypasses (any/ts-ignore).
- Write to own folder in `.agents` only; write handoff report to `.agents/teamwork_preview_worker_infra_fix/handoff.md`.

## Current Parent
- Conversation ID: af42697b-30c7-4630-b7a1-f8fc16a86c80
- Updated: not yet

## Task Summary
- **What to build/fix**:
  - Update `tests/helpers/db-utils.ts`:
    - Implement `findUserByEmail(email)` using a robust paginated loop of page size 100 instead of deprecated/paginated `listUsers` calls in `createTestUser` and `deleteUserByEmail`.
    - Refactor `cleanUpTestCase`: Query the database `documents` table for files belonging to `caseId`, delete them from storage, then delete the case record.
  - Update `tests/helpers/auth-utils.ts`:
    - Set cookie `domain` dynamically based on test `baseURL` hostname.
    - Determine `projectRef` correctly for local hostnames and cloud hostnames.
  - Update `tests/smoke.e2e.spec.ts`:
    - Change `page.locator('role=main')` to `page.getByRole('main')`.
  - Update `playwright.config.ts`:
    - Make `webServer` adaptable/robust under local execution and port changes.
- **Success criteria**:
  - Code compiles cleanly (`npx tsc --noEmit`).
  - Linter passes (`npm run lint`).
  - Handoff report is created at `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_worker_infra_fix/handoff.md`.
- **Interface contracts**: `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/AGENTS.md` and `GEMINI.md`
- **Code layout**: `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/tests/`

## Key Decisions Made
- [TBD]

## Change Tracker
- **Files modified**: None yet
- **Build status**: [TBD]
- **Pending issues**: None

## Quality Status
- **Build/test result**: [TBD]
- **Lint status**: [TBD]
- **Tests added/modified**: None yet

## Loaded Skills
- **Source**: `/home/cjk/.gemini/antigravity-cli/builtin/skills/antigravity_guide/SKILL.md`
- **Local copy**: `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_worker_infra_fix/SKILL_antigravity_guide.md`
- **Core methodology**: Provides a sitemap and guide for the Google Antigravity platforms and CLI surfaces.

## Artifact Index
- /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_worker_infra_fix/handoff.md — Handoff report
