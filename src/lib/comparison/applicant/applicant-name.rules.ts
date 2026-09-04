import { VerificationRule } from '../types'
import { normalizeName } from '../normalization/normalize-name'

export const applicantNameRules: VerificationRule[] = [
  {
    code: 'APP-NAME-01',
    category: 'Name Mismatch',
    ruleName: 'Applicant First Name Consistency',
    scope: 'applicant_internal',
    targetA: { owner: 'applicant', fieldName: 'first_name' },
    targetB: { owner: 'applicant', fieldName: 'first_name' },
    method: 'normalized',
    severity: 'High',
    explanation: (valA, valB) => {
      const normA = normalizeName(valA)?.normalized || valA
      const normB = normalizeName(valB)?.normalized || valB
      return `First name mismatch between documents. Found "${normA}" vs "${normB}".`
    }
  },
  {
    code: 'APP-NAME-02',
    category: 'Name Mismatch',
    ruleName: 'Applicant Middle Name Consistency',
    scope: 'applicant_internal',
    targetA: { owner: 'applicant', fieldName: 'middle_name' },
    targetB: { owner: 'applicant', fieldName: 'middle_name' },
    method: 'normalized',
    severity: 'High',
    explanation: (valA, valB) => {
      const normA = normalizeName(valA)?.middleName || valA
      const normB = normalizeName(valB)?.middleName || valB
      return `Middle name mismatch. Found "${normA}" and "${normB}".`
    }
  },
  {
    code: 'APP-NAME-03',
    category: 'Name Mismatch',
    ruleName: 'Applicant Last Name Consistency',
    scope: 'applicant_internal',
    targetA: { owner: 'applicant', fieldName: 'last_name' },
    targetB: { owner: 'applicant', fieldName: 'last_name' },
    method: 'normalized',
    severity: 'High',
    explanation: (valA, valB) => {
      const normA = normalizeName(valA)?.lastName || valA
      const normB = normalizeName(valB)?.lastName || valB
      return `Last name mismatch. Found "${normA}" and "${normB}".`
    }
  },
  ...(['first', 'middle', 'last'] as const).flatMap((part) => [
    {
      code: `APP-MOTHER-${part.toUpperCase()}-01`,
      category: 'Name Mismatch' as const,
      ruleName: `Mother Maiden ${part[0].toUpperCase()}${part.slice(1)} Name Consistency`,
      scope: 'applicant_internal' as const,
      targetA: { owner: 'applicant' as const, fieldName: `mother_maiden_${part}_name` },
      targetB: { owner: 'applicant' as const, fieldName: `mother_maiden_${part}_name` },
      method: 'normalized' as const,
      severity: 'Medium' as const,
      explanation: (valA: string, valB: string) => `Mother maiden ${part} name mismatch. Found "${valA}" and "${valB}".`,
    },
    {
      code: `APP-FATHER-${part.toUpperCase()}-01`,
      category: 'Name Mismatch' as const,
      ruleName: `Father ${part[0].toUpperCase()}${part.slice(1)} Name Consistency`,
      scope: 'applicant_internal' as const,
      targetA: { owner: 'applicant' as const, fieldName: `father_${part}_name` },
      targetB: { owner: 'applicant' as const, fieldName: `father_${part}_name` },
      method: 'normalized' as const,
      severity: 'Medium' as const,
      explanation: (valA: string, valB: string) => `Father ${part} name mismatch. Found "${valA}" and "${valB}".`,
    },
  ])
]
