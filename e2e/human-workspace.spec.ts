import { test, expect } from '@playwright/test';
import { runCaseVerification } from '../src/lib/comparison/engine';
import { DocumentField, DocumentMetadata } from '../src/lib/comparison/types';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Setup Supabase admin client for RPC checks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

test.describe('Human Verification Workspace & RPC Security', () => {
  const caseId = '00000000-0000-0000-0000-000000000000';
  const docId = randomUUID();
  const fieldId = randomUUID();

  test.describe('RPC Security & State Transitions', () => {
    test.skip(!supabaseUrl, 'Skipping RPC DB tests because SUPABASE_URL is missing in this test env');
    
    let supabase: any;
    
    test.beforeAll(() => {
      supabase = createClient(supabaseUrl, supabaseKey);
    });
    
    test('Cannot mutate state without authentication (Unauthorized)', async () => {
       const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
       const { error } = await anonClient.rpc('verify_document_field', {
         p_field_id: fieldId,
         p_action: 'accept'
       });
       expect(error).not.toBeNull();
       expect(error?.message).toContain('Not authenticated');
    });

    test('Cannot directly UPDATE document_fields state', async () => {
       const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
       const { error } = await anonClient.from('document_fields').update({ state: 'verified' }).eq('id', fieldId);
       expect(error).not.toBeNull();
       // RLS or missing UPDATE policy should reject it
    });
  });
  
  test.describe('Layer 3 Verification Engine Integration', () => {
    const mockDocuments: DocumentMetadata[] = [
      { id: docId, type: 'Birth Certificate', owner_type: 'applicant', sponsor_id: null }
    ];

    test('Candidate field does not reach comparison engine', async () => {
      const fields: DocumentField[] = [{
        id: randomUUID(),
        case_id: caseId,
        document_id: docId,
        field_name: 'first_name',
        raw_value: 'Juan',
        normalized_value: 'Juan',
        reviewed_value: null,
        final_value: null,
        confidence_score: 0.9,
        state: 'candidate',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];

      const result = await runCaseVerification(caseId, fields, mockDocuments, []);
      const nameResults = result.applicant.results.filter(r => r.field_name === 'first_name');
      expect(nameResults.length).toBe(0);
    });

    test('Verified field reaches comparison engine', async () => {
      const fields: DocumentField[] = [{
        id: randomUUID(),
        case_id: caseId,
        document_id: docId,
        field_name: 'first_name',
        raw_value: 'Juan',
        normalized_value: 'Juan',
        reviewed_value: null,
        final_value: 'Juan',
        confidence_score: 0.9,
        state: 'verified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];

      const result = await runCaseVerification(caseId, fields, mockDocuments, []);
      // It reached the engine, but because there's only 1 doc, it's marked as verified (no discrepancy)
      expect(result.applicant.status).toBe('verified');
      expect(result.applicant.discrepancies.length).toBe(0);
    });
  });
});
