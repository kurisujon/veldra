/**
 * Core types for the Veldra extraction pipeline.
 *
 * This module defines the foundational types used across the extraction system:
 * - Evidence-grounded field extraction
 * - Document inspection
 * - Pipeline error categorization
 * - Confidence scoring
 * - OCR integration
 */

// ---------------------------------------------------------------------------
// Bounding Box
// ---------------------------------------------------------------------------

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Evidence-Grounded Extracted Field
// ---------------------------------------------------------------------------

/**
 * Represents a single extracted field with full evidence traceability.
 * Every extracted value tracks its source text, location, and confidence.
 */
export interface ExtractedField<T = string | null> {
  /** The extracted value, or null if not found */
  value: T;
  /** The exact text from the document that this value was read from */
  sourceText: string | null;
  /** The page number where this value was found (1-indexed) */
  page: number | null;
  /** Extraction confidence score (0.0 - 1.0) */
  confidence: number | null;
  /** Evidence verification status */
  status: EvidenceStatus;
  /** Optional bounding box of the source text on the page */
  boundingBox: BoundingBox | null;
  /** 11.6-D Candidate State: candidate | not_present | unreadable | ambiguous */
  state?: string;
  /** 11.6-D Zero-Trust evidence span IDs */
  evidenceSpanIds?: string[];
  /** 11.6-G Field Reliability Metrics */
  reliability?: FieldReliability;
}

export type EvidenceStatus =
  | 'verified'    // Value found in OCR text with high confidence
  | 'uncertain'   // Value extracted but evidence is weak or ambiguous
  | 'missing'     // Field not present in document
  | 'unreadable'; // Field location identified but text is illegible

// ---------------------------------------------------------------------------
// Field Reliability & Dual Extraction (Phase 11.6-G)
// ---------------------------------------------------------------------------

export type ReliabilityDecision = 
  | 'ACCEPT'
  | 'ESCALATE_TO_PRO'
  | 'NEEDS_HUMAN_REVIEW'
  | 'REJECT';

export type EscalationStatus = 
  | 'none'
  | 'escalated'
  | 'escalation_failed';

export type ExtractionConsistency = 
  | 'single_model'
  | 'flash_pro_match'
  | 'flash_pro_conflict'
  | 'evidence_disagreement';

export interface FieldReliability {
  ocrConfidence: number | null;
  evidenceCoverage: 'complete' | 'partial' | 'missing';
  profileRisk: 'high' | 'medium' | 'low';
  deterministicValidation: 'pass' | 'fail';
  extractionConsistency: ExtractionConsistency;
  escalationStatus: EscalationStatus;
  finalState: ReliabilityDecision;
}

// ---------------------------------------------------------------------------
// Extraction Error Categories
// ---------------------------------------------------------------------------

/**
 * Categorized extraction errors enable precise debugging and appropriate retry behavior.
 */
export type ExtractionErrorCode =
  | 'UPLOAD_FAILED'
  | 'DOCUMENT_READ_FAILED'
  | 'OCR_FAILED'
  | 'OCR_PROVIDER_NOT_CONFIGURED'
  | 'GEMINI_REQUEST_FAILED'
  | 'GEMINI_RATE_LIMITED'
  | 'GEMINI_INVALID_RESPONSE'
  | 'GEMINI_FABRICATED_EVIDENCE'
  | 'SCHEMA_VALIDATION_FAILED'
  | 'EVIDENCE_VALIDATION_FAILED'
  | 'LOW_CONFIDENCE'
  | 'MANUAL_REVIEW_REQUIRED';

export class ExtractionError extends Error {
  readonly code: ExtractionErrorCode;
  readonly retryable: boolean;
  readonly details: string | null;

  constructor(
    code: ExtractionErrorCode,
    message: string,
    options?: { retryable?: boolean; details?: string; cause?: unknown }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ExtractionError';
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.details = options?.details ?? null;
  }
}

// ---------------------------------------------------------------------------
// Document Inspection
// ---------------------------------------------------------------------------

export type DocumentContentType =
  | 'native_text'    // PDF with selectable text
  | 'scanned'        // Scanned PDF (image-only)
  | 'mixed'          // PDF with some text and some scanned pages
  | 'image';         // Image file (JPEG, PNG)

export type DocumentQuality =
  | 'clear'     // High quality, easily readable
  | 'degraded'  // Some quality issues but mostly readable
  | 'poor';     // Significant quality issues, many uncertain fields expected

export interface DocumentInspection {
  contentType: DocumentContentType;
  quality: DocumentQuality;
  pageCount: number;
  hasNativeText: boolean;
  nativeTextLength: number;
  mimeType: string;
  fileSizeBytes: number;
}

// ---------------------------------------------------------------------------
// OCR Result (enhanced from src/lib/ocr/types.ts)
// ---------------------------------------------------------------------------

export interface OCRPage {
  pageNumber: number;
  text: string;
  width: number | null;
  height: number | null;
  blocks: OCRBlock[];
}

export interface OCRBlock {
  text: string;
  confidence: number | null;
  boundingBox: BoundingBox | null;
}

export interface OCRResult {
  success: boolean;
  engine: string;
  fullText: string;
  pages: OCRPage[];
  averageConfidence: number | null;
  processingDurationMs: number | null;
}

// ---------------------------------------------------------------------------
// Grounded Extraction Result
// ---------------------------------------------------------------------------

/**
 * The complete result of a grounded extraction, including the raw Gemini response,
 * validated fields with evidence, OCR text, and pipeline metadata.
 */
export interface GroundedExtractionResult {
  /** The extracted fields with evidence, keyed by field name */
  fields: Record<string, ExtractedField>;
  /** Document inspection metadata */
  inspection: DocumentInspection;
  /** OCR text used for evidence validation */
  ocrText: string;
  /** The raw Gemini JSON response */
  rawResponse: string;
  /** Which Gemini model was used */
  modelUsed: string;
  /** Total processing time in milliseconds */
  processingDurationMs: number;
  /** Number of fields that need manual review */
  uncertainFieldCount: number;
  /** Overall document confidence (0.0 - 1.0) */
  overallConfidence: number;
  /** Number of retry attempts used */
  retryCount: number;
  /** The document quality assessment */
  quality: DocumentQuality;
  /** 11.6-D Canonical Evidence Map */
  canonicalMap?: any;
}

// ---------------------------------------------------------------------------
// Pipeline Configuration
// ---------------------------------------------------------------------------

export interface ExtractionPipelineConfig {
  /** Maximum number of retry attempts across all API keys */
  maxRetries: number;
  /** Base delay for exponential backoff in milliseconds */
  baseRetryDelayMs: number;
  /** Confidence threshold below which fields are marked for review (0.0 - 1.0) */
  reviewThreshold: number;
  /** Confidence threshold below which fields are marked uncertain (0.0 - 1.0) */
  uncertainThreshold: number;
  /** Whether to attempt model escalation on low-confidence results */
  enableModelEscalation: boolean;
  /** The initial model to use for extraction */
  primaryModel: string;
  /** The escalation model for difficult documents */
  escalationModel: string;
  /** Overall confidence threshold below which escalation is triggered (0.0 - 1.0) */
  escalationThreshold: number;
}

export const DEFAULT_PIPELINE_CONFIG: ExtractionPipelineConfig = {
  maxRetries: 5,
  baseRetryDelayMs: 1000,
  reviewThreshold: 0.7,
  uncertainThreshold: 0.4,
  enableModelEscalation: process.env.DISABLE_AI_ESCALATION !== 'true',
  primaryModel: process.env.GEMINI_FLASH_MODEL || 'gemini-3.6-flash',
  escalationModel: process.env.GEMINI_PRO_MODEL || 'gemini-3.1-pro',
  escalationThreshold: 0.5,
};

// ---------------------------------------------------------------------------
// Pipeline Logging (privacy-safe)
// ---------------------------------------------------------------------------

/**
 * Structured log entry for pipeline observability.
 * NEVER includes full document contents, OCR text, names, dates, or registry numbers.
 */
export interface ExtractionLogEntry {
  documentId: string;
  documentType: string;
  processingDurationMs: number;
  pageCount: number;
  ocrDurationMs: number | null;
  extractionDurationMs: number | null;
  modelUsed: string;
  retryCount: number;
  validationResult: 'success' | 'partial' | 'failed';
  totalFields: number;
  verifiedFields: number;
  uncertainFields: number;
  missingFields: number;
  overallConfidence: number;
  contentType: DocumentContentType;
  quality: DocumentQuality;
}

// ---------------------------------------------------------------------------
// Field Flattening (for database persistence)
// ---------------------------------------------------------------------------

/**
 * A flattened field ready for insertion into the document_fields table.
 */
export interface FlattenedField {
  field_name: string;
  raw_value: string | null;
  normalized_value: string | null;
  source_text: string | null;
  page_number: number | null;
  bounding_box: BoundingBox | null;
  confidence_score: number | null;
  ocr_confidence: number | null;
  evidence_status: EvidenceStatus;
  state?: string;
  evidenceSpanIds?: string[];
}
