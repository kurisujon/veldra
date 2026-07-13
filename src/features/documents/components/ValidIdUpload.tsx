'use client'

import React, { useRef, useState, useTransition, useCallback, DragEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Upload, CheckCircle, Loader2, ShieldCheck, X, File as FileIcon } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { uploadValidId } from '../actions/validId'

export type ValidIdType =
  | 'PhilSys'
  | 'Passport'
  | 'DriversLicense'
  | 'SSS'
  | 'GSIS'
  | 'PRC'
  | 'VotersId'
  | 'PostalId'

const VALID_ID_TYPES: { value: ValidIdType; label: string }[] = [
  { value: 'PhilSys', label: 'PhilSys / National ID' },
  { value: 'Passport', label: 'Philippine Passport' },
  { value: 'DriversLicense', label: "Driver's License" },
  { value: 'SSS', label: 'SSS ID' },
  { value: 'GSIS', label: 'GSIS ID' },
  { value: 'PRC', label: 'PRC ID' },
  { value: 'VotersId', label: "Voter's ID" },
  { value: 'PostalId', label: 'Postal ID' },
]

interface ValidIdItem {
  id: string
  type: ValidIdType
  file_name: string
  preview_url?: string
}

interface ValidIdUploadProps {
  caseId: string
  existingIds?: ValidIdItem[]
}

function getFilePreviewType(fileName: string): 'image' | 'pdf' | 'other' {
  const lower = fileName.toLowerCase()
  if (lower.match(/\.(png|jpg|jpeg)$/)) return 'image'
  if (lower.endsWith('.pdf')) return 'pdf'
  return 'other'
}

function UploadZone({
  idType,
  label,
  existing,
  onFileSelected,
  isUploading,
}: {
  idType: ValidIdType
  label: string
  existing?: ValidIdItem
  onFileSelected: (file: File, type: ValidIdType) => void
  isUploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

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
        onFileSelected(file, idType)
      }
    },
    [idType, isUploading, onFileSelected]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelected(file, idType)
      e.target.value = ''
    }
  }

  const previewType = existing ? getFilePreviewType(existing.file_name) : null

  return (
    <Card
      className={cn(
        'flex flex-col gap-sm p-md border-dashed transition-colors group relative overflow-hidden cursor-pointer',
        isDragOver
          ? 'border-accent bg-accent/5'
          : 'hover:border-accent-muted',
        isUploading && 'pointer-events-none'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      aria-label={`Upload ${label}`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
        disabled={isUploading}
        onChange={handleInputChange}
        aria-hidden="true"
      />

      <div className="flex items-center justify-between">
        <span className="text-small font-medium text-text-primary">{label}</span>
        {existing ? (
          <Badge variant="success" className="gap-xs font-medium tracking-normal text-[11px] shadow-sm">
            <CheckCircle size={11} /> Uploaded
          </Badge>
        ) : (
          <Badge variant="neutral" className="text-text-secondary font-medium tracking-normal text-[11px] bg-background border border-border/50">
            Missing
          </Badge>
        )}
      </div>

      {/* Drop/upload zone */}
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-md p-sm min-h-[80px] transition-colors',
          isDragOver ? 'bg-accent/10' : 'bg-surface',
          isUploading && 'bg-surface'
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-xs text-small text-accent-muted">
            <Loader2 size={18} className="animate-spin mb-xs" />
            Uploading...
          </div>
        ) : existing ? (
          <div className="flex flex-col items-center gap-xs">
            {previewType === 'image' && existing.preview_url ? (
              <div className="relative w-full h-20 rounded-button overflow-hidden bg-background">
                <Image
                  src={existing.preview_url}
                  alt={existing.file_name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : previewType === 'pdf' ? (
              <Image src="/pdf.png" alt="PDF" width={28} height={28} className="mb-xs object-contain" />
            ) : (
              <FileIcon size={22} className="text-text-secondary mb-xs" />
            )}
            <span className="text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors truncate max-w-full px-sm text-center">
              {existing.file_name}
            </span>
            <span className="text-[10px] text-accent group-hover:underline mt-xs">Replace file</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-xs text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors text-center">
            <Upload size={18} className="mb-xs" />
            {isDragOver ? (
              <span className="text-accent font-semibold">Drop to upload</span>
            ) : (
              <>
                <span>Click or drag &amp; drop</span>
                <span className="text-[10px] text-text-secondary/70 font-normal">PDF, PNG, JPG — max 50 MB</span>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export function ValidIdUpload({ caseId, existingIds = [] }: ValidIdUploadProps) {
  const [isPending, startTransition] = useTransition()
  const [uploadingType, setUploadingType] = useState<ValidIdType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelected = (file: File, type: ValidIdType) => {
    setError(null)
    setUploadingType(type)

    const formData = new FormData()
    formData.append('caseId', caseId)
    formData.append('idType', type)
    formData.append('file', file)

    startTransition(async () => {
      try {
        await uploadValidId(formData)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : `Failed to upload ${type}`
        setError(msg)
      } finally {
        setUploadingType(null)
      }
    })
  }

  return (
    <Card className="p-xl mb-xl flex flex-col gap-lg">
      <div className="flex items-center gap-sm">
        <ShieldCheck size={20} className="text-accent flex-shrink-0" />
        <div>
          <h3 className="text-heading font-semibold text-text-primary">Valid Government ID</h3>
          <p className="text-small text-text-secondary mt-xs">
            Upload a valid government-issued photo ID. Drag &amp; drop or click to select.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-sm p-md text-error bg-error/10 rounded-card text-small border border-error/20">
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-error hover:text-error/70 transition-colors"
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        {VALID_ID_TYPES.map(({ value, label }) => {
          const existing = existingIds.find((id) => id.type === value)
          const isUploading = isPending && uploadingType === value

          return (
            <UploadZone
              key={value}
              idType={value}
              label={label}
              existing={existing}
              onFileSelected={handleFileSelected}
              isUploading={isUploading}
            />
          )
        })}
      </div>
    </Card>
  )
}
