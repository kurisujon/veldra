'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { compareNames } from '@/lib/comparison/compareNames'
import { compareDates } from '@/lib/comparison/compareDates'
import { compareAddresses } from '@/lib/comparison/compareAddresses'
import { compareTimeline } from '@/lib/comparison/compareTimeline'

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

  // 4. Fetch DocumentFields for comparison
  const { data: fields, error: fieldsError } = await supabase
    .from('document_fields')
    .select('*')
    .eq('case_id', caseId)

  if (fieldsError) throw new Error(`Failed to fetch document fields: ${fieldsError.message}`)

  let discrepancyFound = false

  if (fields && fields.length > 0) {
    const discrepancies = [
      ...compareNames(fields as any),
      ...compareDates(fields as any),
      ...compareAddresses(fields as any),
      ...compareTimeline(fields as any)
    ]

    for (const disc of discrepancies) {
      discrepancyFound = true

      const { data: finding, error: insertError } = await supabase
        .from('findings')
        .insert({
          case_id: caseId,
          title: disc.title,
          description: disc.description,
          severity: disc.severity,
          category: disc.category,
          status: 'Open'
        })
        .select()
        .single()

      if (insertError) throw new Error(`Failed to insert finding: ${insertError.message}`)

      // Link documents to finding
      const findingDocs = [
        { finding_id: finding.id, document_id: disc.fieldA.document_id },
        { finding_id: finding.id, document_id: disc.fieldB.document_id }
      ]
      await supabase.from('finding_documents').insert(findingDocs)

      // Link document fields to finding
      const findingFieldRefs = [
        { finding_id: finding.id, document_field_id: disc.fieldA.id, document_id: disc.fieldA.document_id, role: 'source_a' },
        { finding_id: finding.id, document_field_id: disc.fieldB.id, document_id: disc.fieldB.document_id, role: 'source_b' }
      ]
      await supabase.from('finding_field_references').insert(findingFieldRefs as any)
    }
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    case_id: caseId,
    user_id: user.id,
    role: role,
    action_type: 'ANALYSIS_COMPLETE',
    description: discrepancyFound ? 'Document analysis completed. Discrepancies found.' : 'Document analysis completed. No discrepancies found.'
  })

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

  // 3. Fetch finding_field_references joined with document_fields
  const { data: fieldRefs, error: fieldRefsError } = await supabase
    .from('finding_field_references')
    .select('*, document_fields(*)')
    .in('finding_id', findingIds)

  if (fieldRefsError) {
    throw new Error(`Failed to fetch finding field references: ${fieldRefsError.message}`)
  }

  // 4. Map linked document IDs and field refs back to findings
  return findings.map((finding) => {
    const documentIds = (links || [])
      .filter((link) => link.finding_id === finding.id)
      .map((link) => link.document_id)

    const fieldReferences = (fieldRefs || [])
      .filter((ref) => ref.finding_id === finding.id)

    return {
      ...finding,
      documentIds,
      fieldReferences
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


