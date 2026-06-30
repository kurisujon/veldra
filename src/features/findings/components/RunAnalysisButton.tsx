'use client'

import React, { useTransition, useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { analyzeDocuments } from '../actions'
import { AlertCircle, X } from 'lucide-react'

interface RunAnalysisButtonProps {
  caseId: string
}

export function RunAnalysisButton({ caseId }: RunAnalysisButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Auto-hide the error message after 5 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMsg])

  const handleRunAnalysis = () => {
    setErrorMsg(null)
    startTransition(async () => {
      try {
        const result = await analyzeDocuments(caseId)
        if (result && result.error) {
          setErrorMsg(result.error)
        }
      } catch (err: any) {
        console.error('Failed to run analysis:', err)
        setErrorMsg(err.message || 'An error occurred while running the analysis.')
      }
    })
  }

  return (
    <>
      <Button
        variant="primary"
        disabled={isPending}
        onClick={handleRunAnalysis}
        data-testid="run-analysis-btn"
      >
        {isPending ? 'Running Analysis...' : 'Run Analysis'}
      </Button>

      {/* Floating Error Message (Toast) */}
      {errorMsg && (
        <div className="fixed bottom-lg right-lg max-w-sm bg-surface shadow-strong rounded-card p-md border border-error/20 flex items-start gap-md z-50 animate-in fade-in slide-in-from-bottom-5">
          <AlertCircle className="text-error w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="text-small font-semibold text-text-primary mb-1">Analysis Failed</h4>
            <p className="text-small text-text-secondary">{errorMsg}</p>
          </div>
          <button 
            onClick={() => setErrorMsg(null)}
            className="text-text-secondary hover:text-text-primary transition-colors shrink-0"
            aria-label="Close message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}
