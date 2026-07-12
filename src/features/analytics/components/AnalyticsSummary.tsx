import { Card } from "@/components/ui/Card";
import { AlertTriangle, CheckCircle, Clock, FileWarning } from "lucide-react";

interface AnalyticsSummaryProps {
  totalFindings: number;
  criticalDiscrepancies: number;
  resolvedRate: number;
  avgResolutionTimeHours: number;
}

export function AnalyticsSummary({ 
  totalFindings, 
  criticalDiscrepancies, 
  resolvedRate, 
  avgResolutionTimeHours 
}: AnalyticsSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
      <Card className="p-lg flex items-center justify-between border-l-4" style={{ borderLeftColor: 'var(--warning)' }}>
        <div className="flex flex-col gap-xs">
          <p className="text-body font-medium text-text-secondary">Total Findings</p>
          <h3 className="text-title font-semibold text-text-primary">{totalFindings}</h3>
        </div>
        <div className="text-warning">
          <AlertTriangle className="w-xl h-xl" />
        </div>
      </Card>

      <Card className="p-lg flex items-center justify-between border-l-4" style={{ borderLeftColor: 'var(--error)' }}>
        <div className="flex flex-col gap-xs">
          <p className="text-body font-medium text-text-secondary">Critical Discrepancies</p>
          <h3 className="text-title font-semibold text-text-primary">{criticalDiscrepancies}</h3>
        </div>
        <div className="text-error">
          <FileWarning className="w-xl h-xl" />
        </div>
      </Card>

      <Card className="p-lg flex items-center justify-between border-l-4" style={{ borderLeftColor: 'var(--success)' }}>
        <div className="flex flex-col gap-xs">
          <p className="text-body font-medium text-text-secondary">Resolved Rate</p>
          <h3 className="text-title font-semibold text-text-primary">{Math.round(resolvedRate)}%</h3>
        </div>
        <div className="text-success">
          <CheckCircle className="w-xl h-xl" />
        </div>
      </Card>

      <Card className="p-lg flex items-center justify-between border-l-4" style={{ borderLeftColor: 'var(--accent)' }}>
        <div className="flex flex-col gap-xs">
          <p className="text-body font-medium text-text-secondary">Avg Resolution Time</p>
          <h3 className="text-title font-semibold text-text-primary">
            {avgResolutionTimeHours < 24 ? `${avgResolutionTimeHours} hrs` : `${Math.round(avgResolutionTimeHours / 24 * 10)/10} days`}
          </h3>
        </div>
        <div className="text-accent">
          <Clock className="w-xl h-xl" />
        </div>
      </Card>
    </div>
  );
}
