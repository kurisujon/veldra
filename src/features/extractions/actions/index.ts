'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { extractDocumentGrounded } from '@/lib/ai/extraction'
import { ExtractionError } from '@/lib/ai/types'
import type { FlattenedField, GroundedExtractionResult, EvidenceStatus } from '@/lib/ai/types'
import type { ExtractedField } from '@/lib/ai/types'

export async function getExtractionsByCaseId(caseId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_extractions')
    .select('id, document_id, status, review_status')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch extractions for case:', error)
    return []
  }

  // Group by document_id and keep only the latest one per document
  const latestExtractions = new Map<string, { id: string; document_id: string; status: string; review_status: string }>()
  for (const ext of data) {
    if (!latestExtractions.has(ext.document_id)) {
      latestExtractions.set(ext.document_id, ext)
    }
  }

  return Array.from(latestExtractions.values())
}

export async function getExtractionByDocumentId(documentId: string) {
  const supabase = await createClient()
  
  // Get the latest extraction
  const { data: extraction, error: extError } = await supabase
    .from('document_extractions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (extError && extError.code !== 'PGRST116') { // PGRST116 is no rows returned
    throw new Error(`Failed to fetch extraction: ${extError.message}`)
  }

  if (!extraction) return null

  // Get the fields
  const { data: fields, error: fieldError } = await supabase
    .from('document_fields')
    .select('*')
    .eq('document_extraction_id', extraction.id)
    .order('created_at', { ascending: true })

  if (fieldError) {
    throw new Error(`Failed to fetch fields: ${fieldError.message}`)
  }

  return {
    ...extraction,
    fields: fields || []
  }
}

const UpdateFieldSchema = z.object({
  fieldId: z.string().uuid(),
  action: z.enum(['accept', 'reject', 'correct']),
  correctedValue: z.string().nullable().optional(),
  path: z.string()
})

export async function updateDocumentField(params: z.infer<typeof UpdateFieldSchema>) {
  const parsed = UpdateFieldSchema.safeParse(params)
  if (!parsed.success) throw new Error('Invalid field update payload')

  const { fieldId, action, correctedValue, path } = parsed.data
  const supabase = await createClient()

  // The RPC will enforce authentication and authorization securely.
  const { error } = await supabase.rpc('verify_document_field', {
    p_field_id: fieldId,
    p_action: action,
    p_corrected_value: correctedValue || null
  })

  if (error) throw new Error((error instanceof Error ? error.message : String(error)))

  revalidatePath(path)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Field Flattening (grounded → database)
// ---------------------------------------------------------------------------

/**
 * Converts grounded extraction fields into flattened rows for document_fields.
 *
 * Each field now carries:
 * - raw_value: the original extracted value (preserved for audit)
 * - normalized_value: the normalized form for comparison
 * - source_text: the OCR text this was extracted from
 * - page_number: where on the document this was found
 * - bounding_box: location on page
 * - confidence_score: unified confidence score
 * - ocr_confidence: OCR-level confidence
 * - evidence_status: verification status of evidence
 */
function flattenGroundedFields(
  fields: Record<string, ExtractedField>,
  _ocrAverageConfidence: number | null
): FlattenedField[] {
  const flattened: FlattenedField[] = []

  for (const [fieldName, field] of Object.entries(fields)) {
    let rawValue: string | null = null
    let normalizedValue: string | null = null

    if (field.value === null || field.value === undefined) {
      rawValue = null
      normalizedValue = null
    } else if (typeof field.value === 'string' && field.value.startsWith('[')) {
      // Array values (e.g., academicEntries) — serialize as JSON
      rawValue = field.value
      normalizedValue = field.value
    } else {
      // For non-array fields:
      // raw_value = the sourceText (what was actually read from document)
      // normalized_value = the processed value (after normalization)
      rawValue = field.sourceText ?? String(field.value)
      normalizedValue = String(field.value)
    }

    flattened.push({
      field_name: fieldName,
      raw_value: rawValue,
      normalized_value: normalizedValue,
      source_text: field.sourceText,
      page_number: field.page,
      bounding_box: field.boundingBox,
      confidence_score: field.confidence,
      ocr_confidence: _ocrAverageConfidence,
      evidence_status: field.status,
    })
  }

  return flattened
}

/**
 * Legacy flattener for backward compatibility.
 * Used when extraction produces old-style flat JSON.
 */
function flattenDocumentFields(normalizedJson: Record<string, unknown>): FlattenedField[] {
  const fields: FlattenedField[] = []

  for (const [key, value] of Object.entries(normalizedJson)) {
    if (key === 'documentType') continue

    let stringValue: string | null = null
    if (value === null || value === undefined) {
      stringValue = null
    } else if (Array.isArray(value)) {
      stringValue = JSON.stringify(value)
    } else if (typeof value === 'object') {
      stringValue = JSON.stringify(value)
    } else {
      stringValue = String(value)
    }

    fields.push({
      field_name: key,
      raw_value: stringValue,
      normalized_value: stringValue,
      source_text: null,
      page_number: null,
      bounding_box: null,
      confidence_score: null,
      ocr_confidence: null,
      evidence_status: 'uncertain' as EvidenceStatus,
    })
  }

  return fields
}

// ---------------------------------------------------------------------------
// Error Classification
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable error category for the UI.
 */
function classifyExtractionError(error: unknown): string {
  if (error instanceof ExtractionError) {
    switch (error.code) {
      case 'UPLOAD_FAILED':
        return `Upload Error: ${error.message}`
      case 'DOCUMENT_READ_FAILED':
        return `Document Read Error: ${error.message}`
      case 'OCR_FAILED':
        return `OCR Error: ${error.message}`
      case 'GEMINI_REQUEST_FAILED':
        return `AI Service Error: ${error.message}`
      case 'GEMINI_RATE_LIMITED':
        return `Rate Limit Exceeded: ${error.message}`
      case 'GEMINI_INVALID_RESPONSE':
        return `Invalid AI Response: ${error.message}`
      case 'SCHEMA_VALIDATION_FAILED':
        return `Schema Validation Error: ${error.message}`
      case 'EVIDENCE_VALIDATION_FAILED':
        return `Evidence Validation Error: ${error.message}`
      case 'LOW_CONFIDENCE':
        return `Low Confidence: ${error.message}`
      case 'MANUAL_REVIEW_REQUIRED':
        return `Manual Review Required: ${error.message}`
      default:
        return `Extraction Error: ${error.message}`
    }
  }
  return `Extraction Failed: ${error instanceof Error ? error.message : String(error)}`
}

// ---------------------------------------------------------------------------
// Main Extraction Action
// ---------------------------------------------------------------------------

export async function runExtraction(documentId: string, caseId: string, documentType: string) {
  const supabase = await createClient()

  // 1. Fetch document metadata to get file_path
  const { data: docMetadata, error: docError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', documentId)
    .single()

  if (docError || !docMetadata) {
    return { success: false, error: `Failed to fetch document metadata: ${docError?.message}` }
  }

  // 2. Download the file from Supabase storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('documents')
    .download(docMetadata.file_path)

  if (downloadError || !fileData) {
    return { success: false, error: `Failed to download document: ${downloadError?.message}` }
  }

  // 3. Convert Blob to Buffer and determine MIME type
  const arrayBuffer = await fileData.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = fileData.type
  const fileName = docMetadata.file_path.split('/').pop() || 'document'

  // 4. Run grounded extraction pipeline
  let groundedResult: GroundedExtractionResult | null = null
  let flattenedFields: FlattenedField[] = []

  try {
    groundedResult = await extractDocumentGrounded({
      documentId,
      caseId,
      documentType,
      fileBuffer: buffer,
      mimeType,
      fileName,
    })

    flattenedFields = flattenGroundedFields(
      groundedResult.fields,
      groundedResult.ocrText ? 0.85 : null
    )
  } catch (extractionError: unknown) {
    const errorMessage = classifyExtractionError(extractionError)
    console.error(`[Extraction] Failed for document ${documentId}:`, errorMessage)

    // Create or update extraction record with status: Failed
    const { data: existingExt } = await supabase
      .from('document_extractions')
      .select('id')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingExt) {
      await supabase
        .from('document_extractions')
        .update({
          status: 'Failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingExt.id)
    } else {
      await supabase.from('document_extractions').insert({
        case_id: caseId,
        document_id: documentId,
        document_type: documentType,
        status: 'Failed',
        error_message: errorMessage,
      })
    }

    revalidatePath(`/cases/${caseId}/documents/${documentId}`)
    return { success: false, error: `Extraction Failed: ${errorMessage}` }
  }

  // 5. Determine extraction status based on confidence
  const hasUncertainFields = groundedResult.uncertainFieldCount > 0
  const status: 'NeedsReview' = 'NeedsReview' // Always NeedsReview for human verification

  // 6. Insert/update the document_extractions record
  let extractionId: string
  const { data: existingExt } = await supabase
    .from('document_extractions')
    .select('id')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const extractionRecord = {
    status: status,
    raw_text: groundedResult.rawResponse,
    extraction_method: groundedResult.modelUsed,
    review_status: 'Unreviewed' as const,
    error_message: null,
    confidence_score: groundedResult.overallConfidence,
    ocr_text: groundedResult.ocrText.substring(0, 50000), // Limit OCR text storage
    page_count: groundedResult.inspection.pageCount,
    document_quality: groundedResult.quality,
    model_used: groundedResult.modelUsed,
    processing_duration_ms: groundedResult.processingDurationMs,
    ocr_engine: groundedResult.inspection.hasNativeText ? 'pdf-parse' : 'gemini-ocr',
    retry_count: groundedResult.retryCount,
    uncertain_field_count: groundedResult.uncertainFieldCount,
    updated_at: new Date().toISOString(),
  }

  if (existingExt) {
    extractionId = existingExt.id
    const { error: updateError } = await supabase
      .from('document_extractions')
      .update(extractionRecord)
      .eq('id', extractionId)

    if (updateError) throw new Error(updateError.message)

    // Delete existing fields to overwrite them
    const { error: deleteFieldsError } = await supabase
      .from('document_fields')
      .delete()
      .eq('document_extraction_id', extractionId)

    if (deleteFieldsError) throw new Error(deleteFieldsError.message)
  } else {
    const { data: newExt, error: insertError } = await supabase
      .from('document_extractions')
      .insert({
        case_id: caseId,
        document_id: documentId,
        document_type: documentType,
        ...extractionRecord,
      })
      .select('id')
      .single()

    if (insertError) throw new Error(insertError.message)
    extractionId = newExt.id
  }

  // 7. Persist Canonical Evidence Map
  if (groundedResult.canonicalMap) {
    const { persistCanonicalEvidence } = await import('@/lib/extraction/evidence/persistence');
    try {
      await persistCanonicalEvidence(supabase as any, extractionId, groundedResult.canonicalMap);
    } catch (err) {
      console.warn('Failed to persist canonical evidence, continuing without it:', err);
    }
  }

  // 8. Insert the extracted fields with evidence metadata
  const fieldsToInsert = flattenedFields.map((f) => ({
    case_id: caseId,
    document_id: documentId,
    document_extraction_id: extractionId,
    field_name: f.field_name,
    raw_value: f.raw_value,
    normalized_value: f.normalized_value,
    source_text: f.source_text,
    page_number: f.page_number,
    bounding_box: f.bounding_box ? JSON.stringify(f.bounding_box) : null,
    confidence_score: f.confidence_score,
    ocr_confidence: f.ocr_confidence,
    evidence_status: f.evidence_status,
    state: f.state || 'candidate',
    status: f.evidence_status === 'verified' && f.confidence_score !== null && f.confidence_score >= 0.85
      ? 'NeedsReview' as const   // Even verified fields need human review
      : 'NeedsReview' as const,  // All fields start as NeedsReview
  }))

  const { data: insertedFields, error: fieldError } = await supabase
    .from('document_fields')
    .insert(fieldsToInsert as any)
    .select('id, field_name')

  if (fieldError) throw new Error(fieldError.message)

  // 9. Insert field_evidence tracking
  if (insertedFields) {
    const fieldEvidenceToInsert: any[] = [];
    for (const insertedField of insertedFields) {
       const flatField = flattenedFields.find(ff => ff.field_name === insertedField.field_name);
       if (flatField && flatField.evidenceSpanIds && flatField.state === 'candidate') {
         for (const spanId of flatField.evidenceSpanIds) {
           fieldEvidenceToInsert.push({
             document_field_id: insertedField.id,
             ocr_span_id: spanId,
             evidence_role: 'value'
           });
         }
       }
    }
    
    if (fieldEvidenceToInsert.length > 0) {
      const { error: evidenceError } = await (supabase as any)
        .from('field_evidence')
        .insert(fieldEvidenceToInsert);
        
      if (evidenceError) {
        console.warn('Failed to insert field_evidence:', evidenceError);
      }
    }
  }

  revalidatePath(`/cases/${caseId}/documents/${documentId}`)
  return { success: true }
}
