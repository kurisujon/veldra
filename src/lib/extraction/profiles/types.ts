import { z } from 'zod';
import { EvidenceFieldSchema } from '../../ai/schemas';

// The base states our zero-trust architecture supports
export type FieldState = 'candidate' | 'verified' | 'not_present' | 'unreadable' | 'ambiguous';

// Deterministic normalization strategies
export type NormalizationStrategy = 
  | 'PERSON_NAME'
  | 'DATE'
  | 'ID_NUMBER'
  | 'ADDRESS'
  | 'TEXT'
  | 'EXACT';

// Risk classification
export type RiskLevel = 'high' | 'medium' | 'low';

// Cross-reference metadata
export interface CrossReferenceMetadata {
  entity: 'applicant' | 'sponsor' | 'parent';
  attribute: string;
}

// Field definition
export interface ProfileFieldDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  risk: RiskLevel;
  evidenceRequired: boolean;
  allowedStates: FieldState[];
  normalization: NormalizationStrategy;
  crossReference?: CrossReferenceMetadata;
}

// Document profile
export interface DocumentProfile<T extends Record<string, z.ZodTypeAny>> {
  documentType: string;
  version: string;
  fields: Record<keyof T, ProfileFieldDefinition>;
  schema: z.ZodObject<T>;
}

// Registry
export interface DocumentProfileRegistry {
  getProfile(documentType: string): DocumentProfile<any> | undefined;
}
