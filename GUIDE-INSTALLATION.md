# Guide d'Installation - SaaS Recruteur

## Étape 1 : Appliquer le schéma SQL dans Supabase

### Option A : Via l'interface Supabase (Recommandé)

1. **Accéder à Supabase Dashboard**
   - Allez sur [supabase.com](https://supabase.com)
   - Connectez-vous à votre projet

2. **Ouvrir l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"**

3. **Copier le schéma**
   - Ouvrez le fichier `supabase-schema-saas.sql` dans votre éditeur
   - Copiez tout le contenu (Ctrl+A, Ctrl+C)

4. **Coller et exécuter**
   - Collez le contenu dans l'éditeur SQL de Supabase
   - Cliquez sur **"Run"** ou appuyez sur `Ctrl+Enter`
   - Attendez que l'exécution se termine (quelques secondes)

5. **Vérifier l'installation**
   - Allez dans **"Table Editor"** dans le menu de gauche
   - Vous devriez voir les nouvelles tables :
     - `job_postings`
     - `candidates`
     - `quizzes`
     - `quiz_results`
     - `relevance_scores`
     - `candidate_rankings`

### Option B : Via Supabase CLI

Si vous avez installé Supabase CLI :

```bash
# Se connecter à votre projet
supabase link --project-ref votre-project-ref

# Appliquer le schéma
supabase db push

# Ou directement avec psql
psql -h db.votre-project.supabase.co -U postgres -d postgres -f supabase-schema-saas.sql
```

### Option C : Via psql directement

```bash
# Télécharger le fichier SQL
# Puis exécuter :
psql "postgresql://postgres:[VOTRE-MOT-DE-PASSE]@db.[VOTRE-PROJECT-REF].supabase.co:5432/postgres" -f supabase-schema-saas.sql
```

## Étape 2 : Vérifier les politiques RLS (Row Level Security)

1. Dans Supabase Dashboard, allez dans **"Authentication" > "Policies"**
2. Vérifiez que les politiques suivantes sont créées :
   - `recruiters_manage_job_postings`
   - `recruiters_manage_candidates`
   - `recruiters_manage_quizzes`
   - `recruiters_view_quiz_results`
   - `recruiters_manage_relevance_scores`
   - `recruiters_manage_rankings`

## Étape 3 : Configurer les variables d'environnement

Créez ou modifiez votre fichier `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# Groq AI
GROQ_API_KEY=votre-groq-api-key
```

**Où trouver ces clés :**
- Dans Supabase Dashboard : **Settings > API**
- Pour Groq : [console.groq.com](https://console.groq.com)

## Étape 4 : Vérifier que le Storage est configuré

1. Dans Supabase Dashboard, allez dans **"Storage"**
2. Vérifiez que le bucket `documents` existe
3. Si non, créez-le avec les permissions publiques pour les uploads

## Étape 5 : Tester l'installation

### Test 1 : Créer un poste

```bash
# Via curl ou Postman
curl -X POST http://localhost:3000/api/recruiter/job-postings \
  -H "Content-Type: application/json" \
  -H "Cookie: votre-session-cookie" \
  -d '{
    "title": "Développeur Full Stack",
    "description": "Recherche développeur React/Node.js",
    "required_skills": ["React", "Node.js", "PostgreSQL"],
    "required_experience": 3,
    "employment_type": "full-time"
  }'
```

### Test 2 : Vérifier les tables dans Supabase

Dans **Table Editor**, vérifiez que vous pouvez :
- Voir la table `job_postings`
- Insérer une ligne de test
- Voir les colonnes correctes

## Étape 6 : Démarrer l'application

```bash
# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer en mode développement
npm run dev
```

## Étape 7 : Accéder au Dashboard Recruteur

1. Connectez-vous à votre application
2. Intégrez le composant `RecruiterDashboard` dans votre interface
3. Ou créez une route dédiée :

```javascript
// app/recruiter/page.js
import RecruiterDashboard from '@/frontend/components/RecruiterDashboard'

export default function RecruiterPage() {
  return <RecruiterDashboard onClose={() => window.history.back()} />
}
```

## Dépannage

### Erreur : "relation does not exist"
- Vérifiez que le schéma SQL a bien été exécuté
- Vérifiez que vous êtes connecté au bon projet Supabase

### Erreur : "permission denied"
- Vérifiez les politiques RLS dans Supabase
- Vérifiez que l'utilisateur est authentifié

### Erreur : "GROQ_API_KEY not found"
- Vérifiez votre fichier `.env.local`
- Redémarrez le serveur Next.js après modification

### Les tables n'apparaissent pas
- Rafraîchissez la page Table Editor
- Vérifiez les logs SQL dans Supabase Dashboard

## Vérification finale

✅ Schéma SQL appliqué  
✅ Tables créées  
✅ Politiques RLS configurées  
✅ Variables d'environnement définies  
✅ Storage configuré  
✅ Application démarrée  
✅ APIs fonctionnelles  

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Supabase Dashboard > Logs
2. Vérifiez la console du navigateur
3. Vérifiez les logs Next.js dans le terminal
