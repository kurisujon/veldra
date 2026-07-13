import { PageContainer } from "@/components/layouts/PageContainer";
import { CasesListSkeleton } from "@/components/ui/Skeleton";

export default function CasesLoading() {
  return (
    <PageContainer>
      <div className="mb-xl flex items-center justify-between">
        <div className="h-9 w-48 animate-pulse rounded-button bg-text-secondary/10" aria-hidden="true" />
        <div className="h-9 w-28 animate-pulse rounded-button bg-text-secondary/10" aria-hidden="true" />
      </div>
      <CasesListSkeleton />
    </PageContainer>
  );
}
