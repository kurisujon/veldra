'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Account created! Check your email to confirm, then log in.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-md">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-surface border border-border rounded-card p-xl">
          {/* Logo / Brand */}
          <div className="text-center mb-xl flex flex-col items-center">
            <Image src="/veldra.png" alt="Veldra Logo" width={120} height={120} className="mb-sm object-contain" />
            <h1 className="text-title font-semibold text-text-primary">Veldra</h1>
            <p className="text-body text-text-secondary mt-xs">Document Verification Platform</p>
          </div>

          <h2 className="text-heading font-semibold text-text-primary mb-xs text-center">
            {isSignUp ? 'Create an account' : 'Sign in'}
          </h2>
          <p className="text-small text-text-secondary mb-xl text-center">
            {isSignUp
              ? 'Sign up to access the verification workspace.'
              : 'Enter your credentials to continue.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label htmlFor="email" className="text-small font-medium text-text-primary">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
              <p className="text-small text-red-400 bg-red-400/10 border border-red-400/20 rounded-button px-md py-sm">
                {error}
              </p>
            )}

            {message && (
              <p className="text-small text-green-400 bg-green-400/10 border border-green-400/20 rounded-button px-md py-sm">
                {message}
              </p>
            )}

            <button
              id="submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white font-medium rounded-button px-md py-sm text-body hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-lg text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
              className="text-small text-text-secondary hover:text-accent transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
