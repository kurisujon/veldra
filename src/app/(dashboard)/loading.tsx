import { PageContainer } from "@/components/layouts/PageContainer";
import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <div className="mb-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h1 className="text-title font-semibold text-text-primary">Dashboard</h1>
          <p className="text-body text-text-secondary mt-xs">
            Overview of active visa verification cases and system status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-surface border border-text-secondary/10 rounded-card p-lg flex flex-col gap-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="animate-pulse bg-surface border border-text-secondary/10 rounded-card p-xl flex flex-col gap-md mt-xl">
        <Skeleton className="h-6 w-40 mb-md" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </PageContainer>
  );
}
