-- Exécutions de campagne (run) + liens sauvegardés pour affichage même après timeout ou suppression campagne
-- Les données restent visibles après fin ou suppression de la campagne

-- 1) Table des exécutions (une par passage cron ou "Lancer maintenant")
CREATE TABLE IF NOT EXISTS campaign_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES job_campaigns(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  offers_fetched INTEGER DEFAULT 0,
  offers_matched INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_runs_user ON campaign_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_runs_campaign ON campaign_runs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_runs_started ON campaign_runs(started_at DESC);

-- 2) Liens des offres à consulter (sauvegardés à chaque run pour affichage même si timeout)
CREATE TABLE IF NOT EXISTS campaign_run_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES campaign_runs(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES job_campaigns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  target_source TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_run_links_run ON campaign_run_links(run_id);
CREATE INDEX IF NOT EXISTS idx_campaign_run_links_user ON campaign_run_links(user_id);

-- 3) Garder les candidatures (campaign_applications) après suppression de la campagne
ALTER TABLE campaign_applications
  DROP CONSTRAINT IF EXISTS campaign_applications_campaign_id_fkey;

ALTER TABLE campaign_applications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Remplir user_id depuis la campagne pour les lignes existantes
UPDATE campaign_applications ca
SET user_id = jc.user_id
FROM job_campaigns jc
WHERE ca.campaign_id = jc.id AND ca.user_id IS NULL;

ALTER TABLE campaign_applications
  ALTER COLUMN campaign_id DROP NOT NULL;

ALTER TABLE campaign_applications
  ADD CONSTRAINT campaign_applications_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES job_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_applications_user ON campaign_applications(user_id);

-- RLS campaign_runs
ALTER TABLE campaign_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_campaign_runs" ON campaign_runs;
CREATE POLICY "users_own_campaign_runs" ON campaign_runs FOR ALL USING (auth.uid() = user_id);

-- RLS campaign_run_links
ALTER TABLE campaign_run_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_campaign_run_links" ON campaign_run_links;
CREATE POLICY "users_own_campaign_run_links" ON campaign_run_links FOR ALL USING (auth.uid() = user_id);

-- RLS campaign_applications : voir ses propres candidatures (campaign existante ou supprimée)
DROP POLICY IF EXISTS "users_own_campaign_applications" ON campaign_applications;
CREATE POLICY "users_own_campaign_applications" ON campaign_applications FOR ALL
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM job_campaigns jc WHERE jc.id = campaign_id AND jc.user_id = auth.uid())
  );

COMMENT ON TABLE campaign_runs IS 'Une ligne par exécution (cron ou manuel) ; conservée après suppression campagne';
COMMENT ON TABLE campaign_run_links IS 'Liens offres à consulter par run ; affichés même après timeout';
COMMENT ON COLUMN campaign_applications.user_id IS 'Conservé pour afficher les envois après suppression de la campagne';
