# E2E Test Infrastructure Review Report

## 1. Observation

During my review, I inspected the following files:
*   `playwright.config.ts`
*   `tests/helpers/db-utils.ts`
*   `tests/helpers/auth-utils.ts`
*   `tests/smoke.e2e.spec.ts`

I ran `npm run lint` which passed successfully:
```text
> veldra@0.1.0 lint
> next lint

✔ No ESLint warnings or errors
```

I ran `npm run build` which encountered a filesystem issue common to WSL mounts:
```text
Error: ENOENT: no such file or directory, open '/mnt/c/Users/CJK_LAPTOP/Personal_Projects/Javascript/veldra/.next/server/pages-manifest.json'
```
However, the TypeScript compilation step succeeded (`✓ Linting and checking validity of types`), verifying there are no static type errors.

I ran `npx playwright test` which failed because no environment variables were configured:
```text
Error: NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.
   at helpers/db-utils.ts:8
```

I observed the following code sections:

### 1. WebServer Port Conflict Behavior
In `playwright.config.ts`, lines 17 and 26-31:
```typescript
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  ...
  webServer: {
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
```
And the execution log printed:
```text
[WebServer]  ⚠ Port 3000 is in use, trying 3001 instead.
```

### 2. Cookie Domain Hardcoding
In `tests/helpers/auth-utils.ts`, line 41:
```typescript
      domain: 'localhost',
```

### 3. Supabase Local Hostname Parsing
In `tests/helpers/auth-utils.ts`, lines 30-32:
```typescript
  const url = new URL(supabaseUrl);
  const projectRef = url.hostname.split('.')[0] || 'localhost';
  const cookieName = `sb-${projectRef}-auth-token`;
```

### 4. Paginated User Listing
In `tests/helpers/db-utils.ts`, lines 27 and 60:
```typescript
  const { data: users, error: listError } = await adminSupabase.auth.admin.listUsers();
```

### 5. Non-Recursive Storage Cleanup
In `tests/helpers/db-utils.ts`, lines 77-87:
```typescript
  try {
    const { data: files, error: listError } = await adminSupabase.storage
      .from('documents')
      .list(`cases/${caseId}`);

    if (!listError && files && files.length > 0) {
      const pathsToDelete = files.map(f => `cases/${caseId}/${f.name}`);
      await adminSupabase.storage.from('documents').remove(pathsToDelete);
    }
  } catch (err) {
```

### 6. Invalid Selector Syntax
In `tests/smoke.e2e.spec.ts`, line 27:
```typescript
    await expect(page.locator('role=main')).toBeVisible();
```

---

## 2. Logic Chain

1.  **WebServer Port Mismatch**: When the test environment has port 3000 occupied, Next.js starts on port 3001. Playwright's `webServer.url` is configured to wait for port 3000. If `reuseExistingServer` is `true`, Playwright sees port 3000 is occupied, assumes the correct server is already running there, and attempts to run tests against port 3000. This results in tests executing against an unrelated application or a stale dev instance, failing to run against the newly built server on port 3001.
2.  **Cookie Domain Mismatch**: If `baseURL` resolves to `127.0.0.1` or a custom hostname, setting `domain: 'localhost'` causes the browser to reject the cookie for the page's actual origin. The test will silently fail to authenticate and receive a 401/redirect.
3.  **Cookie Name Mismatch**: If `supabaseUrl` is `http://127.0.0.1:54321` (local Supabase CLI), `url.hostname.split('.')[0]` evaluates to `'127'`, making the cookie name `sb-127-auth-token`. However, `@supabase/ssr` expects `sb-127.0.0.1-auth-token` (the full hostname for non-subdomain URLs). This prevents the Next.js server middleware from locating the cookie.
4.  **Pagination Limitation**: `listUsers()` defaults to returning a single page of up to 50 users. In active development databases with >50 users, `find()` will fail to locate existing test users, triggering duplicate user registration errors.
5.  **PII Leaks in Storage**:
    *   `list()` is non-recursive. If document files are uploaded to nested paths (e.g., `cases/${caseId}/${documentId}/${filename}`), `list()` will return subdirectories but not the actual nested files. Thus, they will not be added to `pathsToDelete` and will be orphaned in Supabase Storage.
    *   Additionally, deleting a case cascades to `public.documents` database records. If the storage deletion fails or is skipped, the metadata is lost in SQL, making it impossible to identify which files in storage belong to that case.
6.  **Incorrect Selector API**: `page.locator('role=main')` is a deprecated selector engine. Modern Playwright requires `page.getByRole('main')`.

---

## 3. Caveats

*   I did not run the tests to full completion under success conditions because no `.env` or `.env.local` file was present in the repository, making it impossible to authenticate with a real Supabase instance.
*   I assumed that storage files might be nested. If the application design strictly enforces flat uploads directly to `cases/${caseId}/fileName`, the list deletion is partially functional, but still prone to pagination limits (Supabase storage list returns up to 100 objects by default).

---

## 4. Conclusion

### Verdict: REQUEST_CHANGES

The test infrastructure contains multiple bugs in cookie session injection, local webserver configuration, and cleanup robustness that will cause E2E tests to fail or leak resources.

---

## Quality Review Report

### Findings

#### [Critical] Finding 1: Invalid Selector Syntax
*   **What**: Deprecated selector string `'role=main'` is used.
*   **Where**: `tests/smoke.e2e.spec.ts:27`
*   **Why**: Deprecated selectors are fragile and can break across Playwright updates.
*   **Suggestion**: Change to `page.getByRole('main')`.

#### [Major] Finding 2: WebServer URL Mismatch under Port Conflicts
*   **What**: Hardcoded `http://localhost:3000` is used for both `baseURL` and `webServer.url`.
*   **Where**: `playwright.config.ts:17, 28`
*   **Why**: If port 3000 is occupied, the dev server boots on 3001, but Playwright reuses the server on 3000, running tests against a stale/unrelated application.
*   **Suggestion**: Extract the base URL and let Next.js automatically bind, or dynamically set port variables.

#### [Major] Finding 3: Local Supabase Cookie Naming Mismatch
*   **What**: `projectRef` splits local IPs by `.` and returns `'127'` instead of `'127.0.0.1'`.
*   **Where**: `tests/helpers/auth-utils.ts:31`
*   **Why**: The generated cookie `sb-127-auth-token` is ignored by `@supabase/ssr` which expects `sb-127.0.0.1-auth-token`.
*   **Suggestion**:
    ```typescript
    const isSupabaseHost = url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.net');
    const projectRef = isSupabaseHost ? url.hostname.split('.')[0] : url.hostname;
    const cookieName = `sb-${projectRef}-auth-token`;
    ```

#### [Major] Finding 4: Hardcoded Cookie Domain
*   **What**: Cookie domain is hardcoded to `'localhost'`.
*   **Where**: `tests/helpers/auth-utils.ts:41`
*   **Why**: If tests run against `127.0.0.1`, the browser ignores cookies set for `'localhost'`, leading to unauthenticated test failures.
*   **Suggestion**: Dynamically set domain to `new URL(baseURL).hostname`.

#### [Major] Finding 5: Paginated User Listing Limitation
*   **What**: `listUsers()` retrieves only 50 users.
*   **Where**: `tests/helpers/db-utils.ts:27, 60`
*   **Why**: Prevents finding or deleting test users if the database user count exceeds 50.
*   **Suggestion**: Paginate through all users or handle user insertion conflict gracefully using upsert and checking errors.

#### [Major] Finding 6: Storage Cleanup Leaks / Orphans
*   **What**: Case cleanup lists files in storage non-recursively.
*   **Where**: `tests/helpers/db-utils.ts:77-87`
*   **Why**: If documents are in subdirectories or the list exceeds the limit (100 objects), files will remain in storage and leak sensitive PII.
*   **Suggestion**: Query the `documents` table *first* for all `file_path` columns matching the `caseId`, delete those specific file paths from storage, and then delete the case.

### Verified Claims
*   *TypeScript Compilation* → verified via `npm run build` → **PASS** (compiles under strict: true)
*   *Linter Conformance* → verified via `npm run lint` → **PASS** (no warnings or errors)

---

## Adversarial Challenge Report

### Challenges

#### [High] Challenge 1: Silent Auth Failure via Domain Incompatibility
*   **Assumption challenged**: The browser page will always load on `localhost`.
*   **Attack scenario**: A user runs the test suite targeting `http://127.0.0.1:3000` or a staging site. The browser loads the page but blocks the hardcoded `localhost` cookie.
*   **Blast radius**: The smoke test completes, but acts as a guest, getting redirected to the login/unauthorized page. It fails asserting page content.
*   **Mitigation**: Dynamically extract host from `baseURL`.

#### [High] Challenge 2: PII Data Leaking on Case Deletion
*   **Assumption challenged**: Deleting a case correctly cleans up its storage files.
*   **Attack scenario**: If a case is deleted, database triggers/cascades wipe the metadata. But files remain in storage because they were in nested directories or list limits were hit.
*   **Blast radius**: Storing orphaned PII files violates data privacy constraints and increases cloud storage footprint.
*   **Mitigation**: Retrieve all file paths directly from `documents` table before deleting records.

---

## 5. Verification Method

To verify these findings:
1.  Create a `.env.local` file containing fake Supabase credentials (e.g., `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`).
2.  Run `npx playwright test` to see the cookie and URL errors in action:
    *   Verify the cookie name mismatch between Playwright's helper (`sb-127-auth-token`) and `@supabase/ssr` expectation.
    *   Run tests while port 3000 is occupied to trigger the webserver conflict.
