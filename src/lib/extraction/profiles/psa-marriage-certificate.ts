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

export const PsaMarriageCertificateProfile: DocumentProfile<any> = {
  documentType: 'PSA Marriage Certificate',
  version: '1.0.0',
  fields: {
    documentType: createEvidenceFieldDef('documentType', 'Document Type', 'string', true, 'low', true, 'EXACT'),
    certificateNumber: createEvidenceFieldDef('certificateNumber', 'Certificate Number', 'string', false, 'medium', true, 'ID_NUMBER'),
    husbandFirstName: createEvidenceFieldDef('husbandFirstName', 'Husband First Name', 'string', true, 'high', true, 'PERSON_NAME'),
    husbandMiddleName: createEvidenceFieldDef('husbandMiddleName', 'Husband Middle Name', 'string', false, 'high', true, 'PERSON_NAME'),
    husbandLastName: createEvidenceFieldDef('husbandLastName', 'Husband Last Name', 'string', true, 'high', true, 'PERSON_NAME'),
    wifeFirstName: createEvidenceFieldDef('wifeFirstName', 'Wife First Name', 'string', true, 'high', true, 'PERSON_NAME'),
    wifeMiddleName: createEvidenceFieldDef('wifeMiddleName', 'Wife Middle Name', 'string', false, 'high', true, 'PERSON_NAME'),
    wifeLastName: createEvidenceFieldDef('wifeLastName', 'Wife Last Name', 'string', true, 'high', true, 'PERSON_NAME'),
    dateOfMarriage: createEvidenceFieldDef('dateOfMarriage', 'Date of Marriage', 'date', true, 'high', true, 'DATE'),
    placeOfMarriage: createEvidenceFieldDef('placeOfMarriage', 'Place of Marriage', 'string', true, 'medium', true, 'ADDRESS'),
    husbandCitizenship: createEvidenceFieldDef('husbandCitizenship', 'Husband Citizenship', 'string', false, 'low', true, 'TEXT'),
    wifeCitizenship: createEvidenceFieldDef('wifeCitizenship', 'Wife Citizenship', 'string', false, 'low', true, 'TEXT'),
    issuingOffice: createEvidenceFieldDef('issuingOffice', 'Issuing Office', 'string', false, 'low', true, 'TEXT'),
    remarks: createEvidenceFieldDef('remarks', 'Remarks', 'string', false, 'low', false, 'TEXT'),
  },
  schema: z.object({
    documentType: EvidenceFieldSchema,
    certificateNumber: EvidenceFieldSchema,
    husbandFirstName: EvidenceFieldSchema,
    husbandMiddleName: EvidenceFieldSchema,
    husbandLastName: EvidenceFieldSchema,
    wifeFirstName: EvidenceFieldSchema,
    wifeMiddleName: EvidenceFieldSchema,
    wifeLastName: EvidenceFieldSchema,
    dateOfMarriage: EvidenceFieldSchema,
    placeOfMarriage: EvidenceFieldSchema,
    husbandCitizenship: EvidenceFieldSchema,
    wifeCitizenship: EvidenceFieldSchema,
    issuingOffice: EvidenceFieldSchema,
    remarks: EvidenceFieldSchema,
  })
};
