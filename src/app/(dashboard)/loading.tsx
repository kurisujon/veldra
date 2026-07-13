import { PageContainer } from "@/components/layouts/PageContainer";
import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-sm mb-xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
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
