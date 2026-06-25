# Data Models

## Overview
This document defines the core entities for Veldra's Case-centric architecture. (Architectural documentation only).

## 1. Case (Root Entity)
- **Purpose**: Represents the entire verification workspace for a specific application.
- **Required Fields**: `id`, `status` (Enum: Draft, Uploaded, Processing, NeedsReview, Reviewed, ReadyForExport, Exported, Archived), `createdAt`, `updatedAt`.
- **Relationships**:
  - Has One: `Applicant`
  - Has Many: `Document`
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
- **Purpose**: Represents a single uploaded file.
- **Required Fields**: `id`, `caseId`, `type` (Enum: PSABirth, PSAMarriage, TOR, SF10, Diploma), `filePath` (Storage path), `fileName`, `fileSize`, `mimeType`, `status`, `uploadedBy` (Auth user).
- **Relationships**:
  - Belongs To: `Case`
  - Many-to-Many: `Finding`

## 4. Finding
- **Purpose**: Represents a discrepancy detected by the Comparison Engine.
- **Required Fields**: `id`, `caseId`, `title`, `description`, `severity`, `category`, `status`.
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
