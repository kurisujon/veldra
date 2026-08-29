import { runCaseVerification } from './src/lib/comparison/engine';
import { DocumentField, DocumentMetadata, Sponsor } from './src/lib/comparison/types';

const caseId = '00000000-0000-0000-0000-000000000000';
const doc1Id = 'doc1';
const doc2Id = 'doc2';

const mockDocuments: DocumentMetadata[] = [
  { id: doc1Id, type: 'Birth Certificate', owner_type: 'applicant', sponsor_id: null },
  { id: doc2Id, type: 'Passport', owner_type: 'applicant', sponsor_id: null }
];

const createField = (docId: string, fieldName: string, value: string | null, state: string | null): DocumentField => ({
  id: Math.random().toString(),
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

async function run() {
  const fields = [
    createField(doc1Id, 'first_name', 'Juan', 'verified'),
    createField(doc2Id, 'first_name', 'Juan', 'candidate') // Candidate field
  ];

  const result = await runCaseVerification(caseId, fields, mockDocuments, []);
  
  const nameResults = result.applicant.results.filter(r => r.field_name === 'first_name');
  if (nameResults.length === 0) {
    console.log("SUCCESS: candidate field was ignored and no comparison was performed.");
  } else {
    console.error("FAIL: Candidate field was included!", nameResults);
    process.exit(1);
  }
}
run().catch(console.error);
