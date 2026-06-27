# Context - Gemini 2.5 Flash Document Extraction Integration

## Current Setup
- Veldra uses Next.js 14 App Router, TypeScript, and Supabase.
- An existing OCR/extraction process is in place using `src/lib/ocr/index.ts` and `src/features/extractions/actions/index.ts`.
- The current implementation calls `@google/genai` library, using model `gemini-2.5-flash` with a basic heuristic fallback, but it doesn't do full structured document extraction or validate outputs with Zod.
- The `document_extractions` and `document_fields` tables are defined in the PostgreSQL database and have corresponding TypeScript types in `src/types/database.ts`.

## Target Architecture
1. **Gemini Client**: Centralized in `src/lib/ai/gemini.ts` configured from env (`GEMINI_API_KEY`, `GEMINI_MODEL`).
2. **Zod Schemas**: Defined in `src/lib/ai/schemas.ts` for PSA Birth Certificate, PSA Marriage Certificate, TOR, SF10, and Diploma.
3. **Prompt Templates**: Defined in `src/lib/ai/prompts.ts` mapping document types to specific prompting instructions.
4. **Single Entry Point**: `extractDocumentWithAI()` in `src/lib/ai/extraction.ts` coordinating file read, API call, JSON parsing, Zod validation, and mapping to output schema.
5. **Persistence**: The server action `runExtraction` in `src/features/extractions/actions/index.ts` downloads the uploaded document from Supabase storage, passes it directly to `extractDocumentWithAI()`, and stores the result in `document_extractions` and `document_fields`.
6. **UI & Review**: `ExtractionWorkspace` coordinates viewing the document side-by-side with the reviewable field rows, and supports manual extraction trigger and editing.
