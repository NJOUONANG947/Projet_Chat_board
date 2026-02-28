# Configuration DNS Resend – careerai.com

Guide pour ajouter les enregistrements Resend chez ton hébergeur de domaine (OVH, Gandi, Cloudflare, etc.) pour **careerai.com**.

---

## Où faire ces modifications ?

Connecte-toi au site où tu as acheté ou géré le domaine **careerai.com** (OVH, Gandi, Namecheap, Cloudflare, Google Domains, etc.), puis ouvre la section **DNS** / **Zone DNS** / **Gestion des enregistrements**.

---

## 1. Domain Verification (DKIM) – obligatoire

Un seul enregistrement à créer pour que Resend vérifie le domaine.

| Champ | Valeur à saisir |
|-------|-----------------|
| **Type** | `TXT` |
| **Nom / Name / Host** | `resend._domainkey` |
| **Valeur / Value / Content** | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDjLd7mbrbkC34qS6J8m1C1be94dcM9yNc3jOwaRR01eje6ZepWqKmXqQfGQJLPZerE9KwqLfGO1dEaskIiSqoi+viH43+R9TKcprShTmFfYfhlpQCXXh3gdo7zDoLEM/qXElW+fR5QYDDDbF6U/u3zZliI6wd7Mf8KX9rLDCyikQIDAQAB` |
| **TTL** | Auto ou 3600 |

**Important :** copie toute la valeur en une seule ligne, sans espaces en trop. Certains hébergeurs ajoutent eux-mêmes le domaine au nom ; dans ce cas, mets seulement `resend._domainkey` dans le champ « nom ».

---

## 2. Enable Sending (SPF) – obligatoire

Deux enregistrements pour autoriser l’envoi depuis Resend.

### 2.1 Enregistrement MX

| Champ | Valeur à saisir |
|-------|-----------------|
| **Type** | `MX` |
| **Nom / Name / Host** | `send` |
| **Valeur / Pointeur / Target** | `feedback-smtp.eu-west-1.amazonses.com` |
| **Priorité / Priority** | `10` |
| **TTL** | Auto ou 3600 |

Donc le sous-domaine **send.careerai.com** pointera vers les serveurs Resend/Amazon pour les retours (bounces).

### 2.2 Enregistrement TXT (SPF)

| Champ | Valeur à saisir |
|-------|-----------------|
| **Type** | `TXT` |
| **Nom / Name / Host** | `send` |
| **Valeur / Content** | `v=spf1 include:amazonses.com ~all` |
| **TTL** | Auto ou 3600 |

---

## 3. DMARC (optionnel mais recommandé)

Permet de définir une politique pour les emails envoyés depuis ton domaine.

| Champ | Valeur à saisir |
|-------|-----------------|
| **Type** | `TXT` |
| **Nom / Name / Host** | `_dmarc` |
| **Valeur / Content** | `v=DMARC1; p=none;` |
| **TTL** | Auto ou 3600 |

---

## Récapitulatif à créer chez ton hébergeur

| Type | Nom | Valeur | Priorité |
|------|-----|--------|----------|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDjLd7mbrbkC34qS6J8m1C1be94dcM9yNc3jOwaRR01eje6ZepWqKmXqQfGQJLPZerE9KwqLfGO1dEaskIiSqoi+viH43+R9TKcprShTmFfYfhlpQCXXh3gdo7zDoLEM/qXElW+fR5QYDDDbF6U/u3zZliI6wd7Mf8KX9rLDCyikQIDAQAB` | - |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | - |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | - |

---

## Après avoir ajouté les enregistrements

1. **Enregistre** la zone DNS chez ton hébergeur.
2. Attends **5 à 30 minutes** (parfois jusqu’à 24–48 h).
3. Sur **https://resend.com/domains**, ouvre ton domaine **careerai.com** et clique sur **Verify** pour chaque section (Domain Verification, Enable Sending).
4. Quand tout est vert, ton domaine est prêt pour l’envoi.

---

## Configurer l’application

Dans ton fichier **`.env.local`** à la racine du projet, mets par exemple :

```env
RESEND_FROM_EMAIL=CareerAI <noreply@careerai.com>
```

ou :

```env
EMAIL_FROM=noreply@careerai.com
```

Tu peux utiliser une autre adresse sur le même domaine si tu préfères (ex. `contact@careerai.com`). Redémarre ensuite l’app (`npm run dev` ou redémarrage du serveur).

---

## Notes selon l’hébergeur

- **OVH** : Web Cloud → Noms de domaine → careerai.com → Zone DNS → Ajouter une entrée.
- **Gandi** : Domaines → careerai.com → Enregistrements DNS.
- **Cloudflare** : Websites → careerai.com → DNS → Add record. Pour le TXT DKIM, si Cloudflare propose « Full » ou « Strict » pour le proxy, mets le record en **DNS only** (nuage gris) pour le sous-domaine utilisé par Resend si besoin.
- **Namecheap** : Domain List → Manage → Advanced DNS → Add New Record.

Si un champ « nom » affiche déjà `.careerai.com` à droite, ne saisis que la partie à gauche (ex. `resend._domainkey` ou `send`).
