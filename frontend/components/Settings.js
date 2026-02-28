'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEYS = {
  displayName: 'careerai_display_name',
  notifications: {
    emailReminders: 'careerai_notif_reminders',
    careerTips: 'careerai_notif_tips',
    newFeatures: 'careerai_notif_features'
  }
}

export default function Settings({ onClose }) {
  const { user, mfaListFactors, mfaEnroll, mfaChallengeAndVerify } = useAuth()
  const [activeSection, setActiveSection] = useState('profil')
  const [displayName, setDisplayName] = useState('')
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    careerTips: true,
    newFeatures: false
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [mfaFactors, setMfaFactors] = useState(null)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaEnrollStep, setMfaEnrollStep] = useState(null)
  const [mfaEnrollData, setMfaEnrollData] = useState(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDisplayName(localStorage.getItem(STORAGE_KEYS.displayName) || '')
      setNotifications({
        emailReminders: localStorage.getItem(STORAGE_KEYS.notifications.emailReminders) !== 'false',
        careerTips: localStorage.getItem(STORAGE_KEYS.notifications.careerTips) !== 'false',
        newFeatures: localStorage.getItem(STORAGE_KEYS.notifications.newFeatures) === 'true'
      })
    }
  }, [])

  useEffect(() => {
    if (user?.email && !feedbackEmail) setFeedbackEmail(user.email)
  }, [user?.email])

  useEffect(() => {
    if (activeSection !== 'compte' || !mfaListFactors) return
    setMfaLoading(true)
    setMfaFactors(null)
    mfaListFactors()
      .then((data) => setMfaFactors(data || {}))
      .catch(() => setMfaFactors({}))
      .finally(() => setMfaLoading(false))
  }, [activeSection, mfaListFactors])

  const savePrefs = () => {
    setSaving(true)
    setMessage(null)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.displayName, displayName)
        localStorage.setItem(STORAGE_KEYS.notifications.emailReminders, String(notifications.emailReminders))
        localStorage.setItem(STORAGE_KEYS.notifications.careerTips, String(notifications.careerTips))
        localStorage.setItem(STORAGE_KEYS.notifications.newFeatures, String(notifications.newFeatures))
      }
      setMessage({ type: 'success', text: 'Préférences enregistrées.' })
    } catch (e) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement.' })
    }
    setSaving(false)
  }

  const toggleNotif = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const sections = [
    { id: 'profil', label: 'Profil', icon: '👤' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'compte', label: 'Compte & sécurité', icon: '🔒' },
    { id: 'confidentialite', label: 'Confidentialité', icon: '🛡️' },
    { id: 'preferences', label: 'Préférences', icon: '⚙️' },
    { id: 'avis', label: 'Avis', icon: '💬' }
  ]

  return (
    <div className="page-root min-h-screen bg-[#0a0a0a] flex flex-col w-full">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="relative z-10 flex flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 box-border">
        {/* Sidebar nav */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0 pr-6 border-r border-white/[0.08]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-white">Paramètres</h1>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
              title="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                  activeSection === s.id
                    ? 'bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/30'
                    : 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
                }`}
              >
                <span className="text-lg">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 pl-0 md:pl-8">
          {/* Mobile header */}
          <div className="flex items-center justify-between mb-6 md:mb-8 md:hidden">
            <h1 className="text-xl font-bold text-white">Paramètres</h1>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.08] text-zinc-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile section tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 md:hidden">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium ${
                  activeSection === s.id ? 'bg-[#007AFF]/20 border border-[#007AFF]/30' : 'bg-white/[0.06] text-zinc-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 px-4 py-3 rounded-xl text-sm ${
                message.type === 'success' ? 'bg-[#007AFF]/20 text-[#5ac8fa] border border-[#007AFF]/30' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {message.text}
            </motion.div>
          )}

          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white/[0.06] border border-white/[0.08] rounded-2xl p-6 sm:p-8"
          >
            {activeSection === 'profil' && (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Profil</h2>
                <p className="text-zinc-400 text-sm mb-6">Informations affichées dans l&apos;application.</p>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Email (compte)</label>
                    <input
                      type="email"
                      value={user?.email ?? ''}
                      readOnly
                      className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-xl text-zinc-300 cursor-not-allowed"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Modifiable depuis la page de connexion / mot de passe oublié.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Nom affiché</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Optionnel"
                      className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-[#007AFF]/40 focus:border-[#007AFF]/50"
                    />
                  </div>
                </div>
              </>
            )}

            {activeSection === 'notifications' && (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Notifications</h2>
                <p className="text-zinc-400 text-sm mb-6">Choisissez ce que vous souhaitez recevoir.</p>
                <div className="space-y-4 max-w-md">
                  {[
                    { key: 'emailReminders', label: 'Rappels par email', desc: 'Rappels pour vos candidatures et tâches carrière' },
                    { key: 'careerTips', label: 'Conseils carrière', desc: 'Conseils et actualités carrière (hebdo)' },
                    { key: 'newFeatures', label: 'Nouvelles fonctionnalités', desc: 'Annonces des mises à jour de CareerAI' }
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-white/[0.08] last:border-0">
                      <div>
                        <p className="font-medium text-white">{label}</p>
                        <p className="text-sm text-zinc-500">{desc}</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={notifications[key]}
                        onClick={() => toggleNotif(key)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          notifications[key] ? 'bg-[#007AFF]' : 'bg-white/[0.2]'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications[key] ? 'left-[26px]' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeSection === 'compte' && (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Compte & sécurité</h2>
                <p className="text-zinc-400 text-sm mb-6">Mot de passe, double authentification et session.</p>
                <div className="space-y-4 max-w-md">
                  <div className="p-4 bg-white/[0.06] border border-white/[0.08] rounded-xl">
                    <p className="font-medium text-white mb-1">Mot de passe</p>
                    <p className="text-sm text-zinc-400 mb-3">Pour modifier votre mot de passe, utilisez le lien « Mot de passe oublié » sur la page de connexion avec votre email.</p>
                    <a href="/auth/forgot-password" className="text-sm text-blue-200 hover:text-blue-100 font-medium">Mot de passe oublié →</a>
                  </div>

                  <div className="p-4 bg-white/[0.06] border border-white/[0.08] rounded-xl">
                    <p className="font-medium text-white mb-1">Authentification à deux facteurs (2FA)</p>
                    <p className="text-sm text-zinc-400 mb-3">Protégez votre compte avec un code à 6 chiffres généré par une app (Google Authenticator, Authy, etc.).</p>
                    {mfaLoading ? (
                      <p className="text-sm text-zinc-500">Chargement…</p>
                    ) : (mfaFactors?.totp?.length > 0) ? (
                      <p className="text-sm text-emerald-400">Double authentification activée.</p>
                    ) : mfaEnrollStep === 'qr' && mfaEnrollData ? (
                      <div className="space-y-3 mt-3">
                        <p className="text-sm text-zinc-300">Scannez ce QR code avec votre application d&apos;authentification, puis entrez le code à 6 chiffres.</p>
                        {mfaEnrollData.totp?.qr_code && (
                          <img src={mfaEnrollData.totp.qr_code} alt="QR code 2FA" className="w-48 h-48 bg-white rounded-lg p-1" />
                        )}
                        {mfaEnrollData.totp?.secret && !mfaEnrollData.totp?.qr_code && (
                          <p className="text-xs text-zinc-500 font-mono break-all">Secret : {mfaEnrollData.totp.secret}</p>
                        )}
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={mfaCode}
                          onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, '')); setMfaError(''); }}
                          placeholder="000000"
                          className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white text-center tracking-widest"
                        />
                        {mfaError && <p className="text-sm text-red-400">{mfaError}</p>}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!mfaEnrollData?.id || mfaCode.length !== 6) { setMfaError('Entrez le code à 6 chiffres'); return }
                              setMfaError('')
                              try {
                                await mfaChallengeAndVerify(mfaEnrollData.id, mfaCode)
                                setMfaEnrollStep(null)
                                setMfaEnrollData(null)
                                setMfaCode('')
                                const data = await mfaListFactors()
                                setMfaFactors(data || {})
                              } catch (e) {
                                setMfaError(e.message || 'Code invalide')
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500"
                          >
                            Valider et activer
                          </button>
                          <button
                            type="button"
                            onClick={() => { setMfaEnrollStep(null); setMfaEnrollData(null); setMfaCode(''); setMfaError(''); }}
                            className="px-4 py-2 bg-white/[0.1] text-zinc-200 rounded-xl text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          setMfaError('')
                          try {
                            const data = await mfaEnroll('CareerAI')
                            setMfaEnrollData(data)
                            setMfaEnrollStep('qr')
                          } catch (e) {
                            setMfaError(e.message || 'Erreur lors de l\'activation')
                          }
                        }}
                        className="px-4 py-2 bg-[#007AFF] hover:bg-[#0056b3] text-white rounded-xl"
                      >
                        Activer la double authentification
                      </button>
                    )}
                  </div>

                  <div className="p-4 bg-white/[0.06] border border-white/[0.08] rounded-xl">
                    <p className="font-medium text-white mb-1">Session actuelle</p>
                    <p className="text-sm text-zinc-400">Vous êtes connecté sur cet appareil. La déconnexion fermera la session.</p>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'confidentialite' && (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Confidentialité & données</h2>
                <p className="text-zinc-400 text-sm mb-6">Vos données et leur utilisation.</p>
                <div className="space-y-4 max-w-md">
                  <div className="p-4 bg-white/[0.06] border border-white/[0.08] rounded-xl">
                    <p className="font-medium text-white mb-1">Export des données</p>
                    <p className="text-sm text-zinc-400 mb-3">Téléchargez une copie de vos CV, conversations et préférences (fonctionnalité à venir).</p>
                    <button type="button" disabled className="px-4 py-2 bg-white/[0.08] text-zinc-500 rounded-xl text-sm cursor-not-allowed">Bientôt disponible</button>
                  </div>
                  <div className="p-4 bg-white/[0.06] border border-white/[0.08] rounded-xl">
                    <p className="font-medium text-white mb-1">Suppression du compte</p>
                    <p className="text-sm text-zinc-400">La suppression de votre compte efface définitivement vos données. Contactez le support pour toute demande.</p>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'preferences' && (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Préférences</h2>
                <p className="text-zinc-400 text-sm mb-6">Langue et affichage.</p>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Langue de l&apos;interface</label>
                    <select className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white focus:ring-2 focus:ring-[#007AFF]/40 focus:border-[#007AFF]/50">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="p-4 bg-white/[0.06] border border-white/[0.08] rounded-xl">
                    <p className="font-medium text-white mb-1">Thème</p>
                    <p className="text-sm text-zinc-400">Thème actuel : Bleu nuit & gris (fixe pour cette version).</p>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'avis' && (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Votre avis</h2>
                <p className="text-zinc-400 text-sm mb-6">Dites-nous ce que vous pensez de l&apos;application. Votre message nous sera envoyé par email.</p>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Votre email (pour vous recontacter si besoin)</label>
                    <input
                      type="email"
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-[#007AFF]/40 focus:border-[#007AFF]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Votre avis (au moins 10 caractères)</label>
                    <textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="Décrivez votre expérience, une idée d'amélioration, un bug..."
                      rows={5}
                      className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-[#007AFF]/40 focus:border-[#007AFF]/50 resize-y min-h-[120px]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={feedbackSending || feedbackMessage.trim().length < 10}
                    onClick={async () => {
                      setFeedbackSending(true)
                      try {
                        const res = await fetch('/api/feedback', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            message: feedbackMessage.trim(),
                            email: feedbackEmail.trim() || undefined
                          })
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) {
                          toast.error(data.error || 'Erreur lors de l\'envoi.')
                          return
                        }
                        toast.success(data.message || 'Merci ! Votre avis a bien été envoyé.')
                        setFeedbackMessage('')
                      } catch (e) {
                        toast.error('Erreur réseau. Réessayez.')
                      } finally {
                        setFeedbackSending(false)
                      }
                    }}
                    className="px-6 py-2.5 bg-[#007AFF] hover:bg-[#0056b3] text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {feedbackSending ? 'Envoi…' : 'Envoyer mon avis'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </main>
      </div>

      {/* Footer save */}
      <div className="relative z-10 border-t border-white/[0.08] bg-[#0a0a0a]/95 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Retour au Chat
          </button>
          <button
            onClick={savePrefs}
            disabled={saving}
            className="px-6 py-2.5 bg-[#007AFF] hover:bg-[#0056b3] text-white font-medium rounded-xl disabled:opacity-50 transition-colors"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer les préférences'}
          </button>
        </div>
      </div>
    </div>
  )
}
