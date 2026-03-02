# Pourquoi je n'ai aucun retour / aucune candidature envoyée ?

Après avoir cliqué sur **« Lancer l'envoi maintenant »**, un **retour** s'affiche désormais :
- une **notification** (toast) avec la raison si 0 envoi ;
- un **encadré « Dernier lancement »** sous le bouton avec l'explication détaillée.

Consulte ce message pour savoir pourquoi 0 candidature a été envoyée. Voici les causes possibles et quoi vérifier.

---

## 1. Vérifier le profil candidat

- **Prénom et Nom** : obligatoires (sinon message « Prénom et nom obligatoires dans le profil »).
- **Email de campagne** : le champ « Quelle adresse mail pour cette campagne ? » doit contenir une vraie adresse email (c’est celle utilisée pour envoyer les candidatures et pour que les recruteurs te répondent).
- **Métiers recherchés** : au moins un métier ou mot-clé (ex. « développeur », « commercial »).
- **Case « Autoriser l'envoi automatique »** : doit être cochée.

Sans ça, le service refuse d’envoyer et renvoie un message explicite.

---

## 2. Offres sans email

Beaucoup d’offres sur La Bonne Alternance, France Travail ou Adzuna **n’ont pas d’email de contact** dans l’API. L’app n’envoie **que** aux offres où un email a été trouvé (champ contact ou extrait de la description).

- **Message possible** : « Aucune offre avec email de contact trouvée » ou « Les plateformes exposent rarement les emails ».
- **À faire** : activer **Adzuna France** (voir [SOURCES-OFFRES-EMPLOI.md](SOURCES-OFFRES-EMPLOI.md)) : inscription gratuite, puis `ADZUNA_APP_ID` et `ADZUNA_APP_KEY` dans les variables d’environnement. Plus de sources = plus de chances d’avoir des offres avec email (souvent dans la description).

---

## 3. Aucune offre ne correspond au profil

- **Message possible** : « Aucune offre ne correspond à ton profil (métiers / zone / type de contrat) ».
- **À faire** : élargir les critères (métiers, zone géographique, type de contrat) ou réessayer plus tard.

---

## 4. Envoi d’emails non configuré (Resend)

- **Messages possibles** : « RESEND_API_KEY manquant », « Expéditeur manquant (RESEND_FROM_EMAIL ou EMAIL_FROM) ».
- **À faire** : dans les variables d’environnement (Render, Vercel, etc.) :
  - `RESEND_API_KEY` : clé API Resend (créer un compte sur [resend.com](https://resend.com)).
  - `RESEND_FROM_EMAIL` (ou `EMAIL_FROM`) : expéditeur des emails, ex. `CareerAI <noreply@tondomaine.com>`.

**Mode test Resend** : sans domaine vérifié, Resend n’envoie qu’à **ton propre email**. Pour envoyer aux recruteurs, il faut vérifier un domaine dans Resend et utiliser une adresse de ce domaine dans `RESEND_FROM_EMAIL`. Voir [GUIDE-RESEND-SORTIR-MODE-TEST.md](GUIDE-RESEND-SORTIR-MODE-TEST.md) si besoin.

---

## 5. Cron (envoi automatique chaque jour)

Si tu n’utilises **que** le cron et jamais le bouton « Lancer l'envoi maintenant » :

- Vérifier que le **cron est bien configuré** (Render Cron Job, cron-job.org, ou Vercel Cron) et qu’il appelle bien l’URL prévue avec le bon `CRON_SECRET` (header `Authorization: Bearer CRON_SECRET` ou `?secret=CRON_SECRET`).
- Sur Render : le **Cron Job** doit avoir les variables `SERVICE_URL` et `CRON_SECRET` ; la commande de démarrage doit être `sh scripts/cron-run-campaigns.sh` (voir [SETUP_RENDER.md](SETUP_RENDER.md)).
- Après un passage du cron, vérifier dans l’app : **Mes campagnes** → **Voir le détail des envois** pour voir si des lignes apparaissent (✓ ou ✗).

---

## 6. Où voir le retour dans l’app

- **Notification (toast)** : après « Lancer l'envoi maintenant », une bulle s’affiche en bas avec le message (succès ou raison du 0 envoi).
- **Encadré « Dernier lancement »** : juste sous le bouton « Lancer l'envoi maintenant », l’explication détaillée du dernier run (nombre d’envois ou raison).
- **Détail des envois** : pour chaque campagne, cliquer sur **« Voir le détail des envois »** pour voir la liste des candidatures envoyées (✓) ou en erreur (✗).

---

## Résumé

1. Clique sur **« Lancer l'envoi maintenant »** et lis le **toast** + l’**encadré « Dernier lancement »** pour avoir la raison exacte.
2. Vérifie **profil** (nom, prénom, email de campagne, métiers, case « Autoriser l'envoi automatique »).
3. Vérifie **Resend** (clé API + expéditeur, et sortie du mode test si tu veux envoyer aux recruteurs).
4. Active **Adzuna** pour avoir plus d’offres avec email.
5. Si tu utilises le **cron**, vérifie qu’il est bien planifié et qu’il appelle l’API avec le bon `CRON_SECRET`.
