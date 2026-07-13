'use client'

import React, { useRef, useState, useTransition, useCallback, DragEvent } from 'react'
import { uploadDocument } from '../actions'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Upload, CheckCircle, Loader2, File as FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
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

  const handleUpload = useCallback((file: File, type: DocumentType) => {
    setError(null)
    setUploadingType(type)
    const formData = new FormData()
    formData.append('caseId', caseId)
    formData.append('type', type)
    formData.append('file', file)

    startTransition(async () => {
      try {
        await uploadDocument(formData)
        setError(null)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : `Failed to upload ${type}`
        setError(msg)
      } finally {
        setUploadingType(null)
        if (fileInputRefs.current[type]) {
          fileInputRefs.current[type]!.value = ''
        }
      }
    })
  }, [caseId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0], type)
    }
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
            <DocumentSlot
              key={value}
              docType={value}
              label={label}
              existingDoc={existingDoc}
              isUploading={isUploading}
              onFileSelected={handleUpload}
              fileInputRef={(el) => { fileInputRefs.current[value] = el }}
              onInputChange={(e) => handleFileSelect(e, value)}
              getFileIcon={getFileIcon}
            />
          )
        })}
      </div>
    </Card>
  )
}

interface DocumentSlotProps {
  docType: DocumentType
  label: string
  existingDoc: any
  isUploading: boolean
  onFileSelected: (file: File, type: DocumentType) => void
  fileInputRef: (el: HTMLInputElement | null) => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  getFileIcon: (fileName: string) => React.ReactNode
}

function DocumentSlot({
  docType,
  label,
  existingDoc,
  isUploading,
  onFileSelected,
  fileInputRef,
  onInputChange,
  getFileIcon,
}: DocumentSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const localInputRef = useRef<HTMLInputElement | null>(null)

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      if (isUploading) return
      const file = e.dataTransfer.files?.[0]
      if (file) {
        onFileSelected(file, docType)
      }
    },
    [docType, isUploading, onFileSelected]
  )

  return (
    <Card
      className={cn(
        'p-md flex flex-col justify-between h-32 border-dashed transition-colors group relative overflow-hidden',
        isDragOver ? 'border-accent bg-accent/5' : 'hover:border-accent-muted'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
        className={cn(
          'mt-auto flex items-center justify-center p-sm rounded-md transition-colors cursor-pointer',
          isDragOver ? 'bg-accent/10' : isUploading ? 'bg-surface' : 'bg-surface hover:bg-background'
        )}
        onClick={() => !isUploading && localInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={(el) => {
            localInputRef.current = el
            fileInputRef(el)
          }}
          onChange={onInputChange}
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
              {isDragOver ? 'Drop to replace' : 'Replace file'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-xs text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors">
            <Upload size={16} className="mb-xs" />
            {isDragOver ? (
              <span className="text-accent font-semibold">Drop to upload</span>
            ) : (
              'Click or drag & drop'
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
