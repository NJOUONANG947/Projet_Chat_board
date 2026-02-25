# Liste des fonctionnalités simulées ou non à 100 % fonctionnelles

Ce document recense les parties de l’application qui sont **simulées**, **incomplètes** ou **conditionnelles** (dépendent d’une config ou d’un service externe).

---

## 1. Emails

### 1.1 Envoi du quiz au candidat
- **Fichier :** `app/api/recruiter/quizzes/[id]/send/route.js`
- **État :** Envoi **réel** uniquement si `RESEND_API_KEY` et `EMAIL_FROM` sont configurés dans `.env.local`.
- **Sans config :** L’API renvoie une erreur explicite (plus de simulation).
- **À faire :** Configurer Resend (voir `CONFIGURATION-EMAIL.md`).

### 1.2 Notification au recruteur (quiz complété)
- **Fichier :** `app/api/candidate/quiz/[token]/submit/route.js` → `notifyRecruiter()`
- **État :** Envoi **réel** seulement si `RESEND_API_KEY` et `EMAIL_FROM` sont définis.
- **Sans config :** Un `console.warn` est émis, la soumission du quiz réussit quand même (pas d’email envoyé).
- **Limite :** L’email du recruteur est récupéré via `supabase.auth.admin.getUserById(recruiterId)`. Si le recruteur n’est pas un utilisateur Auth (ex. compte supprimé), la notification ne part pas.

---

## 2. Analytics (Dashboard carrière)

### 2.1 Authentification dans l’API Analytics
- **Fichier :** `app/api/analytics/route.js`
- **État :** Utilise `import { supabase } from '../../../backend/lib/supabase'` (client Supabase avec **anon key** uniquement).
- **Problème :** En route API Next.js, `supabase.auth.getUser()` **n’a pas accès aux cookies de la requête**. L’utilisateur connecté n’est en général pas reconnu.
- **Conséquence :** Souvent **401 Non autorisé** ou données d’un autre utilisateur / vides selon l’état de la session.
- **À faire :** Utiliser `createRouteHandlerClient({ cookies })` (comme les autres APIs) et récupérer la session à partir des cookies de la requête.

---

## 3. Export PDF du CV

### 3.1 Incohérence Frontend / Backend
- **Frontend :** `frontend/lib/api.js` → `exportCV(cvId, format)` envoie `{ cvId, format }`.
- **Backend :** `app/api/export/route.js` attend `{ cvData, template }` et exige `cvData` pour générer le PDF.
- **Conséquence :** Un appel à `api.exportCV(cvId)` provoque une erreur **400 "Données CV requises"** car `cvData` n’est jamais envoyé.
- **État :** L’export PDF **n’est pas utilisable** tel quel si on passe uniquement un `cvId` depuis le client.
- **À faire :** Soit le front envoie `cvData` (après récupération du CV par id), soit l’API charge le CV en base à partir de `cvId` et construit `cvData` pour `generateCVHTML`.

### 3.2 Dépendance Puppeteer
- **Fichier :** `app/api/export/route.js`
- **État :** Utilise Puppeteer en headless. Peut échouer en environnement sans navigateur (certains hébergements, Docker sans deps Chrome, etc.).
- **À faire :** Vérifier que l’environnement d’exécution a Chrome/Chromium installé ou prévoir une alternative (ex. génération PDF côté client avec jsPDF).

---

## 4. Chat / IA

### 4.1 Réponse de secours en cas d’erreur Groq
- **Fichier :** `backend/services/chat.js` → `generateResponse()`
- **État :** En cas d’erreur (réseau, quota, clé API), l’app retourne un message **fixe** :  
  `"Désolé, je n'ai pas pu générer une réponse pour le moment. Veuillez réessayer plus tard."`
- **Conséquence :** Pas de distinction pour l’utilisateur entre "erreur réseau", "quota dépassé" ou "clé API manquante". Comportement volontaire pour ne pas faire crasher le chat.

---

## 5. Recruteur – Classement des candidats

### 5.1 Affichage du classement
- **Fichiers :** `app/api/recruiter/rankings/route.js`, `backend/services/RankingService.js` → `getRankingForJob()`
- **État :** **Résolu.** L’API GET récupère le classement avec une jointure `candidate:candidates(*)` ; le champ `candidate_name` est dérivé de `first_name`, `last_name` ou `email`. Le POST enrichit aussi les rangs avec les noms via une requête sur `candidates`. L’onglet Classements affiche bien le nom du candidat.

### 5.2 Recalcul du score de pertinence après soumission d’un quiz
- **Fichier :** `app/api/candidate/quiz/[token]/submit/route.js`
- **État :** **Résolu.** Après `notifyRecruiter`, le code appelle le service de classement (client Supabase service role + `RankingService.calculateRelevanceScore`) pour le candidat et le poste lié au quiz, puis met à jour `candidate_rankings` si nécessaire.

---

## 6. Upload / Stockage

### 6.1 Suppression de document (fallback buckets)
- **Fichier :** `app/api/upload/route.js` (suppression)
- **État :** En cas d’échec de suppression dans le bucket `documents`, le code tente des buckets de secours : `['files', 'uploads', 'storage', 'assets']`.
- **Conséquence :** Comportement de secours uniquement ; si le fichier n’est dans aucun de ces buckets, la suppression peut être partielle (ligne en base supprimée, fichier restant en storage) ou l’erreur être ignorée.
- **À faire :** Aligner le nom du bucket utilisé à l’upload avec celui utilisé à la suppression, ou documenter clairement les buckets supportés.

---

## 7. Dépendances externes (rien n’est “simulé” en local, mais tout dépend de la config)

| Service / variable        | Utilisation                    | Sans configuration / clé invalide |
|---------------------------|--------------------------------|------------------------------------|
| **GROQ_API_KEY**          | Quiz, chat, génération CV, etc.| Erreurs 500 ou message de secours (chat). |
| **RESEND_API_KEY** + **EMAIL_FROM** | Envoi quiz candidat + notification recruteur | Erreur explicite pour l’envoi au candidat ; pas d’email au recruteur. |
| **Supabase** (URL + anon + service_role) | Auth, BDD, storage            | Connexion / RLS / storage inutilisables. |
| **NEXT_PUBLIC_BASE_URL**  | Liens dans les emails (quiz)   | Liens incorrects si l’app est en prod avec une autre URL. |

---

## 8. Récapitulatif par niveau de gravité

| Niveau   | Fonctionnalité                               | Problème principal |
|----------|-----------------------------------------------|--------------------|
| Critique | Export PDF CV                                 | API attend `cvData`, le client envoie `cvId` → export inutilisable en l’état. |
| Critique | Analytics (dashboard carrière)                | Auth en API route avec client anon sans cookies → 401 ou mauvaises données. |
| ~~Important~~ Résolu | Classement candidats (affichage)              | Les noms des candidats sont fournis par l’API (jointure + enrichissement). |
| ~~Important~~ Résolu | Recalcul score après quiz complété            | Recalcul effectué dans `quiz/[token]/submit` via `RankingService`. |
| Moyen    | Notification email recruteur                  | Silencieusement désactivée si Resend non configuré. |
| Moyen    | Chat en erreur                                | Message générique sans détail (quota, clé, etc.). |
| Mineur   | Suppression document (fallback buckets)       | Comportement de secours peu clair si bucket réel différent. |

---

## 9. Ce qui est pleinement fonctionnel (sous réserve de config)

- Authentification (login / signup) avec Supabase Auth  
- **Espace Recruteur (sans simulation) :** gestion des postes (GET sans jointures fragiles), candidats (CRUD + analyse CV + calcul du score de pertinence si un poste est indiqué à l’ajout), quiz (création, envoi par email, chargement réel dans l’onglet), classements (calcul via `RankingService`, affichage avec noms candidats, recalcul après soumission d’un quiz).  
- Génération de quiz (avec GROQ_API_KEY)  
- Envoi d’email quiz + notification recruteur (avec Resend configuré)  
- Page candidat `/quiz/[token]` et soumission des réponses  
- Calcul et affichage du classement (RankingService), avec noms des candidats et recalcul automatique après quiz  
- Analyse de documents / CV (avec GROQ et schéma BDD en place)  
- Suivi des candidatures (applications)  
- Builder CV et prévisualisation  
- Document manager (upload / liste), sous réserve que le bucket Supabase soit correctement configuré  

Si vous voulez, on peut détailler les corrections à faire en priorité (par exemple : Analytics + Export PDF + affichage noms dans le classement).
