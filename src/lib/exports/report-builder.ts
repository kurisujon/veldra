import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export type Case = Database['public']['Tables']['cases']['Row'];
export type Applicant = Database['public']['Tables']['applicants']['Row'];
export type Finding = Database['public']['Tables']['findings']['Row'];
export type Draft = Database['public']['Tables']['generated_drafts']['Row'];

export interface UnifiedReportData {
  caseInfo: Case;
  applicant: Applicant;
  findings: Finding[];
  drafts: Draft[];
}

export class ReportBuilder {
  static async build(caseId: string, supabase: SupabaseClient<Database>): Promise<UnifiedReportData> {
    const { data: caseInfo, error: caseErr } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
    if (caseErr) throw new Error(`Case fetch error: ${caseErr.message}`);

    const { data: applicant, error: appErr } = await supabase
      .from('applicants')
      .select('*')
      .eq('case_id', caseId)
      .single();
    if (appErr) throw new Error(`Applicant fetch error: ${appErr.message}`);

    const { data: findings, error: findErr } = await supabase
      .from('findings')
      .select('*')
      .eq('case_id', caseId);
    if (findErr) throw new Error(`Findings fetch error: ${findErr.message}`);

    const { data: drafts, error: draftErr } = await supabase
      .from('generated_drafts')
      .select('*')
      .eq('case_id', caseId);
    if (draftErr) throw new Error(`Drafts fetch error: ${draftErr.message}`);

    return {
      caseInfo,
      applicant,
      findings,
      drafts,
    };
  }
}
