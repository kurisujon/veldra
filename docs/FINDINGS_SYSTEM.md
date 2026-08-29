# Findings System

## Overview
A "Finding" is the core unit of discrepancy management in Veldra. The platform does not simply highlight text; it generates structured Findings that the document verification staff must actively resolve. 

With Phase 10, the engine now logs **every** rule evaluation (both passed and failed) into `comparison_results` to provide a complete audit trail. Only the discrepancies (failed rules) are copied to the `findings` table for manual review.

## Architecture & Data Flow (Phase 10)
- **Applicant Verification**: Rules scoped to `applicant_internal` verify consistency across all applicant docs.
- **Sponsor Verification**: Rules scoped to `sponsor_internal` verify sponsor ID vs COE vs ITR. Mismatches here never auto-fail a case (Severity is capped at `Warning`).
- **Relationship Verification**: Constructs strict evidence chains (e.g. Applicant PSA -> Parent PSA -> Sponsor ID) to prove relationships. Tracked in `sponsor_relationships` and `relationship_evidence`.

## Finding Entity Properties
- `id`: Unique identifier for the finding.
- `title`: Short, human-readable summary (e.g., "First Name Spelling Mismatch").
- `description`: Detailed explanation of the discrepancy.
- `severity`: Impact level of the issue.
- `category`: Classification of the discrepancy.
- `status`: Current resolution state.
- `finding_scope`: Scope of the finding (`applicant_internal`, `sponsor_internal`, `cross_entity`).
- `sourceDocuments`: Array of document IDs where the discrepancy was found.
- `createdAt`: Timestamp.

## Severities
- **High**: Critical mismatch requiring an Affidavit (e.g., Name mismatch between Birth Cert and Diploma).
- **Medium**: Discrepancy requiring an Explanation Letter (e.g., School gap, Address formatting).
- **Low**: Minor inconsistencies that may be ignored (e.g., minor typo in a non-critical field).
- **Warning**: Significant discrepancy but does not block the applicant (e.g., Sponsor income discrepancy).

## Categories
- **Name Mismatch**: Discrepancies in First, Middle, or Last names.
- **Address Mismatch**: Inconsistencies in residential addresses across documents.
- **Date Mismatch**: Conflicting dates (e.g., Enrollment date before Birth Date).
- **Age Calculation Issue**: Age at graduation does not align with birth date.
- **School Gap**: Missing academic records or unexplained gaps in years.
- **Missing Information**: Required fields are blank or unreadable.
- **Identity**: Suspected identity mismatch across core documents.
- **Employment Mismatch**: Inconsistency in sponsor employment records.
- **Income Discrepancy**: Sponsor income mismatch across COE and ITR.
- **Document Validity**: Expired or invalid documents.
- **Relationship Evidence**: Broken or missing evidence chain connecting Applicant to Sponsor.

## Statuses
- **Open**: Finding detected, awaiting human review.
- **Accepted**: Reviewer agrees with the finding; draft generation required.
- **Resolved**: Reviewer manually corrected the underlying extracted data, negating the finding.
- **Ignored**: Reviewer dismisses the finding as a non-issue.

## Display and Review Process
- Evaluation results are displayed in a 3-tab layout in `CaseFindingsWorkspace`: **Applicant**, **Sponsor**, and **Relationship**.
- **Verified Matches** (from `comparison_results`) are shown alongside discrepancies, allowing reviewers to see exactly what passed.
- Selecting a discrepancy automatically opens the relevant `sourceDocuments` in the `DocumentComparisonPanel` side-by-side, highlighting the exact fields in question.
- Reviewers must explicitly set the status of every "Open" finding before the case can proceed to "Reviewed".

## Layer 3 Zero-Trust Boundary

Phase 11.6 introduced a strict trust boundary between document extraction and the comparison engine. The comparison engine is fundamentally restricted from processing any 'candidate', 'unreadable', 'ambiguous', or legacy 'null' state fields. All comparison modules automatically filter incoming DocumentField objects via the `getVerifiedFields` helper, ensuring only strictly human-verified ('state === verified') fields can generate findings.
