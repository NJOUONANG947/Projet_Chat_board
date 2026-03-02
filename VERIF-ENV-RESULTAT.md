# Vérification des variables d'environnement (dernier check)

**Important : ces clés ont été partagées en clair. Régénère les secrets sensibles après lecture (Supabase, Resend, CRON_SECRET, France Travail, Groq, Adzuna, HuggingFace).**

---

## Résultat du check

| Variable | Statut | Note |
|----------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | OK | Format `https://xxx.supabase.co`, projet `tbwcbofyisjokhxhthip` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | OK | JWT valide, role `anon`, ref = même projet |
| `SUPABASE_SERVICE_ROLE_KEY` | OK | JWT valide, role `service_role`, ref = même projet |
| `GROQ_API_KEY` | OK | Format `gsk_...` |
| `RESEND_API_KEY` | OK | Format `re_...` |
| `EMAIL_FROM` | OK | `noreply@careerai.blog` |
| `RESEND_FROM_EMAIL` | OK | `CareerAI <noreply@careerai.blog>` |
| `ADZUNA_APP_ID` | OK | 8 caractères hex |
| `ADZUNA_APP_KEY` | OK | 32 caractères hex |
| `CRON_SECRET` | OK | 64 caractères hex |
| `FRANCETRAVAIL_CLIENT_ID` | OK | Format `PAR_careerai_...` |
| `FRANCETRAVAIL_CLIENT_SECRET` | OK | Format hex |
| `HUGGINGFACE_TOKEN` | OK | Format `hf_...` |
| `NEXT_PUBLIC_BASE_URL` | À adapter | Actuellement `http://localhost:3000` → en prod mets ton URL (ex. `https://careerai.live`) |

---

## Points à faire après

1. **Régénérer les clés** exposées (voir message ci-dessous).
2. **En production** : définir `NEXT_PUBLIC_BASE_URL` sur l’URL réelle (ex. `https://careerai.live` ou ton domaine Render).
3. **Resend** : le domaine `careerai.blog` doit être vérifié dans Resend (Dashboard → Domains) pour que les envois vers les recruteurs fonctionnent (sinon mode test = envoi limité à ton email).

---

## Régénération recommandée

Parce que ces valeurs ont été collées dans un chat, il est plus sûr de régénérer :

- **Supabase** : Settings → API → Regenerate anon key + service_role key (puis mettre à jour .env et Render).
- **Resend** : Dashboard → API Keys → Create new, supprimer l’ancienne.
- **CRON_SECRET** : `openssl rand -hex 32` (ou équivalent), puis mettre à jour .env et la config du cron (Render Cron Job / cron-job.org).
- **France Travail** : si possible, régénérer le client secret côté partenaire.
- **Groq** : Console → régénérer la clé si l’option existe.
- **Adzuna** : garder ou régénérer selon leur dashboard.
- **HuggingFace** : Settings → Access Tokens → régénérer.

Ensuite mets à jour `.env.local` et les variables d’environnement sur Render (ou autre hébergeur).
