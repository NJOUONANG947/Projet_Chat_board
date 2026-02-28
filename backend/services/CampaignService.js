/**
 * Service campagnes de candidatures automatiques.
 * - Récupère les offres via : La Bonne Alternance (offres v1 + v3 + entreprises), France Travail (CDI, CDD, stage) si configuré.
 * - Extrait l'email de contact partout où il est disponible (apply_email, contact, company.email, courriel, etc.).
 * - Génère lettre (IA) et envoie par email (Resend).
 */

import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const resend = new Resend(process.env.RESEND_API_KEY)

const LBA_BASE = 'https://labonnealternance.apprentissage.beta.gouv.fr/api'
const FRANCETRAVAIL_TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token'
const FRANCETRAVAIL_OFFRES_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search'

/** Map type de contrat profil → code API France Travail (typeContrat). CDI/CDD/Stage/Alternance/Job étudiant. */
function getFranceTravailTypeContrat(contractType) {
  if (!contractType) return null
  const s = String(contractType).toLowerCase()
  if (s.includes('cdi')) return 'CDI'
  if (s.includes('cdd')) return 'CDD'
  if (s.includes('stage')) return 'MIS'
  if (s.includes('étudiant') || s.includes('etudiant')) return 'CDD'
  if (s.includes('alternance')) return 'CDD'
  return null
}

/**
 * Récupère des offres depuis La Bonne Alternance (v3 jobs search)
 * @see https://labonnealternance.apprentissage.beta.gouv.fr/api/docs
 */
export async function fetchJobsFromLBA(options = {}) {
  const { jobTitle = '', location = '', radius = 30, limit = 20 } = options
  try {
    const params = new URLSearchParams()
    if (jobTitle) params.set('romes', jobTitle) // LBA utilise des codes ROME, on peut passer un mot-clé
    if (location) params.set('latitude', '48.8566')
    if (location) params.set('longitude', '2.3522')
    if (radius) params.set('radius', String(radius))
    if (limit) params.set('limit', String(Math.min(limit, 50)))

    const url = `${LBA_BASE}/v3/jobs/search?${params.toString()}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []

    const data = await res.json()
    const list = data.results || data.jobs || data.data || (Array.isArray(data) ? data : [])
    return (Array.isArray(list) ? list.slice(0, limit) : []).map((j) => ({
      ...j,
      _source: 'lba',
      contractType: j.typeContrat || 'Alternance',
      // Expliciter les champs email pour extraction (LBA peut renvoyer apply_email, contact, company.contact)
      email: j.apply_email || j.email || (j.company && (j.company.email || j.company.contact)) || j.contact,
      contact: j.contact || j.apply_email || j.email
    }))
  } catch (e) {
    console.error('LBA fetch error:', e.message)
    return []
  }
}

/**
 * Récupère offres via l'API V1 jobsEtFormations (fallback, plus permissive)
 */
export async function fetchJobsFromLBAV1(options = {}) {
  const { jobTitle = '', location = 'Paris', limit = 20 } = options
  try {
    const params = new URLSearchParams({
      call: 'search',
      what: jobTitle || 'développeur',
      where: location || '75',
      page: '1',
      limit: String(Math.min(limit, 30))
    })
    const url = `${LBA_BASE}/V1/jobsEtFormations?${params.toString()}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []

    const data = await res.json()
    const jobs = data.peJobList || data.lbaCompanies || data.results || []
    return (Array.isArray(jobs) ? jobs : []).slice(0, limit).map((j) => ({
      id: j.id || j.siret || j.slug || `${j.title || ''}-${Math.random().toString(36).slice(2)}`,
      title: j.title || j.name || j.intitule || 'Offre',
      company: j.company || j.entreprise || j.employer || {},
      place: j.place || j.location || {},
      url: j.url || j.link,
      contact: j.contact || j.email || j.apply_email || (j.company && (j.company.email || j.company.contact)),
      email: j.email || j.contact || j.apply_email,
      _source: 'lba',
      contractType: j.typeContrat || 'Alternance'
    }))
  } catch (e) {
    console.error('LBA V1 fetch error:', e.message)
    return []
  }
}

/**
 * Récupère des offres depuis La Bonne Alternance (entreprises / recruteurs à fort potentiel).
 * Complément à jobsEtFormations : certaines entreprises ont un email de contact.
 */
export async function fetchJobsFromLBACompanies(options = {}) {
  const { jobTitle = '', location = 'Paris', limit = 15 } = options
  try {
    const params = new URLSearchParams({
      call: 'search',
      what: jobTitle || 'développeur',
      where: location || '75',
      limit: String(Math.min(limit, 20))
    })
    const url = `${LBA_BASE}/V1/companies?${params.toString()}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []

    const data = await res.json()
    const list = data.companies || data.results || data.peCompanies || (Array.isArray(data) ? data : [])
    return (Array.isArray(list) ? list : []).slice(0, limit).map((c) => ({
      id: c.id || c.siret || c.slug || `company-${Math.random().toString(36).slice(2)}`,
      title: c.title || c.name || c.intitule || 'Candidature spontanée',
      company: c.company || { name: c.name || c.raisonSociale || 'Entreprise' },
      place: c.place || c.location || {},
      url: c.url || c.link,
      contact: c.contact || c.email || c.apply_email,
      email: c.email || c.contact || c.apply_email,
      _source: 'lba_companies',
      contractType: 'Alternance'
    }))
  } catch (e) {
    return []
  }
}

/**
 * CDI, CDD, stage, jobs. Optionnel : FRANCETRAVAIL_CLIENT_ID + FRANCETRAVAIL_CLIENT_SECRET.
 * @see https://www.emploi-store-dev.fr/portail-developpeur-cms/home/catalogue-des-api/documentation-des-api/api/api-offres-demploi-v2.html
 */
export async function fetchJobsFromFranceTravail(options = {}) {
  const { jobTitle = '', location = '', contractType = null, limit = 30 } = options
  const clientId = process.env.FRANCETRAVAIL_CLIENT_ID
  const clientSecret = process.env.FRANCETRAVAIL_CLIENT_SECRET
  if (!clientId || !clientSecret) return []

  let token
  try {
    const tokenRes = await fetch(FRANCETRAVAIL_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'api_offresdemploiv2 o2dsoffre'
      })
    })
    if (!tokenRes.ok) {
      console.error('France Travail token error:', await tokenRes.text())
      return []
    }
    const tokenData = await tokenRes.json()
    token = tokenData.access_token
  } catch (e) {
    console.error('France Travail token:', e.message)
    return []
  }

  try {
    const params = new URLSearchParams()
    params.set('motsCles', jobTitle || 'développeur')
    params.set('range', `0-${Math.min(limit, 149)}`)
    if (location) params.set('commune', location)
    if (contractType) params.set('typeContrat', contractType)

    const url = `${FRANCETRAVAIL_OFFRES_URL}?${params.toString()}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    })
    if (!res.ok) return []

    const data = await res.json()
    const list = data.resultats || data.offres || (Array.isArray(data) ? data : [])
    return (Array.isArray(list) ? list : []).slice(0, limit).map((o) => {
      const company = o.entreprise || {}
      const lieu = o.lieuExecution || o.lieu || {}
      const contact = o.contact || o.candidature || {}
      let email = contact.email || o.email
      if (!email && contact.courriel) {
        const c = contact.courriel
        if (typeof c === 'string' && c.includes('@')) email = c
        else if (Array.isArray(c) && c.length) email = typeof c[0] === 'string' ? c[0] : (c[0]?.valeur || c[0]?.email)
        else if (c && typeof c === 'object' && c.valeur) email = c.valeur
      }
      return {
        id: o.id || o.identifiant || `pe-${(o.intitule || '').slice(0, 20)}-${Math.random().toString(36).slice(2)}`,
        title: o.intitule || o.titre || 'Poste',
        company: { name: company.nom || company.name || 'Entreprise', raisonSociale: company.nom },
        place: { city: lieu.libelle || lieu.commune, address: lieu.adresse },
        url: o.origineOffre?.url || o.url || o.lienOffre,
        contact: email || null,
        email: email || null,
        _source: 'francetravail',
        contractType: o.typeContrat || contractType || 'CDI'
      }
    })
  } catch (e) {
    console.error('France Travail fetch error:', e.message)
    return []
  }
}

/**
 * Récupère des offres depuis Adzuna France (api.adzuna.com).
 * Inscription gratuite : https://developer.adzuna.com/signup
 * Les offres peuvent contenir un email dans la description (extraction automatique).
 */
export async function fetchJobsFromAdzuna(options = {}) {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) return []

  const { jobTitle = '', location = 'France', limit = 25 } = options
  try {
    const page = 1
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      what: jobTitle || 'développeur',
      where: location || 'France',
      results_per_page: String(Math.min(limit, 50)),
      content_type: 'application/json'
    })
    const url = `https://api.adzuna.com/v1/api/jobs/fr/search/${page}?${params.toString()}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []

    const data = await res.json()
    const list = data.results || []
    return list.slice(0, limit).map((j) => ({
      id: j.id || `adzuna-${Math.random().toString(36).slice(2)}`,
      title: j.title || 'Poste',
      company: j.company ? { name: j.company.display_name || j.company.name } : { name: 'Entreprise' },
      place: j.location ? { city: j.location.display_name, address: j.location.display_name } : {},
      url: j.redirect_url || j.url,
      description: j.description || '',
      contact: null,
      email: null,
      _source: 'adzuna',
      contractType: (j.contract_type || j.contract_time || '').toLowerCase().includes('permanent') ? 'CDI' : (j.contract_type || 'CDD')
    }))
  } catch (e) {
    console.error('Adzuna fetch error:', e.message)
    return []
  }
}

/**
 * Extrait un email depuis un objet offre (toutes sources).
 * Essaie les champs connus, puis la description (texte libre où les recruteurs mettent souvent leur email), puis scan des chaînes.
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
function extractEmailFromJob(job) {
  if (!job) return null
  const tryPath = (v) => (v && typeof v === 'string' && v.includes('@') ? v : null)
  const from = tryPath(job.email) || tryPath(job.contact) || tryPath(job.apply_email) ||
    tryPath(job.contactEmail) || tryPath(job.contact_email) ||
    (job.company && (tryPath(job.company.email) || tryPath(job.company.contact) || tryPath(job.company.contactEmail))) ||
    (job.recruteur && (tryPath(job.recruteur.email) || tryPath(job.recruteur.contact))) ||
    (job.contact && typeof job.contact === 'object' && (tryPath(job.contact.email) || tryPath(job.contact.courriel)))
  if (from) return from
  // Beaucoup d'offres (petites annonces, plateformes directes) mettent l'email dans la description
  const desc = job.description || job.desc || job.content || job.body || ''
  if (typeof desc === 'string' && desc.length > 0) {
    const match = desc.match(EMAIL_REGEX)
    if (match && match[0]) return match[0].trim()
  }
  // Scan shallow values
  for (const v of Object.values(job)) {
    if (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return v
    if (v && typeof v === 'object' && !Array.isArray(v) && v.email) return tryPath(v.email)
  }
  return null
}

/**
 * Normalise une offre pour notre modèle (target_name, target_email, target_url, source)
 */
function normalizeJob(job) {
  const companyName = typeof job.company === 'object' ? (job.company.name || job.company.raisonSociale || 'Entreprise') : String(job.company || 'Entreprise')
  const title = job.title || job.intitule || 'Poste'
  const email = extractEmailFromJob(job)
  const url = job.url || job.link || job.applicationUrl
  return {
    externalId: job.id || job.siret || job.slug || null,
    targetName: `${companyName} - ${title}`,
    targetEmail: email,
    targetUrl: url,
    source: job._source || 'lba',
    contractType: job.contractType || null,
    raw: job
  }
}

/**
 * Filtre les offres selon le profil candidat (lieu, métier, type de contrat)
 */
export function matchOffersToProfile(offers, profile) {
  const raw = profile.preferred_job_titles
  const titleList = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw.trim() ? raw.trim().split(/[\n,]/).map((s) => s.trim()).filter(Boolean) : [])
  const titles = titleList.map((t) => String(t).toLowerCase())
  const locationStrings = (profile.locations || []).concat(profile.zone_geographique ? [profile.zone_geographique] : [])
  const locations = locationStrings.map((l) => String(l).toLowerCase())
  const wantedContract = (profile.contract_type || '').toLowerCase()

  return offers.filter((job) => {
    const jobPlace = (job.place?.city || job.place?.address || job.location || '').toLowerCase()
    const jobTitle = (job.title || job.intitule || '').toLowerCase()
    const matchLocation = locations.length === 0 || locations.some((loc) => loc.includes('télétravail') || loc.includes('toute la france') || jobPlace.includes(loc) || loc === 'partout')
    const matchTitle = titles.length === 0 || titles.some((t) => jobTitle.includes(t))
    const jobContract = (job.contractType || '').toLowerCase()
    const matchContract = !wantedContract || !jobContract || wantedContract.includes(jobContract) || jobContract.includes(wantedContract) ||
      (wantedContract.includes('stage') && (jobContract.includes('mis') || jobContract.includes('alternance'))) ||
      (wantedContract.includes('étudiant') && jobContract.includes('cdd'))
    return matchLocation && matchTitle && matchContract
  })
}

/**
 * Génère une lettre de motivation courte pour une offre (IA)
 */
export async function generateCoverLetterForOffer(profile, cvSummary, offer) {
  if (!process.env.GROQ_API_KEY) return null
  const companyName = typeof offer.company === 'object' ? (offer.company?.name || offer.company?.raisonSociale || 'l\'entreprise') : String(offer.company || 'l\'entreprise')
  const jobTitle = offer.title || offer.intitule || 'ce poste'

  const prompt = `Tu es un expert en recrutement. Rédige une courte lettre de motivation (8-12 lignes, ton professionnel) pour un candidat qui postule au poste "${jobTitle}" chez ${companyName}. 
Utilise ces infos candidat: ${cvSummary || 'Profil professionnel'}
Ne mets pas de formules de politesse longues. Termine par "Bien cordialement" et une phrase d'appel à l'entretien. Réponds UNIQUEMENT avec le texte de la lettre, rien d'autre.`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.6
    })
    return completion.choices[0]?.message?.content?.trim() || null
  } catch (e) {
    console.error('Cover letter generation error:', e.message)
    return null
  }
}

/**
 * Envoie une candidature par email (Resend). Aucune simulation : clé et expéditeur obligatoires.
 * Expéditeur : RESEND_FROM_EMAIL ou, à défaut, EMAIL_FROM (même variable que le reste de l'app).
 */
export async function sendApplicationEmail({ to, subject, html, candidateName, candidateEmail }) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY manquant. Configure l\'envoi d\'emails dans les variables d\'environnement.' }
  }
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM
  if (!fromEmail) {
    return { ok: false, error: 'Expéditeur manquant. Définis RESEND_FROM_EMAIL ou EMAIL_FROM dans .env.local (ex: CareerAI <noreply@tondomaine.com> ou onboarding@resend.dev).' }
  }
  if (!to || !candidateEmail) {
    return { ok: false, error: 'Destinataire ou email candidat manquant.' }
  }
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject: subject || `Candidature - ${candidateName}`,
      html: html || `<p>Bonjour,</p><p>Veuillez trouver ci-dessous la candidature de ${candidateName} (${candidateEmail}).</p>`
    })
    if (error) {
      const msg = error.message || JSON.stringify(error)
      const isTestMode = msg.includes('only send testing emails to your own email') || msg.includes('verify a domain') || msg.includes('domain')
      return {
        ok: false,
        error: isTestMode
          ? 'Resend n\'envoie qu\'à votre propre adresse en mode test. Pour envoyer aux recruteurs : vérifiez un domaine sur https://resend.com/domains et définissez RESEND_FROM_EMAIL (ou EMAIL_FROM) avec une adresse de ce domaine (ex: noreply@votredomaine.com).'
          : msg
      }
    }
    return { ok: true, id: data?.id }
  } catch (e) {
    const msg = e?.message || String(e)
    const isTestMode = msg.includes('only send testing emails to your own email') || msg.includes('verify a domain')
    return {
      ok: false,
      error: isTestMode
        ? 'Resend n\'envoie qu\'à votre propre adresse en mode test. Pour envoyer aux recruteurs : vérifiez un domaine sur https://resend.com/domains et utilisez une adresse « De » avec ce domaine.'
        : msg
    }
  }
}

/**
 * Agrège les offres depuis toutes les sources gratuites (LBA, LBA Companies, France Travail si configuré, Adzuna France si configuré).
 * Stages, jobs étudiants, alternance, CDI, CDD. Déduplique par id.
 */
export async function fetchAllJobsForProfile(profile, limitPerSource = 25) {
  const raw = profile.preferred_job_titles
  const jobTitles = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw.trim() ? raw.trim().split(/[\n,]/).map((s) => s.trim()).filter(Boolean) : [])
  const jobTitle = jobTitles.length ? jobTitles[0] : 'développeur'
  const location = profile.zone_geographique || (profile.locations?.length ? profile.locations[0] : 'Paris')
  const peTypeContrat = getFranceTravailTypeContrat(profile.contract_type)

  const [lbaV1, lbaV3, lbaCompanies, pe, adzuna] = await Promise.all([
    fetchJobsFromLBAV1({ jobTitle, location, limit: limitPerSource }),
    fetchJobsFromLBA({ jobTitle, location, limit: limitPerSource }),
    fetchJobsFromLBACompanies({ jobTitle, location, limit: 15 }),
    fetchJobsFromFranceTravail({ jobTitle, location, contractType: peTypeContrat, limit: limitPerSource }),
    fetchJobsFromAdzuna({ jobTitle, location: location || 'France', limit: limitPerSource })
  ])

  const seen = new Set()
  const merged = []
  for (const job of [...lbaV1, ...lbaV3, ...lbaCompanies, ...pe, ...adzuna]) {
    const id = job.id || job.siret || job.slug
    if (id && seen.has(id)) continue
    if (id) seen.add(id)
    merged.push(job)
  }
  return merged
}

/**
 * Exécute une journée de campagne pour un utilisateur : récupère offres (stage, CDI, CDD, alternance, job étudiant), matche, envoie
 * @returns {{ sent: number, total: number, reason?: string }}
 */
export async function runCampaignDay(supabase, campaignId, userId) {
  const { data: campaign } = await supabase.from('job_campaigns').select('*').eq('id', campaignId).eq('user_id', userId).single()
  if (!campaign || campaign.status !== 'active' || new Date(campaign.ends_at) < new Date()) return { sent: 0, total: 0, reason: 'Campagne inactive ou terminée' }

  const { data: profile } = await supabase.from('candidate_profiles').select('*').eq('user_id', userId).single()
  if (!profile) return { sent: 0, total: 0, reason: 'Profil candidat manquant. Renseigne la section "Mon profil" (nom, email, métiers, zone).' }
  if (!profile.allow_auto_apply) return { sent: 0, total: 0, reason: 'Candidatures auto désactivées. Active "Autoriser l\'envoi automatique" dans ton profil.' }

  const candidateEmail = profile.campaign_email || profile.contact_email
  if (!candidateEmail || !candidateEmail.includes('@')) {
    return { sent: 0, total: 0, reason: 'Email de contact obligatoire. Renseigne l\'email de campagne (ou contact) dans "Mon profil".' }
  }
  const candidateName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
  if (!candidateName) {
    return { sent: 0, total: 0, reason: 'Prénom et nom obligatoires dans le profil pour envoyer des candidatures.' }
  }

  if (!process.env.RESEND_API_KEY) {
    return { sent: 0, total: 0, reason: 'Envoi d’emails non configuré (RESEND_API_KEY manquant). Contacte l’administrateur.' }
  }
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM
  if (!fromEmail) {
    return { sent: 0, total: 0, reason: 'Expéditeur email manquant (RESEND_FROM_EMAIL ou EMAIL_FROM). Contacte l’administrateur.' }
  }

  const offers = await fetchAllJobsForProfile(profile, 30)
  const matched = matchOffersToProfile(offers, profile)
  const normalized = matched.map(normalizeJob)
  const { data: existing } = await supabase.from('campaign_applications').select('target_external_id').eq('campaign_id', campaignId)
  const existingIds = new Set((existing || []).map((r) => r.target_external_id).filter(Boolean))
  const toSend = normalized.filter((n) => n.externalId && !existingIds.has(n.externalId) && n.targetEmail).slice(0, campaign.max_applications_per_day || 10)

  if (toSend.length === 0) {
    const withEmail = normalized.filter((n) => n.targetEmail).length
    return {
      sent: 0,
      total: 0,
      reason: matched.length === 0
        ? 'Aucune offre ne correspond à ton profil (métiers / zone / type de contrat). Élargis les critères ou réessaie plus tard.'
        : withEmail === 0
          ? 'Aucune offre avec email de contact trouvée. Les plateformes (La Bonne Alternance, etc.) exposent rarement les emails.'
          : 'Toutes les offres correspondantes ont déjà reçu une candidature (quota du jour ou doublons). Réessaie demain.'
    }
  }

  const cvSummary = profile.default_cover_letter || 'Candidat motivé.'
  let sent = 0
  let firstError = null
  for (const offer of toSend) {
    if (!offer.targetEmail) continue
    const letter = await generateCoverLetterForOffer(profile, cvSummary, offer.raw || { company: offer.targetName, title: offer.targetName })
    const html = letter ? letter.replace(/\n/g, '<br>') : `<p>Bonjour,</p><p>Je vous prie de trouver ci-joint ma candidature pour le poste. Cordialement, ${candidateName}</p>`
    const result = await sendApplicationEmail({
      to: offer.targetEmail,
      subject: `Candidature spontanée - ${offer.targetName}`,
      html,
      candidateName,
      candidateEmail
    })
    if (!result.ok && !firstError) firstError = result.error

    await supabase.from('campaign_applications').insert({
      campaign_id: campaignId,
      target_type: 'job',
      target_name: offer.targetName,
      target_email: offer.targetEmail,
      target_url: offer.targetUrl,
      target_source: offer.source || 'lba',
      target_external_id: offer.externalId,
      cover_letter_text: letter,
      status: result.ok ? 'sent' : 'failed',
      error_message: result.ok ? null : result.error
    })
    if (result.ok) sent++
  }

  await supabase.from('job_campaigns').update({
    total_sent: (campaign.total_sent || 0) + sent,
    updated_at: new Date().toISOString()
  }).eq('id', campaignId)

  if (new Date(campaign.ends_at) <= new Date()) {
    await supabase.from('job_campaigns').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', campaignId)
  }

  const reason = sent === 0 && firstError ? firstError : undefined
  return { sent, total: toSend.length, reason }
}
