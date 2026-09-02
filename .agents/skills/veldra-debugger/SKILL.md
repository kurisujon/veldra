---
name: veldra-debugger
description: Systematic root-cause debugging for the Veldra document-verification platform
---

# Veldra Debugger

Systematic root-cause debugging for the Veldra document-verification platform (Next.js App Router + Supabase + Gemini extraction). Activate whenever the user reports a bug, error, stack trace, failing build/lint/ test, unexpected UI state, a finding or extraction that "isn't showing up," data that "won't save," an RLS/permission denial, a case stuck in the wrong status, or asks to investigate/fix/troubleshoot anything in this codebase — even if they don't use the word "debug." Always activate before proposing a fix for a defect, not just when explicitly asked to "use the debugger."

## Purpose

Find the actual root cause of a Veldra defect — grounded in the real code, schema, and migrations, not in what the feature is "supposed" to do — and fix it without violating the project's zero-tolerance rules (AGENTS.md). Veldra is a multi-layer system (Next.js UI → Server Actions → Supabase Postgres/RLS/RPCs, plus an isolated Gemini extraction pipeline and a zero-trust comparison engine), so most real bugs live at a layer boundary, not inside a single function. This skill exists to stop guessing and start triangulating.

This project already runs a Discovery-First multi-agent framework (docs/MULTI_AGENT_ORCHESTRATION.md): no fix should be proposed before the relevant architecture doc and the relevant real code have both been read. Treat that as non-negotiable here too.

## Step 0 — Reproduce and classify before touching code

Get, or ask for, whichever of these aren't already given:

*   The exact action taken and the exact result (not "extraction is broken" — which document type, which case status, what appeared instead).
*   The full error message / stack trace, or the server log line, or the screenshot — not a paraphrase.
*   Whether it reproduces locally (`npm run dev`) or only in the deployed environment (`veldra-sand.vercel.app` per `playwright.config.ts`).
*   Which role hit it — Reviewer, Supervisor, or Admin (`docs/SUPABASE_ARCHITECTURE.md`). Many "bugs" are correct RLS behavior for a different role.

Then classify the symptom into a subsystem using this table before reading any further code — it determines which doc and which files matter:

| Symptom | Subsystem | Read first |
| :--- | :--- | :--- |
| Extraction stuck/fails, wrong/missing fields, "Failed" badge | AI Extraction Pipeline | `docs/GEMINI_EXTRACTION_ARCHITECTURE.md`, `docs/PHASE_11.6_ARCHITECTURE_REPORT.md` |
| Finding missing, wrong severity, appears in wrong tab | Findings / Comparison Engine | `docs/FINDINGS_SYSTEM.md` |
| "Save"/"Accept"/"Verify" does nothing or silently no-ops | Zero-Trust Verification RPC | `docs/PHASE_11.6_ARCHITECTURE_REPORT.md` §H |
| Permission denied, empty result set, wrong user sees data | RLS / Supabase | `docs/SUPABASE_ARCHITECTURE.md` |
| Case stuck in a status, action greyed out unexpectedly | Case State Machine | `docs/CASE_WORKFLOW.md` |
| Layout/styling regression, "looks AI-generated" | Design System / Components | `docs/DESIGN_SYSTEM.md`, `docs/COMPONENT_RULES.md` |
| Export/PDF fails or hangs, especially locally on Windows/WSL | PDF/Export Pipeline | `docs/PHASE_5.5_ARCHITECTURE.md` |
| Missing/incomplete history for an action | Audit Logging | `docs/AUDIT_LOGGING.md` |

If a report spans more than one of these rows, split it — debug and verify one subsystem at a time, the same way this repo's agents are only allowed to own one domain at a time (`AGENTS.md`).

## Step 1 — Subsystem playbooks

### A. AI Extraction Pipeline (`src/lib/ai/`, `src/lib/extraction/`, `src/lib/ocr/`)
*   Check environment first: `GEMINI_API_KEY` or `GEMINI_API_KEYS` (comma-separated, rotated on rate-limit/quota errors) and `GEMINI_MODEL` in `.env.local`. A missing/invalid key surfaces as a `Failed` status with `error_message` populated on the extraction record — read that message, don't assume.
*   Trace the real call path: `runExtraction` (server action) → `extractDocumentWithAI` in `src/lib/ai/extraction.ts` → prompt from `src/lib/ai/prompts.ts` → Zod schema in `src/lib/ai/schemas.ts`. A field silently missing is usually a Zod schema/prompt mismatch, not an API failure — check whether the field is even in the schema for that document type before assuming the model dropped it.
*   Watch for the Phase 11.5 → 11.6 vocabulary split. Two different status systems coexist in this codebase and mixing them up is a real, easy-to-hit bug:
    *   Extraction/document status (Phase 11.5): `Pending` → `Processing` → `Extracted` → `NeedsReview` → `Reviewed` / `Failed`.
    *   Field-level state (Phase 11.6 zero-trust): `observed` → `candidate` → `verified`, plus `not_present` / `unreadable` / `ambiguous`. If code (or a bug report) is checking a field's old `Accepted` / `Corrected` / `Rejected` status where it should be checking `state === 'verified'`, that's very likely the actual bug — see Section B.
*   Known, already-documented limitations — rule these out before treating them as new bugs: array-shaped fields (e.g. `academicEntries`, `gradeLevelEntries`) are stored as serialized JSON strings, not tables (`docs/GEMINI_EXTRACTION_ARCHITECTURE.md` §5); very large multi-page PDFs can hit the inline payload limit (`docs/PHASE_5.5_ARCHITECTURE.md`).
*   Relevant e2e coverage: `e2e/document-upload.spec.ts`, `e2e/candidate-extraction.spec.ts`, `e2e/dual-extraction.spec.ts`, `e2e/evidence-validator.spec.ts`, `e2e/evidence-map.spec.ts`, `e2e/document-profiles.spec.ts`.

### B. Zero-Trust Boundary / Findings & Comparison Engine (`src/lib/comparison/`)
*   The comparison engine is deliberately isolated and must only ever see fields where `state === 'verified'`, enforced through a `getVerifiedFields` helper (`docs/FINDINGS_SYSTEM.md`, Layer 3 Zero-Trust Boundary). If a finding you expect isn't generating, first confirm the underlying field actually reached verified state — a field stuck at `candidate` will never reach the comparison engine, and this is by design, not a bug in the comparison logic itself.
*   If a reviewer's "Accept/Correct" action doesn't seem to persist: Phase 11.6-H revoked generic `UPDATE` on `document_fields` for reviewers and forced all state transitions through the `SECURITY DEFINER` RPC `verify_document_field`. A direct-table update path that predates this migration (`20260826000000_zero_trust_extraction.sql`, `20260830000000_phase11_6_h_human_workspace.sql`) will now fail RLS silently or throw a permission error — check the Network tab / server log for a Postgres permission-denied response, not just the UI state.
*   Findings scope matters for severity expectations: `sponsor_internal` mismatches are capped at Warning severity by design and never auto-fail a case — don't "fix" that as if it were a missing High severity.
*   Relevant e2e coverage: `e2e/analysis.spec.ts`, `e2e/comparison-boundary.spec.ts`, `e2e/human-workspace.spec.ts`.

### C. Supabase / RLS / RPCs (`supabase/migrations/`)
*   Migrations are the source of truth, in order — a table's current policy is whatever the latest migration touching it says, not what an earlier migration or a doc summary implies. Several migrations exist specifically to fix earlier ones (e.g. `20260730000002_fix_create_case_rpc_middle_name.sql`), so `ls supabase/migrations/` and read chronologically before concluding what a policy currently does.
*   Reproduce permission bugs directly in the Supabase SQL editor by impersonating a role (`select set_config('request.jwt.claims', ...)`) rather than guessing from the UI — RLS bugs are almost never fixable by reasoning about the frontend.
*   If TypeScript errors reference fields/tables that don't match your mental model of the schema, regenerate types before debugging further: `npm run gen-types` (requires a linked Supabase project). `npm run restore-db` reverts `src/types/database.ts` if a bad generation needs undoing.
*   Every table must have RLS enabled with a role-aware policy via `get_user_role()` — if a query returns unexpectedly empty instead of denied, that's usually the actual RLS filter working as intended for that role; confirm against `docs/SUPABASE_ARCHITECTURE.md`'s role permission tables before assuming it's a bug.

### D. Case State Machine (`src/features/cases/`)
*   Cross-check the reported behavior against the exact entry/exit conditions in `docs/CASE_WORKFLOW.md` (`Draft` → `Uploaded` → `Processing` → `Needs Review` → `Reviewed` → `Draft Generated` → `Ready For Export` → `Exported` → `Archived`). Two common real bug shapes here:
    *   A case stuck in `Processing` because extraction/comparison threw without updating case status on failure — check for a missing error-path status update, not just the happy path.
    *   A "Complete Review" action that should be gated on all findings being Accepted/Resolved/Ignored but isn't actually checking every finding.
*   Relevant e2e coverage: `e2e/cases.spec.ts`, `e2e/document-delete.spec.ts`.

### E. Frontend / Design System (`src/components/`, `src/features/*/components/`)
*   Before treating a visual issue as a one-off CSS bug, check whether it's actually a rule violation: arbitrary Tailwind values (`w-[300px]`, `text-[15px]`, `bg-[#...]`) instead of design tokens are explicitly zero-tolerance in `AGENTS.md` — grep the affected component for `[` inside a className before writing a manual fix. Also confirm Server/Client Component boundaries (`'use client'`) haven't been crossed incorrectly per `docs/DEVELOPMENT_RULES.md`.
*   Relevant e2e coverage: `e2e/visual-audit.spec.ts`.

### F. PDF / Export (`src/lib/pdf/`, `src/lib/generation/`)
*   Puppeteer requires native OS binaries and is a documented source of local setup friction, especially on Windows/WSL (`docs/PHASE_5.5_ARCHITECTURE.md`). If export fails only in one environment, suspect the Chromium binary / `puppeteer-core` configuration before the PDF-generation code itself.

### G. Auth / RBAC
*   Check the expected permission matrix in `docs/SUPABASE_ARCHITECTURE.md` against `e2e/authorization.spec.ts` and `e2e/auth.setup.ts` before changing any policy — confirm you're not "fixing" intended role isolation.

### H. Audit Logging
*   If an expected log entry is missing, check the required event list in `docs/AUDIT_LOGGING.md` against the actual mutation path — audit writes here are typically hand-added at each mutation site, so a missing entry usually means a genuinely missing call, not a broken logger.

## Step 2 — Isolate with a minimal repro

Prefer the existing Playwright suite over a fresh script — it already encodes expected behavior for most flows (see the per-subsystem mappings above). Two things trip people up:

*   `baseURL` defaults to the deployed app, not localhost (`playwright.config.ts` → `https://veldra-sand.vercel.app` unless `PLAYWRIGHT_TEST_BASE_URL` is set). Set `PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000` when you need to test a local fix, or you will be debugging production by accident.
*   Tests load env from `.env.e2e.local` (`dotenv -e .env.e2e.local -- playwright test`), a separate file from `.env.local` used by `next dev`.

Run a targeted spec while iterating: `npm run test:e2e -- e2e/<file>.spec.ts`, or `npm run test:e2e:ui` / `npm run test:e2e:headed` when you need to watch it happen rather than read a trace.

## Step 3 — Fix within the project's constraints

Whoever applies the fix must stay inside the same zero-tolerance rules any other change in this repo follows (`AGENTS.md`) — a debugging session is not an exception:

*   No `as any`, `unknown as`, `@ts-ignore`, `@ts-expect-error` to make a type error go away. Fix the root cause (explicit generics, correct types).
*   No loosening an RLS policy to `true` or removing a check to make an error disappear — fix the `role`/`get_user_role()` logic instead.
*   No bypassing Zod validation in a Server Action to unblock a save.
*   Don't route a fix around `verify_document_field` back onto direct `document_fields` UPDATEs — that RPC boundary is intentional (Section B).
*   Respect the domain split: backend/schema/RPC/RLS/server-action fixes are Claude's domain, UI/component fixes are Gemini's domain (`AGENTS.md`) — if a fix needs both, say so rather than doing UI work under a backend fix or vice versa.

If the true root cause turns out to require a real architecture change (e.g. widening the zero-trust boundary), stop and flag that as a design question rather than quietly patching around it.

## Step 4 — Verify before calling it fixed

Never report a fix as done without actually running these and reporting the real result:

*   `npm run build` — must be clean.
*   `npm run lint` — must be clean, zero warnings.
*   The specific e2e spec(s) for the affected subsystem (Step 1 tables), with `PLAYWRIGHT_TEST_BASE_URL` pointed at the environment you actually fixed.
*   If schema changed: `npm run gen-types`, then re-run `npm run build` to confirm no downstream type breaks.

If something wasn't verified, say so explicitly — don't imply it passed.

## Step 5 — Report

Close every debugging session with:

*   **Symptom**: What was reported, and how it was reproduced.
*   **Root Cause**: The actual mechanism, naming the specific file(s)/migration(s)/layer, not a restatement of the symptom.
*   **Subsystem**: One of: Extraction / Findings-Comparison / Zero-Trust RPC / RLS-Supabase / Case State Machine / Frontend-Design-System / PDF-Export / Auth / Audit Logging.
*   **Fix**: What changed, and why it doesn't violate AGENTS.md's zero-tolerance list.
*   **Verification**: build / lint / e2e results actually run, including which baseURL was used.
*   **Regression Risk & Docs**: Anything else this touches; whether docs/*.md are now stale (hand off to the project-progress-docs skill if so, rather than silently skipping it).

## Important Principles

*   **Discovery before diagnosis**: read the relevant doc and the relevant real code before proposing a cause — this project's whole engineering culture (`docs/MULTI_AGENT_ORCHESTRATION.md`) is built on that order, and skipping it produces confidently wrong root causes here more than most codebases, because two status vocabularies and a zero-trust layer boundary are easy to misdiagnose from memory alone.
*   **A bug report spanning multiple subsystems gets split**, not solved in one pass.
*   **RLS returning empty/denied and comparison logic ignoring unverified fields are very often correct behavior**, not bugs — check the doc before "fixing" intended isolation.
*   **Never silence an error** with a type bypass, a loosened RLS policy, or a skipped Zod check to make symptoms disappear.
*   **Never claim a build, lint, or test result that wasn't actually run.**
*   **One root cause, clearly named, beats several plausible-sounding guesses.**
