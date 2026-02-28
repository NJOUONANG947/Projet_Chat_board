'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '../../../frontend/contexts/AuthContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const { resetPasswordForEmail } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/update-password` : ''
      await resetPasswordForEmail(email, redirectTo)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'email.')
    } finally {
      setLoading(false)
    }
  }

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
          <Link href="/auth/login" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium rounded-xl hover:bg-white/[0.06] px-3 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Retour à la connexion
          </Link>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Mot de passe oublié</h1>
            <p className="text-zinc-400 text-sm">
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm">
                Un email a été envoyé à <strong>{email}</strong>. Cliquez sur le lien pour définir un nouveau mot de passe. Pensez à vérifier les spams.
              </div>
              <Link href="/auth/login" className="block text-center text-[#007AFF] hover:text-[#5ac8fa] font-medium">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">Adresse email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-[#007AFF]/40 focus:border-[#007AFF]/50"
                  placeholder="votre@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#007AFF] hover:bg-[#0056b3] active:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-zinc-500 text-sm">
            <Link href="/auth/login" className="text-[#007AFF] hover:text-[#5ac8fa]">Se connecter</Link>
            {' · '}
            <Link href="/auth/signup" className="text-[#007AFF] hover:text-[#5ac8fa]">Créer un compte</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
