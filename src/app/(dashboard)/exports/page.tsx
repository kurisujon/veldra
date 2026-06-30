import { PageContainer } from "@/components/layouts/PageContainer";
import { Card } from "@/components/ui/Card";
import { getAllExports } from "@/features/exports/actions";
import { FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

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

      <Card className="p-xl min-h-[400px]">
        {exports.length > 0 ? (
          <div className="flex flex-col gap-md">
            {exports.map((exp: any) => {
              const applicant = exp.cases?.applicants?.[0];
              const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}` : "Unknown Applicant";
              
              return (
                <div key={exp.id} className="flex flex-col md:flex-row md:items-center justify-between p-md border border-text-secondary/10 rounded-button hover:bg-background transition-colors gap-md">
                  <div className="flex items-center gap-md">
                    <div className="p-sm bg-surface-secondary rounded-md text-text-secondary">
                      <FileText size={20} />
                    </div>
                    <div>
                      <Link href={`/cases/${exp.case_id}`} className="text-body font-medium text-accent hover:underline">
                        {applicantName} - {exp.title || 'Verification Report'}
                      </Link>
                      <p className="text-small text-text-secondary">
                        Generated on: {exp.generated_at ? new Date(exp.generated_at).toLocaleString() : new Date(exp.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-sm">
                    {exp.pdf_path && (
                      <a 
                        href={exp.pdf_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-button px-md py-sm text-small font-semibold bg-surface-secondary text-text-primary hover:bg-border-default transition-colors"
                      >
                        📄 Download PDF
                      </a>
                    )}
                    {exp.docx_path && (
                      <a 
                        href={exp.docx_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-button px-md py-sm text-small font-semibold bg-surface-secondary text-text-primary hover:bg-border-default transition-colors"
                      >
                        📝 Download DOCX
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-text-secondary mt-xl flex flex-col items-center gap-md">
            <FileText className="w-12 h-12 text-text-secondary/50" />
            <p>No exports generated yet.</p>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
