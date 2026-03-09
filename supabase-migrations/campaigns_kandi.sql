-- ============================================================
-- Extension campagnes : type "kandi" (candidatures spontanées contacts)
-- ============================================================

-- 1) Ajouter un type de campagne (jobs = offres classiques, kandi = contacts)
ALTER TABLE job_campaigns
ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'jobs' CHECK (kind IN ('jobs', 'kandi'));

-- 2) Table des contacts Kandi (base de contacts ciblés)
CREATE TABLE IF NOT EXISTS kandi_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  role TEXT,
  company_name TEXT,
  city TEXT,
  country TEXT,
  sector TEXT,
  tags TEXT[] DEFAULT '{}',
  source TEXT, -- ex: 'import_csv', 'linkedin', 'crm'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kandi_contacts_user ON kandi_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_kandi_contacts_email ON kandi_contacts(email);

-- 3) RLS pour les contacts Kandi
ALTER TABLE kandi_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_kandi_contacts" ON kandi_contacts;
CREATE POLICY "users_manage_kandi_contacts" ON kandi_contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

