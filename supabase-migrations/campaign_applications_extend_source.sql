-- Étendre les valeurs autorisées pour target_source (envois automatiques Adzuna, LBA, etc.)
ALTER TABLE campaign_applications
  DROP CONSTRAINT IF EXISTS campaign_applications_target_source_check;

ALTER TABLE campaign_applications
  ADD CONSTRAINT campaign_applications_target_source_check
  CHECK (target_source IN (
    'lba', 'internal', 'manual',
    'adzuna', 'lba_v1', 'lba_v3', 'france_travail', 'google', 'other'
  ));

-- Valeur par défaut reste 'lba' pour compatibilité
COMMENT ON COLUMN campaign_applications.target_source IS 'Source de l''offre: lba, adzuna, lba_v1, lba_v3, france_travail, google, other, internal, manual';
