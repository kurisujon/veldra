'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText, FileEdit, Download, RefreshCcw, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react'
import { restoreCase, permanentlyDeleteCase } from '@/features/cases/actions'
import { restoreDraft, permanentlyDeleteDraft } from '@/features/drafts/actions'
import { restoreExport, deleteExport as permanentlyDeleteExport } from '@/features/exports/actions'
import { ConfirmDeleteModal } from '@/components/ui/Modal/ConfirmDeleteModal'

type DeletionTarget = {
  id: string;
  caseId?: string;
  type: 'case' | 'draft' | 'export';
} | null;

export function TrashWorkspace({ deletedCases, deletedDrafts, deletedExports }: { deletedCases: any[], deletedDrafts: any[], deletedExports: any[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [targetToDelete, setTargetToDelete] = useState<DeletionTarget>(null)
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

  const handleRestore = async (actionFn: any, id: string, caseId?: string) => {
    setLoading(id)
    setError(null)
    setMessage(null)
    try {
      if (caseId) {
        await actionFn(id, caseId)
      } else {
        await actionFn(id)
      }
      setMessage('Item restored successfully.')
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Failed to restore item.")
    }
    setLoading(null)
  }

  const handleConfirmDelete = async () => {
    if (!targetToDelete) return
    const { id, caseId, type } = targetToDelete
    setLoading(id)
    setError(null)
    setMessage(null)
    try {
      if (type === 'case') {
        await permanentlyDeleteCase(id)
      } else if (type === 'draft') {
        await permanentlyDeleteDraft(id, caseId!)
      } else if (type === 'export') {
        await permanentlyDeleteExport(id, caseId!)
      }
      setMessage('Item permanently deleted.')
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Failed to delete item permanently.")
    }
    setLoading(null)
    setTargetToDelete(null)
  }

  return (
    <div className="flex flex-col gap-xl relative">
      <ConfirmDeleteModal
        isOpen={!!targetToDelete}
        onClose={() => setTargetToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Permanently Delete"
        message="Are you sure you want to permanently delete this item? This action cannot be undone."
        isDeleting={loading === targetToDelete?.id}
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

      <Card className="p-xl">
        <h2 className="text-body font-semibold mb-md flex items-center gap-sm">
          <FileText size={20} /> Deleted Cases
        </h2>
        {deletedCases.length === 0 ? (
          <p className="text-small text-text-secondary">No deleted cases.</p>
        ) : (
          <div className="flex flex-col gap-sm">
            {deletedCases.map(c => (
              <div key={c.id} className="flex justify-between items-center p-md border border-border-default rounded-md group hover:bg-background transition-colors">
                <div>
                  <p className="font-medium">Case: {c.applicants[0]?.first_name} {c.applicants[0]?.last_name}</p>
                  <p className="text-xs text-text-secondary">Deleted: {new Date(c.deleted_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-sm">
                  <Button variant="secondary" size="sm" onClick={() => handleRestore(restoreCase, c.id)} disabled={loading === c.id}>
                    <RefreshCcw size={16} className="mr-xs" /> Restore
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setTargetToDelete({ id: c.id, type: 'case' })} disabled={loading === c.id} className="text-text-secondary hover:text-error hover:bg-error/10">
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-xl">
        <h2 className="text-body font-semibold mb-md flex items-center gap-sm">
          <FileEdit size={20} /> Deleted Drafts
        </h2>
        {deletedDrafts.length === 0 ? (
          <p className="text-small text-text-secondary">No deleted drafts.</p>
        ) : (
          <div className="flex flex-col gap-sm">
            {deletedDrafts.map(d => (
              <div key={d.id} className="flex justify-between items-center p-md border border-border-default rounded-md group hover:bg-background transition-colors">
                <div>
                  <p className="font-medium">{d.type} - {d.cases?.applicants[0]?.first_name} {d.cases?.applicants[0]?.last_name}</p>
                  <p className="text-xs text-text-secondary">Deleted: {new Date(d.deleted_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-sm">
                  <Button variant="secondary" size="sm" onClick={() => handleRestore(restoreDraft, d.id, d.case_id)} disabled={loading === d.id}>
                    <RefreshCcw size={16} className="mr-xs" /> Restore
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setTargetToDelete({ id: d.id, caseId: d.case_id, type: 'draft' })} disabled={loading === d.id} className="text-text-secondary hover:text-error hover:bg-error/10">
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-xl">
        <h2 className="text-body font-semibold mb-md flex items-center gap-sm">
          <Download size={20} /> Deleted Exports
        </h2>
        {deletedExports.length === 0 ? (
          <p className="text-small text-text-secondary">No deleted exports.</p>
        ) : (
          <div className="flex flex-col gap-sm">
            {deletedExports.map(e => (
              <div key={e.id} className="flex justify-between items-center p-md border border-border-default rounded-md group hover:bg-background transition-colors">
                <div>
                  <p className="font-medium">{e.title} - {e.cases?.applicants[0]?.first_name} {e.cases?.applicants[0]?.last_name}</p>
                  <p className="text-xs text-text-secondary">Deleted: {new Date(e.deleted_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-sm">
                  <Button variant="secondary" size="sm" onClick={() => handleRestore(restoreExport, e.id, e.case_id)} disabled={loading === e.id}>
                    <RefreshCcw size={16} className="mr-xs" /> Restore
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setTargetToDelete({ id: e.id, caseId: e.case_id, type: 'export' })} disabled={loading === e.id} className="text-text-secondary hover:text-error hover:bg-error/10">
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

