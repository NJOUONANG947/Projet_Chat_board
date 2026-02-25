/**
 * Service campagnes de candidatures automatiques.
 * - Récupère les offres via APIs gratuites : La Bonne Alternance (stage, alternance) + France Travail (CDI, CDD, stage, jobs)
 * - Filtre selon le profil candidat (lieu, métier, type de contrat)
 * - Génère lettre (IA) et envoie par email (Resend)
 * Tout est gratuit : LBA sans clé, France Travail avec inscription gratuite (optionnel).
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
      contractType: j.typeContrat || 'Alternance'
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
      contact: j.contact || j.email,
      _source: 'lba',
      contractType: j.typeContrat || 'Alternance'
    }))
  } catch (e) {
    console.error('LBA V1 fetch error:', e.message)
    return []
  }
}

/**
 * Récupère des offres depuis France Travail (ex Pôle emploi) — gratuit avec inscription.
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
      const email = contact.email || o.email || (contact.courriel && contact.courriel[0])
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
 * Normalise une offre pour notre modèle (target_name, target_email, target_url, source)
 */
function normalizeJob(job) {
  const companyName = typeof job.company === 'object' ? (job.company.name || job.company.raisonSociale || 'Entreprise') : String(job.company || 'Entreprise')
  const title = job.title || job.intitule || 'Poste'
  let email = null
  if (job.contact) email = typeof job.contact === 'string' ? job.contact : job.contact.email
  if (job.email) email = job.email
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
  const locationStrings = (profile.locations || []).concat(profile.zone_geographique ? [profile.zone_geographique] : [])
  const locations = locationStrings.map((l) => String(l).toLowerCase())
  const titles = (profile.preferred_job_titles || []).map((t) => t.toLowerCase())
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
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

/**
 * Agrège les offres depuis toutes les sources gratuites (LBA + France Travail si configuré).
 * Stages, jobs étudiants, alternance, CDI, CDD. Déduplique par id.
 */
export async function fetchAllJobsForProfile(profile, limitPerSource = 25) {
  const jobTitles = profile.preferred_job_titles?.length ? profile.preferred_job_titles[0] : 'développeur'
  const location = profile.zone_geographique || (profile.locations?.length ? profile.locations[0] : 'Paris')
  const peTypeContrat = getFranceTravailTypeContrat(profile.contract_type)

  const [lbaV1, lbaV3, pe] = await Promise.all([
    fetchJobsFromLBAV1({ jobTitle: jobTitles, location, limit: limitPerSource }),
    fetchJobsFromLBA({ jobTitle: jobTitles, location, limit: limitPerSource }),
    fetchJobsFromFranceTravail({ jobTitle: jobTitles, location, contractType: peTypeContrat, limit: limitPerSource })
  ])

  const seen = new Set()
  const merged = []
  for (const job of [...lbaV1, ...lbaV3, ...pe]) {
    const id = job.id || job.siret || job.slug
    if (id && seen.has(id)) continue
    if (id) seen.add(id)
    merged.push(job)
  }
  return merged
}

/**
 * Exécute une journée de campagne pour un utilisateur : récupère offres (stage, CDI, CDD, alternance, job étudiant), matche, envoie
 */
export async function runCampaignDay(supabase, campaignId, userId) {
  const { data: campaign } = await supabase.from('job_campaigns').select('*').eq('id', campaignId).eq('user_id', userId).single()
  if (!campaign || campaign.status !== 'active' || new Date(campaign.ends_at) < new Date()) return { sent: 0, error: 'Campaign not active or ended' }

  const { data: profile } = await supabase.from('candidate_profiles').select('*').eq('user_id', userId).single()
  if (!profile || !profile.allow_auto_apply) return { sent: 0, error: 'No profile or auto-apply not allowed' }

  const candidateEmail = profile.campaign_email || profile.contact_email
  if (!candidateEmail || !candidateEmail.includes('@')) {
    return { sent: 0, error: 'Email de contact obligatoire. Renseigne l\'email de campagne (ou l\'email de contact) dans ton profil.' }
  }
  const candidateName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
  if (!candidateName) {
    return { sent: 0, error: 'Prénom et nom obligatoires dans le profil pour envoyer des candidatures réelles.' }
  }

  const offers = await fetchAllJobsForProfile(profile, 30)
  const matched = matchOffersToProfile(offers, profile)
  const normalized = matched.map(normalizeJob)
  const { data: existing } = await supabase.from('campaign_applications').select('target_external_id').eq('campaign_id', campaignId)
  const existingIds = new Set((existing || []).map((r) => r.target_external_id).filter(Boolean))
  const toSend = normalized.filter((n) => n.externalId && !existingIds.has(n.externalId) && n.targetEmail).slice(0, campaign.max_applications_per_day || 10)

  const cvSummary = profile.default_cover_letter || 'Candidat motivé.'

  let sent = 0
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

  return { sent, total: toSend.length }
}
