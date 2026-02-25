# 🚀 Guide de Démarrage Rapide

## Installation en 5 minutes

### 1️⃣ Prérequis

- Compte Supabase (gratuit) : [supabase.com](https://supabase.com)
- Clé API Groq (gratuite) : [console.groq.com](https://console.groq.com)
- Node.js 18+ installé

### 2️⃣ Configuration Supabase (2 minutes)

#### A. Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre URL et vos clés API

#### B. Appliquer le schéma SQL
1. Dans Supabase Dashboard, cliquez sur **"SQL Editor"** (menu gauche)
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `supabase-schema-saas.sql` dans votre éditeur
4. **Copiez tout le contenu** (Ctrl+A, Ctrl+C)
5. **Collez dans l'éditeur SQL** de Supabase
6. Cliquez sur **"Run"** (ou Ctrl+Enter)
7. ✅ Attendez le message "Success"

#### C. Vérifier les tables
1. Cliquez sur **"Table Editor"** dans le menu
2. Vous devriez voir : `job_postings`, `candidates`, `quizzes`, etc.

### 3️⃣ Configuration de l'application (1 minute)

Créez/modifiez `.env.local` :

```env
# Supabase (trouvez ces valeurs dans Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Groq AI (trouvez dans console.groq.com)
GROQ_API_KEY=gsk_xxxxx...
```

### 4️⃣ Démarrer l'application (1 minute)

```bash
# Installer les dépendances
npm install

# Démarrer
npm run dev
```

### 5️⃣ Tester (1 minute)

1. Ouvrez [http://localhost:3000](http://localhost:3000)
2. Connectez-vous à votre application
3. Intégrez le composant `RecruiterDashboard`

## 📝 Intégration rapide du Dashboard

### Option 1 : Page dédiée

Créez `app/recruiter/page.js` :

```javascript
'use client'

import RecruiterDashboard from '@/frontend/components/RecruiterDashboard'

export default function RecruiterPage() {
  return (
    <div>
      <RecruiterDashboard 
        onClose={() => window.location.href = '/'} 
      />
    </div>
  )
}
```

### Option 2 : Intégration dans un menu existant

Dans votre composant de navigation :

```javascript
import RecruiterDashboard from '@/frontend/components/RecruiterDashboard'

function YourComponent() {
  const [showDashboard, setShowDashboard] = useState(false)
  
  return (
    <>
      <button onClick={() => setShowDashboard(true)}>
        Dashboard Recruteur
      </button>
      
      {showDashboard && (
        <RecruiterDashboard onClose={() => setShowDashboard(false)} />
      )}
    </>
  )
}
```

## ✅ Checklist de vérification

- [ ] Projet Supabase créé
- [ ] Schéma SQL appliqué (tables visibles dans Table Editor)
- [ ] Variables d'environnement configurées
- [ ] Application démarrée sans erreur
- [ ] Dashboard accessible

## 🐛 Problèmes courants

### "relation does not exist"
→ Le schéma SQL n'a pas été appliqué. Réessayez l'étape 2B.

### "permission denied"
→ Vérifiez que vous êtes connecté et que les politiques RLS sont créées.

### "GROQ_API_KEY not found"
→ Vérifiez `.env.local` et redémarrez le serveur (`npm run dev`).

## 📚 Documentation complète

Pour plus de détails, consultez `GUIDE-INSTALLATION.md`

## 🎉 C'est prêt !

Vous pouvez maintenant :
- ✅ Créer des postes
- ✅ Ajouter des candidats
- ✅ Générer des quiz
- ✅ Classer automatiquement les candidats
