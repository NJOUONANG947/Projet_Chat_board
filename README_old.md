# Projet Chat Web

Application de chat moderne et dynamique utilisant Next.js, Supabase, Tailwind CSS et Framer Motion avec authentification utilisateur.

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
- Authentification utilisateur avec Supabase Auth
- Stockage des conversations et messages par utilisateur
- Sécurité des données avec Row Level Security (RLS)

## Migration SQLite → Supabase

Cette extension migre l'application de SQLite vers Supabase pour un backend cloud sécurisé.

### Changements principaux :
- Remplacement Prisma + SQLite par Supabase (PostgreSQL)
- Ajout de l'authentification utilisateur
- Sécurisation des API routes
- Association des messages aux utilisateurs
- Suppression des dépendances locales (Prisma, SQLite)

### Méthodes d'authentification implémentées :
- Inscription et connexion par email/mot de passe
- Gestion des sessions utilisateur
- Protection des routes API

### Règles de sécurité :
- Utilisateurs ne peuvent accéder qu'à leurs propres conversations et messages
- Politiques RLS configurées sur les tables `conversations` et `messages`

## Structure des dossiers

- `frontend/`: Interface utilisateur
  - `components/`: Composants React (Chat.js, MessageBubble.js, TypingIndicator.js)
  - `hooks/`: Hooks React pour gérer l'état et les appels API (useChat.js)
  - `contexts/`: Contextes React (AuthContext.js)
  - `styles/`: Styles CSS (globals.css)
- `backend/`: Logique serveur
  - `services/`: Fonctions métier (chat.js)
  - `lib/`: Connexion Supabase (supabase.js)
- `app/`: Next.js App Router
  - `api/`: Routes API (/api/chat)
  - `auth/`: Pages d'authentification (login, signup)
  - `page.js`: Page principale (protégée)
- `supabase-schema.sql`: Script SQL pour créer les tables et politiques

## Technologies

- Next.js 14 (App Router)
- React
- Tailwind CSS
- Framer Motion
- Supabase (Auth + Database)
- Groq API (modèle llama-3.1-8b-instant)

## Fonctionnement

1. L'utilisateur s'inscrit/se connecte.
2. L'utilisateur écrit un message dans une conversation.
3. Le message est envoyé à /api/chat (POST) avec token d'authentification.
4. Le backend vérifie l'authentification, enregistre le message, appelle Groq API, enregistre la réponse, renvoie au frontend.
5. L'historique est affiché avec animations, filtré par utilisateur.

## Configuration Supabase

1. Créer un projet Supabase (https://supabase.com)
2. Aller dans Settings > API pour récupérer URL et clé anon
3. Exécuter le script `supabase-schema.sql` dans l'éditeur SQL de Supabase pour créer les tables et politiques

## Lancement

1. Installer les dépendances: `npm install`
2. Créer .env.local avec les variables d'environnement
3. Lancer en dev: `npm run dev`
4. Ouvrir http://localhost:3000

## Variables d'environnement

Créer un fichier `.env.local` avec :

```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
GROQ_API_KEY=votre_clé_api_groq
```

## Docker

`docker build -t chat-app .`
`docker run -p 3000:3000 -e NEXT_PUBLIC_SUPABASE_URL=... -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... -e GROQ_API_KEY=... chat-app`
