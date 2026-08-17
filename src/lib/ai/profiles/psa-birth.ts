/**
 * PSA Birth Certificate Extraction Profile.
 *
 * Document-specific extraction configuration that defines:
 * - Expected fields with metadata
 * - Normalization rules
 * - Validation rules
 * - Few-shot extraction examples
 *
 * Uses the actual Veldra schema field names from BirthCertificateSchema.
 */

import type { ExtractedField } from '../types';

// ---------------------------------------------------------------------------
// Field Definition
// ---------------------------------------------------------------------------

export interface FieldDefinition {
  /** The field name (matches Zod schema key) */
  name: string;
  /** Human-readable description of what this field means */
  description: string;
  /** Expected document label/section where this appears */
  expectedLabel: string;
  /** Whether this field is required for a valid extraction */
  required: boolean;
  /** The type of normalization to apply */
  normalizationType: 'name' | 'date' | 'identifier' | 'text';
  /** What to do when the field is unreadable */
  onUnreadable: 'null_with_uncertain' | 'null_with_missing';
}

// ---------------------------------------------------------------------------
// PSA Birth Certificate Fields
// ---------------------------------------------------------------------------

export const PSA_BIRTH_FIELDS: FieldDefinition[] = [
  // Child (Subject) fields — Top of form
  {
    name: 'firstName',
    description: "The child's first name (Section 1 — top of form)",
    expectedLabel: 'FIRST NAME / Section 1',
    required: true,
    normalizationType: 'name',
    onUnreadable: 'null_with_uncertain',
  },
  {
    name: 'middleName',
    description: "The child's middle name (Section 2). Often the mother's maiden last name.",
    expectedLabel: 'MIDDLE NAME / Section 2',
    required: false,
    normalizationType: 'name',
    onUnreadable: 'null_with_missing',
  },
  {
    name: 'lastName',
    description: "The child's last name (Section 3)",
    expectedLabel: 'LAST NAME / Section 3',
    required: true,
    normalizationType: 'name',
    onUnreadable: 'null_with_uncertain',
  },
  {
    name: 'suffix',
    description: "Name suffix like Jr., Sr., III, etc.",
    expectedLabel: 'SUFFIX',
    required: false,
    normalizationType: 'name',
    onUnreadable: 'null_with_missing',
  },
  {
    name: 'sex',
    description: "The child's sex as recorded on the document",
    expectedLabel: 'SEX / Section 4',
    required: false,
    normalizationType: 'text',
    onUnreadable: 'null_with_uncertain',
  },
  {
    name: 'dateOfBirth',
    description: "The child's date of birth",
    expectedLabel: 'DATE OF BIRTH / Section 5',
    required: true,
    normalizationType: 'date',
    onUnreadable: 'null_with_uncertain',
  },
  {
    name: 'placeOfBirth',
    description: "Place of birth (city/municipality, province)",
    expectedLabel: 'PLACE OF BIRTH',
    required: false,
    normalizationType: 'text',
    onUnreadable: 'null_with_uncertain',
  },

  // Mother fields — Middle of form
  {
    name: 'motherMaidenFirstName',
    description: "The mother's maiden first name (Section 6 — middle of form). This is the name she had BEFORE marriage.",
    expectedLabel: "MOTHER'S MAIDEN NAME / Section 6",
    required: false,
    normalizationType: 'name',
    onUnreadable: 'null_with_uncertain',
  },
  {
    name: 'motherMaidenMiddleName',
    description: "The mother's maiden middle name (Section 7)",
    expectedLabel: "MOTHER'S MAIDEN MIDDLE NAME / Section 7",
    required: false,
    normalizationType: 'name',
    onUnreadable: 'null_with_missing',
  },
  {
    name: 'motherMaidenLastName',
    description: "The mother's maiden last name (Section 8). This is her family name BEFORE marriage.",
    expectedLabel: "MOTHER'S MAIDEN LAST NAME / Section 8",
    required: false,
    normalizationType: 'name',
    onUnreadable: 'null_with_uncertain',
  },

  // Father fields — Lower section
  {
    name: 'fatherFirstName',
    description: "The father's first name (Section 13 — lower section). May be blank for out-of-wedlock births.",
    expectedLabel: "FATHER'S FIRST NAME / Section 13",
    required: false,
    normalizationType: 'name',
    onUnreadable: 'null_with_missing',
  },
  {
    name: 'fatherMiddleName',
    description: "The father's middle name (Section 14). May be blank for out-of-wedlock births.",
    expectedLabel: "FATHER'S MIDDLE NAME / Section 14",
    required: false,
    normalizationType: 'name',
    onUnreadable: 'null_with_missing',
  },
  {
    name: 'fatherLastName',
    description: "The father's last name (Section 15). May be blank for out-of-wedlock births.",
    expectedLabel: "FATHER'S LAST NAME / Section 15",
    required: false,
    normalizationType: 'name',
    onUnreadable: 'null_with_missing',
  },

  // Document metadata
  {
    name: 'certificateNumber',
    description: 'The PSA certificate number printed on the document',
    expectedLabel: 'CERTIFICATE NUMBER',
    required: false,
    normalizationType: 'identifier',
    onUnreadable: 'null_with_uncertain',
  },
  {
    name: 'registryNumber',
    description: 'The civil registry number',
    expectedLabel: 'REGISTRY NUMBER',
    required: false,
    normalizationType: 'identifier',
    onUnreadable: 'null_with_uncertain',
  },
  {
    name: 'dateOfRegistration',
    description: 'The date the birth was registered',
    expectedLabel: 'DATE OF REGISTRATION',
    required: false,
    normalizationType: 'date',
    onUnreadable: 'null_with_missing',
  },
  {
    name: 'issuingOffice',
    description: 'The office that issued this certificate',
    expectedLabel: 'ISSUING OFFICE',
    required: false,
    normalizationType: 'text',
    onUnreadable: 'null_with_missing',
  },
  {
    name: 'remarks',
    description: 'Any remarks, annotations, or corrections noted on the document',
    expectedLabel: 'REMARKS / ANNOTATIONS',
    required: false,
    normalizationType: 'text',
    onUnreadable: 'null_with_missing',
  },
];

// ---------------------------------------------------------------------------
// Few-Shot Extraction Examples
// ---------------------------------------------------------------------------

export interface ExtractionExample {
  description: string;
  input: string;
  output: Record<string, Partial<ExtractedField>>;
}

export const PSA_BIRTH_EXAMPLES: ExtractionExample[] = [
  {
    description: 'Normal extraction with clear names',
    input: 'Section 1: MARIA Section 2: SANTOS Section 3: DELA CRUZ Date of Birth: January 15, 2000 Mother Section 6: ROSARIO Section 7: GARCIA Section 8: SANTOS Father Section 13: JUAN Section 14: REYES Section 15: DELA CRUZ',
    output: {
      firstName: { value: 'MARIA', sourceText: 'MARIA', confidence: 0.95, status: 'verified' },
      middleName: { value: 'SANTOS', sourceText: 'SANTOS', confidence: 0.95, status: 'verified' },
      lastName: { value: 'DELA CRUZ', sourceText: 'DELA CRUZ', confidence: 0.95, status: 'verified' },
      dateOfBirth: { value: '2000-01-15', sourceText: 'January 15, 2000', confidence: 0.95, status: 'verified' },
      motherMaidenFirstName: { value: 'ROSARIO', sourceText: 'ROSARIO', confidence: 0.95, status: 'verified' },
      motherMaidenMiddleName: { value: 'GARCIA', sourceText: 'GARCIA', confidence: 0.95, status: 'verified' },
      motherMaidenLastName: { value: 'SANTOS', sourceText: 'SANTOS', confidence: 0.95, status: 'verified' },
      fatherFirstName: { value: 'JUAN', sourceText: 'JUAN', confidence: 0.95, status: 'verified' },
      fatherMiddleName: { value: 'REYES', sourceText: 'REYES', confidence: 0.95, status: 'verified' },
      fatherLastName: { value: 'DELA CRUZ', sourceText: 'DELA CRUZ', confidence: 0.95, status: 'verified' },
    },
  },
  {
    description: 'Missing father (out-of-wedlock birth)',
    input: 'Section 1: ANA Section 2: REYES Section 3: GARCIA Date of Birth: 05/20/1998 Mother Section 6: ELENA Section 7: CRUZ Section 8: REYES Father Section 13: --- Section 14: --- Section 15: ---',
    output: {
      firstName: { value: 'ANA', sourceText: 'ANA', confidence: 0.95, status: 'verified' },
      middleName: { value: 'REYES', sourceText: 'REYES', confidence: 0.95, status: 'verified' },
      lastName: { value: 'GARCIA', sourceText: 'GARCIA', confidence: 0.95, status: 'verified' },
      dateOfBirth: { value: '1998-05-20', sourceText: '05/20/1998', confidence: 0.95, status: 'verified' },
      fatherFirstName: { value: null, sourceText: '---', confidence: 0.90, status: 'missing' },
      fatherMiddleName: { value: null, sourceText: '---', confidence: 0.90, status: 'missing' },
      fatherLastName: { value: null, sourceText: '---', confidence: 0.90, status: 'missing' },
    },
  },
  {
    description: 'Unclear character (OCR ambiguity)',
    input: 'Section 1: SANT0S or SANTOS (unclear)',
    output: {
      firstName: { value: 'SANT0S', sourceText: 'SANT0S', confidence: 0.5, status: 'uncertain' },
    },
  },
  {
    description: 'Compound first name',
    input: 'Section 1: MARIA THERESA Section 3: BAUTISTA',
    output: {
      firstName: { value: 'MARIA THERESA', sourceText: 'MARIA THERESA', confidence: 0.90, status: 'verified' },
      lastName: { value: 'BAUTISTA', sourceText: 'BAUTISTA', confidence: 0.95, status: 'verified' },
    },
  },
];

// ---------------------------------------------------------------------------
// Profile Export
// ---------------------------------------------------------------------------

export const PSA_BIRTH_CERTIFICATE_PROFILE = {
  documentType: 'PSABirth',
  fields: PSA_BIRTH_FIELDS,
  examples: PSA_BIRTH_EXAMPLES,
} as const;
