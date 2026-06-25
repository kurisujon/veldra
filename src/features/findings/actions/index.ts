'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/types/database'

const AnalyzeDocumentsSchema = z.object({
  caseId: z.string().uuid()
})

const UpdateFindingStatusSchema = z.object({
  findingId: z.string().uuid(),
  caseId: z.string().uuid(),
  status: z.enum(['Open', 'Accepted', 'Resolved', 'Ignored'])
})

export async function analyzeDocuments(caseId: string) {
  const parsed = AnalyzeDocumentsSchema.safeParse({ caseId })
  if (!parsed.success) {
    throw new Error('Invalid case ID')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch user role
  const { data: userRoleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  const role = userRoleData?.role || 'Reviewer'

  // 1. Fetch Applicant
  const { data: applicants, error: applicantError } = await supabase
    .from('applicants')
    .select('*')
    .eq('case_id', caseId)
    .single()

  if (applicantError) throw new Error(`Failed to fetch applicant: ${applicantError.message}`)

  // 2. Fetch Documents
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('*')
    .eq('case_id', caseId)

  if (docsError) throw new Error(`Failed to fetch documents: ${docsError.message}`)

  // 3. Delete existing findings for this case (reset analysis)
  await supabase.from('findings').delete().eq('case_id', caseId)

  // 4. Mock Analysis Logic
  if (documents && documents.length >= 2) {
    // Generate a mock finding
    const { data: finding, error: insertError } = await supabase
      .from('findings')
      .insert({
        case_id: caseId,
        title: 'First Name Spelling Mismatch',
        description: `The first name '${applicants.first_name}' on the application does not match the spelling found in the uploaded documents.`,
        severity: 'High',
        category: 'Name Mismatch',
        status: 'Open'
      })
      .select()
      .single()

    if (insertError) throw new Error(`Failed to insert finding: ${insertError.message}`)

    // 5. Link documents to finding
    const findingDocs = [
      { finding_id: finding.id, document_id: documents[0].id },
      { finding_id: finding.id, document_id: documents[1].id }
    ]

    const { error: linkError } = await supabase
      .from('finding_documents')
      .insert(findingDocs)

    if (linkError) throw new Error(`Failed to link documents: ${linkError.message}`)
    
    // Log activity
    await supabase.from('activity_logs').insert({
      case_id: caseId,
      user_id: user.id,
      role: role,
      action_type: 'ANALYSIS_COMPLETE',
      description: 'Document analysis completed. Discrepancies found.'
    })
  } else {
    // Log activity
    await supabase.from('activity_logs').insert({
      case_id: caseId,
      user_id: user.id,
      role: role,
      action_type: 'ANALYSIS_COMPLETE',
      description: 'Document analysis completed. No discrepancies found.'
    })
  }

  // Update case status to NeedsReview
  await supabase.from('cases').update({ status: 'NeedsReview' }).eq('id', caseId)

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}

export async function updateFindingStatus(findingId: string, caseId: string, status: 'Open' | 'Accepted' | 'Resolved' | 'Ignored') {
  const parsed = UpdateFindingStatusSchema.safeParse({ findingId, caseId, status })
  if (!parsed.success) {
    throw new Error('Invalid input data')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userRoleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  const role = userRoleData?.role || 'Reviewer'

  const { error } = await supabase
    .from('findings')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.findingId)

  if (error) throw new Error(`Failed to update finding: ${error.message}`)

  // Log activity
  await supabase.from('activity_logs').insert({
    case_id: caseId,
    user_id: user.id,
    role: role,
    action_type: 'FINDING_UPDATED',
    description: `Finding status updated to ${status}`
  })

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}

export async function getFindingsByCase(caseId: string) {
  const parsed = z.string().uuid().safeParse(caseId)
  if (!parsed.success) {
    throw new Error('Invalid case ID')
  }

  const supabase = await createClient()

  // 1. Fetch findings
  const { data: findings, error: findingsError } = await supabase
    .from('findings')
    .select('*')
    .eq('case_id', parsed.data)
    .order('created_at', { ascending: true })

  if (findingsError) {
    throw new Error(`Failed to fetch findings: ${findingsError.message}`)
  }

  if (!findings || findings.length === 0) return []

  // 2. Fetch the document links for these findings
  const findingIds = findings.map((f) => f.id)
  const { data: links, error: linksError } = await supabase
    .from('finding_documents')
    .select('finding_id, document_id')
    .in('finding_id', findingIds)

  if (linksError) {
    throw new Error(`Failed to fetch finding documents: ${linksError.message}`)
  }

  // 3. Map linked document IDs back to findings
  return findings.map((finding) => {
    const documentIds = (links || [])
      .filter((link) => link.finding_id === finding.id)
      .map((link) => link.document_id)

    return {
      ...finding,
      documentIds
    }
  })
}

export async function getCurrentUserRole(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Guest'

  const { data: userRoleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  return userRoleData?.role || 'Guest'
}


