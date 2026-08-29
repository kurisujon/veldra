/**
 * Grounded Document Extraction Pipeline.
 *
 * Implements the upgraded extraction architecture:
 *
 * PDF → Document Inspection → OCR/Text Reading → Gemini Structured Extraction
 * → Zod Validation → Evidence Validation → Normalization → Confidence Scoring
 * → GroundedExtractionResult
 *
 * Key principle: "reading the document" is separated from
 * "understanding which text belongs to which field."
 */

import {
  getGeminiClient,
  getFlashModel,
  getProModel,
  getGeminiApiKeysCount,
  isRateLimitError,
  isTransientError,
} from './gemini';
import { getExtractionPrompt } from './prompts';
import { Registry, buildProfilePrompt } from '../extraction/profiles';
import { getGroundedSchemaForType, type EvidenceField } from './schemas';
import { EvidenceMap } from "../extraction/evidence/EvidenceMap";
import { CanonicalEvidenceMap } from "../extraction/ocr/types";
import { inspectDocument } from './document-inspector';
import { readDocumentText } from './ocr-reader';
import { validateEvidence } from './evidence-validator';
import { normalizeFields } from './normalization';
import {
  computeFieldConfidence,
  computeDocumentConfidence,
  isStructurallyValid,
  evaluateFieldReliability
} from './confidence';
import { resolveConflict } from './dual-extraction';
import {
  ExtractionError,
  DEFAULT_PIPELINE_CONFIG,
  type ExtractedField,
  type GroundedExtractionResult,
  type ExtractionPipelineConfig,
  type ExtractionLogEntry,
  type OCRResult,
  type DocumentInspection,
} from './types';

// Also re-export legacy types for backward compatibility
import {
  BirthCertificateSchema,
  MarriageCertificateSchema,
  TorSchema,
  Sf10Schema,
  DiplomaSchema,
  BankStatementSchema,
  ProofOfBillingSchema,
  type ExtractedDocumentData,
} from './schemas';

// ---------------------------------------------------------------------------
// Input/Output Types
// ---------------------------------------------------------------------------

interface ExtractionInput {
  documentId: string;
  caseId: string;
  documentType: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
}

/**
 * Legacy extraction result for backward compatibility.
 * Used by existing callers that expect the old format.
 */
interface ExtractionResult {
  rawResponse: string;
  normalizedJson: ExtractedDocumentData;
  modelUsed: string;
}

// ---------------------------------------------------------------------------
// Legacy Schema Resolver (kept for backward compatibility)
// ---------------------------------------------------------------------------

function getSchemaForType(documentType: string) {
  const type = documentType.toLowerCase();
  if (type.includes('birth') || type === 'psabirth') return BirthCertificateSchema;
  if (type.includes('marriage') || type === 'psamarriage') return MarriageCertificateSchema;
  if (type.includes('tor') || type.includes('transcript') || type === 'tor') return TorSchema;
  if (type === 'sf10' || type.includes('sf10')) return Sf10Schema;
  if (type.includes('diploma') || type === 'diploma') return DiplomaSchema;
  if (type.includes('bank') || type === 'bankstatement') return BankStatementSchema;
  if (type.includes('billing') || type === 'proofofbilling') return ProofOfBillingSchema;
  throw new Error(`No schema defined for document type: ${documentType}`);
}

// ---------------------------------------------------------------------------
// Main Grounded Extraction Pipeline
// ---------------------------------------------------------------------------

/**
 * The upgraded extraction pipeline with evidence grounding.
 *
 * 1. Inspects the document to determine content type and quality
 * 2. Extracts raw text via OCR (pdf-parse or Gemini)
 * 3. Sends document + OCR context to Gemini for structured extraction
 * 4. Validates response against grounded Zod schemas
 * 5. Cross-references extracted values against OCR text
 * 6. Normalizes field values (dates, names)
 * 7. Computes multi-signal confidence scores
 * 8. Returns evidence-grounded result
 */
export async function extractDocumentGrounded(
  input: ExtractionInput,
  config: Partial<ExtractionPipelineConfig> = {}
): Promise<GroundedExtractionResult> {
  const pipelineConfig = { ...DEFAULT_PIPELINE_CONFIG, ...config };
  const pipelineStart = Date.now();
  let retryCount = 0;

  // ── Step 1: Document Inspection ──────────────────────────────────────────
  const inspection = await inspectDocument(input.fileBuffer, input.mimeType);

  // ── Step 2: OCR / Text Reading ───────────────────────────────────────────
  let ocrResult: OCRResult;
  const ocrStart = Date.now();
  try {
    ocrResult = await readDocumentText(
      input.fileBuffer,
      input.mimeType,
      inspection
    );
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError(
      'OCR_FAILED',
      `OCR failed: ${error instanceof Error ? error.message : String(error)}`,
      { retryable: false, cause: error }
    );
  }
  const ocrDurationMs = Date.now() - ocrStart;

  // ── 11.6-D Bridging: Convert legacy OCR to CanonicalEvidenceMap ────────
  // This satisfies the new Zero-Trust architecture while preserving legacy OCR.

  const canonicalMap: CanonicalEvidenceMap = {
    fullText: ocrResult.fullText,
    pages: [{
      pageNumber: 1,
      width: 1000,
      height: 1000,
      blocks: ocrResult.fullText.split('\n').filter(l => l.trim()).map((line, i) => ({
        id: `span_${i}`,
        text: line,
        normalizedText: line.trim().toLowerCase(),
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
        confidence: ocrResult.averageConfidence ?? 0.9,
        type: 'line'
      }))
    }],
    averageConfidence: ocrResult.averageConfidence ?? 0.9,
    provider: ocrResult.engine,
    processingDurationMs: ocrResult.processingDurationMs ?? 0
  };

  const evidenceMap = EvidenceMap.fromCanonicalProviderMap(input.documentId, canonicalMap, [input.documentId]);
  const evidenceContext = evidenceMap.getAllSpans().map(s => 
    `SPAN_ID: ${s.id}\nPAGE: ${s.pageId}\nTYPE: ${s.blockType}\nTEXT: ${s.text}\nOCR_CONFIDENCE: ${(s.ocrConfidence ?? 0.9).toFixed(2)}\n`
  ).join('\n');

  // ── Step 3: Gemini Structured Extraction with Evidence ───────────────────
  let rawResponse = '';
  let modelUsed = pipelineConfig.primaryModel;
  let parsedJson: Record<string, EvidenceField> = {};
  let extractionDurationMs: number | null = null;

  const extractionAttempt = async (
    model: string,
    attempt: number
  ): Promise<void> => {
    const extractionStart = Date.now();
    const client = getGeminiClient(attempt);
    // 11.6-F: Use Document Profile Registry to build the prompt
    const profile = Registry.getProfile(input.documentType);
    if (!profile) {
      throw new Error(`Unknown document type: ${input.documentType}`);
    }
    const prompt = buildProfilePrompt(profile, evidenceContext);
    const base64Data = input.fileBuffer.toString('base64');

    try {
      const response = await client.models.generateContent({
        model: model,
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: input.mimeType,
            },
          },
          prompt,
        ],
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      rawResponse = response.text || '{}';
      modelUsed = model;
      extractionDurationMs = Date.now() - extractionStart;

      // Clean markdown formatting
      const cleanJson = rawResponse
        .replace(/^```json\s*/i, '')
        .replace(/```$/, '')
        .trim();

      // Parse JSON
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(cleanJson) as Record<string, unknown>;
      } catch (parseError) {
        throw new ExtractionError(
          'GEMINI_INVALID_RESPONSE',
          `Failed to parse Gemini JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          { retryable: true, cause: parseError }
        );
      }

      // Validate with zero-trust grounded Zod schema (now returning CandidateField)
      const profileSchema = Registry.getProfile(input.documentType)?.schema;
      if (!profileSchema) throw new Error(`Unknown document type: ${input.documentType}`);
      const groundedSchema = profileSchema;
      try {
        parsedJson = groundedSchema.parse(parsed) as Record<string, EvidenceField>;
      } catch (zodError) {
        throw new ExtractionError(
          'SCHEMA_VALIDATION_FAILED',
          `Zod validation failed: ${zodError instanceof Error ? zodError.message : String(zodError)}`,
          { retryable: true, cause: zodError }
        );
      }
    } catch (error) {
      if (error instanceof ExtractionError) throw error;

      // Classify error for appropriate retry behavior
      if (isRateLimitError(error)) {
        throw new ExtractionError(
          'GEMINI_RATE_LIMITED',
          `Rate limited on attempt ${attempt + 1}`,
          { retryable: true, cause: error }
        );
      }
      if (isTransientError(error)) {
        throw new ExtractionError(
          'GEMINI_REQUEST_FAILED',
          `Gemini request failed: ${error instanceof Error ? error.message : String(error)}`,
          { retryable: true, cause: error }
        );
      }
      throw new ExtractionError(
        'GEMINI_REQUEST_FAILED',
        `Gemini extraction failed: ${error instanceof Error ? error.message : String(error)}`,
        { retryable: false, cause: error }
      );
    }
  };

  // Retry with key rotation and exponential backoff
  const apiKeysCount = getGeminiApiKeysCount();
  const maxAttempts = Math.min(pipelineConfig.maxRetries, apiKeysCount * 2);
  let lastError: ExtractionError | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await extractionAttempt(modelUsed, attempt);
      retryCount = attempt;
      lastError = null;
      break;
    } catch (error) {
      if (error instanceof ExtractionError) {
        lastError = error;
        if (!error.retryable || attempt >= maxAttempts - 1) {
          break;
        }
        // Exponential backoff
        const delay = pipelineConfig.baseRetryDelayMs * Math.pow(2, attempt);
        await sleep(Math.min(delay, 30000)); // Cap at 30s
        retryCount = attempt + 1;
        continue;
      }
      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

    // ── Step 4: Convert CandidateField to Legacy ExtractedField ────────────
  // This maps the 11.6-D zero-trust state back to the legacy state machine
  // so `validateEvidence` and downstream systems continue working.
  let fields: Record<string, ExtractedField> = {};
  for (const [fieldName, evidence] of Object.entries(parsedJson)) {
    if (fieldName === 'documentType') continue;

    // 11.6-D Step 7: Candidate Validation
    const spanIds = evidence.evidenceSpanIds || [];
    
    // Validate that every returned span actually exists in the canonical map
    for (const spanId of spanIds) {
      if (!evidenceMap.hasSpan(spanId)) {
        throw new ExtractionError(
          'GEMINI_FABRICATED_EVIDENCE',
          `AI returned fabricated span ID: ${spanId}. This violates Zero-Trust constraints.`,
          { retryable: true }
        );
      }
    }

    // Enforce state logic correctly
    if (evidence.state === 'not_present' && spanIds.length > 0) {
      throw new ExtractionError(
        'GEMINI_INVALID_RESPONSE',
        `AI returned state 'not_present' but supplied evidence spans.`,
        { retryable: true }
      );
    }
    
    if (evidence.state === 'candidate' && spanIds.length === 0) {
      throw new ExtractionError(
        'GEMINI_INVALID_RESPONSE',
        `AI returned state 'candidate' but supplied zero evidence spans.`,
        { retryable: true }
      );
    }

    // Resolve exactly the spans Gemini referenced
    const resolvedText = evidenceMap.getTextForSpans(spanIds);

    // Translate zero-trust 'state' to legacy 'status'
    let legacyStatus: 'verified' | 'uncertain' | 'missing' | 'unreadable' = 'uncertain';
    if (evidence.state === 'candidate') legacyStatus = 'verified'; // We assume verified until Validator catches it
    else if (evidence.state === 'not_present') legacyStatus = 'missing';
    else if (evidence.state === 'unreadable') legacyStatus = 'unreadable';
    else legacyStatus = 'uncertain';

    fields[fieldName] = {
      value: evidence.value ?? null,
      sourceText: resolvedText.length > 0 ? resolvedText : null,
      page: 1, // Currently mocked via our shim above
      confidence: legacyStatus === 'verified' ? 0.95 : null,
      status: legacyStatus,
      boundingBox: null,
      state: evidence.state,
      evidenceSpanIds: evidence.evidenceSpanIds || [],
    };
  }

  // ── Step 5: Deterministic Evidence Validation ────────────────────────────
  // Pass the Canonical Evidence Map to the Phase 11.6-E Evidence Validator.
  const evidenceResult = validateEvidence(fields, evidenceMap, input.documentId);
  
  // Apply deterministic validation results back to fields
  fields = evidenceResult.fields;

  // ── Step 6: Normalization ────────────────────────────────────────────────
  fields = normalizeFields(fields, input.documentType);

  // ── Step 7: Reliability Scoring (Phase 11.6-G) ──────────────────────────
  
  const escalatedFields: string[] = [];
  const profile = Registry.getProfile(input.documentType);

  for (const [fieldName, field] of Object.entries(fields)) {
    // Keep legacy confidence for compatibility, but also evaluate reliability
    const legacyConf = computeFieldConfidence({
      ocrConfidence: ocrResult.averageConfidence,
      extractionConfidence: field.confidence,
      evidenceStatus: field.status,
      documentQuality: inspection.quality,
      structurallyValid: isStructurallyValid(fieldName, String(field.value)),
    });
    
    let reliability = undefined;
    if (profile) {
      const fieldDef = profile.fields[fieldName];
      if (fieldDef) {
        reliability = evaluateFieldReliability({
          ocrConfidence: ocrResult.averageConfidence, // Fallback to doc avg if span not available
          evidenceStatus: field.status,
          profileRisk: fieldDef.risk,
          structurallyValid: isStructurallyValid(fieldName, String(field.value)),
          state: field.state,
          hasSpanIds: (field.evidenceSpanIds || []).length > 0,
          requiredField: fieldDef.required
        });

        if (reliability.finalState === 'ESCALATE_TO_PRO') {
          escalatedFields.push(fieldName);
        }
      }
    }

    fields[fieldName] = { ...field, confidence: legacyConf, reliability };
  }

  const overallConfidence = computeDocumentConfidence(fields);

  // ── Step 8: Targeted Dual Extraction (Phase 11.6-G) ─────────────────────
  if (
    pipelineConfig.enableModelEscalation &&
    escalatedFields.length > 0 &&
    modelUsed !== pipelineConfig.escalationModel
  ) {
    console.info(
      `[Extraction] Escalating ${escalatedFields.length} fields to ${pipelineConfig.escalationModel}`
    );

    // Build a targeted subset schema for Pro
    const escalatedSchemaObj: any = {};
    if (profile) {
      for (const field of escalatedFields) {
        escalatedSchemaObj[field] = profile.schema.shape[field];
      }
    }
    
    if (Object.keys(escalatedSchemaObj).length > 0) {
      // Create a temporary profile just for this escalation
      const targetedProfile = {
        ...profile!,
        schema: (profile!.schema as any).pick(escalatedSchemaObj) // naive pick
      };
      
      const proPrompt = buildProfilePrompt(targetedProfile as any, evidenceContext);
      
      try {
        const client = getGeminiClient(0); // For now, attempt 0
        const response = await client.models.generateContent({
          model: pipelineConfig.escalationModel,
          contents: [
            { inlineData: { data: input.fileBuffer.toString('base64'), mimeType: input.mimeType } },
            proPrompt,
          ],
          config: { temperature: 0.1, responseMimeType: 'application/json' },
        });

        const cleanJson = (response.text || '{}').replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        const proParsed = JSON.parse(cleanJson);
        const proValidated = (targetedProfile.schema as any).parse(proParsed) as Record<string, EvidenceField>;

        // Translate Pro outputs exactly like Flash
        let proFields: Record<string, ExtractedField> = {};
        for (const [fName, evidence] of Object.entries(proValidated)) {
          if (fName === 'documentType') continue;
          
          const spanIds = evidence.evidenceSpanIds || [];
          for (const spanId of spanIds) {
            if (!evidenceMap.hasSpan(spanId)) {
               throw new ExtractionError('GEMINI_FABRICATED_EVIDENCE', 'Pro fabricated evidence');
            }
          }
          const resolvedText = evidenceMap.getTextForSpans(spanIds);
          let legacyStatus: any = 'uncertain';
          if (evidence.state === 'candidate') legacyStatus = 'verified';
          else if (evidence.state === 'not_present') legacyStatus = 'missing';
          else if (evidence.state === 'unreadable') legacyStatus = 'unreadable';

          proFields[fName] = {
            value: evidence.value ?? null,
            sourceText: resolvedText.length > 0 ? resolvedText : null,
            page: 1,
            confidence: legacyStatus === 'verified' ? 0.95 : null,
            status: legacyStatus,
            boundingBox: null,
            state: evidence.state,
            evidenceSpanIds: spanIds,
          };
        }

        // Validate Pro evidence
        proFields = validateEvidence(proFields, evidenceMap, input.documentId).fields;
        proFields = normalizeFields(proFields, input.documentType);

        // Resolve conflicts
        for (const fName of escalatedFields) {
          if (proFields[fName]) {
             const flashField = fields[fName];
             const proField = proFields[fName];
             const updatedField = resolveConflict(flashField, proField, flashField.reliability!);
             fields[fName] = updatedField;
          }
        }
      } catch (err) {
        console.warn(`[Extraction] Pro escalation failed for fields:`, err);
        // Fallback to flash by doing nothing, update reliability to failed
        for (const fName of escalatedFields) {
          if (fields[fName].reliability) {
            fields[fName].reliability!.escalationStatus = 'escalation_failed';
          }
        }
      }
    }
  }

  // ── Step 9: Build Result ─────────────────────────────────────────────────
  const uncertainFieldCount = Object.values(fields).filter(
    f => f.status === 'uncertain' || f.status === 'unreadable'
  ).length;

  const processingDurationMs = Date.now() - pipelineStart;

  // Privacy-safe structured logging
  const logEntry: ExtractionLogEntry = {
    documentId: input.documentId,
    documentType: input.documentType,
    processingDurationMs,
    pageCount: inspection.pageCount,
    ocrDurationMs,
    extractionDurationMs,
    modelUsed,
    retryCount,
    validationResult: uncertainFieldCount === 0 ? 'success' :
      uncertainFieldCount <= 3 ? 'partial' : 'failed',
    totalFields: Object.keys(fields).length,
    verifiedFields: Object.values(fields).filter(f => f.status === 'verified').length,
    uncertainFields: uncertainFieldCount,
    missingFields: Object.values(fields).filter(f => f.status === 'missing').length,
    overallConfidence,
    contentType: inspection.contentType,
    quality: inspection.quality,
  };
  console.info(`[Extraction] Complete:`, JSON.stringify(logEntry));

  return {
    fields,
    inspection,
    ocrText: ocrResult.fullText,
    rawResponse,
    modelUsed,
    processingDurationMs,
    uncertainFieldCount,
    overallConfidence,
    retryCount,
    quality: inspection.quality,
  };
}

// ---------------------------------------------------------------------------
// Legacy API (backward compatible)
// ---------------------------------------------------------------------------

/**
 * Legacy extraction function preserved for backward compatibility.
 * New code should use extractDocumentGrounded() instead.
 *
 * @deprecated Use extractDocumentGrounded for evidence-grounded extraction
 */
export async function extractDocumentWithAI(
  input: ExtractionInput,
  attempt: number = 0
): Promise<ExtractionResult> {
  // Use the grounded pipeline and convert to legacy format
  const grounded = await extractDocumentGrounded(input);

  // Convert grounded fields back to flat values for legacy consumers
  const flatJson: Record<string, unknown> = {};
  flatJson['documentType'] = input.documentType;

  for (const [fieldName, field] of Object.entries(grounded.fields)) {
    flatJson[fieldName] = field.value;
  }

  // Validate with legacy schema
  const schema = getSchemaForType(input.documentType);
  const validatedJson = schema.parse(flatJson);

  return {
    rawResponse: grounded.rawResponse,
    normalizedJson: validatedJson,
    modelUsed: grounded.modelUsed,
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
