import { VerificationRule } from '../types';

export const sponsorAffidavitRules: VerificationRule[] = [
  ...(['first', 'last'] as const).flatMap((part) => [
    {
      code: `SPON-AFF-SPONSOR-${part.toUpperCase()}-001`,
      category: 'Name Mismatch' as const,
      ruleName: `Affidavit Sponsor ${part[0].toUpperCase()}${part.slice(1)} Name vs Sponsor ID`,
      scope: 'sponsor_internal' as const,
      targetA: { owner: 'sponsor' as const, fieldName: `sponsor_${part}_name`, docType: 'affidavit' },
      targetB: { owner: 'sponsor' as const, fieldName: `sponsor_${part}_name`, docType: 'id' },
      method: 'normalized' as const,
      severity: 'High' as const,
      explanation: (valA: string, valB: string) => `Sponsor ${part} name on Affidavit does not match Sponsor ID: "${valA}" vs "${valB}".`,
    },
    {
      code: `SPON-AFF-APPLICANT-${part.toUpperCase()}-001`,
      category: 'Name Mismatch' as const,
      ruleName: `Applicant ${part[0].toUpperCase()}${part.slice(1)} Name in Affidavit vs Applicant Documents`,
      scope: 'applicant_sponsor' as const,
      targetA: { owner: 'sponsor' as const, fieldName: `applicant_${part}_name`, docType: 'affidavit' },
      targetB: { owner: 'applicant' as const, fieldName: `${part}_name` },
      method: 'normalized' as const,
      severity: 'High' as const,
      explanation: (valA: string, valB: string) => `Applicant ${part} name on Sponsor Affidavit does not match applicant documents: "${valA}" vs "${valB}".`,
    },
  ])
];
