'use client'

import React, { useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { updateCaseStatus } from '@/features/cases/actions'
import { CheckCircle } from 'lucide-react'

export function CompleteReviewButton({ 
  caseId, 
  disabled = false 
}: { 
  caseId: string; 
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition()

  const handleComplete = () => {
    startTransition(async () => {
      try {
        await updateCaseStatus(caseId, 'Reviewed')
      } catch (err) {
        console.error('Failed to complete review:', err)
      }
    })
  }

  return (
    <Button
      variant="primary"
      onClick={handleComplete}
      disabled={disabled || isPending}
      className="w-full gap-xs justify-center"
    >
      <CheckCircle size={16} />
      {isPending ? 'Completing...' : 'Complete Review'}
    </Button>
  )
}
