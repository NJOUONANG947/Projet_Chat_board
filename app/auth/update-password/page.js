'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '../../../frontend/contexts/AuthContext'
import { useLanguage } from '../../../frontend/contexts/LanguageContext'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { updatePassword } = useAuth()
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [recoveryChecked, setRecoveryChecked] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    const hasRecoveryHash = typeof window !== 'undefined' && (
      window.location.hash?.includes('type=recovery') ||
      window.location.hash?.includes('access_token=')
    )

    /** Extrait access_token et refresh_token du hash (#key=value&...) */
    const getParamsFromHash = () => {
      if (typeof window === 'undefined' || !window.location.hash) return null
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
      const params = new URLSearchParams(hash)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      return access_token && refresh_token ? { access_token, refresh_token } : null
    }

    const trySession = () => {
      return supabase.auth.getSession().then(({ data: { session } }) => session)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted.current) return
      if (event === 'PASSWORD_RECOVERY' || (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION'))) {
        setHasSession(true)
        setChecking(false)
        setRecoveryChecked(true)
      }
    })

    const check = async () => {
      let session = await trySession()
      if (session && mounted.current) {
        setHasSession(true)
        setChecking(false)
        setRecoveryChecked(true)
        subscription?.unsubscribe?.()
        return
      }
      // Lien « Réinitialiser le mot de passe » : les tokens sont dans le hash, il faut les donner à Supabase via setSession
      if (hasRecoveryHash) {
        const tokens = getParamsFromHash()
        if (tokens && mounted.current) {
          try {
            const { error } = await supabase.auth.setSession({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token
            })
            if (!error && mounted.current) {
              setHasSession(true)
              setChecking(false)
              setRecoveryChecked(true)
              // Nettoyer le hash pour ne pas garder les tokens dans l’URL
              if (typeof window !== 'undefined' && window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search)
              }
              subscription?.unsubscribe?.()
              return
            }
          } catch (e) {
            console.error('Erreur setSession recovery:', e)
          }
        }
        await new Promise(r => setTimeout(r, 600))
        session = await trySession()
        if (session && mounted.current) {
          setHasSession(true)
          setChecking(false)
          setRecoveryChecked(true)
          subscription?.unsubscribe?.()
          return
        }
        await new Promise(r => setTimeout(r, 1200))
        session = await trySession()
      }
      if (mounted.current) {
        setHasSession(!!session)
        setChecking(false)
        setRecoveryChecked(true)
        if (!session) router.replace('/auth/forgot-password')
      }
      subscription?.unsubscribe?.()
    }

    check()
    return () => subscription?.unsubscribe?.()
  }, [supabase, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError(t.auth.passwordMinLength)
      return
    }
    if (password !== confirm) {
      setError(t.auth.passwordConfirmMismatch)
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    } catch (err) {
      setError(err.message || t.auth.updatePasswordError)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="page-root min-h-screen bg-[#0a0a0a] flex items-center justify-center w-full">
        <div className="w-10 h-10 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasSession) return null

  return (
    <div className="page-root min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-6 relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,122,255,0.08),transparent)] pointer-events-none" />

      <header className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6 pt-0">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] flex items-center justify-center">
              <span className="text-white font-bold text-lg">CV</span>
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">CareerAI</span>
          </div>
          <Link href="/auth/login" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium rounded-xl hover:bg-white/[0.06] px-3 py-2">{t.common.login}</Link>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="rounded-2xl bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] shadow-apple-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#007AFF]/20 border border-[#007AFF]/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">{t.auth.updatePasswordTitle}</h1>
            <p className="text-zinc-400 text-sm">{t.auth.updatePasswordSubLong}</p>
          </div>

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm text-center">
              {t.auth.updatePasswordSuccess}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">{t.auth.newPasswordLabel}</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-[#007AFF]/40 focus:border-[#007AFF]/50"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors"
                    aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-zinc-300 mb-2">{t.auth.confirmPassword}</label>
                <div className="relative">
                  <input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-[#007AFF]/40 focus:border-[#007AFF]/50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors"
                    aria-label={showConfirm ? t.auth.hidePassword : t.auth.showPassword}
                    tabIndex={-1}
                  >
                    {showConfirm ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#007AFF] hover:bg-[#0056b3] active:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.auth.updatePasswordUpdating : t.auth.updatePasswordButton}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-zinc-500 text-sm">
            <Link href="/auth/login" className="text-[#007AFF] hover:text-[#5ac8fa]">{t.auth.backToSignIn}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
