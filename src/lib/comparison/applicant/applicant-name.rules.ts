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
  {
    code: 'APP-NAME-04',
    category: 'Name Mismatch',
    ruleName: 'Mother Name Consistency',
    scope: 'applicant_internal',
    targetA: { owner: 'applicant', fieldName: 'mother_name' },
    targetB: { owner: 'applicant', fieldName: 'mother_name' },
    method: 'normalized',
    severity: 'Medium',
    explanation: (valA, valB) => {
      const normA = normalizeName(valA)?.normalized || valA
      const normB = normalizeName(valB)?.normalized || valB
      return `Mother's name mismatch. Found "${normA}" and "${normB}".`
    }
  },
  {
    code: 'APP-NAME-05',
    category: 'Name Mismatch',
    ruleName: 'Father Name Consistency',
    scope: 'applicant_internal',
    targetA: { owner: 'applicant', fieldName: 'father_name' },
    targetB: { owner: 'applicant', fieldName: 'father_name' },
    method: 'normalized',
    severity: 'Medium',
    explanation: (valA, valB) => {
      const normA = normalizeName(valA)?.normalized || valA
      const normB = normalizeName(valB)?.normalized || valB
      return `Father's name mismatch. Found "${normA}" and "${normB}".`
    }
  }
]
