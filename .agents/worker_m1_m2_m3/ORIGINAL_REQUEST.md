## 2026-06-25T13:06:08Z
You are Claude (Architect/Backend Developer) operating in the Veldra project.
Your task is to implement Milestones 1, 2, and 3 for integrating Gemini 2.5 Flash as the primary document extraction engine in Veldra.

Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/worker_m1_m2_m3/

Requirements:
1. Central Gemini Client Setup: Create `src/lib/ai/gemini.ts`. Expose helper `getGeminiModel()` and client config from environment variables `GEMINI_API_KEY` (or `GEMINI_API_KEYS` supporting rotation/fallback) and `GEMINI_MODEL`.
2. Zod Schemas: Create `src/lib/ai/schemas.ts`. Define Zod schemas for the 5 document types (Birth Certificate, Marriage Certificate, TOR, SF10, Diploma) matching the minimum target fields described in /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/ORIGINAL_REQUEST.md. Ensure all fields allow null for missing/unreadable values.
3. Prompt Templates: Create `src/lib/ai/prompts.ts`. Develop specific, document-type-aware system prompt templates instructing Gemini 2.5 Flash to extract values as strict JSON conforming to the Zod schemas without markdown formatting, backticks, or hallucinations.
4. Single Entry Point: Create `src/lib/ai/extraction.ts`. Implement `extractDocumentWithAI(input)` accepting documentId, caseId, documentType, fileBuffer, mimeType, and fileName. Send the file buffer as base64 inlineData directly to the Gemini API (`@google/genai` library is installed). Parse the JSON response, validate it with Zod, and return it.
5. Persistence Integration: In `src/features/extractions/actions/index.ts`, update `runExtraction(documentId, caseId, documentType)` to:
   - Download the file from the Supabase Storage bucket ('documents').
   - Send the file to `extractDocumentWithAI`.
   - Insert/update the `document_extractions` record (set status to 'NeedsReview', populate notes/raw_text/extraction_method, set review_status to 'Unreviewed').
   - Insert/update individual fields from the validated JSON into the `document_fields` table linked to the extraction record, setting status to 'NeedsReview'.
6. Run `npm run build` and `npm run lint` locally to verify that all code compiles cleanly with zero TS errors and linting issues.
7. Write a detailed handoff.md in your working directory and message the parent with the results.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please execute these backend tasks in compliance with AGENTS.md role-split rules.
