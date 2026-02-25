'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api.js'

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
  const [profile, setProfile] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [applicationsByCampaign, setApplicationsByCampaign] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [creating, setCreating] = useState(false)
  const [uploadingCV, setUploadingCV] = useState(false)

  const [form, setForm] = useState({
    preferred_job_titles: '',
    first_name: '',
    last_name: '',
    phone: '',
    contact_email: '',
    gender: '',
    contract_type: '',
    start_day: '',
    start_month: '',
    start_year: '',
    end_day: '12',
    end_month: '12',
    end_year: '2100',
    contract_duration_min_months: '0',
    contract_duration_max_months: '99',
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
    max_applications_per_day: 10
  })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [profileRes, campaignsRes] = await Promise.all([
        api.getCampaignProfile().catch(() => ({ profile: null })),
        api.getCampaigns().catch(() => ({ campaigns: [] }))
      ])
      setProfile(profileRes.profile || null)
      setCampaigns(campaignsRes.campaigns || [])
      if (profileRes.profile) {
        const p = profileRes.profile
        const start = p.start_date_earliest ? new Date(p.start_date_earliest) : null
        const end = p.end_date_latest ? new Date(p.end_date_latest) : null
        setForm({
          preferred_job_titles: Array.isArray(p.preferred_job_titles) ? p.preferred_job_titles.join(', ') : (p.preferred_job_titles || ''),
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          phone: p.phone || p.contact_phone || '',
          contact_email: p.contact_email || '',
          gender: p.gender || '',
          contract_type: p.contract_type || '',
          start_day: start ? String(start.getDate()) : '',
          start_month: start ? String(start.getMonth() + 1) : '',
          start_year: start ? String(start.getFullYear()) : '',
          end_day: end ? String(end.getDate()) : '12',
          end_month: end ? String(end.getMonth() + 1) : '12',
          end_year: end ? String(end.getFullYear()) : '2100',
          contract_duration_min_months: p.contract_duration_min_months != null ? String(p.contract_duration_min_months) : '0',
          contract_duration_max_months: p.contract_duration_max_months != null ? String(p.contract_duration_max_months) : '99',
          zone_geographique: p.zone_geographique || '',
          cv_document_id: p.cv_document_id || null,
          cv_file_name: p.cv_document_id ? (p.cv_file_name || 'CV joint') : '',
          default_cover_letter: p.default_cover_letter || '',
          campaign_email: p.campaign_email || p.contact_email || '',
          has_promo_code: p.has_promo_code ?? false,
          promo_code: p.promo_code || '',
          allow_auto_apply: p.allow_auto_apply ?? true
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadApplications(campaignId) {
    try {
      const res = await api.getCampaignApplications(campaignId)
      setApplicationsByCampaign((prev) => ({ ...prev, [campaignId]: res.applications || [] }))
    } catch (_) {}
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Le CV doit être un fichier PDF.')
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
      .catch((err) => alert('Erreur upload: ' + err.message))
      .finally(() => setUploadingCV(false))
  }

  function buildStartDate() {
    const { start_day, start_month, start_year } = form
    if (!start_day || !start_month || !start_year) return null
    return `${start_year}-${start_month.padStart(2, '0')}-${start_day.padStart(2, '0')}`
  }
  function buildEndDate() {
    const { end_day, end_month, end_year } = form
    if (!end_day || !end_month || !end_year) return null
    return `${end_year}-${end_month.padStart(2, '0')}-${end_day.padStart(2, '0')}`
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
        phone: form.phone,
        contact_email: form.contact_email,
        gender: form.gender || undefined,
        contract_type: form.contract_type || undefined,
        start_date_earliest: buildStartDate(),
        end_date_latest: buildEndDate(),
        contract_duration_min_months: form.contract_duration_min_months === '' ? null : parseInt(form.contract_duration_min_months, 10),
        contract_duration_max_months: form.contract_duration_max_months === '' ? null : parseInt(form.contract_duration_max_months, 10),
        zone_geographique: form.zone_geographique || undefined,
        cv_document_id: form.cv_document_id || undefined,
        default_cover_letter: form.default_cover_letter || undefined,
        campaign_email: form.campaign_email || form.contact_email,
        has_promo_code: form.has_promo_code,
        promo_code: form.promo_code || undefined,
        allow_auto_apply: form.allow_auto_apply
      })
      await load()
      alert('Profil enregistré.')
    } catch (err) {
      alert('Erreur: ' + err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function startCampaign(e) {
    e.preventDefault()
    const emailCampagne = (form.campaign_email || form.contact_email || '').trim()
    if (!form.first_name?.trim() || !form.last_name?.trim() || !form.contact_email?.trim()) {
      alert('Renseigne au minimum Prénom, Nom et E-mail de contact.')
      return
    }
    if (!emailCampagne || !emailCampagne.includes('@')) {
      alert('Indique l’adresse mail sur laquelle tu veux recevoir les réponses (champ « Quelle adresse mail pour cette campagne ? »).')
      return
    }
    if (!form.cv_document_id) {
      alert('Uploade ton CV en PDF.')
      return
    }
    setSavingProfile(true)
    try {
      const titles = form.preferred_job_titles ? form.preferred_job_titles.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) : []
      await api.saveCampaignProfile({
        preferred_job_titles: titles,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        contact_email: form.contact_email,
        gender: form.gender || undefined,
        contract_type: form.contract_type || undefined,
        start_date_earliest: buildStartDate(),
        end_date_latest: buildEndDate(),
        contract_duration_min_months: form.contract_duration_min_months === '' ? null : parseInt(form.contract_duration_min_months, 10),
        contract_duration_max_months: form.contract_duration_max_months === '' ? null : parseInt(form.contract_duration_max_months, 10),
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
      alert('Erreur: ' + err.message)
      setSavingProfile(false)
      return
    }
    setCreating(true)
    try {
      await api.createCampaign(formCampaign)
      await load()
      alert('Campagne lancée. L’IA enverra tes candidatures sur des horaires de bureau.')
    } catch (err) {
      alert('Erreur: ' + err.message)
    } finally {
      setCreating(false)
      setSavingProfile(false)
    }
  }

  const cardClass = 'rounded-2xl border border-white/[0.08] bg-zinc-900/50 shadow-xl p-6'
  const labelClass = 'block text-sm font-medium text-zinc-300 mb-1'
  const hintClass = 'block text-xs text-zinc-500 mt-1'
  const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500/50 outline-none'

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      <header className="shrink-0 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-white/[0.08] bg-zinc-950/95 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white">Candidatures automatiques</h1>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-zinc-200 hover:bg-white/15">
          Fermer
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <form onSubmit={saveProfile} className="space-y-6">
          {/* Coordonnées */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
            <h2 className="text-base font-semibold text-white mb-1">Coordonnées à inclure dans mes candidatures *</h2>
            <p className="text-sm text-zinc-400 mb-4">L’IA enverra bien tes candidatures sur des horaires de bureau.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom *</label>
                <input type="text" className={inputClass} value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} placeholder="Julie" required />
              </div>
              <div>
                <label className={labelClass}>Nom *</label>
                <input type="text" className={inputClass} value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} placeholder="Martin" required />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Numéro de téléphone</label>
              <input type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="06 12 34 56 78" />
            </div>
            <div className="mt-4">
              <label className={labelClass}>E-mail *</label>
              <input type="email" className={inputClass} value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} placeholder="nom@exemple.com" required />
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
            <p className={hintClass}>Utilisé pour rechercher les offres (ex : Développeur, Marketing, Assistant, Stage ingénieur).</p>
            <input type="text" className={inputClass + ' mt-1'} value={form.preferred_job_titles} onChange={(e) => setForm((p) => ({ ...p, preferred_job_titles: e.target.value }))} placeholder="ex: Développeur web, Stage marketing" required />
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
            <p className={hintClass}>Si tu n'as pas de date maximale, marque 12/12/2100</p>
            <div className="flex gap-2 items-center mt-1">
              <input type="number" min={1} max={31} className={inputClass + ' w-16'} placeholder="Jour" value={form.end_day} onChange={(e) => setForm((p) => ({ ...p, end_day: e.target.value }))} />
              <span className="text-zinc-500">/</span>
              <input type="number" min={1} max={12} className={inputClass + ' w-16'} placeholder="Mois" value={form.end_month} onChange={(e) => setForm((p) => ({ ...p, end_month: e.target.value }))} />
              <span className="text-zinc-500">/</span>
              <input type="number" min={2024} max={2100} className={inputClass + ' w-20'} placeholder="Année" value={form.end_year} onChange={(e) => setForm((p) => ({ ...p, end_year: e.target.value }))} />
            </div>
          </motion.section>

          {/* Durée contrat */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className={cardClass}>
            <label className={labelClass}>Quelle est la durée minimum du contrat recherché ? (en mois) *</label>
            <p className={hintClass}>Si tu n'as pas de durée minimum marque 0</p>
            <input type="number" min={0} className={inputClass + ' mt-1'} value={form.contract_duration_min_months} onChange={(e) => setForm((p) => ({ ...p, contract_duration_min_months: e.target.value }))} placeholder="0" />
            <label className={labelClass + ' mt-4'}>Quelle est la durée maximale du contrat recherché (en mois) ? *</label>
            <p className={hintClass}>Si tu n'as pas de durée maximale marque 99</p>
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
            <label className={labelClass}>Upload ton CV en PDF *</label>
            <p className={hintClass + ' mb-2'}>
              Ton CV doit être un PDF avec du texte à l'intérieur (pas une image convertie en PDF). Ouvre ton CV et essaie de copier-coller le texte : si cela fonctionne, c'est bon. Ajoute un titre et un court paragraphe en haut pour que le recruteur comprenne qui tu es et ce qui te motive. Pour stage/alternance : indique ta date de dispo, ton rythme d'alternance et la durée du contrat recherché.
            </p>
            <div className="border border-dashed border-white/20 rounded-xl p-4 bg-white/[0.03]">
              <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} disabled={uploadingCV} className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer" />
              {form.cv_file_name && <p className="mt-2 text-sm text-emerald-400">✓ {form.cv_file_name}</p>}
              {uploadingCV && <p className="mt-2 text-sm text-zinc-500">Upload en cours...</p>}
            </div>
          </motion.section>

          {/* Contexte IA */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className={cardClass}>
            <label className={labelClass}>En quelques phrases, donne à l'I.A. le contexte de ta recherche *</label>
            <p className={hintClass}>Décris ce que tu cherches, ce que tu vises, comment tu te positionnes. L'IA a besoin de comprendre ce que tu veux faire.</p>
            <textarea className={inputClass + ' mt-1 min-h-[100px]'} rows={4} value={form.default_cover_letter} onChange={(e) => setForm((p) => ({ ...p, default_cover_letter: e.target.value }))} placeholder="Ex: Je cherche un stage en marketing digital à partir de mars 2026, 6 mois, en Île-de-France. Je me différencie par..." required />
          </motion.section>

          {/* Email campagne */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cardClass}>
            <label className={labelClass}>Quelle adresse mail pour recevoir les réponses des recruteurs ? *</label>
            <p className={hintClass}>Obligatoire pour envoyer de vraies candidatures. Gmail ou Outlook conseillé.</p>
            <input type="email" className={inputClass + ' mt-1'} value={form.campaign_email} onChange={(e) => setForm((p) => ({ ...p, campaign_email: e.target.value }))} placeholder="toi@gmail.com" required />
          </motion.section>

          {/* Code promo */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }} className={cardClass}>
            <label className={labelClass}>As-tu un code d'accès gratuit ou un code promo ?</label>
            <p className={hintClass}>Ce code ne peut être fourni que par un établissement partenaire.</p>
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
              <input type="text" className={inputClass + ' mt-3'} value={form.promo_code} onChange={(e) => setForm((p) => ({ ...p, promo_code: e.target.value }))} placeholder="Code promo" />
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
          <h2 className="text-base font-semibold text-white mb-2">Lancer ma campagne</h2>
          <p className="text-sm text-zinc-400 mb-4">Ta campagne sera envoyée sur des horaires de bureau, même si tu lances la nuit ou le week-end.</p>
          <form onSubmit={startCampaign} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Durée (jours)</label>
                <input type="number" min={1} max={90} className={inputClass} value={formCampaign.duration_days} onChange={(e) => setFormCampaign((p) => ({ ...p, duration_days: Number(e.target.value) || 7 }))} />
              </div>
              <div>
                <label className={labelClass}>Max candidatures / jour</label>
                <input type="number" min={1} max={50} className={inputClass} value={formCampaign.max_applications_per_day} onChange={(e) => setFormCampaign((p) => ({ ...p, max_applications_per_day: Number(e.target.value) || 10 }))} />
              </div>
            </div>
            <button type="submit" disabled={creating || savingProfile} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {creating ? 'Lancement…' : 'Lancer ma campagne'}
            </button>
          </form>
        </motion.section>

        {/* Mes campagnes */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cardClass + ' mt-8'}>
          <h2 className="text-base font-semibold text-white mb-4">Mes campagnes</h2>
          {campaigns.length === 0 ? (
            <p className="text-zinc-500">Aucune campagne. Remplis le formulaire ci-dessus puis clique sur « Lancer ma campagne ».</p>
          ) : (
            <ul className="space-y-4">
              {campaigns.map((c) => (
                <li key={c.id} className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-zinc-100">{c.duration_days} jours · jusqu'au {new Date(c.ends_at).toLocaleDateString('fr-FR')}</span>
                    <span className={`text-sm px-2 py-0.5 rounded ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : c.status === 'completed' ? 'bg-zinc-500/20 text-zinc-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {c.status === 'active' ? 'En cours' : c.status === 'completed' ? 'Terminée' : 'En pause'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">{c.total_sent || 0} candidature(s) envoyée(s)</p>
                  <button type="button" onClick={() => loadApplications(c.id)} className="mt-2 text-sm text-blue-400 hover:underline">Voir le détail des envois</button>
                  {applicationsByCampaign[c.id]?.length > 0 && (
                    <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {applicationsByCampaign[c.id].map((a) => (
                        <li key={a.id} className="text-sm text-zinc-300 flex justify-between gap-2">
                          <span className="truncate">{a.target_name}</span>
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
