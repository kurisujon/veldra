# Phase 4 Milestone 3: Backend Server Actions & Types - Detailed Design

## Executive Summary
This document presents the detailed design specification for the backend implementation of Phase 4 (Document Uploads and Management) of the Veldra platform. It outlines the structure, validation rules, typescript definitions, and server action implementations for case-centric document management. Crucially, it adheres to all architectural rules, ensuring strict TypeScript compliance, secure server-side role and user resolution, and atomic handling of storage and database state to prevent orphaned files.

---

## 1. Existing Patterns & Architecture Review

### Server Action Patterns
In Veldra, server actions are located within feature folders (e.g., `src/features/cases/actions/index.ts`). They are marked with `'use server'` and use the standard Supabase server client from `src/lib/supabase/server.ts` to execute database queries and RPC calls.

Key patterns observed:
- **Client Construction**: Done via `createClient()` from `@/lib/supabase/server`.
- **Validation**: Incoming inputs are validated at the action entry point using Zod schemas.
- **Error Handling**: Database and validation errors throw `Error` exceptions which are caught on the client side. However, for Phase 4 Documents, the project interface contract in `PROJECT.md` specifies that the action functions return standard `{ success: boolean; data?: T; error?: string }` payload structures rather than throwing raw errors directly to the caller. We will conform to this contract.
- **Cache Invalidation**: Revalidations are done via `revalidatePath` to refresh affected page layouts.

### Database Schema and RPCs
Based on the `20260622000000_phase4_documents.sql` migration:
- **`public.documents` table**: Enforces foreign keys to cases and users. The `type` column is restricted to standard document type enums: `('PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma')`. Row Level Security (RLS) restricts modifications to authenticated Admins and Reviewers.
- **`upload_document_record` RPC**: A `SECURITY DEFINER` function that resolves user identity and roles server-side (`auth.uid()`, `get_user_role()`), validates parameters, inserts the document record, and writes an entry to the `activity_logs` table.
- **`delete_document` RPC**: An atomic `SECURITY DEFINER` function that verifies ownership (Reviewers can only delete their own uploads, Admins can delete all), deletes the storage object from `storage.objects`, deletes the database row in `public.documents`, and logs the deletion to `activity_logs`.

---

## 2. Detailed File Specifications

We specify the exact content for the three files under `src/features/documents/`.

### A. `src/features/documents/types.ts`
This file defines TypeScript structures matching the database schema and custom interface contracts. No type bypasses are permitted.

```typescript
import { Database } from '@/types/database';

/**
 * Valid document category types supported by Veldra.
 */
export type DocumentType = 'PSABirth' | 'PSAMarriage' | 'TOR' | 'SF10' | 'Diploma';

/**
 * Type mapping from the Supabase Database schemas.
 */
export type DocumentRow = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

/**
 * Standard envelope pattern for Server Action responses.
 */
export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

---

### B. `src/features/documents/validation.ts`
This file contains the Zod schemas for validating incoming data before backend processing. This ensures that no untyped or unvalidated data is processed by the database client.

```typescript
import { z } from 'zod';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes

/**
 * Validation schema for document upload actions.
 * Ensures the case ID exists as a valid UUID, the type is within scope,
 * and the file is present, non-empty, and conforms to size and MIME constraints.
 */
export const UploadDocumentSchema = z.object({
  caseId: z.string().uuid('Invalid Case ID format'),
  type: z.enum(['PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma'], {
    errorMap: () => ({ message: 'Invalid document type. Allowed types: PSABirth, PSAMarriage, TOR, SF10, Diploma' })
  }),
  file: z.custom<File>((val) => val instanceof File, 'File is required')
    .refine((file) => file.size > 0, 'File cannot be empty')
    .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must not exceed 10MB')
    .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), 'Invalid file type. Only PDF, JPG, and PNG are allowed.')
});

/**
 * Validation schema for document deletion.
 */
export const DeleteDocumentSchema = z.object({
  documentId: z.string().uuid('Invalid Document ID format')
});

/**
 * Validation schema for retrieving documents by case.
 */
export const GetDocumentsSchema = z.object({
  caseId: z.string().uuid('Invalid Case ID format')
});
```

---

### C. `src/features/documents/actions.ts`
This file implements the server actions with full validation, error handling, storage interaction, database sync, and cache invalidation.

```typescript
'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { 
  UploadDocumentSchema, 
  DeleteDocumentSchema, 
  GetDocumentsSchema 
} from './validation';
import { 
  DocumentRow, 
  ActionResponse 
} from './types';

/**
 * Server action to upload a document to Supabase storage and record its metadata.
 * 
 * Flow:
 * 1. Extract inputs from FormData.
 * 2. Validate inputs using Zod.
 * 3. Generate a secure random UUID for the document.
 * 4. Upload the raw file to the private 'documents' storage bucket under cases/{case_id}/{document_id}.
 * 5. Call the upload_document_record database RPC to insert metadata and log activity.
 * 6. Rollback (delete) the storage file if the RPC fails.
 * 7. Fetch and return the finalized database record, then revalidate layout path.
 */
export async function uploadDocument(formData: FormData): Promise<ActionResponse<DocumentRow>> {
  try {
    const caseId = formData.get('caseId');
    const type = formData.get('type');
    const file = formData.get('file');

    // 1. Zod input validation
    const parsed = UploadDocumentSchema.safeParse({ caseId, type, file });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0].message
      };
    }

    const supabase = createClient();
    const documentId = crypto.randomUUID();
    const filePath = `cases/${parsed.data.caseId}/${documentId}`;

    // 2. Storage upload
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, parsed.data.file, {
        contentType: parsed.data.file.type,
        duplex: 'half'
      });

    if (uploadError) {
      return {
        success: false,
        error: `Storage upload failed: ${uploadError.message}`
      };
    }

    // 3. RPC execution to register document metadata in db
    const { data: newDocId, error: rpcError } = await supabase.rpc('upload_document_record', {
      p_case_id: parsed.data.caseId,
      p_type: parsed.data.type,
      p_file_path: filePath,
      p_file_name: parsed.data.file.name,
      p_file_size: parsed.data.file.size,
      p_mime_type: parsed.data.file.type
    });

    // 4. Atomic Cleanup: Roll back storage if RPC failed
    if (rpcError) {
      await supabase.storage.from('documents').remove([filePath]);
      return {
        success: false,
        error: `Database record creation failed: ${rpcError.message}`
      };
    }

    // 5. Retrieve newly created record
    const { data: docRow, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', newDocId)
      .single();

    if (fetchError || !docRow) {
      return {
        success: false,
        error: `Failed to retrieve uploaded document metadata: ${fetchError?.message || 'Not found'}`
      };
    }

    revalidatePath(`/cases/${parsed.data.caseId}`);
    return {
      success: true,
      data: docRow
    };
  } catch (error: any) {
    console.error('Unexpected error in uploadDocument action:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during document upload.'
    };
  }
}

/**
 * Server action to delete a document.
 * Calls the delete_document RPC which handles deleting from both tables atomically.
 */
export async function deleteDocument(documentId: string): Promise<ActionResponse> {
  try {
    const parsed = DeleteDocumentSchema.safeParse({ documentId });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0].message
      };
    }

    const supabase = createClient();

    // Fetch case context for revalidation before deletion occurs
    const { data: docData, error: fetchError } = await supabase
      .from('documents')
      .select('case_id')
      .eq('id', parsed.data.documentId)
      .single();

    if (fetchError || !docData) {
      return {
        success: false,
        error: `Document not found or permission denied: ${fetchError?.message || ''}`
      };
    }

    // Invoke delete_document RPC which removes storage object & database row atomically
    const { error: rpcError } = await supabase.rpc('delete_document', {
      p_document_id: parsed.data.documentId
    });

    if (rpcError) {
      return {
        success: false,
        error: `Database deletion failed: ${rpcError.message}`
      };
    }

    revalidatePath(`/cases/${docData.case_id}`);
    return {
      success: true
    };
  } catch (error: any) {
    console.error('Unexpected error in deleteDocument action:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during document deletion.'
    };
  }
}

/**
 * Server action to retrieve all document records for a given case.
 */
export async function getDocumentsByCase(caseId: string): Promise<ActionResponse<DocumentRow[]>> {
  try {
    const parsed = GetDocumentsSchema.safeParse({ caseId });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0].message
      };
    }

    const supabase = createClient();

    const { data: docs, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', parsed.data.caseId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      return {
        success: false,
        error: `Failed to retrieve documents: ${fetchError.message}`
      };
    }

    return {
      success: true,
      data: docs || []
    };
  } catch (error: any) {
    console.error('Unexpected error in getDocumentsByCase action:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while retrieving case documents.'
    };
  }
}
```

---

## 3. Reliability and Security Design Decisions

1. **Storage Cleanup Handling**: When uploading a file, storage upload must occur before the database record is inserted, as the database record holds metadata references (like size, mime type, and location) that depend on physical file ingestion. If the subsequent RPC insertion fails due to constraint violations, role restriction, or network disruption, the uploaded storage file becomes "orphaned". The design mitigates this by wrapping the RPC call in a `try/catch` equivalent check and issuing an asynchronous storage rollback via `supabase.storage.from('documents').remove([filePath])` upon failure.
2. **Atomic Deletion**: The `deleteDocument` action utilizes the database-level `delete_document` RPC. Since this RPC handles both deletion from `storage.objects` and `public.documents` inside a single PL/pgSQL database function execution, it executes atomically. No partial state (i.e. deleting the database record but leaving the storage object, or vice versa) can occur.
3. **No Client Trust**:
   - The user identity is derived purely server-side via `auth.uid()` within the SQL functions.
   - The user role checks (`Admin`, `Reviewer`) are performed inside the `SECURITY DEFINER` RPC functions via `get_user_role()`, meaning spoofing roles client-side will not bypass row security.
   - Files are stored in the private `documents` bucket. The bucket is not public, meaning raw files are shielded from public access. The Supabase Storage RLS policies permit access only to authenticated Admins and Reviewers.
4. **Zod Verification Rigor**:
   - All server action entries validate type schemas instantly.
   - File uploads are validated for valid `File` instantiation, non-zero file sizes, maximum limits (10MB), and specific whitelisted MIME types (`application/pdf`, `image/jpeg`, `image/png`).

---

## 4. Verification & Testing Strategy

Since this milestone covers Server Actions (which are purely backend endpoints), they can be validated using the following test cases in the Playwright E2E suite or integration test script:

- **TC_UPLOAD_SUCCESS**: Invoke `uploadDocument` with valid case ID, type, and file. Verify that a `DocumentRow` is returned with `status: 'uploaded'`, and that the file can be fetched from storage path `cases/{caseId}/{documentId}`.
- **TC_UPLOAD_INVALID_TYPE**: Invoke `uploadDocument` with an invalid type string (e.g. `'InvalidType'`). Verify that it fails validation and returns `success: false` with the error `Invalid document type`.
- **TC_UPLOAD_EMPTY_FILE**: Invoke `uploadDocument` with an empty file (0 bytes). Verify that validation fails with `File cannot be empty`.
- **TC_UPLOAD_INVALID_MIME**: Invoke `uploadDocument` with an unsupported file format (e.g. `text/plain`). Verify that validation fails with `Invalid file type. Only PDF, JPG, and PNG are allowed.`.
- **TC_DELETE_SUCCESS**: Upload a file, and invoke `deleteDocument` with the returned document ID. Verify that the database row and storage object are deleted.
- **TC_DELETE_UNAUTHORIZED**: Under a Reviewer account, attempt to delete a document uploaded by a different Reviewer/Admin. Verify that the operation fails due to RLS/ownership checks.
- **TC_RETRIEVAL_BY_CASE**: Upload multiple documents under a single case ID, and invoke `getDocumentsByCase`. Verify that all uploaded documents are returned sorted by creation time.
