# ⚡ Configuration Email Rapide - 3 Étapes

## ⚠️ OBLIGATOIRE : Les emails ne seront PAS envoyés sans cette configuration

### Étape 1 : Créer un compte Resend (2 minutes)

1. Allez sur **[https://resend.com](https://resend.com)**
2. Cliquez sur **"Sign Up"** (gratuit)
3. Créez votre compte avec votre email
4. Vérifiez votre email

### Étape 2 : Obtenir votre clé API (1 minute)

1. Connectez-vous au dashboard Resend
2. Cliquez sur **"API Keys"** dans le menu
3. Cliquez sur **"Create API Key"**
4. Donnez-lui un nom : `Quiz App`
5. **COPIEZ la clé** (elle commence par `re_`)

### Étape 3 : Configurer votre projet (1 minute)

1. Créez un fichier `.env.local` à la racine de votre projet (si pas déjà créé)
2. Ajoutez ces lignes :

```env
RESEND_API_KEY=re_VOTRE_CLE_ICI
EMAIL_FROM=onboarding@resend.dev
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3. Remplacez `re_VOTRE_CLE_ICI` par la clé que vous avez copiée
4. **Note importante** : `onboarding@resend.dev` est une adresse **fournie automatiquement** par Resend pour les tests. Vous n'avez **rien à faire** pour l'obtenir - elle fonctionne immédiatement !
5. Redémarrez votre serveur :
   ```bash
   # Arrêtez avec Ctrl+C puis :
   npm run dev
   ```

> 💡 **Pour la production**, vous pouvez configurer votre propre domaine dans Resend. Voir `GUIDE-EMAIL-FROM.md` pour plus de détails.

## ✅ C'est tout !

Maintenant, quand vous envoyez un quiz :
- ✅ L'email est **réellement envoyé** au candidat
- ✅ Le candidat reçoit l'email avec le lien
- ✅ Le recruteur reçoit une notification quand le quiz est complété

## 🔍 Vérification

Dans les logs du serveur, vous devriez voir :
```
✅ Email envoyé avec succès via Resend: { to: '...', emailId: '...', subject: '...' }
```

## ❌ Si ça ne marche pas

1. **Erreur "RESEND_API_KEY n'est pas configuré"**
   - Vérifiez que `.env.local` existe à la racine
   - Vérifiez que `RESEND_API_KEY` est bien défini
   - Redémarrez le serveur

2. **Erreur "EMAIL_FROM n'est pas configuré"**
   - Ajoutez `EMAIL_FROM=onboarding@resend.dev` dans `.env.local`
   - Redémarrez le serveur

3. **Les emails ne sont pas reçus**
   - Vérifiez votre dossier spam
   - Vérifiez que l'adresse email du candidat est valide
   - Vérifiez les logs du serveur pour les erreurs

## 📚 Documentation complète

Pour plus de détails, voir `CONFIGURATION-EMAIL.md`
