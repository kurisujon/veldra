'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const AddSponsorSchema = z.object({
  case_id: z.string().uuid(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  relationship: z.string().min(1, "Relationship is required"),
})

export async function addSponsor(input: z.infer<typeof AddSponsorSchema>) {
  const result = AddSponsorSchema.safeParse(input)
  if (!result.success) {
    return { error: 'Invalid input data' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('add_sponsor_to_case', {
    p_case_id: result.data.case_id,
    p_first_name: result.data.first_name,
    p_last_name: result.data.last_name,
    p_relationship: result.data.relationship
  })

  if (error) {
    return { error: (error instanceof Error ? error.message : String(error)) }
  }

  revalidatePath(`/cases/${result.data.case_id}`)
  return { data }
}

export async function getSponsorsByCase(caseId: string) {
  const parsed = z.string().uuid().safeParse(caseId)
  if (!parsed.success) throw new Error('Invalid case ID')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('case_id', parsed.data)
    .order('created_at', { ascending: true })

  if (error) throw new Error((error instanceof Error ? error.message : String(error)))
  return data ?? []
}
