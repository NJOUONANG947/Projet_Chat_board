# Assistant CV IA - Application Complète de Gestion de Carrière

Application moderne d'assistance à la carrière utilisant l'IA, avec analyse de CV, génération de lettres de motivation, suivi des candidatures et chat intelligent. Développée avec Next.js, Supabase, Tailwind CSS et Framer Motion.

## 🚀 Fonctionnalités Principales

### 🤖 Chat IA Intelligent
- Interface de chat moderne avec thème professionnel gris/bleu
- Animations 3D immersives avec effets de perspective
- Stockage des conversations par utilisateur
- Authentification sécurisée avec Supabase

### 📄 Gestion de Documents
- Upload et analyse de CV (PDF, DOCX, TXT)
- Comparaison automatique CV vs offres d'emploi
- Analyse IA des compétences et compatibilité
- Génération automatique de lettres de motivation personnalisées

### 🎯 Suivi des Candidatures
- Tableau de bord des applications en cours
- Suivi des statuts (En attente, Entretien, Accepté, Refusé)
- Analytics et statistiques des candidatures
- Export des données en CSV

### 📊 Analytics et Insights
- Tableaux de bord interactifs
- Statistiques des candidatures par période
- Analyse des tendances de succès
- Visualisations avec graphiques

### 🔧 Outils de Carrière
- Générateur de CV assisté par IA
- Analyse des compétences et suggestions d'amélioration
- Recommandations de postes adaptés
- Conseils personnalisés de carrière

## 🛠️ Technologies Utilisées

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentification**: Supabase Auth avec Row Level Security
- **IA**: Groq API (modèle llama-3.1-8b-instant)
- **Stockage**: Supabase Storage pour les documents
- **Déploiement**: Docker, Docker Compose

## 📁 Structure du Projet

```
├── app/                    # Next.js App Router
│   ├── api/               # Routes API
│   │   ├── chat/          # API chat IA
│   │   ├── career/        # API génération CV
│   │   ├── upload/        # API upload documents
│   │   ├── analyze/       # API analyse documents
│   │   ├── applications/  # API suivi candidatures
│   │   └── analytics/     # API statistiques
│   ├── auth/              # Pages authentification
│   └── page.js            # Page principale
├── frontend/              # Composants frontend
│   ├── components/        # Composants React
│   ├── hooks/            # Hooks personnalisés
│   ├── contexts/         # Contextes React
│   └── styles/           # Styles CSS
├── backend/               # Logique serveur
│   ├── services/         # Services métier
│   └── lib/              # Utilitaires (Supabase, auth)
├── supabase-schema.sql   # Schéma base de données
└── docker-compose.yml    # Configuration déploiement
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Docker (optionnel)
- Compte Supabase

### Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd projet-chat
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration Supabase**
   - Créer un projet sur [supabase.com](https://supabase.com)
   - Exécuter le script `supabase-schema.sql` dans l'éditeur SQL
   - Récupérer les clés API dans Settings > API

4. **Variables d'environnement**
   Créer un fichier `.env.local` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
   SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role
   GROQ_API_KEY=votre_clé_groq
   ```

5. **Lancement en développement**
   ```bash
   npm run dev
   ```
   Ouvrir [http://localhost:3000](http://localhost:3000)

## 🐳 Déploiement avec Docker

### Build et run avec Docker
```bash
# Build de l'image
docker build -t cv-assistant .

# Run du container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -e GROQ_API_KEY=... \
  cv-assistant
```

### Avec Docker Compose
```bash
# Configuration des variables dans .env
cp .env.example .env

# Lancement
docker-compose up -d
```

## 🔒 Sécurité

- **Authentification**: Supabase Auth avec JWT
- **Autorisation**: Row Level Security (RLS) activé
- **Chiffrement**: Données sensibles chiffrées
- **Validation**: Sanitisation des inputs utilisateur
- **Rate limiting**: Protection contre les abus

## 📊 Base de Données

Le schéma inclut :
- `profiles`: Profils utilisateurs
- `conversations`: Conversations de chat
- `messages`: Messages des conversations
- `documents`: Documents uploadés (CV, offres)
- `applications`: Suivi des candidatures
- `career_profiles`: Profils carrière générés

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence ISC.

## 📞 Support

Pour toute question ou problème, ouvrir une issue sur GitHub.
