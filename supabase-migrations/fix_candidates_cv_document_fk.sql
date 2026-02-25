-- ============================================================
-- Fix: allow deleting uploaded_documents when referenced by
-- candidates.cv_document_id (set to NULL on document delete)
-- ============================================================
-- Run this in Supabase SQL Editor if you get:
-- "violates foreign key constraint candidates_cv_document_id_fkey"
-- ============================================================

ALTER TABLE candidates
  DROP CONSTRAINT IF EXISTS candidates_cv_document_id_fkey;

ALTER TABLE candidates
  ADD CONSTRAINT candidates_cv_document_id_fkey
  FOREIGN KEY (cv_document_id)
  REFERENCES uploaded_documents(id)
  ON DELETE SET NULL;
