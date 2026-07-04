'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText, FileEdit, Download, RefreshCcw, Trash2 } from 'lucide-react'
import { restoreCase, permanentlyDeleteCase } from '@/features/cases/actions'
import { restoreDraft, permanentlyDeleteDraft } from '@/features/drafts/actions'
import { restoreExport, deleteExport as permanentlyDeleteExport } from '@/features/exports/actions'

export function TrashWorkspace({ deletedCases, deletedDrafts, deletedExports }: { deletedCases: any[], deletedDrafts: any[], deletedExports: any[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (actionFn: any, id: string, caseId?: string) => {
    setLoading(id)
    try {
      if (caseId) {
        await actionFn(id, caseId)
      } else {
        await actionFn(id)
      }
    } catch (e) {
      console.error(e)
      alert("Action failed")
    }
    setLoading(null)
  }

  return (
    <div className="flex flex-col gap-xl">
      <Card className="p-xl">
        <h2 className="text-body font-semibold mb-md flex items-center gap-sm">
          <FileText size={20} /> Deleted Cases
        </h2>
        {deletedCases.length === 0 ? (
          <p className="text-small text-text-secondary">No deleted cases.</p>
        ) : (
          <div className="flex flex-col gap-sm">
            {deletedCases.map(c => (
              <div key={c.id} className="flex justify-between items-center p-md border border-border-default rounded-md">
                <div>
                  <p className="font-medium">Case: {c.applicants[0]?.first_name} {c.applicants[0]?.last_name}</p>
                  <p className="text-xs text-text-secondary">Deleted: {new Date(c.deleted_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-sm">
                  <Button variant="secondary" size="sm" onClick={() => handleAction(restoreCase, c.id)} disabled={loading === c.id}>
                    <RefreshCcw size={16} className="mr-xs" /> Restore
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAction(permanentlyDeleteCase, c.id)} disabled={loading === c.id}>
                    <Trash2 size={16} className="text-error" />
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
              <div key={d.id} className="flex justify-between items-center p-md border border-border-default rounded-md">
                <div>
                  <p className="font-medium">{d.type} - {d.cases?.applicants[0]?.first_name} {d.cases?.applicants[0]?.last_name}</p>
                  <p className="text-xs text-text-secondary">Deleted: {new Date(d.deleted_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-sm">
                  <Button variant="secondary" size="sm" onClick={() => handleAction(restoreDraft, d.id, d.case_id)} disabled={loading === d.id}>
                    <RefreshCcw size={16} className="mr-xs" /> Restore
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAction(permanentlyDeleteDraft, d.id, d.case_id)} disabled={loading === d.id}>
                    <Trash2 size={16} className="text-error" />
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
              <div key={e.id} className="flex justify-between items-center p-md border border-border-default rounded-md">
                <div>
                  <p className="font-medium">{e.title} - {e.cases?.applicants[0]?.first_name} {e.cases?.applicants[0]?.last_name}</p>
                  <p className="text-xs text-text-secondary">Deleted: {new Date(e.deleted_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-sm">
                  <Button variant="secondary" size="sm" onClick={() => handleAction(restoreExport, e.id, e.case_id)} disabled={loading === e.id}>
                    <RefreshCcw size={16} className="mr-xs" /> Restore
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAction(permanentlyDeleteExport, e.id, e.case_id)} disabled={loading === e.id}>
                    <Trash2 size={16} className="text-error" />
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
