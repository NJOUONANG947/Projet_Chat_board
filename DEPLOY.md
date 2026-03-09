# Déploiement sur Vercel

## 1. Prérequis

- Compte [Vercel](https://vercel.com)
- Projet avec les variables d’environnement prêtes (voir ci‑dessous)

## 2. Déployer

### Option A – Depuis le terminal (CLI)

```bash
# À la racine du projet
npm i -g vercel
vercel login
vercel
```

Pour un déploiement en production :

```bash
vercel --prod
```

### Option B – Depuis GitHub (recommandé)

1. Va sur [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Importe le repo GitHub du projet.
3. **Framework Preset** : Next.js (détecté automatiquement).
4. **Root Directory** : laisser vide si le repo = ce projet.
5. **Build Command** : `npm run build` (défaut).
6. **Output Directory** : `.next` (défaut).
7. Clique sur **Deploy**.

Ensuite, à chaque push sur la branche connectée, Vercel redéploiera automatiquement.

## 3. Variables d’environnement (obligatoire)

Dans **Vercel** → ton projet → **Settings** → **Environment Variables**, ajoute au minimum :

| Variable | Où la trouver | Environnement |
|----------|----------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard Supabase → Settings → API | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Idem | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Idem (clé secrète) | Production, Preview |
| `GROQ_API_KEY` | console.groq.com | Production, Preview |
| `RESEND_API_KEY` | resend.com → API Keys | Production, Preview |
| `RESEND_FROM_EMAIL` ou `EMAIL_FROM` | ex. `CareerAI <noreply@tondomaine.com>` ou `onboarding@resend.dev` | Production, Preview |
| `NEXT_PUBLIC_BASE_URL` | URL de l’app, ex. `https://ton-projet.vercel.app` | Production, Preview |
| `CRON_SECRET` | Génère : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Production (pour le cron) |

Optionnel (candidatures auto) : `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `FRANCETRAVAIL_CLIENT_ID`, `FRANCETRAVAIL_CLIENT_SECRET`, `GOOGLE_API_KEY`, `GOOGLE_CSE_ID`, `LBA_API_KEY`, `LBA_CALLER`, `ENABLE_BROWSER_AUTOMATION`, `BROWSER_AUTOMATION_MAX_PER_RUN`.

Après avoir ajouté les variables, refais un **Redeploy** (Deployments → … → Redeploy).

## 4. Cron des campagnes

Le fichier **`vercel.json`** déclare déjà un cron qui appelle `/api/cron/run-campaigns` chaque jour à 8h UTC.

- Vercel envoie automatiquement `Authorization: Bearer <CRON_SECRET>` si la variable **`CRON_SECRET`** est définie en **Production**.
- Les crons ne tournent que sur les déploiements **Production** (pas Preview).

Aucune config supplémentaire nécessaire une fois `CRON_SECRET` défini.

## 5. Vérification

1. Ouvre l’URL du déploiement (ex. `https://ton-projet.vercel.app`).
2. Connecte-toi, crée un profil et une campagne si besoin.
3. Vercel → **Logs** pour voir les erreurs éventuelles.
4. Après 8h UTC (ou le lendemain), vérifie dans l’app que le cron a bien tourné (Mes campagnes → détail des envois).

## Note – Puppeteer (candidatures navigateur)

Si tu actives `ENABLE_BROWSER_AUTOMATION=true`, l’automatisation Puppeteer peut ne pas fonctionner sur Vercel (limitations des serverless). Pour les candidatures automatiques avec navigateur, un hébergement type **Render** ou **Railway** est plus adapté (voir `SETUP_RENDER.md`). Les envois **par email** (Resend) fonctionnent en revanche très bien sur Vercel.
