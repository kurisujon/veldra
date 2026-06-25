'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/types/database'

const GenerateDraftsSchema = z.object({
  caseId: z.string().uuid()
})

const UpdateDraftContentSchema = z.object({
  draftId: z.string().uuid(),
  content: z.string().min(1, 'Content cannot be empty')
})

const FinalizeDraftSchema = z.object({
  draftId: z.string().uuid(),
  caseId: z.string().uuid()
})

const GetDraftsByCaseSchema = z.object({
  caseId: z.string().uuid()
})

export async function generateDrafts(caseId: string) {
  const parsed = GenerateDraftsSchema.safeParse({ caseId })
  if (!parsed.success) throw new Error('Invalid case ID')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userRoleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = userRoleData?.role || 'Reviewer'

  // 1. Fetch all Accepted findings for this case
  const { data: findings, error: findingsError } = await supabase
    .from('findings')
    .select('*')
    .eq('case_id', parsed.data.caseId)
    .eq('status', 'Accepted')

  if (findingsError) throw new Error(`Failed to fetch findings: ${findingsError.message}`)
  if (!findings || findings.length === 0) throw new Error('No accepted findings to generate drafts from')

  // 2. Delete existing drafts for this case (reset generation)
  await supabase.from('generated_drafts').delete().eq('case_id', parsed.data.caseId)

  // 3. Generate drafts based on finding severity and category
  const nameMismatches = findings.filter(
    (f) => f.severity === 'High' && f.category === 'Name Mismatch'
  )
  const addressFindings = findings.filter(
    (f) => f.severity === 'Medium' && f.category === 'Address Mismatch'
  )
  const gapFindings = findings.filter(
    (f) => f.severity === 'Medium' && f.category === 'School Gap'
  )

  const generatedDraftIds: Array<{ draftId: string; findingIds: string[] }> = []

  // Generate Affidavit for High-severity Name Mismatches
  if (nameMismatches.length > 0) {
    const content = `
<h2>AFFIDAVIT OF DISCREPANCY</h2>
<p>I, the undersigned applicant, hereby attest and declare the following:</p>
<p>A discrepancy has been identified in the spelling of my name across the submitted documents.</p>
<ul>
  ${nameMismatches.map((f) => `<li><strong>${f.title}:</strong> ${f.description}</li>`).join('\n  ')}
</ul>
<p>I affirm that all discrepancies noted above refer to one and the same person, and that the difference is due to a typographical inconsistency and not a different identity.</p>
<p>IN WITNESS WHEREOF, I have hereunto set my hand this _____ day of __________, 20____.</p>
<p>____________________________<br/>Signature of Affiant</p>
<p>SUBSCRIBED AND SWORN to before me this _____ day of __________, 20____, in _______________.</p>
<p>____________________________<br/>Notary Public</p>
`.trim()

    const { data: draft, error: draftError } = await supabase
      .from('generated_drafts')
      .insert({ case_id: parsed.data.caseId, type: 'Affidavit', content, status: 'Draft' })
      .select()
      .single()

    if (draftError) throw new Error(`Failed to create affidavit draft: ${draftError.message}`)
    generatedDraftIds.push({ draftId: draft.id, findingIds: nameMismatches.map((f) => f.id) })
  }

  // Generate Address Explanation Letter for Medium-severity Address Mismatches
  if (addressFindings.length > 0) {
    const content = `
<h2>EXPLANATION LETTER — ADDRESS DISCREPANCY</h2>
<p>To Whom It May Concern,</p>
<p>I am writing to formally explain the discrepancy in the residential address appearing across my submitted documents.</p>
<ul>
  ${addressFindings.map((f) => `<li><strong>${f.title}:</strong> ${f.description}</li>`).join('\n  ')}
</ul>
<p>I confirm that the addresses stated in my documents refer to my place of residence at different points in time. The differences are attributable to a change of residence and not a falsification of documents.</p>
<p>I hope this explanation satisfactorily addresses the noted concern.</p>
<p>Respectfully yours,</p>
<p>____________________________<br/>Applicant Signature</p>
`.trim()

    const { data: draft, error: draftError } = await supabase
      .from('generated_drafts')
      .insert({ case_id: parsed.data.caseId, type: 'AddressLetter', content, status: 'Draft' })
      .select()
      .single()

    if (draftError) throw new Error(`Failed to create address letter: ${draftError.message}`)
    generatedDraftIds.push({ draftId: draft.id, findingIds: addressFindings.map((f) => f.id) })
  }

  // Generate Gap Explanation Letter for School Gap findings
  if (gapFindings.length > 0) {
    const content = `
<h2>EXPLANATION LETTER — ACADEMIC GAP</h2>
<p>To Whom It May Concern,</p>
<p>I am writing to explain the gap identified in my academic records as noted in the review of my submitted documents.</p>
<ul>
  ${gapFindings.map((f) => `<li><strong>${f.title}:</strong> ${f.description}</li>`).join('\n  ')}
</ul>
<p>The gap in my academic records occurred due to personal circumstances at the time. I was not enrolled during this period, and I hereby affirm that this is an accurate representation of my academic history.</p>
<p>Respectfully yours,</p>
<p>____________________________<br/>Applicant Signature</p>
`.trim()

    const { data: draft, error: draftError } = await supabase
      .from('generated_drafts')
      .insert({ case_id: parsed.data.caseId, type: 'GapLetter', content, status: 'Draft' })
      .select()
      .single()

    if (draftError) throw new Error(`Failed to create gap letter: ${draftError.message}`)
    generatedDraftIds.push({ draftId: draft.id, findingIds: gapFindings.map((f) => f.id) })
  }

  // 4. Link findings to drafts via draft_findings join table
  for (const { draftId, findingIds } of generatedDraftIds) {
    const links = findingIds.map((findingId) => ({ draft_id: draftId, finding_id: findingId }))
    const { error: linkError } = await supabase.from('draft_findings').insert(links)
    if (linkError) throw new Error(`Failed to link findings to draft: ${linkError.message}`)
  }

  // 5. Update case status to DraftGenerated
  await supabase.from('cases').update({ status: 'DraftGenerated' }).eq('id', parsed.data.caseId)

  // 6. Log activity
  await supabase.from('activity_logs').insert({
    case_id: parsed.data.caseId,
    user_id: user.id,
    role,
    action_type: 'DRAFTS_GENERATED',
    description: `${generatedDraftIds.length} legal draft(s) generated from accepted findings.`
  })

  revalidatePath(`/cases/${parsed.data.caseId}`)
  return { success: true, count: generatedDraftIds.length }
}

export async function updateDraftContent(draftId: string, content: string) {
  const parsed = UpdateDraftContentSchema.safeParse({ draftId, content })
  if (!parsed.success) throw new Error('Invalid input: ' + parsed.error.message)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: draft, error } = await supabase
    .from('generated_drafts')
    .update({ content: parsed.data.content, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.draftId)
    .select('case_id')
    .single()

  if (error) throw new Error(`Failed to update draft: ${error.message}`)

  revalidatePath(`/cases/${draft.case_id}`)
  return { success: true }
}

export async function finalizeDraft(draftId: string, caseId: string) {
  const parsed = FinalizeDraftSchema.safeParse({ draftId, caseId })
  if (!parsed.success) throw new Error('Invalid input')

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
    .from('generated_drafts')
    .update({ status: 'Finalized', updated_at: new Date().toISOString() })
    .eq('id', parsed.data.draftId)

  if (error) throw new Error(`Failed to finalize draft: ${error.message}`)

  await supabase.from('activity_logs').insert({
    case_id: parsed.data.caseId,
    user_id: user.id,
    role,
    action_type: 'DRAFT_FINALIZED',
    description: 'A legal draft has been finalized.'
  })

  revalidatePath(`/cases/${parsed.data.caseId}`)
  return { success: true }
}

export async function getDraftsByCase(caseId: string) {
  const parsed = GetDraftsByCaseSchema.safeParse({ caseId })
  if (!parsed.success) throw new Error('Invalid case ID')

  const supabase = await createClient()

  const { data: drafts, error: draftsError } = await supabase
    .from('generated_drafts')
    .select('*')
    .eq('case_id', parsed.data.caseId)
    .order('created_at', { ascending: true })

  if (draftsError) throw new Error(`Failed to fetch drafts: ${draftsError.message}`)
  if (!drafts || drafts.length === 0) return []

  const draftIds = drafts.map((d) => d.id)
  const { data: links, error: linksError } = await supabase
    .from('draft_findings')
    .select('draft_id, finding_id')
    .in('draft_id', draftIds)

  if (linksError) throw new Error(`Failed to fetch draft findings: ${linksError.message}`)

  return drafts.map((draft) => ({
    ...draft,
    findingIds: (links || [])
      .filter((l) => l.draft_id === draft.id)
      .map((l) => l.finding_id)
  }))
}
