-- Create Storage Buckets for Veldra

INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('exports', 'exports', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for Documents
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'documents' );

CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'documents' );

-- RLS for Exports
CREATE POLICY "Public Access to Exports" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'exports' );

CREATE POLICY "Authenticated users can upload exports" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'exports' );
