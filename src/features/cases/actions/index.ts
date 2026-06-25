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

  revalidatePath('/cases')
  return { id: newCaseId }
}

export async function getCases(): Promise<CaseWithApplicants[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cases')
    .select(`
      id, status, created_at, updated_at,
      applicants ( id, case_id, first_name, last_name, date_of_birth, created_at, updated_at )
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getCaseById(id: string): Promise<CaseWithApplicants> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cases')
    .select(`
      id, status, created_at, updated_at,
      applicants ( id, case_id, first_name, last_name, date_of_birth, created_at, updated_at )
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Not found')
  return data
}
