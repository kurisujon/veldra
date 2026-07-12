import { Card } from "@/components/ui/Card";

interface DiscrepancyBreakdownProps {
  categoryCounts: Record<string, number>;
  conflictingSources: Array<{ pair: string; count: number }>;
}

export function DiscrepancyBreakdown({ categoryCounts, conflictingSources }: DiscrepancyBreakdownProps) {
  // Format categories and calculate max for bar widths
  const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = categoryEntries.length > 0 ? Math.max(...categoryEntries.map(e => e[1])) : 1;
  
  // Assign colors cyclically based on index
  const colors = ["bg-error", "bg-warning", "bg-accent", "bg-text-secondary"];
  
  const categories = categoryEntries.map(([label, count], i) => ({
    label,
    count,
    color: colors[i % colors.length],
    widthPercent: maxCount > 0 ? (count / maxCount) * 100 : 0
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
      <Card className="p-xl flex flex-col">
        <h2 className="text-heading font-semibold text-text-primary mb-lg">Discrepancy by Category</h2>
        <div className="flex flex-col gap-md flex-1 justify-center">
          {categories.length > 0 ? categories.map((cat, i) => (
            <div key={i} className="flex flex-col gap-xs">
              <div className="flex justify-between text-small">
                <span className="font-medium text-text-primary">{cat.label}</span>
                <span className="text-text-secondary">{cat.count}</span>
              </div>
              <div className="w-full bg-surface border border-text-secondary/10 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.widthPercent}%` }}></div>
              </div>
            </div>
          )) : (
            <p className="text-body text-text-secondary text-center py-md">No findings yet.</p>
          )}
        </div>
      </Card>

      <Card className="p-xl flex flex-col">
        <h2 className="text-heading font-semibold text-text-primary mb-lg">Top Conflicting Sources</h2>
        <div className="flex flex-col gap-sm">
          {conflictingSources.length > 0 ? conflictingSources.map((source, i) => (
            <div key={i} className="flex items-center justify-between p-md border border-text-secondary/10 rounded-button bg-surface hover:bg-background transition-colors">
              <p className="text-body text-text-primary font-medium">{source.pair}</p>
              <span className="text-error font-semibold text-small">
                {source.count} conflicts
              </span>
            </div>
          )) : (
            <p className="text-body text-text-secondary text-center py-md">No conflicts yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
