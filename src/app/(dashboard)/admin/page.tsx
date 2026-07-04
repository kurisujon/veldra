import { getAllUsers, createEmployeeAccount } from '@/features/admin/actions'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (userRole?.role !== 'Admin') {
    redirect('/')
  }

  const users = await getAllUsers()

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-xs">
        <h1 className="text-heading font-semibold text-text-primary">Admin Dashboard</h1>
        <p className="text-body text-text-secondary">
          Manage user accounts and system access.
        </p>
      </div>

      <AdminWorkspace users={users} />
    </div>
  )
}
