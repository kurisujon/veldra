## 2026-06-22T02:08:42Z

Act as Backend Explorer 3 (representing Claude) for Milestone 3 of Phase 4.
Your working directory is: /mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_explorer_m3_3/
Your parent (Orchestrator) Conversation ID is: 8668de1e-b542-4cdc-bfce-1fdb861ab4e0

Tasks:
1. Initialize BRIEFING.md and progress.md in your working directory.
2. Investigate Veldra's existing server action patterns and Zod validation patterns.
3. Review global PROJECT.md and local SCOPE.md.
4. Formulate a detailed design for Milestone 3 (Backend Server Actions & Types) including:
   - File locations: `src/features/documents/actions.ts`, `src/features/documents/validation.ts`, `src/features/documents/types.ts`.
   - Zod validation schemas for document upload, delete, and retrieval.
   - Typescript type definitions in `src/features/documents/types.ts` reflecting database tables and custom interfaces.
   - Implementation logic for `uploadDocument(formData: FormData)`: Extract `caseId`, `type`, and `file`, validate inputs with Zod, upload the file to Supabase storage (private `documents` bucket under `cases/{case_id}/{document_id}`), and then invoke the `upload_document_record` RPC.
   - Implementation logic for `deleteDocument(documentId: string)`: Call the `delete_document` RPC (which handles deleting both the `storage.objects` row and `public.documents` row atomically).
   - Implementation logic for `getDocumentsByCase(caseId: string)`: Retrieve all document records for a given case.
5. Save your complete design in `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_explorer_m3_3/analysis.md`.
6. Send a message to your parent with a summary of your findings and the path to your analysis file. Do NOT write or execute any code files outside your agent directory.
