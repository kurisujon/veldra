import { PageContainer } from "@/components/layouts/PageContainer";
import { Skeleton, ListPageSkeleton } from "@/components/ui/Skeleton";

export default function ExportsLoading() {
  return (
    <PageContainer>
      <div className="mb-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h1 className="text-title font-semibold text-text-primary">Export Packages</h1>
          <p className="text-body text-text-secondary mt-xs">
            Manage and download generated export packages.
          </p>
        </div>
      </div>
      <ListPageSkeleton />
    </PageContainer>
  );
}
