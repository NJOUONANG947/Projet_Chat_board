# ⚡ Test Rapide - SaaS Recruteur (5 minutes)

## 🚀 Démarrage rapide

### Étape 1 : Vérifier que tout est prêt (1 min)

```bash
# Vérifier que le serveur tourne
npm run dev

# Vérifier dans le navigateur
# http://localhost:3000
```

### Étape 2 : Accéder au Dashboard Recruteur (30 sec)

**Option A : Via une route dédiée**

Créez `app/recruiter/page.js` :
```javascript
'use client'
import RecruiterDashboard from '@/frontend/components/RecruiterDashboard'

export default function RecruiterPage() {
  return <RecruiterDashboard onClose={() => window.location.href = '/'} />
}
```

Puis accédez à : `http://localhost:3000/recruiter`

**Option B : Intégrer dans votre menu existant**

Ajoutez un bouton dans votre interface qui ouvre le dashboard.

### Étape 3 : Test rapide (3 min)

#### ✅ Test 1 : Créer un poste
1. Onglet "Postes"
2. "+ Nouveau poste"
3. Remplir :
   - Titre : "Test Développeur"
   - Description : "Test description"
   - Compétences : "React, Node.js"
4. Cliquer "Créer"
5. ✅ Vérifier que le poste apparaît

#### ✅ Test 2 : Ajouter un candidat
1. Onglet "Candidats"
2. "+ Ajouter candidat"
3. Remplir :
   - Email : "test@example.com"
   - Prénom : "Test"
   - Nom : "Candidat"
   - Sélectionner le poste créé
   - Uploader un CV (PDF)
4. Cliquer "Ajouter et analyser"
5. ✅ Vérifier :
   - Candidat créé
   - Score CV affiché
   - Compétences détectées

#### ✅ Test 3 : Générer un quiz
1. Onglet "Quiz"
2. Sélectionner le poste
3. Choisir "Mixte"
4. Cliquer "Générer quiz"
5. ✅ Vérifier :
   - Quiz créé
   - Questions affichées
   - Format correct

#### ✅ Test 4 : Classer les candidats
1. Onglet "Classements"
2. Sélectionner le poste
3. Cliquer "Classer candidats"
4. ✅ Vérifier :
   - Candidats classés
   - Scores affichés
   - Classement cohérent

---

## 🔍 Vérification dans Supabase

Ouvrez Supabase Dashboard > Table Editor et vérifiez :

1. **job_postings** : Votre poste de test
2. **candidates** : Votre candidat de test
3. **cv_analyses** : L'analyse du CV
4. **quizzes** : Le quiz généré
5. **relevance_scores** : Les scores calculés
6. **candidate_rankings** : Le classement

---

## 🐛 Si ça ne fonctionne pas

### Erreur : "Non autorisé"
→ Vérifiez que vous êtes connecté

### Erreur : "Table does not exist"
→ Vérifiez que le schéma SQL a été appliqué

### Erreur : "GROQ_API_KEY not found"
→ Vérifiez votre `.env.local` et redémarrez

### Le dashboard ne s'affiche pas
→ Vérifiez la console du navigateur pour les erreurs

---

## 📊 Test avancé (optionnel)

Une fois les tests de base OK, testez :

1. **Plusieurs candidats** : Ajoutez 3-5 candidats différents
2. **Différents types de quiz** : Testez QCM, ouvertes, cas pratiques
3. **Pondérations** : Testez différentes configurations de poids
4. **Performance** : Testez avec 10+ candidats

---

## ✅ Checklist rapide

- [ ] Serveur démarré
- [ ] Dashboard accessible
- [ ] Poste créé
- [ ] Candidat ajouté
- [ ] CV analysé
- [ ] Quiz généré
- [ ] Candidats classés

**Si toutes les cases sont cochées → 🎉 Le SaaS fonctionne !**
