'use client'

import React, { useRef, useState, useTransition } from 'react'
import { uploadDocument } from '../actions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const DOCUMENT_TYPES = ['PSABirth', 'PSAMarriage', 'TOR', 'SF10', 'Diploma'] as const

export function DocumentUpload({ caseId }: { caseId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('PSABirth')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      setError(null)
    }
  }

  const handleUpload = () => {
    if (!selectedFile) {
      setError('Please select a file to upload.')
      return
    }

    const formData = new FormData()
    formData.append('caseId', caseId)
    formData.append('type', selectedType)
    formData.append('file', selectedFile)

    startTransition(async () => {
      try {
        await uploadDocument(formData)
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to upload document')
      }
    })
  }

  return (
    <Card className="p-xl mb-xl">
      <div className="flex flex-col gap-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-heading font-semibold text-text-primary">Upload Document</h3>
        </div>

        {error && (
          <div className="p-md text-error bg-background rounded-card text-small">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-lg">
          <div className="flex flex-col gap-sm">
            <label className="text-small font-medium text-text-secondary">Document Type</label>
            <select 
              className="border border-background rounded-input p-md bg-surface text-body text-text-primary"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              disabled={isPending}
            >
              {DOCUMENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div 
            className="border-2 border-dashed border-background rounded-card p-xl flex flex-col items-center justify-center bg-background hover:opacity-80 cursor-pointer transition-opacity"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isPending}
            />
            {selectedFile ? (
              <span className="text-small font-medium text-text-primary">{selectedFile.name}</span>
            ) : (
              <span className="text-small text-text-secondary">Click to browse or drag and drop</span>
            )}
          </div>

          <div className="flex justify-end mt-sm">
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isPending}
            >
              {isPending ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
