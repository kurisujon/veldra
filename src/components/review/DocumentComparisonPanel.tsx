'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Maximize, X } from 'lucide-react'
import type { Database } from '@/types/database'

type DocumentRow = Database['public']['Tables']['documents']['Row']

export interface DocumentComparisonPanelProps {
  documents: DocumentRow[]
  selectedFinding?: {
    id: string
    title: string
    description: string
    category: string
    documentIds?: string[]
    fieldReferences?: any[]
  } | null
  signedUrls: Record<string, string>
  isPendingUrls?: boolean
}

export function DocumentComparisonPanel({
  documents,
  selectedFinding,
  signedUrls,
  isPendingUrls = false
}: DocumentComparisonPanelProps) {
  const [leftDocId, setLeftDocId] = useState<string>('')
  const [rightDocId, setRightDocId] = useState<string>('')
  
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null)
  const [fullscreenDoc, setFullscreenDoc] = useState<DocumentRow | null>(null)

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Filter documents linked to the selected finding
  const linkedDocs = useMemo(() => documents.filter((doc) =>
    selectedFinding?.documentIds?.includes(doc.id)
  ), [documents, selectedFinding?.documentIds])

  // Sync state with selected finding
  useEffect(() => {
    if (linkedDocs.length > 0) {
      setLeftDocId(linkedDocs[0].id)
      setRightDocId(linkedDocs[1]?.id || linkedDocs[0].id)
    } else {
      setLeftDocId('')
      setRightDocId('')
    }
  }, [linkedDocs])

  if (!selectedFinding) {
    return (
      <Card className="flex flex-col items-center justify-center h-full p-2xl text-center border-dashed border-text-secondary/20 bg-background/50">
        <p className="text-heading font-medium text-text-secondary">
          Select a finding to begin comparison review
        </p>
      </Card>
    )
  }

  if (linkedDocs.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center h-full p-2xl text-center border-dashed border-text-secondary/20 bg-background/50">
        <p className="text-heading font-medium text-text-secondary">
          No documents linked to this finding
        </p>
      </Card>
    )
  }

  const leftDoc = documents.find((d) => d.id === leftDocId)
  const rightDoc = documents.find((d) => d.id === rightDocId)

  const leftUrl = leftDoc ? signedUrls[leftDoc.file_path] : null
  const rightUrl = rightDoc ? signedUrls[rightDoc.file_path] : null

  const renderDocumentViewer = (doc: DocumentRow | undefined, url: string | null) => {
    if (!doc) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-xl text-center text-text-secondary">
          Document not selected
        </div>
      )
    }

    if (isPendingUrls) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-xl text-center text-text-secondary">
          Loading document preview...
        </div>
      )
    }

    if (!url) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-xl text-center gap-md">
          <p className="text-small text-text-secondary">Preview unavailable (Signed URL missing)</p>
          <div className="text-body text-text-primary font-medium">{doc.file_name}</div>
          <div className="text-small text-text-secondary">Type: {doc.type}</div>
        </div>
      )
    }

    const isPdf = doc.mime_type === 'application/pdf'
    if (isPdf) {
      return (
        <iframe
          src={url}
          className="w-full h-full border-0 rounded-card bg-surface"
          title={doc.file_name}
        />
      )
    }

    if (isImage) {
      return (
        <div 
          className="flex items-center justify-center w-full h-full overflow-auto bg-surface/50 p-md rounded-card cursor-zoom-in"
          onClick={() => { setFullscreenUrl(url); setFullscreenDoc(doc); }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={doc.file_name}
            className="max-w-full max-h-full object-contain rounded-card"
          />
        </div>
      )
    }

    // Fallback placeholder
    return (
      <div className="flex flex-col items-center justify-center h-full p-xl text-center gap-md">
        <p className="text-small text-text-secondary">Preview not supported for this file type</p>
        <div className="text-body text-text-primary font-medium">{doc.file_name}</div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-small text-accent font-semibold hover:underline"
        >
          Open file in new tab
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-lg w-full h-full min-h-0" data-testid="document-comparison-panel">
      {/* Left Pane */}
      <Card className="flex flex-col h-full overflow-hidden border border-text-secondary/10 bg-surface shadow-sm">
        <div className="flex items-center justify-between p-md border-b border-text-secondary/10 bg-background/50 rounded-t-card">
          <div className="flex flex-col gap-xs max-w-[65%]">
            {leftDoc && <div className="self-start"><Badge variant="primary">{leftDoc.type}</Badge></div>}
            <span className="font-semibold text-text-primary text-body truncate" title={leftDoc?.file_name}>
              {leftDoc?.file_name || 'Select Document'}
            </span>
          </div>
          <div className="flex items-center gap-sm">
            {leftUrl && leftDoc && (
              <button 
                className="p-xs hover:bg-background rounded-button text-text-secondary hover:text-accent transition-colors"
                onClick={() => { setFullscreenUrl(leftUrl); setFullscreenDoc(leftDoc); }}
                title="View Full Screen"
              >
                <Maximize size={18} />
              </button>
            )}
          </div>
        </div>
        
        {(() => {
          const fieldRef = selectedFinding?.fieldReferences?.find(r => r.document_id === leftDocId)
          if (!fieldRef?.document_fields) return null
          const val = fieldRef.document_fields.final_value || fieldRef.document_fields.reviewed_value || fieldRef.document_fields.normalized_value || fieldRef.document_fields.raw_value
          return (
            <div className="p-md bg-error/10 border-b border-error/20 flex flex-col gap-xs">
              <span className="text-small font-semibold text-error tracking-normal">{formatFieldName(fieldRef.document_fields.field_name)} (Extracted)</span>
              <span className="text-body font-medium text-text-primary">&quot;{val}&quot;</span>
            </div>
          )
        })()}

        <div className="flex-1 min-h-0 bg-background p-sm relative">
          {renderDocumentViewer(leftDoc, leftUrl)}
        </div>
      </Card>

      {/* Right Pane */}
      <Card className="flex flex-col h-full overflow-hidden border border-text-secondary/10 bg-surface shadow-sm">
        <div className="flex items-center justify-between p-md border-b border-text-secondary/10 bg-background/50 rounded-t-card">
          <div className="flex flex-col gap-xs max-w-[65%]">
            {rightDoc && <div className="self-start"><Badge variant="primary">{rightDoc.type}</Badge></div>}
            <span className="font-semibold text-text-primary text-body truncate" title={rightDoc?.file_name}>
              {rightDoc?.file_name || 'Select Document'}
            </span>
          </div>
          <div className="flex items-center gap-sm">
            {rightUrl && rightDoc && (
              <button 
                className="p-xs hover:bg-background rounded-button text-text-secondary hover:text-accent transition-colors"
                onClick={() => { setFullscreenUrl(rightUrl); setFullscreenDoc(rightDoc); }}
                title="View Full Screen"
              >
                <Maximize size={18} />
              </button>
            )}
          </div>
        </div>

        {(() => {
          const fieldRef = selectedFinding?.fieldReferences?.find(r => r.document_id === rightDocId)
          if (!fieldRef?.document_fields) return null
          const val = fieldRef.document_fields.final_value || fieldRef.document_fields.reviewed_value || fieldRef.document_fields.normalized_value || fieldRef.document_fields.raw_value
          return (
            <div className="p-md bg-error/10 border-b border-error/20 flex flex-col gap-xs">
              <span className="text-small font-semibold text-error tracking-normal">{formatFieldName(fieldRef.document_fields.field_name)} (Extracted)</span>
              <span className="text-body font-medium text-text-primary">&quot;{val}&quot;</span>
            </div>
          )
        })()}

        <div className="flex-1 min-h-0 bg-background p-sm relative">
          {renderDocumentViewer(rightDoc, rightUrl)}
        </div>
      </Card>

      {/* Fullscreen Lightbox Modal */}
      {fullscreenUrl && fullscreenDoc && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2xl bg-black/70 backdrop-blur-sm transition-all"
          onClick={() => { setFullscreenUrl(null); setFullscreenDoc(null); }}
        >
          <button 
            className="absolute top-xl right-xl p-sm bg-surface rounded-full text-text-primary hover:bg-background transition-colors shadow-lg"
            onClick={(e) => { e.stopPropagation(); setFullscreenUrl(null); setFullscreenDoc(null); }}
          >
            <X size={24} />
          </button>
          
          <div 
            className="w-full h-full max-w-[90vw] max-h-[90vh] bg-surface rounded-card overflow-hidden shadow-2xl flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-md border-b border-text-secondary/10 flex items-center justify-between bg-background/50">
              <span className="font-semibold text-text-primary text-heading">{fullscreenDoc.file_name}</span>
              <Badge variant="primary">{fullscreenDoc.type}</Badge>
            </div>
            <div className="flex-1 overflow-auto p-md bg-background relative flex items-center justify-center">
               {fullscreenDoc.mime_type === 'application/pdf' ? (
                 <iframe src={fullscreenUrl} className="w-full h-full border-0 rounded-card bg-surface" title={fullscreenDoc.file_name} />
               ) : fullscreenDoc.mime_type?.startsWith('image/') ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={fullscreenUrl} alt={fullscreenDoc.file_name} className="max-w-full max-h-full object-contain mx-auto" />
               ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
