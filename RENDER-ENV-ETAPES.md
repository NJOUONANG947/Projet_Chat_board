# Configuration Render – Variables d'environnement (étape par étape)

Ce guide décrit comment renseigner **toutes les variables d'environnement** sur Render pour que CareerAI fonctionne en production.

---

## Étape 1 : Aller sur Render

1. Ouvre **https://dashboard.render.com** et connecte-toi.
2. Clique sur ton **service** (ton application CareerAI / Next.js).
3. Dans le menu de gauche, clique sur **Environment** (ou **Environment Variables**).

Tu arrives sur la page où tu peux ajouter des **Key** / **Value**.

---

## Étape 2 : Variables obligatoires (sans elles l’app ne marche pas)

Ajoute **une par une** les variables suivantes. Pour chaque ligne : **Key** = nom exact, **Value** = ta valeur (sans espaces en trop).

### Supabase (base de données + auth)

| Key | Value | Où les trouver |
|-----|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` | Supabase → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1...` | Supabase → Project Settings → API → service_role (secret) |

### Groq (IA : chat, lettres, quiz)

| Key | Value | Où les trouver |
|-----|--------|----------------|
| `GROQ_API_KEY` | `gsk_xxxxx...` | https://console.groq.com → API Keys |

### URL de l’application (liens dans les emails)

| Key | Value | Exemple |
|-----|--------|--------|
| `NEXT_PUBLIC_BASE_URL` | L’URL publique de ton app sur Render | `https://careerai-xxxx.onrender.com` ou `https://careerai.blog` |

**Important :** mets l’URL **sans** slash à la fin (ex. `https://careerai.blog` et non `https://careerai.blog/`).

---

## Étape 3 : Email (Resend) – obligatoire pour envoyer des mails

Sans ces variables, les quiz et campagnes ne peuvent pas envoyer d’emails.

| Key | Value | Où les trouver |
|-----|--------|----------------|
| `RESEND_API_KEY` | `re_xxxxx...` | https://resend.com → API Keys |
| `EMAIL_FROM` | Ton adresse expéditrice | Si domaine vérifié : `noreply@careerai.blog` |
| `RESEND_FROM_EMAIL` | (optionnel) Même chose avec libellé | `CareerAI <noreply@careerai.blog>` |

**Rappel :** pour envoyer aux candidats et recruteurs (pas seulement à toi), le domaine doit être vérifié sur Resend et l’adresse doit être de ce domaine (ex. `noreply@careerai.blog`).

---

## Étape 4 : Candidatures automatiques (campagnes)

### Adzuna (plus d’offres avec possibilité d’email dans la description)

| Key | Value | Où les trouver |
|-----|--------|----------------|
| `ADZUNA_APP_ID` | Ton Application ID | https://developer.adzuna.com → ton application |
| `ADZUNA_APP_KEY` | Ta clé API | Même page, section Application Keys |

### France Travail (CDI, CDD, stage) – optionnel

| Key | Value | Où les trouver |
|-----|--------|----------------|
| `FRANCETRAVAIL_CLIENT_ID` | `PAR_xxxxx...` | https://francetravail.io → inscription partenaire |
| `FRANCETRAVAIL_CLIENT_SECRET` | Ta clé secrète | Même espace |

### Cron (lancement automatique quotidien des campagnes) – optionnel

| Key | Value | Comment |
|-----|--------|--------|
| `CRON_SECRET` | Une chaîne secrète aléatoire | Invente une longue chaîne (ex. 32 caractères) et mets-la ici. La même valeur devra être envoyée en en-tête quand le cron appelle ton API. |

Sans `CRON_SECRET`, les campagnes ne peuvent être lancées que manuellement via « Lancer l’envoi maintenant » dans l’app.

---

## Étape 5 : Optionnel (génération d’images, etc.)

| Key | Value | Rôle |
|-----|--------|------|
| `HUGGINGFACE_TOKEN` | `hf_xxxxx...` | Génération d’images (Hugging Face). Optionnel. |

---

## Étape 6 : Sauvegarder et redéployer

1. Après avoir ajouté **toutes** les variables nécessaires, clique sur **Save Changes** (ou équivalent).
2. Render propose souvent de **redéployer** pour prendre en compte les nouvelles variables : accepte, ou lance un **Manual Deploy** depuis l’onglet **Manual Deploy**.
3. Attends la fin du déploiement. L’app utilisera alors les variables que tu viens de configurer.

---

## Checklist rapide

Coche au fur et à mesure :

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GROQ_API_KEY`
- [ ] `NEXT_PUBLIC_BASE_URL` (URL Render ou ton domaine)
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM` (ou `RESEND_FROM_EMAIL`)
- [ ] `ADZUNA_APP_ID` (si tu veux Adzuna)
- [ ] `ADZUNA_APP_KEY` (si tu veux Adzuna)
- [ ] (Optionnel) `FRANCETRAVAIL_CLIENT_ID` / `FRANCETRAVAIL_CLIENT_SECRET`
- [ ] (Optionnel) `CRON_SECRET`
- [ ] (Optionnel) `HUGGINGFACE_TOKEN`

---

## Ordre conseillé sur Render

1. **Environment** → **Add Environment Variable**.
2. Saisir **Key** (ex. `NEXT_PUBLIC_SUPABASE_URL`).
3. Saisir **Value** (coller la valeur).
4. Cliquer **Add** (ou Save).
5. Répéter pour chaque variable.
6. **Save Changes** en bas de page.
7. Lancer un **Deploy** si Render ne le propose pas automatiquement.

Une fois tout en place et le déploiement terminé, l’app sur Render utilisera ces configurations.
