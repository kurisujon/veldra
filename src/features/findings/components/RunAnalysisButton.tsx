'use client'

import React, { useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { analyzeDocuments } from '../actions'

interface RunAnalysisButtonProps {
  caseId: string
}

export function RunAnalysisButton({ caseId }: RunAnalysisButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleRunAnalysis = () => {
    startTransition(async () => {
      try {
        await analyzeDocuments(caseId)
      } catch (err) {
        console.error('Failed to run analysis:', err)
      }
    })
  }

  return (
    <Button
      variant="primary"
      disabled={isPending}
      onClick={handleRunAnalysis}
      data-testid="run-analysis-btn"
    >
      {isPending ? 'Running Analysis...' : 'Run Analysis'}
    </Button>
  )
}
