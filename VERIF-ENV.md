# Vérification de ton .env

**Important : ne colle jamais le contenu réel de ton `.env` ou `.env.local` dans un chat ou un outil en ligne.** Ce fichier contient des clés secrètes. Utilise la checklist ci‑dessous et, si besoin, le script qui affiche seulement les **noms** des variables définies (sans les valeurs).

---

## Checklist des variables utilisées par l’app

### Obligatoires (app de base + campagnes)

| Variable | Rôle | Où la trouver |
|----------|------|-------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (backend) | Supabase → Settings → API (ne pas exposer côté client) |
| `GROQ_API_KEY` | IA (chat, lettres, analyse CV) | https://console.groq.com |
| `RESEND_API_KEY` | Envoi d’emails | https://resend.com → API Keys |
| `EMAIL_FROM` ou `RESEND_FROM_EMAIL` | Expéditeur des emails | Ex. `onboarding@resend.dev` (test) ou `noreply@tondomaine.com` (prod) |

### Candidatures automatiques (campagnes)

| Variable | Rôle | Où la trouver |
|----------|------|-------------------------------|
| `CRON_SECRET` | Sécuriser l’appel au cron | Tu inventes une longue chaîne (ex. `openssl rand -hex 32`) |
| `ADZUNA_APP_ID` | Offres Adzuna France | https://developer.adzuna.com/signup (gratuit) |
| `ADZUNA_APP_KEY` | Offres Adzuna France | Même page |
| `FRANCETRAVAIL_CLIENT_ID` | Offres France Travail | Inscription partenaire France Travail (optionnel) |
| `FRANCETRAVAIL_CLIENT_SECRET` | Offres France Travail | Même inscription (optionnel) |

### Optionnel

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_BASE_URL` | URL de l’app (emails, liens) |
| `FEEDBACK_EMAIL` | Email qui reçoit les avis (Paramètres > Avis) |
| `HUGGINGFACE_TOKEN` | Génération d’images (gratuit) |
| `OPENAI_API_KEY` | Génération d’images (DALL·E, payant) |

---

## Vérifier sans afficher les secrets

En local, tu peux lancer (sans partager le résultat s’il contient des indices sur tes clés) :

```bash
node -e "
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
const envExample = path.join(process.cwd(), '.env.example');
const vars = new Set(['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','GROQ_API_KEY','RESEND_API_KEY','EMAIL_FROM','RESEND_FROM_EMAIL','CRON_SECRET','ADZUNA_APP_ID','ADZUNA_APP_KEY','FRANCETRAVAIL_CLIENT_ID','FRANCETRAVAIL_CLIENT_SECRET','NEXT_PUBLIC_BASE_URL']);
let content = '';
try { content = fs.readFileSync(envPath, 'utf8'); } catch (e) { console.log('Fichier .env.local non trouvé'); process.exit(1); }
const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
const set = {};
lines.forEach(l => { const i = l.indexOf('='); if (i > 0) set[l.slice(0,i).trim()] = (l.slice(i+1).trim().length > 0); });
vars.forEach(v => { console.log((set[v] ? '[OK]' : '[--]') + ' ' + v); });
"
```

Tu peux aussi vérifier à la main : ouvre `.env.local` (ou ton fichier d’env) et coche que chaque variable de la checklist existe et a une valeur (sans la copier nulle part).

---

## Sur Render / Vercel

Les mêmes variables doivent être définies dans **Environment** (Render) ou **Environment Variables** (Vercel). Vérifie que les noms sont exactement les mêmes (sans espace, sans guillemets en trop).
