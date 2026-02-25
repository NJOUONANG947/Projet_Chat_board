-- =========================
-- SAAS RECRUITER SCHEMA
-- Extension du schéma existant pour un outil SaaS de recrutement
-- =========================

-- Créer les tables de base si elles n'existent pas
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  extracted_text TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_cvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  generated_content TEXT,
  is_draft BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- JOB POSTINGS (Postes à pourvoir)
-- =========================
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[],
  required_experience INTEGER, -- années
  location TEXT,
  salary_range JSONB, -- {min: number, max: number, currency: string}
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
  metadata JSONB, -- informations supplémentaires
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- CANDIDATES (Candidats)
-- =========================
CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  cv_document_id UUID REFERENCES uploaded_documents(id) ON DELETE SET NULL,
  linkedin_url TEXT,
  portfolio_url TEXT,
  notes TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recruiter_id, email)
);

-- =========================
-- CV ANALYSES (Analyses de CV enrichies)
-- =========================
-- Créer la table si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS cv_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES uploaded_documents(id) ON DELETE CASCADE,
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

-- Ajouter les colonnes supplémentaires si elles n'existent pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cv_analyses' AND column_name = 'candidate_id'
  ) THEN
    ALTER TABLE cv_analyses ADD COLUMN candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cv_analyses' AND column_name = 'job_posting_id'
  ) THEN
    ALTER TABLE cv_analyses ADD COLUMN job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cv_analyses' AND column_name = 'relevance_score'
  ) THEN
    ALTER TABLE cv_analyses ADD COLUMN relevance_score DECIMAL(5,2) CHECK (relevance_score BETWEEN 0 AND 100);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cv_analyses' AND column_name = 'skills_match'
  ) THEN
    ALTER TABLE cv_analyses ADD COLUMN skills_match JSONB;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cv_analyses' AND column_name = 'experience_match'
  ) THEN
    ALTER TABLE cv_analyses ADD COLUMN experience_match JSONB;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cv_analyses' AND column_name = 'ai_insights'
  ) THEN
    ALTER TABLE cv_analyses ADD COLUMN ai_insights JSONB;
  END IF;
END $$;

-- =========================
-- QUIZZES (Quiz générés)
-- =========================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT DEFAULT 'mixed' CHECK (quiz_type IN ('qcm', 'open', 'case-study', 'mixed')),
  questions JSONB NOT NULL, -- structure des questions
  settings JSONB, -- paramètres du quiz (durée, nombre de questions, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- QUIZ RESULTS (Résultats des quiz)
-- =========================
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score DECIMAL(5,2) CHECK (score BETWEEN 0 AND 100),
  total_questions INTEGER,
  correct_answers INTEGER,
  answers JSONB NOT NULL, -- réponses du candidat
  time_taken INTEGER, -- en secondes
  metadata JSONB, -- métadonnées (token, sent_at, status, etc.)
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- RELEVANCE SCORES (Scores de pertinence)
-- =========================
CREATE TABLE IF NOT EXISTS relevance_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2) CHECK (overall_score BETWEEN 0 AND 100),
  skills_score DECIMAL(5,2),
  experience_score DECIMAL(5,2),
  quiz_score DECIMAL(5,2),
  cv_quality_score DECIMAL(5,2),
  weights JSONB, -- pondération configurable {skills: 0.3, experience: 0.2, quiz: 0.3, cv_quality: 0.2}
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, job_posting_id)
);

-- =========================
-- RANKINGS (Classements)
-- =========================
CREATE TABLE IF NOT EXISTS candidate_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  rank_position INTEGER NOT NULL,
  relevance_score_id UUID REFERENCES relevance_scores(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_posting_id, candidate_id)
);

-- =========================
-- APPLICATIONS (Candidatures - extension)
-- =========================
-- Créer la table si elle n'existe pas déjà
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

-- Ajouter les colonnes supplémentaires si elles n'existent pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_applications' AND column_name = 'candidate_id'
  ) THEN
    ALTER TABLE job_applications ADD COLUMN candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_applications' AND column_name = 'job_posting_id'
  ) THEN
    ALTER TABLE job_applications ADD COLUMN job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_applications' AND column_name = 'relevance_score_id'
  ) THEN
    ALTER TABLE job_applications ADD COLUMN relevance_score_id UUID REFERENCES relevance_scores(id);
  END IF;
END $$;

-- =========================
-- INDEXES pour performance
-- =========================
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter ON job_postings(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_candidates_recruiter ON candidates(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_candidate ON cv_analyses(candidate_id);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_job_posting ON cv_analyses(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_job_posting ON quizzes(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_candidate ON quiz_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz ON quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_relevance_scores_candidate ON relevance_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_relevance_scores_job_posting ON relevance_scores(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_rankings_job_posting ON candidate_rankings(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_rankings_position ON candidate_rankings(job_posting_id, rank_position);

-- =========================
-- ENABLE RLS
-- =========================
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE relevance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_rankings ENABLE ROW LEVEL SECURITY;

-- =========================
-- POLICIES RLS
-- =========================

-- Job Postings
DROP POLICY IF EXISTS "recruiters_manage_job_postings" ON job_postings;
CREATE POLICY "recruiters_manage_job_postings"
ON job_postings FOR ALL
USING (auth.uid() = recruiter_id)
WITH CHECK (auth.uid() = recruiter_id);

-- Candidates
DROP POLICY IF EXISTS "recruiters_manage_candidates" ON candidates;
CREATE POLICY "recruiters_manage_candidates"
ON candidates FOR ALL
USING (auth.uid() = recruiter_id)
WITH CHECK (auth.uid() = recruiter_id);

-- Quizzes
DROP POLICY IF EXISTS "recruiters_manage_quizzes" ON quizzes;
CREATE POLICY "recruiters_manage_quizzes"
ON quizzes FOR ALL
USING (auth.uid() = recruiter_id)
WITH CHECK (auth.uid() = recruiter_id);

-- Quiz Results
DROP POLICY IF EXISTS "recruiters_view_quiz_results" ON quiz_results;
CREATE POLICY "recruiters_view_quiz_results"
ON quiz_results FOR SELECT
USING (auth.uid() = recruiter_id);

DROP POLICY IF EXISTS "candidates_create_quiz_results" ON quiz_results;
CREATE POLICY "candidates_create_quiz_results"
ON quiz_results FOR INSERT
WITH CHECK (true); -- Les candidats peuvent créer leurs résultats

-- Relevance Scores
DROP POLICY IF EXISTS "recruiters_manage_relevance_scores" ON relevance_scores;
CREATE POLICY "recruiters_manage_relevance_scores"
ON relevance_scores FOR ALL
USING (auth.uid() = recruiter_id)
WITH CHECK (auth.uid() = recruiter_id);

-- Rankings
DROP POLICY IF EXISTS "recruiters_manage_rankings" ON candidate_rankings;
CREATE POLICY "recruiters_manage_rankings"
ON candidate_rankings FOR ALL
USING (auth.uid() = recruiter_id)
WITH CHECK (auth.uid() = recruiter_id);

-- CV Analyses (mise à jour)
DROP POLICY IF EXISTS "users_manage_cv_analyses" ON cv_analyses;
DROP POLICY IF EXISTS "recruiters_manage_cv_analyses" ON cv_analyses;
CREATE POLICY "recruiters_manage_cv_analyses"
ON cv_analyses FOR ALL
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM candidates 
    WHERE candidates.id = cv_analyses.candidate_id 
    AND candidates.recruiter_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM candidates 
    WHERE candidates.id = cv_analyses.candidate_id 
    AND candidates.recruiter_id = auth.uid()
  )
);
