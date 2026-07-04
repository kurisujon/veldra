'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ExportService } from '@/lib/exports/export-service'

const GenerateExportSchema = z.object({
  caseId: z.string().uuid('Invalid case ID'),
  title: z.string().optional()
})

const GenerateDraftExportSchema = z.object({
  caseId: z.string().uuid('Invalid case ID'),
  draftId: z.string().uuid('Invalid draft ID')
})

export async function generateExport(caseId: string, title?: string) {
  const parsed = GenerateExportSchema.safeParse({ caseId, title })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Unauthorized: User not found' }
  }

  const result = await ExportService.generateReport(supabase, parsed.data.caseId, user.id, parsed.data.title || 'Verification Report')

  if (result.error) {
    return { error: result.error }
  }

  // Update case status
  const { error: updateError } = await supabase
    .from('cases')
    .update({ status: 'Exported' })
    .eq('id', parsed.data.caseId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/cases/${parsed.data.caseId}`)
  
  return result.data
}

export async function generateDraftExport(caseId: string, draftId: string) {
  const parsed = GenerateDraftExportSchema.safeParse({ caseId, draftId })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Unauthorized: User not found' }
  }

  const result = await ExportService.generateDraftExport(supabase, parsed.data.caseId, parsed.data.draftId, user.id)

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath(`/cases/${parsed.data.caseId}`)
  
  return result.data
}

export async function getExportsByCase(caseId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('export_packages')
    .select('*')
    .eq('case_id', caseId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  if (!data) return []

  const exportsWithUrls = await Promise.all(data.map(async (exp) => {
    let pdf_url = exp.pdf_path
    let docx_url = exp.docx_path

    if (exp.pdf_path) {
      const { data: pdfData } = await supabase.storage.from('exports').createSignedUrl(exp.pdf_path, 3600)
      if (pdfData?.signedUrl) pdf_url = pdfData.signedUrl
    }
    
    if (exp.docx_path) {
      const { data: docxData } = await supabase.storage.from('exports').createSignedUrl(exp.docx_path, 3600)
      if (docxData?.signedUrl) docx_url = docxData.signedUrl
    }

    return { ...exp, pdf_path: pdf_url, docx_path: docx_url }
  }))

  return exportsWithUrls
}

export async function getAllExports() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('export_packages')
    .select('*, cases(applicants(first_name, last_name))')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  if (!data) return []

  const exportsWithUrls = await Promise.all(data.map(async (exp) => {
    let pdf_url = exp.pdf_path
    let docx_url = exp.docx_path

    if (exp.pdf_path) {
      const { data: pdfData } = await supabase.storage.from('exports').createSignedUrl(exp.pdf_path, 3600)
      if (pdfData?.signedUrl) pdf_url = pdfData.signedUrl
    }
    
    if (exp.docx_path) {
      const { data: docxData } = await supabase.storage.from('exports').createSignedUrl(exp.docx_path, 3600)
      if (docxData?.signedUrl) docx_url = docxData.signedUrl
    }

    return { ...exp, pdf_path: pdf_url, docx_path: docx_url }
  }))

  return exportsWithUrls
}

export async function getDeletedExports() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('export_packages')
    .select('*, cases(applicants(first_name, last_name))')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  if (!data) return []

  const exportsWithUrls = await Promise.all(data.map(async (exp) => {
    let pdf_url = exp.pdf_path
    let docx_url = exp.docx_path

    if (exp.pdf_path) {
      const { data: pdfData } = await supabase.storage.from('exports').createSignedUrl(exp.pdf_path, 3600)
      if (pdfData?.signedUrl) pdf_url = pdfData.signedUrl
    }
    
    if (exp.docx_path) {
      const { data: docxData } = await supabase.storage.from('exports').createSignedUrl(exp.docx_path, 3600)
      if (docxData?.signedUrl) docx_url = docxData.signedUrl
    }

    return { ...exp, pdf_path: pdf_url, docx_path: docx_url }
  }))

  return exportsWithUrls
}

export async function moveToTrashExport(exportId: string, caseId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('export_packages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', exportId)

  if (error) return { error: error.message }

  revalidatePath(`/cases/${caseId}`)
  revalidatePath('/exports')
  return { success: true }
}

export async function restoreExport(exportId: string, caseId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('export_packages')
    .update({ deleted_at: null })
    .eq('id', exportId)

  if (error) return { error: error.message }

  revalidatePath(`/cases/${caseId}`)
  revalidatePath('/exports')
  return { success: true }
}

export async function deleteExport(exportId: string, caseId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('export_packages')
    .delete()
    .eq('id', exportId)

  if (error) return { error: error.message }

  revalidatePath(`/cases/${caseId}`)
  revalidatePath('/exports')
  return { success: true }
}
