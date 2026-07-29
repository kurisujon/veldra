'use client'

import React, { useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { analyzeDocuments } from '../actions'
import { toast } from 'react-hot-toast'

interface RunAnalysisButtonProps {
  caseId: string
}

export function RunAnalysisButton({ caseId }: RunAnalysisButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleRunAnalysis = () => {
    startTransition(async () => {
      try {
        const result = await analyzeDocuments(caseId)
        if (result && result.error) {
          toast.error(result.error)
        } else {
          toast.success('Analysis completed successfully')
        }
      } catch (err: any) {
        console.error('Failed to run analysis:', err)
        toast.error(err.message || 'An error occurred while running the analysis.')
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
