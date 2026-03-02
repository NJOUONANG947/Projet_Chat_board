# LinkedIn, Facebook, Instagram, Google : APIs pour fouiller les offres d’emploi ?

Tu veux que l’IA « fouille » aussi LinkedIn, Facebook, Instagram, Google pour les candidatures automatiques. Voici la situation technique réelle.

---

## En résumé

- **LinkedIn, Facebook, Instagram** : il n’existe **pas** d’API publique gratuite (ou accessible à un petit projet) pour « chercher des offres d’emploi » comme avec La Bonne Alternance ou Adzuna. On ne peut pas les ajouter de la même façon.
- **Google** : pas d’API « Google Jobs » pour développeurs pour interroger gratuitement le carrousel d’offres. Il existe des solutions entreprise (payantes, lourdes).

Donc : **on ne peut pas aujourd’hui brancher des APIs officielles LinkedIn / Facebook / Instagram / Google** pour que l’IA fouille ces plateformes comme elle le fait pour LBA ou Adzuna.

---

## Détail par plateforme

### LinkedIn

- L’API LinkedIn (developers.linkedin.com) ne propose **pas** d’endpoint public pour lister ou rechercher les offres d’emploi.
- Les produits « LinkedIn Talent Solutions », « Recruiter » sont pour les recruteurs (comptes payants), pas pour un agrégateur externe.
- Scraper LinkedIn est interdit par les conditions d’utilisation et expose à des blocages / risques juridiques.

**Conclusion : pas d’API LinkedIn utilisable pour ton cas.**

---

### Facebook

- Facebook a une section « Offres d’emploi » et des APIs (ex. Graph API), mais :
  - L’accès est orienté vers la gestion de **tes** contenus (pages, annonces), pas vers une recherche globale d’offres d’emploi.
  - Il n’y a pas d’API documentée du type « recherche d’offres d’emploi sur toute la plateforme » pour un tiers.
- Donc on ne peut pas « brancher une clé API Facebook » pour fouiller les offres comme avec Adzuna.

**Conclusion : pas d’API Facebook pour rechercher les offres d’emploi de la même façon.**

---

### Instagram

- L’API Instagram (Meta) sert à gérer des contenus (photos, stories, insights), pas à rechercher des offres d’emploi.
- Aucun produit « offres d’emploi » exposé via API pour développeurs.

**Conclusion : pas d’API Instagram pour les offres.**

---

### Google

- **Google for Jobs** (carrousel dans la recherche) : les offres viennent de sites qui publient des données structurées (JSON-LD). Google agrège ; il n’y a **pas** d’API publique « Google Jobs » pour faire une requête type « donne-moi les offres pour “développeur Paris” ».
- **Google Cloud Talent Solution** (Cloud) : c’est une solution pour les entreprises (recruteurs, job boards) pour héberger et rechercher des offres ; c’est payant et lourd à mettre en place, pas une simple clé pour « fouiller » le web.

**Conclusion : pas d’API Google simple et gratuite pour fouiller les offres comme LBA/Adzuna.**

---

## Ce que l’app fait déjà (et ce qu’on peut ajouter)

Aujourd’hui l’app utilise des **sources avec API ou données ouvertes** :

- **La Bonne Alternance** (API publique)
- **France Travail** (API partenaire, si tu as `FRANCETRAVAIL_CLIENT_ID` / `FRANCETRAVAIL_CLIENT_SECRET`)
- **Adzuna France** (API gratuite après inscription : `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`)

Pour **avoir plus d’offres** sans LinkedIn/Facebook/Instagram/Google :

1. **Configurer Adzuna** si ce n’est pas fait :  
   https://developer.adzuna.com/signup  
   Puis dans ton `.env` : `ADZUNA_APP_ID` et `ADZUNA_APP_KEY`.

2. **Ajouter d’autres agrégateurs ou job boards qui ont une API** (quand ils existent), par exemple :
   - **The Muse** (API limitée)
   - **Remotive** (offres remote)
   - **Arbeitnow** (API gratuite)
   - Ou d’autres APIs « jobs » selon ta cible (pays, secteur).

On ne peut pas « avoir les API LinkedIn / Facebook / Instagram / Google » pour que l’IA fouille là‑dedans de la même manière que la Bourse Alternance ou Adzuna : ces plateformes ne proposent pas ce type d’accès.

---

## Récap

| Plateforme | API pour chercher des offres ? | Utilisable dans l’app comme LBA/Adzuna ? |
|------------|--------------------------------|------------------------------------------|
| LinkedIn   | Non (pas d’API jobs publique)  | Non                                      |
| Facebook   | Non (pas d’API jobs pour tiers)| Non                                      |
| Instagram  | Non                            | Non                                      |
| Google     | Non (pas d’API Jobs publique)  | Non                                      |
| La Bonne Alternance | Oui (API publique)     | Oui (déjà intégré)                       |
| France Travail      | Oui (partenaire)       | Oui (si clés configurées)                |
| Adzuna              | Oui (gratuit)          | Oui (si clés configurées)                |

Pour vérifier ton env (sans y mettre tes vrais secrets), utilise le fichier **VERIF-ENV.md** et la checklist des variables.
