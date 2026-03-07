# Comment vérifier que les envois automatiques ont bien été envoyés

L’application envoie les candidatures via Puppeteer (remplissage du formulaire + clic sur « Postuler »). Voici **3 façons** de vérifier que la candidature est bien partie.

---

## 1. Dans l’interface (Mes campagnes)

Après avoir cliqué sur **« Lancer l’envoi maintenant »** :

- Le bloc **« Résultat du dernier envoi »** affiche le message récapitulatif.
- La section **« Envois automatiques (Puppeteer) »** liste chaque tentative :
  - **✓ Envoyé** = le formulaire a été soumis (bouton cliqué).
  - **Confirmée par la plateforme** = la page affichait un message de type « Candidature envoyée » / « Merci » après le clic → forte probabilité que la candidature soit bien partie.
  - **✗ Échec** = erreur (pas de formulaire, pas de Chrome, etc.) ; le message d’erreur est affiché.

Si tu vois **✓ Envoyé** et **Confirmée par la plateforme** pour une offre, tu peux considérer que l’envoi a bien eu lieu.

---

## 2. Logs Render (technique)

Sur [Render](https://dashboard.render.com) → ton service → **Logs** :

- **`[applyWithBrowser] confirmation détectée (candidature bien partie)`**  
  → La page après soumission contenait un texte de confirmation (ex. « candidature envoyée », « merci »). L’envoi est considéré comme confirmé.

- **`[applyWithBrowser] bouton cliqué mais aucune page de confirmation détectée`**  
  → Le formulaire a été soumis mais la page n’a pas affiché de message de confirmation typique. À vérifier par email ou sur le site de l’annonceur.

- **`[applyWithBrowser] formulaire soumis`** avec **`verified: true`**  
  → Même sens que « confirmation détectée ».

---

## 3. Boîte mail + site de l’annonceur

- **Email** (celui renseigné dans ton profil) : beaucoup de plateformes envoient un mail du type « Nous avons bien reçu votre candidature » ou « Confirmation de candidature ». Vérifie les spams/courrier indésirable.

- **Site de l’annonceur** : pour une offre précise (ex. 2i Academy), va sur **leur** site, connecte-toi avec le **même email** que dans ton profil, et regarde s’ils ont une rubrique **« Mes candidatures »**, **« Mon compte »** ou **« Mes demandes »**.

---

## Rappel

**Adzuna** est un agrégateur : il n’a en général **pas** d’espace « Mes candidatures ». Le suivi se fait sur le **site de l’entreprise** qui a publié l’offre (ex. 2i Academy) et/ou par **email de confirmation**.
