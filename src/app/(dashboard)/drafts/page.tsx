import { PageContainer } from "@/components/layouts/PageContainer";
import { getAllDrafts } from "@/features/drafts/actions";
import { DraftsList } from "@/features/drafts/components/DraftsList";

export default async function Drafts() {
  const draftsData = await getAllDrafts();
  const drafts = Array.isArray(draftsData) ? draftsData : [];

  return (
    <PageContainer>
      <div className="mb-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h1 className="text-title font-semibold text-text-primary">All Legal Drafts</h1>
          <p className="text-body text-text-secondary mt-xs">
            Review and manage generated legal drafts across all active cases.
          </p>
        </div>
      </div>

      <DraftsList drafts={drafts} />
    </PageContainer>
  );
}
