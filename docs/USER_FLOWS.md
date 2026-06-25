# User Flows

## 1. Upload Flow
1. User selects "New Application".
2. User enters Applicant Name and basic details.
3. User navigates to Document Upload area.
4. User drag-and-drops or selects files for: PSA Birth Certificate, PSA Marriage Certificate (if applicable), TOR, SF10, Diploma.
5. System displays loading state ("Processing documents...") while extraction runs.
6. System confirms successful upload and extraction.

## 2. Review Flow
1. User enters the "Document Review" workspace.
2. User views the original document on the left panel, and extracted data on the right.
3. System flags inconsistencies (e.g., "Address mismatch between Birth Cert and TOR").
4. User can click on a flag to view details.
5. User manually verifies, edits, or accepts the extracted data and flagged issues.
6. User marks document as "Reviewed".

## 3. Generated Document Flow
1. Based on confirmed discrepancies, user clicks "Generate Drafts".
2. System prompts user to select which drafts to generate (e.g., Affidavit of Discrepancy for Name, Address Explanation Letter, School Gap Explanation).
3. System generates drafts using standardized templates and verified data.
4. User previews the drafts in a rich text editor.
5. User makes manual adjustments if necessary.

## 4. Export Flow
1. User selects "Export Package".
2. System bundles the reviewed documents, extraction summary, and finalized generated drafts.
3. User selects format (PDF, DOCX for drafts).
4. System downloads a consolidated ZIP or single PDF.
