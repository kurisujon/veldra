# Case Workflow

## Lifecycle Overview
The Veldra platform organizes all verification work through a strict Applicant Case lifecycle. Cases move linearly through the following statuses, representing the completeness of the review process.

## Status Definitions

### 1. Draft
- **Purpose**: Initial creation state of a case before documents are provided.
- **Entry Conditions**: Case created via manual entry or API.
- **Exit Conditions**: Required documents are uploaded.
- **Allowed Actions**: Edit applicant info, upload documents, delete case.

### 2. Uploaded
- **Purpose**: Documents are present but have not been processed by the extraction engine.
- **Entry Conditions**: Minimum required documents are successfully uploaded.
- **Exit Conditions**: Automatic trigger to extraction engine.
- **Allowed Actions**: Add/remove documents, trigger processing.

### 3. Processing
- **Purpose**: System is actively extracting data and running the Cross-Document Comparison Engine.
- **Entry Conditions**: Extraction engine triggered.
- **Exit Conditions**: Extraction and comparison complete successfully.
- **Allowed Actions**: Cancel processing, view progress.

### 4. Needs Review
- **Purpose**: Processing is complete and the system has generated Findings. Awaits human verification.
- **Entry Conditions**: Extraction and comparison complete.
- **Exit Conditions**: All Findings are either Accepted, Resolved, or Ignored, and reviewer clicks "Complete Review".
- **Allowed Actions**: Review documents, manage findings, edit extracted data.

### 5. Reviewed
- **Purpose**: Human review is complete, and discrepancies are verified.
- **Entry Conditions**: Reviewer marks case as "Reviewed".
- **Exit Conditions**: Drafts are generated based on Findings.
- **Allowed Actions**: Generate drafts, revert to Needs Review.

### 6. Draft Generated
- **Purpose**: System has created necessary Affidavits or Letters.
- **Entry Conditions**: At least one draft is generated.
- **Exit Conditions**: All drafts are approved and case is marked ready for export.
- **Allowed Actions**: Edit drafts, delete drafts, regenerate drafts.

### 7. Ready For Export
- **Purpose**: All documents, findings, and drafts are finalized and waiting to be bundled.
- **Entry Conditions**: Reviewer marks case as Ready for Export.
- **Exit Conditions**: Export package is generated.
- **Allowed Actions**: Generate export package, revert to Reviewed.

### 8. Exported
- **Purpose**: The final verification package has been downloaded or sent to external systems.
- **Entry Conditions**: Export package generation completes.
- **Exit Conditions**: Manual archival.
- **Allowed Actions**: Download package, re-export, archive case.

### 9. Archived
- **Purpose**: Historical storage for completed or abandoned cases.
- **Entry Conditions**: Case manually archived by user.
- **Exit Conditions**: Case restored.
- **Allowed Actions**: View read-only data, restore case.
