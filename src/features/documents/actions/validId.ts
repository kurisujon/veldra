'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const VALID_ID_TYPES = [
  'PhilSys',
  'Passport',
  'DriversLicense',
  'SSS',
  'GSIS',
  'PRC',
  'VotersId',
  'PostalId',
] as const

const UploadValidIdSchema = z.object({
  caseId: z.string().uuid(),
  idType: z.enum(VALID_ID_TYPES),
  file: z
    .instanceof(File, { message: 'Valid file is required' })
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB')
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type),
      'Only PDF, JPEG, and PNG files are allowed'
    ),
})

const DeleteValidIdSchema = z.object({
  caseId: z.string().uuid(),
  filePath: z.string().min(1),
})

/**
 * Upload a government-issued valid ID file to Storage.
 * Files are stored at: valid-ids/{caseId}/{idType}-{uuid}-{filename}
 * Returns the storage path so the component can display it.
 */
export async function uploadValidId(formData: FormData) {
  const parsed = UploadValidIdSchema.safeParse({
    caseId: formData.get('caseId'),
    idType: formData.get('idType'),
    file: formData.get('file'),
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { caseId, idType, file } = parsed.data
  const supabase = await createClient()

  const fileId = crypto.randomUUID()
  const filePath = `valid-ids/${caseId}/${idType}-${fileId}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  revalidatePath(`/cases/${caseId}`)
  return { success: true, filePath }
}

/**
 * Delete a valid ID file from Storage.
 */
export async function deleteValidId(caseId: string, filePath: string) {
  const parsed = DeleteValidIdSchema.safeParse({ caseId, filePath })
  if (!parsed.success) {
    throw new Error('Invalid parameters')
  }

  const supabase = await createClient()
  const { error } = await supabase.storage.from('documents').remove([parsed.data.filePath])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}

/**
 * List all valid IDs for a case from Storage.
 * Returns a list of file paths with signed URLs for preview.
 */
export async function getValidIdsByCase(caseId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('documents')
    .list(`valid-ids/${caseId}`, { limit: 50 })

  if (error) {
    return []
  }

  if (!data || data.length === 0) return []

  const paths = data.map((f) => `valid-ids/${caseId}/${f.name}`)

  const { data: signedData } = await supabase.storage
    .from('documents')
    .createSignedUrls(paths, 3600)

  return (signedData ?? []).map((item) => {
    // Extract the idType from the filename pattern: {idType}-{uuid}-{originalName}
    const fileName = item.path?.split('/').at(-1) ?? ''
    const idType = fileName.split('-')[0] ?? 'Unknown'
    return {
      filePath: item.path ?? '',
      fileName,
      idType,
      signedUrl: item.signedUrl ?? '',
    }
  })
}
