# Phase 5 E2E Testing Plan: Document Analysis and Findings Engine UI

This testing plan outlines the Playwright E2E test suite for Phase 5 (Document Analysis and Findings Engine UI) of Veldra. The tests are structured using Veldra's 4-tier testing methodology, ensuring complete coverage from happy paths to edge cases and real-world multi-step scenarios.

---

## 1. Test Architecture & Setup

### Database Seeding and Cleanup
Tests will use programmatic authentication and database helpers to avoid relying on slow UI setup steps.
- **Seeding Users**: Use `createTestUser(email, password, role)` from `tests/helpers/db-utils.ts` in `beforeAll` blocks.
- **Seeding Test Cases & Documents**: Programmatically insert test cases and documents into Supabase to prepare the state for each test.
- **Cleanup**: Call `cleanUpTestCase(caseId)` in `afterEach` or `afterAll` blocks to remove cases, documents, findings, and storage bucket files to keep the test environment clean and isolate test runs.

### Selector Strategy
To keep tests robust and maintainable, we will use the following selectors:
- **Test ID attributes**: Add `data-testid` to key interactive elements (e.g., `data-testid="run-analysis-btn"`, `data-testid="finding-card"`, `data-testid="comparison-panel"`).
- **Accessibility Roles**: Use Playwright's `page.getByRole()` (e.g., `getByRole('button', { name: 'Run Analysis' })`, `getByRole('combobox')` for finding status dropdown).
- **Semantic Text Selection**: Use `page.getByText()` for unique labels and descriptions.

---

## 2. Test Cases (Tiers 1-4)

### Tier 1: Feature Coverage (Happy Path)
These tests ensure the core features of Phase 5 operate successfully under normal conditions.

#### Test 1.1: Trigger Analysis & View Findings Workspace
- **Objective**: Verify clicking "Run Analysis" on an `Uploaded` case triggers processing, transitions case state, and displays the split-screen workspace.
- **Setup**: Seed a case with status `Uploaded` and 2 uploaded documents.
- **Steps**:
  1. Login and navigate to `/cases/{caseId}`.
  2. Verify the "Run Analysis" button is visible and active.
  3. Click "Run Analysis".
  4. Verify loading/processing indicator is displayed.
  5. Verify page reloads/revalidates.
  6. Verify Case Status changes to `NeedsReview` (using `CaseStatusBadge`).
  7. Verify the `CaseFindingsWorkspace` is visible and renders findings list.
- **Assertions**:
  - `expect(page.getByRole('button', { name: 'Run Analysis' })).toBeVisible()`
  - `expect(page.locator('[data-testid="case-status-badge"]')).toHaveText('Needs Review')`
  - `expect(page.locator('[data-testid="findings-workspace"]')).toBeVisible()`

#### Test 1.2: Display and Select Finding
- **Objective**: Verify that finding details display correctly on `FindingCard` and selecting a finding loads documents in `DocumentComparisonPanel`.
- **Setup**: Seed a case in `NeedsReview` state with 1 finding linked to 2 documents.
- **Steps**:
  1. Navigate to `/cases/{caseId}`.
  2. Verify `FindingCard` displays title, description, category, and severity badge.
  3. Click on the `FindingCard` to select it.
  4. Verify the `DocumentComparisonPanel` displays two document viewers side-by-side.
- **Assertions**:
  - `expect(page.getByText('First Name Spelling Mismatch')).toBeVisible()`
  - `expect(page.locator('[data-testid="document-comparison-panel"]')).toBeVisible()`
  - `expect(page.locator('[data-testid="document-viewer"]')).toHaveCount(2)`

#### Test 1.3: Update Finding Status
- **Objective**: Verify that updating a finding's status invokes the server action, writes to activity logs, and updates the UI status badge.
- **Setup**: Seed a case in `NeedsReview` state with 1 finding in `Open` status.
- **Steps**:
  1. Navigate to `/cases/{caseId}`.
  2. Click the status selector dropdown on the `FindingCard`.
  3. Change the status from `Open` to `Accepted`.
  4. Verify the status indicator badge on the card updates to `Accepted`.
- **Assertions**:
  - `await page.locator('[data-testid="finding-status-select"]').selectOption('Accepted')`
  - `await expect(page.locator('[data-testid="finding-card-status-badge"]')).toHaveText('Accepted')`

---

### Tier 2: Boundary and Corner Cases
These tests verify system behavior under abnormal, missing, or extreme inputs.

#### Test 2.1: Run Analysis with No/Insufficient Documents
- **Objective**: Verify that running analysis on a case with 0 or 1 documents completes without errors, does not generate mismatch findings, and displays a clean state.
- **Setup**: Seed a case with status `Uploaded` but only 1 uploaded document.
- **Steps**:
  1. Navigate to `/cases/{caseId}`.
  2. Click "Run Analysis".
  3. Verify status transitions to `NeedsReview`.
  4. Verify the workspace renders an empty findings state.
- **Assertions**:
  - `expect(page.getByText('No discrepancies found')).toBeVisible()`
  - `expect(page.locator('[data-testid="finding-card"]')).toHaveCount(0)`

#### Test 2.2: Extreme/Long Text Content in Finding Card
- **Objective**: Verify that very long titles or descriptions do not break the card layout or overlap with action elements.
- **Setup**: Seed a finding with a 200-character title and 1000-character description.
- **Steps**:
  1. Navigate to `/cases/{caseId}`.
  2. Verify the card renders without layout breaks and the text wraps properly.
- **Assertions**:
  - `expect(page.locator('[data-testid="finding-card"]')).toBeVisible()`
  - Verify styling elements like `overflow-hidden` or text-wrapping classes are applied.

#### Test 2.3: Attempt Unauthorized Status Updates
- **Objective**: Verify that a user without proper permissions (e.g. role not Admin/Reviewer) cannot perform status updates and is shown an error.
- **Setup**: Seed a test user with a Guest/unauthorized role (or simulate lack of auth).
- **Steps**:
  1. Attempt to select status dropdown or trigger `updateFindingStatus` API call.
  2. Verify UI disables controls or shows a permission error toast.
- **Assertions**:
  - `expect(page.locator('[data-testid="finding-status-select"]')).toBeDisabled()`

---

### Tier 3: Cross-Feature Combinations
These tests check integration points between different system features.

#### Test 3.1: Document Upload -> Run Analysis -> Resolve Findings Lifecycle
- **Objective**: Verify a complete pipeline starting from document ingestion to finding resolution.
- **Setup**: Seed a clean case in `Draft` state.
- **Steps**:
  1. Navigate to `/cases/{caseId}` and upload two document files.
  2. Trigger "Run Analysis" and wait for transition to `NeedsReview`.
  3. Select the generated finding and verify side-by-side view displays the uploaded files.
  4. Resolve the finding and verify the case progresses to `Reviewed` eligibility.
- **Assertions**:
  - Verify document list updates on upload.
  - Verify findings appear.
  - Verify status updates dynamically.

#### Test 3.2: Linked Document Deletion Impact
- **Objective**: Verify that deleting a document that is currently linked to a finding updates the finding links and handles the rendering gracefully.
- **Setup**: Seed a case in `NeedsReview` with 1 finding linked to 2 documents.
- **Steps**:
  1. Delete one of the uploaded documents.
  2. Select the finding.
  3. Verify the comparison panel handles the missing document by displaying a placeholder or showing "Document no longer exists" in that pane.
- **Assertions**:
  - `expect(page.getByText('Document unavailable')).toBeVisible()`

---

### Tier 4: Real-World Scenarios
These tests check complex, multi-role user journeys representing standard daily operations.

#### Test 4.1: Reviewer Workflow - Triage Case with Name Mismatch
- **Objective**: End-to-end walk-through of a reviewer inspecting a mismatch, accepting it, and confirming the status is tracked in the system.
- **Steps**:
  1. Reviewer logs in and creates a case for "Jane Doe".
  2. Reviewer uploads PSA Birth Certificate and TOR.
  3. Reviewer clicks "Run Analysis".
  4. Once analysis completes, reviewer selects the "Name Mismatch" finding.
  5. Reviewer reviews the names side-by-side (e.g., "Jane Doe" vs "Jayne Doe").
  6. Reviewer marks the finding as `Accepted` (since it's a true mismatch requiring an affidavit).
  7. Reviewer verifies the activity log under the Case details records "Finding status updated to Accepted by Reviewer".
- **Assertions**:
  - Full E2E flow completion checks using multiple page actions and state assertions.

---

## 3. Verification Method

Once Phase 5 backend and frontend features are implemented, the E2E tests can be executed locally using Playwright:

```bash
# Run all E2E tests
npx playwright test

# Run a specific spec file
npx playwright test tests/findings.e2e.spec.ts

# Run tests in UI mode for debugging
npx playwright test --ui
```
