## 2026-06-22T10:52:24Z
You are teamwork_preview_worker_phase5, a code implementation agent.
Your working directory is `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_worker_phase5/`.
You are responsible for implementing the Phase 5 Frontend UI components and E2E Playwright tests.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Adhere strictly to all agent roles & rules in `AGENTS.md`, `GEMINI.md`, and other design system guidelines under `docs/`.
No type bypasses (e.g., no `as any`, no `@ts-ignore`, no `@ts-expect-error`).
Use only established Tailwind spacing (`p-xs`, `p-sm`, `p-md`, `p-lg`, `p-xl`, `p-2xl`, etc.), radius (`rounded-button`, `rounded-input`, `rounded-card`, `rounded-modal`), colors, typography. No arbitrary values (like `w-[320px]`).

Please implement:
1. In `src/features/findings/actions/index.ts`:
   - Implement `getFindingsByCase(caseId: string)` to fetch findings and their associated document IDs for a case.
2. In `src/features/documents/actions/index.ts`:
   - Implement `getSignedUrlsForDocuments(filePaths: string[])` to generate short-lived signed URLs for storage files.
3. In `src/features/findings/components/FindingCard.tsx`:
   - Implement the `FindingCard` component following the styling rules in `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_explorer_phase5_3/analysis.md` and `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_explorer_phase5_1/analysis.md`.
   - Call `updateFindingStatus` server action when status changes (Accepted, Resolved, Ignored).
4. In `src/components/review/DocumentComparisonPanel.tsx`:
   - Implement the `DocumentComparisonPanel` component displaying two selected documents side-by-side.
   - For each document, it should render an iframe or img displaying the file using the signed URL, or display document metadata and a fallback placeholder if rendering is not possible.
5. In `src/features/findings/components/CaseFindingsWorkspace.tsx`:
   - Implement a client-side layout workspace component that takes the findings and documents list, manages selection state (selected finding), calls the signed URL action on demand for the selected finding's documents, and renders the findings list (using `FindingCard`s) on the left side and the `DocumentComparisonPanel` on the right side.
6. In `src/app/(dashboard)/cases/[id]/page.tsx`:
   - Integrate the "Run Analysis" trigger. Add a button to run analysis (using `analyzeDocuments`).
   - If case status is `NeedsReview`, render `CaseFindingsWorkspace` side-by-side split screen layout instead of the default document upload and document list components. If case status is not `NeedsReview`, show the default upload/list view but keep the "Run Analysis" button visible (e.g., if status is `Uploaded` or if they want to re-run).
7. In `tests/findings.e2e.spec.ts`:
   - Implement the Playwright E2E test suite covering the 4 tiers defined in `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_explorer_phase5_2/analysis.md`.
8. Updates to Documentation:
   - Mark Phase 5 as completed in `GEMINI.md`.
   - Update current system state in `AGENTS.md`.

Once complete, run `npm run build` and `npm run lint` and `npx playwright test` to verify everything is working perfectly. Update your `progress.md` with timestamps. Write a handoff report at `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_worker_phase5/handoff.md`.
