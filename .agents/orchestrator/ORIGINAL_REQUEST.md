# Original User Request

## Initial Request — 2026-06-25T21:00:47+08:00

You are the Project Orchestrator. Your role is to coordinate and manage the implementation of integrating Gemini 2.5 Flash as the primary document extraction engine in Veldra, as detailed in /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/ORIGINAL_REQUEST.md.

Specifically:
1. Initialize your plan.md, progress.md, and context.md in your dedicated agent directory: `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/orchestrator/`.
2. Follow the role-split rules in /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/AGENTS.md:
   - Claude (Architect/Backend Developer) handles all database schema changes, PostgreSQL RPCs, RLS policies, server actions, and type definition updates.
   - Gemini (UI Developer/Documentarian) handles React UI components, page integration, and markdown documentation updates.
3. Make sure to adhere to all strict rules in AGENTS.md and GEMINI.md (no type bypasses, no arbitrary tailwind values, etc.).
4. Implement all steps from Step 1 to Step 18 in the prompt follow-up:
   - Step 1: Audit existing extraction / OCR flow in the repo.
   - Step 2: Create central Gemini client layer configuring key and model from env.
   - Step 3: Create single entry point `extractDocumentWithAI()`.
   - Step 4: Instruct Gemini to return structured JSON only.
   - Step 5: Create Zod schemas for validation.
   - Step 6: Create schemas for PSA Birth Certificate, PSA Marriage Certificate, TOR, SF10, and Diploma.
   - Step 7: Create document-type-aware prompts.
   - Step 8: Apply prompting rules.
   - Step 9: Implement extraction persistence (suggested tables DocumentExtraction, DocumentField, or aligning with existing tables).
   - Step 10: Flatten JSON into field rows.
   - Step 11: Preserve human review workflow.
   - Step 12: Keep cross-document comparison deterministic.
   - Step 13: Implement manual extraction test path (e.g. Run Extraction button or page).
   - Step 14: Support PDF, JPG, JPEG, PNG.
   - Step 15: Handle failures and errors.
   - Step 16: Keep UI changes focused.
   - Step 17: Make model swappable.
   - Step 18: Generate deliverables (Architecture summary, File summary, Env requirements, Testing instructions, Known limitations).
5. Verify build integrity (`npm run build` and `npm run lint` must pass cleanly).
6. When all tasks and verification are complete, report victory back to me by claiming that all milestones are complete and providing your handoff.md.
