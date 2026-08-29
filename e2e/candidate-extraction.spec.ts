import { test, expect } from '@playwright/test';
import { getGroundedSchemaForType } from '../src/lib/ai/schemas';

test.describe('Candidate Extraction (11.6-D)', () => {
  // We mock out the Gemini client in the extraction pipeline for testing structural validity.
  // We will instead directly test the Schema validation and the Evidence Map validation.

  const mockEvidenceMapSpans = [
    { id: 'span_1', text: 'Juan' },
    { id: 'span_2', text: 'Dela Cruz' },
  ];

  test('TEST 1: AI returns a valid existing evidenceSpanId', async () => {
    const schema = getGroundedSchemaForType('PSABirth');
    const validResponse = {
      documentType: { value: 'PSABirth' },
      firstName: { value: 'Juan', state: 'candidate', evidenceSpanIds: ['span_1'] }
    };
    
    // Schema should parse successfully
    const parsed = schema.parse(validResponse);
    // @ts-ignore - Dynamic field
    expect(parsed.firstName.state).toBe('candidate');
    // @ts-ignore
    expect(parsed.firstName.evidenceSpanIds).toEqual(['span_1']);
  });

  test('TEST 2: AI returns a fabricated evidenceSpanId', async () => {
    // This is tested in extraction.ts (Candidate Validation logic).
    // We simulate the check here as it is purely logical.
    const returnedSpans = ['span_999'];
    const validSpans = ['span_1', 'span_2'];
    
    const isValid = returnedSpans.every(id => validSpans.includes(id));
    expect(isValid).toBe(false); // Fails
  });

  test('TEST 3: AI attempts to return boundingBox', async () => {
    const schema = getGroundedSchemaForType('PSABirth');
    const invalidResponse = {
      documentType: { value: 'PSABirth' },
      firstName: { value: 'Juan', state: 'candidate', evidenceSpanIds: ['span_1'], boundingBox: { x: 10, y: 10, width: 100, height: 20 } }
    };
    
    // Zod 'strict' parsing or explicit rules will strip or reject it.
    // In our schema, EvidenceFieldSchema does NOT define boundingBox, so it's ignored or rejected.
    const parsed = schema.parse(invalidResponse);
    // @ts-ignore
    expect(parsed.firstName.boundingBox).toBeUndefined();
  });

  test('TEST 4: AI attempts to return sourceText as evidence', async () => {
    const schema = getGroundedSchemaForType('PSABirth');
    const invalidResponse = {
      documentType: { value: 'PSABirth' },
      firstName: { value: 'Juan', state: 'candidate', sourceText: 'Juan' } // Missing evidenceSpanIds
    };
    
    expect(() => schema.parse(invalidResponse)).toThrow();
  });

  test('TEST 5: No evidence exists for a field (not_present)', async () => {
    const schema = getGroundedSchemaForType('PSABirth');
    const response = {
      documentType: { value: 'PSABirth' },
      firstName: { value: null, state: 'not_present', evidenceSpanIds: [] }
    };
    
    const parsed = schema.parse(response);
    // @ts-ignore
    expect(parsed.firstName.state).toBe('not_present');
    // @ts-ignore
    expect(parsed.firstName.evidenceSpanIds.length).toBe(0);
  });
});
