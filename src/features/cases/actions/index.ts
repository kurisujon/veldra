'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/types/database'

const CreateCaseSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')
});

type CaseRow = Database['public']['Tables']['cases']['Row']
type ApplicantRow = Database['public']['Tables']['applicants']['Row']
type CaseWithApplicants = CaseRow & { applicants: ApplicantRow[] }

export async function createCase(formData: FormData) {
  const parsed = CreateCaseSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    dateOfBirth: formData.get('dateOfBirth')
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const supabase = await createClient()
  const { data: newCaseId, error: rpcError } = await supabase.rpc('create_case_with_applicant', {
    p_first_name: parsed.data.firstName,
    p_last_name: parsed.data.lastName,
    p_date_of_birth: parsed.data.dateOfBirth
  });

  if (rpcError) throw new Error(rpcError.message)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    const role = userRoleData?.role || 'Reviewer'
    
    await supabase.from('activity_logs').insert({
      case_id: newCaseId,
      user_id: user.id,
      role: role,
      action_type: 'CASE_CREATED',
      description: `Created new case for ${parsed.data.firstName} ${parsed.data.lastName}`
    })
  }

  revalidatePath('/cases')
  return { id: newCaseId }
}

export async function getCases(): Promise<CaseWithApplicants[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cases')
    .select(`
      id, status, created_at, updated_at, deleted_at,
      applicants ( id, case_id, first_name, last_name, date_of_birth, created_at, updated_at )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getDeletedCases(): Promise<CaseWithApplicants[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cases')
    .select(`
      id, status, created_at, updated_at, deleted_at,
      applicants ( id, case_id, first_name, last_name, date_of_birth, created_at, updated_at )
    `)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getCaseById(id: string): Promise<CaseWithApplicants> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cases')
    .select(`
      id, status, created_at, updated_at, deleted_at,
      applicants ( id, case_id, first_name, last_name, date_of_birth, created_at, updated_at )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Not found')
  return data
}

export async function moveToTrashCase(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cases')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/cases')
  return { success: true }
}

export async function restoreCase(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cases')
    .update({ deleted_at: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/cases')
  return { success: true }
}

export async function permanentlyDeleteCase(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/cases')
  return { success: true }
}

const UpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['Draft', 'Uploaded', 'Processing', 'NeedsReview', 'Reviewed', 'DraftGenerated', 'ReadyForExport', 'Exported', 'Archived'])
})

export async function updateCaseStatus(id: string, status: CaseRow['status']) {
  const parsed = UpdateStatusSchema.safeParse({ id, status })
  if (!parsed.success) {
    throw new Error('Invalid input')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('cases')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)

  if (error) throw new Error(error.message)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    const role = userRoleData?.role || 'Reviewer'
    
    await supabase.from('activity_logs').insert({
      case_id: parsed.data.id,
      user_id: user.id,
      role: role,
      action_type: 'CASE_STATUS_UPDATED',
      description: `Case status updated to ${parsed.data.status}`
    })
  }

  revalidatePath(`/cases/${id}`)
  revalidatePath('/cases')
  return { success: true }
}

export async function deleteCase(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('cases').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/cases')
  return { success: true }
}
