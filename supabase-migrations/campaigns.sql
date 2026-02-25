-- =========================
-- CAMPAGNES DE CANDIDATURES AUTOMATIQUES (type Kandi Jobs)
-- =========================

-- Profil / préférences candidat (un par user)
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_job_titles TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}',
  employment_types TEXT[] DEFAULT '{}',
  sectors TEXT[] DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  cv_document_id UUID REFERENCES uploaded_documents(id) ON DELETE SET NULL,
  cv_id UUID REFERENCES user_cvs(id) ON DELETE SET NULL,
  default_cover_letter TEXT,
  allow_auto_apply BOOLEAN DEFAULT false,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campagnes (durée en jours, max/jour, etc.)
CREATE TABLE IF NOT EXISTS job_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  duration_days INTEGER NOT NULL DEFAULT 7,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  max_applications_per_day INTEGER DEFAULT 10,
  total_sent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_campaigns_user ON job_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_job_campaigns_status ON job_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_job_campaigns_ends_at ON job_campaigns(ends_at);

-- Chaque envoi (candidature envoyée)
CREATE TABLE IF NOT EXISTS campaign_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES job_campaigns(id) ON DELETE CASCADE,
  target_type TEXT DEFAULT 'job' CHECK (target_type IN ('job', 'company')),
  target_name TEXT NOT NULL,
  target_email TEXT,
  target_url TEXT,
  target_source TEXT DEFAULT 'lba' CHECK (target_source IN ('lba', 'internal', 'manual')),
  target_external_id TEXT,
  cv_document_id UUID REFERENCES uploaded_documents(id) ON DELETE SET NULL,
  cover_letter_text TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'replied', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_applications_campaign ON campaign_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_sent_at ON campaign_applications(sent_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_app_target ON campaign_applications(campaign_id, target_external_id) WHERE target_external_id IS NOT NULL;

-- RLS
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_profile" ON candidate_profiles;
CREATE POLICY "users_own_profile" ON candidate_profiles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_campaigns" ON job_campaigns;
CREATE POLICY "users_own_campaigns" ON job_campaigns FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_campaign_applications" ON campaign_applications;
CREATE POLICY "users_own_campaign_applications" ON campaign_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM job_campaigns jc WHERE jc.id = campaign_id AND jc.user_id = auth.uid()));
