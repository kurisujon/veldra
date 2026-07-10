import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function uploadDocument(caseId: string, file: File, documentType: string) {
  const supabase = await createClient();
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${caseId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to upload document: ${uploadError.message}`);
  }

  const { data: dbData, error: dbError } = await supabase
    .from('documents')
    .insert({
      case_id: caseId,
      type: documentType,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      status: 'Uploaded'
    })
    .select()
    .single();

  if (dbError) {
    // Cleanup storage if db insert fails
    await supabase.storage.from('documents').remove([filePath]);
    throw new Error(`Failed to save document metadata: ${dbError.message}`);
  }

  return dbData;
}
