'use client'

import React, { useState, useTransition } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { runExtraction, updateDocumentField } from '../actions'
import { Check, X, Loader2, Edit2, AlertTriangle, Eye, FileText, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [mobileTab, setMobileTab] = useState<'document' | 'extraction'>('extraction')

  const handleRunExtraction = () => {
    startTransition(async () => {
      try {
        const result = await runExtraction(document.id, document.case_id, document.type)
        if (result && 'success' in result && !result.success) {
          alert(result.error || 'Unknown extraction error')
        }
      } catch (err: unknown) {
        alert((err instanceof Error ? err.message : String(err)))
      }
    })
  }

  const isPdf = document.mime_type === 'application/pdf'

  return (
    <div className="flex flex-col gap-md">
      {/* Mobile Header with Tabs and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md lg:hidden">
        <div className="flex bg-surface p-xs rounded-lg border border-default w-full sm:w-auto">
          <button
            className={`flex-1 sm:flex-none px-md py-sm text-center text-small font-medium rounded-md transition-colors ${mobileTab === 'document' ? 'bg-background text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            onClick={() => setMobileTab('document')}
          >
            Source Document
          </button>
          <button
            className={`flex-1 sm:flex-none px-md py-sm text-center text-small font-medium rounded-md transition-colors ${mobileTab === 'extraction' ? 'bg-background text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            onClick={() => setMobileTab('extraction')}
          >
            Extracted Fields
          </button>
        </div>

        {/* Global actions on mobile */}
        {extraction && (
           <div className="flex items-center gap-sm w-full sm:w-auto justify-end">
             <Badge variant={EXTRACTION_STATUS_VARIANTS[extraction.status] || 'neutral'}>
               {extraction.status}
             </Badge>
             <Button 
               onClick={handleRunExtraction} 
               disabled={isPending}
               variant="secondary"
               className="py-xs px-sm text-small whitespace-nowrap"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl lg:h-[800px] h-auto">
        {/* Left Panel: Document Viewer */}
        <Card className={`flex-col overflow-hidden h-[500px] lg:h-full ${mobileTab === 'document' ? 'flex' : 'hidden lg:flex'}`}>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
        <Card className={`flex-col overflow-hidden h-[500px] lg:h-full ${mobileTab === 'extraction' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-md border-b border-default bg-surface flex items-center justify-between">
            <span className="font-semibold text-small text-text-primary">Extracted Fields</span>
            {/* Desktop only actions */}
            {extraction && (
              <div className="hidden lg:flex items-center gap-sm">
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
                {/* On Mobile the button is in the top header, but we keep this here as it's the primary call to action in empty state */}
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
    </div>
  )
}

function FieldReviewRow({ field, path }: { field: any, path: string }) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(field.reviewed_value || field.normalized_value || field.raw_value)
  const [isSourceExpanded, setIsSourceExpanded] = useState(false)

  const evidenceStatus = field.evidence_status || field?.metadata?.evidence_status
  const confidence = field.confidence_score ?? field?.metadata?.confidence_score
  const pageNumber = field.page_number ?? field?.metadata?.page_number
  const sourceText = field.source_text ?? field?.metadata?.source_text

  const handleAccept = () => {
    startTransition(async () => {
      await updateDocumentField({
        fieldId: field.id,
        action: 'accept',
        path
      })
    })
  }

  const handleSaveCorrection = () => {
    startTransition(async () => {
      await updateDocumentField({
        fieldId: field.id,
        action: 'correct',
        correctedValue: editValue,
        path
      })
      setIsEditing(false)
    })
  }

  const handleReject = () => {
    startTransition(async () => {
      await updateDocumentField({
        fieldId: field.id,
        action: 'reject',
        path
      })
    })
  }

  const isAcceptedOrCorrected = field.state === 'verified'
  const isRejected = field.state === 'not_present' || field.state === 'unreadable' || field.state === 'ambiguous' || field.status === 'Rejected'
  
  const displayValue = field.reviewed_value || field.normalized_value || field.raw_value

  let parsedJsonArray: any[] | null = null;
  if (!isEditing && displayValue && typeof displayValue === 'string' && displayValue.startsWith('[') && displayValue.endsWith(']')) {
    try {
      const parsed = JSON.parse(displayValue);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && !Array.isArray(parsed[0])) {
        parsedJsonArray = parsed;
      }
    } catch (e) {
      // Not a valid JSON array, fall back to string rendering
    }
  }

  return (
    <div className={`p-md rounded-card border ${isAcceptedOrCorrected ? 'border-accent-muted bg-surface/30' : isRejected ? 'border-error/30 bg-error/5' : 'border-default bg-surface'}`}>
      <div className="flex flex-col gap-xs mb-sm w-full overflow-hidden">
        <span className="text-small font-medium text-text-secondary capitalize tracking-wider">
          {field.field_name.replace(/([a-z])([A-Z])/g, '$1 $2')}
        </span>
        
        <div className="flex flex-wrap items-center gap-sm text-xs text-text-secondary mb-xs">
          {field.state && (
            <div className={`flex items-center gap-xs ${
              field.state === 'verified' ? 'text-green-600' : 
              field.state === 'candidate' ? 'text-amber-500' : 
              'text-red-500'
            }`}>
              {field.state === 'verified' ? <Check size={12} /> :
               field.state === 'candidate' ? <AlertTriangle size={12} /> :
               <X size={12} />}
              <span className="font-medium capitalize">{field.state.replace('_', ' ')}</span>
            </div>
          )}
          {field.metadata?.reliability && (
            <>
              {field.metadata.reliability.ocrConfidence !== null && (
                <div className="flex items-center gap-xs border-l border-default pl-sm">
                  <span>OCR: {Math.round(field.metadata.reliability.ocrConfidence * 100)}%</span>
                </div>
              )}
              {field.metadata.reliability.profileRisk && (
                <div className="flex items-center gap-xs border-l border-default pl-sm">
                  <span className={`capitalize ${field.metadata.reliability.profileRisk === 'high' ? 'text-red-500 font-semibold' : ''}`}>
                    {field.metadata.reliability.profileRisk} Risk
                  </span>
                </div>
              )}
              {field.metadata.reliability.evidenceCoverage && (
                <div className="flex items-center gap-xs border-l border-default pl-sm">
                  <span className="capitalize">{field.metadata.reliability.evidenceCoverage} Evidence</span>
                </div>
              )}
              {field.metadata.reliability.extractionConsistency && field.metadata.reliability.extractionConsistency !== 'single_model' && (
                <div className="flex items-center gap-xs border-l border-default pl-sm">
                  <span className="capitalize">{field.metadata.reliability.extractionConsistency.replace(/_/g, ' ')}</span>
                </div>
              )}
            </>
          )}
          {!field.metadata?.reliability && confidence !== undefined && (
            <div className="flex items-center gap-xs border-l border-default pl-sm">
              <span>{typeof confidence === 'number' && confidence <= 1 ? `${Math.round(confidence * 100)}%` : `${confidence}%`}</span>
            </div>
          )}
          {pageNumber !== undefined && (
            <div className="flex items-center gap-xs border-l border-default pl-sm">
              <FileText size={12} /> <span>Page {pageNumber}</span>
            </div>
          )}
        </div>
        
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
                {parsedJsonArray.map((row, i) => {
                  if (!row || typeof row !== 'object') return null;
                  return (
                    <tr key={i} className="border-b border-default/50 last:border-none">
                      {Object.values(row).map((val: any, j) => {
                        const displayVal = typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
                        return (
                          <td key={j} className={`p-2 ${isRejected ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                            {displayVal || '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <span className={`text-body ${isRejected ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
            {displayValue || ''}
          </span>
        )}

        {/* Source Text Section */}
        {sourceText && sourceText !== displayValue && !isEditing && (
          <div className="mt-xs">
            <button 
              onClick={() => setIsSourceExpanded(!isSourceExpanded)}
              className="flex items-center gap-xs text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              {isSourceExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Source text
            </button>
            {isSourceExpanded && (
              <div className="mt-xs p-sm bg-background border border-default rounded-md text-xs font-mono text-text-secondary break-words">
                {sourceText}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-md gap-sm sm:gap-0">
        <Badge variant={field.state === 'candidate' ? 'warning' : isRejected ? 'error' : 'success'}>
          {field.state === 'candidate' ? 'Needs Review' : field.state}
        </Badge>
        
        <div className="flex items-center gap-xs w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {isEditing ? (
            <>
              <Button variant="primary" onClick={handleSaveCorrection} disabled={isPending}>Save</Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isPending}>Cancel</Button>
            </>
          ) : (
            <>
              {field.state === 'candidate' && (
                <Button variant="secondary" onClick={handleAccept} disabled={isPending} className="text-green-500 border-green-500/20 hover:bg-green-500/10">
                  <Check size={16} /> Accept
                </Button>
              )}
              <Button variant="secondary" onClick={() => setIsEditing(true)} disabled={isPending || isRejected}>
                <Edit2 size={16} /> Edit
              </Button>
              {!isRejected && (
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
