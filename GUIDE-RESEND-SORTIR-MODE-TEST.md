# 📧 Quitter le mode test Resend – Guide étape par étape

Ce guide vous permet d’**envoyer des emails aux recruteurs et aux candidats** (et plus seulement à votre propre adresse) en vérifiant un domaine sur Resend.

---

## Étape 1 : Connexion à Resend

1. Ouvrez votre navigateur et allez sur **https://resend.com**
2. **Connectez-vous** à votre compte Resend (ou créez-en un si besoin)
3. Une fois connecté, allez sur **https://resend.com/domains**

---

## Étape 2 : Ajouter votre domaine

1. Sur la page **Domains**, cliquez sur le bouton **« Add Domain »** (ou « Ajouter un domaine »)
2. Dans le champ prévu, saisissez **votre nom de domaine** :
   - Exemples : `mondomaine.com`, `careerai.fr`, `monsite.net`
   - **Ne mettez pas** `www` devant : entrez `mondomaine.com` et non `www.mondomaine.com`
3. Validez (bouton **Add** / **Ajouter**)

---

## Étape 3 : Récupérer les enregistrements DNS

Après l’ajout du domaine, Resend affiche une liste d’**enregistrements DNS** à créer.

1. **Notez** ou gardez la page ouverte : vous verrez en général :
   - Un enregistrement de type **MX** (pour recevoir les bounces)
   - Un enregistrement **TXT** (souvent nommé `resend._domainkey`) pour la signature DKIM
2. Resend affiche pour chaque ligne :
   - **Type** (MX, TXT, etc.)
   - **Name** (nom / sous-domaine)
   - **Value** (valeur à coller)
   - Parfois un **Priority** pour les MX

Exemple typique :

| Type | Name           | Value                    |
|------|----------------|--------------------------|
| MX    | (vide ou @)    | `feedback-smtp.resend.com` |
| TXT   | `resend._domainkey` | `p=MIGfMA0GCS...` (longue chaîne) |

---

## Étape 4 : Configurer les DNS chez votre hébergeur de domaine

Vous devez **créer ces enregistrements** là où votre domaine est géré (où vous avez acheté le domaine : OVH, Gandi, Cloudflare, etc.).

### 4.1 Trouver où gérer votre domaine

- Vous avez acheté le domaine chez **OVH** → espace client OVH → **Web Cloud** → **Noms de domaine**
- **Gandi** → tableau de bord → **Domaines**
- **Cloudflare** → **Websites** → votre domaine → **DNS**
- **Google Domains** / **Squarespace** → paramètres DNS du domaine
- Autre hébergeur : cherchez « DNS », « Zone DNS » ou « Gestion du domaine »

### 4.2 Créer l’enregistrement MX

1. Dans la gestion DNS de votre hébergeur, cliquez sur **Ajouter un enregistrement** (ou **Add record**)
2. Choisissez le type **MX**
3. Renseignez exactement comme indiqué par Resend :
   - **Nom / Host** : souvent `@` ou vide (pour le domaine principal)
   - **Valeur / Pointeur** : `feedback-smtp.resend.com`
   - **Priorité** : la valeur indiquée par Resend (souvent `10`)
4. Enregistrez

### 4.3 Créer l’enregistrement TXT (DKIM)

1. Ajoutez un **nouvel enregistrement**
2. Type : **TXT**
3. Renseignez comme sur Resend :
   - **Nom / Host** : `resend._domainkey` (parfois l’interface ajoute déjà le domaine à droite, donc seulement `resend._domainkey` à gauche)
   - **Valeur** : copiez-collez **toute** la chaîne fournie par Resend (souvent très longue)
4. Enregistrez

### 4.4 Vérifier (optionnel)

- Certains hébergeurs proposent un **enregistrement SPF**. Si Resend en affiche un, ajoutez-le de la même façon (type TXT, nom et valeur indiqués).

---

## Étape 5 : Attendre la propagation DNS

Les DNS peuvent mettre **quelques minutes à 48 h** à se mettre à jour.

1. Resend propose souvent un bouton **« Verify »** (Vérifier) sur la page du domaine
2. Cliquez sur **Verify**
3. Si ce n’est pas encore bon, Resend indiquera quels enregistrements manquent ou sont incorrects
4. **Réessayez** après 15–30 minutes si la vérification échoue la première fois

Quand la vérification est **verte / réussie**, vous pouvez passer à l’étape suivante.

---

## Étape 6 : Choisir l’adresse expéditrice

Une fois le domaine vérifié, vous pouvez envoyer des emails **depuis** une adresse de ce domaine.

1. Choisissez une adresse courante pour les envois automatiques, par exemple :
   - `noreply@votredomaine.com`
   - `contact@votredomaine.com`
   - `careerai@votredomaine.com`
2. Vous n’avez **pas besoin** de créer une vraie boîte email : Resend envoie directement avec cette adresse tant que le domaine est vérifié.

---

## Étape 7 : Modifier le fichier `.env.local`

1. À la **racine** de votre projet (même dossier que `package.json`), ouvrez le fichier **`.env.local`**
2. **Ajoutez** ou **remplacez** la ligne d’expéditeur avec **votre domaine** :

   **Option A – avec un libellé :**
   ```env
   RESEND_FROM_EMAIL=CareerAI <noreply@votredomaine.com>
   ```

   **Option B – adresse seule :**
   ```env
   EMAIL_FROM=noreply@votredomaine.com
   ```

   Remplacez **`votredomaine.com`** par votre vrai domaine et **`noreply`** par la partie avant `@` que vous avez choisie.

3. Vous pouvez **commenter** ou supprimer l’ancienne ligne de test :
   ```env
   # EMAIL_FROM=onboarding@resend.dev
   ```
4. **Enregistrez** le fichier

Exemple complet dans `.env.local` :

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=CareerAI <noreply@mondomaine.com>
NEXT_PUBLIC_BASE_URL=https://mondomaine.com
```

---

## Étape 8 : Redémarrer l’application

Pour que les nouvelles variables soient prises en compte :

1. **Arrêtez** le serveur (dans le terminal : `Ctrl+C`)
2. **Relancez** :
   ```bash
   npm run dev
   ```
   (ou la commande que vous utilisez en production)

---

## Vérifier que tout fonctionne

1. **Test manuel** :  
   Ouvrez dans le navigateur (en étant en dev) :  
   `http://localhost:3000/api/test-email?to=un-ami@example.com`  
   (remplacez par une vraie adresse différente de la vôtre).  
   Si l’email arrive chez ce destinataire, vous avez bien quitté le mode test.

2. **Quiz** : envoyez un quiz à un candidat ; il doit recevoir le lien sur son email.

3. **Campagnes** : lancez une campagne ; les recruteurs dont l’email est renseigné doivent recevoir la candidature.

---

## En cas de problème

| Problème | Piste de solution |
|----------|--------------------|
| « Domain not verified » | Vérifier que les enregistrements MX et TXT sont exactement comme sur Resend ; attendre la propagation DNS (jusqu’à 48 h). |
| « Invalid from address » | Vérifier que l’adresse dans `RESEND_FROM_EMAIL` / `EMAIL_FROM` est bien `quelquechose@votredomaine.com` (domaine vérifié). |
| Emails toujours pas reçus | Vérifier les dossiers **Spam** ; consulter l’onglet **Emails** sur https://resend.com/emails pour voir le statut d’envoi. |

---

## Résumé rapide

1. Aller sur **https://resend.com/domains** et ajouter le domaine.
2. Créer les enregistrements **MX** et **TXT** (DKIM) chez l’hébergeur du domaine.
3. Cliquer sur **Verify** dans Resend et attendre que le domaine soit vérifié.
4. Dans **`.env.local`**, mettre `RESEND_FROM_EMAIL=CareerAI <noreply@votredomaine.com>` (ou `EMAIL_FROM=...`) avec votre domaine.
5. Redémarrer l’application.

Après ça, vous avez quitté le mode test et les envois vers les recruteurs et candidats peuvent partir normalement.
