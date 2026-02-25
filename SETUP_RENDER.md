# Héberger l’app sur Render

Ce guide décrit le déploiement sur [Render](https://render.com) (Web Service + cron des campagnes).

---

## 1. Prérequis

- Compte [Render](https://render.com)
- Projet poussé sur **GitHub** (ou GitLab) — Render déploie depuis un dépôt Git
- Les étapes 1 et 2 de **SETUP_CAMPAIGNS.md** déjà faites (Supabase + variables d’env en local)

---

## 2. Créer le Web Service sur Render

1. Va sur [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**.
2. Connecte ton dépôt GitHub (ou importe le repo).
3. Choisis le **repository** et la **branch** (ex. `main`).
4. Renseigne :
   - **Name** : `careerai` (ou le nom que tu veux)
   - **Region** : ex. Frankfurt
   - **Runtime** : **Node**
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
   - **Instance Type** : Free (ou payant si tu préfères)

5. **Environment Variables** (bouton **Add Environment Variable**) — ajoute les mêmes que dans ton `.env.local` :
   - `NODE_VERSION` = `20`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_FROM` ou `RESEND_FROM_EMAIL` (ex. `onboarding@resend.dev` ou `CareerAI <noreply@tondomaine.com>`)
   - `CRON_SECRET` (la même valeur secrète que pour le cron)
   - Si tu utilises une URL de base : `NEXT_PUBLIC_BASE_URL` = `https://ton-app.onrender.com` (à adapter après le 1er déploiement)

6. Clique sur **Create Web Service**. Render build et déploie. À la fin tu obtiens une URL du type :  
   `https://careerai-xxxx.onrender.com`

7. (Optionnel) Si tu as un **render.yaml** à la racine du projet, tu peux utiliser **Blueprint** (New → Blueprint) et connecter le repo : Render lira `render.yaml` pour créer le service. Tu devras quand même ajouter les variables d’environnement dans le dashboard.

---

## 3. Configurer le cron des campagnes (déjà dans le projet)

Le cron est défini **dans le repo** : le fichier **`render.yaml`** déclare un service **Cron Job** et le script **`scripts/cron-run-campaigns.sh`** appelle ton API. Tu n’as plus à taper de commande à la main, il suffit de renseigner 2 variables.

### Si tu déploies avec un Blueprint (recommandé)

1. Sur Render : **New** → **Blueprint**.
2. Connecte ton **repository** GitHub et valide. Render crée **2 services** :
   - **careerai** (Web Service)
   - **careerai-cron-campaigns** (Cron Job)
3. Pour le **Web Service** : dans **Environment**, ajoute toutes tes variables (Supabase, Groq, Resend, **CRON_SECRET**, etc.).
4. Pour le **Cron Job** : dans **Environment**, ajoute **obligatoirement** :
   - **`SERVICE_URL`** = l’URL de ton app, par ex. `https://careerai-xxxx.onrender.com`  
     (copie l’URL une fois le Web Service déployé, sans slash final).
   - **`CRON_SECRET`** = la **même** valeur secrète que sur le Web Service (et que dans ton `.env.local`).
5. Déploie / sauvegarde. Le cron s’exécutera tous les jours à **8h UTC** (voir `schedule` dans `render.yaml`).

### Si tu as créé le Web Service à la main (sans Blueprint)

1. Sur Render : **New** → **Cron Job**.
2. Connecte le **même repository** que ton Web Service.
3. Renseigne :
   - **Name** : `careerai-cron-campaigns`
   - **Region** : même que le Web Service (ex. Frankfurt)
   - **Branch** : `main` (ou ta branche)
   - **Schedule** : `0 8 * * *` (tous les jours à 8h UTC)
   - **Build Command** : `true`
   - **Start Command** : `sh scripts/cron-run-campaigns.sh`
4. **Environment** : ajoute **`SERVICE_URL`** (URL de ton Web Service, ex. `https://careerai-xxxx.onrender.com`) et **`CRON_SECRET`** (même valeur que sur l’app).
5. **Create Cron Job**.

Le script **`scripts/cron-run-campaigns.sh`** (dans le projet) appelle `SERVICE_URL/api/cron/run-campaigns?secret=CRON_SECRET`. Tu peux le tester en local :

```bash
export SERVICE_URL=https://ton-app.onrender.com
export CRON_SECRET=ta_valeur_secrete
sh scripts/cron-run-campaigns.sh
```

### Alternative : cron externe (cron-job.org)

Si tu préfères ne pas utiliser le Cron Job Render, tu peux utiliser [cron-job.org](https://cron-job.org) : crée une tâche avec l’URL `https://ton-app.onrender.com/api/cron/run-campaigns?secret=TA_VALEUR_CRON_SECRET`, méthode GET, une fois par jour.

---

## 4. Après le déploiement

- Ouvre l’URL du Web Service (ex. `https://careerai-xxxx.onrender.com`) pour vérifier que l’app répond.
- Si tu as mis `NEXT_PUBLIC_BASE_URL` ou des redirections OAuth (Supabase), mets à jour l’URL de production dans Supabase (Authentication → URL redirect) avec l’URL Render.
- Pour tester le cron à la main (depuis ta machine) :
  ```bash
  curl "https://ton-app.onrender.com/api/cron/run-campaigns?secret=TA_VALEUR_CRON_SECRET"
  ```
  Réponse attendue du type : `{"ok":true,"processed":1,"results":[...]}`.

---

## 5. Récap

| Étape | Action |
|-------|--------|
| 1 | Créer un **Web Service** Render (Node, build `npm run build`, start `npm start`). |
| 2 | Ajouter toutes les **variables d’environnement** (Supabase, Groq, Resend, CRON_SECRET, etc.). |
| 3 | Déployer et noter l’URL du service (ex. `https://careerai-xxxx.onrender.com`). |
| 4 | **Blueprint** : ajouter `SERVICE_URL` et `CRON_SECRET` sur le service **careerai-cron-campaigns**. **À la main** : créer un Cron Job avec start command `sh scripts/cron-run-campaigns.sh` et les mêmes env vars. |
| 5 | Vérifier dans l’app (Mes campagnes → détail des envois) après le premier run du cron. |

Tu peux garder **vercel.json** dans le repo si tu testes aussi sur Vercel ; il n’affecte pas Render. Le fichier **render.yaml** à la racine peut servir de référence pour recréer le Web Service en Blueprint si besoin.
