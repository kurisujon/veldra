'use client'

import React, { useState, useTransition } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { runExtraction, updateDocumentField } from '../actions'
import { Check, X, Loader2, Edit2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

const EXTRACTION_STATUS_VARIANTS: Record<string, 'neutral' | 'primary' | 'success' | 'warning' | 'error'> = {
  Pending: 'neutral',
  Processing: 'primary',
  Extracted: 'primary',
  NeedsReview: 'warning',
  Reviewed: 'success',
  Failed: 'error',
}

export function ExtractionWorkspace({ 
  document, 
  documentUrl, 
  extraction 
}: { 
  document: any, 
  documentUrl: string | null, 
  extraction: any 
}) {
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()

  const handleRunExtraction = () => {
    startTransition(async () => {
      try {
        await runExtraction(document.id, document.case_id, document.type)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  const isPdf = document.mime_type === 'application/pdf'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl lg:h-[800px] h-auto">
      {/* Left Panel: Document Viewer */}
      <Card className="flex flex-col overflow-hidden h-[500px] lg:h-full">
        <div className="p-md border-b border-default bg-surface flex items-center justify-between">
          <span className="font-semibold text-small text-text-primary">Source Document</span>
          <Badge variant="primary">{document.type}</Badge>
        </div>
        <div className="flex-1 bg-background relative">
          {documentUrl ? (
            isPdf ? (
              <iframe src={`${documentUrl}#toolbar=0`} className="w-full h-full border-none" />
            ) : (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-md">
                <img src={documentUrl} alt="Document" className="max-w-full h-auto object-contain" />
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary text-small">
              No preview available
            </div>
          )}
        </div>
      </Card>

      {/* Right Panel: Extraction Fields */}
      <Card className="flex flex-col overflow-hidden h-[500px] lg:h-full">
        <div className="p-md border-b border-default bg-surface flex items-center justify-between">
          <span className="font-semibold text-small text-text-primary">Extracted Fields</span>
          {extraction && (
            <div className="flex items-center gap-sm">
              <Badge variant={EXTRACTION_STATUS_VARIANTS[extraction.status] || 'neutral'}>
                {extraction.status}
              </Badge>
              <Button 
                onClick={handleRunExtraction} 
                disabled={isPending}
                variant="secondary"
                className="py-xs px-sm text-small"
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-xs" />
                    Running...
                  </>
                ) : (
                  extraction.status === 'Failed' ? 'Run Extraction' : 'Re-run Extraction'
                )}
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-lg">
          {!extraction ? (
            <div className="flex flex-col items-center justify-center h-full gap-md text-center">
              <p className="text-text-secondary text-body">This document has not been extracted yet.</p>
              <Button onClick={handleRunExtraction} disabled={isPending}>
                {isPending ? <><Loader2 size={16} className="animate-spin mr-2" /> Extracting...</> : 'Run Extraction'}
              </Button>
            </div>
          ) : extraction.status === 'Failed' ? (
            <div className="flex flex-col items-center justify-center h-full gap-md text-center p-xl">
              <div className="p-md rounded-card bg-error/10 border border-error/20 text-error text-body max-w-md w-full">
                <p className="font-semibold mb-xs">Extraction Failed</p>
                <p className="text-small text-error-secondary break-words">{extraction.error_message || 'An unknown error occurred during extraction.'}</p>
              </div>
              <Button onClick={handleRunExtraction} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Extracting...
                  </>
                ) : (
                  'Retry Extraction'
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-lg">
              <div className="text-small text-text-secondary mb-md bg-background p-md rounded-md">
                Review the extracted values below. Accept correct values or input corrections manually.
              </div>
              
              {extraction.fields && extraction.fields.length > 0 ? (
                extraction.fields.map((field: any) => (
                  <FieldReviewRow key={field.id} field={field} path={pathname} />
                ))
              ) : (
                <div className="text-center text-text-secondary text-small py-xl">
                  No fields extracted.
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function FieldReviewRow({ field, path }: { field: any, path: string }) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(field.reviewed_value || field.normalized_value || field.raw_value)

  const handleAccept = () => {
    startTransition(async () => {
      await updateDocumentField({
        fieldId: field.id,
        reviewedValue: null, // Accepting means we are fine with normalized/raw
        status: 'Accepted',
        path
      })
    })
  }

  const handleSaveCorrection = () => {
    startTransition(async () => {
      await updateDocumentField({
        fieldId: field.id,
        reviewedValue: editValue,
        status: 'Corrected',
        path
      })
      setIsEditing(false)
    })
  }

  const handleReject = () => {
    startTransition(async () => {
      await updateDocumentField({
        fieldId: field.id,
        reviewedValue: null,
        status: 'Rejected',
        path
      })
    })
  }

  const isAcceptedOrCorrected = field.status === 'Accepted' || field.status === 'Corrected'
  const isRejected = field.status === 'Rejected'
  
  const displayValue = field.reviewed_value || field.normalized_value || field.raw_value

  let parsedJsonArray: any[] | null = null;
  if (!isEditing && displayValue && typeof displayValue === 'string' && displayValue.startsWith('[') && displayValue.endsWith(']')) {
    try {
      const parsed = JSON.parse(displayValue);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        parsedJsonArray = parsed;
      }
    } catch (e) {
      // Not a valid JSON array, fall back to string rendering
    }
  }

  return (
    <div className={`p-md rounded-card border ${isAcceptedOrCorrected ? 'border-accent-muted bg-surface/30' : isRejected ? 'border-error/30 bg-error/5' : 'border-default bg-surface'}`}>
      <div className="flex flex-col gap-xs mb-sm w-full overflow-hidden">
        <span className="text-small font-medium text-text-secondary uppercase tracking-wider">{field.field_name}</span>
        
        {isEditing ? (
          <textarea 
            className="w-full bg-background border border-accent-muted rounded-md p-sm text-body text-text-primary outline-none min-h-[100px] resize-y font-mono text-sm"
            value={editValue || ''}
            onChange={e => setEditValue(e.target.value)}
          />
        ) : parsedJsonArray ? (
          <div className="overflow-x-auto w-full mt-2 border border-default rounded-md bg-background">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-surface">
                <tr className="border-b border-default text-text-secondary">
                  {Object.keys(parsedJsonArray[0]).map(key => (
                    <th key={key} className="p-2 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedJsonArray.map((row, i) => (
                  <tr key={i} className="border-b border-default/50 last:border-none">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className={`p-2 ${isRejected ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                        {val || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <span className={`text-body ${isRejected ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
            {displayValue || ''}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-md">
        <Badge variant={field.status === 'NeedsReview' ? 'warning' : field.status === 'Rejected' ? 'error' : 'success'}>
          {field.status}
        </Badge>
        
        <div className="flex items-center gap-xs">
          {isEditing ? (
            <>
              <Button variant="primary" onClick={handleSaveCorrection} disabled={isPending}>Save</Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isPending}>Cancel</Button>
            </>
          ) : (
            <>
              {field.status === 'NeedsReview' && (
                <Button variant="secondary" onClick={handleAccept} disabled={isPending} className="text-green-500 border-green-500/20 hover:bg-green-500/10">
                  <Check size={16} /> Accept
                </Button>
              )}
              <Button variant="secondary" onClick={() => setIsEditing(true)} disabled={isPending || isRejected}>
                <Edit2 size={16} /> Edit
              </Button>
              {field.status !== 'Rejected' && (
                <Button variant="secondary" onClick={handleReject} disabled={isPending} className="text-red-500 border-red-500/20 hover:bg-red-500/10">
                  <X size={16} /> Reject
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
