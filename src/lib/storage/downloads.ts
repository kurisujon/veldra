import { createClient } from '@/lib/supabase/server';

export async function getDocumentDownloadUrl(filePath: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600); // 1 hour

  if (error) {
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }

  return data.signedUrl;
}

export async function downloadFileAsBuffer(bucket: string, filePath: string): Promise<Buffer> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath);

  if (error || !data) {
    throw new Error(`Failed to download file from ${bucket}: ${error?.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
