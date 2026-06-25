# Progress - Test Infrastructure Fixes

Last visited: 2026-06-22T10:09:04+08:00

- [x] Update `tests/helpers/db-utils.ts`
  - [x] Replace `listUsers` with paginated `findUserByEmail` (100 users per page)
  - [x] Refactor `cleanUpTestCase` to query database for files and delete those exact storage paths
- [x] Update `tests/helpers/auth-utils.ts`
  - [x] Dynamically resolve `domain` from test `baseURL`
  - [x] Fix local/cloud Supabase CLI url `projectRef` determination
- [x] Update `tests/smoke.e2e.spec.ts`
  - [x] Change deprecated locator `role=main` to `page.getByRole('main')`
- [x] Update `playwright.config.ts`
  - [x] Adapt webServer to port changes/local execution
- [ ] Verify compilation (`npx tsc --noEmit`) and linting (`npm run lint`)
- [ ] Create handoff.md and report to parent
