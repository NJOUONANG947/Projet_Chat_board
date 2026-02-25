# Rendre les candidatures automatiques réelles et fonctionnelles

Suivre ces étapes **dans l’ordre** pour que la fonctionnalité soit opérationnelle.

---

## Étape 1 : Base de données (Supabase)

1. Ouvre ton projet sur [supabase.com](https://supabase.com) → **SQL Editor**.
2. **Première migration**  
   Ouvre le fichier **`supabase-migrations/campaigns.sql`** dans ton projet, copie tout le contenu, colle-le dans l’éditeur SQL Supabase, puis clique sur **Run**.
3. **Deuxième migration**  
   Ouvre **`supabase-migrations/campaigns_v2_fields.sql`**, copie tout, colle dans un **nouvel onglet** de l’éditeur SQL, puis **Run**.

Vérification : dans **Table Editor**, tu dois voir les tables **`candidate_profiles`**, **`job_campaigns`**, **`campaign_applications`**.

---

## Étape 2 : Variables d’environnement

Dans ton fichier **`.env.local`** (et plus tard dans les variables d’environnement de ton hébergement), ajoute ou vérifie :

```env
# Déjà présentes normalement
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=gsk_...

# Obligatoires pour les campagnes (envoi réel)
RESEND_API_KEY=re_...

# Expéditeur des candidatures : une des deux variables suffit
RESEND_FROM_EMAIL=CareerAI <noreply@tondomaine.com>
# ou (si tu as déjà ça pour le reste de l'app) :
# EMAIL_FROM=onboarding@resend.dev

# Recommandé pour sécuriser le cron
CRON_SECRET=une_chaîne_secrète_longue_aleatoire
```

Sans `RESEND_API_KEY` et sans expéditeur (`RESEND_FROM_EMAIL` ou `EMAIL_FROM`), aucune candidature n’est envoyée : le service retourne une erreur explicite.

- **RESEND**
  - Crée un compte sur [resend.com](https://resend.com).
  - Dans **API Keys**, crée une clé et mets-la dans `RESEND_API_KEY`.
  - Définis l’expéditeur avec **`RESEND_FROM_EMAIL`** ou **`EMAIL_FROM`** (ex. `CareerAI <noreply@tondomaine.com>` ou `onboarding@resend.dev` pour les tests). Pour envoyer à de vrais recruteurs, vérifie ton domaine dans Resend.

- **CRON_SECRET**  
  Génère une valeur aléatoire (ex. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) et mets-la dans `CRON_SECRET`. Tu en auras besoin à l’étape 4.

- **Optionnel — France Travail (CDI, CDD, stage, jobs)**  
  Toutes les sources d’offres sont **gratuites**. Par défaut, l’app utilise **La Bonne Alternance** (sans clé) pour alternance et stages. Pour ajouter **CDI, CDD, jobs étudiants** via France Travail (ex Pôle emploi) : inscription gratuite sur [Emploi Store Dev](https://www.emploi-store-dev.fr/portail-developpeur-cms/), crée une application, puis ajoute :
  ```env
  FRANCETRAVAIL_CLIENT_ID=ton_client_id
  FRANCETRAVAIL_CLIENT_SECRET=ton_client_secret
  ```
  Sans ces variables, seules les offres La Bonne Alternance sont utilisées (déjà stage, alternance, 1er emploi).

---

## Étape 3 : Lancer l’app et tester le formulaire

1. En local : `npm run dev`.
2. Connecte-toi, ouvre **Candidatures automatiques** (icône mallette).
3. Remplis le formulaire (prénom, nom, email, métier recherché, type de contrat, dates, zone, **upload PDF**, contexte pour l’IA, email de campagne).
4. Clique sur **Enregistrer mon profil**, puis **Lancer ma campagne** (durée en jours + max candidatures/jour).

Vérification : dans **Mes campagnes**, une campagne **En cours** doit apparaître.

---

## Étape 4 : Déclencher le traitement (cron)

Le traitement (recherche d’offres + envoi des emails) est déclenché par l’URL :

```text
GET  https://ton-domaine.com/api/cron/run-campaigns
```

Avec une des deux sécurisations :

- **Header** : `Authorization: Bearer TON_CRON_SECRET`
- **Ou** en query : `?secret=TON_CRON_SECRET`

### Option A : Vercel (si ton app est déployée sur Vercel)

- Le fichier **`vercel.json`** à la racine du projet est déjà configuré pour appeler `/api/cron/run-campaigns` tous les jours à 8h (UTC).
- Dans le dashboard Vercel : **Project → Settings → Environment Variables** → ajoute **`CRON_SECRET`** avec la **même valeur** que dans `.env.local`.
- Note : les crons Vercel sont disponibles sur les plans payants. Si tu n’as pas le cron actif, utilise l’option B.

### Option B : Cron externe (gratuit)

1. Va sur [cron-job.org](https://cron-job.org) (ou équivalent), crée un compte.
2. Crée une tâche :
   - **URL** : `https://ton-domaine.com/api/cron/run-campaigns?secret=TON_CRON_SECRET`  
     (remplace par ton vrai domaine et la valeur de `CRON_SECRET`).
   - **Méthode** : GET.
   - **Planification** : une fois par jour (ex. 8h00).

### Option C : Hébergement sur Render

Si ton app est déployée sur **Render**, voir le guide dédié : **[SETUP_RENDER.md](SETUP_RENDER.md)** (Web Service + Cron Job Render ou cron externe).

Après le premier passage du cron, ouvre **Mes campagnes** → **Voir le détail des envois**. Si des offres avec email ont été trouvées, des lignes apparaissent (statut ✓ ou ✗).

---

## Étape 5 : Vérifications si rien ne part

- **Aucune candidature envoyée**  
  L’API La Bonne Alternance ne renvoie pas toujours d’email de contact. Beaucoup d’offres n’auront donc pas d’email → 0 envoi possible. C’est une limite de la source de données, pas du code.

- **Erreur Resend**  
  Vérifie `RESEND_API_KEY` et `RESEND_FROM_EMAIL` (obligatoires, pas de valeur par défaut). L’app n’envoie plus de mail « de test » sans configuration.
- **Erreur « Email de contact obligatoire » ou « Prénom et nom obligatoires »**  
  Le profil doit contenir un vrai email de campagne (ou de contact) et un prénom + nom pour que les candidatures soient envoyées.

- **Tester le cron à la main**  
  Dans un terminal ou Postman :  
  `curl "https://ton-domaine.com/api/cron/run-campaigns?secret=TON_CRON_SECRET"`  
  La réponse doit être du type `{"ok":true,"processed":1,"results":[...]}`.

---

## Récapitulatif

| # | Action |
|---|--------|
| 1 | Exécuter `campaigns.sql` puis `campaigns_v2_fields.sql` dans Supabase. |
| 2 | Renseigner `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET` (et les clés Supabase + Groq). |
| 3 | Remplir le formulaire campagnes, enregistrer le profil, lancer une campagne. |
| 4 | Configurer un appel quotidien à `/api/cron/run-campaigns` (Vercel Cron ou cron-job.org avec `?secret=CRON_SECRET`). |
| 5 | Vérifier les envois dans « Mes campagnes » → détail des envois. |

Une fois ces étapes faites, la fonctionnalité est **réelle et fonctionnelle** : les campagnes actives sont traitées chaque jour, les offres sont récupérées (LBA), les lettres générées (Groq) et les emails envoyés (Resend) lorsque des contacts sont disponibles.
