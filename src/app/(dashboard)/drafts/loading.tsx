import { PageContainer } from "@/components/layouts/PageContainer";
import { Skeleton, ListPageSkeleton } from "@/components/ui/Skeleton";

export default function DraftsLoading() {
  return (
    <PageContainer>
      <div className="mb-xl flex items-center justify-between">
        <Skeleton className="h-9 w-36" />
      </div>
      <ListPageSkeleton />
    </PageContainer>
  );
}
