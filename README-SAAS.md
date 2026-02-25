# SaaS Recruteur - Documentation

## Vue d'ensemble

Plateforme SaaS complète pour les recruteurs permettant de :
- Générer automatiquement des quiz techniques personnalisés
- Analyser des CV via LLM
- Classer intelligemment les candidats selon leur pertinence
- Calculer des scores de pertinence configurables

## Architecture

### Base de données

Le schéma étendu (`supabase-schema-saas.sql`) ajoute :

1. **job_postings** - Postes à pourvoir
2. **candidates** - Candidats
3. **quizzes** - Quiz générés (QCM, ouvertes, cas pratiques)
4. **quiz_results** - Résultats des quiz
5. **relevance_scores** - Scores de pertinence calculés
6. **candidate_rankings** - Classements des candidats

### APIs Principales

#### `/api/recruiter/candidates`
- `POST` - Créer un candidat et analyser son CV automatiquement
- `GET` - Lister les candidats (avec filtres)

#### `/api/recruiter/job-postings`
- `POST` - Créer un poste
- `GET` - Lister les postes

#### `/api/recruiter/quizzes`
- `POST` - Générer un quiz personnalisé
  - Types supportés : `qcm`, `open`, `case-study`, `mixed`
- `GET` - Lister les quiz

#### `/api/recruiter/rankings`
- `POST` - Calculer et classer les candidats pour un poste
- `GET` - Récupérer le classement d'un poste

#### `/api/recruiter/relevance-score`
- `POST` - Calculer le score de pertinence d'un candidat

### Services

#### RankingService
Service de classement intelligent qui calcule les scores de pertinence basés sur :
- **Compétences** (35% par défaut) - Correspondance des compétences
- **Expérience** (25% par défaut) - Années d'expérience
- **Quiz** (25% par défaut) - Score au quiz technique
- **Qualité CV** (15% par défaut) - Score global du CV

Les pondérations sont configurables.

## Fonctionnalités

### 1. Générateur de Quiz IA

Génère automatiquement des quiz personnalisés selon le type demandé :

- **QCM** : Questions à choix multiples avec 4 options
- **Questions ouvertes** : Questions avec mots-clés attendus
- **Cas pratiques** : Mini-scénarios avec critères d'évaluation
- **Mixte** : Combinaison des trois formats

### 2. Analyse automatique de CV

Lors de l'upload d'un CV :
1. Extraction automatique du texte
2. Analyse via LLM (Groq)
3. Extraction des compétences, expérience, formation
4. Calcul du score de qualité
5. Suggestions d'amélioration

### 3. Classement intelligent

Le système classe automatiquement les candidats selon :
- Score de pertinence calculé
- Pondération configurable
- Mise à jour automatique lors de nouveaux résultats de quiz

### 4. Scoring de pertinence

Score global calculé à partir de :
- Correspondance des compétences
- Adéquation de l'expérience
- Performance au quiz
- Qualité du CV

## Installation

1. Appliquer le schéma de base de données :
```sql
-- Exécuter supabase-schema-saas.sql dans Supabase
```

2. Configurer les variables d'environnement :
```env
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. Démarrer l'application :
```bash
npm run dev
```

## Utilisation

### Créer un poste
```javascript
POST /api/recruiter/job-postings
{
  "title": "Développeur Full Stack",
  "description": "...",
  "required_skills": ["React", "Node.js", "PostgreSQL"],
  "required_experience": 3,
  "location": "Paris",
  "employment_type": "full-time"
}
```

### Ajouter un candidat
```javascript
POST /api/recruiter/candidates
FormData:
  - cv: File
  - email: "candidate@example.com"
  - firstName: "John"
  - lastName: "Doe"
  - jobPostingId: "uuid"
```

### Générer un quiz
```javascript
POST /api/recruiter/quizzes
{
  "jobPostingId": "uuid",
  "quizType": "mixed", // ou "qcm", "open", "case-study"
  "numQuestions": 10,
  "settings": {
    "timeLimit": 3600,
    "passingScore": 70
  }
}
```

### Classer les candidats
```javascript
POST /api/recruiter/rankings
{
  "jobPostingId": "uuid",
  "weights": {
    "skills": 0.4,
    "experience": 0.3,
    "quiz": 0.2,
    "cv_quality": 0.1
  }
}
```

## Roadmap

- [ ] Interface recruteur complète (React)
- [ ] Dashboard avec statistiques
- [ ] Export des résultats (PDF, Excel)
- [ ] Intégration email (invitations quiz)
- [ ] API webhooks pour intégrations
- [ ] Multi-tenant (équipes de recrutement)
- [ ] Analytics avancés

## Stack technique

- **Frontend** : Next.js 14, React, TailwindCSS
- **Backend** : Next.js API Routes
- **Base de données** : Supabase (PostgreSQL)
- **IA** : Groq (LLM)
- **Storage** : Supabase Storage

## Références

Inspiré de **Qwizly** - Plateforme de génération automatisée de quiz basée sur l'IA.
