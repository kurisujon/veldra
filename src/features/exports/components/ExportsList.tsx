'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { FileText, Search, Trash2, X, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { moveToTrashExport } from '../actions'
import { ConfirmDeleteModal } from '@/components/ui/Modal/ConfirmDeleteModal'

export function ExportsList({ exports }: { exports: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [exportToDelete, setExportToDelete] = useState<{ id: string, caseId: string } | null>(null)
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

  async function handleConfirmDelete() {
    if (!exportToDelete) return
    
    setDeletingId(exportToDelete.id)
    setError(null)
    setMessage(null)

    try {
      const res = await moveToTrashExport(exportToDelete.id, exportToDelete.caseId)
      if (res?.error) {
        setError(res.error)
      } else {
        setMessage('Export moved to trash successfully.')
        setExportToDelete(null)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting.')
    }
    setDeletingId(null)
  }

  const filteredExports = useMemo(() => {
    return exports.filter((exp) => {
      const applicant = exp.cases?.applicants?.[0]
      const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}`.toLowerCase() : ""
      const title = (exp.title || 'Verification Report').toLowerCase()
      const q = searchQuery.toLowerCase()
      const matchesSearch = applicantName.includes(q) || title.includes(q)
      
      let matchesDate = true
      const expDate = exp.generated_at ? new Date(exp.generated_at) : new Date(exp.created_at)
      
      if (expDate) {
        if (dateFrom) {
          const from = new Date(dateFrom)
          if (expDate < from) matchesDate = false
        }
        if (dateTo) {
          const to = new Date(dateTo)
          to.setHours(23, 59, 59, 999)
          if (expDate > to) matchesDate = false
        }
      }
      
      return matchesSearch && matchesDate
    })
  }, [exports, searchQuery, dateFrom, dateTo])

  return (
    <div className="flex flex-col gap-md relative">
      <ConfirmDeleteModal
        isOpen={!!exportToDelete}
        onClose={() => setExportToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Export"
        message="Are you sure you want to move this export package to the trash? You can restore it later from the Trash page."
        isDeleting={!!deletingId}
      />

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
            placeholder="Search exports by applicant or title..."
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
        {filteredExports.length > 0 ? (
          <div className="flex flex-col gap-md">
            {filteredExports.map((exp: any) => {
              const applicant = exp.cases?.applicants?.[0];
              const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}` : "Unknown Applicant";
              
              return (
                <div key={exp.id} className="flex flex-col md:flex-row md:items-center justify-between p-md border border-text-secondary/10 rounded-button hover:bg-background transition-colors gap-md group">
                  <div className="flex items-center gap-md">
                    <div className="p-sm bg-surface-secondary rounded-md text-text-secondary">
                      <FileText size={20} />
                    </div>
                    <div>
                      <Link href={`/cases/${exp.case_id}`} className="text-body font-medium text-accent hover:underline">
                        {applicantName} - {exp.title || 'Verification Report'}
                      </Link>
                      <p className="text-small text-text-secondary">
                        Generated on: {exp.generated_at ? new Date(exp.generated_at).toLocaleString() : new Date(exp.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-sm shrink-0">
                    {exp.pdf_path && (
                      <a 
                        href={exp.pdf_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-button px-md py-sm text-small font-semibold bg-surface-secondary text-text-primary hover:bg-border-default transition-colors"
                      >
                        📄 Download PDF
                      </a>
                    )}
                    {exp.docx_path && (
                      <a 
                        href={exp.docx_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-button px-md py-sm text-small font-semibold bg-surface-secondary text-text-primary hover:bg-border-default transition-colors"
                      >
                        📝 Download DOCX
                      </a>
                    )}
                    <button 
                      onClick={() => setExportToDelete({ id: exp.id, caseId: exp.case_id })}
                      disabled={deletingId === exp.id}
                      className="p-sm rounded-md text-text-secondary hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 ml-sm"
                      title="Move to Trash"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-text-secondary mt-xl flex flex-col items-center gap-md">
            <FileText className="w-12 h-12 text-text-secondary/50" />
            <p>No exports match your search criteria.</p>
          </div>
        )}
      </Card>
    </div>
  )
}


