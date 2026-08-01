'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { FindingCard } from './FindingCard'
import { CompleteReviewButton } from './CompleteReviewButton'
import { DocumentComparisonPanel } from '@/components/review/DocumentComparisonPanel'
import { Card } from '@/components/ui/Card'
import { getSignedUrlsForDocuments } from '@/features/documents/actions'
import type { Database } from '@/types/database'
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'

type FindingWithDocIds = Database['public']['Tables']['findings']['Row'] & {
  documentIds: string[]
  fieldReferences?: any[]
}
type DocumentRow = Database['public']['Tables']['documents']['Row']
type ComparisonResultRow = Database['public']['Tables']['comparison_results']['Row']
type SponsorRelationshipRow = Database['public']['Tables']['sponsor_relationships']['Row'] & {
  relationship_evidence?: Database['public']['Tables']['relationship_evidence']['Row'][]
}

export interface CaseFindingsWorkspaceProps {
  caseId: string
  findings: FindingWithDocIds[]
  comparisonResults?: ComparisonResultRow[]
  sponsorRelationships?: SponsorRelationshipRow[]
  documents: DocumentRow[]
  userRole?: string
}

type TabKey = 'applicant' | 'sponsor' | 'relationship'

export function CaseFindingsWorkspace({
  caseId,
  findings,
  comparisonResults = [],
  sponsorRelationships = [],
  documents,
  userRole = 'Reviewer'
}: CaseFindingsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('applicant')
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [isPendingUrls, startUrlTransition] = useTransition()

  const isReadOnly = userRole !== 'Admin' && userRole !== 'Reviewer'

  // Filter findings by scope
  const applicantFindings = findings.filter(f => f.finding_scope === 'applicant_internal')
  const sponsorFindings = findings.filter(f => f.finding_scope === 'sponsor_internal')
  
  // Also get passed rules
  const applicantPasses = comparisonResults.filter(c => c.comparison_scope === 'applicant_internal' && c.status === 'verified')
  const sponsorPasses = comparisonResults.filter(c => c.comparison_scope === 'sponsor_internal' && c.status === 'verified')

  const activeFindings = activeTab === 'applicant' ? applicantFindings : (activeTab === 'sponsor' ? sponsorFindings : [])
  const activePasses = activeTab === 'applicant' ? applicantPasses : (activeTab === 'sponsor' ? sponsorPasses : [])

  // Sort findings by severity: High -> Medium -> Low -> Warning
  const sortedFindings = [...activeFindings].sort((a, b) => {
    const severityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2, Warning: 3 }
    return (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99)
  })

  // Select the first finding by default when switching tabs
  useEffect(() => {
    if (sortedFindings.length > 0) {
      if (!sortedFindings.find(f => f.id === selectedFindingId)) {
        setSelectedFindingId(sortedFindings[0].id)
      }
    } else {
      setSelectedFindingId(null)
    }
  }, [activeTab, sortedFindings, selectedFindingId])

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
      <div className="w-[480px] flex flex-col overflow-y-hidden border-r border-text-secondary/10 pr-xs">
        {/* Tabs */}
        <div className="flex bg-surface rounded-md p-xs gap-xs border border-text-secondary/10 mb-md shrink-0">
          <button
            onClick={() => setActiveTab('applicant')}
            className={`flex-1 py-sm px-xs text-small font-medium rounded-sm transition-colors ${activeTab === 'applicant' ? 'bg-background shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-background/50'}`}
          >
            Applicant
          </button>
          <button
            onClick={() => setActiveTab('sponsor')}
            className={`flex-1 py-sm px-xs text-small font-medium rounded-sm transition-colors ${activeTab === 'sponsor' ? 'bg-background shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-background/50'}`}
          >
            Sponsor
          </button>
          <button
            onClick={() => setActiveTab('relationship')}
            className={`flex-1 py-sm px-xs text-small font-medium rounded-sm transition-colors ${activeTab === 'relationship' ? 'bg-background shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-background/50'}`}
          >
            Relationship
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-md pr-xs pb-xl">
          {activeTab !== 'relationship' ? (
            <>
              {/* Discrepancies */}
              <div>
                <div className="text-small font-semibold text-text-secondary uppercase tracking-wider mb-sm">
                  Discrepancies ({sortedFindings.length})
                </div>
                {sortedFindings.length === 0 ? (
                  <Card className="p-md text-center text-text-secondary border-dashed border-text-secondary/20 bg-background/50 text-small">
                    No discrepancies found.
                  </Card>
                ) : (
                  <div className="flex flex-col gap-sm">
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

              {/* Passed Rules */}
              <div className="mt-md">
                <div className="text-small font-semibold text-text-secondary uppercase tracking-wider mb-sm">
                  Verified Matches ({activePasses.length})
                </div>
                {activePasses.length === 0 ? (
                  <Card className="p-md text-center text-text-secondary border-dashed border-text-secondary/20 bg-background/50 text-small">
                    No verified rules to display.
                  </Card>
                ) : (
                  <div className="flex flex-col gap-xs">
                    {activePasses.map((pass) => (
                      <div key={pass.id} className="flex items-start gap-sm p-sm rounded-md border border-text-secondary/10 bg-surface">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-small font-medium text-text-primary">{pass.rule_code}: {pass.field_name}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{pass.explanation || 'Values match perfectly.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Relationship Tab Content */
            <div>
              <div className="text-small font-semibold text-text-secondary uppercase tracking-wider mb-sm">
                Relationship Chains ({sponsorRelationships.length})
              </div>
              {sponsorRelationships.length === 0 ? (
                <Card className="p-md text-center text-text-secondary border-dashed border-text-secondary/20 bg-background/50 text-small">
                  No relationship evidence evaluated.
                </Card>
              ) : (
                <div className="flex flex-col gap-md">
                  {sponsorRelationships.map(rel => (
                    <Card key={rel.id} className="p-md border border-text-secondary/10 bg-surface flex flex-col gap-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-body font-semibold text-text-primary capitalize">{rel.declared_relationship.replace(/_/g, ' ')}</h3>
                          <p className="text-small text-text-secondary">Sponsor ID: {rel.sponsor_id.slice(0,8)}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rel.verification_status === 'verified' ? 'bg-emerald-500/10 text-emerald-600' :
                          rel.verification_status === 'mismatch' ? 'bg-red-500/10 text-red-600' :
                          'bg-amber-500/10 text-amber-600'
                        }`}>
                          {rel.verification_status.replace(/_/g, ' ').toUpperCase()}
                        </div>
                      </div>

                      {rel.review_notes && (
                        <div className="p-sm bg-background/50 rounded text-small text-text-secondary border border-text-secondary/5">
                          {rel.review_notes}
                        </div>
                      )}

                      {rel.missing_evidence && Array.isArray(rel.missing_evidence) && rel.missing_evidence.length > 0 && (
                        <div className="flex flex-col gap-xs">
                          <p className="text-xs font-semibold text-text-secondary uppercase">Missing Evidence</p>
                          <ul className="list-disc pl-4 text-small text-amber-600 space-y-1">
                            {rel.missing_evidence.map((me: string, idx: number) => (
                              <li key={idx}>{me}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {rel.relationship_evidence && rel.relationship_evidence.length > 0 && (
                        <div className="flex flex-col gap-xs mt-sm">
                          <p className="text-xs font-semibold text-text-secondary uppercase">Evidence Chain</p>
                          <div className="flex flex-col gap-sm border-l-2 border-text-secondary/20 pl-sm ml-xs py-xs">
                            {rel.relationship_evidence.map((ev, idx) => {
                              const doc = documents.find(d => d.id === ev.document_id)
                              return (
                                <div key={ev.id} className="relative">
                                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-text-secondary/40 ring-4 ring-surface" />
                                  <p className="text-small font-medium text-text-primary capitalize">{ev.evidence_role.replace(/_/g, ' ')}</p>
                                  <p className="text-xs text-text-secondary mt-0.5">
                                    <span className="font-medium">{doc ? doc.type.toUpperCase() : 'Unknown Doc'}</span> &middot; {ev.field_name}: <span className="font-medium text-text-primary">{ev.extracted_value}</span>
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Complete Button Footer */}
        {!isReadOnly && (
          <div className="mt-auto pt-md border-t border-text-secondary/10 bg-background pb-md shrink-0">
            <CompleteReviewButton 
              caseId={caseId} 
              disabled={!findings.every(f => f.status !== 'Open')} 
            />
          </div>
        )}
      </div>

      {/* Right Content Pane: Comparison Workspace */}
      <div className="flex-1 h-full min-h-0 bg-surface rounded-md border border-text-secondary/10 overflow-hidden relative shadow-sm">
        {selectedFinding ? (
          <DocumentComparisonPanel
            documents={documents}
            selectedFinding={selectedFinding}
            signedUrls={signedUrls}
            isPendingUrls={isPendingUrls}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary p-xl text-center">
            <Info className="w-12 h-12 mb-md opacity-20" />
            <h3 className="text-body font-medium text-text-primary mb-xs">No Discrepancy Selected</h3>
            <p className="text-small max-w-sm">Select a discrepancy from the left panel to review the source documents and verify the extracted data.</p>
          </div>
        )}
      </div>
    </div>
  )
}
