'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEmployeeAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Verify caller is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (userRole?.role !== 'Admin') return { error: 'Forbidden: Admin access required' }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const role = formData.get('role') as string

  if (!email || !password || !username || !role) {
    return { error: 'All fields are required' }
  }

  const adminClient = createAdminClient()

  // 1. Create auth user
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    return { error: createError.message }
  }

  if (!newUser.user) {
    return { error: 'Failed to create user' }
  }

  // 2. Insert into user_roles (this table might have RLS, so service role bypasses it)
  const { error: roleError } = await adminClient
    .from('user_roles')
    .insert({
      user_id: newUser.user.id,
      role: role as any,
      username: username,
    })

  if (roleError) {
    // Attempt to rollback
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return { error: roleError.message }
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
