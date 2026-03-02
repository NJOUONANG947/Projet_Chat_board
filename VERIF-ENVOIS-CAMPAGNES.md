# Comment vérifier si des candidatures ont été envoyées

## 1. Voir la réponse JSON du cron (cron-job.org)

Sur **cron-job.org** :

1. Va dans **Dashboard** → clique sur ton cron job (la ligne avec l’URL).
2. Cherche **"Execution history"** / **"Last runs"** / **"Historique"**.
3. Clique sur **une exécution** (ex. "Today at 8:00:33 AM").
4. Regarde s’il y a **"Response"**, **"Response body"** ou **"Output"**.

Si oui, tu verras le JSON renvoyé par ton API, par exemple :

```json
{
  "ok": true,
  "processed": 3,
  "results": [
    {
      "campaignId": "uuid-1",
      "userId": "uuid-user",
      "sent": 2,
      "total": 2,
      "reason": null,
      "offersFetched": 45,
      "offersMatched": 12
    },
    {
      "campaignId": "uuid-2",
      "sent": 0,
      "total": 0,
      "reason": "Aucune offre ne correspond à ton profil...",
      "offersFetched": 0,
      "offersMatched": 0
    }
  ]
}
```

- **processed** = nombre de campagnes actives traitées.
- **results[].sent** = nombre de candidatures envoyées pour cette campagne.
- **results[].reason** = message si rien n’a été envoyé (profil, offres, quota, etc.).

Si cron-job.org n’affiche pas le corps de la réponse, utilise la méthode 2 ou 3.

---

## 2. Appeler l’URL à la main (voir le JSON)

Tu peux déclencher la même URL que le cron et afficher la réponse :

- **Navigateur** : ouvre (en étant connecté à ton compte, le secret ne doit pas traîner en clair) :
  `https://careerai.live/api/cron/run-campaigns?secret=TON_CRON_SECRET`
- **Terminal (curl)** :
  ```bash
  curl "https://careerai.live/api/cron/run-campaigns?secret=TON_CRON_SECRET"
  ```

Tu obtiens directement le JSON avec `processed`, `results`, `sent`, `reason`, etc.

---

## 3. Logs sur Render

Un **log serveur** a été ajouté dans l’API cron. À chaque exécution du cron, le serveur écrit une ligne du type :

```
[cron run-campaigns] { processed: 3, totalSent: 2, results: [ { campaignId: '...', sent: 2, reason: null }, ... ] }
```

Pour le voir :

1. **Render** → ton service (Web Service ou Cron Job qui héberge l’app).
2. Onglet **Logs**.
3. Au moment où le cron s’exécute (ex. 8h00), cherche `[cron run-campaigns]`.

Tu verras combien de campagnes ont été traitées, combien de candidatures envoyées au total et la raison par campagne si `sent === 0`.

---

## 4. Dans l’application (utilisateur)

Chaque utilisateur peut voir **ses** envois :

1. **Campagnes** (Candidatures automatiques).
2. Pour chaque campagne : **"X candidature(s) envoyée(s)"** = `total_sent` de la campagne.
3. **"Voir le détail des envois"** → liste des candidatures (entreprise, statut envoyé / échec).

Donc : si l’utilisateur voit 0 envoyée et clique sur "Lancer l’envoi maintenant", le message (toast) affiche la **reason** renvoyée par l’API (ex. "Aucune offre ne correspond à ton profil (0 offres trouvées, 0 correspondent…)"). C’est la même raison que dans le JSON du cron.

---

## 5. Base de données (Supabase)

Pour un contrôle technique direct :

- **Table `job_campaigns`** : colonne **`total_sent`** = nombre total de candidatures envoyées sur la vie de la campagne.
- **Table `campaign_applications`** : une ligne par envoi (ou tentative) :
  - **`status`** = `'sent'` (ok) ou `'failed'` (échec).
  - **`target_name`**, **`target_email`**, **`error_message`** (si failed).

Dans **Supabase** → **Table Editor** → `campaign_applications` : filtre par `campaign_id` ou par date pour voir les envois du jour.

---

## Résumé

| Où regarder | Quoi voir |
|-------------|-----------|
| **cron-job.org** (détail d’une exécution) | Réponse JSON si disponible : `processed`, `results[].sent`, `results[].reason` |
| **URL dans le navigateur ou curl** | Même JSON en appelant l’URL du cron avec le secret |
| **Render → Logs** | Ligne `[cron run-campaigns]` avec `processed`, `totalSent`, `results` |
| **App → Campagnes → détail des envois** | Liste des candidatures par campagne (sent/failed) |
| **Supabase → `campaign_applications`** | Lignes par envoi, `status` = sent/failed |
