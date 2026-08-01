import { VerificationRule } from '../types';

export const sponsorIncomeRules: VerificationRule[] = [
  {
    code: 'SPON-INC-001',
    category: 'Income Discrepancy',
    ruleName: 'COE Income vs ITR Income',
    scope: 'sponsor_internal',
    targetA: { owner: 'sponsor', fieldName: 'income', docType: 'coe' },
    targetB: { owner: 'sponsor', fieldName: 'income', docType: 'itr' },
    method: 'calculated',
    severity: 'Warning',
    explanation: (valA, valB) => `Income mismatch between COE and ITR: "${valA}" vs "${valB}".`
  }
];
