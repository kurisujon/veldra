# Handoff Report: Phase 5 Frontend UI Analysis

## 1. Observation
We observed the following files and structural configurations in the Veldra project workspace:
* **Tailwind Configuration (`tailwind.config.ts`):** Fixed spacing scale (e.g., lines 31-38: `xs: "4px"`, `sm: "8px"`, `md: "12px"`, `lg: "16px"`, `xl: "24px"`) and color variables (lines 12-23: `background: "var(--background)"`, `surface: "var(--surface)"`, `accent: "var(--accent)"`, `success: "var(--success)"`, `warning: "var(--warning)"`, `error: "var(--error)"`).
* **Design System CSS Variables (`src/app/globals.css`):** Mapped tokens (lines 5-22: `--background: #FAFAF8`, `--surface: #FFFFFF`, `--accent: #5B6EF5`, `--success: #16A34A`, `--warning: #D97706`, `--error: #DC2626`, `--radius-card: 16px`).
* **Existing Page Structure (`src/app/(dashboard)/cases/[id]/page.tsx`):** Demonstrates use of `PageContainer`, `Card`, and server actions like `getCaseById` and `getDocumentsByCase` to fetch and render case context.
* **Findings Database Schema (`src/types/database.ts`):** 
  * `findings` table (lines 223-266) containing `id`, `case_id`, `category`, `description`, `severity`, `status`, and `title`.
  * `finding_documents` table (lines 193-222) providing many-to-many relationship mapping between `finding_id` and `document_id`.
* **Findings Server Actions (`src/features/findings/actions/index.ts`):** Implements `analyzeDocuments` and `updateFindingStatus`. No fetch action is currently present.
* **Components Directory:** Inventory check of `src/components/` showed that the complex workspace components `DocumentViewer` and `DocumentComparisonPanel` are defined in documentation but not yet implemented on disk.

---

## 2. Logic Chain
1. **Design Token Alignment:** The project has strict Tailwind constraints mapping CSS variables to theme classes (Observation 1, 2). Any UI component (`FindingCard`, `DocumentComparisonPanel`) must strictly consume these pre-configured classes (e.g., `rounded-card`, `bg-surface`, `text-text-primary`, `border-accent`, etc.) to prevent build and lint rejections.
2. **Type Safety & No Bypass Rule:** The project prohibits type bypasses such as `as any` or `@ts-ignore` (Observation: `AGENTS.md` rules). Therefore, nested Supabase join queries that result in complex typings are high-risk. Implementing separate fetches (e.g., fetching findings and documents separately) and matching them in memory offers clean, compiler-supported typing without type coercion.
3. **Storage Security Constraints:** uploaded documents are stored in Supabase storage and governed by RLS (Observation: `uploadDocument` uploads to bucket `'documents'`). To render these files in the browser via standard `<iframe src={...}>` or `<img>` without authorization errors, short-lived signed URLs are mandatory.
4. **Workspace Interactivity:** Selecting a finding must update the side-by-side view (Observation: `FINDINGS_SYSTEM.md`). This means the findings workspace needs to be a React Client Component that coordinates selection state, triggers URLs signing on selection, and calls the `updateFindingStatus` server action.

---

## 3. Caveats
* We assumed that the storage bucket `'documents'` is indeed private. If it is public, signed URLs are not strictly required, though they remain standard practice for sensitive files.
* We have not fully evaluated any OCR coordinates/bounding box schemas since they do not exist in the database types. Highlighting matching fields in `DocumentComparisonPanel` is assumed to be text-based comparisons of mismatch fields for now.

---

## 4. Conclusion
We recommend:
1. Creating a new page at `src/app/(dashboard)/cases/[id]/findings/page.tsx` that serves as the entry point for Findings Review.
2. Adding a client-side workspace component `src/features/findings/components/FindingsReviewWorkspace.tsx` that coordinates interactive selections and updates.
3. Implementing `FindingCard.tsx` under `src/features/findings/components/` and `DocumentComparisonPanel.tsx`/`DocumentViewer.tsx` under `src/components/review/`.
4. Adding `getFindingsByCase` to `src/features/findings/actions/index.ts` and `getSignedUrlsForDocuments` to `src/features/documents/actions/index.ts`.

---

## 5. Verification Method
* To verify that our design recommendations align with project health:
  1. Inspect `npm run lint` and `npm run build` behavior.
  2. Confirm `src/types/database.ts` schema properties match our query proposals.
