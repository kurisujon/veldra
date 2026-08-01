import { VerificationRule } from '../types'
import { normalizeDate } from '../normalization/normalize-date'

export const applicantBirthRules: VerificationRule[] = [
  {
    code: 'APP-BIRTH-01',
    category: 'Date Mismatch',
    ruleName: 'Applicant Date of Birth Consistency',
    scope: 'applicant_internal',
    targetA: { owner: 'applicant', fieldName: 'date_of_birth' },
    targetB: { owner: 'applicant', fieldName: 'date_of_birth' },
    method: 'normalized',
    severity: 'High',
    explanation: (valA, valB) => {
      const normA = normalizeDate(valA) || valA
      const normB = normalizeDate(valB) || valB
      return `Date of birth mismatch: "${normA}" vs "${normB}".`
    }
  },
  {
    code: 'APP-BIRTH-02',
    category: 'Identity',
    ruleName: 'Applicant Place of Birth Consistency',
    scope: 'applicant_internal',
    targetA: { owner: 'applicant', fieldName: 'place_of_birth' },
    targetB: { owner: 'applicant', fieldName: 'place_of_birth' },
    method: 'normalized',
    severity: 'Medium',
    explanation: (valA, valB) => {
      return `Place of birth mismatch: "${valA}" vs "${valB}".`
    }
  }
]
