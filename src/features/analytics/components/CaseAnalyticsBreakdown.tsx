import { Card } from "@/components/ui/Card";
import { PieChart, ListFilter } from "lucide-react";

interface CaseAnalyticsBreakdownProps {
  statusCounts: Record<string, number>;
  scopeCounts: Record<string, number>;
}

export function CaseAnalyticsBreakdown({ statusCounts, scopeCounts }: CaseAnalyticsBreakdownProps) {
  // Format Status entries
  const statusEntries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const totalCases = statusEntries.reduce((sum, [_, count]) => sum + count, 0);

  // Format Scope entries
  const scopeEntries = Object.entries(scopeCounts).sort((a, b) => b[1] - a[1]);
  const totalScopes = scopeEntries.reduce((sum, [_, count]) => sum + count, 0);
  
  const statusColors = ["bg-accent", "bg-success", "bg-warning", "bg-text-secondary"];
  const scopeColors = ["bg-primary", "bg-secondary", "bg-accent"];

  const formatScopeLabel = (scope: string) => {
    switch (scope) {
      case 'applicant_only': return 'Applicant Documents Only';
      case 'sponsor_only': return 'Sponsor Documents Only';
      case 'applicant_and_sponsor': return 'Cross-Entity (Applicant & Sponsor)';
      default: return scope;
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
      <Card className="p-xl flex flex-col">
        <div className="flex items-center gap-sm mb-lg">
          <PieChart size={20} className="text-accent" />
          <h2 className="text-heading font-semibold text-text-primary">Case Status Distribution</h2>
        </div>
        <div className="flex flex-col gap-md flex-1 justify-center">
          {statusEntries.length > 0 ? statusEntries.map(([label, count], i) => (
            <div key={i} className="flex flex-col gap-xs">
              <div className="flex justify-between text-small">
                <span className="font-medium text-text-primary">{label}</span>
                <span className="text-text-secondary">{count} ({Math.round((count / totalCases) * 100)}%)</span>
              </div>
              <div className="w-full bg-surface border border-text-secondary/10 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${statusColors[i % statusColors.length]} rounded-full`} style={{ width: `${(count / totalCases) * 100}%` }}></div>
              </div>
            </div>
          )) : (
            <p className="text-body text-text-secondary text-center py-md">No cases found.</p>
          )}
        </div>
      </Card>

      <Card className="p-xl flex flex-col">
        <div className="flex items-center gap-sm mb-lg">
          <ListFilter size={20} className="text-accent" />
          <h2 className="text-heading font-semibold text-text-primary">Findings by Origin Scope</h2>
        </div>
        <div className="flex flex-col gap-md flex-1 justify-center">
          {scopeEntries.length > 0 ? scopeEntries.map(([label, count], i) => (
            <div key={i} className="flex flex-col gap-xs">
              <div className="flex justify-between text-small">
                <span className="font-medium text-text-primary">{formatScopeLabel(label)}</span>
                <span className="text-text-secondary">{count} ({Math.round((count / totalScopes) * 100)}%)</span>
              </div>
              <div className="w-full bg-surface border border-text-secondary/10 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${scopeColors[i % scopeColors.length]} rounded-full`} style={{ width: `${(count / totalScopes) * 100}%` }}></div>
              </div>
            </div>
          )) : (
            <p className="text-body text-text-secondary text-center py-md">No findings recorded.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
