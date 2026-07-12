'use server'

import { createClient } from '@/lib/supabase/server'
import { getDashboardAnalytics } from '@/features/dashboard/actions'

export interface AnalyticsData {
  totalFindings: number;
  criticalDiscrepancies: number;
  resolvedRate: number;
  avgResolutionTimeHours: number;
  categoryCounts: Record<string, number>;
  conflictingSources: Array<{ pair: string; count: number }>;
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = await createClient()
  const dashboardStats = await getDashboardAnalytics();

  const totalFindings = Object.values(dashboardStats.findings_by_category).reduce((a, b) => a + b, 0);
  const criticalDiscrepancies = dashboardStats.findings_by_severity['High'] || 0;
  const resolvedRate = dashboardStats.resolution_rate || 0;
  
  // Format to 1 decimal place max
  const avgResolutionTimeHours = Math.round(dashboardStats.average_processing_time_hours * 10) / 10;

  // Query conflicting sources using finding_documents
  // This fetches which documents are associated with which findings
  const { data: findingDocs, error } = await supabase
    .from('finding_documents')
    .select('finding_id, documents(type)');

  let conflictingSources: Array<{ pair: string; count: number }> = [];

  if (!error && findingDocs) {
    // Group document types by finding_id
    const findingMap: Record<string, string[]> = {};
    for (const fd of findingDocs) {
      if (!findingMap[fd.finding_id]) {
        findingMap[fd.finding_id] = [];
      }
      // @ts-ignore - Supabase type for joined tables sometimes needs coercing
      const docType = fd.documents?.type;
      if (docType) {
        findingMap[fd.finding_id].push(docType);
      }
    }

    // Count pairs
    const pairCounts: Record<string, number> = {};
    for (const docTypes of Object.values(findingMap)) {
      if (docTypes.length >= 2) {
        // Sort to ensure "A <-> B" is same as "B <-> A"
        const sorted = docTypes.sort();
        // Generate all unique pairs
        for (let i = 0; i < sorted.length - 1; i++) {
          for (let j = i + 1; j < sorted.length; j++) {
            if (sorted[i] !== sorted[j]) {
              const pair = `${sorted[i]} ↔ ${sorted[j]}`;
              pairCounts[pair] = (pairCounts[pair] || 0) + 1;
            }
          }
        }
      }
    }

    conflictingSources = Object.entries(pairCounts)
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }

  return {
    totalFindings,
    criticalDiscrepancies,
    resolvedRate,
    avgResolutionTimeHours,
    categoryCounts: dashboardStats.findings_by_category,
    conflictingSources
  };
}
