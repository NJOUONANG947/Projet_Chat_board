# Vérification technique : les 4 causes « aucun retour » sont gérées

L’application **vérifie côté code** chaque cause et **retourne un message clair** à l’utilisateur (toast + encadré « Dernier lancement »). Aucune de ces situations ne reste sans explication.

---

## 1. Profil incomplet

| Contrôle | Où | Comportement |
|----------|-----|--------------|
| **Prénom + Nom** | Backend `runCampaignDay` | Si vides → `reason: 'Prénom et nom obligatoires dans le profil pour envoyer des candidatures.'` |
| **Prénom + Nom + Email contact** | Frontend `startCampaign` | Avant « Lancer ma campagne » → toast `minFieldsRequired` si manquant |
| **Email de campagne** | Backend `runCampaignDay` | Si absent ou sans `@` → `reason: 'Email de contact obligatoire. Renseigne l\'email de campagne (ou contact) dans "Mon profil".'` |
| **Email de campagne** | Frontend `startCampaign` | Si vide ou sans `@` → alert `emailHint` |
| **Au moins un métier** | Backend `runCampaignDay` | Si `preferred_job_titles` vide → `reason: 'Indique au moins un métier ou intitulé de poste recherché dans « Mon profil ».'` |
| **Au moins un métier** | Frontend `startCampaign` | Avant « Lancer ma campagne » → toast `missingJobTitle` si vide |
| **Autoriser l'envoi automatique** | Backend `runCampaignDay` | Si `allow_auto_apply` false → `reason: 'Candidatures auto désactivées. Active "Autoriser l\'envoi automatique" dans ton profil.'` |
| **Profil manquant** | Backend `runCampaignDay` | Si pas de ligne `candidate_profiles` → `reason: 'Profil candidat manquant. Renseigne la section "Mon profil" (nom, email, métiers, zone).'` |

**Fichiers :** `backend/services/CampaignService.js` (runCampaignDay), `frontend/components/JobCampaigns.js` (startCampaign).

---

## 2. Aucune offre avec email

| Contrôle | Où | Comportement |
|----------|-----|--------------|
| Offres trouvées mais aucune avec email | Backend `runCampaignDay` | Après `normalized`, si `withEmail === 0` → `reason: 'Aucune offre avec email de contact trouvée. Les plateformes (La Bonne Alternance, etc.) exposent rarement les emails.'` |
| Aucune offre qui correspond au profil | Backend `runCampaignDay` | Si `matched.length === 0` → `reason: 'Aucune offre ne correspond à ton profil (métiers / zone / type de contrat). Élargis les critères ou réessaie plus tard.'` |
| Toutes déjà envoyées (quota / doublons) | Backend `runCampaignDay` | Si `toSend.length === 0` mais des offres avec email → `reason: 'Toutes les offres correspondantes ont déjà reçu une candidature (quota du jour ou doublons). Réessaie demain.'` |

Adzuna est déjà utilisé si `ADZUNA_APP_ID` et `ADZUNA_APP_KEY` sont définis (`CampaignService.fetchJobsFromAdzuna`). Pas de changement de code nécessaire pour cette cause, uniquement la config (voir SOURCES-OFFRES-EMPLOI.md).

**Fichier :** `backend/services/CampaignService.js` (runCampaignDay, fetchAllJobsForProfile, extractEmailFromJob).

---

## 3. Resend pas configuré ou en mode test

| Contrôle | Où | Comportement |
|----------|-----|--------------|
| `RESEND_API_KEY` manquant | Backend `runCampaignDay` | → `reason: 'Envoi d’emails non configuré (RESEND_API_KEY manquant). Contacte l’administrateur.'` |
| `RESEND_FROM_EMAIL` / `EMAIL_FROM` manquant | Backend `runCampaignDay` | → `reason: 'Expéditeur email manquant (RESEND_FROM_EMAIL ou EMAIL_FROM). Contacte l’administrateur.'` |
| Erreur Resend (mode test / domaine) | Backend `sendApplicationEmail` | Détection des messages « only send testing emails to your own email », « verify a domain » → erreur explicite en français (vérifier domaine, utiliser une adresse du domaine). |
| Propagation au retour run | Backend `runCampaignDay` | Si tous les envois échouent → `firstError` renvoyé dans `reason` (affiché dans « Dernier lancement »). |

**Fichier :** `backend/services/CampaignService.js` (runCampaignDay, sendApplicationEmail).

---

## 4. Cron jamais exécuté

| Contrôle | Où | Comportement |
|----------|-----|--------------|
| Cron non configuré | Déploiement / config | Pas de code dans l’app qui « force » le cron : c’est une configuration (Render Cron Job, cron-job.org, Vercel Cron). Le guide SETUP_RENDER.md / MANUAL_ACTIONS_CAMPAIGNS.md décrit les étapes. |
| Utilisateur n’utilise que le cron | UX | Le bouton « Lancer l'envoi maintenant » permet de tester sans attendre le cron et d’avoir un retour immédiat (toast + « Dernier lancement »). |
| Réponse du cron | API `GET/POST /api/cron/run-campaigns` | Si `CRON_SECRET` correct → exécution et retour `{ ok, processed, results }`. Si secret faux → 401 Unauthorized. |

L’application ne peut pas exécuter le cron à la place de l’hébergeur ; elle **répond correctement** quand le cron l’appelle et **donne un retour clair** quand l’utilisateur déclenche « Lancer l'envoi maintenant ».

**Fichiers :** `app/api/cron/run-campaigns/route.js`, `app/api/campaigns/run-now/route.js`, `scripts/cron-run-campaigns.sh`, docs (SETUP_RENDER.md, etc.).

---

## Résumé

- **Profil incomplet** : vérifications backend (runCampaignDay) + frontend (startCampaign), avec messages dédiés (dont métier obligatoire).
- **Aucune offre avec email** : 3 raisons distinctes retournées par runCampaignDay ; Adzuna utilisé si configuré.
- **Resend** : vérification des clés et de l’expéditeur, détection du mode test / domaine, erreur remontée dans `reason`.
- **Cron** : comportement correct côté API ; l’exécution effective dépend de la config hébergeur (documentée).

En pratique, l’app **ne laisse pas l’utilisateur sans retour** : chaque cas renvoie une raison explicite, affichée dans la notification et dans l’encadré « Dernier lancement ».
