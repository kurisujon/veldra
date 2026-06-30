import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { ReportBuilder } from './report-builder';
import { PDFGenerator } from './pdf-generator';
import { DocxGenerator } from './docx-generator';
import { StorageService } from './storage';

export class ExportService {
  static async generateReport(supabase: SupabaseClient<Database>, caseId: string, userId: string, title: string = 'Verification Report') {
    try {
      // 1. Build unified report data
      const data = await ReportBuilder.build(caseId, supabase);
      
      // 2. Generate PDF and DOCX in parallel
      const [pdfBuffer, docxBuffer] = await Promise.all([
        PDFGenerator.generate(data, title),
        DocxGenerator.generate(data, title)
      ]);
      
      // 3. Upload both buffers to storage
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const [pdfPath, docxPath] = await Promise.all([
        StorageService.uploadExport(supabase, caseId, `${sanitizedTitle}.pdf`, pdfBuffer, 'application/pdf'),
        StorageService.uploadExport(supabase, caseId, `${sanitizedTitle}.docx`, docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      ]);
      
      // 4. Insert export_packages record
      const { data: record, error } = await supabase
        .from('export_packages')
        .insert({
          case_id: caseId,
          pdf_path: pdfPath,
          docx_path: docxPath,
          title: title,
          status: 'Completed',
          generated_by: userId,
          generated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw new Error(`Failed to insert export package: ${error.message}`);
      
      return { success: true, data: record };
    } catch (error: any) {
      return { error: error.message || 'Unknown error occurred during export generation' };
    }
  }

  static async generateDraftExport(supabase: SupabaseClient<Database>, caseId: string, draftId: string, userId: string) {
    try {
      // Fetch specific draft
      const { data: draft, error: draftErr } = await supabase
        .from('generated_drafts')
        .select('*')
        .eq('id', draftId)
        .single();
        
      if (draftErr) throw new Error(`Failed to fetch draft: ${draftErr.message}`);

      // We still need applicant info for the title or basic context if we wanted to build a unified object,
      // but let's build a subset data object that uses the same generator, or we can just pass the draft to the generators.
      // Since our generators expect UnifiedReportData, let's fetch case and applicant, but only include this draft and no findings.
      const { data: caseInfo, error: caseErr } = await supabase.from('cases').select('*').eq('id', caseId).single();
      if (caseErr) throw new Error(caseErr.message);

      const { data: applicant, error: appErr } = await supabase.from('applicants').select('*').eq('case_id', caseId).single();
      if (appErr) throw new Error(appErr.message);

      const data = {
        caseInfo,
        applicant,
        findings: [],
        drafts: [draft]
      };

      const title = `${draft.type} Document`;

      const [pdfBuffer, docxBuffer] = await Promise.all([
        PDFGenerator.generate(data, title),
        DocxGenerator.generate(data, title)
      ]);

      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const [pdfPath, docxPath] = await Promise.all([
        StorageService.uploadExport(supabase, caseId, `${sanitizedTitle}.pdf`, pdfBuffer, 'application/pdf'),
        StorageService.uploadExport(supabase, caseId, `${sanitizedTitle}.docx`, docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      ]);

      const { data: record, error } = await supabase
        .from('export_packages')
        .insert({
          case_id: caseId,
          pdf_path: pdfPath,
          docx_path: docxPath,
          title: title,
          status: 'Completed',
          generated_by: userId,
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to insert draft export package: ${error.message}`);
      
      return { success: true, data: record };
    } catch (error: any) {
      return { error: error.message || 'Unknown error occurred during draft export generation' };
    }
  }
}
