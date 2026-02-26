-- Migration: ajouter la colonne invite_token à quiz_results (token du lien quiz candidat)
-- À exécuter une fois dans Supabase (SQL Editor) si l'erreur "Could not find the 'metadata' column" apparaît.
-- Le code utilise maintenant invite_token au lieu de metadata pour éviter le cache schéma.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quiz_results' AND column_name = 'invite_token'
  ) THEN
    ALTER TABLE quiz_results ADD COLUMN invite_token TEXT;
    RAISE NOTICE 'Colonne quiz_results.invite_token ajoutée.';
  ELSE
    RAISE NOTICE 'Colonne quiz_results.invite_token existe déjà.';
  END IF;
END $$;
