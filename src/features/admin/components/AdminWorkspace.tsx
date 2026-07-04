'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserPlus, Shield, User } from 'lucide-react'
import { createEmployeeAccount } from '../actions'

export function AdminWorkspace({ users }: { users: any[] }) {
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await createEmployeeAccount(formData)
      if (res.error) {
        setError(res.error)
      } else {
        setMessage('User created successfully.')
        setIsCreating(false)
        ;(e.target as HTMLFormElement).reset()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex justify-between items-center">
        <h2 className="text-body font-semibold text-text-primary">System Users</h2>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <UserPlus size={16} className="mr-sm" />
          Add User
        </Button>
      </div>

      {isCreating && (
        <Card className="p-xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-body font-medium text-text-primary mb-md">Create New Employee</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-small font-medium">Username</label>
                <input required name="username" type="text" className="border border-border rounded-button px-md py-sm" placeholder="johndoe" />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-small font-medium">Email</label>
                <input required name="email" type="email" className="border border-border rounded-button px-md py-sm" placeholder="john@veldra.com" />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-small font-medium">Password</label>
                <input required name="password" type="password" className="border border-border rounded-button px-md py-sm" placeholder="••••••••" minLength={6} />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-small font-medium">Role</label>
                <select required name="role" className="border border-border rounded-button px-md py-sm bg-background">
                  <option value="Reviewer">Reviewer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            {error && <p className="text-small text-error">{error}</p>}
            {message && <p className="text-small text-brand-primary">{message}</p>}

            <div className="flex justify-end gap-md mt-md">
              <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {users.map(u => (
          <Card key={u.user_id} className="p-lg flex items-center justify-between">
            <div className="flex items-center gap-md">
              <div className="p-md bg-surface-secondary rounded-full text-brand-primary">
                {u.role === 'Admin' ? <Shield size={24} /> : <User size={24} />}
              </div>
              <div>
                <p className="font-medium text-text-primary">{u.username || 'No username'}</p>
                <p className="text-small text-text-secondary">{u.email}</p>
              </div>
            </div>
            <div className="px-md py-xs rounded-full bg-surface-secondary text-xs font-medium text-text-primary">
              {u.role}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
