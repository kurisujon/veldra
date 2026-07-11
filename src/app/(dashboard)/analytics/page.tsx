import { PageContainer } from "@/components/layouts/PageContainer";
import { Card } from "@/components/ui/Card";
import { AnalyticsSummary } from "@/features/analytics/components/AnalyticsSummary";
import { DiscrepancyBreakdown } from "@/features/analytics/components/DiscrepancyBreakdown";

export default function AnalyticsPage() {
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
        <AnalyticsSummary />
        <DiscrepancyBreakdown />
      </div>
    </PageContainer>
  );
}
