import { z } from 'zod';

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
 * Union type for all supported document extraction data structures.
 */
export type ExtractedDocumentData =
  | BirthCertificateData
  | MarriageCertificateData
  | TorData
  | Sf10Data
  | DiplomaData;
