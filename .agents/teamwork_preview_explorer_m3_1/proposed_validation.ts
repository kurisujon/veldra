import { z } from 'zod'

// Allowed document types matching database check constraint
export const AllowedDocumentTypes = ['PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma'] as const;

export const UploadDocumentSchema = z.object({
  caseId: z.string().uuid({ message: 'Invalid Case ID format' }),
  type: z.enum(AllowedDocumentTypes, {
    errorMap: () => ({ message: 'Invalid document type' }),
  }),
  file: z
    .custom<File>((val) => val instanceof File, { message: 'File is required' })
    .refine((file) => file.size > 0, { message: 'File cannot be empty' })
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type),
      { message: 'Only PDF, JPEG, and PNG formats are supported' }
    )
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      { message: 'File size must not exceed 10MB' }
    ),
})

export const DeleteDocumentSchema = z.object({
  documentId: z.string().uuid({ message: 'Invalid Document ID format' }),
})

export const GetDocumentsSchema = z.object({
  caseId: z.string().uuid({ message: 'Invalid Case ID format' }),
})
