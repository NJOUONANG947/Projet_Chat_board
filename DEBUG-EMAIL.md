# 🔍 Guide de Débogage - Emails Non Reçus

## ⚠️ Pourquoi seul « mon » email reçoit les messages ?

**Avec l’adresse de test Resend (`onboarding@resend.dev`)** : Resend n’autorise l’envoi **qu’à l’adresse email du compte Resend** (la vôtre). Les emails vers les **recruteurs** (campagnes) ou vers les **candidats** (quiz) sont donc bloqués ou renvoyés vers vous en secours.

**Conséquences :**
- **Campagnes** : aucun email n’arrive vraiment chez les recruteurs.
- **Quiz** : le lien est envoyé à vous (recruteur) au lieu du candidat.
- **Notification « quiz complété »** : peut arriver au recruteur seulement si son email = celui du compte Resend.

**Solution pour envoyer à tout le monde (recruteurs et candidats) :**
1. Allez sur [https://resend.com/domains](https://resend.com/domains).
2. Ajoutez et **vérifiez** votre domaine (ex. `votredomaine.com`) avec les enregistrements DNS indiqués.
3. Dans `.env.local`, définissez l’expéditeur avec une adresse de **ce domaine** :
   - `RESEND_FROM_EMAIL=CareerAI <noreply@votredomaine.com>`
   - ou `EMAIL_FROM=noreply@votredomaine.com`
4. Redémarrez l’app. Les emails pourront alors être envoyés aux recruteurs et aux candidats.

---

## ✅ Vérification Étape par Étape

### 1. Vérifier votre configuration `.env.local`

Assurez-vous que votre fichier `.env.local` à la racine du projet contient :

```env
RESEND_API_KEY=re_geCrcQH8_GBCYMqYtB7eQLwvSekwQpf6m
EMAIL_FROM=onboarding@resend.dev
# Pour envoyer aux recruteurs et candidats (hors test), vérifiez un domaine Resend puis utilisez par ex. :
# RESEND_FROM_EMAIL=CareerAI <noreply@votredomaine.com>
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**⚠️ IMPORTANT :**
- Le fichier doit s'appeler exactement `.env.local` (avec le point au début)
- Il doit être à la **racine** du projet (même niveau que `package.json`)
- **Redémarrez votre serveur** après avoir modifié `.env.local`

### 2. Tester la configuration avec l'API de test

J'ai créé une route de test pour vérifier votre configuration :

1. **Démarrez votre serveur** : `npm run dev`
2. **Ouvrez votre navigateur** et allez à :
   ```
   http://localhost:3000/api/test-email?to=VOTRE_EMAIL@example.com
   ```
   Remplacez `VOTRE_EMAIL@example.com` par votre vraie adresse email

3. **Vérifiez la réponse** :
   - Si vous voyez `"success": true` → La configuration est correcte
   - Si vous voyez une erreur → Suivez les instructions dans le message d'erreur

### 3. Vérifier les logs du serveur

Quand vous envoyez un quiz, regardez les logs dans votre terminal. Vous devriez voir :

```
📧 Configuration Resend:
- EMAIL_FROM: onboarding@resend.dev
- API Key: re_geCrcQH...
- Destinataire: candidat@example.com
✅ Email envoyé avec succès via Resend!
- Email ID: [un ID]
```

Si vous voyez des erreurs, notez-les.

### 4. Vérifier votre boîte email

- ✅ **Vérifiez votre dossier SPAM/COURRIER INDÉSIRABLE**
- ✅ Vérifiez que l'adresse email du candidat est **valide**
- ✅ Attendez quelques minutes (les emails peuvent prendre 1-2 minutes)

### 5. Vérifier votre compte Resend

1. Allez sur [https://resend.com/emails](https://resend.com/emails)
2. Connectez-vous avec votre compte
3. Vérifiez la section **"Emails"** pour voir si les emails ont été envoyés
4. Si vous voyez des emails avec un statut "Delivered" → L'email a été envoyé avec succès
5. Si vous voyez "Bounced" ou "Failed" → Il y a un problème avec l'adresse email

### 6. Vérifier votre quota Resend

1. Allez sur [https://resend.com/dashboard](https://resend.com/dashboard)
2. Vérifiez votre quota d'emails
3. Le plan gratuit permet **100 emails/jour**
4. Si vous avez atteint la limite, attendez demain ou passez à un plan payant

## 🐛 Erreurs Courantes

### Erreur : "RESEND_API_KEY n'est pas configuré"

**Solution :**
1. Vérifiez que `.env.local` existe à la racine
2. Vérifiez que `RESEND_API_KEY` est bien défini (sans espaces)
3. Redémarrez le serveur : `npm run dev`

### Erreur : "EMAIL_FROM n'est pas configuré"

**Solution :**
1. Ajoutez `EMAIL_FROM=onboarding@resend.dev` dans `.env.local`
2. Redémarrez le serveur

### Erreur : "Invalid API key"

**Solution :**
1. Vérifiez que votre clé API est correcte dans Resend Dashboard
2. Vérifiez qu'elle commence bien par `re_`
3. Régénérez une nouvelle clé si nécessaire

### Erreur : "Domain not verified"

**Solution :**
- Si vous utilisez `onboarding@resend.dev`, cette erreur ne devrait pas apparaître
- Si vous utilisez votre propre domaine, vérifiez-le dans Resend Dashboard > Domains

### Les emails sont envoyés mais pas reçus

**Vérifications :**
1. ✅ Vérifiez le dossier SPAM
2. ✅ Vérifiez que l'adresse email est valide
3. ✅ Vérifiez dans Resend Dashboard > Emails si l'email a été envoyé
4. ✅ Vérifiez que votre quota n'est pas dépassé

## 🧪 Test Rapide

Pour tester rapidement si Resend fonctionne :

```bash
# Dans votre terminal, à la racine du projet
curl "http://localhost:3000/api/test-email?to=votre@email.com"
```

Ou ouvrez dans votre navigateur :
```
http://localhost:3000/api/test-email?to=votre@email.com
```

## 📞 Support

Si rien ne fonctionne :

1. **Vérifiez les logs complets** dans votre terminal
2. **Testez avec l'API de test** : `/api/test-email`
3. **Vérifiez votre dashboard Resend** pour voir les emails envoyés
4. **Vérifiez votre quota** dans Resend Dashboard

## ✅ Checklist Complète

- [ ] `.env.local` existe à la racine du projet
- [ ] `RESEND_API_KEY` est défini dans `.env.local`
- [ ] `EMAIL_FROM=onboarding@resend.dev` (ou `RESEND_FROM_EMAIL`) est défini dans `.env.local`
- [ ] **Pour envoyer aux recruteurs et candidats** : domaine vérifié sur Resend et `RESEND_FROM_EMAIL` / `EMAIL_FROM` avec une adresse de ce domaine
- [ ] Le serveur a été redémarré après modification de `.env.local`
- [ ] L'API de test (`/api/test-email`) fonctionne
- [ ] Les logs montrent "✅ Email envoyé avec succès"
- [ ] Vous avez vérifié le dossier SPAM
- [ ] L'adresse email du destinataire est valide
- [ ] Votre quota Resend n'est pas dépassé
