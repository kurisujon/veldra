import { VerificationRule } from '../types';

export const sponsorEmploymentRules: VerificationRule[] = [
  {
    code: 'SPON-EMP-001',
    category: 'Employment Mismatch',
    ruleName: 'COE Employer vs ITR Employer',
    scope: 'sponsor_internal',
    targetA: { owner: 'sponsor', fieldName: 'employer', docType: 'coe' },
    targetB: { owner: 'sponsor', fieldName: 'employer', docType: 'itr' },
    method: 'fuzzy',
    severity: 'High',
    explanation: (valA, valB) => `Employer name mismatch between COE and ITR: "${valA}" vs "${valB}".`
  }
];
