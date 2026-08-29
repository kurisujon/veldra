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

export const SponsorValidIdProfile: DocumentProfile<any> = {
  documentType: 'Sponsor Valid ID',
  version: '1.0.0',
  fields: {
    documentType: createEvidenceFieldDef('documentType', 'Document Type', 'string', true, 'low', true, 'EXACT'),
    idType: createEvidenceFieldDef('idType', 'ID Type', 'string', true, 'medium', true, 'EXACT'),
    idNumber: createEvidenceFieldDef('idNumber', 'ID Number', 'string', true, 'high', true, 'ID_NUMBER'),
    firstName: createEvidenceFieldDef('firstName', 'First Name', 'string', false, 'high', true, 'PERSON_NAME'),
    middleName: createEvidenceFieldDef('middleName', 'Middle Name', 'string', false, 'high', true, 'PERSON_NAME'),
    lastName: createEvidenceFieldDef('lastName', 'Last Name', 'string', false, 'high', true, 'PERSON_NAME'),
    suffix: createEvidenceFieldDef('suffix', 'Suffix', 'string', false, 'low', true, 'PERSON_NAME'),
    fullName: createEvidenceFieldDef('fullName', 'Full Name', 'string', true, 'high', true, 'PERSON_NAME'),
    dateOfBirth: createEvidenceFieldDef('dateOfBirth', 'Date of Birth', 'date', false, 'high', true, 'DATE'),
    sex: createEvidenceFieldDef('sex', 'Sex', 'string', false, 'medium', true, 'EXACT'),
    address: createEvidenceFieldDef('address', 'Address', 'string', false, 'medium', true, 'ADDRESS'),
    issueDate: createEvidenceFieldDef('issueDate', 'Issue Date', 'date', false, 'low', true, 'DATE'),
    expiryDate: createEvidenceFieldDef('expiryDate', 'Expiry Date', 'date', false, 'medium', true, 'DATE'),
    issuingAuthority: createEvidenceFieldDef('issuingAuthority', 'Issuing Authority', 'string', false, 'low', true, 'TEXT'),
    remarks: createEvidenceFieldDef('remarks', 'Remarks', 'string', false, 'low', false, 'TEXT'),
  },
  schema: z.object({
    documentType: EvidenceFieldSchema,
    idType: EvidenceFieldSchema,
    idNumber: EvidenceFieldSchema,
    firstName: EvidenceFieldSchema,
    middleName: EvidenceFieldSchema,
    lastName: EvidenceFieldSchema,
    suffix: EvidenceFieldSchema,
    fullName: EvidenceFieldSchema,
    dateOfBirth: EvidenceFieldSchema,
    sex: EvidenceFieldSchema,
    address: EvidenceFieldSchema,
    issueDate: EvidenceFieldSchema,
    expiryDate: EvidenceFieldSchema,
    issuingAuthority: EvidenceFieldSchema,
    remarks: EvidenceFieldSchema,
  })
};
