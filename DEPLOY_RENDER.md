# Déployer le projet sur Render

Guide étape par étape pour déployer cette application Next.js sur [Render](https://render.com).

---

## Prérequis

- Un compte [Render](https://render.com) (gratuit)
- Le code poussé sur **GitHub** (ou GitLab / Bitbucket)

---

## Étape 1 : Pousser le code sur GitHub

Si ce n’est pas déjà fait :

```bash
git init
git add .
git commit -m "Prepare deploy Render"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/TON-REPO.git
git push -u origin main
```

Remplace `TON-USERNAME/TON-REPO` par l’URL de ton dépôt.

---

## Étape 2 : Créer un Web Service sur Render

1. Va sur [dashboard.render.com](https://dashboard.render.com).
2. Clique sur **New +** → **Web Service**.
3. Connecte ton compte **GitHub** si ce n’est pas déjà fait, puis choisis le dépôt du projet (ex. `Projet chat`).
4. Clique sur **Connect**.

---

## Étape 3 : Configurer le service

Renseigne les champs suivants :

| Champ | Valeur |
|------|--------|
| **Name** | `projet-chat` (ou le nom que tu veux) |
| **Region** | Choisis la région la plus proche (ex. Frankfurt) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npx next start -p $PORT` |
| **Instance Type** | **Free** (pour commencer) |

Ne pas utiliser "Static Site" : l’app a des API routes (recruteur, candidats, quiz, etc.), il faut un **Web Service** Node.

---

## Étape 4 : Variables d’environnement

Dans la section **Environment Variables**, clique sur **Add Environment Variable** et ajoute **chaque** variable (comme dans ton `.env.local`) :

| Key | Value | Secret ? |
|-----|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Non |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Oui |
| `GROQ_API_KEY` | `gsk_...` | Oui |
| `RESEND_API_KEY` | `re_...` | Oui |
| `EMAIL_FROM` | `noreply@tondomaine.com` | Non |
| `NEXT_PUBLIC_BASE_URL` | *(à remplir après le 1er déploiement)* | Non |

- **Secret** = cocher pour les clés API (elles seront masquées).
- Pour `NEXT_PUBLIC_BASE_URL` : après le premier déploiement, Render te donne une URL du type `https://projet-chat-xxxx.onrender.com`. Remplace la valeur par cette URL et redéploie.

---

## Étape 5 : Lancer le déploiement

1. Clique sur **Create Web Service**.
2. Render va :
   - cloner le repo,
   - lancer `npm install && npm run build`,
   - lancer `npm start`.
3. Le premier déploiement peut prendre 5–10 minutes (plan gratuit).
4. Une fois terminé, le statut passe à **Live** et l’URL s’affiche en haut (ex. `https://projet-chat-xxxx.onrender.com`).

---

## Étape 6 : Mettre à jour l’URL de l’app

1. Copie l’URL fournie par Render (ex. `https://projet-chat-xxxx.onrender.com`).
2. Dans le dashboard Render : ton service → **Environment** → édite `NEXT_PUBLIC_BASE_URL` et colle cette URL (avec `https://`).
3. **Save Changes** : Render redéploie automatiquement. Les liens dans les emails (quiz, etc.) utiliseront alors la bonne URL.

---

## Étape 7 : Vérifier le site

- Ouvre l’URL du service.
- Teste la connexion, le dashboard recruteur, les candidats, l’envoi de quiz, etc.

---

## Déploiements suivants

À chaque `git push` sur la branche connectée (ex. `main`), Render redéploie automatiquement.

```bash
git add .
git commit -m "Description des changements"
git push
```

---

## Option : déploiement avec Blueprint

Le fichier `render.yaml` à la racine du projet permet de définir le service via un **Blueprint** :

1. Sur Render : **New +** → **Blueprint**.
2. Connecte le dépôt et sélectionne le repo.
3. Render lit `render.yaml` et crée le Web Service. Tu n’as plus qu’à ajouter les variables d’environnement dans l’interface (elles ne sont pas dans le fichier pour des raisons de sécurité).

---

## Dépannage

- **Build failed** : regarde les **Logs** du build sur Render. Souvent une dépendance ou une erreur de build ; corrige en local avec `npm run build` puis repousse.
- **Application Error** ou page blanche : consulte les **Logs** du service (onglet Logs). Vérifie que toutes les variables d’environnement sont définies et que `NEXT_PUBLIC_BASE_URL` est bien l’URL Render.
- **Plan Free** : le service peut se mettre en veille après ~15 min d’inactivité ; le premier chargement après veille peut prendre 30–60 secondes.

---

## Résumé des commandes Render

| Élément | Valeur |
|--------|--------|
| Type | Web Service (Node) |
| Build Command | `npm install && npm run build` |
| Start Command | `npx next start -p $PORT` |
| Plan | Free pour commencer |
