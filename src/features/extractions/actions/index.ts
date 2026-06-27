'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { extractDocumentWithAI } from '@/lib/ai/extraction'

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
  reviewedValue: z.string().nullable(),
  status: z.enum(['NeedsReview', 'Accepted', 'Corrected', 'Rejected']),
  path: z.string()
})

export async function updateDocumentField(params: z.infer<typeof UpdateFieldSchema>) {
  const parsed = UpdateFieldSchema.safeParse(params)
  if (!parsed.success) throw new Error('Invalid field update payload')

  const { fieldId, reviewedValue, status, path } = parsed.data
  const supabase = await createClient()

  // In real implementation we should get user id
  const { data: auth } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('document_fields')
    .update({
      reviewed_value: reviewedValue,
      status: status,
      reviewed_by: auth.user?.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', fieldId)

  if (error) throw new Error(error.message)

  revalidatePath(path)
  return { success: true }
}

function flattenDocumentFields(normalizedJson: Record<string, unknown>) {
  const fields: Array<{ field_name: string; raw_value: string | null; normalized_value: string | null }> = [];

  for (const [key, value] of Object.entries(normalizedJson)) {
    if (key === 'documentType') continue;

    let stringValue: string | null = null;
    if (value === null || value === undefined) {
      stringValue = null;
    } else if (Array.isArray(value)) {
      stringValue = JSON.stringify(value);
    } else if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }

    fields.push({
      field_name: key,
      raw_value: stringValue,
      normalized_value: stringValue,
    });
  }

  return fields;
}

export async function runExtraction(documentId: string, caseId: string, documentType: string) {
  const supabase = await createClient()

  // 1. Fetch document metadata to get file_path
  const { data: docMetadata, error: docError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', documentId)
    .single()

  if (docError || !docMetadata) {
    throw new Error(`Failed to fetch document metadata: ${docError?.message}`)
  }

  // 2. Download the file from Supabase storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('documents')
    .download(docMetadata.file_path)

  if (downloadError || !fileData) {
    throw new Error(`Failed to download document for OCR: ${downloadError?.message}`)
  }

  // 3. Convert Blob to Buffer and determine MIME type
  const arrayBuffer = await fileData.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = fileData.type
  const fileName = docMetadata.file_path.split('/').pop() || 'document'

  // 4. Run Gemini document extraction
  let rawResponse = ''
  let modelUsed = ''
  let normalizedJson: Record<string, unknown> = {}

  try {
    const result = await extractDocumentWithAI({
      documentId,
      caseId,
      documentType,
      fileBuffer: buffer,
      mimeType,
      fileName,
    })
    rawResponse = result.rawResponse
    modelUsed = result.modelUsed
    normalizedJson = result.normalizedJson as Record<string, unknown>
  } catch (extractionError: any) {
    console.error(`Gemini Document Extraction Failed:`, extractionError)

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
          error_message: extractionError.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingExt.id)
    } else {
      await supabase.from('document_extractions').insert({
        case_id: caseId,
        document_id: documentId,
        document_type: documentType,
        status: 'Failed',
        error_message: extractionError.message,
      })
    }

    revalidatePath(`/cases/${caseId}/documents/${documentId}`)
    throw new Error(`Extraction Failed: ${extractionError.message}`)
  }

  // 5. Flatten validated JSON into document fields
  const flattenedFields = flattenDocumentFields(normalizedJson)

  // 6. Insert/update the document_extractions record
  let extractionId: string
  const { data: existingExt } = await supabase
    .from('document_extractions')
    .select('id')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingExt) {
    extractionId = existingExt.id
    const { error: updateError } = await supabase
      .from('document_extractions')
      .update({
        status: 'NeedsReview',
        raw_text: rawResponse,
        extraction_method: modelUsed,
        review_status: 'Unreviewed',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
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
        status: 'NeedsReview',
        raw_text: rawResponse,
        extraction_method: modelUsed,
        review_status: 'Unreviewed',
      })
      .select('id')
      .single()

    if (insertError) throw new Error(insertError.message)
    extractionId = newExt.id
  }

  // 7. Insert the extracted fields
  const fieldsToInsert = flattenedFields.map((f) => ({
    case_id: caseId,
    document_id: documentId,
    document_extraction_id: extractionId,
    field_name: f.field_name,
    raw_value: f.raw_value,
    normalized_value: f.normalized_value,
    status: 'NeedsReview' as const,
  }))

  const { error: fieldError } = await supabase
    .from('document_fields')
    .insert(fieldsToInsert)

  if (fieldError) throw new Error(fieldError.message)

  revalidatePath(`/cases/${caseId}/documents/${documentId}`)
  return { success: true }
}
