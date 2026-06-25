# Veldra Project Overview — Updated Architecture and Generation Strategy

## 1. Project Summary

**Veldra** is a **document verification and legal-draft generation platform** designed to help verification staff process applicant documents, detect discrepancies across multiple records, and generate supporting legal/administrative outputs such as **Affidavits of Discrepancy** and **Explanation Letters**.

The platform is intentionally designed as a **tool-based verification system**, not a chatbot. Its workflow begins with uploaded source files such as **PDF, PNG, JPG, and JPEG documents**, extracts and structures their contents, performs deterministic cross-document verification, and then generates formal outputs based on verified findings.

Veldra’s current design should be understood as a **document ingestion + extraction + cross-checking + document generation pipeline**, rather than only a comparison engine.

---

# 2. Core Product Positioning

## 2.1 What Veldra is

Veldra is a platform for:

* receiving uploaded applicant documents
* extracting and structuring document data
* comparing document contents across multiple files
* flagging inconsistencies and verification findings
* generating formal supporting documents such as affidavits and explanation letters
* exporting final reports and document packages for operational use

## 2.2 What Veldra is not

Veldra is **not** primarily designed as:

* a conversational chatbot
* an LLM-first assistant
* a free-form AI drafting tool
* a system that relies on generative AI for core verification decisions

The system is designed to be:

* predictable
* auditable
* structured
* suitable for verification staff and operational review workflows

---

# 3. Updated Business Context

## 3.1 Initial assumption

The earlier assumption was that Veldra would operate mainly on **already structured records**, where values such as name, birth date, and address were already stored in a database and ready for comparison.

## 3.2 Actual client workflow

The client clarified that staff upload or receive files in the following formats:

* **PDF**
* **PNG**
* **JPG / JPEG**

These files may come from:

* direct uploads by staff
* documents sent by customers via **email**
* documents sent by customers via **Facebook Messenger**
* phone-captured images or scans of physical documents

This means Veldra often starts with **raw source files**, not ready-made structured records.

---

# 4. Architectural Reframing

## 4.1 Old framing

**Old framing:**

> “Veldra is a cross-document comparison engine.”

This is incomplete.

## 4.2 Updated framing

**Updated framing:**

> **Veldra is a document ingestion, extraction, verification, and legal-draft generation platform.**

The full Veldra lifecycle should now be documented as:

1. **Receive uploaded documents**
2. **Extract readable data from those files**
3. **Convert extracted data into structured fields**
4. **Normalize and compare those fields across documents**
5. **Produce findings and review statuses**
6. **Generate legal / administrative output documents from verified findings**
7. **Export final outputs and case packages**

---

# 5. High-Level Veldra Workflow

The complete Veldra workflow should be treated as the following pipeline:

## Stage 1 — Document Intake / Upload

Receive uploaded document files and store them with metadata.

## Stage 2 — Extraction

Extract text and raw document content from PDFs and images.

## Stage 3 — Structuring / Parsing

Map extracted text into structured document fields.

## Stage 4 — Normalization

Standardize values for reliable comparison.

## Stage 5 — Cross-Document Verification

Compare structured values across documents and generate findings.

## Stage 6 — Review / Correction

Allow staff to inspect extracted values, correct errors, and finalize findings.

## Stage 7 — Legal / Administrative Document Generation

Generate affidavits, explanation letters, and related outputs from verified findings.

## Stage 8 — Export / Packaging

Produce downloadable reports and finalized document bundles.

---

# 6. Supported File Inputs

Veldra must support the following source file types:

* **PDF**
* **PNG**
* **JPG**
* **JPEG**

## 6.1 PDF handling

PDFs can be:

### A. Text-based PDFs

Examples:

* digitally generated forms
* typed application PDFs
* system-exported statements or certificates

These may support direct text extraction.

### B. Scanned PDFs

Examples:

* scanned copies of printed documents
* phone scans converted to PDF
* image-only PDFs

These usually require OCR or equivalent extraction processing.

## 6.2 Image handling

PNG / JPG / JPEG files are image sources and must be processed before comparison.

Examples:

* ID photos
* scanned certificates
* proof-of-billing images
* Messenger-downloaded document images
* photographed forms

---

# 7. Veldra System Modules

Veldra should be documented as having the following major modules.

## 7.1 Document Upload Module

Handles file intake, validation, storage, and metadata association.

## 7.2 Document Extraction Module

Handles text extraction from PDFs and OCR / image-text extraction from image-based uploads.

## 7.3 Document Parsing / Structuring Module

Converts raw extracted text into structured document fields.

## 7.4 Normalization Module

Standardizes extracted values for comparison.

## 7.5 Cross-Document Verification Engine

Performs deterministic comparison of structured document fields.

## 7.6 Findings / Discrepancy Module

Stores and presents mismatches, missing fields, and review flags.

## 7.7 Verification Review Module

Allows staff to inspect original files, extracted values, and findings.

## 7.8 Document Generation Module

Generates affidavits, explanation letters, and related formal outputs from verified case data.

## 7.9 Export / Packaging Module

Exports reports, generated documents, and case bundles.

## 7.10 Audit / History Module

Tracks uploads, extraction attempts, review edits, findings history, and generated outputs.

---

# 8. Detailed Functional Pipeline

# 8.1 Stage 1 — Document Intake / Upload

## Purpose

Accept and store uploaded source documents for verification processing.

## Inputs

* `.pdf`
* `.png`
* `.jpg`
* `.jpeg`

## Responsibilities

* validate file type
* validate file size
* store original source file
* associate file with case / applicant / submission
* capture source metadata
* optionally record document category at upload time

## Minimum metadata per file

Each uploaded document should track at least:

* `file_id`
* `case_id` or `submission_id`
* `original_filename`
* `mime_type`
* `storage_path`
* `uploaded_by`
* `upload_source` (`manual`, `email`, `messenger`, `other`)
* `document_type_claimed` (if known)
* `uploaded_at`

---

# 8.2 Stage 2 — Extraction

## Purpose

Extract raw textual content from uploaded documents.

## Extraction behavior by file type

### A. Text-based PDF

Attempt direct text extraction.

### B. Scanned PDF

Use OCR / scan extraction pipeline.

### C. PNG / JPG / JPEG

Use OCR / image-text extraction pipeline.

## Output of this stage

The output should be:

* raw extracted text
* extraction method used
* extraction confidence or quality indicators if available
* extraction status / warnings

---

# 8.3 Stage 3 — Structuring / Parsing

## Purpose

Convert raw extracted content into structured document records.

## Example structured record

```json
{
  "document_type": "proof_of_billing",
  "full_name": "Juan Dela Cruz",
  "address": "Purok 3, Obrero, Davao City",
  "statement_date": "2026-06-12",
  "account_number": "ACC-12345",
  "source_file_id": "doc_001"
}
```

## Possible extracted fields

Depending on the document type, Veldra may structure fields such as:

* full name
* first name / middle name / last name / suffix
* birth date
* age
* address
* barangay / city / province
* document number / ID number / account number
* issue date / expiry date
* school / institution name
* billing address
* reference number
* contact number

## Important note

Field extraction is **document-type aware**.
A diploma, transcript, ID, proof of billing, and affidavit will not all share the same field structure.

---

# 8.4 Stage 4 — Normalization

## Purpose

Standardize extracted values before comparison.

## Example normalization actions

* convert dates to `YYYY-MM-DD`
* trim extra spaces
* standardize case / capitalization
* normalize abbreviations

  * `Brgy.` → `Barangay`
  * `Pk.` → `Purok`
* standardize punctuation where safe
* standardize phone number formatting
* normalize blank / null / placeholder values

## Why this matters

Normalization reduces false mismatches such as:

* `Brgy. Obrero` vs `Barangay Obrero`
* `Dela Cruz, Juan` vs `Juan Dela Cruz`
* `05/12/1999` vs `May 12, 1999`

---

# 8.5 Stage 5 — Cross-Document Verification

## Purpose

Compare structured fields across two or more records and produce a discrepancy result.

## Design principle

The comparison engine should be **deterministic**.
Its job is to apply explicit rules, not free-form generative reasoning.

## Comparison targets

Veldra may compare:

* document vs document
* document vs application record
* document vs internal case record
* document set vs expected applicant profile

## Field-level result types

Possible field outcomes:

* `match`
* `normalized_match`
* `partial_match`
* `mismatch`
* `missing_in_doc_a`
* `missing_in_doc_b`
* `needs_manual_review`

## Example result structure

```json
{
  "comparison_id": "cmp_001",
  "overall_status": "needs_manual_review",
  "checks": [
    { "field": "full_name", "status": "match" },
    { "field": "birth_date", "status": "match" },
    { "field": "address", "status": "partial_match" },
    { "field": "document_number", "status": "mismatch" }
  ]
}
```

---

# 8.6 Stage 6 — Review / Correction

## Purpose

Provide a verification workspace for human reviewers.

Because source files may be blurry, cropped, low quality, or inconsistently formatted, Veldra must support manual verification and correction.

## Reviewer actions should include:

* preview original uploaded file
* view extracted raw text
* view structured extracted fields
* inspect comparison results
* correct extracted values if parsing or OCR is wrong
* add reviewer notes
* re-run comparison after correction
* approve / reject / flag findings

---

# 9. Findings and Discrepancy Model

Veldra should not stop at “same” or “different.”
It should produce **verification findings** that are meaningful to staff.

## Findings may include:

* mismatched personal information
* inconsistent birth dates
* address differences
* document number conflicts
* missing required supporting information
* timeline inconsistencies
* unresolved extraction ambiguity

## Each finding should be traceable to:

* the source document(s)
* the extracted values
* the normalized values used for comparison
* the comparison rule or discrepancy category applied

---

# 10. Document Generation Module

This is a required module if Veldra generates **Affidavits of Discrepancy**, **Explanation Letters**, or similar formal outputs.

## 10.1 Purpose

Generate formal verification-related documents from **verified structured findings**, reviewer-approved data, and predefined templates.

## 10.2 Typical outputs

The generation module may produce:

* **Affidavit of Discrepancy**
* **Explanation Letter**
* **Summary Report**
* **Verification Findings Report**
* **Finalized case document package**
* other structured legal / administrative outputs defined by the workflow

---

# 11. Generation Strategy — Do We Need AI?

## 11.1 Short answer

**No, AI is not required for Veldra’s baseline document generation.**

For the current scope, document generation should be designed as a **template-driven generation system**, not as a chatbot-style drafting workflow.

## 11.2 Why AI is not required right now

Affidavits and explanation letters are often **structured, repeatable, and based on known findings** such as:

* applicant name
* case details
* discrepancy type
* affected documents
* conflicting values
* reviewer-confirmed explanation points
* date generated
* supporting reference numbers

When the system already has these structured inputs, it can generate documents reliably using templates and rule-based assembly.

---

# 12. Recommended Generation Design

## 12.1 Baseline approach: template-driven generation

Veldra should generate legal / administrative documents using:

* predefined document templates
* placeholder substitution
* findings-to-clause mapping
* conditional section rendering
* reviewer-approved data as the source of truth

This is the recommended approach for Phase 5 and baseline production implementation.

---

# 13. Template-Driven Generation Workflow

## Step 1 — Use finalized verified data

The generation module should pull from:

* applicant / case profile
* structured extracted fields
* verified cross-check findings
* reviewer corrections / overrides
* approved discrepancy categories

## Step 2 — Select the appropriate template

Examples:

* Affidavit of Discrepancy template
* Explanation Letter template
* Summary Report template

## Step 3 — Fill placeholders

Examples of placeholders:

* `{{applicant_name}}`
* `{{case_reference}}`
* `{{document_a_name}}`
* `{{document_b_name}}`
* `{{field_name}}`
* `{{value_a}}`
* `{{value_b}}`
* `{{reviewer_notes}}`
* `{{date_generated}}`

## Step 4 — Add conditional clauses

Example:

* if discrepancy type = birth date mismatch → include birth-date discrepancy clause
* if discrepancy type = name variation → include name clarification clause
* if multiple discrepancies exist → include multi-item discrepancy section

## Step 5 — Produce final output

Generate:

* printable document
* downloadable file
* archived case output
* report package attachment

---

# 14. Example: Affidavit Generation Without AI

## Input finding

```json
{
  "applicant_name": "Juan Dela Cruz",
  "discrepancies": [
    {
      "field": "birth_date",
      "document_a": "PSA Birth Certificate",
      "value_a": "1999-05-12",
      "document_b": "Transcript of Records",
      "value_b": "1999-05-21"
    }
  ]
}
```

## Generation logic

Veldra selects:

* template = **Affidavit of Discrepancy – Birth Date**
* inserts applicant name
* inserts conflicting values
* inserts document references
* inserts generated date and case reference
* optionally includes reviewer-approved explanatory text

## Result

A formal affidavit can be produced **without needing an LLM**.

---

# 15. Clause Library Concept

To keep generation structured and maintainable, Veldra should use a **clause library** for common discrepancy types.

## Example clause categories

* name discrepancy clause
* birth date discrepancy clause
* address discrepancy clause
* school record inconsistency clause
* missing supporting document explanation clause
* multi-document conflict clause

This allows generation to remain deterministic while still producing documents that feel complete and context-aware.

---

# 16. Explanation Letter Generation

Explanation letters can also be template-driven.

## Suggested structure

An explanation letter may include:

1. applicant details
2. purpose of the letter
3. discrepancy summary
4. explanation section based on discrepancy type
5. supporting document references
6. closing declaration / signature block if required

## Data sources

Explanation letters should be built from:

* verified findings
* approved applicant / case details
* reviewer notes
* selected discrepancy explanations
* template sections for the relevant document type

---

# 17. When AI Might Be Useful Later

AI is **optional** and should be treated as a future enhancement, not a baseline dependency.

## AI may be useful later for:

* rewriting explanation letters into more natural legal language
* summarizing large multi-document findings into a narrative
* drafting polished case notes from reviewer bullet points
* helping staff rewrite rough explanations into a formal tone
* assisting with unusually complex or unstructured cases

## AI should not replace:

* the deterministic comparison engine
* reviewer approval
* traceable discrepancy records
* source-of-truth structured findings

---

# 18. AI Decision Policy for Veldra

## Current decision

For the current Veldra scope:

### **Cross-checking**

* should remain **deterministic**

### **Affidavit / explanation letter generation**

* should be **template-driven**
* should **not require AI as a baseline dependency**

### **AI**

* may be added later as an optional enhancement layer for rewriting, summarization, or assisted drafting

---

# 19. Why This Approach Fits Veldra

This architecture matches Veldra’s product goals because it keeps the platform:

* **auditable** — findings and generated content are traceable to verified fields
* **predictable** — outputs follow controlled templates and rules
* **maintainable** — document formats and clauses can be updated without retraining anything
* **operationally safe** — verification staff remain in control of final outputs
* **aligned with a non-chatbot product identity** — the platform behaves like a verification tool, not a conversational AI system

---

# 20. Updated Phase 5 Definition

Phase 5 should now be framed as:

# **Phase 5 — Document Verification and Draft Generation Pipeline**

## Recommended Phase 5 scope

### A. Document intake

* upload and validate PDF / PNG / JPG / JPEG
* store originals and metadata

### B. Extraction layer

* direct text extraction for text-based PDFs
* OCR / extraction for scanned PDFs and images

### C. Structuring layer

* parse extracted text into standardized document fields

### D. Normalization layer

* standardize extracted values for comparison

### E. Deterministic verification engine

* compare fields across documents and records
* generate findings and discrepancy statuses

### F. Review workflow

* allow extracted-field correction
* approve or flag findings
* capture reviewer notes

### G. Document generation workflow

* generate Affidavits of Discrepancy
* generate Explanation Letters
* generate reports / output packages

### H. Export and audit

* store generated outputs
* track generation history
* allow export / download / archive

---

# 21. Agent Guidance

All agents working on Veldra should follow these implementation assumptions.

## 21.1 Do not treat uploaded files as already structured

PDF and image uploads are source files, not ready-made comparison records.

## 21.2 Separate file storage from extracted data

Original source files must remain stored and reviewable independently of extracted structured values.

## 21.3 Treat extraction, comparison, and generation as separate layers

* extraction = convert file into text/data
* comparison = verify extracted data across sources
* generation = produce formal outputs from verified findings

## 21.4 Use verified structured findings as the source of truth for generation

Generated affidavits and explanation letters should not be built from unreviewed raw OCR output if the workflow includes human review.

## 21.5 Do not assume AI is mandatory

OCR / extraction support does not automatically mean the platform must become AI-first or chatbot-based.

## 21.6 Keep every output explainable

Every finding and generated clause should be traceable to:

* the relevant case
* the source document(s)
* the extracted structured field(s)
* the discrepancy type
* the reviewer-approved values if applicable

---

# 22. Final Project Summary

**Veldra** is a **document ingestion, extraction, verification, and legal-draft generation platform** for processing applicant documents and producing structured verification outputs.

The system accepts uploaded **PDF and image files**, extracts and structures their contents, performs **deterministic cross-document verification**, surfaces discrepancies for reviewer approval, and generates **Affidavits of Discrepancy**, **Explanation Letters**, and related outputs using a **template-driven generation workflow**.

At the current stage of the project, **AI is not required as a core dependency** for either the comparison engine or baseline document generation. The recommended architecture is:

* **deterministic verification**
* **template-based legal document generation**
* **human review for ambiguous cases**
* **optional AI enhancement later for rewriting or summarization, not as the foundation of the system**

This framing should replace earlier descriptions that positioned Veldra as only a comparison engine or implied that document generation automatically requires AI.
