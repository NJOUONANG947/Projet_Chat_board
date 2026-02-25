# 📧 Guide : Comment obtenir EMAIL_FROM

## Option 1 : Utiliser l'adresse de test Resend (RECOMMANDÉ pour commencer)

`onboarding@resend.dev` est une adresse email **fournie automatiquement** par Resend pour les tests. **Vous n'avez rien à faire** pour l'obtenir !

### ✅ Avantages :
- ✅ **Aucune configuration nécessaire** - fonctionne immédiatement
- ✅ Parfait pour les tests et le développement
- ✅ Pas besoin de configurer de domaine DNS

### ⚠️ Limitations :
- ⚠️ Limité à **100 emails/jour**
- ⚠️ Les emails peuvent aller dans les spams (car c'est une adresse de test)
- ⚠️ Pas idéal pour la production

### 📝 Configuration :

Dans votre `.env.local`, utilisez simplement :

```env
EMAIL_FROM=onboarding@resend.dev
```

**C'est tout !** Cette adresse est déjà disponible dans votre compte Resend.

---

## Option 2 : Configurer votre propre domaine (Pour la production)

Si vous voulez utiliser votre propre domaine (ex: `noreply@votredomaine.com`), vous devez le configurer dans Resend.

### Étape 1 : Ajouter votre domaine dans Resend

1. Connectez-vous à votre dashboard Resend : [https://resend.com/domains](https://resend.com/domains)
2. Cliquez sur **"Add Domain"**
3. Entrez votre domaine (ex: `votredomaine.com`)
4. Cliquez sur **"Add"**

### Étape 2 : Vérifier votre domaine (Configuration DNS)

Resend vous donnera des enregistrements DNS à ajouter à votre domaine. Vous devrez ajouter :

1. **Un enregistrement TXT** pour la vérification
2. **Un enregistrement MX** pour recevoir les emails
3. **Un enregistrement CNAME** pour le tracking

### Exemple de configuration DNS :

```
Type: TXT
Name: @
Value: [valeur fournie par Resend]

Type: MX
Name: @
Value: feedback-smtp.resend.com
Priority: 10

Type: CNAME
Name: resend._domainkey
Value: [valeur fournie par Resend]
```

### Étape 3 : Attendre la vérification

- Resend vérifie automatiquement votre domaine
- Cela peut prendre quelques minutes à quelques heures
- Vous recevrez un email de confirmation une fois vérifié

### Étape 4 : Utiliser votre domaine

Une fois vérifié, dans votre `.env.local` :

```env
EMAIL_FROM=noreply@votredomaine.com
# OU
EMAIL_FROM=quiz@votredomaine.com
# OU toute autre adresse @votredomaine.com
```

---

## 🎯 Recommandation

### Pour commencer rapidement (Développement/Tests) :
```env
EMAIL_FROM=onboarding@resend.dev
```
✅ **Aucune configuration nécessaire** - fonctionne immédiatement

### Pour la production :
```env
EMAIL_FROM=noreply@votredomaine.com
```
✅ Meilleure délivrabilité
✅ Plus professionnel
✅ Pas de limite de 100 emails/jour (selon votre plan Resend)

---

## 🔍 Vérifier votre configuration

### Vérifier que votre EMAIL_FROM fonctionne :

1. Envoyez un quiz à votre propre email
2. Vérifiez que vous recevez l'email
3. Vérifiez l'expéditeur dans l'email reçu

### Si vous voyez une erreur :

**Erreur : "Domain not verified"**
- Votre domaine n'est pas encore vérifié dans Resend
- Utilisez `onboarding@resend.dev` en attendant

**Erreur : "Invalid from address"**
- Vérifiez que l'adresse est correcte
- Pour Resend test : utilisez `onboarding@resend.dev`
- Pour votre domaine : assurez-vous qu'il est vérifié dans Resend

---

## 📚 Ressources

- Documentation Resend : [https://resend.com/docs](https://resend.com/docs)
- Guide de vérification de domaine : [https://resend.com/docs/dashboard/domains/introduction](https://resend.com/docs/dashboard/domains/introduction)
