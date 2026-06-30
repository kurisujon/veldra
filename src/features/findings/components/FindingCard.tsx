'use client'

import React, { useTransition } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { updateFindingStatus } from '../actions'
import type { Database } from '@/types/database'

type Finding = Database['public']['Tables']['findings']['Row']

const formatCamelCaseTitle = (title: string) => {
  if (!title) return title;
  return title
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export interface FindingCardProps {
  finding: Finding
  isSelected?: boolean
  onSelect?: () => void
  onStatusChange?: (status: Finding['status']) => void
  readOnly?: boolean
}

export function FindingCard({
  finding,
  isSelected = false,
  onSelect,
  onStatusChange,
  readOnly = false
}: FindingCardProps) {
  const [isPending, startTransition] = useTransition()
  const isOpen = finding.status === 'Open'

  const handleStatusUpdate = (newStatus: 'Open' | 'Accepted' | 'Resolved' | 'Ignored') => {
    startTransition(async () => {
      try {
        const result = await updateFindingStatus(finding.id, finding.case_id, newStatus)
        if (result.success && onStatusChange) {
          onStatusChange(newStatus)
        }
      } catch (err) {
        console.error('Failed to update status:', err)
      }
    })
  }

  // Map severity to Badge variants
  const severityVariant = 
    finding.severity === 'High' ? 'error' : 
    finding.severity === 'Medium' ? 'warning' : 
    'neutral'

  // Map status to Badge variants
  const statusVariant = 
    finding.status === 'Open' ? 'warning' : 
    finding.status === 'Accepted' ? 'primary' : 
    finding.status === 'Resolved' ? 'success' : 
    'neutral'

  return (
    <Card
      onClick={onSelect}
      className={`p-lg flex flex-col gap-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${
        isSelected 
          ? 'border-accent ring-1 ring-accent' 
          : 'border-text-secondary/10 hover:border-text-secondary/30'
      } ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
      data-testid="finding-card"
    >
      <div className="flex justify-between items-center w-full">
        <span className="text-small font-medium text-text-secondary tracking-normal">
          {finding.category}
        </span>
        <Badge variant={severityVariant}>
          {finding.severity}
        </Badge>
      </div>

      <div className="flex flex-col gap-xs">
        <h4 className="text-heading font-semibold text-text-primary">{formatCamelCaseTitle(finding.title)}</h4>
        <p 
          className="text-small text-text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: finding.description }}
        />
      </div>

      <div className="flex items-center justify-between mt-xs" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-sm text-small text-text-secondary font-medium">
          <span>Status:</span>
          <select
            data-testid="finding-status-select"
            value={finding.status}
            disabled={readOnly || isPending}
            onChange={(e) => handleStatusUpdate(e.target.value as any)}
            className="bg-surface border border-text-secondary/20 rounded-input px-sm py-xs text-small font-medium focus:ring-accent focus:border-accent outline-none disabled:opacity-70"
          >
            <option value="Open">Open</option>
            <option value="Accepted">Accepted</option>
            <option value="Resolved">Resolved</option>
            <option value="Ignored">Ignored</option>
          </select>
          <Badge data-testid="finding-card-status-badge" variant={statusVariant}>
            {finding.status}
          </Badge>
        </div>

        {isOpen && !readOnly && (
          <div className="flex gap-sm">
            <Button
              variant="ghost"
              className="px-md py-xs text-small text-text-secondary hover:text-text-primary h-auto"
              disabled={isPending}
              onClick={() => handleStatusUpdate('Ignored')}
            >
              Ignore
            </Button>
            <Button
              variant="secondary"
              className="px-md py-xs text-small h-auto"
              disabled={isPending}
              onClick={() => handleStatusUpdate('Resolved')}
            >
              Resolve
            </Button>
            <Button
              variant="primary"
              className="px-md py-xs text-small h-auto"
              disabled={isPending}
              onClick={() => handleStatusUpdate('Accepted')}
            >
              Accept
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
