'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import { HeroIllustration, FeatureIcon } from './WelcomeIllustrations'
import { useLanguage } from '../../frontend/contexts/LanguageContext'
import LanguageSwitcher from '../../frontend/components/LanguageSwitcher'

export default function WelcomePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoaded, setIsLoaded] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setIsLoaded(true)
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.push('/')
    }
    checkUser()
  }, [router, supabase])

  const steps = [
    { num: '1', titleKey: 'step1Title', descKey: 'step1Desc' },
    { num: '2', titleKey: 'step2Title', descKey: 'step2Desc' },
    { num: '3', titleKey: 'step3Title', descKey: 'step3Desc' },
    { num: '4', titleKey: 'step4Title', descKey: 'step4Desc' },
  ]

  const features = [
    { icon: 'chat', titleKey: 'featureChatTitle', descKey: 'featureChatDesc' },
    { icon: 'document', titleKey: 'featureDocTitle', descKey: 'featureDocDesc' },
    { icon: 'folder', titleKey: 'featureFolderTitle', descKey: 'featureFolderDesc' },
    { icon: 'send', titleKey: 'featureSendTitle', descKey: 'featureSendDesc' },
    { icon: 'checklist', titleKey: 'featureChecklistTitle', descKey: 'featureChecklistDesc' },
    { icon: 'briefcase', titleKey: 'featureBriefcaseTitle', descKey: 'featureBriefcaseDesc' },
  ]

  const avis = [
    { name: 'Marie L.', roleKey: 'role1', quoteKey: 'quote1', rating: 5 },
    { name: 'Thomas B.', roleKey: 'role2', quoteKey: 'quote2', rating: 5 },
    { name: 'Sophie M.', roleKey: 'role3', quoteKey: 'quote3', rating: 5 },
  ]

  if (!isLoaded) return null

  return (
    <div className="flex-1 min-h-0 flex flex-col page-root min-h-[100dvh] sm:min-h-screen bg-[#0d0d0d] overflow-x-hidden overflow-y-auto relative w-full">
      {/* Fond sobre — léger dégradé sans glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(0,122,255,0.04),transparent_70%)] pointer-events-none" />

      {/* Header — sobre, aligné */}
      <header className="relative z-10 section-container pt-4 sm:pt-5 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between max-w-4xl mx-auto gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs sm:text-sm">CV</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">{t.common.careerAI}</h1>
              <p className="text-[10px] sm:text-xs text-zinc-500 truncate">{t.common.careerAssistant}</p>
            </div>
            {/* Mobile: switch langue en zone secondaire (à côté du logo, pas avec les CTA) */}
            <div className="ml-auto md:ml-0 md:order-last">
              <LanguageSwitcher />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push('/auth/login')}
              className="px-3 py-2 sm:px-4 sm:py-2.5 text-zinc-500 hover:text-zinc-300 text-xs sm:text-sm font-medium transition-colors duration-200 rounded-lg hover:bg-white/[0.04] min-h-[40px] sm:min-h-0"
            >
              {t.common.login}
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-4 py-2.5 bg-[#007AFF] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#0062cc] transition-colors duration-200 min-h-[40px] sm:min-h-0"
            >
              {t.common.getStarted}
            </button>
          </div>
        </div>
      </header>

      {/* Hero — 1 message, 1 CTA dominant, fade-in unique */}
      <section className="relative z-10 section-container pt-12 sm:pt-16 pb-12 sm:pb-20 flex items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl mx-auto text-center"
        >
          <div className="mb-6 flex justify-center">
            <HeroIllustration />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white tracking-tight leading-snug mb-3">
            {t.welcome.heroTitle}
          </h2>
          <p className="text-sm sm:text-base text-zinc-500 max-w-md mx-auto mb-8 leading-relaxed">
            {t.welcome.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => router.push('/auth/signup')}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-[#007AFF] text-white font-semibold rounded-xl hover:bg-[#0062cc] text-sm transition-colors duration-200"
            >
              {t.welcome.getStarted}
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors duration-200"
            >
              {t.welcome.alreadyHaveAccount}
            </button>
          </div>
        </motion.div>
      </section>

      {/* Comment ça marche */}
      <section className="relative z-10 section-container section-spacing border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-base sm:text-xl font-semibold text-white mb-2">
            {t.welcome.howItWorks}
          </h3>
          <p className="text-zinc-500 text-sm mb-8 max-w-md mx-auto">
            {t.welcome.howItWorksSub}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10px' }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4 sm:p-5 flex flex-col items-center text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-center text-[#007AFF] font-semibold text-sm mb-2.5 shrink-0">
                  {step.num}
                </div>
                <h4 className="text-white font-medium mb-1.5 text-sm w-full">{t.welcome[step.titleKey]}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-[220px] mx-auto">{t.welcome[step.descKey]}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="relative z-10 section-container section-spacing border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-base sm:text-xl font-semibold text-white mb-2">
            {t.welcome.featuresTitle}
          </h3>
          <p className="text-zinc-500 text-sm mb-8">
            {t.welcome.featuresSub}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, index) => (
              <motion.div
                key={f.titleKey}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10px' }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4 sm:p-5 flex flex-col items-center text-center transition-colors duration-200 hover:border-white/[0.08]"
              >
                <FeatureIcon name={f.icon} index={index} className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.06] text-zinc-400 mb-2.5 shrink-0" />
                <h4 className="text-white font-medium mb-1.5 text-sm w-full">{t.welcome[f.titleKey]}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-[260px] mx-auto">{t.welcome[f.descKey]}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Avis — témoignages réels */}
      <section id="avis" className="relative z-10 section-container section-spacing border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-base sm:text-xl font-semibold text-white mb-2">
            {t.welcome.testimonialsTitle}
          </h3>
          <p className="text-zinc-500 text-sm mb-8 max-w-md mx-auto">
            {t.welcome.testimonialsSub}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {avis.map((a, i) => (
              <motion.article
                key={a.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10px' }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 sm:p-5 flex flex-col items-center text-center hover:border-white/[0.08] transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-[#007AFF]/15 border border-[#007AFF]/25 flex items-center justify-center text-[#007AFF] font-semibold text-sm mb-3 shrink-0">
                  {a.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex gap-0.5 mb-2" aria-label={`${a.rating} sur 5`}>
                  {Array.from({ length: 5 }).map((_, k) => (
                    <span key={k} className="text-amber-400/90 text-xs">★</span>
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-3 flex-1">&ldquo;{t.welcome[a.quoteKey]}&rdquo;</p>
                <p className="text-white font-medium text-sm">{a.name}</p>
                <p className="text-zinc-500 text-xs">{t.welcome[a.roleKey]}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 section-container section-spacing">
        <div className="max-w-lg mx-auto text-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-10">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
            {t.welcome.ctaTitle}
          </h3>
          <p className="text-zinc-500 mb-6 text-sm max-w-sm mx-auto">
            {t.welcome.ctaSub}
          </p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="min-h-[44px] px-6 py-3 bg-[#007AFF] text-white font-semibold rounded-lg hover:bg-[#0062cc] text-sm transition-colors duration-200"
          >
            {t.welcome.ctaButton}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 section-container py-6 sm:py-8 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
              <span className="text-white font-bold text-xs">CV</span>
            </div>
            <span className="font-medium text-white text-sm">CareerAI</span>
          </div>
          <p className="text-zinc-500 text-xs text-center sm:text-left">
            {t.welcome.footerTagline}
          </p>
          <div className="flex gap-5 text-xs">
            <a href="/auth/login" className="text-zinc-500 hover:text-zinc-300 transition-colors duration-200">{t.common.login}</a>
            <a href="/auth/signup" className="text-zinc-500 hover:text-zinc-300 transition-colors duration-200">{t.common.signup}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
