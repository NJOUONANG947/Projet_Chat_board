-- =========================
-- SUPABASE STORAGE POLICIES
-- =========================
-- These policies ensure users can only access their own files in the 'documents' bucket
-- File path structure: {user_id}/{filename}

-- Enable RLS on the documents bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =========================
-- STORAGE POLICIES FOR DOCUMENTS BUCKET
-- =========================

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =========================
-- BUCKET CONFIGURATION
-- =========================
-- Note: The bucket should be created in Supabase Dashboard with these settings:
-- Name: documents
-- Public: false
-- Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain
-- File size limit: 10485760 (10MB)
