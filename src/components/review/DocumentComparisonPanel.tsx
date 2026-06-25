'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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
    const isImage = doc.mime_type?.startsWith('image/')

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
        <div className="flex items-center justify-center w-full h-full overflow-auto bg-surface/50 p-md rounded-card">
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
            <span className="font-semibold text-text-primary text-body truncate" title={leftDoc?.file_name}>
              {leftDoc?.file_name || 'Select Document'}
            </span>
          </div>
          <div className="flex items-center gap-sm">
            {leftDoc && <Badge variant="primary">{leftDoc.type}</Badge>}
            {linkedDocs.length > 1 && (
              <select
                value={leftDocId}
                onChange={(e) => setLeftDocId(e.target.value)}
                className="bg-surface border border-text-secondary/20 rounded-input px-sm py-xs text-small font-medium focus:ring-accent focus:border-accent outline-none"
              >
                {linkedDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.file_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-background p-sm relative">
          {renderDocumentViewer(leftDoc, leftUrl)}
        </div>
      </Card>

      {/* Right Pane */}
      <Card className="flex flex-col h-full overflow-hidden border border-text-secondary/10 bg-surface shadow-sm">
        <div className="flex items-center justify-between p-md border-b border-text-secondary/10 bg-background/50 rounded-t-card">
          <div className="flex flex-col gap-xs max-w-[65%]">
            <span className="font-semibold text-text-primary text-body truncate" title={rightDoc?.file_name}>
              {rightDoc?.file_name || 'Select Document'}
            </span>
          </div>
          <div className="flex items-center gap-sm">
            {rightDoc && <Badge variant="primary">{rightDoc.type}</Badge>}
            {linkedDocs.length > 1 && (
              <select
                value={rightDocId}
                onChange={(e) => setRightDocId(e.target.value)}
                className="bg-surface border border-text-secondary/20 rounded-input px-sm py-xs text-small font-medium focus:ring-accent focus:border-accent outline-none"
              >
                {linkedDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.file_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-background p-sm relative">
          {renderDocumentViewer(rightDoc, rightUrl)}
        </div>
      </Card>
    </div>
  )
}
