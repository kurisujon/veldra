# Audit Logging Strategy

Veldra requires rigorous audit logging to maintain accountability and compliance throughout the document verification process.

## Required Log Events

### Document Lifecycle
- `DOCUMENT_UPLOADED`: When a new document is added to a case.
- `DOCUMENT_DELETED`: When a document is removed.

### Findings Lifecycle
- `FINDING_GENERATED`: When the comparison engine creates a new finding.
- `FINDING_ACCEPTED`: When a reviewer confirms a finding.
- `FINDING_RESOLVED`: When a reviewer manually fixes the data to resolve a finding.
- `FINDING_IGNORED`: When a reviewer dismisses a finding.

### Draft Lifecycle
- `DRAFT_GENERATED`: When an Affidavit or Letter is created.
- `DRAFT_EDITED`: When manual edits are saved to a draft.
- `DRAFT_DELETED`: When a draft is discarded.

### Case Lifecycle
- `CASE_CREATED`: When a new case is initiated.
- `CASE_STATUS_CHANGED`: When the case transitions (e.g., Processing -> Needs Review).
- `EXPORT_CREATED`: When the final package is generated.
- `CASE_ARCHIVED`: When the case is moved to cold storage.

## Log Structure
Each audit log entry must contain:
- Timestamp
- User ID (who performed the action)
- Role (user role context)
- Case ID (context)
- Event Type
- Metadata (JSON payload with specifics, e.g., the specific Finding ID or before/after values)
