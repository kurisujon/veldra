# Project: Veldra - Gemini 2.5 Flash Document Extraction Integration

## Architecture
Veldra is built on Next.js 16 (App Router), TypeScript, Tailwind CSS, and Supabase.
This project replaces the heuristic and limited regex/OCR-first document extraction flow with a robust Gemini 2.5 Flash multimodal extraction engine.

### Data Flow
1. **Document Upload**: Users upload birth certificates, marriage certificates, TORs, SF10s, or diplomas.
2. **AI Extraction Call**: The `runExtraction` server action reads the file from Supabase storage and invokes `extractDocumentWithAI(input)`.
3. **Structured Gemini Call**: `extractDocumentWithAI` reads `GEMINI_API_KEY` and `GEMINI_MODEL`, formats the document prompt based on its type, and calls the Gemini 2.5 Flash API with the document file as a base64 inlineData.
4. **Zod Validation**: The extraction layer receives a structured JSON response, validates it against the Zod schema for that document type, and maps missing fields to `null`.
5. **Database Persistence**: The raw JSON response is saved in the `document_extractions` record. Individual fields are flattened and inserted into `document_fields` as `NeedsReview`.
6. **Review & Edit**: Reviewers open the document workspace to accept or correct values. Accepted values are stored and utilized downstream for discrepancy detection.

## Code Layout
- `src/lib/ai/`
  - `gemini.ts` - Centralized Gemini client setup and configuration.
  - `schemas.ts` - Zod validation schemas for all five document types.
  - `prompts.ts` - Document-type-aware prompts enforcing structured JSON return.
  - `extraction.ts` - Single entry point `extractDocumentWithAI()` combining API call, parsing, and schema validation.
- `src/features/extractions/`
  - `actions/index.ts` - Updated `runExtraction` server action to trigger Gemini extraction and persist fields.
  - `components/ExtractionWorkspace.tsx` - UI component for side-by-side view, status badges, and manual extraction triggers.

## Interface Contracts
- `extractDocumentWithAI(params)`: Validates document inputs and returns structured fields matching the document-type schema.
- `runExtraction(documentId, caseId, documentType)`: Orchestrates files, calls extraction, and writes database records.

---

## Milestones

### M1. Central Gemini Client Setup (Claude)
- **Objective**: Implement centralized client configuration and environment support in `src/lib/ai/gemini.ts`.
- **Status**: PLANNED

### M2. Zod Schemas & Prompts (Claude)
- **Objective**: Define Zod schemas and structured prompt templates for the 5 document types.
- **Status**: PLANNED

### M3. Extraction Core & Database Persistence (Claude)
- **Objective**: Implement `extractDocumentWithAI()` and integrate database persistence in the `runExtraction` server action.
- **Status**: PLANNED

### M4. UI Integration & Manual Trigger (Gemini)
- **Objective**: Update the extraction review workspace UI to invoke extraction and support editing.
- **Status**: PLANNED

### M5. Verification & Documentation (Claude & Gemini)
- **Objective**: Validate the full build, linting status, and update markdown documentation.
- **Status**: PLANNED
