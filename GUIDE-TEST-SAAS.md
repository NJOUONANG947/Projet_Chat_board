# 🧪 Guide de Test - SaaS Recruteur

## Prérequis

1. ✅ Schéma SQL appliqué dans Supabase
2. ✅ Variables d'environnement configurées (`.env.local`)
3. ✅ Application démarrée (`npm run dev`)

## Tests à effectuer

### 1. Test de création d'un poste

#### Via l'interface (Recommandé)

1. Ouvrez votre application dans le navigateur
2. Connectez-vous
3. Accédez au Dashboard Recruteur
4. Onglet "Postes"
5. Cliquez sur "+ Nouveau poste"
6. Remplissez le formulaire :
   - Titre : "Développeur Full Stack"
   - Description : "Recherche développeur React/Node.js avec 3 ans d'expérience"
   - Compétences : "React, Node.js, PostgreSQL, TypeScript"
   - Expérience : 3
   - Type : Temps plein
7. Cliquez sur "Créer"

**Résultat attendu** : Le poste apparaît dans la liste

#### Via API (Postman/Thunder Client)

```http
POST http://localhost:3000/api/recruiter/job-postings
Content-Type: application/json
Cookie: votre-session-cookie

{
  "title": "Développeur Full Stack",
  "description": "Recherche développeur React/Node.js avec 3 ans d'expérience minimum",
  "required_skills": ["React", "Node.js", "PostgreSQL", "TypeScript"],
  "required_experience": 3,
  "location": "Paris",
  "employment_type": "full-time",
  "status": "open"
}
```

**Résultat attendu** : 
```json
{
  "jobPosting": {
    "id": "uuid",
    "title": "Développeur Full Stack",
    ...
  }
}
```

---

### 2. Test d'ajout d'un candidat avec analyse CV

#### Via l'interface

1. Onglet "Candidats"
2. Cliquez sur "+ Ajouter candidat"
3. Remplissez :
   - Email : "candidat@example.com"
   - Prénom : "Jean"
   - Nom : "Dupont"
   - Sélectionnez le poste créé précédemment
   - Uploadez un fichier CV (PDF ou DOCX)
4. Cliquez sur "Ajouter et analyser"

**Résultat attendu** :
- Le candidat est créé
- Le CV est analysé automatiquement
- Un score de qualité est affiché
- Les compétences sont extraites

#### Via API

```http
POST http://localhost:3000/api/recruiter/candidates
Content-Type: multipart/form-data
Cookie: votre-session-cookie

FormData:
- email: "candidat@example.com"
- firstName: "Jean"
- lastName: "Dupont"
- jobPostingId: "uuid-du-poste"
- cv: [fichier PDF]
```

**Résultat attendu** :
```json
{
  "candidate": {
    "id": "uuid",
    "email": "candidat@example.com",
    ...
  },
  "analysis": {
    "overall_score": 75,
    "strengths": [...],
    "key_skills_detected": ["React", "Node.js", ...],
    ...
  }
}
```

---

### 3. Test de génération d'un quiz

#### Via l'interface

1. Onglet "Quiz"
2. Sélectionnez un poste dans le menu déroulant
3. Choisissez le type de quiz :
   - Mixte (recommandé)
   - QCM uniquement
   - Questions ouvertes
   - Cas pratiques
4. Cliquez sur "Générer quiz"

**Résultat attendu** :
- Un quiz est généré avec 10 questions
- Les questions sont adaptées au poste
- Le format correspond au type choisi

#### Via API

```http
POST http://localhost:3000/api/recruiter/quizzes
Content-Type: application/json
Cookie: votre-session-cookie

{
  "jobPostingId": "uuid-du-poste",
  "quizType": "mixed",
  "numQuestions": 10,
  "settings": {
    "timeLimit": 3600,
    "passingScore": 70
  }
}
```

**Résultat attendu** :
```json
{
  "quiz": {
    "id": "uuid",
    "title": "Quiz - Développeur Full Stack",
    "quiz_type": "mixed",
    "questions": [
      {
        "question": "...",
        "type": "qcm",
        "options": [...],
        "correct_answer": 0
      },
      ...
    ]
  }
}
```

---

### 4. Test de classement des candidats

#### Via l'interface

1. Onglet "Classements"
2. Sélectionnez un poste
3. Cliquez sur "Classer candidats"

**Résultat attendu** :
- Les candidats sont classés par score de pertinence
- Le classement affiche :
  - Position (1, 2, 3...)
  - Score global
  - Détail des scores (compétences, expérience, quiz, qualité CV)

#### Via API

```http
POST http://localhost:3000/api/recruiter/rankings
Content-Type: application/json
Cookie: votre-session-cookie

{
  "jobPostingId": "uuid-du-poste",
  "weights": {
    "skills": 0.4,
    "experience": 0.3,
    "quiz": 0.2,
    "cv_quality": 0.1
  }
}
```

**Résultat attendu** :
```json
{
  "rankings": [
    {
      "rank": 1,
      "candidate_id": "uuid",
      "overall_score": 85.5,
      "breakdown": {
        "skills": { "score": 90, "weight": 0.4 },
        "experience": { "score": 80, "weight": 0.3 },
        ...
      }
    },
    ...
  ]
}
```

---

### 5. Test de calcul de score de pertinence

#### Via API

```http
POST http://localhost:3000/api/recruiter/relevance-score
Content-Type: application/json
Cookie: votre-session-cookie

{
  "candidateId": "uuid-candidat",
  "jobPostingId": "uuid-poste",
  "weights": {
    "skills": 0.35,
    "experience": 0.25,
    "quiz": 0.25,
    "cv_quality": 0.15
  }
}
```

**Résultat attendu** :
```json
{
  "score": {
    "overall_score": 82.5,
    "skills_score": 90,
    "experience_score": 80,
    "quiz_score": 75,
    "cv_quality_score": 85,
    "breakdown": {...}
  }
}
```

---

## Scénario de test complet

### Étape 1 : Créer un poste
```bash
# Créez un poste "Développeur React" via l'interface ou l'API
```

### Étape 2 : Ajouter 3 candidats
```bash
# Candidat 1 : CV avec React, Node.js, 4 ans d'expérience
# Candidat 2 : CV avec Vue.js, Python, 2 ans d'expérience  
# Candidat 3 : CV avec React, TypeScript, 5 ans d'expérience
```

### Étape 3 : Générer un quiz
```bash
# Générez un quiz mixte pour le poste
```

### Étape 4 : Simuler des résultats de quiz
```bash
# Via l'API ou manuellement dans la base de données
# Candidat 1 : Score 85/100
# Candidat 2 : Score 60/100
# Candidat 3 : Score 90/100
```

### Étape 5 : Classer les candidats
```bash
# Lancez le classement automatique
# Vérifiez que le classement est cohérent avec les scores
```

**Résultat attendu** :
- Candidat 3 en première position (meilleur score quiz + expérience)
- Candidat 1 en deuxième position
- Candidat 2 en troisième position

---

## Tests de validation

### ✅ Vérifications à faire

1. **Base de données**
   - Les tables sont créées
   - Les données sont sauvegardées correctement
   - Les relations fonctionnent (foreign keys)

2. **APIs**
   - Toutes les routes répondent
   - Les erreurs sont gérées correctement
   - L'authentification fonctionne

3. **Interface**
   - Le dashboard s'affiche
   - Les formulaires fonctionnent
   - Les données sont affichées correctement

4. **Fonctionnalités IA**
   - L'analyse de CV fonctionne
   - La génération de quiz fonctionne
   - Les scores sont calculés correctement

---

## Commandes de test rapide

### Test avec curl (si vous avez les cookies)

```bash
# Créer un poste
curl -X POST http://localhost:3000/api/recruiter/job-postings \
  -H "Content-Type: application/json" \
  -H "Cookie: votre-cookie" \
  -d '{"title":"Test Poste","description":"Description test","required_skills":["React"]}'

# Lister les postes
curl http://localhost:3000/api/recruiter/job-postings \
  -H "Cookie: votre-cookie"

# Lister les candidats
curl http://localhost:3000/api/recruiter/candidates \
  -H "Cookie: votre-cookie"
```

---

## Dépannage

### Erreur : "Non autorisé"
→ Vérifiez que vous êtes connecté et que le cookie de session est valide

### Erreur : "Poste non trouvé"
→ Vérifiez que l'ID du poste est correct dans Supabase Table Editor

### Erreur : "GROQ_API_KEY not found"
→ Vérifiez votre `.env.local` et redémarrez le serveur

### Les quiz ne se génèrent pas
→ Vérifiez que :
- La clé API Groq est valide
- Le poste a une description suffisante
- Les logs du serveur pour voir l'erreur exacte

---

## Checklist de test

- [ ] Créer un poste
- [ ] Ajouter un candidat avec CV
- [ ] Vérifier l'analyse automatique du CV
- [ ] Générer un quiz (type mixte)
- [ ] Générer un quiz (type QCM)
- [ ] Générer un quiz (type ouvert)
- [ ] Générer un quiz (type cas pratique)
- [ ] Calculer un score de pertinence
- [ ] Classer les candidats
- [ ] Vérifier le classement dans l'interface
- [ ] Tester avec plusieurs candidats
- [ ] Vérifier les pondérations personnalisées

---

## Prochaines étapes après les tests

Une fois les tests validés :
1. Intégrer le dashboard dans votre application principale
2. Ajouter des fonctionnalités supplémentaires (export, analytics)
3. Personnaliser l'interface selon vos besoins
4. Déployer en production
