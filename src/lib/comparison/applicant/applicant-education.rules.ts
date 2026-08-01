import { VerificationRule } from '../types'
import { normalizeInstitution } from '../normalization/normalize-institution'
import { normalizeDate } from '../normalization/normalize-date'

export const applicantEducationRules: VerificationRule[] = [
  {
    code: 'APP-EDU-01',
    category: 'Identity',
    ruleName: 'School Name Consistency',
    scope: 'applicant_internal',
    targetA: { owner: 'applicant', fieldName: 'school_name', docType: 'TOR' },
    targetB: { owner: 'applicant', fieldName: 'school_name', docType: 'Diploma' },
    method: 'fuzzy',
    severity: 'Medium',
    explanation: (valA, valB) => {
      const normA = normalizeInstitution(valA) || valA
      const normB = normalizeInstitution(valB) || valB
      return `School name mismatch between TOR and Diploma: "${normA}" vs "${normB}".`
    }
  },
  {
    code: 'APP-EDU-02',
    category: 'Identity',
    ruleName: 'Degree/Course Consistency',
    scope: 'applicant_internal',
    targetA: { owner: 'applicant', fieldName: 'degree' },
    targetB: { owner: 'applicant', fieldName: 'degree' },
    method: 'normalized',
    severity: 'Medium',
    explanation: (valA, valB) => {
      return `Degree/course mismatch: "${valA}" vs "${valB}".`
    }
  },
  {
    code: 'APP-EDU-03',
    category: 'Date Mismatch',
    ruleName: 'Graduation Date Consistency',
    scope: 'applicant_internal',
    targetA: { owner: 'applicant', fieldName: 'graduation_date' },
    targetB: { owner: 'applicant', fieldName: 'graduation_date' },
    method: 'normalized',
    severity: 'Warning',
    explanation: (valA, valB) => {
      const normA = normalizeDate(valA) || valA
      const normB = normalizeDate(valB) || valB
      return `Graduation date mismatch: "${normA}" vs "${normB}".`
    }
  }
]
