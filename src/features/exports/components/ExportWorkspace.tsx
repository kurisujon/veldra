'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal } from '@/components/ui/Modal/ConfirmDeleteModal'
import { FileText, Download, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateExport, deleteExport } from '../actions'

type ExportPackage = {
  id: string
  case_id: string
  pdf_path: string | null
  docx_path: string | null
  title: string | null
  status: string | null
  generated_by: string | null
  generated_at: string | null
  created_at: string
}

interface ExportWorkspaceProps {
  caseId: string
  exports: ExportPackage[]
}

export function ExportWorkspace({ caseId, exports }: ExportWorkspaceProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportToDelete, setExportToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [animatingOutId, setAnimatingOutId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      const result = await generateExport(caseId)
      
      if (result && 'error' in result) {
        setToastMessage(result.error as string)
        setTimeout(() => setToastMessage(null), 5000)
        return
      }
    } catch (err: any) {
      console.error(err)
      setToastMessage(err.message || 'Failed to generate export package.')
      setTimeout(() => setToastMessage(null), 5000)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-xl mb-xl relative">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-error px-lg py-md rounded-md shadow-lg animate-in fade-in slide-in-from-top-4 flex items-center gap-sm">
          <span className="font-medium text-white">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white ml-md">
            &times;
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading font-semibold text-text-primary">Export Package</h2>
          <p className="text-small text-text-secondary mt-xs">
            Generate and download finalized verification reports and legal drafts.
          </p>
        </div>
        <div className="flex gap-md">
          <Button 
            variant="primary" 
            onClick={handleGenerate} 
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="mr-sm h-4 w-4 animate-spin" /> : <FileText className="mr-sm h-4 w-4" />}
            Generate Report
          </Button>
        </div>
      </div>

      {exports.length > 0 && (
        <Card className="p-xl">
          <h3 className="text-body font-medium text-text-primary mb-md">Generated Exports</h3>
          <div className="flex flex-col gap-sm">
            {exports.map((exp) => (
              <div 
                key={exp.id} 
                className={cn(
                  "flex items-center justify-between p-md border border-border-default rounded-md hover:border-brand-primary group transition-all duration-300 origin-top",
                  animatingOutId === exp.id ? "opacity-0 scale-95 h-0 overflow-hidden mb-[-16px] py-0 border-0" : "opacity-100 scale-100"
                )}
              >
                <div className="flex items-center gap-md">
                  <div className="p-sm bg-surface-secondary rounded-md text-text-secondary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-small font-medium text-text-primary">
                      {exp.title || 'Verification Report'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Generated on: {exp.generated_at ? new Date(exp.generated_at).toLocaleString() : new Date(exp.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-xs items-end">
                  <div className="text-xs font-medium text-text-secondary mr-sm">
                    Available Formats:
                  </div>
                  <div className="flex items-center gap-sm">
                    {exp.pdf_path && (
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(exp.pdf_path!, '_blank')}
                      >
                        📄 Download PDF
                      </Button>
                    )}
                    {exp.docx_path && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => window.open(exp.docx_path!, '_blank')}
                      >
                        📝 Download DOCX
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExportToDelete(exp.id)}
                      className="text-text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity ml-sm"
                      title="Delete Report"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ConfirmDeleteModal 
        isOpen={!!exportToDelete}
        onClose={() => setExportToDelete(null)}
        title="Delete Report"
        message="Are you sure you want to delete this generated report? This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={async () => {
          if (!exportToDelete) return;
          setIsDeleting(true);
          try {
            const idToDelete = exportToDelete;
            setAnimatingOutId(idToDelete);
            await new Promise(res => setTimeout(res, 300));
            await deleteExport(idToDelete, caseId);
            setIsDeleting(false);
            setExportToDelete(null);
            setAnimatingOutId(null);
          } catch (err) {
            console.error(err);
            setIsDeleting(false);
            setAnimatingOutId(null);
            alert('Failed to delete report. You might not have permission.');
          }
        }}
      />
    </div>
  )
}

