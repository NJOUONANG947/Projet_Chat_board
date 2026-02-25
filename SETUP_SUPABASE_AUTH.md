# Configuration Supabase : mot de passe oublié et 2FA

Guide étape par étape pour configurer **Redirect URLs** (réinitialisation du mot de passe) et **MFA (double authentification)** dans ton projet Supabase.

---

## Partie 1 : Redirect URLs (mot de passe oublié)

Sans cette configuration, le lien « Réinitialiser mon mot de passe » dans l’email renverra vers une URL non autorisée et la réinitialisation peut échouer.

### Étapes

1. **Ouvre ton projet Supabase**
   - Va sur [https://supabase.com](https://supabase.com) et connecte-toi.
   - Clique sur ton **projet** (celui utilisé par CareerAI).

2. **Ouvre la configuration Auth**
   - Dans le menu de gauche, clique sur **Authentication** (icône cadenas / utilisateur).
   - Puis clique sur **URL Configuration** (sous « Configuration » ou dans le sous-menu).

3. **Ajouter les URLs de redirection**
   - Repère la section **Redirect URLs** (liste d’URLs autorisées après connexion, magic link, reset password, etc.).
   - Clique sur **Add URL** (ou le champ « Add new redirect URL »).

4. **Saisir les URLs une par une**
   - **En local** (pour tester sur ta machine) :
     ```
     http://localhost:3000/auth/update-password
     ```
     Clique sur **Add** / **Save**.
   - **En production** (ton site déployé, ex. Render) :
     ```
     https://ton-app.onrender.com/auth/update-password
     ```
     Remplace `ton-app.onrender.com` par ton vrai domaine (ex. `careerai.fr` ou l’URL fournie par Render).
     Clique sur **Add** / **Save**.

5. **Vérifier**
   - Les deux URLs doivent apparaître dans la liste **Redirect URLs**.
   - Tu peux en ajouter d’autres si tu as plusieurs environnements (staging, autre domaine).

### Résumé

| Environnement | URL à ajouter |
|---------------|----------------|
| Local         | `http://localhost:3000/auth/update-password` |
| Production    | `https://TON_DOMAINE/auth/update-password`   |

---

## Partie 2 : Activer la MFA (double authentification)

La double authentification (TOTP, type Google Authenticator) doit être activée au niveau du **projet** pour que les utilisateurs puissent l’activer dans Paramètres.

### Étapes

1. **Ouvre ton projet Supabase**
   - Même projet que pour la Partie 1.

2. **Ouvre la configuration Auth**
   - Menu de gauche → **Authentication**.

3. **Trouver l’option MFA**
   - Selon la version de l’interface Supabase :
     - **Option A** : Sous-menu **Providers** → descends jusqu’à une section **Multi-Factor Authentication** ou **MFA**.
     - **Option B** : Un onglet ou lien **MFA** directement sous **Authentication**.
     - **Option C** : **Authentication** → **Policies** ou **Settings** → chercher « MFA », « TOTP », « Multi-factor ».
   - Si tu ne vois pas « MFA » : dans certaines versions, la MFA est **activée par défaut** dès que tu utilises les méthodes `mfa.enroll` / `mfa.challenge` dans le code. Dans ce cas, il n’y a rien à cocher.

4. **Activer MFA si l’option existe**
   - Si tu vois un interrupteur **Enable MFA** ou **Enable Multi-Factor Authentication** : passe-le sur **On**.
   - Si tu vois **Factor types** ou **TOTP** : assure-toi que **TOTP** (authenticator app) est coché / activé.
   - Enregistre les changements (**Save**).

5. **Tester**
   - Dans l’app CareerAI : **Paramètres** → **Compte & sécurité** → **Activer la double authentification**.
   - Scanne le QR code avec Google Authenticator (ou une app similaire), entre le code à 6 chiffres.
   - Déconnecte-toi, reconnecte-toi : après ton mot de passe, l’écran doit demander le code de l’app.

### Si tu ne trouves pas « MFA » dans le dashboard

- Consulte la doc à jour : [Supabase Auth MFA](https://supabase.com/docs/guides/auth/auth-mfa).
- Les projets récents peuvent avoir la MFA disponible sans réglage visible ; dans ce cas, le code (enrôlement + vérification à la connexion) suffit.

---

## Récapitulatif

| Action | Où dans Supabase | Ce que tu fais |
|--------|-------------------|----------------|
| Redirect URLs | **Authentication** → **URL Configuration** → **Redirect URLs** | Ajouter `http://localhost:3000/auth/update-password` et `https://TON_DOMAINE/auth/update-password` |
| MFA (2FA)     | **Authentication** → **Providers** ou **MFA** (selon l’interface) | Activer « Enable MFA » / TOTP si l’option est présente |

Une fois ces deux points faits :
- **Mot de passe oublié** : l’utilisateur reçoit l’email, clique sur le lien et arrive bien sur ta page « Nouveau mot de passe ».
- **2FA** : les utilisateurs peuvent activer la double authentification dans Paramètres et devront entrer le code à chaque connexion.
