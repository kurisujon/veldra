'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { addSponsor } from '../actions'
import { toast } from 'react-hot-toast'

interface AddSponsorModalProps {
  caseId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddSponsorModal({ caseId, isOpen, onClose, onSuccess }: AddSponsorModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await addSponsor({
      case_id: caseId,
      first_name: firstName,
      last_name: lastName,
      relationship
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success('Sponsor added successfully')
      setFirstName('')
      setLastName('')
      setRelationship('')
      if (onSuccess) onSuccess()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Sponsor">
      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        {error && <div className="text-error text-small bg-error/10 p-sm rounded-md">{error}</div>}
        
        <div className="flex flex-col gap-xs">
          <label className="text-small font-medium text-text-secondary">First Name</label>
          <Input 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
            placeholder="Juan" 
            required 
          />
        </div>
        
        <div className="flex flex-col gap-xs">
          <label className="text-small font-medium text-text-secondary">Last Name</label>
          <Input 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
            placeholder="Dela Cruz" 
            required 
          />
        </div>
        
        <div className="flex flex-col gap-xs">
          <label className="text-small font-medium text-text-secondary">Relationship to Applicant</label>
          <Input 
            value={relationship} 
            onChange={(e) => setRelationship(e.target.value)} 
            placeholder="e.g., Parent, Sibling, Uncle" 
            required 
          />
        </div>

        <div className="flex justify-end gap-sm mt-md">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Sponsor'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
