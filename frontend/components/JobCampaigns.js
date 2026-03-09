'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { api } from '../lib/api.js'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { useLanguage } from '../contexts/LanguageContext'
import { logger } from '../lib/logger'

/** Indicatif pays avec drapeau (emoji) et code international pour candidatures automatiques */
const COUNTRY_PHONE_CODES = [
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+32', flag: '🇧🇪', name: 'Belgique' },
  { code: '+41', flag: '🇨🇭', name: 'Suisse' },
  { code: '+1', flag: '🇺🇸', name: 'États-Unis / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: '+49', flag: '🇩🇪', name: 'Allemagne' },
  { code: '+34', flag: '🇪🇸', name: 'Espagne' },
  { code: '+39', flag: '🇮🇹', name: 'Italie' },
  { code: '+31', flag: '🇳🇱', name: 'Pays-Bas' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: '+225', flag: '🇨🇮', name: 'Côte d\'Ivoire' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: '+243', flag: '🇨🇩', name: 'RD Congo' },
  { code: '+261', flag: '🇲🇬', name: 'Madagascar' },
  { code: '+20', flag: '🇪🇬', name: 'Égypte' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+27', flag: '🇿🇦', name: 'Afrique du Sud' },
  { code: '+90', flag: '🇹🇷', name: 'Turquie' },
  { code: '+971', flag: '🇦🇪', name: 'Émirats arabes unis' }
]

const CONTRACT_TYPES = [
  'Stage',
  'Stage à l\'étranger',
  'Job étudiant',
  'Alternance',
  'CDD',
  'CDI',
  '1er Emploi',
  'Emploi',
  'Emploi suite à reconversion professionnelle',
  'Emploi à l\'étranger / V.I.E.',
  'Missions freelance (auto-entrepreneur)'
]

const ZONES = [
  'Île-de-France (75, 77, 78, 91, 92, 93, 94, 95)',
  'Auvergne-Rhône-Alpes',
  'Provence-Alpes-Côte d\'Azur',
  'Occitanie',
  'Nouvelle-Aquitaine',
  'Hauts-de-France',
  'Grand Est',
  'Bretagne',
  'Pays de la Loire',
  'Normandie',
  'Bourgogne-Franche-Comté',
  'Centre-Val de Loire',
  'Corse',
  'Toute la France / Télétravail'
]

export default function JobCampaigns({ onClose }) {
  const toast = useToast()
  const confirm = useConfirm()
  const { t } = useLanguage()
  const [profile, setProfile] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [applicationsByCampaign, setApplicationsByCampaign] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [creating, setCreating] = useState(false)
  const [uploadingCV, setUploadingCV] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [runNowLoading, setRunNowLoading] = useState(false)
  const [lastOffersToConsult, setLastOffersToConsult] = useState([])
  const [lastRunMessage, setLastRunMessage] = useState(null)
  const [lastAutomationResults, setLastAutomationResults] = useState([])
  const [lastRunStats, setLastRunStats] = useState(null)

  const [form, setForm] = useState({
    preferred_job_titles: '',
    first_name: '',
    last_name: '',
    phone: '',
    phone_country_code: '+33',
    contact_email: '',
    gender: '',
    contract_type: '',
    start_day: '',
    start_month: '',
    start_year: '',
    end_day: '',
    end_month: '',
    end_year: '',
    contract_duration_min_months: '',
    contract_duration_max_months: '',
    zone_geographique: '',
    cv_document_id: null,
    cv_file_name: '',
    default_cover_letter: '',
    campaign_email: '',
    has_promo_code: false,
    promo_code: '',
    allow_auto_apply: true
  })
  const [formCampaign, setFormCampaign] = useState({
    duration_days: 7,
    max_applications_per_day: 15,
    kind: 'jobs'
  })

  const campaignsSectionRef = useRef(null)
  const offersToConsultRef = useRef(null)

  /** Affiche toujours une chaîne (évite l'erreur "Objects are not valid as a React child" si target_name est un objet). */
  function formatTargetName(targetName) {
    if (targetName == null) return '—'
    if (typeof targetName === 'string') return targetName
    if (typeof targetName === 'object') {
      const o = targetName
      const parts = [o.entreprise, o.projet].filter((x) => x != null && x !== '')
      return parts.length ? parts.join(' – ') : '—'
    }
    return String(targetName)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (lastOffersToConsult.length > 0 && offersToConsultRef.current) {
      offersToConsultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [lastOffersToConsult.length])

  async function load() {
    setLoading(true)
    try {
      const [profileRes, campaignsRes] = await Promise.all([
        api.getCampaignProfile().catch(() => ({ profile: null })),
        api.getCampaigns().catch(() => ({ campaigns: [] }))
      ])
      const p = profileRes.profile || null
      setProfile(p)
      setCampaigns(campaignsRes.campaigns || [])
      if (p) {
        const titlesRaw = p.preferred_job_titles
        const titlesStr = Array.isArray(titlesRaw) ? (titlesRaw || []).join(', ') : (typeof titlesRaw === 'string' ? titlesRaw : '')
        const start = p.start_date_earliest ? String(p.start_date_earliest).split('-') : []
        const end = p.end_date_latest ? String(p.end_date_latest).split('-') : []
        setForm((prev) => ({
          ...prev,
          preferred_job_titles: titlesStr,
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          phone: (p.phone || p.contact_phone || '').replace(/^\+\d{1,4}/, '').trim(),
          phone_country_code: (p.contact_phone || p.phone || '').match(/^\+\d{1,4}/)?.[0] || '+33',
          contact_email: p.contact_email || '',
          gender: p.gender || '',
          contract_type: p.contract_type || '',
          start_day: start[2] || '',
          start_month: start[1] || '',
          start_year: start[0] || '',
          end_day: end[2] || '',
          end_month: end[1] || '',
          end_year: end[0] || '2100',
          contract_duration_min_months: p.contract_duration_min_months ?? '',
          contract_duration_max_months: p.contract_duration_max_months ?? '',
          zone_geographique: p.zone_geographique || '',
          cv_document_id: p.cv_document_id || null,
          default_cover_letter: p.default_cover_letter || '',
          campaign_email: p.campaign_email || p.contact_email || '',
          has_promo_code: p.has_promo_code ?? false,
          promo_code: p.promo_code || '',
          allow_auto_apply: p.allow_auto_apply ?? true
        }))
      }
      const lastRunRes = await api.getLastRun().catch(() => null)
      if (lastRunRes && (lastRunRes.message || (lastRunRes.links || []).length > 0)) {
        setLastRunMessage(lastRunRes.message || null)
        setLastOffersToConsult(Array.isArray(lastRunRes.links) ? lastRunRes.links : [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadApplications(campaignId) {
    try {
      const res = await api.getCampaignApplications(campaignId)
      setApplicationsByCampaign((prev) => ({ ...prev, [campaignId]: res.applications || [] }))
    } catch (err) {
      logger.error('Load campaign applications:', err)
      toast.error(t.campaigns.loadApplicationsError)
      setApplicationsByCampaign((prev) => ({ ...prev, [campaignId]: [] }))
    }
  }

  async function handleCancelCampaign(campaign) {
    if (actionLoading) return
    const ok = await confirm({
      title: t.campaigns.cancelTitle,
      message: t.campaigns.cancelMessage.replace('{days}', campaign.duration_days),
      confirmLabel: t.campaigns.cancelLabel,
      danger: true
    })
    if (!ok) return
    setActionLoading(campaign.id)
    try {
      await api.updateCampaign(campaign.id, { status: 'cancelled' })
      await load()
      toast.success(t.campaigns.cancelSuccess)
    } catch (err) {
      toast.error(err?.message || t.campaigns.genericError)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDeleteCampaign(campaign) {
    if (actionLoading) return
    const ok = await confirm({
      title: t.campaigns.deleteTitle,
      message: t.campaigns.deleteMessage,
      confirmLabel: t.campaigns.deleteLabel,
      danger: true
    })
    if (!ok) return
    setActionLoading(campaign.id)
    try {
      await api.deleteCampaign(campaign.id)
      await load()
      setApplicationsByCampaign((prev) => {
        const next = { ...prev }
        delete next[campaign.id]
        return next
      })
      toast.success(t.campaigns.deleteSuccess)
    } catch (err) {
      toast.error(err?.message || t.campaigns.genericError)
    } finally {
      setActionLoading(null)
    }
  }

  /** Lance immédiatement la recherche d’offres et l’envoi des candidatures (sans attendre le cron). */
  async function handleRunNow() {
    if (runNowLoading || campaigns.filter((c) => c.status === 'active').length === 0) return
    setRunNowLoading(true)
    setLastOffersToConsult([])
    setLastRunMessage(null)
    setLastAutomationResults([])
    setLastRunStats(null)
    try {
      const res = await api.runNowCampaigns()
      const offers = res?.offersToConsult || []
      setLastRunMessage(res?.message || null)
      setLastAutomationResults(Array.isArray(res?.automationResults) ? res.automationResults : [])
      const fromTop = Array.isArray(offers) ? offers : []
      const fromResults = (res?.results || []).flatMap((r) => r.offersToConsult || [])
      const all = fromTop.length ? fromTop : fromResults
      const withLink = all
        .filter((o) => o && (o.url || o.href))
        .map((o) => {
          const raw = (o.url || o.href || '').trim()
          const href = raw.startsWith('http') ? raw : raw ? 'https://' + raw.replace(/^\/+/, '') : ''
          return { label: o.name || o.label || "Voir l'offre", href }
        })
        .filter((o) => o.href)
      setLastOffersToConsult(withLink)

      if (Array.isArray(res?.results) && res.results.length > 0) {
        const aggregate = res.results.reduce(
          (acc, r) => {
            acc.offersFetched += r.offersFetched || 0
            acc.offersMatched += r.offersMatched || 0
            acc.totalAttempts += r.total || 0
            acc.sent += r.sent || 0
            if (r.reason) acc.reasons.push(String(r.reason))
            return acc
          },
          { offersFetched: 0, offersMatched: 0, totalAttempts: 0, sent: 0, reasons: [] }
        )
        const failures = Math.max(0, aggregate.totalAttempts - aggregate.sent)
        const uniqueReasons = [...new Set(aggregate.reasons.map((s) => s.trim()).filter(Boolean))]
        setLastRunStats({
          offersFetched: aggregate.offersFetched,
          offersMatched: aggregate.offersMatched,
          totalAttempts: aggregate.totalAttempts,
          sent: aggregate.sent,
          failures,
          reasons: uniqueReasons
        })
      } else {
        setLastRunStats(null)
      }

      const msg = res?.message || (res?.processed > 0 ? `${res.results?.reduce((a, r) => a + (r.sent || 0), 0) || 0} candidature(s) envoyée(s).` : 'Aucune candidature envoyée.')
      if (res?.results?.some((r) => (r.sent || 0) > 0)) {
        toast.success(msg)
        await load()
      } else {
        toast.info(msg)
        await load()
      }
    } catch (err) {
      toast.error(err?.message || t.campaigns.genericError)
    } finally {
      setRunNowLoading(false)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error(t.campaigns.cvMustBePdf)
      return
    }
    setUploadingCV(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileType', 'cv')
    api.uploadDocument(formData)
      .then((res) => {
        setForm((p) => ({ ...p, cv_document_id: res.document?.id, cv_file_name: res.document?.metadata?.original_name || file.name }))
      })
      .catch((err) => toast.error(t.campaigns.uploadError + ': ' + (err?.message || t.campaigns.unknownError)))
      .finally(() => setUploadingCV(false))
  }

  function buildStartDate() {
    const { start_day, start_month, start_year } = form
    if (!start_day || !start_month || !start_year) return null
    return `${start_year}-${start_month.padStart(2, '0')}-${start_day.padStart(2, '0')}`
  }
  function buildEndDate() {
    const { end_day, end_month, end_year } = form
    const d = end_day || '12'
    const m = end_month || '12'
    const y = end_year || '2100'
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  function buildFullPhone() {
    const code = (form.phone_country_code || '').trim()
    let num = (form.phone || '').replace(/\D/g, '').trim()
    if (!num) return ''
    // Pour France (+33) : retirer le 0 initial (06 12 34 56 78 → 612345678)
    if (code === '+33' && num.startsWith('0')) num = num.slice(1)
    if (code === '+32' && num.startsWith('0')) num = num.slice(1)
    if (code === '+41' && num.startsWith('0')) num = num.slice(1)
    if (code === '+39' && num.startsWith('0')) num = num.slice(1)
    if (code === '+49' && num.startsWith('0')) num = num.slice(1)
    if (code === '+31' && num.startsWith('0')) num = num.slice(1)
    if (code === '+44' && num.startsWith('0')) num = num.slice(1)
    if (code === '+34' && num.startsWith('0')) num = num.slice(1)
    if (code === '+351' && num.startsWith('0')) num = num.slice(1)
    if (!num) return ''
    return code + num
  }

  /** Saisie numéro national uniquement : chiffres et espaces ; retire + et indicatif si collé */
  function handlePhoneInput(value) {
    let digits = value.replace(/\D/g, '')
    const codeDigits = (form.phone_country_code || '').replace(/\D/g, '')
    if (codeDigits && digits.startsWith(codeDigits) && digits.length > codeDigits.length) {
      digits = digits.slice(codeDigits.length)
    }
    if (digits.startsWith('+')) digits = digits.slice(1)
    setForm((p) => ({ ...p, phone: digits }))
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const titles = form.preferred_job_titles ? form.preferred_job_titles.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) : []
      await api.saveCampaignProfile({
        preferred_job_titles: titles,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: buildFullPhone(),
        contact_phone: buildFullPhone(),
        contact_email: form.contact_email,
        gender: form.gender || undefined,
        contract_type: form.contract_type || undefined,
        start_date_earliest: buildStartDate(),
        end_date_latest: buildEndDate(),
        contract_duration_min_months: form.contract_duration_min_months === '' ? 0 : parseInt(form.contract_duration_min_months, 10),
        contract_duration_max_months: form.contract_duration_max_months === '' ? 99 : parseInt(form.contract_duration_max_months, 10),
        zone_geographique: form.zone_geographique || undefined,
        cv_document_id: form.cv_document_id || undefined,
        default_cover_letter: form.default_cover_letter || undefined,
        campaign_email: form.campaign_email || form.contact_email,
        has_promo_code: form.has_promo_code,
        promo_code: form.promo_code || undefined,
        allow_auto_apply: form.allow_auto_apply
      })
      await load()
      toast.success(t.campaigns.profileSaved)
    } catch (err) {
      toast.error(t.campaigns.profileError + ': ' + (err?.message || t.campaigns.unknownError))
    } finally {
      setSavingProfile(false)
    }
  }

  async function startCampaign(e) {
    e.preventDefault()
    const emailCampagne = (form.campaign_email || form.contact_email || '').trim()
    if (!form.first_name?.trim() || !form.last_name?.trim() || !form.contact_email?.trim()) {
      toast.error(t.campaigns.minFieldsRequired)
      return
    }
    if (!emailCampagne || !emailCampagne.includes('@')) {
      alert(t.campaigns.emailHint)
      return
    }
    const jobTitles = (form.preferred_job_titles || '').trim().split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
    if (jobTitles.length === 0) {
      toast.error(t.campaigns.missingJobTitle)
      return
    }
    if (!form.cv_document_id) {
      toast.error(t.campaigns.uploadCvHint)
      return
    }
    setSavingProfile(true)
    try {
      const titles = form.preferred_job_titles ? form.preferred_job_titles.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) : []
      await api.saveCampaignProfile({
        preferred_job_titles: titles,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: buildFullPhone(),
        contact_phone: buildFullPhone(),
        contact_email: form.contact_email,
        gender: form.gender || undefined,
        contract_type: form.contract_type || undefined,
        start_date_earliest: buildStartDate(),
        end_date_latest: buildEndDate(),
        contract_duration_min_months: form.contract_duration_min_months === '' ? 0 : parseInt(form.contract_duration_min_months, 10),
        contract_duration_max_months: form.contract_duration_max_months === '' ? 99 : parseInt(form.contract_duration_max_months, 10),
        zone_geographique: form.zone_geographique || undefined,
        cv_document_id: form.cv_document_id || undefined,
        default_cover_letter: form.default_cover_letter || undefined,
        campaign_email: form.campaign_email || form.contact_email,
        has_promo_code: form.has_promo_code,
        promo_code: form.promo_code || undefined,
        allow_auto_apply: true
      })
      await load()
    } catch (err) {
      toast.error(t.campaigns.profileError + ': ' + (err?.message || t.campaigns.unknownError))
      setSavingProfile(false)
      return
    }
    setCreating(true)
    try {
      await api.createCampaign(formCampaign)
      await load()
      alert(t.campaigns.campaignLaunched)
      campaignsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (err) {
      toast.error(t.campaigns.profileError + ': ' + (err?.message || t.campaigns.unknownError))
    } finally {
      setCreating(false)
      setSavingProfile(false)
    }
  }

  const cardClass = 'rounded-2xl border border-white/[0.08] bg-zinc-900/50 shadow-xl p-6'
  const labelClass = 'block text-sm font-medium text-zinc-400 mb-1'
  const hintClass = 'block text-xs text-zinc-500 mt-1'
  const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500/50 outline-none'

  const hasProfile = !!profile
  const hasCv = !!(profile && profile.cv_document_id)
  const hasCampaign = campaigns.length > 0
  const hasSent = campaigns.some((c) => (c.total_sent || 0) > 0)

  if (loading) {
    return (
      <div className="page-root min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 w-full">
        <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-root h-screen max-h-[100dvh] flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden w-full">
      <header className="shrink-0 flex justify-between items-center gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b border-white/[0.08] bg-zinc-950/95 backdrop-blur-sm">
        <h1 className="text-lg sm:text-xl font-bold text-white truncate">Candidatures automatiques</h1>
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-zinc-200 hover:bg-white/15 flex-shrink-0 touch-target">Fermer</button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-[max(6rem,env(safe-area-inset-bottom))]">
        {/* Onboarding rapide des candidatures automatiques */}
        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cardClass + ' mb-6'}>
          <h2 className="text-base font-semibold text-white mb-2">Étapes pour activer les candidatures automatiques</h2>
          <p className="text-sm text-zinc-400 mb-3">Suis ces étapes dans l’ordre. Les coches deviennent vertes quand l’étape est faite.</p>
          <ol className="space-y-1.5 text-sm">
            <li className="flex items-center gap-2">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${hasProfile ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-200'}`}>
                1
              </span>
              <span className={hasProfile ? 'text-emerald-300' : 'text-zinc-200'}>Remplir ton profil (coordonnées, métier, contrat, dates, zone).</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${hasCv ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-200'}`}>
                2
              </span>
              <span className={hasCv ? 'text-emerald-300' : 'text-zinc-200'}>Téléverser un CV PDF dans la section « CV en PDF ».</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${hasCampaign ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-200'}`}>
                3
              </span>
              <span className={hasCampaign ? 'text-emerald-300' : 'text-zinc-200'}>Créer et lancer au moins une campagne.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${hasSent ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-200'}`}>
                4
              </span>
              <span className={hasSent ? 'text-emerald-300' : 'text-zinc-200'}>Lancer un envoi (bouton ou cron) et vérifier les candidatures envoyées.</span>
            </li>
          </ol>
        </motion.section>

        <form onSubmit={saveProfile} className="space-y-6">
          {/* Coordonnées */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
            <h2 className="text-base font-semibold text-white mb-1">Coordonnées à inclure dans mes candidatures *</h2>
            <p className="text-sm text-zinc-500 mb-4">Indique tes coordonnées telles qu’elles apparaîtront auprès des recruteurs.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom *</label>
                <input type="text" className={inputClass} value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} placeholder="Ex : Julie" required />
              </div>
              <div>
                <label className={labelClass}>Nom *</label>
                <input type="text" className={inputClass} value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} placeholder="Ex : Martin" required />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass} htmlFor="campaign-phone-number">Numéro de téléphone</label>
              <p className="text-xs text-zinc-500 mb-1">Choisis l’indicatif du pays puis saisis le numéro sans l’indicatif.</p>
              <div className="flex flex-nowrap items-stretch w-full rounded-xl overflow-hidden border border-white/20 bg-white/[0.06] focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50">
                <select
                  id="campaign-phone-country"
                  aria-label="Indicatif pays"
                  value={form.phone_country_code}
                  onChange={(e) => setForm((p) => ({ ...p, phone_country_code: e.target.value }))}
                  className="bg-white/[0.06] border-0 rounded-none py-3 pl-3 pr-2 text-zinc-100 text-sm font-medium min-w-0 w-[7.5rem] sm:w-[8.5rem] cursor-pointer focus:ring-0 focus:outline-none"
                >
                  {COUNTRY_PHONE_CODES.map(({ code, flag }) => (
                    <option key={code} value={code} className="bg-zinc-900 text-zinc-100">{flag} {code}</option>
                  ))}
                </select>
                <div className="flex-1 flex min-w-0 border-l border-white/20">
                  <input
                    id="campaign-phone-number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder={form.phone_country_code === '+33' ? '6 12 34 56 78' : form.phone_country_code === '+32' ? '4 12 34 56 78' : 'Numéro sans indicatif'}
                    value={form.phone}
                    onChange={(e) => handlePhoneInput(e.target.value)}
                    className="flex-1 min-w-0 w-full bg-transparent border-0 py-3 px-3 text-zinc-100 placeholder-zinc-500 text-sm focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>E-mail *</label>
              <input type="email" className={inputClass} value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} placeholder="Ex : nom@exemple.com" required />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Genre à utiliser dans mes candidatures</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gender" checked={form.gender === 'female'} onChange={() => setForm((p) => ({ ...p, gender: 'female' }))} className="text-blue-600" />
                  <span className="text-sm text-zinc-300">Féminin</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gender" checked={form.gender === 'male'} onChange={() => setForm((p) => ({ ...p, gender: 'male' }))} className="text-blue-600" />
                  <span className="text-sm text-zinc-300">Masculin</span>
                </label>
              </div>
            </div>
          </motion.section>

          {/* Métier recherché */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} className={cardClass}>
            <label className={labelClass}>Métier ou intitulé du poste recherché *</label>
            <input type="text" className={inputClass + ' mt-1'} value={form.preferred_job_titles} onChange={(e) => setForm((p) => ({ ...p, preferred_job_titles: e.target.value }))} placeholder="Ex : Développeur web, Stage marketing, Assistant commercial…" required />
          </motion.section>

          {/* Type de contrat */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className={cardClass}>
            <label className={labelClass}>Type de contrat recherché *</label>
            <select className={inputClass} value={form.contract_type} onChange={(e) => setForm((p) => ({ ...p, contract_type: e.target.value }))} required>
              <option value="">Choisir...</option>
              {CONTRACT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </motion.section>

          {/* Dates */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={cardClass}>
            <label className={labelClass}>À partir de quand peux-tu commencer, au plus tôt ? *</label>
            <div className="flex gap-2 items-center mt-1">
              <input type="number" min={1} max={31} className={inputClass + ' w-16'} placeholder="Jour" value={form.start_day} onChange={(e) => setForm((p) => ({ ...p, start_day: e.target.value }))} />
              <span className="text-zinc-500">/</span>
              <input type="number" min={1} max={12} className={inputClass + ' w-16'} placeholder="Mois" value={form.start_month} onChange={(e) => setForm((p) => ({ ...p, start_month: e.target.value }))} />
              <span className="text-zinc-500">/</span>
              <input type="number" min={2024} max={2030} className={inputClass + ' w-20'} placeholder="Année" value={form.start_year} onChange={(e) => setForm((p) => ({ ...p, start_year: e.target.value }))} />
            </div>
            <label className={labelClass + ' mt-4'}>Jusqu'à quand peux-tu finir, au plus tard ? *</label>
            <div className="flex gap-2 items-center mt-1">
              <input type="number" min={1} max={31} className={inputClass + ' w-16'} placeholder="12" value={form.end_day} onChange={(e) => setForm((p) => ({ ...p, end_day: e.target.value }))} />
              <span className="text-zinc-500">/</span>
              <input type="number" min={1} max={12} className={inputClass + ' w-16'} placeholder="12" value={form.end_month} onChange={(e) => setForm((p) => ({ ...p, end_month: e.target.value }))} />
              <span className="text-zinc-500">/</span>
              <input type="number" min={2024} max={2100} className={inputClass + ' w-20'} placeholder="2100" value={form.end_year} onChange={(e) => setForm((p) => ({ ...p, end_year: e.target.value }))} />
            </div>
          </motion.section>

          {/* Durée contrat */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className={cardClass}>
            <label className={labelClass}>Durée minimum du contrat recherché (mois) *</label>
            <input type="number" min={0} className={inputClass + ' mt-1'} value={form.contract_duration_min_months} onChange={(e) => setForm((p) => ({ ...p, contract_duration_min_months: e.target.value }))} placeholder="0" />
            <label className={labelClass + ' mt-4'}>Durée maximale du contrat recherché (mois) *</label>
            <input type="number" min={0} max={99} className={inputClass + ' mt-1'} value={form.contract_duration_max_months} onChange={(e) => setForm((p) => ({ ...p, contract_duration_max_months: e.target.value }))} placeholder="99" />
          </motion.section>

          {/* Zone géographique */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} className={cardClass}>
            <label className={labelClass}>Zone géographique visée *</label>
            <select className={inputClass} value={form.zone_geographique} onChange={(e) => setForm((p) => ({ ...p, zone_geographique: e.target.value }))} required>
              <option value="">Choisir...</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </motion.section>

          {/* Upload CV */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }} className={cardClass}>
            <label className={labelClass}>CV en PDF *</label>
            <p className={hintClass + ' mb-2'}>PDF avec du texte sélectionnable (pas une image). Ajoute en haut un titre et une courte présentation. Pour stage/alternance : date de dispo, rythme, durée souhaitée.</p>
            <div className="border border-dashed border-white/20 rounded-xl p-4 bg-white/[0.03]">
              <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} disabled={uploadingCV} className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer" />
              {form.cv_file_name && <p className="mt-2 text-sm text-emerald-400">✓ {form.cv_file_name}</p>}
              {uploadingCV && <p className="mt-2 text-sm text-zinc-500">Upload en cours...</p>}
            </div>
          </motion.section>

          {/* Contexte IA */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className={cardClass}>
            <label className={labelClass}>Contexte pour l’IA *</label>
            <textarea className={inputClass + ' mt-1 min-h-[100px]'} rows={4} value={form.default_cover_letter} onChange={(e) => setForm((p) => ({ ...p, default_cover_letter: e.target.value }))} placeholder="Ex : Je cherche un stage en marketing digital à partir de mars 2026, 6 mois, en Île-de-France. Je me différencie par mon expérience en…" required />
          </motion.section>

          {/* Email campagne */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cardClass}>
            <label className={labelClass}>Adresse mail pour recevoir les réponses des recruteurs *</label>
            <input type="email" className={inputClass + ' mt-1'} value={form.campaign_email} onChange={(e) => setForm((p) => ({ ...p, campaign_email: e.target.value }))} placeholder="Ex : toi@gmail.com ou toi@outlook.com" required />
          </motion.section>

          {/* Code promo */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }} className={cardClass}>
            <label className={labelClass}>Code d’accès gratuit ou code promo</label>
            <p className={hintClass}>Fourni uniquement par un établissement partenaire.</p>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="promo" checked={form.has_promo_code === true} onChange={() => setForm((p) => ({ ...p, has_promo_code: true }))} className="text-blue-600" />
                <span className="text-sm text-zinc-300">Oui</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="promo" checked={form.has_promo_code === false} onChange={() => setForm((p) => ({ ...p, has_promo_code: false, promo_code: '' }))} className="text-blue-600" />
                <span className="text-sm text-zinc-300">Non</span>
              </label>
            </div>
            {form.has_promo_code && (
              <input type="text" className={inputClass + ' mt-3'} value={form.promo_code} onChange={(e) => setForm((p) => ({ ...p, promo_code: e.target.value }))} placeholder="Ex : saisir le code fourni par ton établissement" />
            )}
          </motion.section>

          {/* Enregistrer */}
          <div className="flex gap-3">
            <button type="submit" disabled={savingProfile} className="px-5 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50">
              {savingProfile ? 'Enregistrement…' : 'Enregistrer mon profil'}
            </button>
          </div>
        </form>

        {/* Lancer la campagne */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cardClass + ' mt-8'}>
          <h2 className="text-base font-semibold text-white mb-1">Créer une campagne</h2>
          <p className="text-sm text-zinc-400 mb-4">
            La campagne récupère les offres correspondant à ton profil et envoie jusqu’à un certain nombre de candidatures automatiques à chaque passage (manuel ou planifié par le serveur).
          </p>
          <form onSubmit={startCampaign} className="space-y-4">
            <div>
              <label className={labelClass}>Type de campagne</label>
              <select
                className={inputClass + ' mt-1'}
                value={formCampaign.kind}
                onChange={(e) => setFormCampaign((p) => ({ ...p, kind: e.target.value }))}
              >
                <option value="jobs">Offres d’emploi (Adzuna, LBA, France Travail, etc.)</option>
                <option value="kandi">Kandi · Candidatures spontanées vers tes contacts</option>
              </select>
              <p className={hintClass}>Kandi envoie des emails de candidature spontanée aux contacts que tu as ajoutés dans ta base (kandi_contacts).</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Durée (jours)</label>
                <input type="number" min={1} max={90} className={inputClass} value={formCampaign.duration_days} onChange={(e) => setFormCampaign((p) => ({ ...p, duration_days: Number(e.target.value) || 7 }))} placeholder="Ex : 7" />
                <p className="text-xs text-zinc-500 mt-1">Période pendant laquelle la campagne est active.</p>
              </div>
              <div>
                <label className={labelClass}>Max. candidatures auto par passage</label>
                <input type="number" min={1} max={50} className={inputClass} value={formCampaign.max_applications_per_day} onChange={(e) => setFormCampaign((p) => ({ ...p, max_applications_per_day: Number(e.target.value) || 15 }))} placeholder="Ex : 15" />
                <p className="text-xs text-zinc-500 mt-1">Nombre max. d’envois automatiques à chaque exécution (bouton ou cron).</p>
              </div>
            </div>
            <button type="submit" disabled={creating || savingProfile} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {creating ? 'Lancement…' : 'Créer et lancer la campagne'}
            </button>
          </form>
        </motion.section>

        {/* Mes campagnes */}
        <motion.section ref={campaignsSectionRef} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cardClass + ' mt-8'}>
          {/* Liens des offres à consulter — affiché en premier pour ne pas les rater */}
          {lastOffersToConsult.length > 0 && (
            <div ref={offersToConsultRef} className="mb-6 p-4 rounded-xl bg-blue-600/20 border-2 border-blue-400/50">
              <p className="text-base font-semibold text-blue-100 mb-1">Postuler via la plateforme</p>
              <p className="text-sm text-zinc-400 mb-3">Clique sur un lien pour ouvrir l’annonce (Adzuna, La Bonne Alternance, etc.) et postuler.</p>
              <ul className="space-y-2">
                {lastOffersToConsult.map((item, i) => (
                  <li key={i}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-200 hover:text-white hover:underline block py-1 break-all">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-white">Mes campagnes</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/campaigns/report" className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 text-zinc-200 hover:bg-white/15">
                Voir le compte rendu
              </Link>
              {campaigns.some((c) => c.status === 'active') && (
                <button
                  type="button"
                  onClick={handleRunNow}
                  disabled={runNowLoading}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {runNowLoading ? 'Envoi en cours…' : "Lancer l'envoi maintenant"}
                </button>
              )}
            </div>
          </div>
          {/* Bloc résultat : affiché dès qu'il y a au moins une campagne active OU un résultat d'envoi */}
          {(campaigns.some((c) => c.status === 'active') || lastRunMessage || lastOffersToConsult.length > 0 || lastAutomationResults.length > 0) && (
            <div className="mb-4 p-4 rounded-lg bg-white/[0.06] border border-white/[0.1]">
              <p className="text-sm font-medium text-zinc-200 mb-2">Envoi des campagnes</p>
              {lastRunMessage || lastOffersToConsult.length > 0 || lastAutomationResults.length > 0 ? (
                <>
                  {lastRunMessage && <p className="text-sm text-zinc-400 mb-3">{lastRunMessage}</p>}
                  {lastRunStats && (
                    <div className="text-xs sm:text-sm text-zinc-400 mb-3 space-y-1">
                      <p>
                        Offres trouvées : <span className="font-semibold text-zinc-100">{lastRunStats.offersFetched}</span> · Correspondantes :{' '}
                        <span className="font-semibold text-zinc-100">{lastRunStats.offersMatched}</span>
                      </p>
                      <p>
                        Tentatives ce run : <span className="font-semibold text-zinc-100">{lastRunStats.totalAttempts}</span> · Envoyées :{' '}
                        <span className="font-semibold text-emerald-300">{lastRunStats.sent}</span> · Échecs :{' '}
                        <span className="font-semibold text-amber-300">{lastRunStats.failures}</span>
                      </p>
                      {lastRunStats.reasons && lastRunStats.reasons.length > 0 && (
                        <p className="text-[11px] sm:text-xs text-zinc-500">
                          Raison principale : {lastRunStats.reasons[0]}
                        </p>
                      )}
                    </div>
                  )}
                  {lastAutomationResults.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-emerald-200 mb-2">Envois automatiques</p>
                      <ul className="space-y-1.5 text-sm">
                        {lastAutomationResults.map((r, i) => (
                          <li key={i} className="flex flex-wrap items-center gap-2 text-zinc-300">
                            <span className={r.success ? 'text-emerald-400' : 'text-amber-400'}>
                              {r.success ? '✓ Envoyé' : '✗ Échec'}
                            </span>
                            <span className="truncate">{r.name || 'Offre'}</span>
                            {r.verified && <span className="text-emerald-300 text-xs">Confirmée par la plateforme</span>}
                            {r.message && <span className="text-zinc-500 text-xs">— {r.message}</span>}
                            {r.error && !r.success && <span className="text-amber-300/80 text-xs">— {r.error.slice(0, 60)}…</span>}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-zinc-500 mt-2">
                        « Confirmée » = message de confirmation détecté après envoi. Sinon, vérifie ta boîte mail ou le site de l’annonceur.
                      </p>
                    </div>
                  )}
                  {lastOffersToConsult.length > 0 && (
                    <p className="text-sm text-zinc-400">
                      Les liens pour postuler sont dans la section <strong className="text-blue-200">« Postuler via la plateforme »</strong> ci-dessus.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-zinc-400 mb-3">
                    Aucun envoi effectué pour le moment. Les campagnes actives sont traitées automatiquement selon la planification du serveur (cron). Tu peux aussi lancer un envoi manuel avec le bouton ci-dessus pour traiter les offres immédiatement.
                  </p>
                  <button
                    type="button"
                    onClick={handleRunNow}
                    disabled={runNowLoading}
                    className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {runNowLoading ? 'Envoi en cours…' : "Lancer l'envoi maintenant"}
                  </button>
                </>
              )}
            </div>
          )}
          {campaigns.length === 0 ? (
            <p className="text-zinc-500">Aucune campagne. Remplis le formulaire « Créer une campagne » ci-dessus puis clique sur « Créer et lancer la campagne ».</p>
          ) : (
            <ul className="space-y-4">
              {campaigns.map((c) => (
                <li key={c.id} className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-zinc-100">{c.duration_days} jours · jusqu'au {new Date(c.ends_at).toLocaleDateString('fr-FR')}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : c.status === 'completed' ? 'bg-zinc-500/20 text-zinc-300' : c.status === 'cancelled' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {c.status === 'active' ? 'En cours' : c.status === 'completed' ? 'Terminée' : c.status === 'cancelled' ? 'Annulée' : 'En pause'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">Max {c.max_applications_per_day ?? 15} candidatures auto par passage · {c.total_sent ?? 0} enregistrées</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button type="button" onClick={() => loadApplications(c.id)} className="text-sm text-blue-400 hover:underline">Voir le détail des envois</button>
                    {(c.status === 'active' || c.status === 'paused') && (
                      <button
                        type="button"
                        onClick={() => handleCancelCampaign(c)}
                        disabled={actionLoading === c.id}
                        className="text-sm text-amber-400 hover:underline disabled:opacity-50"
                      >
                        {actionLoading === c.id ? '…' : 'Annuler la campagne'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteCampaign(c)}
                      disabled={actionLoading === c.id}
                      className="text-sm text-red-400 hover:underline disabled:opacity-50"
                    >
                      {actionLoading === c.id ? '…' : 'Supprimer'}
                    </button>
                  </div>
                  {applicationsByCampaign[c.id]?.length > 0 && (
                    <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {applicationsByCampaign[c.id].map((a) => (
                        <li key={a.id} className="text-sm text-zinc-300 flex justify-between gap-2">
                          <span className="truncate">{formatTargetName(a.target_name)}</span>
                          <span className="shrink-0">{a.status === 'sent' ? '✓' : a.status === 'failed' ? '✗' : '·'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </motion.section>
        </div>
      </div>
    </div>
  )
}
