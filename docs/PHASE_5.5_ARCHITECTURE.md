# Veldra Phase 5.5 - Architecture Summary & Deliverables

## Architecture Summary
The system has been updated to follow the Recommended Production Flow, heavily isolating Artificial Intelligence, Comparison logic, Draft Generation, and Storage. 

The pipeline works as follows:
1. **Upload**: Documents are uploaded directly to Supabase Storage via `src/lib/storage/uploads.ts`.
2. **AI Extraction**: Gemini 2.5 Flash acts as the primary document extraction engine, configured centrally in `src/lib/ai/gemini.ts` and extracting strict JSON via `src/lib/ai/extraction.ts`. All OCR regex defaults have been removed.
3. **Comparison Engine**: Comparison logic is strictly deterministic and isolated under `src/lib/comparison/` (Name, Date, Address, Timeline). It cross-references final or reviewed field values.
4. **Draft Generation**: HTML Draft templates for Affidavits, Address Explanations, and Gap Letters are generated purely deterministically via `src/lib/generation/`.
5. **PDF Generation**: A dedicated PDF service utilizing `puppeteer` (`src/lib/pdf/puppeteer.ts`) converts these HTML drafts into downloadable PDF verification reports.
6. **Supabase Storage**: All PDFs and original documents live in Supabase Storage (`documents/` and `exports/` buckets).

## Files Created
- `src/lib/ai/gemini.ts`, `src/lib/ai/prompts.ts`, `src/lib/ai/schemas.ts`, `src/lib/ai/extraction.ts`
- `src/lib/comparison/compareNames.ts`, `compareDates.ts`, `compareAddresses.ts`, `compareTimeline.ts`
- `src/lib/generation/affidavit.ts`, `src/lib/generation/letters.ts`, and templates inside `src/lib/generation/templates/`
- `src/lib/pdf/puppeteer.ts`, `src/lib/pdf/export.ts`
- `src/lib/storage/uploads.ts`, `src/lib/storage/downloads.ts`

## Files Modified
- `src/features/extractions/actions/index.ts` (Wired Gemini extraction)
- `src/features/findings/actions/index.ts` (Wired deterministic comparison library)
- `src/features/drafts/actions/index.ts` (Wired deterministic generation templates)
- `src/features/exports/actions/index.ts` (Wired PDF export service)

## Database Changes
- Dropped legacy OCR tables.
- Added structured tables for `document_extractions` and `document_fields`.
- Updated Reviewer RLS policies to allow soft-deletion where necessary.

## Gemini Integration Explanation
Gemini 2.5 Flash is wired exclusively for **structured JSON extraction**. 
We read `GEMINI_API_KEY` from the `.env` file. We do NOT ask Gemini to make legal decisions or write drafts. Gemini reads the image/PDF buffer and maps the data to Zod schemas (e.g., PSA Birth Certificate Schema). It falls back to `null` instead of hallucinating if parts of the document are unreadable.

## PDF Generation Explanation
We integrated `puppeteer-core` to provide Headless Chromium PDF rendering. When the user exports a Case, the system takes the accepted Findings and generated Drafts, converts them into a stylized HTML template string, and spins up a headless browser to "print" this HTML to an A4 PDF buffer.

## Supabase Storage Integration Explanation
All binaries are kept out of Postgres.
- `documents/`: Stores original applicant uploads (PDF, JPEG, PNG).
- `exports/`: Stores the finalized Verification Report PDFs.
Both use standard Supabase Storage APIs with signed URLs for secure downloads.

## End-to-End Testing Instructions
1. Navigate to an Applicant Case.
2. Upload a new PSA Birth Certificate (PDF or JPG).
3. The system will process it with Gemini 2.5 Flash and populate `document_fields`.
4. Run the deterministic "Compare Documents" feature to flag discrepancies.
5. Accept the Discrepancies to auto-generate Drafts based on deterministic HTML templates.
6. Click "Export PDF". Puppeteer will render the final PDF and store it in Supabase for download.

## Known Limitations
1. **PDF Parsing with Gemini**: Very large PDFs may hit the payload limit. We currently assume standard 1-2 page certificates.
2. **Puppeteer Dependencies**: `puppeteer` requires native OS binaries (like `tar`, `unzip`, or a system Chrome) to run locally, which may cause setup friction on some Windows WSL environments. We run `puppeteer-core` with skipped downloads in production environments like Vercel and hook it to a Chromium serverless layer.
3. **TOR Table Extraction**: Deep academic record parsing (term-by-term grades) is currently superficial; the schema supports it, but the prompt limits token output for cost efficiency.

## Future Extension Points
- Implement `@sparticuz/chromium` specifically for Vercel Serverless deployments of the PDF generator.
- Expand `compareTimeline.ts` to map overlapping academic terms.
- Support DOCX export using `docxtemplater` as an alternative to Puppeteer PDFs.
