'use client'

import React, { useRef, useState, useTransition } from 'react'
import { uploadDocument } from '../actions'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Upload, CheckCircle, Loader2, FileText, Image as ImageIcon, File as FileIcon } from 'lucide-react'
import Image from 'next/image'

const DOCUMENT_TYPES = [
  { value: 'PSABirth', label: 'PSA Birth Certificate' },
  { value: 'PSAMarriage', label: 'PSA Marriage Certificate' },
  { value: 'TOR', label: 'Transcript of Records' },
  { value: 'SF10', label: 'Form 137 / SF10' },
  { value: 'Diploma', label: 'Diploma' }
] as const

type DocumentType = typeof DOCUMENT_TYPES[number]['value']

export function DocumentUpload({ 
  caseId,
  documents = []
}: { 
  caseId: string
  documents?: any[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const getFileIcon = (fileName: string) => {
    const lowerName = fileName.toLowerCase()
    if (lowerName.endsWith('.pdf')) return <Image src="/pdf.png" alt="PDF" width={24} height={24} className="mb-xs object-contain" />
    if (lowerName.match(/\.jpeg$/)) return <Image src="/jpeg.png" alt="JPEG" width={24} height={24} className="mb-xs object-contain" />
    if (lowerName.match(/\.(png|jpg)$/)) return <Image src="/jpg-file.png" alt="Image" width={24} height={24} className="mb-xs object-contain" />
    return <FileIcon size={20} className="text-text-secondary mb-xs group-hover:text-accent transition-colors" />
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setError(null)
      handleUpload(selectedFile, type)
    }
  }

  const handleUpload = (file: File, type: DocumentType) => {
    setUploadingType(type)
    const formData = new FormData()
    formData.append('caseId', caseId)
    formData.append('type', type)
    formData.append('file', file)

    startTransition(async () => {
      try {
        await uploadDocument(formData)
        setError(null)
      } catch (err: any) {
        setError(err.message || `Failed to upload ${type}`)
      } finally {
        setUploadingType(null)
        if (fileInputRefs.current[type]) {
          fileInputRefs.current[type]!.value = ''
        }
      }
    })
  }

  return (
    <Card className="p-xl mb-xl flex flex-col gap-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-heading font-semibold text-text-primary">Required Documents</h3>
      </div>

      {error && (
        <div className="p-md text-error bg-background rounded-card text-small border border-error/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        {DOCUMENT_TYPES.map(({ value, label }) => {
          const existingDoc = documents.find(d => d.type === value)
          const isUploading = isPending && uploadingType === value

          return (
            <Card key={value} className="p-md flex flex-col justify-between h-32 border-dashed hover:border-accent-muted transition-colors group relative overflow-hidden">
              <div className="flex justify-between items-start mb-sm">
                <span className="text-small font-medium text-text-primary">{label}</span>
                {existingDoc ? (
                  <Badge variant="success" className="gap-xs font-medium tracking-normal text-[11px] shadow-sm">
                    <CheckCircle size={12} /> Uploaded
                  </Badge>
                ) : (
                  <Badge variant="neutral" className="text-text-secondary font-medium tracking-normal text-[11px] bg-background border border-border/50">Missing</Badge>
                )}
              </div>
              
              <div 
                className={`mt-auto flex items-center justify-center p-sm rounded-md transition-colors ${
                  isUploading ? 'bg-surface' : existingDoc ? 'bg-background/50 hover:bg-background cursor-pointer' : 'bg-surface hover:bg-background cursor-pointer'
                }`}
                onClick={() => !isUploading && fileInputRefs.current[value]?.click()}
              >
                <input 
                  type="file" 
                  ref={el => { fileInputRefs.current[value] = el }}
                  onChange={(e) => handleFileSelect(e, value)}
                  className="hidden"
                  disabled={isUploading}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center gap-xs text-small text-accent-muted">
                    <Loader2 size={16} className="animate-spin mb-xs" /> Uploading...
                  </div>
                ) : existingDoc ? (
                  <div className="flex flex-col items-center">
                    {getFileIcon(existingDoc.file_name)}
                    <span className="text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                      Replace file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-xs text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                    <Upload size={16} className="mb-xs" /> Click to upload
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </Card>
  )
}
