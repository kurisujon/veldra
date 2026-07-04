'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    let loginEmail = identifier

    // If identifier doesn't look like an email, assume it's a username
    if (!identifier.includes('@')) {
      const { data: emailData, error: rpcError } = await supabase.rpc('get_email_by_username', {
        p_username: identifier
      })

      if (emailData) {
        loginEmail = emailData
      }
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
    if (error) {
      setError("Invalid login credentials")
    } else {
      if (authData?.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single()
        
        if (roleData?.role === 'Admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
      } else {
        router.push('/')
      }
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-md">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-surface border border-border rounded-card p-xl shadow-sm">
          {/* Logo / Brand */}
          <div className="text-center mb-xl flex flex-col items-center">
            <Image src="/veldra.png" alt="Veldra Logo" width={120} height={120} className="mb-sm object-contain" />
            <h1 className="text-title font-semibold text-text-primary">Veldra</h1>
            <p className="text-body text-text-secondary mt-xs">Document Verification Platform</p>
          </div>

          <h2 className="text-heading font-semibold text-text-primary mb-xs text-center">
            Sign in
          </h2>
          <p className="text-small text-text-secondary mb-xl text-center">
            Enter your credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label htmlFor="identifier" className="text-small font-medium text-text-primary">
                Email or Username
              </label>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin or user@example.com"
                className="w-full bg-background border border-border rounded-button px-md py-sm text-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label htmlFor="password" className="text-small font-medium text-text-primary">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-button px-md py-sm text-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-small text-red-500 bg-red-500/10 border border-red-500/20 rounded-button px-md py-sm">
                {error}
              </p>
            )}

            <button
              id="submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white font-medium rounded-button px-md py-sm text-body hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
