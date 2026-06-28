import { generatePdfFromHtml } from './puppeteer';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function createPdfExport(caseId: string, htmlContent: string, fileName: string): Promise<string> {
  const supabase = await createClient();
  
  // 1. Generate PDF
  const pdfBuffer = await generatePdfFromHtml(htmlContent);
  
  // 2. Upload to Supabase Storage
  const storagePath = `${caseId}/${uuidv4()}_${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('exports')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });
    
  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }
  
  // 3. Get Public URL
  const { data } = supabase.storage.from('exports').getPublicUrl(storagePath);
  
  return data.publicUrl;
}
