# Sources d’offres d’emploi – Candidatures automatiques

L’application récupère des offres depuis plusieurs **sources gratuites** et envoie les candidatures par email **uniquement aux offres qui ont une adresse email** (recruteur ou entreprise).

---

## Sources utilisées

| Source | Configuration | Email recruteur |
|--------|----------------|------------------|
| **La Bonne Alternance** (v1 + v3 + entreprises) | Aucune (API publique) | Quand l’API renvoie un contact / email |
| **France Travail** (CDI, CDD, stage) | `FRANCETRAVAIL_CLIENT_ID` + `FRANCETRAVAIL_CLIENT_SECRET` | Quand l’API renvoie un courriel |
| **Adzuna France** | `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` (gratuit) | Souvent dans la **description** de l’offre |
| **Google Custom Search** (recherche web) | `GOOGLE_API_KEY` + `GOOGLE_CSE_ID` (100 req/jour gratuites) | Quand un email apparaît dans l’**extrait** du résultat |

---

## Extraction de l’email

L’app cherche l’email dans :

1. Les champs directs : `email`, `contact`, `apply_email`, `company.email`, etc.
2. **La description de l’offre** : beaucoup de recruteurs (surtout sur les petites annonces ou plateformes où ils postent directement) mettent leur email dans le texte, par ex. « Contact : recrutement@entreprise.com » ou « Répondre à … ». L’app **détecte automatiquement** une adresse email dans la description et l’utilise pour envoyer la candidature.
3. Le reste de l’objet offre (autres champs texte).

Donc dès qu’une offre contient un email **n’importe où** (champ dédié ou dans la description), elle peut recevoir un envoi.

---

## Plateformes « libres » où les gens postent avec leur email

- **La Bonne Alternance** : mélange d’offres ; certaines ont un contact/email, d’autres non.
- **France Travail** : offres officielles ; le courriel n’est pas toujours exposé dans l’API.
- **Adzuna** : agrégateur ; les offres viennent de nombreux sites. Les annonces où le recruteur a mis son email **dans le texte** sont prises en compte grâce à l’extraction dans la description.

Il n’existe pas d’API publique « magique » qui ne renverrait que des offres avec email. En revanche :

- Plus il y a de **sources** (LBA + France Travail + Adzuna), plus il y a d’offres.
- L’**extraction dans la description** permet de capter les offres où l’email est dans le texte (sites type petites annonces, offres directes employeur).

---

## Activer Adzuna France (recommandé)

1. Inscription gratuite : **https://developer.adzuna.com/signup**
2. Récupère ton **Application ID** et **Application Key**.
3. Dans `.env.local` (ou variables d’environnement sur Render) :

```env
ADZUNA_APP_ID=ton_app_id
ADZUNA_APP_KEY=ton_app_key
```

4. Redémarre l’app. Les campagnes utiliseront aussi les offres Adzuna France ; les offres dont l’email est dans la description seront envoyées.

---

## En résumé

- **Oui**, l’app peut envoyer aux entreprises qui mettent leur email **directement** dans l’offre (champ contact ou dans la description).
- Les **sources** sont : La Bonne Alternance, France Travail (si configuré), Adzuna France (si configuré).
- L’**email** est pris soit depuis les champs API, soit **détecté dans le texte** de l’offre (description).

Plus tu actives de sources (surtout Adzuna) et plus les recruteurs mettent leur email dans l’annonce, plus tu auras d’envois réels.
