# Comment faire pour que les candidatures soient envoyées

Actuellement **offersFetched: 0** : aucune source (LBA, France Travail, Adzuna, Google) ne renvoie d'offres. Pour que des candidatures partent, il faut qu'**au moins une source** renvoie des offres.

---

## À faire (dans l'ordre)

### 1. Activer **Adzuna France** (le plus simple, gratuit)

Sans clé, l'app n'appelle pas Adzuna → 0 offre de cette source.

1. Va sur **https://developer.adzuna.com/signup** et crée un compte.
2. Crée une **application** (ex. "CareerAI") et récupère :
   - **Application ID** (ex. `a1b2c3d4`)
   - **Application Key** (une longue clé hexadécimale).
3. Sur **Render** : ton service → **Environment** → ajoute :
   - `ADZUNA_APP_ID` = ton Application ID
   - `ADZUNA_APP_KEY` = ta clé
4. **Redéploie** le service (Manual Deploy → Deploy latest commit).

Après ça, à chaque cron ou « Lancer l'envoi maintenant », l'app interroge Adzuna. Tu devrais voir **offersFetched > 0** (et éventuellement **sent > 0** si des offres ont un email et correspondent au profil).

---

### 2. (Optionnel) Activer **Google Custom Search**

Tu as déjà peut‑être un CSE (ex. `062226531bf084f55`). Il suffit d'avoir les 2 variables sur Render :

- `GOOGLE_API_KEY` = clé API Google (Cloud Console, Custom Search API activée)
- `GOOGLE_CSE_ID` = ID de ton moteur (ex. `062226531bf084f55`)

Puis redéploie. Ça ajoute une source de plus.

---

### 3. (Optionnel) Activer **France Travail**

Réservé aux partenaires (inscription France Travail / emploi-store-dev). Si tu as des identifiants :

- `FRANCETRAVAIL_CLIENT_ID`
- `FRANCETRAVAIL_CLIENT_SECRET`

Ajoute-les dans **Environment** sur Render et redéploie.

---

### 4. Vérifier **Resend** (envoi d'emails)

Pour que les candidatures partent vraiment par email :

- `RESEND_API_KEY` = ta clé Resend
- `RESEND_FROM_EMAIL` ou `EMAIL_FROM` = l'adresse expéditrice

Sans ça, même avec des offres, l'envoi échouera.

---

## Résumé

| Étape | Où | Résultat |
|-------|-----|----------|
| 1. Adzuna | Render → Environment : `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` puis redéploi | Offres Adzuna → **offersFetched > 0** possible |
| 2. Google | Render : `GOOGLE_API_KEY`, `GOOGLE_CSE_ID` puis redéploi | Plus d'offres |
| 3. France Travail | Render : clés France Travail puis redéploi | Offres France Travail |
| 4. Resend | Déjà configuré en général | Envoi email possible |

**La Bonne Alternance** (LBA) renvoie actuellement 400/401 ; en attendant, **Adzuna** (et optionnellement Google + France Travail) suffit pour que des candidatures soient envoyées.

---

## Après configuration

1. Redéploie sur Render après avoir ajouté les variables.
2. Attends le prochain cron ou clique sur **« Lancer l'envoi maintenant »**.
3. Vérifie la réponse : **offersFetched > 0** puis, si des offres ont un email et correspondent au profil, **sent > 0**.
