'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/types/database'
import { compareNames } from '@/lib/comparison/compareNames'
import { compareDates } from '@/lib/comparison/compareDates'
import { compareAddresses } from '@/lib/comparison/compareAddresses'
import { compareTimeline } from '@/lib/comparison/compareTimeline'
import { runCaseVerification } from '@/lib/comparison/engine'
import type { DocumentMetadata, Sponsor } from '@/lib/comparison/types'

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

  if (!documents || documents.length === 0) {
    return { success: false, error: 'No documents uploaded. Please upload documents before running analysis.' }
  }

  // 3. Fetch Sponsors for this case
  const { data: sponsorsRaw } = await supabase
    .from('sponsors')
    .select('*')
    .eq('case_id', caseId)

  const sponsors: Sponsor[] = (sponsorsRaw ?? []).map((s) => ({
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    relationship: s.relationship
  }))

  // 4. Fetch DocumentFields for comparison
  const { data: fields, error: fieldsError } = await supabase
    .from('document_fields')
    .select('*')
    .eq('case_id', caseId)

  if (fieldsError) throw new Error(`Failed to fetch document fields: ${fieldsError.message}`)

  if (!fields || fields.length === 0) {
    return { success: false, error: 'Please extract and review the uploaded documents before running analysis.' }
  }

  // Build document metadata map for owner_type and sponsor_id lookup
  const documentMetadata: DocumentMetadata[] = (documents ?? []).map((d) => ({
    id: d.id,
    type: d.type || 'unknown',
    owner_type: (d.owner_type as 'applicant' | 'sponsor') ?? 'applicant',
    sponsor_id: d.sponsor_id ?? null
  }))

  // 5. Delete existing findings for this case (reset analysis)
  await supabase.from('findings').delete().eq('case_id', caseId)

  let discrepancyFound = false

  if (fields && fields.length > 0) {
    // Legacy applicant-only comparators
    const applicantFields = fields.filter((f) => {
      const meta = documentMetadata.find((d) => d.id === f.document_id)
      return !meta || meta.owner_type === 'applicant'
    })

    const legacyDiscrepancies = [
      ...compareNames(applicantFields as any),
      ...compareDates(applicantFields as any),
      ...compareAddresses(applicantFields as any),
      ...compareTimeline(applicantFields as any)
    ]

    // Phase 10: Three-Stage Verification Engine
    const engineResult = await runCaseVerification(caseId, fields as any, documentMetadata, sponsors)

    const discrepancies = [
      ...legacyDiscrepancies,
      ...engineResult.applicant.discrepancies,
      ...engineResult.sponsor.discrepancies
    ]

    for (const disc of discrepancies) {
      discrepancyFound = true

      // Determine finding_scope based on scope if available, else derive it
      let finding_scope = disc.scope || 'applicant_only'
      
      if (!disc.scope) {
        const metaA = documentMetadata.find((d) => d.id === disc.fieldA?.document_id)
        const metaB = documentMetadata.find((d) => d.id === disc.fieldB?.document_id)
        const ownerA = metaA?.owner_type ?? 'applicant'
        const ownerB = metaB?.owner_type ?? 'applicant'

        if (ownerA === 'sponsor' && ownerB === 'sponsor') finding_scope = 'sponsor_only'
        else if (ownerA !== ownerB) finding_scope = 'applicant_and_sponsor'
      }

      const { data: finding, error: insertError } = await supabase
        .from('findings')
        .insert({
          case_id: caseId,
          title: disc.title,
          description: disc.description,
          severity: disc.severity,
          category: disc.category,
          finding_scope,
          status: 'Open'
        })
        .select()
        .single()

      if (insertError) throw new Error(`Failed to insert finding: ${insertError.message}`)

      // Link documents to finding
      const findingDocs = []
      if (disc.fieldA?.document_id) {
        findingDocs.push({ finding_id: finding.id, document_id: disc.fieldA.document_id })
      }
      if (disc.fieldB?.document_id && disc.fieldB.document_id !== disc.fieldA?.document_id) {
        findingDocs.push({ finding_id: finding.id, document_id: disc.fieldB.document_id })
      }
      
      if (findingDocs.length > 0) {
        await supabase.from('finding_documents').insert(findingDocs)
      }

      // Link document fields to finding
      const findingFieldRefs = []
      if (disc.fieldA) {
        findingFieldRefs.push({ finding_id: finding.id, document_field_id: disc.fieldA.id, document_id: disc.fieldA.document_id, role: 'source_a' })
      }
      if (disc.fieldB) {
        findingFieldRefs.push({ finding_id: finding.id, document_field_id: disc.fieldB.id, document_id: disc.fieldB.document_id, role: 'source_b' })
      }
      
      if (findingFieldRefs.length > 0) {
        await supabase.from('finding_field_references').insert(findingFieldRefs as any)
      }
    }

    // Persist comparison_results from the Phase 10 engine
    const comparisonResults = [
      ...engineResult.applicant.results,
      ...engineResult.sponsor.results
    ]

    if (comparisonResults.length > 0) {
      const { error: insertError } = await supabase
        .from('comparison_results')
        .insert(comparisonResults.map(cr => ({
          case_id: cr.case_id,
          comparison_scope: cr.comparison_scope,
          rule_code: cr.rule_code,
          left_document_id: cr.left_document_id,
          right_document_id: cr.right_document_id,
          field_name: cr.field_name,
          left_value: cr.left_value,
          right_value: cr.right_value,
          left_normalized: cr.left_normalized,
          right_normalized: cr.right_normalized,
          status: cr.status,
          severity: cr.severity,
          explanation: cr.explanation,
          method: cr.method
        })))
        
      if (insertError) {
        console.error('Failed to insert comparison results:', insertError)
      }
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

export async function getComparisonResultsByCase(caseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comparison_results')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comparison results:', error)
    return []
  }

  return data
}

export async function getSponsorRelationshipsByCase(caseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsor_relationships')
    .select('*, relationship_evidence(*)')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sponsor relationships:', error)
    return []
  }

  return data
}
