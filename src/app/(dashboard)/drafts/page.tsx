import { PageContainer } from "@/components/layouts/PageContainer";
import { Card } from "@/components/ui/Card";
import { getAllDrafts } from "@/features/drafts/actions";
import { FileEdit, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

const DRAFT_TYPE_LABELS: Record<string, string> = {
  Affidavit: 'Affidavit of Discrepancy',
  AddressLetter: 'Address Explanation Letter',
  GapLetter: 'Academic Gap Explanation Letter'
}

const DRAFT_TYPE_BADGE_COLORS: Record<string, 'primary' | 'warning' | 'neutral'> = {
  Affidavit: 'primary',
  AddressLetter: 'warning',
  GapLetter: 'neutral'
}

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

      <Card className="p-xl min-h-[400px]">
        {drafts.length > 0 ? (
          <div className="flex flex-col gap-md">
            {drafts.map((draft: any) => {
              const applicant = draft.cases?.applicants?.[0];
              const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}` : "Unknown Applicant";
              const isFinalized = draft.status === 'Finalized';
              
              return (
                <div key={draft.id} className="flex flex-col md:flex-row md:items-center justify-between p-md border border-text-secondary/10 rounded-button hover:bg-background transition-colors gap-md group">
                  <div className="flex items-start gap-md">
                    <div className="p-sm bg-surface-secondary rounded-md text-text-secondary mt-1">
                      <FileEdit size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-sm mb-xs">
                        <Link href={`/cases/${draft.case_id}`} className="text-body font-medium text-text-primary group-hover:text-accent transition-colors">
                          {applicantName}
                        </Link>
                        <Badge variant={DRAFT_TYPE_BADGE_COLORS[draft.type] || 'neutral'}>
                          {DRAFT_TYPE_LABELS[draft.type] || draft.type}
                        </Badge>
                        {isFinalized && (
                          <Badge variant="success">Finalized</Badge>
                        )}
                      </div>
                      <p className="text-small text-text-secondary line-clamp-2">
                        {draft.content?.substring(0, 150)}...
                      </p>
                      <p className="text-xs text-text-secondary mt-xs">
                        Created: {draft.created_at ? new Date(draft.created_at).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center shrink-0">
                    <Link 
                      href={`/cases/${draft.case_id}`}
                      className="inline-flex items-center justify-center rounded-button px-md py-sm text-small font-semibold border border-text-secondary/20 text-text-secondary hover:bg-surface-secondary transition-colors"
                    >
                      View Case <ArrowRight size={16} className="ml-xs" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-text-secondary mt-xl flex flex-col items-center gap-md">
            <FileEdit className="w-12 h-12 text-text-secondary/50" />
            <p>No legal drafts generated yet.</p>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
