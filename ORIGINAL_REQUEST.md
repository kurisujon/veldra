# Original User Request

## Initial Request — 2026-06-22T09:46:35Z

Implement **Phase 4 — Document Uploads and Management** for Veldra, a Smart Document Verification Platform for student visa application documents. The team is split: **Claude handles all backend work** (database, Supabase Storage, RPCs, RLS, server actions), and **Gemini handles all frontend UI and documentation updates**. Neither agent may touch the other's domain.

Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra

Integrity mode: development

## Required Reading (MUST read before writing any code)
Both agents MUST read the following files in this exact order before writing any code:
1. `AGENTS.md` — roles, prohibited behaviors, current system state
2. `GEMINI.md` — project summary, current phase, architecture constraints
3. `docs/PRODUCT_VISION.md`
4. `docs/INFORMATION_ARCHITECTURE.md`
5. `docs/DATA_MODELS.md`
6. `docs/DESIGN_SYSTEM.md`
7. `docs/COMPONENT_RULES.md`
8. `docs/DEVELOPMENT_RULES.md`

---

## Requirements

### R1. Backend — Supabase Storage Configuration (Claude)
Configure a Supabase Storage bucket for document uploads. The bucket must have secure RLS policies so that only authenticated, role-authorized users can upload or retrieve files. File type is unrestricted but must be validated server-side. The bucket name and structure must follow the case-centric architecture: files are stored under `cases/{case_id}/{document_id}`.

### R2. Backend — Documents Table & RPC (Claude)
The existing `documents` table placeholder must be fully implemented with columns for: `case_id`, `document_type` (label), `file_path` (storage path), `file_name`, `file_size`, `mime_type`, `uploaded_at`, and `status`. An RPC `upload_document_record` must be created using `SECURITY DEFINER SET search_path = public` to insert the document record after a successful storage upload. A `delete_document` RPC must also be created to remove both the storage object and the database record atomically. All RPCs must derive `user_id` and `role` from `auth.uid()` — never from the client.

### R3. Backend — Server Actions & Zod Validation (Claude)
Create server actions for: `uploadDocument(formData)`, `deleteDocument(documentId)`, and `getDocumentsByCase(caseId)`. All server actions must validate input with Zod before calling any Supabase function. No `as any`, `@ts-ignore`, or `@ts-expect-error` are permitted. The `src/types/database.ts` must be updated to reflect the new documents table columns and the new RPCs.

### R4. Frontend — Upload UI (Gemini)
Build a document upload component (`DocumentUpload`) inside `src/features/documents/components/`. It must: accept file drag-and-drop and click-to-browse input, display upload progress, show success/error states, and call the `uploadDocument` server action. The component must use existing Design System tokens only — no arbitrary Tailwind values (e.g., no `w-[300px]`).

### R5. Frontend — Document List & Management UI (Gemini)
Build a `DocumentList` component displaying all documents for the currently open case. Each document row must show: document type label, file name, upload date, file size, and a delete button. Clicking delete must call the `deleteDocument` server action and optimistically remove the row. Integrate this into the existing Case Detail page (`src/app/(dashboard)/cases/[id]/page.tsx`) using the existing AppShell and layout.

### R6. Documentation Update (Gemini)
After UI implementation is complete, Gemini must update:
- `GEMINI.md` — mark Phase 4 as complete, set Phase 5 as next
- `AGENTS.md` — update current system state to reflect Phase 4 completion
- `docs/DATA_MODELS.md` — document the fully implemented `documents` table schema

---

## Acceptance Criteria

### Build & Type Safety
- [ ] `npm run build` completes with zero TypeScript errors
- [ ] `npm run lint` completes with zero ESLint warnings or errors
- [ ] Zero occurrences of `as any`, `@ts-ignore`, `@ts-expect-error` in any new file

### Backend Integrity
- [ ] All new RPCs use `SECURITY DEFINER SET search_path = public`
- [ ] No `user_id` or `role` accepted as RPC parameters from the client
- [ ] RLS is enabled on the `documents` table with role-aware policies
- [ ] A new migration file exists in `supabase/migrations/` for all schema changes

### Frontend Compliance
- [ ] No arbitrary Tailwind values (`w-[...]`, `h-[...]`, `text-[...]`, etc.) in any new component
- [ ] All new components are documented in `docs/COMPONENT_RULES.md` before use
- [ ] Document upload and delete flows work end-to-end in the Case Detail page

### Documentation
- [ ] `GEMINI.md` reflects Phase 4 as complete
- [ ] `docs/DATA_MODELS.md` has the fully implemented `documents` table schema

## Follow-up — 2026-06-22T18:26:39+08:00

Implement the Phase 5 Frontend UI components for the Veldra Smart Document Verification Platform. The backend schema and server actions (`analyzeDocuments`, `updateFindingStatus`) are already implemented.

Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra
Integrity mode: development

## Requirements

### R1. FindingCard Component
Implement a `FindingCard` React component in `src/features/findings/components/` that displays the properties of a Finding (title, description, severity, category, status). It must allow reviewers to update the finding's status using the existing `updateFindingStatus` server action.

### R2. DocumentComparisonPanel Component
Implement a `DocumentComparisonPanel` component that displays two selected source documents side-by-side for comparison when a finding is selected. The comparison panel must use a **split-screen layout** (side-by-side with the findings list) inside the Case Detail view.

### R3. Integration
Integrate the "Run Analysis" trigger (calling `analyzeDocuments`) into the Case Detail view. When the case is in the `NeedsReview` state, render the `FindingCard` list on one side and the `DocumentComparisonPanel` on the other side.

## Acceptance Criteria

### UI Implementation
- [ ] The `FindingCard` component exists and successfully calls `updateFindingStatus` when a status is changed.
- [ ] The `DocumentComparisonPanel` exists and visually displays two documents.
- [ ] `npm run build` and `npm run lint` complete with zero errors or warnings.
- [ ] Zero occurrences of `as any`, `@ts-ignore`, `@ts-expect-error` in any new file.
- [ ] Component styling adheres strictly to existing Tailwind utility classes and Design System tokens.

## Follow-up — 2026-06-22T19:17:26+08:00

Implement Phase 6 (Legal Draft Generation) for the Veldra Smart Document Verification Platform. This phase involves generating legal drafts (Affidavits, Explanation Letters) based on the Findings identified in Phase 5.

**CRITICAL ROLE SPLIT — STRICT ENFORCEMENT:**
- **Claude (Opus/Sonnet) — Architect & Backend Developer:** All database schema migrations, PostgreSQL RPCs, RLS policies, server actions, and `database.ts` type updates. Must read required documentation before writing any code.
- **Gemini — UI Developer & Documentarian:** All React component UI, page integration, and documentation updates (`GEMINI.md`, `AGENTS.md`, `docs/DATA_MODELS.md`). Neither agent may touch the other's domain.

Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra
Integrity mode: development

## Required Reading (ALL agents MUST read in this exact order before writing any code)
1. `AGENTS.md` — roles, prohibited behaviors, current system state
2. `GEMINI.md` — project summary, current phase, architecture constraints
3. `docs/PRODUCT_VISION.md`
4. `docs/INFORMATION_ARCHITECTURE.md`
5. `docs/DATA_MODELS.md`
6. `docs/FINDINGS_SYSTEM.md`
7. `docs/FEATURE_REQUIREMENTS.md`
8. `docs/DESIGN_SYSTEM.md`
9. `docs/COMPONENT_RULES.md`
10. `docs/DEVELOPMENT_RULES.md`

---

## Requirements

### R1. Backend — Schema & Storage (Claude ONLY)
Implement the `generated_drafts` table with columns: `id`, `case_id`, `type` (Enum: Affidavit, AddressLetter, GapLetter), `content` (HTML/Rich Text), and `status` (Enum: Draft, Finalized). Implement a many-to-many join table `draft_findings` mapping drafts to the specific `findings` that triggered them. Enforce strict RLS policies using `get_user_role()` — no permissive `true` policies. All migrations must be placed in `supabase/migrations/`. Update `src/types/database.ts` by regenerating from the live schema.

### R2. Backend — Draft Generation Engine (Claude ONLY)
Create server actions in `src/features/drafts/actions/index.ts`:
- `generateDrafts(caseId)`: Queries all 'Accepted' findings for the case. Automatically generates an "Affidavit of Discrepancy" HTML content string for High-severity Name Mismatch findings. Automatically generates an "Explanation Letter" HTML string for Medium-severity Address or School Gap findings. Saves all generated drafts to the `generated_drafts` table. Updates the case status to 'Reviewed' after generation.
- `updateDraftContent(draftId, content)`: Updates the rich text content of a draft.
- `finalizeDraft(draftId, caseId)`: Sets draft status to 'Finalized'.
- `getDraftsByCase(caseId)`: Fetches all drafts for a case with their linked finding IDs.
All server actions MUST: validate inputs with Zod, derive `user_id` and `role` from `auth.uid()` server-side only, use no `as any`, `@ts-ignore`, or `@ts-expect-error`.

### R3. Frontend — Draft Editor UI (Gemini ONLY)
Build a `DraftEditor` React component in `src/features/drafts/components/` that:
- Displays the generated draft type and the finding(s) that triggered it.
- Allows inline editing of the draft HTML content using a `<textarea>` or equivalent.
- Has a "Save" button that calls `updateDraftContent` server action.
- Has a "Finalize" button that calls `finalizeDraft` server action and visually reflects the finalized state.
Adhere strictly to existing Design System tokens — no arbitrary Tailwind values (e.g., no `w-[300px]`).

### R4. Frontend — Case Detail Integration (Gemini ONLY)
Integrate the draft workflow into `src/app/(dashboard)/cases/[id]/page.tsx`:
- When case status is `Reviewed`, display a "Generate Drafts" button that calls `generateDrafts`.
- When case status is `DraftGenerated`, display the list of generated drafts using the `DraftEditor` component.
Document all new components in `docs/COMPONENT_RULES.md` before use.

### R5. Documentation (Gemini ONLY)
After all code is implemented and the build is clean:
- Update `GEMINI.md`: Mark Phase 6 as complete, set Phase 7 (Export & Reporting) as next.
- Update `AGENTS.md`: Update current system state to reflect Phase 6 completion.
- Update `docs/DATA_MODELS.md`: Document the fully implemented `generated_drafts` and `draft_findings` table schemas.

## Acceptance Criteria

### Backend & Architecture
- [ ] `supabase/migrations/` contains the new Phase 6 migration file.
- [ ] `src/types/database.ts` is regenerated and contains `generated_drafts` and `draft_findings` tables.
- [ ] All server actions use Zod validation with zero type bypasses.
- [ ] RLS is enabled on all new tables with role-aware policies using `get_user_role()`.
- [ ] No `user_id` or `role` accepted as parameters from the client.

### UI Implementation
- [ ] `DraftEditor` component exists in `src/features/drafts/components/`.
- [ ] Inline editing and finalization work correctly.
- [ ] Case Detail page conditionally renders draft workflow based on case status.
- [ ] `npm run build` completes with zero TypeScript errors.
- [ ] `npm run lint` completes with zero ESLint warnings or errors.
- [ ] Zero occurrences of `as any`, `@ts-ignore`, `@ts-expect-error` in any new file.
- [ ] No arbitrary Tailwind values in any new component.

### Documentation
- [ ] `GEMINI.md` reflects Phase 6 as complete.
- [ ] `docs/DATA_MODELS.md` documents the new tables.
- [ ] New components are added to `docs/COMPONENT_RULES.md`.

## Follow-up — 2026-06-24T13:50:38Z

Implement Phase 8 (Dashboard & Analytics) for the Veldra verification platform while also resolving a stubborn TypeScript compiler issue with a Supabase RPC call that prevents Next.js builds.

Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra
Integrity mode: development

## Requirements

### R1. Fix Supabase RPC Next.js Type Check Bug
The project currently fails `npm run build` due to a strict TypeScript inference issue with `supabase.rpc('create_case_with_applicant')` in `src/features/cases/actions/index.ts`. The error is "is not assignable to parameter of type 'undefined'". The agent must fix this type issue strictly without using `as any`, `@ts-ignore`, `@ts-expect-error`, or `unknown as`, adhering strictly to `AGENTS.md` rules.

### R2. Implement Phase 8 Dashboard UI (Mock Data)
Build the Dashboard UI at `src/app/(dashboard)/page.tsx` containing a high-level overview of active cases, recent activity, and system metrics. Utilize existing design tokens and Tailwind utility classes. For this initial pass, use **mock metrics** to validate the layout and design.

### R3. E2E Verification
Write a Playwright E2E test in the `tests/` directory to verify that the Dashboard loads and renders the mock metrics and layout correctly without errors.

## Acceptance Criteria

### Build Integrity
- [ ] Running `npm run build` completes successfully with 0 type errors.
- [ ] No strict typing bypasses (`as any`, `@ts-ignore`, etc.) are introduced to fix the RPC error.

### Dashboard Verification
- [ ] A new Playwright E2E test exists for the Dashboard.
- [ ] Running the Playwright test suite passes and verifies the dashboard renders the mock data correctly.

## Follow-up — 2026-06-25T21:00:00+08:00

Do not keep the old regex extractor as the primary extraction path for supported Veldra document types. Gemini 2.5 Flash must become the main extraction path, while preserving reviewer correction and downstream deterministic comparison.
# Veldra Implementation Prompt — Integrate Gemini 2.5 Flash as the Primary Document Extraction Engine

You are working on **Veldra**, a **case-centric document verification platform** built with **Next.js + TypeScript + Supabase**.

The system currently has:

* a case-centric architecture
* document upload support
* Supabase storage
* an existing OCR / extraction path that is currently unreliable and only extracts minimal fields
* a review workflow concept where extracted values can be reviewed and corrected
* a Gemini API key already placed in `.env`

The current OCR + regex extraction behavior is not good enough for the actual use case because uploaded documents include:

* **PDFs**
* **JPG / JPEG / PNG**
* **scanned phone images**
* documents downloaded from **email / Messenger**
* variable image quality and inconsistent layouts

The product goal is not just OCR.
The product goal is:

1. upload applicant documents
2. extract **full structured data** from each uploaded document
3. compare extracted data across the case
4. generate structured findings for discrepancies
5. generate affidavit / explanation drafts from accepted findings
6. preserve a human review workflow before final case output

---

# Your Mission

Replace the current **minimal OCR / regex-first extraction path** with a **gemini-powered full document extraction pipeline** using:

# **Gemini 2.5 Flash**

as the **primary extraction model** for Veldra’s supported document types.

The Gemini API key is already present in `.env`.
You must complete the **model wiring, extraction pipeline, structured validation, persistence, and manual test path** so the feature becomes **usable and testable inside the repo**.

---

# Important Constraint

Veldra is **not** a chatbot and should not behave like one.

The AI integration is for:

* **document extraction**
* **field normalization**
* possibly future **draft assistance**

The AI integration is **not** for:

* freeform chat workflows
* unstructured narrative output
* replacing deterministic discrepancy logic

The output of extraction must be **strict structured data** that fits the review workflow and later comparison engine.

---

# Model to Use

Use **Gemini 2.5 Flash** as the primary extraction model.

## Required environment support

The model must be configurable through environment variables.

Use or support the following env values:

```env
GEMINI_API_KEY=your_existing_key
GEMINI_MODEL=gemini-2.5-flash
```

If the repo already uses a different Gemini env naming convention, align with it cleanly, but the final implementation must clearly support **configuring the Gemini model from env**.

## Requirement

Do **not** hardcode the model name deep inside feature logic.
The AI provider/model config must be centralized.

---

# High-Level Outcome

After your implementation, Veldra should be able to:

* take an uploaded **Birth Certificate / Marriage Certificate / TOR / SF10 / Diploma**
* send the file to **Gemini 2.5 Flash**
* receive a **structured JSON extraction result**
* validate it with **zod**
* persist the extraction output in Veldra’s extraction layer
* expose field-level values for reviewer verification
* prepare the data for deterministic cross-document comparison and later draft generation

---

# Required Architecture

Create a dedicated AI extraction layer.
Do **not** scatter Gemini calls throughout random feature files.

## Suggested structure

```text
src/
  lib/
    ai/
      gemini.ts
      prompts.ts
      schemas.ts
      extraction.ts
      normalization.ts
      types.ts
```

This exact structure is not mandatory, but the responsibilities must be clearly separated.

---

# Step 1 — Audit Existing Extraction Flow

Before implementing, inspect the current extraction / OCR flow in the repo and identify:

* where document extraction is currently triggered
* what OCR utilities currently exist
* how extracted values are stored
* whether there are existing extraction tables / models / types
* how the review UI currently consumes extracted data

Do not delete architecture-critical code blindly.
But **Gemini extraction must become the main extraction path for supported document types**.

The old OCR / regex path should no longer be the primary extraction method for the main supported documents.

---

# Step 2 — Create Central Gemini Client Setup

Implement a centralized Gemini client layer for Veldra.

## Requirements

* read API key from env
* read model name from env
* expose a reusable Gemini extraction function
* keep implementation isolated from UI code

Create a central helper such as:

```ts
getGeminiModel(): string
```

and a reusable function for calling Gemini for document extraction.

---

# Step 3 — Create a Single Extraction Entry Point

Create a central extraction function such as:

```ts
extractDocumentWithAI(input: {
  documentId: string;
  caseId: string;
  documentType: DocumentType;
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
})
```

This function should:

1. receive the uploaded document context
2. choose the correct extraction prompt based on document type
3. send the document to Gemini 2.5 Flash
4. parse the returned JSON
5. validate the result with zod
6. persist extraction output
7. create / update field-level extraction rows
8. return a structured extraction result for the UI / server action

---

# Step 4 — Gemini Must Return Structured JSON Only

The extraction layer must be built around **strict JSON output**, not prose.

The AI prompt must explicitly instruct Gemini to return **JSON only** matching the expected schema for the specific document type.

Do not rely on freeform natural language extraction results.

---

# Step 5 — Use Zod for Schema Validation

Create explicit zod schemas for the extraction output of each supported document type.

The returned Gemini JSON must be validated before it is trusted or stored.

If Gemini returns:

* malformed JSON
* incomplete output
* a schema mismatch
* empty output

then the system must:

* record the failure state
* surface a useful error
* avoid silently trusting invalid extraction output

---

# Supported Document Types

Veldra currently supports these document categories:

* **PSA Birth Certificate**
* **PSA Marriage Certificate**
* **TOR**
* **SF10**
* **Diploma**

You must implement **document-type-aware extraction** for all of them.

---

# Step 6 — Create Document-Type-Aware Extraction Schemas

Below are the baseline extraction targets.
If the repo already has richer field definitions, align with them, but do not reduce coverage below these targets.

---

# A. PSA Birth Certificate Extraction Schema

Create a zod schema for a structured birth certificate extraction object.

## Minimum target fields

* `documentType`
* `certificateNumber`
* `registryNumber`
* `firstName`
* `middleName`
* `lastName`
* `suffix`
* `sex`
* `dateOfBirth`
* `placeOfBirth`
* `fatherFirstName`
* `fatherMiddleName`
* `fatherLastName`
* `motherMaidenFirstName`
* `motherMaidenMiddleName`
* `motherMaidenLastName`
* `dateOfRegistration`
* `issuingOffice`
* `remarks`

---

# B. PSA Marriage Certificate Extraction Schema

## Minimum target fields

* `documentType`
* `certificateNumber`
* `husbandFirstName`
* `husbandMiddleName`
* `husbandLastName`
* `wifeFirstName`
* `wifeMiddleName`
* `wifeLastName`
* `dateOfMarriage`
* `placeOfMarriage`
* `husbandCitizenship`
* `wifeCitizenship`
* `issuingOffice`
* `remarks`

---

# C. TOR Extraction Schema

## Minimum target fields

* `documentType`
* `studentFirstName`
* `studentMiddleName`
* `studentLastName`
* `studentSuffix`
* `institutionName`
* `institutionAddress`
* `program`
* `degree`
* `studentNumber`
* `dateOfGraduation`
* `honors`
* `academicEntries`

## `academicEntries`

This should support an array of academic row objects when possible, for example:

* `schoolYear`
* `term`
* `subjectCode`
* `subjectTitle`
* `grade`
* `units`

If the first pass cannot fully and reliably parse all TOR table rows, do **not** fabricate data.
But the schema and architecture should support future expansion of detailed academic record extraction.

---

# D. SF10 Extraction Schema

## Minimum target fields

* `documentType`
* `studentFirstName`
* `studentMiddleName`
* `studentLastName`
* `dateOfBirth`
* `schoolName`
* `schoolAddress`
* `lrn`
* `gradeLevelEntries`
* `remarks`

## `gradeLevelEntries`

This should support year / grade progression entries when visible in the document.

---

# E. Diploma Extraction Schema

## Minimum target fields

* `documentType`
* `studentFirstName`
* `studentMiddleName`
* `studentLastName`
* `studentSuffix`
* `institutionName`
* `degree`
* `program`
* `dateAwarded`
* `honors`
* `remarks`

---

# Step 7 — Create Document-Type-Aware Gemini Prompts

Do **not** use one generic prompt for all document types.

Create prompt builders / prompt templates for:

* PSA Birth Certificate
* PSA Marriage Certificate
* TOR
* SF10
* Diploma

Each prompt must:

1. clearly tell Gemini what document type it is reading
2. ask it to extract **all relevant structured fields**
3. instruct it to return **JSON only**
4. instruct it to use `null` for unreadable or missing fields
5. instruct it not to hallucinate or invent values
6. preserve names / dates as faithfully as possible
7. align with the exact zod schema for that document type

---

# Step 8 — Prompting Rules for Gemini

Every extraction prompt should explicitly instruct Gemini to follow these rules:

## Required prompt rules

* Extract only values visible or strongly inferable from the document
* Do not invent data
* Use `null` for missing / unreadable fields
* Preserve names as written where possible
* Normalize dates consistently if possible
* Return **JSON only**
* Follow the provided schema exactly
* If the document is partially unreadable, still return the schema with nulls where needed rather than guessing

---

# Step 9 — Implement Extraction Persistence

If the repo already has extraction storage tables, align with them.
If not, introduce a proper extraction persistence layer that fits Veldra’s architecture.

The system must preserve both:

* the structured extraction result
* field-level extraction records for review and comparison

## Suggested extraction entity: `DocumentExtraction`

Represents one extraction run for one document.

Suggested fields:

* `id`
* `case_id`
* `document_id`
* `document_type`
* `status`
* `provider`
* `model`
* `raw_response`
* `normalized_json`
* `error_message`
* `review_status`
* `created_at`
* `updated_at`

## Suggested field entity: `DocumentField`

Represents field-level extracted values.

Suggested fields:

* `id`
* `case_id`
* `document_id`
* `document_extraction_id`
* `field_name`
* `raw_value`
* `normalized_value`
* `reviewed_value`
* `final_value`
* `status`
* `created_at`
* `updated_at`

If the repo already uses a different schema, preserve the same functional intent:

* one record for extraction runs
* field-level extracted values
* reviewable final values
* storage of raw and normalized outputs

---

# Step 10 — Flatten Structured Extraction into Reviewable Fields

After Gemini returns a valid structured extraction object:

1. store the full normalized JSON
2. flatten relevant fields into field-level rows
3. create / update field records tied to the document
4. mark them as reviewable / pending review

This is critical because Veldra’s review UI and future comparison engine should operate on structured fields, not only a single JSON blob.

---

# Step 11 — Preserve Human Review Workflow

Do not bypass human review.

The intended Veldra flow remains:

1. uploaded document is extracted by Gemini
2. extracted values are stored
3. reviewer opens the case
4. reviewer sees extracted values
5. reviewer can edit / accept / correct values
6. approved values become the trusted final values used downstream

The AI layer improves extraction, but reviewers still control the final accepted data.

---

# Step 12 — Keep Cross-Document Comparison Deterministic

Gemini is being introduced to improve extraction quality.
The discrepancy logic should still remain deterministic and structured.

That means downstream comparison should still be based on extracted / approved values such as:

* first / middle / last names
* DOB
* address fields
* institution names
* marriage / birth consistency fields
* academic dates and timeline

Do **not** redesign the comparison engine into a vague AI-only judgment system.

---

# Step 13 — Implement a Manual Extraction Test Path

The Gemini integration has not been tested yet because the model setup was not completed.

You must add a clean way to manually test extraction on an uploaded document.

## Required

Add at least one of the following:

* a “Run Extraction” action/button in the document or review UI
* a server action that can be triggered for a document
* a route handler for manual testing inside the app

The important part is that a developer / reviewer can select an uploaded document and trigger Gemini extraction end-to-end.

---

# Step 14 — Supported File Inputs

The extraction flow must support:

* PDF
* JPG
* JPEG
* PNG

Use Gemini in a way that supports document understanding of these file types.

If PDF preprocessing is required for Gemini input, implement it cleanly and document the approach.

Do not reduce the system back to “OCR text blob only” unless absolutely necessary for a fallback path.

---

# Step 15 — Error Handling

Handle the following failure modes:

* unsupported file type
* missing document buffer
* Gemini API failure
* timeout
* invalid JSON response
* schema validation failure
* unreadable document
* empty extraction result

On failure:

* preserve an extraction failure state if appropriate
* store the error message
* avoid crashing the overall case flow
* allow retry / re-extract later

---

# Step 16 — Keep UI Changes Focused

Do not redesign the whole application.

Only update the UI enough to support:

* triggering extraction
* showing extraction status
* showing extracted fields
* allowing reviewer edits / acceptance

Keep the implementation aligned with the existing Veldra design system and case-centric workspace.

---

# Step 17 — Make the Model Swappable

Even though the initial implementation must use **Gemini 2.5 Flash**, structure the AI layer so the model can be swapped later through env configuration without refactoring the whole extraction system.

The code should be designed so Veldra can later upgrade to:

* another Gemini Flash model
* Gemini Pro if paid access is added
* a secondary fallback provider if needed

without rewriting the case workflow.

---

# Step 18 — Deliverables Required From You

When implementation is complete, provide the following:

## 1. Architecture summary

Explain:

* how Gemini 2.5 Flash was integrated
* where the env config is read
* how extraction is triggered
* how JSON is validated
* how extraction results are stored

## 2. File-by-file summary

List every created / modified file and what it does.

## 3. Env requirements

Explain exactly which env variables are required and how the model is configured.

## 4. Testing instructions

Explain exactly how to run a document extraction test end-to-end in the repo.

## 5. Known limitations

If any part is only partially implemented in the first pass (for example TOR table extraction depth), explain that clearly and honestly.

---

# Implementation Order

Follow this order:

## Step 1

Audit the existing OCR / extraction flow and extraction data model.

## Step 2

Create the centralized Gemini config / client layer.

## Step 3

Create zod schemas for each supported document type.

## Step 4

Create document-type-aware Gemini prompts.

## Step 5

Implement `extractDocumentWithAI()`.

## Step 6

Persist extraction results and field rows.

## Step 7

Wire manual extraction trigger in the app.

## Step 8

Test one full extraction flow and document how it works.

---

# Final Goal

After this implementation, Veldra should no longer behave like a small OCR demo that only extracts a few values.

It should behave like a **document verification platform** that can:

* ingest an uploaded applicant document
* extract a rich structured record using **Gemini 2.5 Flash**
* persist extraction output in a reviewable format
* allow human correction and acceptance
* prepare the extracted data for discrepancy detection and draft generation

The Gemini API key is already in `.env`.
Your job is to complete the **Gemini 2.5 Flash model integration, structured extraction pipeline, validation, persistence, and manual test path** so the feature becomes usable inside Veldra.

