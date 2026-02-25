# Actions manuelles pour faire fonctionner les candidatures automatiques

## 1. Base de données (Supabase)

Exécuter la migration SQL pour créer les tables des campagnes.

- Ouvrir le **SQL Editor** dans le dashboard Supabase.
- Copier-coller le contenu du fichier **`supabase-migrations/campaigns.sql`**, exécuter.
- Puis copier-coller le contenu de **`supabase-migrations/campaigns_v2_fields.sql`** (champs formulaire : prénom, nom, téléphone, genre, type de contrat, dates, durée, zone, email campagne, code promo), exécuter.

Vérifier que les tables `candidate_profiles`, `job_campaigns`, `campaign_applications` existent et que `candidate_profiles` contient bien les colonnes `first_name`, `last_name`, `phone`, `gender`, `contract_type`, `start_date_earliest`, `end_date_latest`, `zone_geographique`, `campaign_email`, etc.

---

## 2. Variables d’environnement

Ajouter (ou vérifier) dans `.env.local` (ou dans les variables d’environnement de votre hébergement) :

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `GROQ_API_KEY` | Clé API Groq (déjà utilisée pour le chat / analyse) | Oui (pour générer les lettres) |
| `RESEND_API_KEY` | Clé API Resend (envoi d’emails) | Oui (pour envoyer les candidatures) |
| `RESEND_FROM_EMAIL` | Email expéditeur (ex. `CareerAI <noreply@votredomaine.com>`) | Recommandé (sinon Resend utilise un email par défaut) |
| `CRON_SECRET` | Secret pour sécuriser l’appel au cron (chaîne aléatoire) | Recommandé (pour protéger `/api/cron/run-campaigns`) |

- **Resend** : créer un compte sur [resend.com](https://resend.com), vérifier un domaine (ou utiliser le domaine de test), récupérer la clé API et l’email d’envoi.
- **CRON_SECRET** : générer une chaîne aléatoire (ex. `openssl rand -hex 32`) et la mettre dans `.env.local` ainsi que dans le cron (voir ci‑dessous).

---

## 3. Cron : lancer le traitement chaque jour

Le traitement des campagnes (recherche d’offres + envoi des candidatures) est déclenché par l’URL :

```text
GET ou POST  https://votre-domaine.com/api/cron/run-campaigns
Header:      Authorization: Bearer VOTRE_CRON_SECRET
```

Il faut appeler cette URL **une fois par jour** (ex. chaque matin à 8h).

### Option A – Vercel Cron (si l’app est sur Vercel)

1. Créer (ou modifier) **`vercel.json`** à la racine du projet :

```json
{
  "crons": [
    {
      "url": "/api/cron/run-campaigns",
      "schedule": "0 8 * * *"
    }
  ]
}
```

2. Dans le dashboard Vercel : **Project → Settings → Environment Variables**  
   - Ajouter `CRON_SECRET` avec la même valeur que dans `.env.local`.

3. Vercel enverra automatiquement un header `Authorization: Bearer <CRON_SECRET>` aux crons ; il faut que votre route vérifie ce header (déjà le cas si vous utilisez `Authorization: Bearer <secret>`).

   Si Vercel n’envoie pas ce header par défaut, il faudra peut‑être sécuriser la route autrement (ex. vérifier un header spécifique fourni par Vercel) ou utiliser l’option B.

### Option B – Cron externe (cron-job.org, EasyCron, ou serveur)

1. Créer une tâche planifiée (daily, ex. 8h00).
2. Requête HTTP : **GET** ou **POST** vers  
   `https://votre-domaine.com/api/cron/run-campaigns`
3. Sécurisation (une des deux) :
   - **Header** : `Authorization: Bearer VOTRE_CRON_SECRET`
   - **Ou** en query : `https://votre-domaine.com/api/cron/run-campaigns?secret=VOTRE_CRON_SECRET`  
   (utiliser la même valeur que `CRON_SECRET` dans `.env.local`).

---

## 4. Vérifications rapides

- **Profil candidat** : depuis l’app, aller dans « Candidatures automatiques », remplir le profil (métiers, lieux, email, case « Autoriser les candidatures automatiques ») et enregistrer.
- **Campagne** : lancer une campagne (durée en jours, max candidatures/jour). Vérifier qu’elle apparaît dans « Mes campagnes » avec le statut « En cours ».
- **Cron** : après avoir configuré le cron, attendre un passage (ou appeler une fois à la main avec `Authorization: Bearer CRON_SECRET`). Vérifier dans « Mes campagnes » → « Voir le détail des envois » que des lignes apparaissent (si des offres avec email ont été trouvées).

---

## 5. Limites connues

- **La Bonne Alternance** : toutes les offres ne renvoient pas d’email de contact ; seules celles avec email recevront une candidature.
- **Resend** : en mode test / sans domaine vérifié, les envois peuvent être limités ou bloqués ; vérifier le domaine d’envoi pour la prod.
- **Pièce jointe CV** : l’email envoyé contient la lettre générée par l’IA ; l’ajout du CV en PDF en pièce jointe n’est pas implémenté dans cette version (à ajouter côté backend si besoin).

---

## Récapitulatif

1. Exécuter **`supabase-migrations/campaigns.sql`** dans Supabase.  
2. Configurer **`GROQ_API_KEY`**, **`RESEND_API_KEY`**, **`RESEND_FROM_EMAIL`**, **`CRON_SECRET`**.  
3. Planifier l’appel quotidien à **`/api/cron/run-campaigns`** avec le header **`Authorization: Bearer CRON_SECRET`** (Vercel Cron ou cron externe).  
4. Tester en créant un profil et une campagne, puis en vérifiant les envois après un passage du cron.
