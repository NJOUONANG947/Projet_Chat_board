# 👁️ Guide : Prévisualisation des Quiz

## Fonctionnement

Quand un quiz est généré, il est automatiquement créé en mode **"Brouillon"** et s'ouvre dans une fenêtre de prévisualisation pour que le recruteur puisse le vérifier avant de l'envoyer aux candidats.

## Flux de travail

### 1. Génération du quiz

1. Allez dans **Dashboard Recruteur** → Onglet **"Quiz"**
2. Sélectionnez un poste
3. Choisissez le type de quiz (Mixte, QCM, Ouvertes, Cas pratiques)
4. Cliquez sur **"Générer quiz"**

### 2. Prévisualisation automatique

✅ **Le quiz s'ouvre automatiquement** dans une fenêtre de prévisualisation où vous pouvez :
- ✅ Voir toutes les questions
- ✅ Voir les bonnes réponses (marquées en vert)
- ✅ Naviguer entre les questions
- ✅ Voir les explications pour les QCM
- ✅ Voir les mots-clés attendus pour les questions ouvertes
- ✅ Voir les critères d'évaluation pour les cas pratiques

### 3. Actions possibles

Après avoir prévisualisé le quiz, vous avez 3 options :

#### ✅ Approuver et activer
- Cliquez sur **"✓ Approuver et activer"**
- Le quiz passe en mode **"Actif"**
- Il peut maintenant être envoyé aux candidats

#### ❌ Rejeter
- Cliquez sur **"Rejeter"**
- Le quiz est supprimé
- Vous pouvez en générer un nouveau

#### 🔙 Fermer
- Cliquez sur **"Fermer"** (X en haut à droite)
- Le quiz reste en mode **"Brouillon"**
- Vous pouvez le prévisualiser plus tard en cliquant sur **"👁️ Prévisualiser"** dans la liste

## Interface de prévisualisation

### Navigation
- **← Précédent** / **Suivant →** : Naviguer entre les questions
- **Mini-navigation** (en bas) : Cliquer sur un numéro pour aller directement à une question
- **Barre de progression** : Indique la position dans le quiz

### Affichage selon le type de question

#### QCM (Questions à choix multiples)
- ✅ La bonne réponse est **marquée en vert** avec un ✓
- 📝 Une explication est affichée si disponible
- Les autres options sont affichées en gris

#### Questions ouvertes
- 🔑 **Mots-clés attendus** affichés en badges bleus
- 📄 **Exemple de réponse** fourni si disponible

#### Cas pratiques
- 📋 **Contexte** détaillé affiché
- 🎯 **Approche attendue** expliquée
- ✅ **Critères d'évaluation** listés

## Statuts des quiz

### Brouillon (is_active: false)
- Quiz généré mais pas encore approuvé
- Badge jaune "Brouillon"
- Visible uniquement par le recruteur
- Peut être prévisualisé, approuvé ou rejeté

### Actif (is_active: true)
- Quiz approuvé par le recruteur
- Badge vert "Actif"
- Peut être envoyé aux candidats
- Les candidats peuvent le passer

## Exemple de workflow

```
1. Recruteur génère un quiz
   ↓
2. Quiz créé en mode "Brouillon"
   ↓
3. Prévisualisation s'ouvre automatiquement
   ↓
4. Recruteur vérifie les questions
   ↓
5. Deux options :
   ├─ Approuver → Quiz devient "Actif" → Peut être envoyé
   └─ Rejeter → Quiz supprimé → Générer un nouveau
```

## Conseils

- ✅ **Vérifiez toujours** les questions avant d'approuver
- ✅ **Testez la difficulté** - assurez-vous qu'elle correspond au niveau du poste
- ✅ **Vérifiez les bonnes réponses** - elles doivent être correctes
- ✅ **Pour les questions ouvertes** - vérifiez que les mots-clés sont pertinents
- ✅ **Pour les cas pratiques** - vérifiez que les critères d'évaluation sont clairs

## Réouverture de la prévisualisation

Si vous avez fermé la prévisualisation sans approuver :
1. Allez dans la liste des quiz
2. Trouvez le quiz avec le badge "Brouillon"
3. Cliquez sur **"👁️ Prévisualiser"**
4. La prévisualisation s'ouvre à nouveau

## API

Les quiz sont créés avec `is_active: false` par défaut.

Pour activer un quiz :
```http
PATCH /api/recruiter/quizzes/[id]
{
  "is_active": true
}
```

Pour supprimer un quiz :
```http
DELETE /api/recruiter/quizzes/[id]
```
