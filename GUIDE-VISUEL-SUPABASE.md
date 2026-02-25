# 📸 Guide Visuel : Appliquer le schéma SQL dans Supabase

## Étape par étape avec instructions détaillées

### ÉTAPE 1 : Accéder à Supabase Dashboard

1. **Ouvrez votre navigateur** et allez sur [supabase.com](https://supabase.com)
2. **Connectez-vous** avec votre compte
3. **Sélectionnez votre projet** (ou créez-en un nouveau si nécessaire)

```
┌─────────────────────────────────────┐
│  Supabase Dashboard                 │
│  ┌─────────┐  ┌─────────┐         │
│  │ Projects│  │ Settings│         │
│  └─────────┘  └─────────┘         │
│                                     │
│  📁 Votre Projet                    │
│     └─ SQL Editor  ← CLIQUEZ ICI   │
└─────────────────────────────────────┘
```

### ÉTAPE 2 : Ouvrir l'éditeur SQL

1. Dans le **menu de gauche**, cherchez **"SQL Editor"**
2. Cliquez dessus
3. Vous verrez une interface avec un éditeur de code

```
Menu Gauche:
├─ 🏠 Home
├─ 📊 Table Editor
├─ 🔐 Authentication
├─ 💾 Storage
├─ 📝 SQL Editor  ← CLIQUEZ ICI
└─ ⚙️ Settings
```

### ÉTAPE 3 : Créer une nouvelle requête

1. Cliquez sur le bouton **"New query"** (en haut à gauche)
2. Un nouvel onglet s'ouvre avec un éditeur vide

```
┌─────────────────────────────────────┐
│  [New query] [Save] [Run]           │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │  (éditeur vide)               │ │
│  │                               │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### ÉTAPE 4 : Ouvrir le fichier SQL

1. **Dans votre éditeur de code** (VS Code, etc.)
2. Ouvrez le fichier : `supabase-schema-saas.sql`
3. **Sélectionnez tout** le contenu :
   - Windows/Linux : `Ctrl + A`
   - Mac : `Cmd + A`
4. **Copiez** :
   - Windows/Linux : `Ctrl + C`
   - Mac : `Cmd + C`

```
Fichier: supabase-schema-saas.sql
┌─────────────────────────────────────┐
│ -- =========================        │
│ -- SAAS RECRUITER SCHEMA          │
│ -- =========================        │
│                                     │
│ CREATE TABLE IF NOT EXISTS         │
│   job_postings (...)                │
│ ...                                 │
│                                     │
│ [TOUT LE CONTENU EST SÉLECTIONNÉ] │
└─────────────────────────────────────┘
```

### ÉTAPE 5 : Coller dans Supabase

1. **Retournez dans Supabase** (onglet navigateur)
2. **Cliquez dans l'éditeur SQL** (zone de texte)
3. **Collez** le contenu :
   - Windows/Linux : `Ctrl + V`
   - Mac : `Cmd + V`

```
┌─────────────────────────────────────┐
│  [New query] [Save] [Run]           │
│  ┌───────────────────────────────┐ │
│  │ -- =========================  │ │
│  │ -- SAAS RECRUITER SCHEMA     │ │
│  │ CREATE TABLE IF NOT EXISTS   │ │
│  │   job_postings (...)         │ │
│  │ ...                           │ │
│  │ [CONTENU COLLÉ ICI]          │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### ÉTAPE 6 : Exécuter le schéma

1. **Vérifiez** que tout le contenu est bien collé
2. Cliquez sur le bouton **"Run"** (en haut à droite)
   - Ou appuyez sur `Ctrl + Enter` (Windows/Linux)
   - Ou `Cmd + Enter` (Mac)

```
┌─────────────────────────────────────┐
│  [New query] [Save] [Run] ← CLIQUEZ │
│  ┌───────────────────────────────┐ │
│  │ [Votre SQL ici...]            │ │
│  └───────────────────────────────┘ │
│                                     │
│  ⏳ Running query...                │
└─────────────────────────────────────┘
```

### ÉTAPE 7 : Vérifier le résultat

Après quelques secondes, vous devriez voir :

```
✅ Success. No rows returned

Ou:

✅ Success
Rows affected: 0
```

**Si vous voyez une erreur** :
- Lisez le message d'erreur
- Vérifiez que vous avez copié tout le contenu
- Vérifiez que vous êtes sur le bon projet

### ÉTAPE 8 : Vérifier les tables créées

1. Dans le **menu de gauche**, cliquez sur **"Table Editor"**
2. Vous devriez voir les nouvelles tables :

```
Table Editor:
├─ 📋 conversations (existant)
├─ 📋 messages (existant)
├─ 📋 uploaded_documents (existant)
├─ 🆕 job_postings          ← NOUVELLE TABLE
├─ 🆕 candidates            ← NOUVELLE TABLE
├─ 🆕 quizzes               ← NOUVELLE TABLE
├─ 🆕 quiz_results          ← NOUVELLE TABLE
├─ 🆕 relevance_scores      ← NOUVELLE TABLE
└─ 🆕 candidate_rankings    ← NOUVELLE TABLE
```

### ÉTAPE 9 : Vérifier une table (optionnel)

1. Cliquez sur **"job_postings"**
2. Vous devriez voir les colonnes :
   - `id`, `recruiter_id`, `title`, `description`, etc.

```
Table: job_postings
┌─────────────┬──────────────┬──────────┐
│ Column      │ Type         │ Nullable │
├─────────────┼──────────────┼──────────┤
│ id          │ uuid         │ NO       │
│ recruiter_id│ uuid         │ NO       │
│ title       │ text         │ NO       │
│ description │ text         │ NO       │
│ ...         │ ...          │ ...      │
└─────────────┴──────────────┴──────────┘
```

## ✅ C'est terminé !

Votre schéma SQL est maintenant appliqué. Vous pouvez :
- ✅ Utiliser les APIs `/api/recruiter/*`
- ✅ Créer des postes et candidats
- ✅ Générer des quiz
- ✅ Classer les candidats

## 🆘 Aide supplémentaire

### Si vous voyez des erreurs de permissions

1. Allez dans **"Authentication" > "Policies"**
2. Vérifiez que les politiques sont créées
3. Si non, réexécutez la partie "POLICIES RLS" du fichier SQL

### Si certaines tables manquent

1. Vérifiez les logs dans **"Logs" > "Postgres Logs"**
2. Recherchez les erreurs spécifiques
3. Réexécutez uniquement les parties manquantes du SQL

### Pour vérifier que tout fonctionne

Testez dans l'éditeur SQL :

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'job_postings', 
  'candidates', 
  'quizzes',
  'quiz_results',
  'relevance_scores',
  'candidate_rankings'
);
```

Vous devriez voir 6 lignes retournées.
