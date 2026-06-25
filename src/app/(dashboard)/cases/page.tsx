import { PageContainer } from "@/components/layouts/PageContainer";
import { Card } from "@/components/ui/Card";
import { getCases } from "@/features/cases/actions";
import { CaseStatusBadge } from "@/features/cases/components/CaseStatusBadge";
import { CreateCaseButton } from "@/features/cases/components/CreateCaseButton";
import Link from "next/link";

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
      ) : cases.length === 0 ? (
        <Card className="p-xl text-center text-text-secondary">
          No cases found. Create a new case to get started.
        </Card>
      ) : (
        <div className="grid gap-md">
          {cases.map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`}>
              <Card className="flex items-center justify-between p-lg transition-colors hover:bg-background">
                <div>
                  <h3 className="text-heading font-medium text-text-primary">
                    {c.applicants?.[0]?.first_name} {c.applicants?.[0]?.last_name}
                  </h3>
                  <p className="text-small text-text-secondary">Case ID: {c.id}</p>
                </div>
                <CaseStatusBadge status={c.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
