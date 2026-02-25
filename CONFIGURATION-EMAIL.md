# 📧 Configuration Email - Envoi Réel des Quiz

## ⚠️ IMPORTANT : Configuration Requise

Pour que les candidats reçoivent **réellement** les emails avec les quiz, vous devez configurer un service d'email. Ce guide utilise **Resend** (recommandé).

## 🚀 Configuration Resend (5 minutes)

### Étape 1 : Créer un compte Resend

1. Allez sur [https://resend.com](https://resend.com)
2. Créez un compte gratuit (100 emails/jour gratuits)
3. Vérifiez votre email

### Étape 2 : Obtenir votre clé API

1. Connectez-vous à votre dashboard Resend
2. Allez dans **API Keys**
3. Cliquez sur **Create API Key**
4. Donnez-lui un nom (ex: "Quiz App")
5. **Copiez la clé** (elle commence par `re_`)

### Étape 3 : Configurer EMAIL_FROM

**Option A : Utiliser l'adresse de test Resend (RECOMMANDÉ pour commencer)**
- ✅ `onboarding@resend.dev` est **fournie automatiquement** par Resend
- ✅ **Aucune configuration nécessaire** - fonctionne immédiatement
- ✅ Parfait pour le développement et les tests
- ⚠️ Limité à 100 emails/jour
- ⚠️ Les emails peuvent aller dans les spams

**Option B : Configurer votre propre domaine (pour production)**
1. Dans Resend, allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Ajoutez votre domaine (ex: `votredomaine.com`)
4. Suivez les instructions DNS pour vérifier le domaine
5. Une fois vérifié, vous pouvez utiliser `noreply@votredomaine.com`

> 📚 **Guide détaillé** : Voir `GUIDE-EMAIL-FROM.md` pour toutes les options

### Étape 4 : Installer Resend dans votre projet

```bash
npm install resend
```

### Étape 5 : Configurer les variables d'environnement

Créez ou modifiez votre fichier `.env.local` à la racine du projet :

```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@votredomaine.com

# OU pour les tests avec le domaine Resend :
# EMAIL_FROM=onboarding@resend.dev

# URL de base de votre application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# En production, remplacez par votre URL réelle :
# NEXT_PUBLIC_BASE_URL=https://votredomaine.com
```

### Étape 6 : Redémarrer le serveur

```bash
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

## ✅ Vérification

Une fois configuré, quand vous envoyez un quiz :

1. ✅ L'email est **réellement envoyé** au candidat
2. ✅ Le candidat reçoit un email avec le lien du quiz
3. ✅ Le recruteur reçoit une notification quand le quiz est complété
4. ✅ Les logs montrent `✅ Email envoyé avec succès via Resend`

## 🔍 Dépannage

### Erreur : "RESEND_API_KEY n'est pas configuré"

**Solution :**
- Vérifiez que `.env.local` existe à la racine du projet
- Vérifiez que `RESEND_API_KEY` est bien défini
- Redémarrez le serveur Next.js

### Erreur : "EMAIL_FROM n'est pas configuré"

**Solution :**
- Ajoutez `EMAIL_FROM` dans `.env.local`
- Utilisez `onboarding@resend.dev` pour les tests
- Ou configurez votre propre domaine dans Resend

### Erreur : "Invalid API key"

**Solution :**
- Vérifiez que la clé API est correcte dans `.env.local`
- Vérifiez qu'elle commence bien par `re_`
- Régénérez une nouvelle clé dans Resend si nécessaire

### Les emails ne sont pas reçus

**Vérifications :**
1. Vérifiez les logs du serveur pour voir les erreurs
2. Vérifiez votre dossier spam
3. Vérifiez que l'adresse email du candidat est valide
4. Vérifiez votre quota Resend (100 emails/jour en gratuit)

## 📊 Alternatives à Resend

Si vous préférez utiliser un autre service :

### SendGrid
- Modifiez `sendQuizEmail` dans `app/api/recruiter/quizzes/[id]/send/route.js`
- Installez : `npm install @sendgrid/mail`
- Configurez : `SENDGRID_API_KEY` dans `.env.local`

### Mailgun
- Modifiez `sendQuizEmail` dans `app/api/recruiter/quizzes/[id]/send/route.js`
- Installez : `npm install mailgun.js`
- Configurez : `MAILGUN_API_KEY` et `MAILGUN_DOMAIN` dans `.env.local`

### Nodemailer (SMTP)
- Modifiez `sendQuizEmail` dans `app/api/recruiter/quizzes/[id]/send/route.js`
- Installez : `npm install nodemailer`
- Configurez vos paramètres SMTP dans `.env.local`

## 🎯 Prochaines étapes

Une fois configuré :
1. Testez en envoyant un quiz à votre propre email
2. Vérifiez que vous recevez bien l'email
3. Cliquez sur le lien et testez le quiz
4. Vérifiez que le recruteur reçoit la notification

## 📝 Notes importantes

- ⚠️ **Ne commitez JAMAIS** votre `.env.local` dans Git
- ✅ Ajoutez `.env.local` dans votre `.gitignore`
- ✅ En production, configurez les variables d'environnement dans votre hébergeur (Vercel, Netlify, etc.)
- ✅ Resend gratuit : 100 emails/jour, 3000 emails/mois
- ✅ Pour plus d'emails, passez à un plan payant Resend
