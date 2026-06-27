import { PageContainer } from "@/components/layouts/PageContainer";
import { Card } from "@/components/ui/Card";
import { getCases } from "@/features/cases/actions";
import { CaseStatusBadge } from "@/features/cases/components/CaseStatusBadge";
import { CreateCaseButton } from "@/features/cases/components/CreateCaseButton";
import { CaseList } from "@/features/cases/components/CaseList";

export default async function Cases() {
  let cases: any[] = [];
  let error: string | null = null;
  
  try {
    cases = await getCases();
  } catch (e: any) {
    error = e.message;
  }

  return (
    <PageContainer>
      <div className="mb-xl flex items-center justify-between">
        <h1 className="text-title font-semibold text-text-primary">Cases Dashboard</h1>
        <CreateCaseButton />
      </div>

      {error ? (
        <Card className="p-xl text-error bg-error/10">Failed to load cases: {error}</Card>
      ) : (
        <CaseList initialCases={cases} />
      )}
    </PageContainer>
  );
}
