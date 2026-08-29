import { test, expect } from '@playwright/test';
import { runCaseVerification } from '../src/lib/comparison/engine';
import { DocumentField, DocumentMetadata, Sponsor } from '../src/lib/comparison/types';
import { randomUUID } from 'crypto';

test.describe('Comparison Engine Zero-Trust Boundary', () => {
  const caseId = '00000000-0000-0000-0000-000000000000';
  const doc1Id = randomUUID();
  const doc2Id = randomUUID();

  const mockDocuments: DocumentMetadata[] = [
    { id: doc1Id, type: 'Birth Certificate', owner_type: 'applicant', sponsor_id: null },
    { id: doc2Id, type: 'Passport', owner_type: 'applicant', sponsor_id: null }
  ];

  const createField = (docId: string, fieldName: string, value: string | null, state: string | null): DocumentField => ({
    id: randomUUID(),
    case_id: caseId,
    document_id: docId,
    field_name: fieldName,
    raw_value: value,
    normalized_value: value,
    reviewed_value: value,
    final_value: value,
    confidence_score: 0.99,
    state,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  test('TEST 1 — Verified fields participate', async () => {
    const fields = [
      createField(doc1Id, 'first_name', 'Juan', 'verified'),
      createField(doc2Id, 'first_name', 'Juan', 'verified')
    ];

    const result = await runCaseVerification(caseId, fields, mockDocuments, []);
    
    // Should have 1 exact match result for APP-NAME-01 (or 2 if cartesian product does both directions)
    const nameResults = result.applicant.results.filter(r => r.field_name === 'first_name');
    expect(nameResults.length).toBeGreaterThan(0);
  });

  test('TEST 2 — Candidate field is ignored', async () => {
    const fields = [
      createField(doc1Id, 'first_name', 'Juan', 'verified'),
      createField(doc2Id, 'first_name', 'Juan', 'candidate')
    ];

    const result = await runCaseVerification(caseId, fields, mockDocuments, []);
    
    // The candidate field is ignored, leaving only 1 verified field.
    // 1 field cannot be compared with another document, so no results should be generated.
    const nameResults = result.applicant.results.filter(r => r.field_name === 'first_name');
    expect(nameResults.length).toBe(0);
  });

  test('TEST 3 — Unreadable field is ignored', async () => {
    const fields = [
      createField(doc1Id, 'first_name', 'Juan', 'verified'),
      createField(doc2Id, 'first_name', 'Juan', 'unreadable')
    ];

    const result = await runCaseVerification(caseId, fields, mockDocuments, []);
    expect(result.applicant.results.length).toBe(0);
  });

  test('TEST 4 — Ambiguous field is ignored', async () => {
    const fields = [
      createField(doc1Id, 'first_name', 'Juan', 'verified'),
      createField(doc2Id, 'first_name', 'Juan', 'ambiguous')
    ];

    const result = await runCaseVerification(caseId, fields, mockDocuments, []);
    expect(result.applicant.results.length).toBe(0);
  });

  test('TEST 5 — Not-present field is ignored', async () => {
    const fields = [
      createField(doc1Id, 'first_name', 'Juan', 'verified'),
      createField(doc2Id, 'first_name', null, 'not_present')
    ];

    const result = await runCaseVerification(caseId, fields, mockDocuments, []);
    expect(result.applicant.results.length).toBe(0);
  });

  test('TEST 6 — Missing/undefined/null/legacy state is ignored', async () => {
    const fields = [
      createField(doc1Id, 'first_name', 'Juan', 'verified'),
      createField(doc2Id, 'first_name', 'Juan', null), // legacy
      createField(randomUUID(), 'first_name', 'Juan', undefined as any) // missing
    ];

    const result = await runCaseVerification(caseId, fields, mockDocuments, []);
    expect(result.applicant.results.length).toBe(0);
  });

  test('TEST 7 — Mixed fields filtering', async () => {
    const doc3Id = randomUUID();
    const doc4Id = randomUUID();
    
    const sponsorDocMap: DocumentMetadata[] = [
      ...mockDocuments,
      { id: doc3Id, type: 'Tax Return', owner_type: 'sponsor', sponsor_id: 'sponsor-1' },
      { id: doc4Id, type: 'Bank Statement', owner_type: 'sponsor', sponsor_id: 'sponsor-1' }
    ];

    const sponsors: Sponsor[] = [
      { id: 'sponsor-1', first_name: 'Maria', last_name: 'Clara', relationship: 'mother' }
    ];

    const fields = [
      createField(doc1Id, 'first_name', 'Juan', 'verified'), // Applicant verified
      createField(doc2Id, 'first_name', 'Juan', 'candidate'), // Applicant candidate
      createField(doc3Id, 'first_name', 'Maria', 'unreadable'), // Sponsor unreadable
      createField(doc4Id, 'first_name', 'Maria', 'ambiguous'), // Sponsor ambiguous
      createField(doc4Id, 'employer_name', 'Acme', 'verified'), // Sponsor verified (but only 1)
      createField(doc3Id, 'employer_name', 'Acme', 'verified') // Sponsor verified (match!)
    ];

    const result = await runCaseVerification(caseId, fields, sponsorDocMap, sponsors);
    
    // Applicant has 1 verified name -> no match possible
    const applicantNameResults = result.applicant.results.filter(r => r.field_name === 'first_name');
    expect(applicantNameResults.length).toBe(0);

    // Sponsor has 1 unreadable name, 1 ambiguous name -> no match possible
    const sponsorNameResults = result.sponsor.results.filter(r => r.field_name === 'first_name');
    expect(sponsorNameResults.length).toBe(0);

    // Sponsor has 2 verified employers -> match possible!
    const sponsorEmployerResults = result.sponsor.results.filter(r => r.field_name === 'employer_name');
    expect(sponsorEmployerResults.length).toBeGreaterThan(0);
  });

  test('TEST 8 — No verified fields', async () => {
    const fields = [
      createField(doc1Id, 'first_name', 'Juan', 'candidate'),
      createField(doc2Id, 'first_name', 'Juan', 'unreadable')
    ];

    const result = await runCaseVerification(caseId, fields, mockDocuments, []);
    expect(result.applicant.results.length).toBe(0);
    expect(result.applicant.discrepancies.length).toBe(0);
    expect(result.applicant.status).toBe('verified'); // "verified" meaning no mismatches were found.
  });
});
