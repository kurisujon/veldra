import { PageContainer } from "@/components/layouts/PageContainer";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return (
    <PageContainer>
      <div className="mb-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <div className="flex flex-col gap-xl">
        {/* Summary metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-24" />
          ))}
        </div>

        {/* Breakdown charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>

        {/* Bottom charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
          <SkeletonCard className="h-56" />
          <SkeletonCard className="h-56" />
        </div>
      </div>
    </PageContainer>
  );
}
