# Phase 5 Frontend UI Analysis & Recommendations

## Overview
This document analyzes the frontend architectural requirements for the Phase 5 Document Analysis and Findings Engine. It outlines layout designs, component interfaces, state management, fetching patterns, and new server actions needed to support the interactive verification review workspace.

---

## 1. Page Layout & User Workspace Experience

To maintain Veldra’s **Case-Centric Architecture** and minimalist design philosophy, we propose a dedicated workspace for reviewing case findings:

* **Route:** `/cases/[id]/findings` (or embedded dynamically within the Case Detail view under a tab).
* **Workspace Structure:**
  * **Top Bar / Navigation:** A clean header showing back navigation (`/cases/[id]`), the Applicant Name, and the overall Case Status.
  * **Workspace Split-Pane:** A horizontal split (or flex container):
    * **Left Sidebar (Width: ~35% / 400px):** A scrollable list displaying `FindingCard`s grouped by severity (High, Medium, Low).
    * **Right Comparison Pane (Width: ~65% / Flex-1):** Renders the `DocumentComparisonPanel`. When no finding is selected, it shows a clean placeholder ("Select a finding to begin comparison review"). Once selected, it displays the source documents side-by-side.

---

## 2. Component Design Recommendations

### A. FindingCard Component
* **Path:** `src/features/findings/components/FindingCard.tsx`
* **Purpose:** Group and display individual findings, allowing quick categorization, status inspection, and user interaction.
* **Styling Tokens:** Must consume tokens in `DESIGN_SYSTEM.md` (Card radius `16px`, borders, hover transitions, and semantic badges).

#### Component Interface (`FindingCardProps`)
```typescript
import type { Database } from '@/types/database';

type FindingSeverity = Database['public']['Enums']['finding_severity'];
type FindingCategory = Database['public']['Enums']['finding_category'];
type FindingStatus = Database['public']['Enums']['finding_status'];

export interface FindingCardProps {
  finding: {
    id: string;
    title: string;
    description: string;
    severity: FindingSeverity;
    category: FindingCategory;
    status: FindingStatus;
  };
  isSelected?: boolean;
  onSelect?: () => void;
  onStatusChange?: (status: FindingStatus) => void;
  isUpdating?: boolean;
}
```

#### Layout & Visual Design
* **Header:** Displays the category name (e.g. "Name Mismatch") in small, muted text (`text-small text-text-secondary`) and a status/severity indicator badge.
  * **Severity Mappings:**
    * `High`: Red indicator badge (`bg-error/10 text-error`)
    * `Medium`: Amber indicator badge (`bg-warning/10 text-warning`)
    * `Low`: Gray/Neutral indicator badge (`bg-background text-text-secondary`)
* **Title:** Bold text (`text-heading font-semibold text-text-primary mt-sm`).
* **Description:** Readable text (`text-small text-text-secondary mt-xs line-clamp-2` when unselected; full view when selected).
* **Selection State:** Active cards are outlined with a `2px border-accent` (#5B6EF5). Hovering over cards applies a transition (`hover:bg-background/50`).
* **Action Footer:** Appears for `Open` findings. Offers primary controls:
  * **Accept Button:** (`variant="primary"`) to flag for affidavit/letter generation. Sets status to `Accepted`.
  * **Ignore Button:** (`variant="secondary"`) to dismiss the mismatch. Sets status to `Ignored`.
  * If the status is already `Accepted`, `Ignored`, or `Resolved`, it displays the corresponding state badge (`Success` for Resolved, `Primary` for Accepted, `Neutral` for Ignored).

---

### B. DocumentViewer Component
* **Path:** `src/components/review/DocumentViewer.tsx`
* **Purpose:** Render a single document file (PDF or Image) with zoom/page controls.
* **Layout Design:** 
  * Lightweight wrapper around native browser elements to avoid bloated external dependencies.
  * Checks MIME type:
    * If `application/pdf`, embeds using `<iframe src={signedUrl} className="w-full h-full border-0" />`.
    * If `image/jpeg` or `image/png`, renders an `<img>` tag wrapped in a zoomable CSS wrapper.
  * Controls header: Zoom In/Out buttons, fit-to-width toggle.

```typescript
export interface DocumentViewerProps {
  fileName: string;
  signedUrl: string;
  mimeType: string;
}
```

---

### C. DocumentComparisonPanel Component
* **Path:** `src/components/review/DocumentComparisonPanel.tsx`
* **Purpose:** dual-pane workspace showing comparison documents side-by-side.

#### Component Interface (`DocumentComparisonPanelProps`)
```typescript
import type { Database } from '@/types/database';

type DocumentRow = Database['public']['Tables']['documents']['Row'];

export interface DocumentComparisonPanelProps {
  documents: DocumentRow[];
  selectedFinding?: {
    id: string;
    title: string;
    description: string;
    category: string;
  } | null;
  signedUrls: Record<string, string>; // Maps documentId -> signedUrl
  isPendingUrls?: boolean;
}
```

#### Layout & Visual Design
* **Dual-Pane Shell:** Two identical flex containers aligned horizontally (`grid grid-cols-2 divide-x divide-text-secondary/10 h-full bg-surface rounded-card`).
* **Document Selectors:** If a finding links to more than two documents, each pane provides a custom dropdown selector to let the reviewer toggle which documents are shown.
* **Summary Banner:** A header at the top of the comparison panel summarizing the mismatch (e.g. comparing Birth Certificate Name against transcript Name).
* **Synced Scrolling Toggle:** A toggle switch allowing reviewers to scroll both panes simultaneously if they are looking at similar documents (e.g. TOR vs SF10).

---

## 3. Data Fetching & State Strategy

### Fetching Strategy (Server Component Pattern)
To ensure type-safety and eliminate the need for type overrides (abiding by the strict **NO Type Bypasses** rule in `AGENTS.md`), we propose fetching findings and document records separately in the Server Component and coordinating mapping in-memory:

1. The page fetches all findings using `getFindingsByCase(caseId)`.
2. The page fetches all documents using the existing `getDocumentsByCase(caseId)`.
3. The server filters and maps which document records match which findings via the junction table IDs (`finding_documents`).
4. This keeps DB queries fast, leverages Supabase indexes, and yields typed interfaces directly compiled from `database.ts`.

### Storage Authentication (Signed URLs)
Because case documents contain PII (Birth Certificates, transcripts) protected by storage RLS, they cannot be served via public links.
* We must resolve **Signed URLs** for files dynamically.
* To avoid calling storage endpoints for all files at once, the client workspace component should fetch signed URLs *on demand* when a finding is selected.
* When `selectedFindingId` changes, a client transition triggers a server action `getDocumentSignedUrls(documentPaths: string[])` to retrieve short-lived tokens (e.g. 1 hour).

---

## 4. Proposed Server Actions & Helpers

We suggest adding/extending actions under `src/features/findings/actions/index.ts` and `src/features/documents/actions/index.ts`.

### A. Fetch Case Findings Action
Add this to `src/features/findings/actions/index.ts`:

```typescript
type FindingWithDocIds = Database['public']['Tables']['findings']['Row'] & {
  documentIds: string[];
};

export async function getFindingsByCase(caseId: string): Promise<FindingWithDocIds[]> {
  const supabase = getLocalClient();

  // 1. Fetch findings
  const { data: findings, error: findingsError } = await supabase
    .from('findings')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });

  if (findingsError) {
    throw new Error(`Failed to fetch findings: ${findingsError.message}`);
  }

  if (!findings || findings.length === 0) return [];

  // 2. Fetch the document links for these findings
  const findingIds = findings.map((f) => f.id);
  const { data: links, error: linksError } = await supabase
    .from('finding_documents')
    .select('finding_id, document_id')
    .in('finding_id', findingIds);

  if (linksError) {
    throw new Error(`Failed to fetch finding documents: ${linksError.message}`);
  }

  // 3. Map linked document IDs back to findings
  return findings.map((finding) => {
    const documentIds = (links || [])
      .filter((link) => link.finding_id === finding.id)
      .map((link) => link.document_id);

    return {
      ...finding,
      documentIds,
    };
  });
}
```

### B. Generate Signed URLs Action
Add this to `src/features/documents/actions/index.ts`:

```typescript
const SignedUrlsSchema = z.object({
  filePaths: z.array(z.string().min(1)),
});

export async function getSignedUrlsForDocuments(filePaths: string[]): Promise<Record<string, string>> {
  const parsed = SignedUrlsSchema.safeParse({ filePaths });
  if (!parsed.success) {
    throw new Error('Invalid file paths format');
  }

  const supabase = getLocalClient();
  const { filePaths: paths } = parsed.data;
  
  if (paths.length === 0) return {};

  // Request short-lived signed URLs (valid for 1 hour / 3600 seconds)
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrls(paths, 3600);

  if (error) {
    throw new Error(`Failed to generate signed URLs: ${error.message}`);
  }

  // Map original path to signed URL for easy client lookup
  const urlMap: Record<string, string> = {};
  data.forEach((item) => {
    if (item.error) {
      console.error(`Error signing path ${item.path}:`, item.error);
    } else if (item.signedUrl) {
      urlMap[item.path] = item.signedUrl;
    }
  });

  return urlMap;
}
```

### C. Update Finding Status Action
The existing `updateFindingStatus` server action in `src/features/findings/actions/index.ts` works perfectly as-is:
```typescript
export async function updateFindingStatus(
  findingId: string, 
  caseId: string, 
  status: 'Open' | 'Accepted' | 'Resolved' | 'Ignored'
)
```
It validates input with Zod, checks authorization, updates findings, records the activity log, and calls `revalidatePath` to refresh the UI. This is already implemented and can be invoked directly by the client components.
