'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEmployeeAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const role = formData.get('role') as string

  if (!email || !password || !username || !role) {
    return { error: 'All fields are required' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  // Use SECURITY DEFINER RPC — no legacy JWT key needed
  const { data, error } = await supabase.rpc('create_employee_account', {
    p_email: email,
    p_password: password,
    p_username: username,
    p_role: role,
  })

  if (error) {
    return { error: error.message }
  }

  const result = data as { success?: boolean; error?: string; user_id?: string }

  if (result?.error) {
    return { error: result.error }
  }

  revalidatePath('/admin')
  return { success: true }
}


export async function getAllUsers() {
  const supabase = await createClient()

  // Use SECURITY DEFINER RPC — no legacy JWT needed, works with new Supabase secret keys
  const { data, error } = await supabase.rpc('get_all_employees')

  if (error) {
    console.error('getAllUsers error:', error.message)
    return []
  }

  return data ?? []
}
