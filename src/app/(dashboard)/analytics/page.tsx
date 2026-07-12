import { PageContainer } from "@/components/layouts/PageContainer";
import { AnalyticsSummary } from "@/features/analytics/components/AnalyticsSummary";
import { DiscrepancyBreakdown } from "@/features/analytics/components/DiscrepancyBreakdown";
import { getAnalyticsData } from "@/features/analytics/actions";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h1 className="text-title font-semibold text-text-primary">Analytics</h1>
          <p className="text-body text-text-secondary mt-xs">
            Review finding statistics, discrepancy trends, and resolution rates.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-xl">
        <AnalyticsSummary 
          totalFindings={data.totalFindings}
          criticalDiscrepancies={data.criticalDiscrepancies}
          resolvedRate={data.resolvedRate}
          avgResolutionTimeHours={data.avgResolutionTimeHours}
        />
        <DiscrepancyBreakdown 
          categoryCounts={data.categoryCounts}
          conflictingSources={data.conflictingSources}
        />
      </div>
    </PageContainer>
  );
}
