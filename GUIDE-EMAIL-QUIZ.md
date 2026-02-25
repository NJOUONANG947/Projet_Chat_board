# 📧 Guide : Envoi de Quiz par Email

## Fonctionnement

Le système permet d'envoyer des quiz aux candidats par email en temps réel. Le candidat reçoit un lien unique pour répondre au quiz, et le recruteur est notifié quand le quiz est complété.

## Configuration requise

### Option 1 : Resend (Recommandé)

1. Créez un compte sur [resend.com](https://resend.com)
2. Obtenez votre clé API
3. Ajoutez dans `.env.local` :
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@votredomaine.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # ou votre URL de production
```

4. Installez Resend :
```bash
npm install resend
```

### Option 2 : Autre service d'email

Modifiez la fonction `sendQuizEmail` dans `app/api/recruiter/quizzes/[id]/send/route.js` pour utiliser votre service (SendGrid, Mailgun, etc.)

### Option 3 : Mode développement (simulation)

En développement, les emails sont simulés dans la console. Les liens sont générés et peuvent être copiés manuellement.

## Flux complet

### 1. Le recruteur génère et approuve un quiz

1. Dashboard Recruteur → Onglet "Quiz"
2. Générer un quiz
3. Prévisualiser et approuver

### 2. Le recruteur envoie le quiz au candidat

1. Dans la liste des quiz, cliquer sur **"📧 Envoyer"** (visible uniquement pour les quiz actifs)
2. Sélectionner un candidat dans le modal
3. Cliquer sur **"Envoyer"**

**Ce qui se passe :**
- ✅ Un email est envoyé au candidat avec un lien unique
- ✅ Un `quiz_result` est créé avec status "sent"
- ✅ Le recruteur voit le statut dans son dashboard

### 3. Le candidat reçoit l'email

L'email contient :
- 📧 Un message personnalisé
- 🔗 Un lien unique vers le quiz
- 📋 Les informations sur le poste

### 4. Le candidat répond au quiz

1. Le candidat clique sur le lien dans l'email
2. Il accède à la page `/quiz/[token]`
3. Il répond aux questions :
   - **QCM** : Sélection d'une option
   - **Questions ouvertes** : Texte libre
   - **Cas pratiques** : Description de l'approche
4. Il soumet le quiz

### 5. Le recruteur est notifié

- ✅ Un email de notification est envoyé au recruteur
- ✅ Le score est calculé automatiquement (pour les QCM)
- ✅ Les réponses sont sauvegardées dans `quiz_results`
- ✅ Le score de pertinence peut être recalculé

## Structure des données

### Quiz Result

```json
{
  "id": "uuid",
  "quiz_id": "uuid",
  "candidate_id": "uuid",
  "recruiter_id": "uuid",
  "score": 85.5,
  "total_questions": 10,
  "correct_answers": 8,
  "answers": {
    "0": {
      "question": "...",
      "type": "qcm",
      "userAnswer": 2,
      "correct": true
    },
    "1": {
      "question": "...",
      "type": "open",
      "userAnswer": "Réponse du candidat..."
    }
  },
  "time_taken": 450,
  "completed_at": "2024-01-15T10:30:00Z"
}
```

## APIs créées

### POST `/api/recruiter/quizzes/[id]/send`
Envoie un quiz à un candidat par email

### GET `/api/candidate/quiz/[token]`
Récupère un quiz par token (route publique)

### POST `/api/candidate/quiz/[token]/submit`
Soumet les réponses d'un candidat

## Sécurité

- ✅ Les liens sont uniques et contiennent un token
- ✅ Un quiz ne peut être complété qu'une seule fois
- ✅ Les quiz doivent être actifs pour être envoyés
- ✅ Seul le recruteur propriétaire peut envoyer ses quiz

## Test en développement

Sans configuration d'email, le système simule l'envoi et affiche le lien dans la console :

```
📧 Email simulation:
{
  to: "candidat@example.com",
  subject: "Quiz technique - Développeur Full Stack",
  link: "http://localhost:3000/quiz/quizId-candidateId-timestamp-random"
}
```

Vous pouvez copier ce lien et l'ouvrir dans le navigateur pour tester.

## Interface candidat

L'interface candidat (`QuizCandidateViewer`) permet :
- ✅ Navigation entre les questions
- ✅ Réponses selon le type (QCM, ouvertes, cas pratiques)
- ✅ Suivi du temps passé
- ✅ Mini-navigation pour voir les questions répondues
- ✅ Soumission sécurisée

## Prochaines étapes

1. **Configurer Resend** pour l'envoi d'emails en production
2. **Personnaliser les templates d'email** selon vos besoins
3. **Ajouter des notifications push** pour le recruteur
4. **Créer un dashboard de résultats** pour voir toutes les réponses
