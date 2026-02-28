'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../frontend/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('password')
  const [mfaFactorId, setMfaFactorId] = useState(null)
  const [mfaChallengeId, setMfaChallengeId] = useState(null)
  const [mfaCode, setMfaCode] = useState('')
  const { signIn, mfaListFactors, mfaChallenge, mfaVerify } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const aal = session.user?.app_metadata?.aal
        if (aal === 'aal2') {
          router.push('/')
          return
        }
        const factors = await mfaListFactors().catch(() => ({ totp: [] }))
        const totp = factors?.totp || []
        if (totp.length > 0) {
          setStep('mfa')
          setMfaFactorId(totp[0].id)
          const c = await mfaChallenge(totp[0].id).catch(() => null)
          if (c?.id) setMfaChallengeId(c.id)
        } else {
          router.push('/')
        }
      }
    }
    checkUser()
  }, [router, supabase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      const factors = await mfaListFactors().catch(() => ({ totp: [] }))
      const totp = factors?.totp || []
      if (totp.length > 0) {
        setStep('mfa')
        setMfaFactorId(totp[0].id)
        const challenge = await mfaChallenge(totp[0].id)
        if (challenge?.id) setMfaChallengeId(challenge.id)
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Erreur lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e) => {
    e.preventDefault()
    if (!mfaFactorId || !mfaChallengeId || mfaCode.length !== 6) {
      setError('Entrez le code à 6 chiffres de votre application d\'authentification.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await mfaVerify(mfaFactorId, mfaChallengeId, mfaCode.trim())
      router.push('/')
    } catch (err) {
      setError(err.message || 'Code invalide ou expiré. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-root min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-6 relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,122,255,0.08),transparent)] pointer-events-none" />

      <header className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6 pt-0">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] flex items-center justify-center">
              <span className="text-white font-bold text-lg">CV</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">CareerAI</h1>
              <p className="text-zinc-500 text-sm">Assistant Carrière IA</p>
            </div>
          </motion.div>
          <Link
            href="/welcome"
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 py-2 text-sm font-medium rounded-xl hover:bg-white/[0.06] px-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </Link>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.05 }}
        className="max-w-md w-full relative z-10 my-4"
      >
        <div className="rounded-2xl bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] shadow-apple-lg p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-[#007AFF]/20 border border-[#007AFF]/30 flex items-center justify-center mx-auto mb-4"
            >
              <svg className="w-8 h-8 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Bienvenue</h2>
            <p className="text-zinc-400 text-sm">Connectez-vous à votre compte</p>
          </div>

          <div className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}

            {step === 'mfa' ? (
              <>
                <p className="text-zinc-300 text-sm text-center">
                  Ouvrez votre application d&apos;authentification (Google Authenticator, Authy, etc.) et entrez le code à 6 chiffres.
                </p>
                <form onSubmit={handleMfaSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="mfaCode" className="block text-sm font-medium text-zinc-300 mb-2">Code de vérification</label>
                    <input
                      id="mfaCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white text-center text-2xl tracking-[0.5em] placeholder:text-zinc-500 focus:ring-2 focus:ring-[#007AFF]/40 focus:border-[#007AFF]/50"
                      placeholder="000000"
                      autoComplete="one-time-code"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || mfaCode.length !== 6}
                    className="w-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Vérification...' : 'Valider'}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => { setStep('password'); setError(''); setMfaCode(''); }}
                  className="w-full text-zinc-400 hover:text-white text-sm"
                >
                  ← Retour à la connexion
                </button>
              </>
            ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 focus:border-[#007AFF]/50 transition-all"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-[#007AFF]/40 focus:border-[#007AFF]/50 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-[#007AFF] hover:text-[#5ac8fa] transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full bg-[#007AFF] hover:bg-[#0056b3] active:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </motion.button>
          </form>
            )}
          </div>

          {step === 'password' && (
          <div className="mt-6 text-center">
            <p className="text-zinc-400">
              Pas encore de compte ?{' '}
                <Link
                  href="/auth/signup"
                  className="text-[#007AFF] hover:text-[#5ac8fa] font-semibold transition-colors"
                >
                Créer un compte
              </Link>
            </p>
          </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
