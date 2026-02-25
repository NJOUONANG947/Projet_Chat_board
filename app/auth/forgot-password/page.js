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
          <Link href="/auth/login" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Retour à la connexion
          </Link>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Mot de passe oublié</h1>
            <p className="text-zinc-400 text-sm">
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm">
                Un email a été envoyé à <strong>{email}</strong>. Cliquez sur le lien pour définir un nouveau mot de passe. Pensez à vérifier les spams.
              </div>
              <Link href="/auth/login" className="block text-center text-blue-200 hover:text-blue-100 font-medium">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
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
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-900/50 focus:border-blue-800/50"
                  placeholder="votre@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl border border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-zinc-500 text-sm">
            <Link href="/auth/login" className="text-blue-200 hover:text-blue-100">Se connecter</Link>
            {' · '}
            <Link href="/auth/signup" className="text-blue-200 hover:text-blue-100">Créer un compte</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
