'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { FileEdit, ArrowRight, Search, Trash2, X, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { moveToTrashDraft } from '../actions'

const DRAFT_TYPE_LABELS: Record<string, string> = {
  Affidavit: 'Affidavit of Discrepancy',
  AddressLetter: 'Address Explanation Letter',
  GapLetter: 'Academic Gap Explanation Letter'
}

const DRAFT_TYPE_BADGE_COLORS: Record<string, 'primary' | 'warning' | 'neutral'> = {
  Affidavit: 'primary',
  AddressLetter: 'warning',
  GapLetter: 'neutral'
}

export function DraftsList({ drafts }: { drafts: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message, error])

  async function handleDelete(draftId: string, caseId: string) {
    if (!confirm('Are you sure you want to move this draft to trash?')) return
    
    setDeletingId(draftId)
    setError(null)
    setMessage(null)

    try {
      await moveToTrashDraft(draftId, caseId)
      setMessage('Draft moved to trash successfully.')
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting.')
    }
    setDeletingId(null)
  }

  const filteredDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      const applicant = draft.cases?.applicants?.[0]
      const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}`.toLowerCase() : ""
      const q = searchQuery.toLowerCase()
      const matchesSearch = applicantName.includes(q) || draft.type.toLowerCase().includes(q)
      
      let matchesDate = true
      const draftDate = draft.created_at ? new Date(draft.created_at) : null
      
      if (draftDate) {
        if (dateFrom) {
          const from = new Date(dateFrom)
          if (draftDate < from) matchesDate = false
        }
        if (dateTo) {
          const to = new Date(dateTo)
          to.setHours(23, 59, 59, 999)
          if (draftDate > to) matchesDate = false
        }
      }
      
      return matchesSearch && matchesDate
    })
  }, [drafts, searchQuery, dateFrom, dateTo])

  return (
    <div className="flex flex-col gap-md relative">
      {/* Floating Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-sm pointer-events-none">
        {error && (
          <div className="bg-white border-l-4 border-error shadow-lg rounded-md p-md flex items-start gap-md animate-in slide-in-from-right-8 pointer-events-auto min-w-[300px]">
            <AlertCircle className="text-error mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-small font-semibold text-text-primary">Error</h4>
              <p className="text-small text-text-secondary mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-text-secondary hover:text-text-primary">
              <X size={16} />
            </button>
          </div>
        )}
        {message && (
          <div className="bg-white border-l-4 border-success shadow-lg rounded-md p-md flex items-start gap-md animate-in slide-in-from-right-8 pointer-events-auto min-w-[300px]">
            <CheckCircle className="text-success mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-small font-semibold text-text-primary">Success</h4>
              <p className="text-small text-text-secondary mt-0.5">{message}</p>
            </div>
            <button onClick={() => setMessage(null)} className="text-text-secondary hover:text-text-primary">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-md mb-md">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <Input 
            placeholder="Search drafts by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-sm">
          <label className="text-small text-text-secondary">From:</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <label className="text-small text-text-secondary">To:</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <Card className="p-xl min-h-[400px]">
        {filteredDrafts.length > 0 ? (
          <div className="flex flex-col gap-md">
            {filteredDrafts.map((draft: any) => {
              const applicant = draft.cases?.applicants?.[0];
              const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}` : "Unknown Applicant";
              const isFinalized = draft.status === 'Finalized';
              
              return (
                <div key={draft.id} className="flex flex-col md:flex-row md:items-center justify-between p-md border border-text-secondary/10 rounded-button hover:bg-background transition-colors gap-md group">
                  <div className="flex items-start gap-md">
                    <div className="p-sm bg-surface-secondary rounded-md text-text-secondary mt-1">
                      <FileEdit size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-sm mb-xs">
                        <Link href={`/cases/${draft.case_id}`} className="text-body font-medium text-text-primary group-hover:text-accent transition-colors">
                          {applicantName}
                        </Link>
                        <Badge variant={DRAFT_TYPE_BADGE_COLORS[draft.type] || 'neutral'}>
                          {DRAFT_TYPE_LABELS[draft.type] || draft.type}
                        </Badge>
                        {isFinalized && (
                          <Badge variant="success">Finalized</Badge>
                        )}
                      </div>
                      <p className="text-small text-text-secondary line-clamp-2">
                        {draft.content?.substring(0, 150)}...
                      </p>
                      <p className="text-xs text-text-secondary mt-xs">
                        Created: {draft.created_at ? new Date(draft.created_at).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center shrink-0 gap-sm">
                    <button 
                      onClick={() => handleDelete(draft.id, draft.case_id)}
                      disabled={deletingId === draft.id}
                      className="p-sm rounded-md text-text-secondary hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Move to Trash"
                    >
                      <Trash2 size={18} />
                    </button>
                    <Link 
                      href={`/cases/${draft.case_id}`}
                      className="inline-flex items-center justify-center rounded-button px-md py-sm text-small font-semibold border border-text-secondary/20 text-text-secondary hover:bg-surface-secondary transition-colors"
                    >
                      View Case <ArrowRight size={16} className="ml-xs" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-text-secondary mt-xl flex flex-col items-center gap-md">
            <FileEdit className="w-12 h-12 text-text-secondary/50" />
            <p>No legal drafts match your search criteria.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
