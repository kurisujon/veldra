'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/types/database'

const GenerateExportSchema = z.object({
  caseId: z.string().uuid('Invalid case ID'),
  format: z.enum(['PDF', 'ZIP'])
})

export async function generateExport(caseId: string, format: 'PDF' | 'ZIP') {
  const parsed = GenerateExportSchema.safeParse({ caseId, format })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const supabase = await createClient()
  
  const dummyUrl = `https://storage.placeholder/cases/${parsed.data.caseId}/export_${Date.now()}.${parsed.data.format.toLowerCase()}`

  const { data: exportPackage, error: insertError } = await supabase
    .from('export_packages')
    .insert({
      case_id: parsed.data.caseId,
      package_url: dummyUrl,
      format: parsed.data.format
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(insertError.message)
  }

  const { error: updateError } = await supabase
    .from('cases')
    .update({ status: 'Exported' })
    .eq('id', parsed.data.caseId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  revalidatePath(`/cases/${parsed.data.caseId}`)
  
  return exportPackage
}

export async function getExportsByCase(caseId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('export_packages')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function deleteExport(exportId: string, caseId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('export_packages')
    .delete()
    .eq('id', exportId)

  if (error) throw new Error(error.message)

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}
