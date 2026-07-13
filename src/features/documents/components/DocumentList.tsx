'use client'

import React, { useTransition } from 'react'
import { deleteDocument } from '../actions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Database } from '@/types/database'
import { FileText, Image as ImageIcon, File, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Modal } from '@/components/ui/Modal'

type DocumentRow = Database['public']['Tables']['documents']['Row']

export function DocumentList({ documents, extractions = [], caseId }: { documents: DocumentRow[], extractions?: any[], caseId: string }) {
  const [isPending, startTransition] = useTransition()
  const [docToDelete, setDocToDelete] = React.useState<string | null>(null)

  const confirmDelete = () => {
    if (!docToDelete) return

    startTransition(async () => {
      try {
        await deleteDocument(docToDelete, caseId)
      } catch (err: any) {
        alert(err.message || 'Failed to delete document')
      } finally {
        setDocToDelete(null)
      }
    })
  }

  const getFileIcon = (fileName: string) => {
    const lowerName = fileName.toLowerCase()
    if (lowerName.endsWith('.pdf')) return <Image src="/pdf.png" alt="PDF" width={32} height={32} className="object-contain" />
    if (lowerName.match(/\.jpeg$/)) return <Image src="/jpeg.png" alt="JPEG" width={32} height={32} className="object-contain" />
    if (lowerName.match(/\.(png|jpg)$/)) return <Image src="/jpg-file.png" alt="Image" width={32} height={32} className="object-contain" />
    return <File size={32} className="text-accent/80" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getExtractionStatusInfo = (documentId: string) => {
    const ext = extractions.find(e => e.document_id === documentId)
    if (!ext) return { label: 'Not Extracted', color: 'neutral', icon: <Clock size={12} className="mr-1 inline" /> }

    if (ext.status === 'Failed') return { label: 'Extraction Failed', color: 'error', icon: <AlertTriangle size={12} className="mr-1 inline" /> }
    
    if (ext.review_status === 'Reviewed') return { label: 'Reviewed', color: 'success', icon: <CheckCircle2 size={12} className="mr-1 inline" /> }
    
    if (ext.status === 'Extracted' || ext.status === 'NeedsReview') return { label: 'Needs Review', color: 'warning', icon: <AlertTriangle size={12} className="mr-1 inline" /> }

    return { label: ext.status || 'Pending', color: 'neutral', icon: <Clock size={12} className="mr-1 inline" /> }
  }

  if (!documents || documents.length === 0) {
    return (
      <Card className="p-xl mb-xl">
        <div className="text-center text-text-secondary text-small py-md">
          No documents uploaded yet.
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-xl mb-xl">
      <h3 className="text-heading font-semibold text-text-primary mb-lg">Uploaded Documents</h3>
      <div className="flex flex-col gap-md">
        {documents.map((doc) => {
          const statusInfo = getExtractionStatusInfo(doc.id)
          
          return (
            <div key={doc.id} className="flex items-center justify-between p-md border border-background rounded-card hover:bg-background transition-colors gap-md">
              <div className="flex items-center gap-md min-w-0">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-surface rounded-button border border-border">
                  {getFileIcon(doc.file_name)}
                </div>
                <div className="flex flex-col gap-xs items-start min-w-0">
                  <div className="flex items-center gap-sm flex-wrap">
                    <Badge variant="primary">{doc.type}</Badge>
                    <Badge variant={statusInfo.color as any}>
                      {statusInfo.icon}{statusInfo.label}
                    </Badge>
                  </div>
                  <span className="font-medium text-text-primary text-body truncate max-w-[200px] sm:max-w-xs">{doc.file_name}</span>
                  <div className="flex items-center gap-md text-small text-text-secondary truncate">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-sm shrink-0">
                <Button 
                  variant="primary" 
                  className="px-sm py-xs text-[11px] h-auto w-full sm:w-auto"
                  onClick={() => window.location.href = `/cases/${caseId}/documents/${doc.id}`}
                >
                  {statusInfo.label === 'Reviewed' ? 'View Data' : 'Review Data'}
                </Button>
                <Button 
                  variant="secondary" 
                  className="px-sm py-xs text-[11px] h-auto w-full sm:w-auto flex items-center gap-xs"
                  onClick={() => setDocToDelete(doc.id)}
                  disabled={isPending && docToDelete === doc.id}
                >
                  {isPending && docToDelete === doc.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : null}
                  {isPending && docToDelete === doc.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      <Modal isOpen={!!docToDelete} onClose={() => setDocToDelete(null)} title="Confirm Deletion">
        <div className="flex flex-col gap-md">
          <p className="text-body text-text-secondary">
            Are you sure you want to delete this document? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-sm mt-sm">
            <Button variant="ghost" onClick={() => setDocToDelete(null)} disabled={isPending}>Cancel</Button>
            <Button variant="primary" onClick={confirmDelete} disabled={isPending} className="bg-error hover:bg-error/90 text-white">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
