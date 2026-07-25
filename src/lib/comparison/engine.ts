import { DocumentField, DocumentMetadata, Sponsor, Discrepancy, VerificationRule } from './types'
import { generateFindingDescription } from './formatters'

const normalizeName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const normalizeDate = (s: string) => s.replace(/[-/]/g, ''); // simplified date normalization

export const defaultRules: VerificationRule[] = [
  {
    category: 'Identity',
    ruleName: 'Applicant to Sponsor Last Name Match (Parent)',
    condition: (_, __, sponsor) => sponsor?.relationship?.toLowerCase() === 'parent',
    targetA: { owner: 'applicant', fieldName: 'lastName' },
    targetB: { owner: 'sponsor', fieldName: 'lastName' },
    method: 'exactMatch',
    severity: 'Warning'
  },
  {
    category: 'Name Mismatch',
    ruleName: 'Applicant Internal First Name Match',
    targetA: { owner: 'applicant', fieldName: 'firstName' },
    targetB: { owner: 'applicant', fieldName: 'firstName' },
    method: 'exactMatch',
    severity: 'High'
  },
  {
    category: 'Name Mismatch',
    ruleName: 'Applicant Internal Last Name Match',
    targetA: { owner: 'applicant', fieldName: 'lastName' },
    targetB: { owner: 'applicant', fieldName: 'lastName' },
    method: 'exactMatch',
    severity: 'High'
  }
];

export function runVerificationEngine(
  fields: DocumentField[],
  documents: DocumentMetadata[],
  sponsors: Sponsor[],
  rules: VerificationRule[] = defaultRules
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];

  const getOwnerType = (docId: string) => documents.find(d => d.id === docId)?.owner_type || 'applicant';
  const getSponsorId = (docId: string) => documents.find(d => d.id === docId)?.sponsor_id || null;

  for (const rule of rules) {
    const fieldsA = fields.filter(f => getOwnerType(f.document_id) === rule.targetA.owner && f.field_name.toLowerCase().includes(rule.targetA.fieldName.toLowerCase()));
    const fieldsB = fields.filter(f => getOwnerType(f.document_id) === rule.targetB.owner && f.field_name.toLowerCase().includes(rule.targetB.fieldName.toLowerCase()));

    if (fieldsA.length === 0 || fieldsB.length === 0) continue;

    // Handle same-owner comparisons (e.g., applicant to applicant)
    if (rule.targetA.owner === rule.targetB.owner) {
      for (let i = 0; i < fieldsA.length; i++) {
        for (let j = i + 1; j < fieldsB.length; j++) {
          const valA = fieldsA[i].final_value || fieldsA[i].reviewed_value || fieldsA[i].normalized_value || fieldsA[i].raw_value;
          const valB = fieldsB[j].final_value || fieldsB[j].reviewed_value || fieldsB[j].normalized_value || fieldsB[j].raw_value;
          
          if (!valA || !valB) continue;

          let isMatch = true;
          if (rule.method === 'exactMatch') isMatch = normalizeName(valA) === normalizeName(valB);
          else if (rule.method === 'dateMatch') isMatch = normalizeDate(valA) === normalizeDate(valB);

          if (!isMatch) {
            discrepancies.push({
              title: rule.ruleName,
              description: generateFindingDescription(rule.targetA.fieldName, valA, valB, rule.category as any),
              category: rule.category as any,
              severity: rule.severity,
              fieldA: fieldsA[i],
              fieldB: fieldsB[j]
            });
          }
        }
      }
    } else {
      // Handle cross-owner comparisons (e.g., applicant to sponsor)
      for (const sponsor of sponsors) {
        if (rule.condition && !rule.condition(fieldsA, fieldsB, sponsor)) continue;

        const sponsorFieldsB = fieldsB.filter(f => getSponsorId(f.document_id) === sponsor.id);
        
        for (const fA of fieldsA) {
          for (const fB of sponsorFieldsB) {
            const valA = fA.final_value || fA.reviewed_value || fA.normalized_value || fA.raw_value;
            const valB = fB.final_value || fB.reviewed_value || fB.normalized_value || fB.raw_value;

            if (!valA || !valB) continue;

            let isMatch = true;
            if (rule.method === 'exactMatch') isMatch = normalizeName(valA) === normalizeName(valB);
            
            if (!isMatch) {
              discrepancies.push({
                title: rule.ruleName,
                description: generateFindingDescription(rule.targetA.fieldName, valA, valB, rule.category as any),
                category: rule.category as any,
                severity: rule.severity,
                fieldA: fA,
                fieldB: fB
              });
            }
          }
        }
      }
    }
  }

  return discrepancies;
}
