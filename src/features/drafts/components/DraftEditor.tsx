'use client'

import React, { useState, useTransition } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDeleteModal } from '@/components/ui/Modal/ConfirmDeleteModal'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { updateDraftContent, finalizeDraft, deleteDraft } from '@/features/drafts/actions'

type DraftType = 'Affidavit' | 'AddressLetter' | 'GapLetter'
type DraftStatus = 'Draft' | 'Finalized'

export interface DraftEditorProps {
  draft: {
    id: string
    case_id: string
    type: DraftType
    content: string
    status: DraftStatus
    created_at: string
  }
  findingCount?: number
}

const DRAFT_TYPE_LABELS: Record<DraftType, string> = {
  Affidavit: 'Affidavit of Discrepancy',
  AddressLetter: 'Address Explanation Letter',
  GapLetter: 'Academic Gap Explanation Letter'
}

const DRAFT_TYPE_BADGE_COLORS: Record<DraftType, 'primary' | 'warning' | 'neutral'> = {
  Affidavit: 'primary',
  AddressLetter: 'warning',
  GapLetter: 'neutral'
}

export function DraftEditor({ draft, findingCount = 0 }: DraftEditorProps) {
  const [content, setContent] = useState(draft.content)
  const [status, setStatus] = useState<DraftStatus>(draft.status)
  const [isSaved, setIsSaved] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeletingDraft, setIsDeletingDraft] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  const isFinalized = status === 'Finalized'

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setIsSaved(false)
    setSaveError(null)
  }

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateDraftContent(draft.id, content)
        setIsSaved(true)
        setSaveError(null)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save draft')
      }
    })
  }

  const handleFinalize = () => {
    startTransition(async () => {
      try {
        // Save any pending changes first
        if (!isSaved) {
          await updateDraftContent(draft.id, content)
          setIsSaved(true)
        }
        await finalizeDraft(draft.id, draft.case_id)
        setStatus('Finalized')
        setSaveError(null)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to finalize draft')
      }
    })
  }

  return (
    <>
    <Card className={cn(
      "flex flex-col gap-md p-xl border border-text-secondary/10 bg-surface shadow-sm hover:border-brand-primary group transition-all duration-300 origin-top",
      isAnimatingOut ? "opacity-0 scale-95 h-0 overflow-hidden mb-[-24px] py-0 border-0" : "opacity-100 scale-100"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-md">
        <div className="flex flex-col gap-xs">
          <h3 className="text-heading font-semibold text-text-primary">
            {DRAFT_TYPE_LABELS[draft.type]}
          </h3>
          <p className="text-small text-text-secondary">
            Based on {findingCount} accepted finding{findingCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <Badge variant={DRAFT_TYPE_BADGE_COLORS[draft.type]}>
            {draft.type}
          </Badge>
          {isFinalized && (
            <Badge variant="success">Finalized</Badge>
          )}
          <button 
            type="button" 
            onClick={() => setShowDeleteModal(true)}
            disabled={isPending || isDeletingDraft}
            className="text-text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity ml-xs disabled:opacity-50"
            title="Delete Draft"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Content Editor */}
      <div className="flex flex-col gap-xs">
        <label
          htmlFor={`draft-editor-${draft.id}`}
          className="text-small font-medium text-text-secondary"
        >
          Draft Content
        </label>
        <textarea
          id={`draft-editor-${draft.id}`}
          value={content}
          onChange={handleContentChange}
          disabled={isFinalized || isPending}
          rows={14}
          className="w-full rounded-input border border-text-secondary/20 bg-background p-md text-small text-text-primary font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          aria-label={`Edit content for ${DRAFT_TYPE_LABELS[draft.type]}`}
        />
      </div>

      {/* Error Message */}
      {saveError && (
        <p className="text-small text-error font-medium" role="alert">
          {saveError}
        </p>
      )}

      {/* Action Buttons */}
      {!isFinalized && (
        <div className="flex items-center justify-between gap-md pt-xs border-t border-text-secondary/10">
          <span className="text-small text-text-secondary">
            {isSaved ? '✓ All changes saved' : '● Unsaved changes'}
          </span>
          <div className="flex items-center gap-sm">
            <button
              id={`save-draft-${draft.id}`}
              type="button"
              onClick={handleSave}
              disabled={isPending || isSaved}
              className="rounded-button px-md py-sm text-small font-semibold border border-accent text-accent hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              id={`finalize-draft-${draft.id}`}
              type="button"
              onClick={handleFinalize}
              disabled={isPending}
              className="rounded-button px-md py-sm text-small font-semibold bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {isPending ? 'Finalizing…' : 'Finalize Draft'}
            </button>
          </div>
        </div>
      )}

      {isFinalized && (
        <div className="flex items-center justify-between gap-md pt-xs border-t border-text-secondary/10">
          <span className="text-small font-medium text-success">
            ✓ This draft has been finalized and is ready for export.
          </span>
          <button
            type="button"
            onClick={() => {
              startTransition(async () => {
                const { generateDraftExport } = await import('@/features/exports/actions')
                try {
                  const res = await generateDraftExport(draft.case_id, draft.id)
                  if (res && 'error' in res) {
                    setSaveError(res.error as string)
                  }
                } catch (e: any) {
                  setSaveError(e.message || 'Failed to generate export')
                }
              })
            }}
            disabled={isPending}
            className="rounded-button px-md py-sm text-small font-semibold bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {isPending ? 'Generating...' : 'Generate Export'}
          </button>
        </div>
      )}
    </Card>

    <ConfirmDeleteModal 
      isOpen={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      title="Delete Legal Draft"
      message="Are you sure you want to delete this draft? This action cannot be undone."
      isDeleting={isDeletingDraft}
      onConfirm={async () => {
        setIsDeletingDraft(true);
        try {
          setIsAnimatingOut(true);
          await new Promise(res => setTimeout(res, 300));
          await deleteDraft(draft.id, draft.case_id);
          setIsDeletingDraft(false);
          setShowDeleteModal(false);
          // Don't reset isAnimatingOut so it stays hidden before unmount
        } catch (err) {
          console.error(err);
          setIsDeletingDraft(false);
          setIsAnimatingOut(false);
          setSaveError(err instanceof Error ? err.message : 'Failed to delete draft. You might not have permission.');
          setShowDeleteModal(false);
        }
      }}
    />
    </>
  )
}
