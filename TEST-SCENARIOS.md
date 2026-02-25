# 📋 Scénarios de Test - SaaS Recruteur

## Scénario 1 : Flux complet de recrutement

### Objectif
Tester le flux complet depuis la création d'un poste jusqu'au classement des candidats.

### Étapes

1. **Créer un poste**
   ```
   Titre: Développeur React Senior
   Description: Recherche développeur React avec 5 ans d'expérience
   Compétences: React, TypeScript, Redux, Jest
   Expérience: 5 ans
   ```

2. **Ajouter 3 candidats**
   - **Candidat A** : CV avec React (7 ans), TypeScript, Redux → Score CV: 90
   - **Candidat B** : CV avec Vue.js (3 ans), JavaScript → Score CV: 65
   - **Candidat C** : CV avec React (4 ans), TypeScript → Score CV: 80

3. **Générer un quiz**
   - Type: Mixte
   - 10 questions
   - Adapté au poste React

4. **Simuler les résultats de quiz**
   - Candidat A : 95/100
   - Candidat B : 55/100
   - Candidat C : 85/100

5. **Classer les candidats**
   - Pondération par défaut
   - Vérifier le classement

### Résultat attendu
1. Candidat A (meilleur score global)
2. Candidat C
3. Candidat B

---

## Scénario 2 : Test des différents types de quiz

### Objectif
Vérifier que tous les types de quiz sont générés correctement.

### Étapes

1. Créer un poste "Data Scientist"

2. Générer 4 quiz différents :
   - **Quiz 1** : Type QCM uniquement
   - **Quiz 2** : Type Questions ouvertes
   - **Quiz 3** : Type Cas pratiques
   - **Quiz 4** : Type Mixte

3. Vérifier chaque quiz :
   - Structure des questions
   - Format des réponses
   - Présence des champs requis

### Résultat attendu
- QCM : Toutes les questions ont `type: "qcm"` avec `options` et `correct_answer`
- Ouvertes : Toutes les questions ont `type: "open"` avec `expected_keywords`
- Cas pratiques : Toutes les questions ont `type: "case-study"` avec `context` et `evaluation_criteria`
- Mixte : Mélange des 3 types

---

## Scénario 3 : Test des pondérations personnalisées

### Objectif
Vérifier que les scores de pertinence changent selon les pondérations.

### Étapes

1. Créer un poste et ajouter 2 candidats :
   - **Candidat X** : Excellentes compétences (95), Expérience moyenne (60), Quiz moyen (70)
   - **Candidat Y** : Compétences moyennes (70), Expérience excellente (95), Quiz excellent (95)

2. Calculer les scores avec 3 configurations différentes :

   **Configuration A** (Compétences prioritaires) :
   ```json
   {
     "skills": 0.5,
     "experience": 0.2,
     "quiz": 0.2,
     "cv_quality": 0.1
   }
   ```
   → Candidat X devrait être mieux classé

   **Configuration B** (Expérience prioritaire) :
   ```json
   {
     "skills": 0.2,
     "experience": 0.5,
     "quiz": 0.2,
     "cv_quality": 0.1
   }
   ```
   → Candidat Y devrait être mieux classé

   **Configuration C** (Quiz prioritaire) :
   ```json
   {
     "skills": 0.2,
     "experience": 0.2,
     "quiz": 0.5,
     "cv_quality": 0.1
   }
   ```
   → Candidat Y devrait être mieux classé

### Résultat attendu
Les classements changent selon les pondérations, reflétant les priorités du recruteur.

---

## Scénario 4 : Test de l'analyse automatique de CV

### Objectif
Vérifier que l'analyse de CV fonctionne correctement.

### Étapes

1. Préparer 3 CV différents :
   - **CV A** : CV complet et bien structuré
   - **CV B** : CV incomplet (manque d'expérience)
   - **CV C** : CV avec compétences non pertinentes

2. Ajouter chaque candidat avec son CV

3. Vérifier l'analyse pour chaque CV :
   - Score global
   - Compétences détectées
   - Points forts/faibles
   - Suggestions d'amélioration

### Résultat attendu
- CV A : Score élevé (80+), nombreuses compétences détectées
- CV B : Score moyen (50-70), suggestions pertinentes
- CV C : Score bas (40-60), compétences manquantes identifiées

---

## Scénario 5 : Test de performance avec plusieurs candidats

### Objectif
Vérifier que le système gère correctement un grand nombre de candidats.

### Étapes

1. Créer un poste

2. Ajouter 10 candidats avec leurs CV

3. Générer un quiz

4. Simuler des résultats de quiz pour tous

5. Lancer le classement

6. Vérifier :
   - Temps de réponse
   - Exactitude du classement
   - Affichage dans l'interface

### Résultat attendu
- Le classement se fait rapidement (< 5 secondes)
- Tous les candidats sont classés
- L'interface affiche correctement tous les résultats

---

## Scénario 6 : Test des erreurs et cas limites

### Objectif
Vérifier la gestion des erreurs.

### Cas à tester

1. **Poste sans description**
   - Créer un poste avec description vide
   - Essayer de générer un quiz
   - → Devrait retourner une erreur

2. **CV invalide**
   - Uploader un fichier non-PDF/DOCX
   - → Devrait retourner une erreur

3. **Candidat sans CV**
   - Créer un candidat sans uploader de CV
   - Calculer le score de pertinence
   - → Devrait gérer gracieusement (score bas)

4. **Quiz sans poste**
   - Essayer de générer un quiz sans jobPostingId
   - → Devrait retourner une erreur

5. **Classement sans candidats**
   - Essayer de classer les candidats pour un poste sans candidats
   - → Devrait retourner une liste vide

---

## Checklist de validation

### Fonctionnalités de base
- [ ] Création de poste fonctionne
- [ ] Ajout de candidat fonctionne
- [ ] Analyse automatique de CV fonctionne
- [ ] Génération de quiz fonctionne
- [ ] Calcul de score fonctionne
- [ ] Classement fonctionne

### Types de quiz
- [ ] Quiz QCM généré correctement
- [ ] Quiz questions ouvertes généré correctement
- [ ] Quiz cas pratiques généré correctement
- [ ] Quiz mixte généré correctement

### Interface
- [ ] Dashboard s'affiche
- [ ] Onglets fonctionnent
- [ ] Formulaires fonctionnent
- [ ] Données s'affichent correctement
- [ ] Classements s'affichent correctement

### Performance
- [ ] Temps de réponse acceptable (< 3s)
- [ ] Gestion de plusieurs candidats
- [ ] Pas d'erreurs dans la console

### Sécurité
- [ ] Authentification requise
- [ ] RLS fonctionne (un recruteur ne voit que ses données)
- [ ] Validation des entrées

---

## Commandes utiles pour les tests

### Vérifier les données dans Supabase

```sql
-- Voir tous les postes
SELECT * FROM job_postings;

-- Voir tous les candidats
SELECT * FROM candidates;

-- Voir tous les quiz
SELECT * FROM quizzes;

-- Voir les scores de pertinence
SELECT * FROM relevance_scores ORDER BY overall_score DESC;

-- Voir les classements
SELECT * FROM candidate_rankings ORDER BY rank_position;
```

### Nettoyer les données de test

```sql
-- Supprimer toutes les données de test
DELETE FROM candidate_rankings;
DELETE FROM relevance_scores;
DELETE FROM quiz_results;
DELETE FROM quizzes;
DELETE FROM cv_analyses;
DELETE FROM candidates;
DELETE FROM job_postings;
```
