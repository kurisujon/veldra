import { VerificationRule } from '../types';

export const sponsorNameRules: VerificationRule[] = [
  ...(['first', 'last'] as const).map((part) => ({
    code: `SPON-NAME-${part.toUpperCase()}-001`,
    category: 'Name Mismatch' as const,
    ruleName: `Sponsor ${part[0].toUpperCase()}${part.slice(1)} Name Consistency`,
    scope: 'sponsor_internal' as const,
    targetA: { owner: 'sponsor' as const, fieldName: `sponsor_${part}_name` },
    targetB: { owner: 'sponsor' as const, fieldName: `sponsor_${part}_name` },
    method: 'normalized' as const,
    severity: 'High' as const,
    explanation: (valA: string, valB: string) => `Sponsor ${part} name mismatch across documents: "${valA}" vs "${valB}".`,
  })),
  {
    code: 'SPON-ADDR-001',
    category: 'Address Mismatch',
    ruleName: 'Sponsor Address Consistency',
    scope: 'sponsor_internal',
    targetA: { owner: 'sponsor', fieldName: 'sponsor_address' },
    targetB: { owner: 'sponsor', fieldName: 'sponsor_address' },
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
