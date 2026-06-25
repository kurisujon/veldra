import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { Database } from '@/types/database';

type CaseStatus = Database['public']['Enums']['case_status'];

const statusMap: Record<CaseStatus, { label: string, variant: 'neutral' | 'primary' | 'success' | 'warning' | 'error' }> = {
  Draft: { label: 'Draft', variant: 'neutral' },
  Uploaded: { label: 'Uploaded', variant: 'primary' },
  Processing: { label: 'Processing', variant: 'warning' },
  NeedsReview: { label: 'Needs Review', variant: 'warning' },
  Reviewed: { label: 'Reviewed', variant: 'success' },
  DraftGenerated: { label: 'Draft Generated', variant: 'primary' },
  ReadyForExport: { label: 'Ready for Export', variant: 'primary' },
  Exported: { label: 'Exported', variant: 'success' },
  Archived: { label: 'Archived', variant: 'neutral' }
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const config = statusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
