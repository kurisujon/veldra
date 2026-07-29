'use client'

import { useEffect } from 'react'
import { PageContainer } from '@/components/layouts/PageContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AlertOctagon, RefreshCcw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error Boundary Caught:', error)
  }, [error])

  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full p-2xl flex flex-col items-center text-center gap-lg border-error/20 bg-surface shadow-strong">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-sm">
            <AlertOctagon className="w-8 h-8" />
          </div>
          
          <div className="flex flex-col gap-xs">
            <h2 className="text-title font-semibold text-text-primary">Something went wrong</h2>
            <p className="text-body text-text-secondary">
              We encountered an unexpected error while loading this page. This could be due to a network issue or a temporary service disruption.
            </p>
          </div>

          <div className="bg-background rounded-md p-md w-full border border-text-secondary/10 overflow-hidden text-left">
            <p className="text-small font-mono text-text-secondary truncate">
              {error.message || 'Unknown error'}
            </p>
          </div>

          <Button 
            onClick={() => reset()} 
            variant="primary"
            className="w-full mt-sm flex items-center justify-center gap-sm"
          >
            <RefreshCcw size={16} />
            Try again
          </Button>
        </Card>
      </div>
    </PageContainer>
  )
}
