import { test, expect } from '@playwright/test'
import { validateEvidence } from '../src/lib/ai/evidence-validator'
import type { EvidenceStatus, ExtractedField } from '../src/lib/ai/types'
import { EvidenceMap, type EvidenceSpan } from '../src/lib/extraction/evidence/EvidenceMap'

const EXTRACTION_ID = 'ext_123'

function createField(
  value: string | null,
  evidenceSpanIds: string[],
  state: 'candidate' | 'not_present' | 'unreadable' | 'ambiguous' = 'candidate'
): ExtractedField {
  const status: EvidenceStatus = state === 'not_present' ? 'missing' : 'uncertain'

  return {
    value,
    state,
    evidenceSpanIds,
    status,
    sourceText: null,
    page: null,
    confidence: null,
    boundingBox: null,
  }
}

function createSpan(id: string, text: string, extractionId = EXTRACTION_ID): EvidenceSpan {
  return {
    id,
    extractionId,
    pageId: 'page_1',
    text,
    normalizedText: text.toLowerCase(),
    boundingBox: { x: 10, y: 10, width: 100, height: 20 },
    ocrConfidence: 0.95,
    blockType: 'line',
  }
}

test.describe('Evidence Validator', () => {
  test('keeps a candidate whose exact text is present in its evidence', () => {
    const evidenceMap = new EvidenceMap(EXTRACTION_ID)
    evidenceMap.registerSpan(createSpan('span_1', 'Juan Dela Cruz'))

    const result = validateEvidence(
      { firstName: createField('Juan Dela Cruz', ['span_1']) },
      evidenceMap,
      EXTRACTION_ID
    )

    expect(result.fields.firstName.state).toBe('candidate')
  })

  test('keeps an ISO date supported by a PSA labeled date', () => {
    const evidenceMap = new EvidenceMap(EXTRACTION_ID)
    evidenceMap.registerSpan(createSpan('span_1', '(day) 30 (month) November (year) 1993'))

    const result = validateEvidence(
      { dateOfBirth: createField('1993-11-30', ['span_1']) },
      evidenceMap,
      EXTRACTION_ID
    )

    expect(result.fields.dateOfBirth.state).toBe('candidate')
  })

  test('keeps an ISO date supported by a numbered PSA birth-date field', () => {
    const evidenceMap = new EvidenceMap(EXTRACTION_ID)
    evidenceMap.registerSpan(createSpan('span_1', '3. DATE OF BIRTH (day) 16 (month) March (year) 1967'))

    const result = validateEvidence(
      { dateOfBirth: createField('1967-03-16', ['span_1']) },
      evidenceMap,
      EXTRACTION_ID
    )

    expect(result.fields.dateOfBirth.state).toBe('candidate')
  })

  test('keeps a normalized birthplace supported by the PSA labeled field', () => {
    const evidenceMap = new EvidenceMap(EXTRACTION_ID)
    evidenceMap.registerSpan(createSpan(
      'span_1',
      '4. PLACE OF BIRTH (Name of Hospital/Clinic/Institution/House No., Street, Barangay) San Jose Ayunan (City/Municipality) Lubao, (Province) Pampanga'
    ))

    const result = validateEvidence(
      { placeOfBirth: createField('San Jose Ayunan, Lubao, Pampanga', ['span_1']) },
      evidenceMap,
      EXTRACTION_ID
    )

    expect(result.fields.placeOfBirth.state).toBe('candidate')
  })

  test('keeps an ISO date supported by an abbreviated textual date', () => {
    const evidenceMap = new EvidenceMap(EXTRACTION_ID)
    evidenceMap.registerSpan(createSpan('span_1', '01 JAN 2000'))

    const result = validateEvidence(
      { birthDate: createField('2000-01-01', ['span_1']) },
      evidenceMap,
      EXTRACTION_ID
    )

    expect(result.fields.birthDate.state).toBe('candidate')
  })

  test('marks fabricated evidence as ambiguous', () => {
    const evidenceMap = new EvidenceMap(EXTRACTION_ID)

    const result = validateEvidence(
      { firstName: createField('Juan', ['span_missing']) },
      evidenceMap,
      EXTRACTION_ID
    )

    expect(result.fields.firstName.state).toBe('ambiguous')
  })

  test('marks cross-extraction evidence as ambiguous', () => {
    const evidenceMap = new EvidenceMap('ext_999')
    evidenceMap.registerSpan(createSpan('span_1', 'Pedro', 'ext_999'))

    const result = validateEvidence(
      { firstName: createField('Pedro', ['span_1']) },
      evidenceMap,
      EXTRACTION_ID
    )

    expect(result.fields.firstName.state).toBe('ambiguous')
  })
})
