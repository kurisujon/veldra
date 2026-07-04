import { PageContainer } from "@/components/layouts/PageContainer";
import { getAllExports } from "@/features/exports/actions";
import { ExportsList } from "@/features/exports/components/ExportsList";

export default async function Exports() {
  const exportsData = await getAllExports();
  const exports = Array.isArray(exportsData) ? exportsData : [];

  return (
    <PageContainer>
      <div className="mb-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h1 className="text-title font-semibold text-text-primary">All Exports</h1>
          <p className="text-body text-text-secondary mt-xs">
            A global view of all generated verification reports and legal drafts across all cases.
          </p>
        </div>
      </div>

      <ExportsList exports={exports} />
    </PageContainer>
  );
}
