import type { ExtractedField, FieldReliability, ReliabilityDecision, ExtractionConsistency } from './types';
import type { DocumentProfile } from '../extraction/profiles/types';
import { validateEvidence } from './evidence-validator';
import { EvidenceMap } from '../extraction/evidence/EvidenceMap';

export function resolveConflict(
  flashField: ExtractedField,
  proField: ExtractedField,
  reliability: FieldReliability
): ExtractedField {
  let finalState: ReliabilityDecision = 'NEEDS_HUMAN_REVIEW';
  let extractionConsistency: ExtractionConsistency = 'flash_pro_conflict';
  
  const flashValue = flashField.value?.trim().toLowerCase() || '';
  const proValue = proField.value?.trim().toLowerCase() || '';
  
  const sameValue = flashValue === proValue && flashField.state === proField.state;
  const sameEvidence = 
    flashField.evidenceSpanIds?.sort().join(',') === proField.evidenceSpanIds?.sort().join(',');

  if (sameValue && sameEvidence) {
    // CASE 1: Same value + same evidence -> match
    extractionConsistency = 'flash_pro_match';
    finalState = 'ACCEPT';
    return {
      ...flashField,
      reliability: {
        ...reliability,
        extractionConsistency,
        finalState
      }
    };
  }
  
  if (sameValue && !sameEvidence) {
    // CASE 2: Same normalized value + different evidence -> review
    extractionConsistency = 'evidence_disagreement';
    return {
      ...flashField,
      evidenceSpanIds: Array.from(new Set([...(flashField.evidenceSpanIds || []), ...(proField.evidenceSpanIds || [])])),
      state: flashField.state,
      reliability: {
        ...reliability,
        extractionConsistency,
        finalState
      }
    };
  }
  
  if (!sameValue) {
    if (flashField.state === 'candidate' && proField.state === 'not_present') {
      // CASE 6: Flash candidate + Pro not_present
      return {
        ...flashField,
        state: 'candidate', // keep the evidence-backed candidate
        reliability: {
          ...reliability,
          extractionConsistency,
          finalState
        }
      };
    }
    
    if (flashField.state === 'not_present' && proField.state === 'candidate') {
      // CASE 5: Flash not_present + Pro candidate
      return {
        ...proField,
        state: 'candidate', // pro found it
        reliability: {
          ...reliability,
          extractionConsistency,
          finalState
        }
      };
    }
    
    // CASE 3 & 4: Different values -> severe conflict
    return {
      ...flashField,
      value: null,
      sourceText: null,
      state: 'ambiguous',
      status: 'uncertain',
      evidenceSpanIds: [],
      reliability: {
        ...reliability,
        extractionConsistency,
        finalState
      }
    };
  }

  return flashField;
}
