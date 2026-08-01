import { VerificationRule } from '../types';

export const sponsorAffidavitRules: VerificationRule[] = [
  {
    code: 'SPON-AFF-001',
    category: 'Name Mismatch',
    ruleName: 'Affidavit Sponsor Name vs Sponsor ID',
    scope: 'sponsor_internal',
    targetA: { owner: 'sponsor', fieldName: 'name', docType: 'affidavit' },
    targetB: { owner: 'sponsor', fieldName: 'name', docType: 'id' },
    method: 'normalized',
    severity: 'High',
    explanation: (valA, valB) => `Sponsor name on Affidavit does not match Sponsor ID: "${valA}" vs "${valB}".`
  },
  {
    code: 'SPON-AFF-002',
    category: 'Name Mismatch',
    ruleName: 'Applicant Name in Affidavit vs Applicant Docs',
    scope: 'applicant_sponsor',
    targetA: { owner: 'sponsor', fieldName: 'applicant_name', docType: 'affidavit' },
    targetB: { owner: 'applicant', fieldName: 'name' },
    method: 'normalized',
    severity: 'High',
    explanation: (valA, valB) => `Applicant name on Sponsor Affidavit does not match Applicant documents: "${valA}" vs "${valB}".`
  }
];
