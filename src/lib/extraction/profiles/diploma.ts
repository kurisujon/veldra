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

export const DiplomaProfile: DocumentProfile<any> = {
  documentType: 'Diploma',
  version: '1.0.0',
  fields: {
    documentType: createEvidenceFieldDef('documentType', 'Document Type', 'string', true, 'low', true, 'EXACT'),
    studentFirstName: createEvidenceFieldDef('studentFirstName', 'First Name', 'string', true, 'high', true, 'PERSON_NAME'),
    studentMiddleName: createEvidenceFieldDef('studentMiddleName', 'Middle Name', 'string', false, 'high', true, 'PERSON_NAME'),
    studentLastName: createEvidenceFieldDef('studentLastName', 'Last Name', 'string', true, 'high', true, 'PERSON_NAME'),
    studentSuffix: createEvidenceFieldDef('studentSuffix', 'Suffix', 'string', false, 'low', true, 'PERSON_NAME'),
    institutionName: createEvidenceFieldDef('institutionName', 'Institution Name', 'string', true, 'medium', true, 'TEXT'),
    degree: createEvidenceFieldDef('degree', 'Degree', 'string', true, 'medium', true, 'TEXT'),
    program: createEvidenceFieldDef('program', 'Program', 'string', true, 'medium', true, 'TEXT'),
    dateAwarded: createEvidenceFieldDef('dateAwarded', 'Date Awarded', 'date', true, 'medium', true, 'DATE'),
    honors: createEvidenceFieldDef('honors', 'Honors', 'string', false, 'low', true, 'TEXT'),
    remarks: createEvidenceFieldDef('remarks', 'Remarks', 'string', false, 'low', false, 'TEXT'),
  },
  schema: z.object({
    documentType: EvidenceFieldSchema,
    studentFirstName: EvidenceFieldSchema,
    studentMiddleName: EvidenceFieldSchema,
    studentLastName: EvidenceFieldSchema,
    studentSuffix: EvidenceFieldSchema,
    institutionName: EvidenceFieldSchema,
    degree: EvidenceFieldSchema,
    program: EvidenceFieldSchema,
    dateAwarded: EvidenceFieldSchema,
    honors: EvidenceFieldSchema,
    remarks: EvidenceFieldSchema,
  })
};
