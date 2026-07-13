import { PageContainer } from "@/components/layouts/PageContainer";
import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function CaseDetailLoading() {
  return (
    <PageContainer>
      {/* Back link */}
      <Skeleton className="h-5 w-32 mb-md" />

      {/* Case profile card */}
      <div className="animate-pulse bg-surface border border-text-secondary/10 rounded-card p-xl mb-xl flex flex-col gap-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-md">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md pt-lg border-t border-text-secondary/10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-xs">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Document upload / list placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        <div className="animate-pulse bg-surface border border-text-secondary/10 rounded-card p-xl flex flex-col gap-lg">
          <Skeleton className="h-6 w-44" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-card" />
            ))}
          </div>
        </div>
        <div className="animate-pulse bg-surface border border-text-secondary/10 rounded-card p-xl flex flex-col gap-md">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
