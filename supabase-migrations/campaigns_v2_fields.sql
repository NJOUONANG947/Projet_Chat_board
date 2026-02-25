-- Champs supplémentaires pour le formulaire campagnes (ordre Kandi-style)
-- Utilise ADD COLUMN IF NOT EXISTS (PostgreSQL 9.5+)

ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS contract_type TEXT;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS start_date_earliest DATE;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS end_date_latest DATE;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS contract_duration_min_months INTEGER DEFAULT 0;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS contract_duration_max_months INTEGER DEFAULT 99;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS zone_geographique TEXT;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS campaign_email TEXT;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS has_promo_code BOOLEAN DEFAULT false;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS promo_code TEXT;
