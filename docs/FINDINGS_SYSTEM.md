# Findings System

## Overview
A "Finding" is the core unit of discrepancy management in Veldra. The platform does not simply highlight text; it generates structured Findings that the document verification staff must actively resolve.

## Finding Entity Properties
- `id`: Unique identifier for the finding.
- `title`: Short, human-readable summary (e.g., "First Name Spelling Mismatch").
- `description`: Detailed explanation of the discrepancy.
- `severity`: Impact level of the issue.
- `category`: Classification of the discrepancy.
- `status`: Current resolution state.
- `sourceDocuments`: Array of document IDs where the discrepancy was found.
- `createdAt`: Timestamp.

## Severities
- **High**: Critical mismatch requiring an Affidavit (e.g., Name mismatch between Birth Cert and Diploma).
- **Medium**: Discrepancy requiring an Explanation Letter (e.g., School gap, Address formatting).
- **Low**: Minor inconsistencies that may be ignored (e.g., minor typo in a non-critical field).

## Categories
- **Name Mismatch**: Discrepancies in First, Middle, or Last names.
- **Address Mismatch**: Inconsistencies in residential addresses across documents.
- **Date Mismatch**: Conflicting dates (e.g., Enrollment date before Birth Date).
- **Age Calculation Issue**: Age at graduation does not align with birth date.
- **School Gap**: Missing academic records or unexplained gaps in years.
- **Missing Information**: Required fields are blank or unreadable.

## Statuses
- **Open**: Finding detected, awaiting human review.
- **Accepted**: Reviewer agrees with the finding; draft generation required.
- **Resolved**: Reviewer manually corrected the underlying extracted data, negating the finding.
- **Ignored**: Reviewer dismisses the finding as a non-issue.

## Display and Review Process
- Findings are displayed in a dedicated `FindingCard` component within the Document Review Workspace.
- Selecting a Finding automatically opens the relevant `sourceDocuments` in the `DocumentComparisonPanel` side-by-side, highlighting the exact fields in question.
- Reviewers must explicitly set the status of every "Open" finding before the case can proceed to "Reviewed".
