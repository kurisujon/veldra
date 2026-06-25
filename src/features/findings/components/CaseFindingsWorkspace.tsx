'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { FindingCard } from './FindingCard'
import { DocumentComparisonPanel } from '@/components/review/DocumentComparisonPanel'
import { Card } from '@/components/ui/Card'
import { getSignedUrlsForDocuments } from '@/features/documents/actions'
import type { Database } from '@/types/database'

type FindingWithDocIds = Database['public']['Tables']['findings']['Row'] & {
  documentIds: string[]
}
type DocumentRow = Database['public']['Tables']['documents']['Row']

export interface CaseFindingsWorkspaceProps {
  caseId: string
  findings: FindingWithDocIds[]
  documents: DocumentRow[]
  userRole?: string
}

export function CaseFindingsWorkspace({
  caseId,
  findings,
  documents,
  userRole = 'Reviewer'
}: CaseFindingsWorkspaceProps) {
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [isPendingUrls, startUrlTransition] = useTransition()

  const isReadOnly = userRole !== 'Admin' && userRole !== 'Reviewer'

  // Sort findings by severity: High -> Medium -> Low
  const sortedFindings = [...findings].sort((a, b) => {
    const severityOrder = { High: 0, Medium: 1, Low: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  // Select the first finding by default
  useEffect(() => {
    if (sortedFindings.length > 0 && !selectedFindingId) {
      setSelectedFindingId(sortedFindings[0].id)
    }
  }, [findings, selectedFindingId, sortedFindings])

  const selectedFinding = findings.find((f) => f.id === selectedFindingId)

  // Fetch signed URLs on demand for the selected finding's linked documents
  useEffect(() => {
    if (!selectedFinding) return

    const linkedDocs = documents.filter((d) =>
      selectedFinding.documentIds.includes(d.id)
    )
    const pathsToSign = linkedDocs
      .map((d) => d.file_path)
      .filter((path) => !signedUrls[path])

    if (pathsToSign.length === 0) return

    startUrlTransition(async () => {
      try {
        const newUrls = await getSignedUrlsForDocuments(pathsToSign)
        setSignedUrls((prev) => ({
          ...prev,
          ...newUrls
        }))
      } catch (err) {
        console.error('Failed to resolve signed URLs:', err)
      }
    })
  }, [selectedFindingId, selectedFinding, documents, signedUrls])

  return (
    <div className="flex gap-lg w-full h-[calc(100vh-280px)] min-h-[500px]" data-testid="findings-workspace">
      {/* Left Sidebar: Findings List */}
      <div className="w-[380px] flex flex-col gap-md overflow-y-auto pr-xs border-r border-text-secondary/10">
        <div className="text-body font-semibold text-text-primary mb-xs">
          Discrepancies ({findings.length})
        </div>
        {sortedFindings.length === 0 ? (
          <Card className="p-xl text-center text-text-secondary border-dashed border-text-secondary/20 bg-background/50">
            No discrepancies found
          </Card>
        ) : (
          <div className="flex flex-col gap-md">
            {sortedFindings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                isSelected={finding.id === selectedFindingId}
                onSelect={() => setSelectedFindingId(finding.id)}
                readOnly={isReadOnly}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Content Pane: Comparison Workspace */}
      <div className="flex-1 h-full min-h-0">
        <DocumentComparisonPanel
          documents={documents}
          selectedFinding={selectedFinding}
          signedUrls={signedUrls}
          isPendingUrls={isPendingUrls}
        />
      </div>
    </div>
  )
}
