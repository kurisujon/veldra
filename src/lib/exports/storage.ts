import { SupabaseClient } from '@supabase/supabase-js';

export class StorageService {
  static async uploadExport(
    supabase: SupabaseClient, 
    caseId: string, 
    filename: string, 
    buffer: Buffer, 
    contentType: string
  ): Promise<string> {
    const path = `${caseId}/${Date.now()}_${filename}`;
    const { error } = await supabase.storage
      .from('exports')
      .upload(path, buffer, {
        contentType,
        upsert: true
      });
      
    if (error) {
      throw new Error(`Storage upload error: ${(error instanceof Error ? error.message : String(error))}`);
    }
    
    // We return the relative path within the 'exports' bucket
    return path;
  }
}
