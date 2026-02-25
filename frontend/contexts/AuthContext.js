'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s)
        setUser(s?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/auth/login')
  }

  /** Envoie un email de réinitialisation du mot de passe. redirectTo doit être autorisé dans Supabase Auth. */
  const resetPasswordForEmail = async (email, redirectTo) => {
    const to = redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/auth/update-password` : '')
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: to })
    if (error) throw error
    return data
  }

  /** Met à jour le mot de passe (après clic sur le lien « mot de passe oublié »). */
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return data
  }

  /** Liste les facteurs MFA enregistrés. */
  const mfaListFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) throw error
    return data
  }

  /** Enrôle un facteur TOTP (authenticator). Retourne { id, qr_code, secret } pour afficher le QR. */
  const mfaEnroll = async (friendlyName = 'CareerAI') => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName
    })
    if (error) throw error
    return data
  }

  /** Valide l'enrôlement MFA avec le code à 6 chiffres de l'app authenticator. */
  const mfaChallengeAndVerify = async (factorId, code) => {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    if (error) throw error
    return data
  }

  /** Crée un défi MFA (après connexion, pour passer en AAL2). */
  const mfaChallenge = async (factorId) => {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId })
    if (error) throw error
    return data
  }

  /** Vérifie le code MFA et complète la connexion. */
  const mfaVerify = async (factorId, challengeId, code) => {
    const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
    if (error) throw error
    return data
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    mfaListFactors,
    mfaEnroll,
    mfaChallengeAndVerify,
    mfaChallenge,
    mfaVerify,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
