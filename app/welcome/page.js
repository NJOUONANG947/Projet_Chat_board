'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function WelcomePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.push('/')
    }
    checkUser()
  }, [router, supabase])

  const steps = [
    { num: '1', title: 'Créez votre compte', desc: 'Inscription gratuite en quelques secondes.' },
    { num: '2', title: "Discutez avec l'assistant IA", desc: 'Posez vos questions carrière, uploadez votre CV ou une offre pour obtenir conseils et lettres.' },
    { num: '3', title: 'Générez CV et lettres', desc: "Créez un CV à partir d'une offre, ou une lettre de motivation personnalisée à partir de vos documents." },
    { num: '4', title: 'Suivez et automatisez', desc: "Suivez vos candidatures et lancez des campagnes pour que l'IA postule pour vous (stages, CDI, CDD)." }
  ]

  const features = [
    { icon: '💬', title: 'Assistant carrière IA', description: 'Un chat intelligent pour vos questions emploi, conseils CV et préparation aux entretiens.' },
    { icon: '📄', title: 'CV et lettres de motivation', description: "Générez un CV adapté à une offre ou une lettre personnalisée à partir de votre profil et de l'offre." },
    { icon: '📁', title: 'Gestion des documents', description: 'Uploadez vos CV et offres : analyse, extraction de texte et génération de lettres en un clic.' },
    { icon: '📤', title: 'Candidatures automatiques', description: "L'IA cherche des offres (stage, CDI, CDD, alternance) et envoie des candidatures pour vous, à votre rythme." },
    { icon: '📋', title: 'Suivi des candidatures', description: 'Centralisez vos postulations, statuts et notes pour ne rien oublier.' },
    { icon: '👔', title: 'Espace recruteur', description: 'Publiez des offres, envoyez des quiz aux candidats et comparez les profils.' }
  ]

  if (!isLoaded) return null

  return (
    <div className="page-root min-h-[100dvh] sm:min-h-screen bg-[#0d0d0d] overflow-hidden relative w-full">
      {/* Fond discret */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(0,122,255,0.06),transparent)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 section-container pt-4 sm:pt-6 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-base">CV</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">CareerAI</h1>
              <p className="text-[11px] sm:text-xs text-zinc-500">Assistant carrière · IA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm font-medium transition-colors rounded-xl hover:bg-white/[0.06]"
            >
              Connexion
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-4 py-2.5 sm:px-5 sm:py-2.5 bg-[#007AFF] text-white text-sm font-semibold rounded-xl hover:bg-[#0056b3] transition-colors"
            >
              Commencer
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 section-container section-spacing flex items-center justify-center min-h-[45vh] sm:min-h-[55vh]">
        <div className="max-w-4xl mx-auto text-center w-full">
          <p className="text-[#007AFF] font-medium text-xs sm:text-sm tracking-wide uppercase mb-4 sm:mb-6">
            Assistant carrière · CV, lettres, candidatures
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4 sm:mb-6">
            Un seul outil pour votre recherche d'emploi
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-8 sm:mb-10">
            Discutez avec l'IA, générez des CV et lettres personnalisés, uploadez vos documents, suivez vos candidatures et laissez l'IA postuler pour vous.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-6 py-3.5 sm:px-8 sm:py-4 bg-[#007AFF] text-white font-semibold rounded-xl hover:bg-[#0056b3] text-sm sm:text-base transition-colors"
            >
              Créer un compte gratuit
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-3.5 sm:px-8 sm:py-4 bg-white/[0.08] border border-white/[0.15] text-white font-semibold rounded-xl hover:bg-white/[0.12] text-sm sm:text-base transition-colors"
            >
              J'ai déjà un compte
            </button>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="relative z-10 section-container section-spacing border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">Comment ça marche ?</h3>
          <p className="text-zinc-400 text-center mb-10 sm:mb-14 max-w-xl mx-auto text-sm sm:text-base">
            Quatre étapes pour reprendre la main sur votre carrière.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-xl bg-white/[0.05] border border-white/[0.08] p-5 sm:p-6 text-center"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#007AFF]/20 border border-[#007AFF]/30 flex items-center justify-center text-[#007AFF] font-bold text-lg mx-auto mb-3">
                  {step.num}
                </div>
                <h4 className="text-white font-semibold mb-1.5 text-sm sm:text-base">{step.title}</h4>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="relative z-10 section-container section-spacing border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">Tout ce dont vous avez besoin</h3>
          <p className="text-zinc-400 text-center mb-10 sm:mb-12 text-sm sm:text-base">
            Une plateforme complète pour candidater sereinement.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl bg-white/[0.05] border border-white/[0.08] p-5 sm:p-6 hover:border-white/[0.12] transition-colors"
              >
                <span className="text-2xl sm:text-3xl mb-3 block">{f.icon}</span>
                <h4 className="text-white font-semibold mb-1.5 text-sm sm:text-base">{f.title}</h4>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 section-container section-spacing">
        <div className="max-w-2xl mx-auto text-center rounded-2xl bg-white/[0.05] border border-white/[0.08] p-8 sm:p-12">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Prêt à simplifier votre recherche d'emploi ?
          </h3>
          <p className="text-zinc-400 mb-6 sm:mb-8 text-sm sm:text-base">
            Rejoignez CareerAI : assistant IA, CV, lettres et candidatures automatiques en un seul endroit.
          </p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="px-8 py-4 bg-[#007AFF] text-white font-semibold rounded-xl hover:bg-[#0056b3] text-sm sm:text-base transition-colors"
          >
            Créer mon compte gratuit
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 section-container py-8 sm:py-10 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
              <span className="text-white font-bold text-xs">CV</span>
            </div>
            <span className="font-semibold text-white text-sm">CareerAI</span>
          </div>
          <p className="text-zinc-500 text-xs sm:text-sm text-center sm:text-left">
            Assistant carrière propulsé par l'IA · Données sécurisées
          </p>
          <div className="flex gap-6 text-xs sm:text-sm">
            <a href="/auth/login" className="text-zinc-400 hover:text-white transition-colors">Connexion</a>
            <a href="/auth/signup" className="text-zinc-400 hover:text-white transition-colors">Inscription</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
