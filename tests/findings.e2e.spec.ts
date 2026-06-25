import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true })

import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import { adminSupabase, createTestUser, deleteUserByEmail, cleanUpTestCase } from './helpers/db-utils'
import { loginAs } from './helpers/auth-utils'

const ADMIN_EMAIL = 'test-findings-admin@veldra.local'
const ADMIN_PASSWORD = 'AdminFindingsPassword123!'

const GUEST_EMAIL = 'test-findings-guest@veldra.local'
const GUEST_PASSWORD = 'GuestFindingsPassword123!'

test.describe('Findings Engine E2E Tests', () => {
  let seededCaseIds: string[] = []
  let dummyFilePath1: string
  let dummyFilePath2: string

  test.beforeAll(async () => {
    // Seed the test users
    await createTestUser(ADMIN_EMAIL, ADMIN_PASSWORD, 'Admin')
    await createTestUser(GUEST_EMAIL, GUEST_PASSWORD, 'Guest' as any)

    // Create dummy files for uploads
    dummyFilePath1 = path.resolve('test-doc1.pdf')
    dummyFilePath2 = path.resolve('test-doc2.pdf')
    fs.writeFileSync(dummyFilePath1, 'PDF dummy content 1')
    fs.writeFileSync(dummyFilePath2, 'PDF dummy content 2')
  })

  test.afterAll(async () => {
    // Clean up test users
    await deleteUserByEmail(ADMIN_EMAIL)
    await deleteUserByEmail(GUEST_EMAIL)

    // Remove dummy files
    if (fs.existsSync(dummyFilePath1)) fs.unlinkSync(dummyFilePath1)
    if (fs.existsSync(dummyFilePath2)) fs.unlinkSync(dummyFilePath2)
  })

  test.afterEach(async () => {
    // Clean up seeded cases
    for (const caseId of seededCaseIds) {
      await cleanUpTestCase(caseId)
    }
    seededCaseIds = []
  })

  async function seedCase(status: 'Draft' | 'Uploaded' | 'NeedsReview') {
    const { data: caseRow, error: caseError } = await adminSupabase
      .from('cases')
      .insert({ status })
      .select()
      .single()
    if (caseError) throw caseError
    seededCaseIds.push(caseRow.id)

    // Insert applicant
    const { error: applicantError } = await adminSupabase
      .from('applicants')
      .insert({
        case_id: caseRow.id,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '2000-01-01'
      })
    if (applicantError) throw applicantError

    return caseRow
  }

  async function seedDocument(caseId: string, type: 'PSABirth' | 'TOR', fileName: string, filePath: string) {
    const { data: docRow, error: docError } = await adminSupabase
      .from('documents')
      .insert({
        case_id: caseId,
        type,
        file_path: filePath,
        file_name: fileName,
        file_size: 1024,
        mime_type: 'application/pdf'
      })
      .select()
      .single()
    if (docError) throw docError
    return docRow
  }

  async function seedFinding(caseId: string, title: string, description: string, severity: 'High' | 'Medium' | 'Low', category: 'Name Mismatch', status: 'Open' | 'Accepted') {
    const { data: findingRow, error: findingError } = await adminSupabase
      .from('findings')
      .insert({
        case_id: caseId,
        title,
        description,
        severity,
        category,
        status
      })
      .select()
      .single()
    if (findingError) throw findingError
    return findingRow
  }

  async function linkFindingDoc(findingId: string, documentId: string) {
    const { error } = await adminSupabase
      .from('finding_documents')
      .insert({
        finding_id: findingId,
        document_id: documentId
      })
    if (error) throw error
  }

  /*
   * ==========================================
   * TIER 1: Feature Coverage (Happy Path)
   * ==========================================
   */

  test('Test 1.1: Trigger Analysis & View Findings Workspace', async ({ page, context, baseURL }) => {
    // Setup: Seed case with status Uploaded and 2 uploaded documents
    const caseRow = await seedCase('Uploaded')
    await seedDocument(caseRow.id, 'PSABirth', 'birth.pdf', `cases/${caseRow.id}/birth.pdf`)
    await seedDocument(caseRow.id, 'TOR', 'tor.pdf', `cases/${caseRow.id}/tor.pdf`)

    await loginAs(context, ADMIN_EMAIL, ADMIN_PASSWORD, baseURL)
    await page.goto(`/cases/${caseRow.id}`)

    // Verify "Run Analysis" button is visible and click it
    const runBtn = page.locator('[data-testid="run-analysis-btn"]')
    await expect(runBtn).toBeVisible()
    await runBtn.click()

    // Wait for the workspace to render and check NeedsReview state
    const workspace = page.locator('[data-testid="findings-workspace"]')
    await expect(workspace).toBeVisible()

    const statusBadge = page.locator('[data-testid="case-status-badge"]')
    await expect(statusBadge).toHaveText('Needs Review')
  })

  test('Test 1.2: Display and Select Finding', async ({ page, context, baseURL }) => {
    // Setup: Seed case in NeedsReview, 1 finding linked to 2 documents
    const caseRow = await seedCase('NeedsReview')
    const doc1 = await seedDocument(caseRow.id, 'PSABirth', 'birth.pdf', `cases/${caseRow.id}/birth.pdf`)
    const doc2 = await seedDocument(caseRow.id, 'TOR', 'tor.pdf', `cases/${caseRow.id}/tor.pdf`)

    const finding = await seedFinding(caseRow.id, 'First Name Spelling Mismatch', 'Spelling mismatch description', 'High', 'Name Mismatch', 'Open')
    await linkFindingDoc(finding.id, doc1.id)
    await linkFindingDoc(finding.id, doc2.id)

    await loginAs(context, ADMIN_EMAIL, ADMIN_PASSWORD, baseURL)
    await page.goto(`/cases/${caseRow.id}`)

    // Verify Finding Card shows metadata
    const findingCard = page.locator('[data-testid="finding-card"]')
    await expect(findingCard).toBeVisible()
    await expect(page.getByText('First Name Spelling Mismatch')).toBeVisible()

    // Click finding card to select
    await findingCard.click()

    // Verify Document Comparison Panel is visible and shows files
    const comparisonPanel = page.locator('[data-testid="document-comparison-panel"]')
    await expect(comparisonPanel).toBeVisible()
  })

  test('Test 1.3: Update Finding Status', async ({ page, context, baseURL }) => {
    const caseRow = await seedCase('NeedsReview')
    const doc1 = await seedDocument(caseRow.id, 'PSABirth', 'birth.pdf', `cases/${caseRow.id}/birth.pdf`)
    const finding = await seedFinding(caseRow.id, 'Spelling Mismatch', 'Spelling mismatch', 'High', 'Name Mismatch', 'Open')
    await linkFindingDoc(finding.id, doc1.id)

    await loginAs(context, ADMIN_EMAIL, ADMIN_PASSWORD, baseURL)
    await page.goto(`/cases/${caseRow.id}`)

    // Select the finding
    await page.locator('[data-testid="finding-card"]').click()

    // Find and update status selector dropdown
    const select = page.locator('[data-testid="finding-status-select"]')
    await expect(select).toBeVisible()
    await select.selectOption('Accepted')

    // Verify the status badge updates to Accepted
    const statusBadge = page.locator('[data-testid="finding-card-status-badge"]')
    await expect(statusBadge).toHaveText('Accepted')
  })

  /*
   * ==========================================
   * TIER 2: Boundary and Corner Cases
   * ==========================================
   */

  test('Test 2.1: Run Analysis with No/Insufficient Documents', async ({ page, context, baseURL }) => {
    // Setup: Case with Uploaded status but only 1 document
    const caseRow = await seedCase('Uploaded')
    await seedDocument(caseRow.id, 'PSABirth', 'birth.pdf', `cases/${caseRow.id}/birth.pdf`)

    await loginAs(context, ADMIN_EMAIL, ADMIN_PASSWORD, baseURL)
    await page.goto(`/cases/${caseRow.id}`)

    await page.locator('[data-testid="run-analysis-btn"]').click()

    // Transitions to NeedsReview but findings list is empty
    const workspace = page.locator('[data-testid="findings-workspace"]')
    await expect(workspace).toBeVisible()
    await expect(page.getByText('No discrepancies found')).toBeVisible()
    await expect(page.locator('[data-testid="finding-card"]')).toHaveCount(0)
  })

  test('Test 2.2: Extreme/Long Text Content in Finding Card', async ({ page, context, baseURL }) => {
    const caseRow = await seedCase('NeedsReview')
    const doc1 = await seedDocument(caseRow.id, 'PSABirth', 'birth.pdf', `cases/${caseRow.id}/birth.pdf`)
    
    const longTitle = 'A'.repeat(200)
    const longDesc = 'B'.repeat(1000)

    const finding = await seedFinding(caseRow.id, longTitle, longDesc, 'High', 'Name Mismatch', 'Open')
    await linkFindingDoc(finding.id, doc1.id)

    await loginAs(context, ADMIN_EMAIL, ADMIN_PASSWORD, baseURL)
    await page.goto(`/cases/${caseRow.id}`)

    const card = page.locator('[data-testid="finding-card"]')
    await expect(card).toBeVisible()
    await expect(page.getByText(longTitle)).toBeVisible()
  })

  test('Test 2.3: Attempt Unauthorized Status Updates', async ({ page, context, baseURL }) => {
    const caseRow = await seedCase('NeedsReview')
    const doc1 = await seedDocument(caseRow.id, 'PSABirth', 'birth.pdf', `cases/${caseRow.id}/birth.pdf`)
    const finding = await seedFinding(caseRow.id, 'Name Spelling Mismatch', 'Spelling mismatch', 'High', 'Name Mismatch', 'Open')
    await linkFindingDoc(finding.id, doc1.id)

    // Log in as GUEST (unauthorized)
    await loginAs(context, GUEST_EMAIL, GUEST_PASSWORD, baseURL)
    await page.goto(`/cases/${caseRow.id}`)

    // The status select should be disabled
    const select = page.locator('[data-testid="finding-status-select"]')
    await expect(select).toBeDisabled()
  })

  /*
   * ==========================================
   * TIER 3: Cross-Feature Combinations
   * ==========================================
   */

  test('Test 3.1: Document Upload -> Run Analysis -> Resolve Findings Lifecycle', async ({ page, context, baseURL }) => {
    // Setup: Fresh draft case
    const caseRow = await seedCase('Draft')

    await loginAs(context, ADMIN_EMAIL, ADMIN_PASSWORD, baseURL)
    await page.goto(`/cases/${caseRow.id}`)

    // Upload Document 1
    await page.locator('select').first().selectOption('PSABirth')
    await page.locator('input[type="file"]').setInputFiles(dummyFilePath1)
    await page.getByRole('button', { name: 'Upload File' }).click()
    await expect(page.getByText('test-doc1.pdf')).toBeVisible()

    // Upload Document 2
    await page.locator('select').first().selectOption('TOR')
    await page.locator('input[type="file"]').setInputFiles(dummyFilePath2)
    await page.getByRole('button', { name: 'Upload File' }).click()
    await expect(page.getByText('test-doc2.pdf')).toBeVisible()

    // Trigger Run Analysis
    await page.locator('[data-testid="run-analysis-btn"]').click()

    // Verify findings appear
    const workspace = page.locator('[data-testid="findings-workspace"]')
    await expect(workspace).toBeVisible()

    const card = page.locator('[data-testid="finding-card"]').first()
    await expect(card).toBeVisible()

    // Click it and resolve finding
    await card.click()
    const select = page.locator('[data-testid="finding-status-select"]')
    await select.selectOption('Resolved')

    const statusBadge = page.locator('[data-testid="finding-card-status-badge"]')
    await expect(statusBadge).toHaveText('Resolved')
  })

  test('Test 3.2: Linked Document Deletion Impact', async ({ page, context, baseURL }) => {
    const caseRow = await seedCase('NeedsReview')
    const doc1 = await seedDocument(caseRow.id, 'PSABirth', 'birth.pdf', `cases/${caseRow.id}/birth.pdf`)
    const doc2 = await seedDocument(caseRow.id, 'TOR', 'tor.pdf', `cases/${caseRow.id}/tor.pdf`)
    const finding = await seedFinding(caseRow.id, 'Name Mismatch', 'Spelling mismatch', 'High', 'Name Mismatch', 'Open')
    await linkFindingDoc(finding.id, doc1.id)
    await linkFindingDoc(finding.id, doc2.id)

    // Deleting the document programmatically using the DB admin client to simulate deletion
    await adminSupabase.from('documents').delete().eq('id', doc2.id)

    await loginAs(context, ADMIN_EMAIL, ADMIN_PASSWORD, baseURL)
    await page.goto(`/cases/${caseRow.id}`)

    // Select the finding
    await page.locator('[data-testid="finding-card"]').click()

    // Document comparison panel should show left document but fallback / placeholder for the deleted doc
    const comparisonPanel = page.locator('[data-testid="document-comparison-panel"]')
    await expect(comparisonPanel).toBeVisible()
    await expect(page.getByText('Preview unavailable')).toBeVisible()
  })

  /*
   * ==========================================
   * TIER 4: Real-World Scenarios
   * ==========================================
   */

  test('Test 4.1: Reviewer Workflow - Triage Case with Name Mismatch', async ({ page, context, baseURL }) => {
    // 1. Admin creates/gets case, uploads PSA Birth Certificate and TOR
    const caseRow = await seedCase('Uploaded')
    const doc1 = await seedDocument(caseRow.id, 'PSABirth', 'JaneDoe-birth.pdf', `cases/${caseRow.id}/JaneDoe-birth.pdf`)
    const doc2 = await seedDocument(caseRow.id, 'TOR', 'JayneDoe-tor.pdf', `cases/${caseRow.id}/JayneDoe-tor.pdf`)

    await loginAs(context, ADMIN_EMAIL, ADMIN_PASSWORD, baseURL)
    await page.goto(`/cases/${caseRow.id}`)

    // 2. Click "Run Analysis"
    await page.locator('[data-testid="run-analysis-btn"]').click()

    // 3. Select the generated finding card
    const card = page.locator('[data-testid="finding-card"]').first()
    await expect(card).toBeVisible()
    await card.click()

    // 4. Update status to Accepted
    const select = page.locator('[data-testid="finding-status-select"]')
    await select.selectOption('Accepted')

    // 5. Verify the badge updates
    const statusBadge = page.locator('[data-testid="finding-card-status-badge"]')
    await expect(statusBadge).toHaveText('Accepted')
  })
})
