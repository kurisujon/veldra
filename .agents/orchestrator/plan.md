# Plan — Gemini 2.5 Flash Document Extraction Integration

This plan outlines the integration of Gemini 2.5 Flash as the primary document extraction engine in Veldra, replacing the unreliable OCR/regex-first approach.

## Topology & Roles
- **Orchestrator**: Coordinates implementation, ensures role splits, and manages verification.
- **Claude (Opus/Sonnet) - Architect & Backend Developer**:
  - Central client layer (`src/lib/ai/gemini.ts`) and env config.
  - Zod schemas for the 5 supported document types (`src/lib/ai/schemas.ts`).
  - Document-type-aware prompts (`src/lib/ai/prompts.ts`).
  - Single entry point `extractDocumentWithAI` (`src/lib/ai/extraction.ts`).
  - Persistence logic updating `document_extractions` and `document_fields`.
  - Server action `runExtraction` update in `src/features/extractions/actions/index.ts`.
- **Gemini - UI Developer & Documentarian**:
  - React UI integration in `ExtractionWorkspace` and case detail page.
  - Manual test path trigger / button.
  - Update all project markdown documentation (`GEMINI.md`, `AGENTS.md`, and `docs/`).

## Milestones

### M1. Codebase Exploration & Central Client Setup (Claude)
- **Objective**: Audit existing extraction flows and set up central Gemini client configuration.
- **Deliverables**:
  - Central client layer file `src/lib/ai/gemini.ts` reading `GEMINI_API_KEY` and `GEMINI_MODEL` from env.
  - Verification that the client is isolated and swappable.

### M2. Zod Schemas & Prompt Templates (Claude/Gemini)
- **Objective**: Create schemas and prompts for Birth Certificate, Marriage Certificate, TOR, SF10, and Diploma.
- **Deliverables**:
  - Zod schemas in `src/lib/ai/schemas.ts`.
  - Prompt templates in `src/lib/ai/prompts.ts` instructing structured JSON output only.

### M3. Single Entry Point & Extraction Persistence (Claude)
- **Objective**: Implement `extractDocumentWithAI()` to send documents to Gemini, parse JSON, validate with Zod, and persist in `document_extractions` / `document_fields`.
- **Deliverables**:
  - `extractDocumentWithAI()` implementation in `src/lib/ai/extraction.ts`.
  - Integration with existing `runExtraction` server action.

### M4. UI Integration & Manual Extraction Trigger (Gemini)
- **Objective**: Connect the extraction to the UI and ensure reviewers can run extraction and edit/review fields.
- **Deliverables**:
  - UI updates in `ExtractionWorkspace.tsx` showing status and trigger button.
  - Correct formatting, handling PDF and images.

### M5. Verification & Documentation (Claude & Gemini)
- **Objective**: Verify that `npm run build` and `npm run lint` pass cleanly with no type bypasses, and update documents.
- **Deliverables**:
  - Clean build output.
  - Updated `GEMINI.md`, `AGENTS.md`, and new/modified component docs.
