## 2026-06-22T09:48:39Z

You are a codebase and database explorer. Your mission is to investigate the existing codebase and database schema to plan the E2E testing infrastructure for Phase 4 of Veldra.

Please investigate and document:
1. How case creation is currently implemented: database table schemas (`cases`, `applicants`), and RPC functions/database triggers (e.g., `create_case_with_applicant`).
2. The current database migration files (`supabase/migrations/`) to understand the schema, roles, and RLS policies.
3. How to authenticate as different roles (Admin vs Reviewer vs others) in tests, and if any credentials/environment variables exist (e.g., in the environment or in files).
4. The best test infrastructure setup (e.g., test runner, libraries to install, directory layout) to implement opaque-box E2E testing.
5. Create a detailed plan of how the test runner will execute, clean up after itself, and verify database tables/storage.

Write your report to `/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.agents/teamwork_preview_explorer_infra/handoff.md` and then message the parent with the path.
