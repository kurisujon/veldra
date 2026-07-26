'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AddSponsorModal } from './AddSponsorModal'
import { UserPlus, Users } from 'lucide-react'

interface Sponsor {
  id: string
  first_name: string
  last_name: string
  relationship: string
  created_at: string
}

interface SponsorListProps {
  caseId: string
  sponsors: Sponsor[]
}

export function SponsorList({ caseId, sponsors }: SponsorListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const canAddMore = sponsors.length < 2

  return (
    <Card className="p-xl mb-xl flex flex-col gap-lg">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-sm">
          <Users size={18} className="text-accent" />
          <h3 className="text-heading font-semibold text-text-primary">Sponsors</h3>
          <Badge variant="neutral" className="text-[11px] font-medium">
            {sponsors.length} / 2
          </Badge>
        </div>
        {canAddMore && (
          <Button
            variant="secondary"
            className="gap-xs text-small h-auto px-md py-xs"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={14} />
            Add Sponsor
          </Button>
        )}
      </div>

      {sponsors.length === 0 ? (
        <div className="text-center py-lg text-small text-text-secondary border border-dashed rounded-card">
          No sponsors added yet. Up to 2 sponsors may be linked to this case.
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          {sponsors.map((sponsor, index) => (
            <div
              key={sponsor.id}
              className="flex items-center justify-between p-md bg-background rounded-card border border-text-secondary/10"
            >
              <div className="flex flex-col gap-xs">
                <span className="text-body font-semibold text-text-primary">
                  {sponsor.first_name} {sponsor.last_name}
                </span>
                <span className="text-small text-text-secondary">{sponsor.relationship}</span>
              </div>
              <Badge variant="primary" className="text-[11px] font-medium">
                Sponsor {index + 1}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <AddSponsorModal
        caseId={caseId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Card>
  )
}
