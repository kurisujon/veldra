import { z } from 'zod';
import { DocumentProfile, ProfileFieldDefinition } from './types';
import { EvidenceFieldSchema } from '../../ai/schemas';

function createEvidenceFieldDef(
  key: string,
  label: string,
  type: 'string' | 'number' | 'date' | 'boolean',
  required: boolean,
  risk: 'high' | 'medium' | 'low',
  evidenceRequired: boolean,
  normalization: 'PERSON_NAME' | 'DATE' | 'ID_NUMBER' | 'ADDRESS' | 'TEXT' | 'EXACT'
): ProfileFieldDefinition {
  return {
    key,
    label,
    type,
    required,
    risk,
    evidenceRequired,
    allowedStates: ['candidate', 'verified', 'not_present', 'unreadable', 'ambiguous'],
    normalization
  };
}

export const PsaBirthCertificateProfile: DocumentProfile<any> = {
  documentType: 'PSA Birth Certificate',
  version: '1.0.0',
  fields: {
    documentType: createEvidenceFieldDef('documentType', 'Document Type', 'string', true, 'low', true, 'EXACT'),
    certificateNumber: createEvidenceFieldDef('certificateNumber', 'Certificate Number', 'string', false, 'medium', true, 'ID_NUMBER'),
    registryNumber: createEvidenceFieldDef('registryNumber', 'Registry Number', 'string', true, 'medium', true, 'ID_NUMBER'),
    firstName: createEvidenceFieldDef('firstName', 'First Name', 'string', true, 'high', true, 'PERSON_NAME'),
    middleName: createEvidenceFieldDef('middleName', 'Middle Name', 'string', false, 'high', true, 'PERSON_NAME'),
    lastName: createEvidenceFieldDef('lastName', 'Last Name', 'string', true, 'high', true, 'PERSON_NAME'),
    suffix: createEvidenceFieldDef('suffix', 'Suffix', 'string', false, 'low', true, 'PERSON_NAME'),
    sex: createEvidenceFieldDef('sex', 'Sex', 'string', true, 'high', true, 'EXACT'),
    dateOfBirth: createEvidenceFieldDef('dateOfBirth', 'Date of Birth', 'date', true, 'high', true, 'DATE'),
    placeOfBirth: createEvidenceFieldDef('placeOfBirth', 'Place of Birth', 'string', true, 'medium', true, 'ADDRESS'),
    fatherFirstName: createEvidenceFieldDef('fatherFirstName', 'Father First Name', 'string', false, 'high', true, 'PERSON_NAME'),
    fatherMiddleName: createEvidenceFieldDef('fatherMiddleName', 'Father Middle Name', 'string', false, 'high', true, 'PERSON_NAME'),
    fatherLastName: createEvidenceFieldDef('fatherLastName', 'Father Last Name', 'string', false, 'high', true, 'PERSON_NAME'),
    motherMaidenFirstName: createEvidenceFieldDef('motherMaidenFirstName', 'Mother Maiden First Name', 'string', true, 'high', true, 'PERSON_NAME'),
    motherMaidenMiddleName: createEvidenceFieldDef('motherMaidenMiddleName', 'Mother Maiden Middle Name', 'string', false, 'high', true, 'PERSON_NAME'),
    motherMaidenLastName: createEvidenceFieldDef('motherMaidenLastName', 'Mother Maiden Last Name', 'string', true, 'high', true, 'PERSON_NAME'),
    dateOfRegistration: createEvidenceFieldDef('dateOfRegistration', 'Date of Registration', 'date', false, 'low', true, 'DATE'),
    dateIssued: createEvidenceFieldDef('dateIssued', 'Date Issued (PSA Copy)', 'date', false, 'medium', true, 'DATE'),
    isDelayedRegistration: createEvidenceFieldDef('isDelayedRegistration', 'Delayed Registration Indicator', 'boolean', false, 'medium', true, 'EXACT'),
    issuingOffice: createEvidenceFieldDef('issuingOffice', 'Issuing Office', 'string', false, 'low', true, 'TEXT'),
    remarks: createEvidenceFieldDef('remarks', 'Remarks', 'string', false, 'low', false, 'TEXT'),
  },
  schema: z.object({
    documentType: EvidenceFieldSchema,
    certificateNumber: EvidenceFieldSchema,
    registryNumber: EvidenceFieldSchema,
    firstName: EvidenceFieldSchema,
    middleName: EvidenceFieldSchema,
    lastName: EvidenceFieldSchema,
    suffix: EvidenceFieldSchema,
    sex: EvidenceFieldSchema,
    dateOfBirth: EvidenceFieldSchema,
    placeOfBirth: EvidenceFieldSchema,
    fatherFirstName: EvidenceFieldSchema,
    fatherMiddleName: EvidenceFieldSchema,
    fatherLastName: EvidenceFieldSchema,
    motherMaidenFirstName: EvidenceFieldSchema,
    motherMaidenMiddleName: EvidenceFieldSchema,
    motherMaidenLastName: EvidenceFieldSchema,
    dateOfRegistration: EvidenceFieldSchema,
    dateIssued: EvidenceFieldSchema,
    isDelayedRegistration: EvidenceFieldSchema,
    issuingOffice: EvidenceFieldSchema,
    remarks: EvidenceFieldSchema,
  })
};
