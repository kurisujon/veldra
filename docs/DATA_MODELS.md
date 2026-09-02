# Data Models

## Overview
This document defines the core entities for Veldra's Case-centric architecture. (Architectural documentation only).

## 1. Case (Root Entity)
- **Purpose**: Represents the entire verification workspace for a specific application.
- **Required Fields**: `id`, `status` (Enum: Draft, Uploaded, Processing, NeedsReview, Reviewed, ReadyForExport, Exported, Archived), `createdAt`, `updatedAt`.
- **Relationships**:
  - Has One: `Applicant`
  - Has Many: `Document`
  - Has Many: `Sponsor` (max 2)
  - Has Many: `Finding`
  - Has Many: `GeneratedDraft`
  - Has Many: `ExportPackage`
  - Has Many: `ActivityLog`

## 2. Applicant
- **Purpose**: Represents the student whose documents are being verified.
- **Required Fields**: `id`, `caseId`, `firstName`, `lastName`, `dateOfBirth`.
- **Relationships**:
  - Belongs To: `Case`

## 3. Document
- **Purpose**: Represents a single uploaded file belonging to either the Applicant or a Sponsor.
- **Required Fields**: `id`, `caseId`, `type` (Enum: PSABirth, PSAMarriage, TOR, SF10, Diploma, ValidID, BankStatement, ProofOfBilling), `filePath`, `fileName`, `fileSize`, `mimeType`, `status`, `uploadedBy`.
- **New Fields (Phase 7.5)**: `owner_type` (Enum: `applicant` | `sponsor`, default `applicant`), `sponsor_id` (nullable FK to `sponsors`).
- **Relationships**:
  - Belongs To: `Case`
  - Belongs To: `Sponsor` (nullable)
  - Many-to-Many: `Finding`

## 3.5. Sponsor
- **Purpose**: Represents a financial sponsor (e.g., parent, guardian) linked to an Applicant Case.
- **Business Rule**: A case may have a **maximum of 2 sponsors**, enforced by the `add_sponsor_to_case` RPC.
- **Required Fields**: `id`, `caseId`, `firstName`, `lastName`, `relationship`.
- **Relationships**:
  - Belongs To: `Case`
  - Has Many: `Document` (sponsor documents like Bank Statements, Proof of Billing)

## 4. Finding
- **Purpose**: Represents a discrepancy detected by the deterministic Verification Rules Engine.
- **Required Fields**: `id`, `caseId`, `title`, `description`, `severity` (Enum: High, Medium, Low, **Warning**), `category` (Enum: Name Mismatch, Address Mismatch, Date Mismatch, Age Calculation Issue, School Gap, Missing Information, **Identity**), `status`.
- **New Fields (Phase 7.5)**: `finding_scope` (Enum: `applicant_only` | `sponsor_only` | `applicant_and_sponsor`, default `applicant_only`).
- **Business Rule**: Findings with `finding_scope = sponsor_only` or `applicant_and_sponsor` are assigned `Warning` severity and **never auto-fail a case**.
- **Relationships**:
  - Belongs To: `Case`
  - Many-to-Many: `Document` (sourceDocuments)

## 5. GeneratedDraft
- **Purpose**: Represents an Affidavit or Letter generated from Findings.
- **Required Fields**: `id`, `caseId`, `type` (Enum: Affidavit, AddressLetter, GapLetter), `content` (HTML/Rich Text), `status` (Draft, Finalized).
- **Relationships**:
  - Belongs To: `Case`
  - Has Many: `Finding` (The findings that triggered this draft)

## 6. ExportPackage
- **Purpose**: A bundled artifact representing the finalized review.
- **Required Fields**: `id`, `caseId`, `packageUrl`, `format` (PDF, ZIP), `generatedAt`.
- **Relationships**:
  - Belongs To: `Case`

## 7. ActivityLog
- **Purpose**: Audit trail of actions performed on an Applicant Case.
- **Required Fields**: `id`, `caseId`, `actionType`, `description`, `userId`, `role`, `timestamp`.
- **Relationships**:
  - Belongs To: `Case`

## 8. Extraction Evidence
- **Purpose**: Stores the human-reviewable candidate data and its immutable OCR evidence for a document.
- **Entities**: `document_extractions` owns `document_fields`, `ocr_pages`, and `ocr_spans`; `field_evidence` joins candidate fields to the canonical OCR spans that support them.
- **Re-run Rule**: Direct deletion of extraction fields and canonical evidence remains Admin-only. An authenticated Admin or Reviewer must use the narrowly scoped `replace_document_extraction_data(p_extraction_id)` `SECURITY DEFINER` RPC before a re-run. It derives the caller from `auth.uid()`, checks `get_user_role()`, and deletes only the supplied extraction's dependent field and OCR data.
- **Trust Boundary**: Re-runs replace candidate evidence only. They do not make any candidate field verified; verification remains exclusively controlled by `verify_document_field`.
- **Invalid Evidence Rule**: A candidate whose evidence fails deterministic validation is persisted as `ambiguous`, never as an unrecognized `rejected` state. This preserves the database state constraint and requires human review.
