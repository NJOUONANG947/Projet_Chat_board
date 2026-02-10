-- =========================
-- CONVERSATIONS
-- =========================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- MESSAGES
-- =========================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- CV TEMPLATES
-- =========================
CREATE TABLE IF NOT EXISTS cv_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  style TEXT NOT NULL CHECK (style IN ('classic', 'modern', 'minimal', 'creative')),
  structure JSONB NOT NULL,
  preview_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- USER CVS
-- =========================
CREATE TABLE IF NOT EXISTS user_cvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES cv_templates(id),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  generated_content TEXT,
  is_draft BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- UPLOADED DOCUMENTS (CORRIGÉ)
-- =========================
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,          -- ✅ utilisé par le code
  file_path TEXT NOT NULL,          -- ✅ chemin Supabase Storage
  file_type TEXT,
  file_size INTEGER,
  extracted_text TEXT,              -- ✅ analyse IA
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- JOB APPLICATIONS
-- =========================
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position_title TEXT NOT NULL,
  job_description TEXT,
  application_status TEXT DEFAULT 'applied'
    CHECK (application_status IN ('saved', 'applied', 'interview', 'rejected', 'accepted')),
  applied_date DATE,
  notes TEXT,
  cv_id UUID REFERENCES user_cvs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- CV ANALYSES
-- =========================
CREATE TABLE IF NOT EXISTS cv_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cv_id UUID NOT NULL REFERENCES user_cvs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  strengths TEXT[],
  weaknesses TEXT[],
  suggestions TEXT[],
  industry_fit TEXT,
  keywords_found TEXT[],
  keywords_missing TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- ENABLE RLS
-- =========================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_analyses ENABLE ROW LEVEL SECURITY;

-- =========================
-- POLICIES (SIMPLIFIÉES)
-- =========================
CREATE POLICY IF NOT EXISTS "users_manage_conversations"
ON conversations FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_manage_messages"
ON messages FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "public_read_templates"
ON cv_templates FOR SELECT
USING (is_active = true);

CREATE POLICY IF NOT EXISTS "users_manage_cvs"
ON user_cvs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_manage_documents"
ON uploaded_documents FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_manage_applications"
ON job_applications FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_manage_cv_analyses"
ON cv_analyses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =========================
-- DEFAULT CV TEMPLATES (ANTI-DOUBLON)
-- =========================
INSERT INTO cv_templates (name, style, structure)
SELECT * FROM (
  VALUES
  ('Classique Professionnel', 'classic', '{
    "sections": ["personal", "experience", "education", "skills", "languages"],
    "layout": "traditional",
    "colors": {"primary": "#000000", "secondary": "#666666"}
  }'::jsonb),
  ('Moderne Créatif', 'modern', '{
    "sections": ["personal", "summary", "experience", "education", "skills", "projects"],
    "layout": "modern",
    "colors": {"primary": "#2563eb", "secondary": "#64748b"}
  }'::jsonb),
  ('Minimal Élégant', 'minimal', '{
    "sections": ["personal", "experience", "education", "skills"],
    "layout": "minimal",
    "colors": {"primary": "#374151", "secondary": "#9ca3af"}
  }'::jsonb),
  ('Créatif Design', 'creative', '{
    "sections": ["personal", "portfolio", "experience", "education", "skills", "interests"],
    "layout": "creative",
    "colors": {"primary": "#7c3aed", "secondary": "#a855f7"}
  }'::jsonb)
) AS t(name, style, structure)
WHERE NOT EXISTS (SELECT 1 FROM cv_templates);
