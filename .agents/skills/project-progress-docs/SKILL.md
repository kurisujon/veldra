---
name: project-progress-docs
description: >
  Enforces honest progress reporting and keeps Veldra's documentation set
  (AGENTS.md, GEMINI.md, and the docs/ directory) synchronized with the
  actual implementation after every meaningful coding task. Activate this
  automatically for any task that touches Veldra's schemas, RLS policies,
  server actions, RPCs, UI components, or the "Current System State" /
  "Current Phase" status of the project — not only when the user explicitly
  asks for a status update or doc pass.
---

# Project Progress & Documentation Skill (Veldra)

## Purpose

Maintain an accurate record of progress on Veldra, and make sure the
project's documentation — `AGENTS.md`, `GEMINI.md`, and everything under
`docs/` — never falls out of sync with what's actually implemented.

This matters more here than in a typical repo: `GEMINI.md` explicitly
requires agents to read `docs/` *before* making architectural decisions,
and `AGENTS.md` treats certain violations as instant rejection. Stale docs
in this project don't just go unread — they actively mislead the next
agent (Claude or Gemini) into building against the wrong assumptions.

For every meaningful development task:

1. Track what was requested, completed, and left undone.
2. Track what was actually verified (build, lint, tests, manual checks).
3. Check the change against Veldra's zero-tolerance rules before calling
   anything "done."
4. Identify which of Veldra's docs are now stale.
5. Update them as part of the task, not as a follow-up.
6. Report a clear final state, including the two living status blocks
   (`AGENTS.md` § Current System State, `GEMINI.md` § Current Phase).

Documentation updates are part of the task, not optional cleanup.

## Core Rules

### 1. Never imply unfinished work is complete

Distinguish clearly between: **Completed**, **Partially completed**,
**Not completed**, **Blocked**, **Not attempted**, **Needs verification**.

Writing code is not the same as finishing a task. A task is complete only
when the implementation, its documentation, and reasonable verification
are all done — see the Documentation Completion Gate below.

### 2. Provide progress updates during substantial work

For multi-file or multi-step work, give concise updates that communicate
state changes, not a command-by-command narration.

Good: *"Implemented the `sponsors` RLS policies and the `runVerificationEngine`
wiring in `analyzeDocuments`. Running `next build` now; `docs/DATA_MODELS.md`
still needs a note about the new `sponsors` table."*

Bad: *"Running command. Reading file. Editing another file."*

## Zero-Tolerance Check (from AGENTS.md)

Before marking anything "Completed," scan the diff for the behaviors
`AGENTS.md` calls zero-tolerance. If any are present, the task is **Not
Completed** regardless of whether the feature works — these are stated to
cause immediate rejection, so this skill treats them the same way:

- Type bypasses: `as any`, `unknown as`, `@ts-ignore`, `@ts-expect-error`
- Arbitrary Tailwind values (`w-[300px]`, `text-[15px]`, `bg-[#FF0000]`)
  instead of the established design tokens
- Audit/security fields (`role`, `user_id`, `created_at`) trusted from the
  client instead of derived server-side via `auth.uid()` or inside a
  `SECURITY DEFINER` RPC
- Tables without Row Level Security, or permissive `true` RLS policies
  instead of role-aware access via `get_user_role()`
- Server Actions that touch the database without a `Zod` schema validating
  the input first

If `GEMINI.md`'s architecture constraints changed since you last read it
(design tokens, feature-based folder structure, "no undocumented
components"), re-check against the current file rather than memory —
these are the kind of thing that drifts silently.

## Required Final Status

Before ending a development task, report using this structure.

### Completed
Work successfully finished — files, components, schema/RPC/RLS changes,
fixes, config changes.

### Not Completed
Anything requested that was not implemented, only partially implemented,
blocked, deferred, or not verified. If truly nothing remains:
*"Nothing known remains incomplete for the requested scope."* Never omit
this section because everything looks finished.

### Verification
State what was actually run and its result — e.g. `next build`,
`next lint`, targeted unit/E2E tests (`playwright.config.ts` / `e2e/`),
manual RLS check, manual UI check. Also state what was **not** verified.
Never claim a check that wasn't actually performed. Note explicitly
whether `next build` and `next lint` are clean — `AGENTS.md` treats that
as the baseline bar ("Build Status: Clean... Keep it this way"), not an
optional nicety.

### Documentation
List what was updated, created, reviewed-and-unchanged, or still needs
updating. Be specific about which file — "updated docs" is not enough
when there are 13+ named docs.

## Documentation Synchronization

### Documentation is part of implementation

Whenever behavior, schema, RLS policy, server action, RPC, UI component,
architecture, or phase status changes, check Veldra's documentation for
staleness. Don't wait for the user to ask.

### Where to look

Veldra keeps documentation in three places, each with a different job:

**`AGENTS.md`** — agent roles, the zero-tolerance rules, and a **Current
System State** section (what phase is done, what's next, build status).
Update the Current System State bullets when a phase completes, a major
feature lands, or build/lint status changes.

**`GEMINI.md`** — project summary, architecture constraints, design
principles, and a **Current Phase** section that mirrors (and sometimes
has more detail than) the one in AGENTS.md. Keep these two in agreement —
don't update one and leave the other describing an old phase.

**`docs/`** — the required reading order listed in `GEMINI.md`:

| File | Covers |
|---|---|
| `PRODUCT_VISION.md` | What Veldra is and isn't (a review tool, not a chatbot) |
| `INFORMATION_ARCHITECTURE.md` | Site/data structure |
| `CASE_WORKFLOW.md` | The case-centric workflow |
| `DATA_MODELS.md` | Schema and data shapes |
| `FINDINGS_SYSTEM.md` | Discrepancy/findings logic |
| `FEATURE_REQUIREMENTS.md` | Feature specs |
| `DESIGN_SYSTEM.md` | Tokens, colors, spacing, radius |
| `COMPONENT_RULES.md` | Reusable component rules |
| `FOLDER_STRUCTURE.md` | Feature-based folder layout |
| `DEVELOPMENT_RULES.md` | TypeScript/Tailwind/other dev rules |
| `ROADMAP.md` | Phase-by-phase roadmap |
| `TASKS.md` | In-progress and backlog tasks |
| `MULTI_AGENT_ORCHESTRATION.md` | How Claude and Gemini coordinate |

This list is Veldra's own required reading order, not a fixed template —
if `GEMINI.md` adds or renames an entry, treat the current file as the
source of truth over this table.

### Decision process

For every meaningful change, ask:

- **Did schema, RLS, or an RPC change?** → `DATA_MODELS.md`, and
  `FINDINGS_SYSTEM.md` if it touches discrepancy logic.
- **Did a workflow or case-handling step change?** → `CASE_WORKFLOW.md`.
- **Did the UI or a component change?** → `COMPONENT_RULES.md` and, if a
  token or pattern changed, `DESIGN_SYSTEM.md`.
- **Did folder layout or a dev process change?** → `FOLDER_STRUCTURE.md`
  / `DEVELOPMENT_RULES.md`.
- **Did a phase complete or the roadmap shift?** → `ROADMAP.md`,
  `TASKS.md`, and both status blocks (`AGENTS.md` + `GEMINI.md`).
- **Was the change purely internal with no doc-visible effect?** → say so
  explicitly: *"Documentation reviewed; no changes required for this
  implementation."* Don't invent an edit to look thorough.

### Accuracy rules

Documentation must describe the implementation that actually landed, not
the one that was planned. Before editing a doc: inspect the real
schema/RPC/component, confirm names and behavior, then write it down.
Preserve existing terminology, heading style, and phase-numbering
conventions (`Phase 7`, `Phase 7.5`, `Phase 8` style) rather than
introducing a new format.

### Who updates what

`AGENTS.md` assigns documentation duty to Gemini as UI Developer &
Documentarian, and backend/architecture work to Claude. This skill
doesn't override that split — but it also doesn't let it become an
excuse. If you're the backend agent and your change makes a doc stale,
either update it yourself or flag it explicitly as a handoff item in
"Not Completed" / "Documentation" — never leave it unmentioned on the
assumption "the other agent will notice."

## Task Tracking

At the start of multi-step work, keep an internal checklist with states:
`[pending]`, `[in progress]`, `[done]`, `[blocked]`, `[not verified]`.
Documentation is a line item on this checklist, not a separate optional
task added at the end.

## Scope Changes and Discovered Issues

Distinguish **requested scope** (what's directly necessary to fulfill the
task) from **discovered issues** (problems found along the way, e.g. a
stray `as any` in unrelated code, or a table missing RLS). Report
discovered issues even if unfixed. Small fixes directly necessary for
correctness are fine to make in-flight; don't silently expand into
unrelated refactors.

## Documentation Completion Gate

Before declaring a task complete, check:

- Was the requested implementation completed, and were gaps disclosed?
- Was reasonable verification performed — including `next build` /
  `next lint` — and were limitations disclosed?
- Does the diff introduce any zero-tolerance violation from AGENTS.md?
- Did schema, RLS, RPC, UI, workflow, or folder structure change?
- Did a phase complete or the roadmap move?
- Were the affected `docs/*.md` files located and updated?
- Do `AGENTS.md` § Current System State and `GEMINI.md` § Current Phase
  still agree with each other and with reality?

If documentation should have changed but didn't, the task is not fully
complete — say so plainly rather than reporting success.

## Final Response Format

For substantial tasks, close with:

```
Completed
- Implemented ...
- Fixed ...

Not Completed
- Nothing known remains incomplete for the requested scope.
  (or: specific gaps, with why)

Verification
- next build — passed
- next lint — passed
- [any other checks actually run]

Documentation
- Updated docs/DATA_MODELS.md
- Updated AGENTS.md (Current System State) and GEMINI.md (Current Phase)
- Reviewed docs/COMPONENT_RULES.md; no change required
```

Adjust file names to what actually changed. Never invent files, commands,
or results that weren't actually run.

## Important Principles

- Be transparent about incomplete work.
- Never claim testing, build, or lint status that wasn't actually checked.
- Never claim a doc was updated when it wasn't.
- A zero-tolerance violation makes the task incomplete, full stop.
- Keep `AGENTS.md` and `GEMINI.md` status blocks in agreement.
- Prefer concise progress updates over command-by-command narration.
- Preserve unrelated user work and existing doc conventions.
- Separate requested work from discovered issues.
- End every substantial task with an explicit completion state.
