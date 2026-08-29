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

export const AffidavitOfSupportProfile: DocumentProfile<any> = {
  documentType: 'Affidavit of Support',
  version: '1.0.0',
  fields: {
    documentType: createEvidenceFieldDef('documentType', 'Document Type', 'string', true, 'low', true, 'EXACT'),
    sponsorFullName: createEvidenceFieldDef('sponsorFullName', 'Sponsor Full Name', 'string', true, 'high', true, 'PERSON_NAME'),
    sponsorFirstName: createEvidenceFieldDef('sponsorFirstName', 'Sponsor First Name', 'string', false, 'high', true, 'PERSON_NAME'),
    sponsorLastName: createEvidenceFieldDef('sponsorLastName', 'Sponsor Last Name', 'string', false, 'high', true, 'PERSON_NAME'),
    sponsorAddress: createEvidenceFieldDef('sponsorAddress', 'Sponsor Address', 'string', false, 'medium', true, 'ADDRESS'),
    applicantFullName: createEvidenceFieldDef('applicantFullName', 'Applicant Full Name', 'string', true, 'high', true, 'PERSON_NAME'),
    applicantFirstName: createEvidenceFieldDef('applicantFirstName', 'Applicant First Name', 'string', false, 'high', true, 'PERSON_NAME'),
    applicantLastName: createEvidenceFieldDef('applicantLastName', 'Applicant Last Name', 'string', false, 'high', true, 'PERSON_NAME'),
    declaredRelationship: createEvidenceFieldDef('declaredRelationship', 'Declared Relationship', 'string', true, 'high', true, 'TEXT'),
    supportDeclaration: createEvidenceFieldDef('supportDeclaration', 'Support Declaration', 'string', false, 'medium', true, 'TEXT'),
    executionDate: createEvidenceFieldDef('executionDate', 'Execution Date', 'date', true, 'medium', true, 'DATE'),
    notaryName: createEvidenceFieldDef('notaryName', 'Notary Name', 'string', false, 'low', true, 'PERSON_NAME'),
    notaryRollNumber: createEvidenceFieldDef('notaryRollNumber', 'Notary Roll Number', 'string', false, 'low', true, 'ID_NUMBER'),
    remarks: createEvidenceFieldDef('remarks', 'Remarks', 'string', false, 'low', false, 'TEXT'),
  },
  schema: z.object({
    documentType: EvidenceFieldSchema,
    sponsorFullName: EvidenceFieldSchema,
    sponsorFirstName: EvidenceFieldSchema,
    sponsorLastName: EvidenceFieldSchema,
    sponsorAddress: EvidenceFieldSchema,
    applicantFullName: EvidenceFieldSchema,
    applicantFirstName: EvidenceFieldSchema,
    applicantLastName: EvidenceFieldSchema,
    declaredRelationship: EvidenceFieldSchema,
    supportDeclaration: EvidenceFieldSchema,
    executionDate: EvidenceFieldSchema,
    notaryName: EvidenceFieldSchema,
    notaryRollNumber: EvidenceFieldSchema,
    remarks: EvidenceFieldSchema,
  })
};
