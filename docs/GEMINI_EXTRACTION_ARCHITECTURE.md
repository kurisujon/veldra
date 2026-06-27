# Gemini 2.5 Flash Document Extraction Architecture

This document describes the design, integration, and user interface for the AI-powered Document Extraction system in Veldra.

## 1. Architecture Summary

Veldra integrates **Gemini 2.5 Flash** to automate data extraction from visa application documents (PSA Birth Certificates, Transcripts, Diplomas, etc.). The pipeline is structured as follows:

```
[Document Upload] ➔ [Supabase Storage]
                          │
                          ▼ (Fetch File Buffer)
                 [Server Action (runExtraction)]
                          │
                          ▼ (MIME/Base64 + Prompt)
               [Gemini 2.5 Flash API]
                          │
                          ▼ (JSON Mode Response)
               [Zod Schema Validation]
                          │
                          ▼ (Flatten Fields)
           [Supabase DB (Extractions & Fields)]
```

### Key Architectural Pillars:
- **`@google/genai` SDK**: Integrated using Google's official modern GenAI SDK.
- **Strict Schema Enforcement**: Extraction results are validated using type-safe **Zod** schemas matching each document type.
- **Failover & API Key Rotation**: Supports a comma-separated list of API keys in `GEMINI_API_KEYS` to automatically rotate keys in sequence if a rate-limit or quota error occurs during extraction.
- **Case-Centric Review Workspace**: Reviewers examine extracted values alongside the original document side-by-side. Values can be accepted, corrected, or rejected.

---

## 2. File-by-File Summary

### AI & Integration Layer
- **`src/lib/ai/gemini.ts`**: Configures the GenAI client, checks environment variables, and implements API key rotation.
- **`src/lib/ai/extraction.ts`**: Standardizes the AI call sequence. Loads the prompt, encodes the file buffer to base64, invokes Gemini 2.5 Flash in JSON mode, cleans up markdown backticks, and validates the output using Zod.
- **`src/lib/ai/schemas.ts`**: Contains Zod schemas for all supported document types:
  - `BirthCertificateSchema` (PSA Birth Certificate)
  - `MarriageCertificateSchema` (PSA Marriage Certificate)
  - `TorSchema` (Transcript of Records)
  - `Sf10Schema` (SF10 Student Permanent Record)
  - `DiplomaSchema` (Diploma)
- **`src/lib/ai/prompts.ts`**: Generates customized prompts matching the target document type to guide the model on which fields to extract and the expected schema structure.

### Server Actions
- **`src/features/extractions/actions/index.ts`**: 
  - `runExtraction`: Coordinates downloading the file from Supabase storage, running the AI extraction layer, flattening the structured output into key-value fields, and inserting/updating rows in `document_extractions` and `document_fields`.
  - `updateDocumentField`: Updates the verification status (`Accepted`, `Corrected`, `Rejected`) and saves the manual correction value from reviewers.
  - `getExtractionByDocumentId`: Queries the latest extraction and fields from the database.

### User Interface Layer
- **`src/features/extractions/components/ExtractionWorkspace.tsx`**: The main review page interface.
  - Features a split-pane layout: Document viewer on the left (supporting PDF iframe or images), and the fields review panel on the right.
  - Renders a **"Re-run Extraction"** button in the header if an extraction already exists, enabling reviewers to re-trigger extraction at any time.
  - Maps extraction statuses to semantic badge variants:
    - `Pending` ➔ `neutral`
    - `Processing` ➔ `primary`
    - `Extracted` ➔ `primary`
    - `NeedsReview` ➔ `warning`
    - `Reviewed` ➔ `success`
    - `Failed` ➔ `error`
  - Captures failed extraction states, showing the exact `error_message` inside the panel and rendering a **"Retry Extraction"** button to allow quick re-runs.

---

## 3. Environment Requirements

Ensure the following variables are configured in your `.env.local` or deployment environment:

```env
# Single Gemini API Key (Alternative 1)
GEMINI_API_KEY=AIzaSy...

# Comma-separated list of Gemini API Keys for rotation (Alternative 2)
GEMINI_API_KEYS=AIzaSyKey1,AIzaSyKey2,AIzaSyKey3

# Model Name (Optional, defaults to gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash
```

---

## 4. End-to-End Testing Instructions

1. **Upload a Document**:
   - Go to a Case Detail page.
   - Under the "Documents" section, upload a file (e.g., a PDF or image of a Birth Certificate or Transcript).
2. **Open the Review Workspace**:
   - Click the "Review" button or the document name to navigate to the Document Review page: `/cases/[case-id]/documents/[document-id]`.
3. **Trigger First-Time Extraction**:
   - If the document has not been extracted, you will see a placeholder: "This document has not been extracted yet."
   - Click the **"Run Extraction"** button. The button will display a spinner indicating progress.
4. **Verify Extracted Fields**:
   - Upon successful extraction, the panel will refresh and show the individual fields (e.g. `firstName`, `lastName`, etc.) with a `NeedsReview` warning badge.
5. **Accept, Edit, or Reject Fields**:
   - Click **Accept** to mark a value correct (changes status to `Accepted`, success green badge).
   - Click **Edit** to enter a corrected value and save (changes status to `Corrected`, success green badge).
   - Click **Reject** to mark a value invalid (changes status to `Rejected`, error red badge).
6. **Test Re-running Extraction**:
   - Click the **"Re-run Extraction"** button in the header.
   - The extraction runs again, refreshing all values back to the AI-extracted values and resetting field statuses to `NeedsReview`.
7. **Test Failure State handling**:
   - Temporarily modify the Gemini API key in `.env.local` to be invalid.
   - Click **"Re-run Extraction"**.
   - The status badge will change to `Failed`, and a clear error card showing the Gemini API key authentication error message will be displayed, along with a **"Retry Extraction"** button.

---

## 5. Known Limitations

- **Nested Array Flattening**: 
  - Fields such as `academicEntries` (in TOR) and `gradeLevelEntries` (in SF10) are arrays of objects under the Zod schema definition.
  - To conform with the flat key-value `document_fields` schema in the database, these array objects are serialized as **JSON strings** during extraction.
  - Reviewers will see these array structures formatted as raw JSON text in the review row. Designing custom tabular views for these specific complex fields is reserved for a future iteration.
