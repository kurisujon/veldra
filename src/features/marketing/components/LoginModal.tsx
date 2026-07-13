'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIdentifier('')
      setPassword('')
      setError(null)
      setLoading(false)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    let loginEmail = identifier

    if (!identifier.includes('@')) {
      const { data: emailData } = await supabase.rpc('get_email_by_username', {
        p_username: identifier
      })
      if (emailData) {
        loginEmail = emailData
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    })

    if (authError) {
      setError('Invalid login credentials')
      setLoading(false)
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
          router.push('/dashboard')
        }
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text-primary/30 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-sm bg-surface border border-text-secondary/10 rounded-modal shadow-modal flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-md right-md text-text-secondary hover:text-text-primary transition-colors p-xs rounded-button hover:bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Close login modal"
        >
          <X size={20} />
        </button>

        <div className="p-xl flex flex-col gap-md">
          {/* Brand */}
          <div className="flex flex-col items-center text-center mb-sm">
            <Image
              src="/veldra.png"
              alt="Veldra Logo"
              width={56}
              height={56}
              className="mb-sm object-contain"
            />
            <h2
              id="login-modal-title"
              className="text-heading font-semibold text-text-primary"
            >
              Sign in to Veldra
            </h2>
            <p className="text-small text-text-secondary mt-xs">
              Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label
                htmlFor="modal-identifier"
                className="text-small font-medium text-text-primary"
              >
                Email or Username
              </label>
              <input
                id="modal-identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin or user@example.com"
                autoComplete="username"
                className="w-full bg-background border border-border rounded-button px-md py-sm text-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label
                htmlFor="modal-password"
                className="text-small font-medium text-text-primary"
              >
                Password
              </label>
              <input
                id="modal-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-background border border-border rounded-button px-md py-sm text-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-small text-red-500 bg-red-500/10 border border-red-500/20 rounded-button px-md py-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white font-medium rounded-button px-md py-sm text-body hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
