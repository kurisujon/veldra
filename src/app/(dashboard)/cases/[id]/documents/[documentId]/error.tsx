'use client'
 
import { useEffect } from 'react'
import { PageContainer } from "@/components/layouts/PageContainer"
import { Button } from "@/components/ui/Button"
import { AlertTriangle } from "lucide-react"
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Document Review Page Error:', error)
  }, [error])
 
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Something went wrong!</h2>
        
        <div className="bg-red-50 text-red-900 border border-red-200 p-4 rounded-md my-6 text-left max-w-2xl w-full font-mono text-sm overflow-auto">
          <p className="font-semibold mb-2">Error Details:</p>
          <p>{error.message}</p>
          {error.digest && <p className="mt-2 text-xs opacity-80">Digest: {error.digest}</p>}
          {error.stack && (
            <pre className="mt-4 text-xs whitespace-pre-wrap">{error.stack}</pre>
          )}
        </div>
        
        <Button onClick={() => reset()} variant="primary">
          Try again
        </Button>
      </div>
    </PageContainer>
  )
}
