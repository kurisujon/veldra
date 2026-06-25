# Phase 8 (Dashboard & Analytics) Implementation Plan

## Overview
This plan outlines the steps to resolve the Next.js type check bug, implement the Dashboard UI using design tokens, and verify correctness with Playwright E2E tests, ensuring that the project builds and lints with zero errors.

## Milestones

### M1. Supabase RPC Next.js Type Check Bug (Backend/Types)
- **Scope**: Resolve the TypeScript compiler issue with `supabase.rpc('create_case_with_applicant')` in `src/features/cases/actions/index.ts` strictly without using `as any`, `@ts-ignore`, `@ts-expect-error`, or `unknown as`.
- **Target File**: `src/features/cases/actions/index.ts`
- **Owner**: Claude (Backend/Types) -> Delegated to subagents (Explorer / Worker).
- **Verification**: `npm run build` type checks without errors.

### M2. Phase 8 Dashboard UI (Frontend)
- **Scope**: Build the Dashboard UI at `src/app/(dashboard)/page.tsx` containing an overview of active cases, recent activity, and system metrics. Utilize existing design tokens and Tailwind utility classes with mock metrics.
- **Target File**: `src/app/(dashboard)/page.tsx`
- **Owner**: Gemini (UI) -> Delegated to subagent (Worker).
- **Verification**: Matches design system guidelines, loads correctly in browser.

### M3. Playwright E2E Verification (Testing)
- **Scope**: Write a Playwright E2E test in the `tests/` directory (e.g. `tests/dashboard.spec.ts`) to verify that the dashboard loads and renders correctly.
- **Target File**: `tests/dashboard.spec.ts` (or similar)
- **Owner**: Delegated to subagent (Worker / Challenger).
- **Verification**: Run Playwright test successfully.

### M4. Build, Lint & Forensic Audit (Verification)
- **Scope**: Run `npm run build`, `npm run lint`, and Forensic Auditor to ensure no compiler/lint errors and complete integrity verification.
- **Owner**: Delegated to Forensic Auditor subagent.
- **Verification**: Clean build, clean lint, auditor pass.
