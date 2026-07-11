import { Card } from "@/components/ui/Card";

export function DiscrepancyBreakdown() {
  const categories = [
    { label: "Name Mismatches", count: 45, color: "bg-error", width: "w-[45%]" },
    { label: "Date Variations", count: 32, color: "bg-warning", width: "w-[32%]" },
    { label: "Address Inconsistencies", count: 28, color: "bg-accent", width: "w-[28%]" },
    { label: "Timeline Gaps", count: 23, color: "bg-text-secondary", width: "w-[23%]" }
  ];

  const sourcePairs = [
    { pair: "Birth Certificate ↔ Marriage Certificate", errors: 15 },
    { pair: "Birth Certificate ↔ TOR", errors: 42 },
    { pair: "Birth Certificate ↔ Diploma", errors: 38 },
    { pair: "Marriage Certificate ↔ TOR", errors: 12 },
    { pair: "TOR ↔ Diploma", errors: 21 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
      <Card className="p-xl flex flex-col">
        <h2 className="text-heading font-semibold text-text-primary mb-lg">Discrepancy by Category</h2>
        <div className="flex flex-col gap-md flex-1 justify-center">
          {categories.map((cat, i) => (
            <div key={i} className="flex flex-col gap-xs">
              <div className="flex justify-between text-small">
                <span className="font-medium text-text-primary">{cat.label}</span>
                <span className="text-text-secondary">{cat.count}</span>
              </div>
              <div className="w-full bg-surface border border-text-secondary/10 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${cat.color} ${cat.width} rounded-full`}></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-xl flex flex-col">
        <h2 className="text-heading font-semibold text-text-primary mb-lg">Top Conflicting Sources</h2>
        <div className="flex flex-col gap-sm">
          {sourcePairs.map((source, i) => (
            <div key={i} className="flex items-center justify-between p-md border border-text-secondary/10 rounded-button bg-surface hover:bg-background transition-colors">
              <p className="text-body text-text-primary font-medium">{source.pair}</p>
              <span className="text-error font-semibold text-small">
                {source.errors} conflicts
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
