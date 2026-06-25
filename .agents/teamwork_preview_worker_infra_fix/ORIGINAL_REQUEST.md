## 2026-06-22T02:09:04Z
You are a test infrastructure worker. Your mission is to fix the quality and robustness issues identified in the reviews of our testing infrastructure (Milestone 1).

Please perform the following updates:
1. Update `tests/helpers/db-utils.ts`:
   - Replace the paginated `listUsers()` calls in `createTestUser` and `deleteUserByEmail` with a robust paginated loop `findUserByEmail(email: string)` that paginates through all users (e.g. page-by-page with limit 100) until the user is found or there are no more pages.
   - Refactor `cleanUpTestCase(caseId: string)`: Instead of using `storage.list()` (which is non-recursive and limited), first query the `documents` table using `adminSupabase` client (selecting the `file_path` column for rows matching the `caseId`). Then delete those exact storage paths from the 'documents' bucket. Finally delete the case record from the database.
2. Update `tests/helpers/auth-utils.ts`:
   - Set the cookie `domain` dynamically: use the hostname derived from the test `baseURL` (e.g., `const domain = new URL(baseURL).hostname;`).
   - Fix the local Supabase CLI url `projectRef` determination. If `supabaseUrl` is a local hostname (like `127.0.0.1` or `localhost`), use the full hostname for `projectRef`. If it's a supabase cloud URL (ends with `.supabase.co` or `.supabase.net`), use the first subdomain part. E.g.:
     ```typescript
     const isSupabaseHost = url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.net');
     const projectRef = isSupabaseHost ? url.hostname.split('.')[0] : url.hostname;
     const cookieName = `sb-${projectRef}-auth-token`;
     ```
3. Update `tests/smoke.e2e.spec.ts`:
   - Replace the deprecated selector `page.locator('role=main')` with `page.getByRole('main')`.
4. Update `playwright.config.ts`:
   - Ensure the webServer can adapt to port changes or is robust under local execution. (e.g. check if BASE_URL hostname is localhost and adapt or allow port override).
5. Verify your changes compile correctly (`npx tsc --noEmit`) and lint successfully (`npm run lint`).
6. Write a handoff report documenting the fixes at `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_worker_infra_fix/handoff.md` and message the parent when done.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
