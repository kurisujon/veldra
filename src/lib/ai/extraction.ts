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
import { getGroundedSchemaForType, type EvidenceField } from './schemas';
import { inspectDocument } from './document-inspector';
import { readDocumentText } from './ocr-reader';
import { validateEvidence } from './evidence-validator';
import { normalizeFields } from './normalization';
import {
  computeFieldConfidence,
  computeDocumentConfidence,
  isStructurallyValid,
} from './confidence';
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
    const prompt = getExtractionPrompt(input.documentType, ocrResult.fullText);
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

      // Validate with grounded Zod schema
      const groundedSchema = getGroundedSchemaForType(input.documentType);
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

  // ── Step 4: Convert to ExtractedField Records ────────────────────────────
  let fields: Record<string, ExtractedField> = {};
  for (const [fieldName, evidence] of Object.entries(parsedJson)) {
    if (fieldName === 'documentType') continue;

    fields[fieldName] = {
      value: evidence.value ?? null,
      sourceText: evidence.sourceText ?? null,
      page: evidence.page ?? null,
      confidence: evidence.confidence ?? null,
      status: evidence.status ?? 'uncertain',
      boundingBox: null,
    };
  }

  // ── Step 5: Evidence Validation ──────────────────────────────────────────
  const evidenceResult = validateEvidence(fields, ocrResult);
  fields = evidenceResult.fields;

  // ── Step 6: Normalization ────────────────────────────────────────────────
  fields = normalizeFields(fields, input.documentType);

  // ── Step 7: Confidence Scoring ───────────────────────────────────────────
  for (const [fieldName, field] of Object.entries(fields)) {
    if (field.value === null) continue;

    const confidence = computeFieldConfidence({
      ocrConfidence: ocrResult.averageConfidence,
      extractionConfidence: field.confidence,
      evidenceStatus: field.status,
      documentQuality: inspection.quality,
      structurallyValid: isStructurallyValid(fieldName, String(field.value)),
    });

    fields[fieldName] = { ...field, confidence };
  }

  const overallConfidence = computeDocumentConfidence(fields);

  // ── Step 8: Model Escalation (if needed) ─────────────────────────────────
  if (
    pipelineConfig.enableModelEscalation &&
    overallConfidence < pipelineConfig.escalationThreshold &&
    modelUsed !== pipelineConfig.escalationModel
  ) {
    // Log escalation decision (privacy-safe)
    console.info(
      `[Extraction] Escalating from ${modelUsed} to ${pipelineConfig.escalationModel}` +
        ` — confidence: ${overallConfidence.toFixed(2)}, threshold: ${pipelineConfig.escalationThreshold}`
    );

    // Re-run with the escalation model
    try {
      const escalatedResult = await extractDocumentGrounded(input, {
        ...pipelineConfig,
        enableModelEscalation: false, // Prevent recursive escalation
        primaryModel: pipelineConfig.escalationModel,
      });

      // Use escalated result only if it's better
      if (escalatedResult.overallConfidence > overallConfidence) {
        return escalatedResult;
      }
    } catch {
      // If escalation fails, use the original result
      console.warn(`[Extraction] Escalation failed, using original result`);
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
