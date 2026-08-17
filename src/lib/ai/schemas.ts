import { z } from 'zod';

// ---------------------------------------------------------------------------
// Evidence Field Schema (new: grounded extraction)
// ---------------------------------------------------------------------------

/**
 * Zod schema for an evidence-grounded extracted field.
 * Every field extracted by the upgraded pipeline includes source evidence.
 */
export const EvidenceFieldSchema = z.object({
  value: z.union([z.string(), z.null()]).catch(null).default(null),
  sourceText: z.union([z.string(), z.null()]).catch(null).default(null),
  page: z.union([z.number(), z.null()]).catch(null).default(null),
  confidence: z.union([z.number(), z.null()]).catch(null).default(null),
  status: z.enum(['verified', 'uncertain', 'missing', 'unreadable']).catch('uncertain').default('uncertain'),
});

export type EvidenceField = z.infer<typeof EvidenceFieldSchema>;

/**
 * Helper to create a nullable evidence field with graceful degradation.
 */
function evidenceField() {
  return EvidenceFieldSchema.catch({
    value: null,
    sourceText: null,
    page: null,
    confidence: null,
    status: 'uncertain' as const,
  }).default({
    value: null,
    sourceText: null,
    page: null,
    confidence: null,
    status: 'uncertain' as const,
  });
}

// ---------------------------------------------------------------------------
// Grounded Extraction Schemas (new pipeline)
// ---------------------------------------------------------------------------

/**
 * Grounded PSA Birth Certificate schema — each field carries evidence.
 */
export const GroundedBirthCertificateSchema = z.object({
  documentType: evidenceField(),
  certificateNumber: evidenceField(),
  registryNumber: evidenceField(),
  firstName: evidenceField(),
  middleName: evidenceField(),
  lastName: evidenceField(),
  suffix: evidenceField(),
  sex: evidenceField(),
  dateOfBirth: evidenceField(),
  placeOfBirth: evidenceField(),
  fatherFirstName: evidenceField(),
  fatherMiddleName: evidenceField(),
  fatherLastName: evidenceField(),
  motherMaidenFirstName: evidenceField(),
  motherMaidenMiddleName: evidenceField(),
  motherMaidenLastName: evidenceField(),
  dateOfRegistration: evidenceField(),
  issuingOffice: evidenceField(),
  remarks: evidenceField(),
});

export type GroundedBirthCertificateData = z.infer<typeof GroundedBirthCertificateSchema>;

export const GroundedMarriageCertificateSchema = z.object({
  documentType: evidenceField(),
  certificateNumber: evidenceField(),
  husbandFirstName: evidenceField(),
  husbandMiddleName: evidenceField(),
  husbandLastName: evidenceField(),
  wifeFirstName: evidenceField(),
  wifeMiddleName: evidenceField(),
  wifeLastName: evidenceField(),
  dateOfMarriage: evidenceField(),
  placeOfMarriage: evidenceField(),
  husbandCitizenship: evidenceField(),
  wifeCitizenship: evidenceField(),
  issuingOffice: evidenceField(),
  remarks: evidenceField(),
});

export type GroundedMarriageCertificateData = z.infer<typeof GroundedMarriageCertificateSchema>;

const GroundedAcademicEntrySchema = z.object({
  schoolYear: z.string().nullish().catch(null).default(null),
  term: z.string().nullish().catch(null).default(null),
  subjectCode: z.string().nullish().catch(null).default(null),
  subjectTitle: z.string().nullish().catch(null).default(null),
  grade: z.string().nullish().catch(null).default(null),
  units: z.string().nullish().catch(null).default(null),
});

export const GroundedTorSchema = z.object({
  documentType: evidenceField(),
  studentFirstName: evidenceField(),
  studentMiddleName: evidenceField(),
  studentLastName: evidenceField(),
  studentSuffix: evidenceField(),
  institutionName: evidenceField(),
  institutionAddress: evidenceField(),
  program: evidenceField(),
  degree: evidenceField(),
  studentNumber: evidenceField(),
  dateOfGraduation: evidenceField(),
  honors: evidenceField(),
  academicEntries: evidenceField(),
});

export type GroundedTorData = z.infer<typeof GroundedTorSchema>;

const GroundedGradeLevelEntrySchema = z.object({
  gradeLevel: z.string().nullish().catch(null).default(null),
  schoolYear: z.string().nullish().catch(null).default(null),
  schoolName: z.string().nullish().catch(null).default(null),
  generalAverage: z.string().nullish().catch(null).default(null),
});

export const GroundedSf10Schema = z.object({
  documentType: evidenceField(),
  studentFirstName: evidenceField(),
  studentMiddleName: evidenceField(),
  studentLastName: evidenceField(),
  dateOfBirth: evidenceField(),
  schoolName: evidenceField(),
  schoolAddress: evidenceField(),
  lrn: evidenceField(),
  gradeLevelEntries: evidenceField(),
  remarks: evidenceField(),
});

export type GroundedSf10Data = z.infer<typeof GroundedSf10Schema>;

export const GroundedDiplomaSchema = z.object({
  documentType: evidenceField(),
  studentFirstName: evidenceField(),
  studentMiddleName: evidenceField(),
  studentLastName: evidenceField(),
  studentSuffix: evidenceField(),
  institutionName: evidenceField(),
  degree: evidenceField(),
  program: evidenceField(),
  dateAwarded: evidenceField(),
  honors: evidenceField(),
  remarks: evidenceField(),
});

export type GroundedDiplomaData = z.infer<typeof GroundedDiplomaSchema>;

export const GroundedBankStatementSchema = z.object({
  documentType: evidenceField(),
  accountHolderName: evidenceField(),
  accountNumber: evidenceField(),
  bankName: evidenceField(),
  bankAddress: evidenceField(),
  statementDate: evidenceField(),
  currency: evidenceField(),
  closingBalance: evidenceField(),
  remarks: evidenceField(),
});

export type GroundedBankStatementData = z.infer<typeof GroundedBankStatementSchema>;

export const GroundedProofOfBillingSchema = z.object({
  documentType: evidenceField(),
  billerName: evidenceField(),
  customerName: evidenceField(),
  billingAddress: evidenceField(),
  accountNumber: evidenceField(),
  statementDate: evidenceField(),
  dueDate: evidenceField(),
  amountDue: evidenceField(),
  remarks: evidenceField(),
});

export type GroundedProofOfBillingData = z.infer<typeof GroundedProofOfBillingSchema>;

export const GroundedSponsorValidIDSchema = z.object({
  documentType: evidenceField(),
  idType: evidenceField(),
  idNumber: evidenceField(),
  firstName: evidenceField(),
  middleName: evidenceField(),
  lastName: evidenceField(),
  suffix: evidenceField(),
  fullName: evidenceField(),
  dateOfBirth: evidenceField(),
  sex: evidenceField(),
  address: evidenceField(),
  issueDate: evidenceField(),
  expiryDate: evidenceField(),
  issuingAuthority: evidenceField(),
  remarks: evidenceField(),
});

export type GroundedSponsorValidIDData = z.infer<typeof GroundedSponsorValidIDSchema>;

export const GroundedSponsorCOESchema = z.object({
  documentType: evidenceField(),
  sponsorFullName: evidenceField(),
  sponsorFirstName: evidenceField(),
  sponsorLastName: evidenceField(),
  employerName: evidenceField(),
  employerAddress: evidenceField(),
  position: evidenceField(),
  employmentStatus: evidenceField(),
  employmentStartDate: evidenceField(),
  monthlySalary: evidenceField(),
  annualSalary: evidenceField(),
  issueDate: evidenceField(),
  signatoryName: evidenceField(),
  signatoryPosition: evidenceField(),
  remarks: evidenceField(),
});

export type GroundedSponsorCOEData = z.infer<typeof GroundedSponsorCOESchema>;

export const GroundedSponsorITRSchema = z.object({
  documentType: evidenceField(),
  taxpayerFullName: evidenceField(),
  taxpayerFirstName: evidenceField(),
  taxpayerLastName: evidenceField(),
  tin: evidenceField(),
  taxYear: evidenceField(),
  employerName: evidenceField(),
  grossCompensationIncome: evidenceField(),
  taxableIncome: evidenceField(),
  address: evidenceField(),
  remarks: evidenceField(),
});

export type GroundedSponsorITRData = z.infer<typeof GroundedSponsorITRSchema>;

export const GroundedAffidavitOfSupportSchema = z.object({
  documentType: evidenceField(),
  sponsorFullName: evidenceField(),
  sponsorFirstName: evidenceField(),
  sponsorLastName: evidenceField(),
  sponsorAddress: evidenceField(),
  applicantFullName: evidenceField(),
  applicantFirstName: evidenceField(),
  applicantLastName: evidenceField(),
  declaredRelationship: evidenceField(),
  supportDeclaration: evidenceField(),
  executionDate: evidenceField(),
  notaryName: evidenceField(),
  notaryRollNumber: evidenceField(),
  remarks: evidenceField(),
});

export type GroundedAffidavitOfSupportData = z.infer<typeof GroundedAffidavitOfSupportSchema>;

/**
 * Union type for all grounded extraction data.
 */
export type GroundedExtractionData =
  | GroundedBirthCertificateData
  | GroundedMarriageCertificateData
  | GroundedTorData
  | GroundedSf10Data
  | GroundedDiplomaData
  | GroundedBankStatementData
  | GroundedProofOfBillingData
  | GroundedSponsorValidIDData
  | GroundedSponsorCOEData
  | GroundedSponsorITRData
  | GroundedAffidavitOfSupportData;

// ---------------------------------------------------------------------------
// Grounded Schema Registry
// ---------------------------------------------------------------------------

/**
 * Returns the grounded Zod schema for a given document type.
 */
export function getGroundedSchemaForType(documentType: string): z.ZodObject<z.ZodRawShape> {
  const type = documentType.toLowerCase();
  if (type.includes('birth') || type === 'psabirth') return GroundedBirthCertificateSchema;
  if (type.includes('marriage') || type === 'psamarriage') return GroundedMarriageCertificateSchema;
  if (type.includes('tor') || type.includes('transcript') || type === 'tor') return GroundedTorSchema;
  if (type === 'sf10' || type.includes('sf10')) return GroundedSf10Schema;
  if (type.includes('diploma') || type === 'diploma') return GroundedDiplomaSchema;
  if (type.includes('bank') || type === 'bankstatement') return GroundedBankStatementSchema;
  if (type.includes('billing') || type === 'proofofbilling') return GroundedProofOfBillingSchema;
  if (type.includes('sponsorvalidid') || type === 'validid') return GroundedSponsorValidIDSchema;
  if (type.includes('sponsorcoe') || type === 'coe') return GroundedSponsorCOESchema;
  if (type.includes('sponsoritr') || type === 'itr') return GroundedSponsorITRSchema;
  if (type.includes('affidavit') || type === 'affidavitofsupport') return GroundedAffidavitOfSupportSchema;
  throw new Error(`No grounded schema defined for document type: ${documentType}`);
}

// ===========================================================================
// Legacy Flat Schemas (preserved for backward compatibility)
// ===========================================================================

/**
 * Zod schema for a structured PSA Birth Certificate extraction object.
 * All fields are nullable to handle missing or unreadable values.
 */
export const BirthCertificateSchema = z.object({
  documentType: z.string().nullish().catch(null).default(null),
  certificateNumber: z.string().nullish().catch(null).default(null),
  registryNumber: z.string().nullish().catch(null).default(null),
  firstName: z.string().nullish().catch(null).default(null),
  middleName: z.string().nullish().catch(null).default(null),
  lastName: z.string().nullish().catch(null).default(null),
  suffix: z.string().nullish().catch(null).default(null),
  sex: z.string().nullish().catch(null).default(null),
  dateOfBirth: z.string().nullish().catch(null).default(null),
  placeOfBirth: z.string().nullish().catch(null).default(null),
  fatherFirstName: z.string().nullish().catch(null).default(null),
  fatherMiddleName: z.string().nullish().catch(null).default(null),
  fatherLastName: z.string().nullish().catch(null).default(null),
  motherMaidenFirstName: z.string().nullish().catch(null).default(null),
  motherMaidenMiddleName: z.string().nullish().catch(null).default(null),
  motherMaidenLastName: z.string().nullish().catch(null).default(null),
  dateOfRegistration: z.string().nullish().catch(null).default(null),
  issuingOffice: z.string().nullish().catch(null).default(null),
  remarks: z.string().nullish().catch(null).default(null),
});

export type BirthCertificateData = z.infer<typeof BirthCertificateSchema>;

/**
 * Zod schema for a structured PSA Marriage Certificate extraction object.
 * All fields are nullable to handle missing or unreadable values.
 */
export const MarriageCertificateSchema = z.object({
  documentType: z.string().nullish().catch(null).default(null),
  certificateNumber: z.string().nullish().catch(null).default(null),
  husbandFirstName: z.string().nullish().catch(null).default(null),
  husbandMiddleName: z.string().nullish().catch(null).default(null),
  husbandLastName: z.string().nullish().catch(null).default(null),
  wifeFirstName: z.string().nullish().catch(null).default(null),
  wifeMiddleName: z.string().nullish().catch(null).default(null),
  wifeLastName: z.string().nullish().catch(null).default(null),
  dateOfMarriage: z.string().nullish().catch(null).default(null),
  placeOfMarriage: z.string().nullish().catch(null).default(null),
  husbandCitizenship: z.string().nullish().catch(null).default(null),
  wifeCitizenship: z.string().nullish().catch(null).default(null),
  issuingOffice: z.string().nullish().catch(null).default(null),
  remarks: z.string().nullish().catch(null).default(null),
});

export type MarriageCertificateData = z.infer<typeof MarriageCertificateSchema>;

/**
 * Zod schema for individual academic entries in a TOR document.
 */
export const AcademicEntrySchema = z.object({
  schoolYear: z.string().nullish().catch(null).default(null),
  term: z.string().nullish().catch(null).default(null),
  subjectCode: z.string().nullish().catch(null).default(null),
  subjectTitle: z.string().nullish().catch(null).default(null),
  grade: z.string().nullish().catch(null).default(null),
  units: z.string().nullish().catch(null).default(null),
});

export type AcademicEntry = z.infer<typeof AcademicEntrySchema>;

/**
 * Zod schema for a structured Transcript of Records (TOR) extraction object.
 * All fields are nullable to handle missing or unreadable values.
 */
export const TorSchema = z.object({
  documentType: z.string().nullish().catch(null).default(null),
  studentFirstName: z.string().nullish().catch(null).default(null),
  studentMiddleName: z.string().nullish().catch(null).default(null),
  studentLastName: z.string().nullish().catch(null).default(null),
  studentSuffix: z.string().nullish().catch(null).default(null),
  institutionName: z.string().nullish().catch(null).default(null),
  institutionAddress: z.string().nullish().catch(null).default(null),
  program: z.string().nullish().catch(null).default(null),
  degree: z.string().nullish().catch(null).default(null),
  studentNumber: z.string().nullish().catch(null).default(null),
  dateOfGraduation: z.string().nullish().catch(null).default(null),
  honors: z.string().nullish().catch(null).default(null),
  academicEntries: z.array(AcademicEntrySchema).nullish().catch(null).default(null),
});

export type TorData = z.infer<typeof TorSchema>;

/**
 * Zod schema for individual grade level progression entries in an SF10 document.
 */
export const GradeLevelEntrySchema = z.object({
  gradeLevel: z.string().nullish().catch(null).default(null),
  schoolYear: z.string().nullish().catch(null).default(null),
  schoolName: z.string().nullish().catch(null).default(null),
  generalAverage: z.string().nullish().catch(null).default(null),
});

export type GradeLevelEntry = z.infer<typeof GradeLevelEntrySchema>;

/**
 * Zod schema for a structured SF10 Student Permanent Record extraction object.
 * All fields are nullable to handle missing or unreadable values.
 */
export const Sf10Schema = z.object({
  documentType: z.string().nullish().catch(null).default(null),
  studentFirstName: z.string().nullish().catch(null).default(null),
  studentMiddleName: z.string().nullish().catch(null).default(null),
  studentLastName: z.string().nullish().catch(null).default(null),
  dateOfBirth: z.string().nullish().catch(null).default(null),
  schoolName: z.string().nullish().catch(null).default(null),
  schoolAddress: z.string().nullish().catch(null).default(null),
  lrn: z.string().nullish().catch(null).default(null),
  gradeLevelEntries: z.array(GradeLevelEntrySchema).nullish().catch(null).default(null),
  remarks: z.string().nullish().catch(null).default(null),
});

export type Sf10Data = z.infer<typeof Sf10Schema>;

/**
 * Zod schema for a structured Diploma extraction object.
 * All fields are nullable to handle missing or unreadable values.
 */
export const DiplomaSchema = z.object({
  documentType: z.string().nullish().catch(null).default(null),
  studentFirstName: z.string().nullish().catch(null).default(null),
  studentMiddleName: z.string().nullish().catch(null).default(null),
  studentLastName: z.string().nullish().catch(null).default(null),
  studentSuffix: z.string().nullish().catch(null).default(null),
  institutionName: z.string().nullish().catch(null).default(null),
  degree: z.string().nullish().catch(null).default(null),
  program: z.string().nullish().catch(null).default(null),
  dateAwarded: z.string().nullish().catch(null).default(null),
  honors: z.string().nullish().catch(null).default(null),
  remarks: z.string().nullish().catch(null).default(null),
});

export type DiplomaData = z.infer<typeof DiplomaSchema>;

/**
 * Zod schema for a structured Bank Statement extraction object (Sponsor).
 * All fields are nullable to handle missing or unreadable values.
 */
export const BankStatementSchema = z.object({
  documentType: z.string().nullish().catch(null).default(null),
  accountHolderName: z.string().nullish().catch(null).default(null),
  accountNumber: z.string().nullish().catch(null).default(null),
  bankName: z.string().nullish().catch(null).default(null),
  bankAddress: z.string().nullish().catch(null).default(null),
  statementDate: z.string().nullish().catch(null).default(null),
  currency: z.string().nullish().catch(null).default(null),
  closingBalance: z.string().nullish().catch(null).default(null),
  remarks: z.string().nullish().catch(null).default(null),
});

export type BankStatementData = z.infer<typeof BankStatementSchema>;

/**
 * Zod schema for a structured Proof of Billing extraction object (Sponsor).
 */
export const ProofOfBillingSchema = z.object({
  documentType: z.string().nullish().catch(null).default(null),
  billerName: z.string().nullish().catch(null).default(null),
  customerName: z.string().nullish().catch(null).default(null),
  billingAddress: z.string().nullish().catch(null).default(null),
  accountNumber: z.string().nullish().catch(null).default(null),
  statementDate: z.string().nullish().catch(null).default(null),
  dueDate: z.string().nullish().catch(null).default(null),
  amountDue: z.string().nullish().catch(null).default(null),
  remarks: z.string().nullish().catch(null).default(null),
});

export type ProofOfBillingData = z.infer<typeof ProofOfBillingSchema>;

/**
 * Union type for all supported document extraction data structures.
 */
export type ExtractedDocumentData =
  | BirthCertificateData
  | MarriageCertificateData
  | TorData
  | Sf10Data
  | DiplomaData
  | BankStatementData
  | ProofOfBillingData
  | SponsorValidIDData
  | SponsorCOEData
  | SponsorITRData
  | AffidavitOfSupportData;

// ---------------------------------------------------------------------------
// Phase 10: Sponsor Document Schemas
// ---------------------------------------------------------------------------

/**
 * Sponsor Valid ID / Passport
 */
export const SponsorValidIDSchema = z.object({
  documentType: z.string().nullish().catch(null).default(null),
  idType: z.string().nullish().catch(null).default(null),
  idNumber: z.string().nullish().catch(null).default(null),
  firstName: z.string().nullish().catch(null).default(null),
  middleName: z.string().nullish().catch(null).default(null),
  lastName: z.string().nullish().catch(null).default(null),
  suffix: z.string().nullish().catch(null).default(null),
  fullName: z.string().nullish().catch(null).default(null),
  dateOfBirth: z.string().nullish().catch(null).default(null),
  sex: z.string().nullish().catch(null).default(null),
  address: z.string().nullish().catch(null).default(null),
  issueDate: z.string().nullish().catch(null).default(null),
  expiryDate: z.string().nullish().catch(null).default(null),
  issuingAuthority: z.string().nullish().catch(null).default(null),
  remarks: z.string().nullish().catch(null).default(null),
});
export type SponsorValidIDData = z.infer<typeof SponsorValidIDSchema>;

/**
 * Certificate of Employment (COE)
 */
export const SponsorCOESchema = z.object({
  documentType: z.string().nullish().catch(null).default(null),
  sponsorFullName: z.string().nullish().catch(null).default(null),
  sponsorFirstName: z.string().nullish().catch(null).default(null),
  sponsorLastName: z.string().nullish().catch(null).default(null),
  employerName: z.string().nullish().catch(null).default(null),
  employerAddress: z.string().nullish().catch(null).default(null),
  position: z.string().nullish().catch(null).default(null),
  employmentStatus: z.string().nullish().catch(null).default(null),
  employmentStartDate: z.string().nullish().catch(null).default(null),
  monthlySalary: z.string().nullish().catch(null).default(null),
  annualSalary: z.string().nullish().catch(null).default(null),
  issueDate: z.string().nullish().catch(null).default(null),
  signatoryName: z.string().nullish().catch(null).default(null),
  signatoryPosition: z.string().nullish().catch(null).default(null),
  remarks: z.string().nullish().catch(null).default(null),
});
export type SponsorCOEData = z.infer<typeof SponsorCOESchema>;

/**
 * Income Tax Return (ITR)
 */
export const SponsorITRSchema = z.object({
  documentType: z.string().nullish().catch(null).default(null),
  taxpayerFullName: z.string().nullish().catch(null).default(null),
  taxpayerFirstName: z.string().nullish().catch(null).default(null),
  taxpayerLastName: z.string().nullish().catch(null).default(null),
  tin: z.string().nullish().catch(null).default(null),
  taxYear: z.string().nullish().catch(null).default(null),
  employerName: z.string().nullish().catch(null).default(null),
  grossCompensationIncome: z.string().nullish().catch(null).default(null),
  taxableIncome: z.string().nullish().catch(null).default(null),
  address: z.string().nullish().catch(null).default(null),
  remarks: z.string().nullish().catch(null).default(null),
});
export type SponsorITRData = z.infer<typeof SponsorITRSchema>;

/**
 * Affidavit of Support
 */
export const AffidavitOfSupportSchema = z.object({
  documentType: z.string().nullish().catch(null).default(null),
  sponsorFullName: z.string().nullish().catch(null).default(null),
  sponsorFirstName: z.string().nullish().catch(null).default(null),
  sponsorLastName: z.string().nullish().catch(null).default(null),
  sponsorAddress: z.string().nullish().catch(null).default(null),
  applicantFullName: z.string().nullish().catch(null).default(null),
  applicantFirstName: z.string().nullish().catch(null).default(null),
  applicantLastName: z.string().nullish().catch(null).default(null),
  declaredRelationship: z.string().nullish().catch(null).default(null),
  supportDeclaration: z.string().nullish().catch(null).default(null),
  executionDate: z.string().nullish().catch(null).default(null),
  notaryName: z.string().nullish().catch(null).default(null),
  notaryRollNumber: z.string().nullish().catch(null).default(null),
  remarks: z.string().nullish().catch(null).default(null),
});
export type AffidavitOfSupportData = z.infer<typeof AffidavitOfSupportSchema>;
