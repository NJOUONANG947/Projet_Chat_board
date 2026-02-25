'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '../../../frontend/contexts/AuthContext'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
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
      if (hasRecoveryHash) {
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
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasSession) return null

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900/80 rounded-xl flex items-center justify-center border border-blue-800/50">
              <span className="text-white font-bold text-lg">CV</span>
            </div>
            <span className="text-xl font-bold text-white">CareerAI</span>
          </div>
          <Link href="/auth/login" className="text-zinc-400 hover:text-white transition-colors">Connexion</Link>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-900/80 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-800/50">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Nouveau mot de passe</h1>
            <p className="text-zinc-400 text-sm">Choisissez un mot de passe sécurisé (au moins 6 caractères).</p>
          </div>

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm text-center">
              Mot de passe mis à jour. Redirection vers l’application…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">Nouveau mot de passe</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-900/50 focus:border-blue-800/50"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-zinc-300 mb-2">Confirmer le mot de passe</label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-900/50 focus:border-blue-800/50"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl border border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-zinc-500 text-sm">
            <Link href="/auth/login" className="text-blue-200 hover:text-blue-100">Retour à la connexion</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
