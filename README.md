# Projet Chat Web

Application de chat moderne et dynamique utilisant Next.js, JavaScript, SQLite, Tailwind CSS et Framer Motion.

## Fonctionnalités

- Interface responsive moderne avec thème gris et bleu professionnel
- Design 3D immersif avec effets de perspective et profondeur
- Animations d'entrée 3D des messages (slide up + fade-in + rotation)
- Indicateur de frappe 3D avec points rebondissants et effets de profondeur
- Auto-scroll fluide vers le bas
- Barre latérale responsive (masquée sur mobile, overlay sur tablette)
- Bouton "Nouvelle Discussion" avec effets 3D au survol (rotation + brillance)
- Composants React modulaires avec effets de perspective 3D
- Ombres et profondeurs réalistes pour un rendu immersif
- Optimisé pour mobile, tablette et desktop

## Structure des dossiers

- `frontend/`: Interface utilisateur
  - `components/`: Composants React (Chat.js, MessageBubble.js, TypingIndicator.js)
  - `hooks/`: Hooks React pour gérer l'état et les appels API (useChat.js)
  - `styles/`: Styles CSS (globals.css)
- `backend/`: Logique serveur
  - `services/`: Fonctions métier (chat.js)
  - `lib/`: Connexion DB (db.js)
  - `prisma/`: Schéma Prisma
- `app/`: Next.js App Router
  - `api/`: Routes API (/api/chat)
  - `page.js`: Page principale
- `data/`: Base de données SQLite

## Technologies

- Next.js 14 (App Router)
- React
- Tailwind CSS
- Framer Motion
- Prisma + SQLite
- Groq API (modèle llama-3.1-8b-instant)

## Fonctionnement

1. L'utilisateur écrit un message.
2. Le message est envoyé à /api/chat (POST).
3. Le backend enregistre le message, appelle Groq API, enregistre la réponse, renvoie au frontend.
4. L'historique est affiché avec animations.

## Lancement

1. Installer les dépendances: `npm install`
2. Générer Prisma: `npm run db:generate`
3. Pousser la DB: `npm run db:push`
4. Créer .env.local avec GROQ_API_KEY
5. Lancer en dev: `npm run dev`
6. Ouvrir http://localhost:3000

## Variables d'environnement

Créer un fichier `.env.local` avec :

```
GROQ_API_KEY=votre_clé_api_groq
```

## Docker

`docker build -t chat-app .`
`docker run -p 3000:3000 -e GROQ_API_KEY=votre_clé chat-app`
