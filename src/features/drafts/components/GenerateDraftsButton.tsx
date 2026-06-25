'use client'

import React, { useState, useTransition } from 'react'
import { generateDrafts } from '@/features/drafts/actions'

interface GenerateDraftsButtonProps {
  caseId: string
}

export function GenerateDraftsButton({ caseId }: GenerateDraftsButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleGenerate = () => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await generateDrafts(caseId)
        if (!result.success) throw new Error('Generation failed')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate drafts')
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-xs">
      <button
        id={`generate-drafts-${caseId}`}
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="rounded-button px-lg py-sm text-small font-semibold bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {isPending ? 'Generating Drafts…' : 'Generate Drafts'}
      </button>
      {error && (
        <p className="text-small text-error font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
