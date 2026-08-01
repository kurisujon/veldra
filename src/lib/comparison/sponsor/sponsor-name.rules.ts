import { VerificationRule } from '../types';

export const sponsorNameRules: VerificationRule[] = [
  {
    code: 'SPON-NAME-001',
    category: 'Name Mismatch',
    ruleName: 'Sponsor Name Consistency',
    scope: 'sponsor_internal',
    targetA: { owner: 'sponsor', fieldName: 'name' },
    targetB: { owner: 'sponsor', fieldName: 'name' },
    method: 'normalized',
    severity: 'High',
    explanation: (valA, valB) => `Sponsor name mismatch across documents: "${valA}" vs "${valB}".`
  },
  {
    code: 'SPON-ADDR-001',
    category: 'Address Mismatch',
    ruleName: 'Sponsor Address Consistency',
    scope: 'sponsor_internal',
    targetA: { owner: 'sponsor', fieldName: 'address' },
    targetB: { owner: 'sponsor', fieldName: 'address' },
    method: 'normalized',
    severity: 'Warning',
    explanation: (valA, valB) => `Sponsor address mismatch: "${valA}" vs "${valB}".`
  },
  {
    code: 'SPON-ID-001',
    category: 'Document Validity',
    ruleName: 'Sponsor ID Expiry Validity',
    scope: 'sponsor_internal',
    targetA: { owner: 'sponsor', fieldName: 'expiry_date', docType: 'id' },
    targetB: { owner: 'sponsor', fieldName: 'expiry_date', docType: 'id' },
    method: 'calculated',
    severity: 'High',
    explanation: (valA) => `Sponsor ID is expired or invalid: "${valA}".`
  }
];
