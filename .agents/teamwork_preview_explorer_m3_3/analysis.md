# Detailed Design for Phase 4: Milestone 3 (Backend Server Actions & Types)

## Executive Summary
This design defines the server-side architecture, data contracts, and input validation schemas for document management (upload, deletion, and listing) within the Veldra Case-Centric system. The implementation consists of three key files: `types.ts` for database-mapped definitions, `validation.ts` for rigorous Zod schemas, and `actions.ts` for Next.js Server Actions. 

Key architectural properties:
- **Atomicity with Resilient Cleanup**: The upload action performs storage ingestion before registering metadata. If the database RPC fails, the action cleans up the storage artifact to prevent orphan storage objects.
- **Strict Role-Based Auditing**: Both metadata recording and object deletion are performed via `SECURITY DEFINER` RPCs, which automatically resolve the actor's ID and Role on the database side using `auth.uid()` and `public.get_user_role()`.
- **Accurate Route Revalidation**: Cache invalidation is targeted dynamically using the specific `case_id` of the affected document.

---

## 1. Directory Structure and File Layout
All code files for this feature are located under the feature domain folder `src/features/documents/`:
```text
src/features/documents/
├── types.ts          # Strongly typed domain types and interface contracts
├── validation.ts     # Zod validation schemas for server-side inputs
└── actions.ts        # Next.js Server Actions: upload, delete, and list
```

---

## 2. File Implementation Proposals

### 2.1. Types Definition (`src/features/documents/types.ts`)
This file maps database rows to TypeScript structures and defines the server action result interfaces. It conforms to strict TypeScript rules without any type bypasses or loose interfaces.

```typescript
import type { Database } from '@/types/database'

/**
 * Union of permitted document types in Veldra.
 * Maps directly to the CHECK constraint in the public.documents table.
 */
export type DocumentType = 'PSABirth' | 'PSAMarriage' | 'TOR' | 'SF10' | 'Diploma'

/**
 * Database-mapped types extracted directly from the generated Supabase schemas.
 */
export type DocumentRow = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']

/**
 * Result interfaces for document Server Actions.
 */
export interface UploadDocumentResult {
  success: boolean
  data?: {
    id: string
    filePath: string
  }
  error?: string
}

export interface DeleteDocumentResult {
  success: boolean
  error?: string
}

export interface GetDocumentsResult {
  success: boolean
  data?: DocumentRow[]
  error?: string
}
```

---

### 2.2. Input Validation Schemas (`src/features/documents/validation.ts`)
The Zod schemas are designed to be run server-side. For document uploads, we leverage a `z.custom<File>` wrapper to validate the standard Web API `File` object received via `FormData` in server actions, validating size constraints and mime types.

```typescript
import { z } from 'zod'

/**
 * Supported MIME types as defined by Veldra's Feature Requirements.
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png'
] as const

/**
 * Maximum file size allowed for documents (10MB).
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Schema for uploading a document.
 * Validates the parameters extracted from FormData.
 */
export const UploadDocumentSchema = z.object({
  caseId: z.string().uuid({ message: 'Invalid case ID format' }),
  type: z.enum(['PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma'], {
    errorMap: () => ({ 
      message: 'Invalid document type. Must be one of: PSABirth, PSAMarriage, TOR, SF10, Diploma.' 
    })
  }),
  file: z.custom<File>(
    (val) => val instanceof File, 
    { message: 'File is required' }
  )
    .refine((file) => file.size > 0, 'File cannot be empty')
    .refine(
      (file) => file.size <= MAX_FILE_SIZE_BYTES, 
      `File size must not exceed ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
    )
    .refine(
      (file) => (ALLOWED_MIME_TYPES as readonly string[]).includes(file.type),
      'Unsupported file format. Supported formats: PDF, JPEG, PNG'
    )
})

/**
 * Schema for deleting a document.
 */
export const DeleteDocumentSchema = z.object({
  documentId: z.string().uuid({ message: 'Invalid document ID format' })
})

/**
 * Schema for retrieving documents of a case.
 */
export const GetDocumentsByCaseSchema = z.object({
  caseId: z.string().uuid({ message: 'Invalid case ID format' })
})
```

---

### 2.3. Server Actions (`src/features/documents/actions.ts`)
Actions leverage `createServerClient` from `@/lib/supabase` which accesses active HTTP cookies for user authentication, validating permission boundaries.

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { 
  UploadDocumentSchema, 
  DeleteDocumentSchema, 
  GetDocumentsByCaseSchema 
} from './validation'
import type { 
  UploadDocumentResult, 
  DeleteDocumentResult, 
  GetDocumentsResult 
} from './types'

/**
 * Uploads a document to Supabase Storage and records metadata in the database.
 * If the database registration fails, it rolls back the storage upload.
 * 
 * @param formData - FormData containing 'caseId', 'type', and 'file'
 */
export async function uploadDocument(formData: FormData): Promise<UploadDocumentResult> {
  try {
    // 1. Extract values from FormData
    const caseId = formData.get('caseId')
    const type = formData.get('type')
    const file = formData.get('file')

    // 2. Validate input schemas
    const parsed = UploadDocumentSchema.safeParse({ caseId, type, file })
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map(err => err.message).join(', ')
      }
    }

    const { caseId: validatedCaseId, type: validatedType, file: validatedFile } = parsed.data

    // 3. Generate document path
    // We generate a UUID client-side (Server Action environment) so we can construct
    // the storage filepath under the standard folder structure: cases/{case_id}/{document_id}.{extension}
    const documentId = crypto.randomUUID()
    const fileExtension = validatedFile.name.split('.').pop()
    const filePath = `cases/${validatedCaseId}/${documentId}${fileExtension ? `.${fileExtension}` : ''}`

    const supabase = createServerClient()

    // 4. Upload file to Supabase Storage (private documents bucket)
    const { data: storageData, error: storageError } = await supabase.storage
      .from('documents')
      .upload(filePath, validatedFile, {
        contentType: validatedFile.type,
        upsert: false
      })

    if (storageError) {
      return {
        success: false,
        error: `Storage upload failed: ${storageError.message}`
      }
    }

    // 5. Invoke Database RPC to record document metadata and write activity log
    const { data: registeredId, error: rpcError } = await supabase.rpc('upload_document_record', {
      p_case_id: validatedCaseId,
      p_type: validatedType,
      p_file_path: filePath,
      p_file_name: validatedFile.name,
      p_file_size: validatedFile.size,
      p_mime_type: validatedFile.type
    })

    // Rollback storage artifact on RPC failure
    if (rpcError) {
      await supabase.storage.from('documents').remove([filePath])
      return {
        success: false,
        error: `Database registration failed: ${rpcError.message}`
      }
    }

    // 6. Invalidate caches for Case views
    revalidatePath(`/cases/${validatedCaseId}`)
    revalidatePath('/cases')

    return {
      success: true,
      data: {
        id: registeredId,
        filePath
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred during document upload'
    }
  }
}

/**
 * Deletes a document from the system.
 * Deletion operates atomically on the database via a SECURITY DEFINER RPC.
 * 
 * @param documentId - UUID of the target document
 */
export async function deleteDocument(documentId: string): Promise<DeleteDocumentResult> {
  try {
    // 1. Validate inputs
    const parsed = DeleteDocumentSchema.safeParse({ documentId })
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map(err => err.message).join(', ')
      }
    }

    const { documentId: validatedDocId } = parsed.data
    const supabase = createServerClient()

    // 2. Fetch case_id of document before deletion to revalidate correct paths
    const { data: documentRecord, error: fetchError } = await supabase
      .from('documents')
      .select('case_id')
      .eq('id', validatedDocId)
      .single()

    if (fetchError || !documentRecord) {
      return {
        success: false,
        error: `Failed to resolve document context: ${fetchError?.message || 'Document not found'}`
      }
    }

    // 3. Invoke delete_document RPC
    // This SQL function deletes both the storage.objects record and public.documents row atomically,
    // and enforces that Reviewers can only delete their own uploads, while Admins can delete any.
    const { error: rpcError } = await supabase.rpc('delete_document', {
      p_document_id: validatedDocId
    })

    if (rpcError) {
      return {
        success: false,
        error: `Failed to delete document: ${rpcError.message}`
      }
    }

    // 4. Invalidate caches
    revalidatePath(`/cases/${documentRecord.case_id}`)
    revalidatePath('/cases')

    return {
      success: true
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred during document deletion'
    }
  }
}

/**
 * Retrieves all documents registered for a case.
 * 
 * @param caseId - UUID of the parent case
 */
export async function getDocumentsByCase(caseId: string): Promise<GetDocumentsResult> {
  try {
    // 1. Validate inputs
    const parsed = GetDocumentsByCaseSchema.safeParse({ caseId })
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map(err => err.message).join(', ')
      }
    }

    const { caseId: validatedCaseId } = parsed.data
    const supabase = createServerClient()

    // 2. Query documents table ordered by newest first
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', validatedCaseId)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        success: false,
        error: `Failed to retrieve documents: ${error.message}`
      }
    }

    return {
      success: true,
      data: data || []
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred during retrieval'
    }
  }
}
```

---

## 3. Security and Compliance Review
1. **Cookie-Based Auth Context Integration**: Actions use Next.js `cookies()` inside `createServerClient()`, forwarding the auth JWT in the HTTP headers to Supabase. This means every storage action and database call respects standard authorization contexts.
2. **PostgreSQL RPC Security**: Both `upload_document_record` and `delete_document` use `SECURITY DEFINER` and have their search path locked to `public`. Inside, they resolve user metrics through `auth.uid()`, preventing any possibility of client-side ID spoofing or role elevation.
3. **Storage RLS Policies**: The bucket `documents` is marked `public: false` to ensure objects cannot be accessed via direct URL strings. A signed URL is required to read them. Bucket upload policies permit INSERT and SELECT statements only to authenticated `Reviewer` and `Admin` users.

---

## 4. Verification and Invalidation Method
To verify this backend design:
1. **Compilation Check**: Confirm the design parses with strict TypeScript rules. The usage of `z.custom<File>` guarantees correct inference of `File` types.
2. **Storage Ingestion Checks**: Validate that uploading files creates objects in Supabase storage under `cases/{case_id}/{document_id}` and that files fail if they are non-PDF/JPEG/PNG or exceed 10MB.
3. **Database Insertion Verification**: Verify that the `public.documents` record exists after upload and that an `activity_logs` entry is correctly registered under the case.
4. **Transaction Integrity Tests**: In test mocks, intercept the RPC call after storage upload and raise an error. Ensure that the corresponding file in Supabase Storage is removed automatically by the rollback block.
