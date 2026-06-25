'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { UploadDocumentSchema, DeleteDocumentSchema, GetDocumentsSchema } from './validation'
import type { Document, UploadResponse, DeleteResponse, GetDocumentsResponse } from './types'

/**
 * Server Action: Uploads a document file to private storage bucket and registers it in the DB.
 * 
 * Flow:
 * 1. Extract caseId, type, and file from FormData.
 * 2. Validate inputs using Zod.
 * 3. Verify user authentication.
 * 4. Generate a unique document ID and construct the storage file path.
 * 5. Upload the file to the private 'documents' bucket.
 * 6. Invoke the database RPC 'upload_document_record' to insert the DB row and log activity.
 * 7. If DB insertion fails, automatically clean up the uploaded storage object to prevent orphans.
 * 8. Revalidate the case detail page path.
 */
export async function uploadDocument(formData: FormData): Promise<UploadResponse> {
  const supabase = createServerClient()
  let uploadedFilePath: string | null = null

  try {
    // 1. Extract values
    const caseId = formData.get('caseId')
    const type = formData.get('type')
    const file = formData.get('file')

    // 2. Validate with Zod
    const parsed = UploadDocumentSchema.safeParse({ caseId, type, file })
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0].message,
      }
    }

    const { caseId: validatedCaseId, type: validatedType, file: validatedFile } = parsed.data

    // 3. Authenticate User (Server-Side)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Authenticated user session required',
      }
    }

    // 4. Set up IDs and Storage File Path
    const documentId = crypto.randomUUID()
    // Storage path: cases/{case_id}/{document_id}
    const filePath = `cases/${validatedCaseId}/${documentId}`
    uploadedFilePath = filePath

    // 5. Convert File to ArrayBuffer for Storage Upload
    const fileBuffer = await validatedFile.arrayBuffer()

    // 6. Upload to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: validatedFile.type,
        upsert: false,
      })

    if (storageError) {
      return {
        success: false,
        error: `Storage upload failed: ${storageError.message}`,
      }
    }

    // 7. Invoke database RPC to create record and log activity
    const { data: recordId, error: rpcError } = await supabase.rpc('upload_document_record', {
      p_case_id: validatedCaseId,
      p_type: validatedType,
      p_file_path: filePath,
      p_file_name: validatedFile.name,
      p_file_size: validatedFile.size,
      p_mime_type: validatedFile.type,
    })

    if (rpcError) {
      // Rollback: Delete the uploaded file from storage to avoid orphan files
      await supabase.storage.from('documents').remove([filePath])
      return {
        success: false,
        error: `Database registration failed: ${rpcError.message}`,
      }
    }

    // 8. Retrieve complete inserted document row
    const { data: documentRow, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', recordId)
      .single()

    if (fetchError || !documentRow) {
      // Fallback: document is successfully uploaded and registered, but retrieval failed
      return {
        success: true,
        data: {
          id: recordId,
          case_id: validatedCaseId,
          type: validatedType,
          file_path: filePath,
          file_name: validatedFile.name,
          file_size: validatedFile.size,
          mime_type: validatedFile.type,
          status: 'uploaded',
          uploaded_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Document,
        error: 'Document uploaded but failed to fetch complete database record.',
      }
    }

    // 9. Revalidate cache
    revalidatePath(`/cases/${validatedCaseId}`)

    return {
      success: true,
      data: documentRow,
    }

  } catch (error: any) {
    // Catch any unexpected runtime errors
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during document upload',
    }
  }
}

/**
 * Server Action: Deletes a document record and its corresponding storage object atomically.
 * 
 * Flow:
 * 1. Validate incoming documentId.
 * 2. Authenticate user.
 * 3. Fetch the caseId of the document to allow cache revalidation afterwards.
 * 4. Call delete_document RPC (runs as SECURITY DEFINER to handle storage and table deletes).
 * 5. Revalidate cache for the affected case.
 */
export async function deleteDocument(documentId: string): Promise<DeleteResponse> {
  const supabase = createServerClient()

  try {
    // 1. Validate Document ID
    const parsed = DeleteDocumentSchema.safeParse({ documentId })
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0].message,
      }
    }

    const { documentId: validatedDocumentId } = parsed.data

    // 2. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Authenticated user session required',
      }
    }

    // 3. Fetch document's case context for revalidation
    const { data: documentRow, error: fetchError } = await supabase
      .from('documents')
      .select('case_id')
      .eq('id', validatedDocumentId)
      .single()

    if (fetchError || !documentRow) {
      return {
        success: false,
        error: `Document not found or inaccessible: ${fetchError?.message || 'Not Found'}`,
      }
    }

    // 4. Call delete_document RPC
    const { error: rpcError } = await supabase.rpc('delete_document', {
      p_document_id: validatedDocumentId,
    })

    if (rpcError) {
      return {
        success: false,
        error: `Database deletion failed: ${rpcError.message}`,
      }
    }

    // 5. Revalidate Cache
    revalidatePath(`/cases/${documentRow.case_id}`)

    return {
      success: true,
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during document deletion',
    }
  }
}

/**
 * Server Action: Retrieves all document metadata records for a given case ID.
 * 
 * Flow:
 * 1. Validate incoming caseId.
 * 2. Authenticate user.
 * 3. Select all documents belonging to the case, ordered by created_at.
 */
export async function getDocumentsByCase(caseId: string): Promise<GetDocumentsResponse> {
  const supabase = createServerClient()

  try {
    // 1. Validate Case ID
    const parsed = GetDocumentsSchema.safeParse({ caseId })
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0].message,
      }
    }

    const { caseId: validatedCaseId } = parsed.data

    // 2. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: Authenticated user session required',
      }
    }

    // 3. Fetch documents
    const { data: documents, error: selectError } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', validatedCaseId)
      .order('created_at', { ascending: false })

    if (selectError) {
      return {
        success: false,
        error: `Failed to retrieve documents: ${selectError.message}`,
      }
    }

    return {
      success: true,
      data: documents || [],
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during document retrieval',
    }
  }
}
