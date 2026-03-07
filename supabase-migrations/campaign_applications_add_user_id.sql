-- Ajoute user_id à campaign_applications (pour conserver les envois après suppression de la campagne)
-- À exécuter si la colonne n'existe pas encore (erreur "column campaign_applications.user_id does not exist")

ALTER TABLE campaign_applications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Remplir user_id depuis la campagne pour les lignes existantes
UPDATE campaign_applications ca
SET user_id = jc.user_id
FROM job_campaigns jc
WHERE ca.campaign_id = jc.id AND (ca.user_id IS NULL OR ca.user_id != jc.user_id);

CREATE INDEX IF NOT EXISTS idx_campaign_applications_user ON campaign_applications(user_id);

COMMENT ON COLUMN campaign_applications.user_id IS 'Conservé pour afficher les envois après suppression de la campagne';

-- RLS : autoriser l'accès par user_id (pour les candidatures orphelines après suppression de la campagne)
DROP POLICY IF EXISTS "users_own_campaign_applications" ON campaign_applications;
CREATE POLICY "users_own_campaign_applications" ON campaign_applications FOR ALL
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM job_campaigns jc WHERE jc.id = campaign_id AND jc.user_id = auth.uid())
  );
