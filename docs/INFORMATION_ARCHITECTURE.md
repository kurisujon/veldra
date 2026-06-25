# Information Architecture

## Core Philosophy
Veldra utilizes a **Case-Centric Architecture**. The system organizes all work around "Applicant Cases" rather than isolated documents. The product is a review workspace for document verification staff, emphasizing focused evaluation over conversational interactions.

## Top-Level Navigation
1. **Dashboard**: High-level overview of active cases, recent activity, and system metrics.
2. **Cases**: Primary list view of all Applicant Cases with filtering and sorting by status.
3. **Drafts**: Global repository of all generated Affidavits and Letters across all cases.
4. **Exports**: History and access point for all finalized Export Packages.
5. **Settings**: Configuration for users, organization defaults, and templates.

## The Applicant Case Workspace
The primary workspace for reviewers. Each Case is a unified environment containing:

- **Applicant Information**: Core biographic details and application metadata.
- **Uploaded Documents**: Organized repository of the applicant's files (PSA Birth, PSA Marriage, TOR, SF10, Diploma).
- **Findings**: Centralized list of all discrepancies and issues detected by the comparison engine.
- **Generated Drafts**: Dedicated area for Affidavits and Explanation Letters linked to this specific case.
- **Export History**: Logs of previously generated export packages for this applicant.
- **Activity Timeline**: Chronological log of status changes, reviews, and generations.

## Navigation Hierarchy
- / (Dashboard)
- /cases (Cases List)
  - /cases/[id] (Applicant Case Overview)
  - /cases/[id]/documents (Document Viewer Workspace)
  - /cases/[id]/findings (Findings Review)
  - /cases/[id]/drafts (Draft Generation & Editing)
- /drafts (Global Drafts)
- /exports (Global Exports)
- /settings (System Configuration)
