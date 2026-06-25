# Phase 4 E2E Testing Infrastructure Plan

## 1. Observation
From inspecting the Veldra codebase, database schemas, and migration files, the following details were directly observed:

### A. Case and Applicant Creation
* **Database Tables**:
  - `cases` (defined in `supabase/migrations/00000000000000_init_cases.sql` and modified in `0002_phase3c_remediation.sql`):
    ```sql
    CREATE TABLE cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      status case_status NOT NULL DEFAULT 'Draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ```
  - `applicants` (defined in `supabase/migrations/00000000000000_init_cases.sql` and modified in `0002_phase3c_remediation.sql`):
    ```sql
    CREATE TABLE applicants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ```
* **RPC Function**:
  - `create_case_with_applicant` (defined in `supabase/migrations/0002_phase3c_remediation.sql`, lines 6-33):
    ```sql
    CREATE OR REPLACE FUNCTION create_case_with_applicant(
      p_first_name TEXT,
      p_last_name TEXT,
      p_date_of_birth DATE
    ) RETURNS UUID AS $$
    DECLARE
      v_case_id UUID;
      v_user_id UUID;
      v_role TEXT;
    ...
    BEGIN
      v_user_id := auth.uid();
      v_role := get_user_role();

      IF v_role NOT IN ('Admin', 'Reviewer') THEN
        RAISE EXCEPTION 'Unauthorized';
      END IF;

      INSERT INTO cases (status) VALUES ('Draft') RETURNING id INTO v_case_id;
      
      INSERT INTO applicants (case_id, first_name, last_name, date_of_birth) 
      VALUES (v_case_id, p_first_name, p_last_name, p_date_of_birth);

      INSERT INTO activity_logs (case_id, user_id, role, action_type, description)
      VALUES (v_case_id, v_user_id, v_role, 'CASE_CREATED', 'Initial case created');

      RETURN v_case_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
    ```
* **Server Action Implementation**:
  - Found in `src/features/cases/actions/index.ts`, lines 33-57, which uses a Zod schema (`CreateCaseSchema`) to validate parameters and calls `create_case_with_applicant` through a Supabase server client.

### B. Database Schema, Roles, and RLS Policies
* **User Roles**:
  - The roles table is `user_roles` (defined in `0001_architecture_hardening.sql`, lines 2-5):
    ```sql
    CREATE TABLE user_roles (
      user_id UUID PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('Admin', 'Reviewer'))
    );
    ```
  - The function `get_user_role()` (modified in `0002_phase3c_remediation.sql`, lines 2-4) fetches the role of `auth.uid()`.
* **Row Level Security (RLS)**:
  - Enabled on all tables (`cases`, `applicants`, `documents`, `findings`, `generated_drafts`, `export_packages`, `activity_logs`, `user_roles`).
  - Access policies (defined in `0002_phase3c_remediation.sql`, lines 52-93) restrict SELECT, INSERT, and UPDATE operations to authenticated users with roles `'Admin'` or `'Reviewer'`.
  - DELETE operations on `cases`, `applicants`, `documents`, `findings`, etc., are restricted to the `'Admin'` role only.
* **Phase 4 Documents Schema and Storage**:
  - Re-created in `supabase/migrations/20260622000000_phase4_documents.sql`, replacing the placeholder table.
  - Contains fields `type` (Enum check: `PSABirth`, `PSAMarriage`, `TOR`, `SF10`, `Diploma`), `file_path`, `file_name`, `file_size`, `mime_type`, `status` (defaulting to `'uploaded'`), `uploaded_by`, and audit columns.
  - Configures a private storage bucket named `documents`.
  - RLS policies on `storage.objects` allow SELECT and INSERT for `Admin` and `Reviewer` roles. **A DELETE policy is omitted on storage.objects** to prevent client-side deletions and force deletions through the `delete_document` RPC.
  - RPC function `delete_document(p_document_id)` (lines 174-232) deletes the object from `storage.objects` and the metadata from `public.documents`, verifying ownership for Reviewers.

### C. Authentication in the Current Workspace
* There is no login form or `/login` page in `src/app/` (verified page routes: `cases`, `cases/[id]`, `drafts`, `exports`, `settings`, and index dashboard).
* The Next.js middleware `src/lib/supabase/middleware.ts` runs `supabase.auth.getUser()` to refresh session tokens but does not redirect unauthenticated requests to a login page.
* Environment variables inside `.env.example` include:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
* No `.env` or `.env.local` file is present in the workspace directory.

### D. Testing Infrastructure
* No test scripts or dependencies (like Playwright, Jest, or Vitest) are configured in `package.json`.
* Two helper files (`test.ts` and `test_rpc2.ts`) exist in the project root but are not part of an automated test suite.

---

## 2. Logic Chain
To create a fully automated, opaque-box E2E test suite for Phase 4 of Veldra, the following logical requirements emerge from the observations:

1. **No UI Login Route Available**: Because there is no frontend login page, tests cannot login by interacting with forms. Instead, E2E tests must authenticate programmatically via the Supabase Auth API and inject the authentication cookies directly into the browser context (e.g. Playwright `BrowserContext`).
2. **Role Verification and Setup**: Since roles are checked at the database level by looking up `auth.uid()` in `public.user_roles`, the test suite requires a way to bypass RLS to create users and assign roles. The `SUPABASE_SERVICE_ROLE_KEY` must be loaded in the test environment to initialize the Supabase client with admin privileges (`supabase.auth.admin.createUser`) and insert corresponding role rows into `public.user_roles` prior to E2E runs.
3. **Preventing Orphan Files in Storage**: A standard database cascading delete on `cases` will clean up database rows but **will not delete** corresponding files in the `documents` storage bucket (since there is no trigger on `documents` to delete files from `storage.objects`). If tests simply delete test cases from the database, they will leak files in the storage emulator. Therefore, E2E teardown scripts must explicitly clean up storage files at `cases/{case_id}/*` using the Supabase storage administration API.
4. **Tooling Fit**: Playwright is selected as the primary test runner because it supports multi-user contexts (testing Admin vs Reviewer roles side-by-side in separate browser instances), handles Next.js App Router server actions natively, and integrates with the local Supabase emulator.
5. **Folder Architecture Compliance**: To comply with Veldra's strict feature-based folder layout, test files should be co-located under `src/features/<feature>/tests/` (e.g., `src/features/cases/tests/` and `src/features/documents/tests/`), while configurations and shared setup scripts remain in the root directory or a specialized helper module.

---

## 3. Caveats
* **Local/CI Environment Scoped**: This E2E test runner plan assumes it runs against a local Supabase emulator (e.g., Docker environment started via `supabase start`). The use of `SUPABASE_SERVICE_ROLE_KEY` is mandatory for setting up roles and cleaning up database tables. Running this suite against a production or shared staging database is highly discouraged as database and storage cleanup steps will delete data.
* **No Supervisor Role Configured**: Although `docs/USER_ROLES.md` mentions a `Supervisor` role, the database migrations check constraint only permits `'Admin'` or `'Reviewer'`. Thus, E2E tests will only verify the `Admin` and `Reviewer` roles.

---

## 4. Conclusion (Testing Plan)
This section outlines the complete plan to set up E2E testing for Veldra.

### A. Library Installation
To implement this infrastructure, the following devDependencies should be added to `package.json`:
* `@playwright/test`: E2E test runner and browser automation.
* `@supabase/supabase-js`: SDK to seed and verify database state.
* `dotenv`: Loads environment variables for tests.

### B. Directory Layout
The test files will be structured as follows:
```text
veldra/
├── playwright.config.ts                     # Root Playwright configuration
├── tests/
│   └── helpers/
│       ├── db-utils.ts                      # DB seeding, RLS bypass client, and cleanup
│       └── auth-utils.ts                    # Helper to log in and set up Playwright cookies
└── src/
    └── features/
        ├── cases/
        │   └── tests/
        │       └── case-creation.e2e.spec.ts # Co-located cases E2E tests
        └── documents/
            └── tests/
                └── document-uploads.e2e.spec.ts # Co-located documents E2E tests
```

### C. Playwright Configuration File (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Read local environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  testDir: './src/features',
  testMatch: '**/*.e2e.spec.ts',
  timeout: 30000,
  fullyParallel: false, // Run tests sequentially to avoid DB and storage conflicts
  workers: 1,           // Keep to 1 worker to ensure clean state transitions in Postgres
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start local server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### D. Helper Module: Database & Storage Utilities (`tests/helpers/db-utils.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client that bypasses RLS
export const adminSupabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Creates a test user in auth.users and assigns a role in public.user_roles.
 */
export async function createTestUser(email: string, password: string, role: 'Admin' | 'Reviewer') {
  // Check if user already exists
  const { data: users, error: listError } = await adminSupabase.auth.admin.listUsers();
  if (listError) throw listError;

  let userId: string;
  const existingUser = users.users.find(u => u.email === email);

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;
    userId = newUser.user!.id;
  }

  // Assign role (UPSERT to avoid conflicts)
  const { error: roleError } = await adminSupabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
    
  if (roleError) throw roleError;

  return userId;
}

/**
 * Deletes all cases created during tests, which triggers cascading deletes in DB tables,
 * and explicitly cleans up associated storage files.
 */
export async function cleanUpTestCase(caseId: string) {
  // 1. Delete storage files under the case prefix
  const { data: files, error: listError } = await adminSupabase.storage
    .from('documents')
    .list(`cases/${caseId}`);

  if (!listError && files && files.length > 0) {
    const pathsToDelete = files.map(f => `cases/${caseId}/${f.name}`);
    await adminSupabase.storage.from('documents').remove(pathsToDelete);
  }

  // 2. Delete the case itself (cascades to applicants, documents, activity_logs, findings, generated_drafts)
  await adminSupabase.from('cases').delete().eq('id', caseId);
}
```

### E. Helper Module: Authentication Cookie Injection (`tests/helpers/auth-utils.ts`)
```typescript
import { BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Logs in programmatically and injects session cookies into the Playwright context.
 */
export async function loginAs(context: BrowserContext, email: string, password: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error('No session returned');

  const { access_token, refresh_token } = data.session;

  // Next.js Supabase SSR uses cookie format 'sb-<project-ref>-auth-token'
  // To construct the cookie name, we extract the project domain/ref from the Supabase URL
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0] || 'localhost-ref';
  const cookieName = `sb-${projectRef}-auth-token`;

  const sessionData = [access_token, refresh_token];

  // Set auth cookies directly on the Playwright browser context
  await context.addCookies([
    {
      name: cookieName,
      value: JSON.stringify(sessionData),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}
```

### F. Test Runner Lifecycle & Step-by-Step Execution Plan

1. **Pre-test Runner Setup (Global Setup)**:
   - Playwright invokes global setup.
   - Seed test users: `test-admin@veldra.local` (role: Admin) and `test-reviewer@veldra.local` (role: Reviewer) with passwords.
   - Set up user records in `auth.users` and roles in `public.user_roles`.
2. **Before Each Test**:
   - Create a fresh Playwright browser context.
   - Authenticate the context with either the `Admin` or `Reviewer` role using the `loginAs` helper.
3. **Execution Phase (DOM + Action interactions)**:
   - Navigate to `/cases` dashboard.
   - Click "Create Case" button, fill in the applicant details (Zod schema: First Name, Last Name, Date of Birth).
   - Verify case card appears on `/cases` page.
   - Click on the case card to navigate to `/cases/{id}`.
   - Upload file (e.g. mock PDF) using the drag-and-drop / file selector zone.
4. **Opaque-Box Verification Phase**:
   - Verify the DOM: check if the uploaded document list displays the correct file name, type, and size.
   - Direct DB assertions (using the `adminSupabase` client):
     - Assert that a row exists in `public.cases` with the correct ID.
     - Assert that `public.applicants` has a matching record.
     - Assert that `public.documents` has a record containing the correct `mime_type`, `file_name`, `case_id`, and `uploaded_by` (matching the reviewer's UID).
     - Assert that `public.activity_logs` has records for both `'CASE_CREATED'` and `'DOCUMENT_UPLOADED'`.
   - Direct Storage assertions (using the `adminSupabase` client):
     - Assert that the file is present in the `documents` bucket under `cases/{case_id}/{document_id}` by running `supabase.storage.from('documents').list(...)`.
5. **Teardown & Cleanup Phase**:
   - Delete mock files from the `documents` storage bucket.
   - Run SQL deletion on `cases` using the `adminSupabase` client to delete cases and cascade delete applicant, document metadata, and activity logs.
   - Close browser contexts.

---

## 5. Verification Method
To verify that this E2E test plan is valid and works as expected:

1. **Review Database Schema & Policies**:
   - Verify the `create_case_with_applicant` function in `supabase/migrations/0002_phase3c_remediation.sql` matches the arguments we documented.
   - Verify the `documents` table and `delete_document` RPC structure in `supabase/migrations/20260622000000_phase4_documents.sql` to confirm that the `uploaded_by` default and storage delete triggers match our cleanup logic.
2. **Validate Playwright and SDK Compatibility**:
   - Ensure `@playwright/test` and `@supabase/supabase-js` are installable without TS compile errors.
   - Validate cookie formatting (Next.js SSR client constructs the cookie name as `sb-${project-ref}-auth-token` using the subdomain of the Supabase URL).
3. **Run Manual DB Query to confirm Cascading Rules**:
   - Connect to local database, insert a case and document.
   - Delete the case, and verify that the document metadata is deleted from the `public.documents` table.
   - Confirm that the file itself **remains** in `storage.objects` until explicitly deleted via `delete_document` RPC or direct bucket deletion, verifying the caveat regarding orphan storage files.
