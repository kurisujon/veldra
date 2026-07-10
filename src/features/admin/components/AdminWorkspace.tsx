'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserPlus, Shield, User, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react'
import { createEmployeeAccount, deleteEmployeeAccount } from '../actions'
import { ConfirmDeleteModal } from '@/components/ui/Modal/ConfirmDeleteModal'

export function AdminWorkspace({ users }: { users: any[] }) {
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Auto-dismiss messages
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message, error])

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

  async function handleConfirmDelete() {
    if (!userToDelete) return
    
    setDeletingId(userToDelete)
    setError(null)
    setMessage(null)

    try {
      const res = await deleteEmployeeAccount(userToDelete)
      if (res.error) {
        setError(res.error)
      } else {
        setMessage('User deleted successfully.')
        setUserToDelete(null)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    }
    setDeletingId(null)
  }

  return (
    <div className="flex flex-col gap-xl relative">
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user account? This action cannot be undone."
        isDeleting={!!deletingId}
      />

      {/* Floating Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-sm pointer-events-none">
        {error && (
          <div className="bg-white border-l-4 border-error shadow-lg rounded-md p-md flex items-start gap-md animate-in slide-in-from-right-8 pointer-events-auto min-w-[300px]">
            <AlertCircle className="text-error mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-small font-semibold text-text-primary">Error</h4>
              <p className="text-small text-text-secondary mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-text-secondary hover:text-text-primary">
              <X size={16} />
            </button>
          </div>
        )}
        {message && (
          <div className="bg-white border-l-4 border-success shadow-lg rounded-md p-md flex items-start gap-md animate-in slide-in-from-right-8 pointer-events-auto min-w-[300px]">
            <CheckCircle className="text-success mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-small font-semibold text-text-primary">Success</h4>
              <p className="text-small text-text-secondary mt-0.5">{message}</p>
            </div>
            <button onClick={() => setMessage(null)} className="text-text-secondary hover:text-text-primary">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-h3 font-bold text-text-primary">System Users</h2>
          <p className="text-small text-text-secondary mt-xs">Manage employee access and roles across the Veldra platform.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="shadow-sm hover:shadow transition-all">
          <UserPlus size={16} className="mr-sm" />
          Add User
        </Button>
      </div>

      {isCreating && (
        <Card className="p-xl animate-in fade-in slide-in-from-top-4 border border-brand-primary/20 shadow-md">
          <h3 className="text-body font-semibold text-text-primary mb-lg flex items-center gap-sm">
            <UserPlus size={20} className="text-brand-primary" />
            Create New Employee
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="flex flex-col gap-xs">
                <label className="text-small font-medium text-text-secondary">Username</label>
                <input required name="username" type="text" className="border border-border rounded-button px-md py-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all bg-background" placeholder="johndoe" />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-small font-medium text-text-secondary">Email Address</label>
                <input required name="email" type="email" className="border border-border rounded-button px-md py-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all bg-background" placeholder="john@veldra.com" />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-small font-medium text-text-secondary">Temporary Password</label>
                <input required name="password" type="password" className="border border-border rounded-button px-md py-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all bg-background" placeholder="••••••••" minLength={6} />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-small font-medium text-text-secondary">System Role</label>
                <select required name="role" className="border border-border rounded-button px-md py-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all bg-background cursor-pointer">
                  <option value="Reviewer">Reviewer (Standard Access)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-md pt-sm border-t border-border mt-sm">
              <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="min-w-[140px]">
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-md">
        {users.map(u => (
          <Card key={u.user_id} className="p-lg flex flex-col gap-md hover:border-brand-primary/30 transition-colors group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-md">
                <div className={`p-md rounded-full flex items-center justify-center ${u.role === 'Admin' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-surface-secondary text-text-secondary'}`}>
                  {u.role === 'Admin' ? <Shield size={24} /> : <User size={24} />}
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-body">{u.username || 'No username'}</p>
                  <p className="text-small text-text-secondary mt-1">{u.email}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-sm border-t border-border/50 w-full mt-auto">
              <div className="px-md py-xs rounded-full bg-surface-secondary text-xs font-medium text-text-primary flex items-center gap-xs">
                <div className={`w-2 h-2 rounded-full ${u.role === 'Admin' ? 'bg-brand-primary' : 'bg-success'}`}></div>
                {u.role}
              </div>
              <div className="flex items-center gap-sm">
                <p className="text-xs text-text-secondary">
                  Joined {new Date(u.created_at).toLocaleDateString()}
                </p>
                <button 
                  onClick={() => setUserToDelete(u.user_id)}
                  disabled={deletingId === u.user_id}
                  className="p-sm rounded-md text-text-secondary hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Delete User"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        
        {users.length === 0 && (
          <div className="col-span-full p-xl text-center border-2 border-dashed border-border rounded-lg text-text-secondary">
            No employees found in the system.
          </div>
        )}
      </div>
    </div>
  )
}


