import { PageContainer } from "@/components/layouts/PageContainer";
import { CasesListSkeleton } from "@/components/ui/Skeleton";

export default function CasesLoading() {
  return (
    <PageContainer>
      <div className="mb-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h1 className="text-title font-semibold text-text-primary">Cases</h1>
          <p className="text-body text-text-secondary mt-xs">
            Manage applicant cases and their current verification status.
          </p>
        </div>
        <div className="h-9 w-28 animate-pulse rounded-button bg-text-secondary/10" aria-hidden="true" />
      </div>
      <CasesListSkeleton />
    </PageContainer>
  );
}
