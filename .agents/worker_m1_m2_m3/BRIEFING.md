# BRIEFING — 2026-06-25T13:51:00Z

## Mission
Integrate Gemini 2.5 Flash as the primary document extraction engine in Veldra (Milestones 1, 2, and 3).

## 🔒 My Identity
- Archetype: Architect & Backend Developer
- Roles: implementer, qa, specialist
- Working directory: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/worker_m1_m2_m3/
- Original parent: bac4e0c8-629a-4a9f-9bed-8786dd49b132
- Milestone: Milestones 1, 2, and 3 integration of Gemini 2.5 Flash

## 🔒 Key Constraints
- STRICT ROLE SPLIT: Architect & Backend Developer (Claude) handles database, Server Actions, AI extraction, and logic.
- NO Type Bypasses: Do not use `as any`, `unknown as`, `@ts-ignore`, or `@ts-expect-error`.
- NO Client-Side Trust: Derive user_id/role server-side or inside SECURITY DEFINER RPCs.
- Zod Schema validation for all Server Actions and AI responses.
- Clean NextJS build with zero typescript errors or warnings.

## Current Parent
- Conversation ID: bac4e0c8-629a-4a9f-9bed-8786dd49b132
- Updated: 2026-06-25T13:51:00Z

## Task Summary
- **What to build**: Central Gemini client, Zod schemas for 5 document types (Birth Certificate, Marriage Certificate, TOR, SF10, Diploma), prompt templates for each document type, a single entry point `extractDocumentWithAI`, and integration into `runExtraction` server action.
- **Success criteria**: Strict structured JSON extraction directly from files using Gemini 2.5 Flash API with fallback key rotation, parsed/validated using Zod schemas, persisted into `document_extractions` and `document_fields` tables. Clean compilation with `npm run build` and `npm run lint`.
- **Interface contracts**: Zod schemas mapping to standard properties defined in the requirement.
- **Code layout**: New files at `src/lib/ai/`.

## Key Decisions Made
- Use `@google/genai` library to create a centralized client supporting API key rotation from `GEMINI_API_KEYS` / `GEMINI_API_KEY`.
- Configure model name from `GEMINI_MODEL`, defaulting to `gemini-2.5-flash`.
- Send file buffer as base64 inlineData directly.
- Standardize on Postgres table schemas: `document_extractions` and `document_fields`.

## Change Tracker
- **Files modified**:
  - `src/lib/ai/gemini.ts` (created)
  - `src/lib/ai/schemas.ts` (created)
  - `src/lib/ai/prompts.ts` (created)
  - `src/lib/ai/extraction.ts` (created)
  - `src/features/extractions/actions/index.ts` (modified)
  - `src/components/review/DocumentComparisonPanel.tsx` (modified)
  - `src/lib/ocr/index.ts` (modified)
  - `src/lib/ocr/paddle.ts` (modified)
  - `src/middleware.ts` (modified)
- **Build status**: Clean
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass
- **Lint status**: 0 errors, 1 warning
- **Tests added/modified**: None yet

## Loaded Skills
- **Source**: none
- **Local copy**: none
- **Core methodology**: none
