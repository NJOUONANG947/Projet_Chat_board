'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function WelcomePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  useEffect(() => {
    setIsLoaded(true)
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.push('/')
    }
    checkUser()
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [router, supabase])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 }
    }
  }
  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 12 } }
  }

  const steps = [
    { num: '1', title: 'Créez votre compte', desc: 'Inscription gratuite en quelques secondes.' },
    { num: '2', title: 'Discutez avec l’assistant IA', desc: 'Posez vos questions carrière, uploadez votre CV ou une offre pour obtenir conseils et lettres.' },
    { num: '3', title: 'Générez CV et lettres', desc: 'Créez un CV à partir d’une offre, ou une lettre de motivation personnalisée à partir de vos documents.' },
    { num: '4', title: 'Suivez et automatisez', desc: 'Suivez vos candidatures et lancez des campagnes pour que l’IA postule pour vous (stages, CDI, CDD).' }
  ]

  const features = [
    { icon: '💬', title: 'Assistant carrière IA', description: 'Un chat intelligent pour vos questions emploi, conseils CV et préparation aux entretiens.' },
    { icon: '📄', title: 'CV et lettres de motivation', description: 'Générez un CV adapté à une offre ou une lettre personnalisée à partir de votre profil et de l’offre.' },
    { icon: '📁', title: 'Gestion des documents', description: 'Uploadez vos CV et offres : analyse, extraction de texte et génération de lettres en un clic.' },
    { icon: '📤', title: 'Candidatures automatiques', description: 'L’IA cherche des offres (stage, CDI, CDD, alternance) et envoie des candidatures pour vous, à votre rythme.' },
    { icon: '📋', title: 'Suivi des candidatures', description: 'Centralisez vos postulations, statuts et notes pour ne rien oublier.' },
    { icon: '👔', title: 'Espace recruteur', description: 'Publiez des offres, envoyez des quiz aux candidats et comparez les profils.' }
  ]

  return (
    isLoaded && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-zinc-950 overflow-hidden relative"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <motion.div animate={{ x: mousePosition.x * 0.02, y: mousePosition.y * 0.02 }} className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-900/30 rounded-full blur-3xl" />
          <motion.div animate={{ x: mousePosition.x * -0.01, y: mousePosition.y * -0.01 }} className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl" />
        </div>

        <motion.header initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900/80 rounded-xl flex items-center justify-center border border-blue-800/50">
                <span className="text-white font-bold text-lg">CV</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CareerAI</h1>
                <p className="text-blue-200/90 text-sm">Assistant carrière propulsé par l’IA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/auth/login')} className="px-5 py-2.5 text-zinc-300 hover:text-white transition-colors font-medium">Connexion</button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/auth/signup')} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 border border-blue-500/50 transition-colors">Commencer gratuitement</motion.button>
            </div>
          </div>
        </motion.header>

        <motion.section style={{ y }} className="relative z-10 flex items-center justify-center min-h-[85vh] px-4 pt-12 pb-20">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto text-center">
            <motion.p variants={itemVariants} className="text-blue-200 font-medium uppercase tracking-wider text-sm mb-4">Assistant carrière · CV, lettres, candidatures</motion.p>
            <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Un seul outil pour <span className="block text-blue-200 mt-2">votre recherche d’emploi</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
              Discutez avec l’IA, générez des CV et lettres personnalisés, uploadez vos documents, suivez vos candidatures et laissez l’IA postuler pour vous sur des offres réelles (stages, CDI, CDD).
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/auth/signup')} className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl border border-blue-500/50 hover:bg-blue-500 transition-colors">Créer un compte gratuit</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/auth/login')} className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/15 transition-colors">J’ai déjà un compte</motion.button>
            </motion.div>
          </motion.div>
        </motion.section>

        <section className="relative z-10 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-bold text-white text-center mb-4">Comment ça marche ?</motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">Quatre étapes pour reprendre la main sur votre carrière.</motion.p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <motion.div key={step.num} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-900/50 border border-blue-800/50 flex items-center justify-center text-blue-200 font-bold text-lg mx-auto mb-4">{step.num}</div>
                  <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                  <p className="text-zinc-400 text-sm">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="relative z-10 py-20 px-4 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-bold text-white text-center mb-4">Tout ce dont vous avez besoin</motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-zinc-400 text-center mb-14">Une plateforme complète pour candidater sereinement.</motion.p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                  <span className="text-3xl mb-3 block">{f.icon}</span>
                  <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 py-24 px-4">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center bg-blue-900/20 backdrop-blur border border-blue-800/30 rounded-3xl p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Prêt à simplifier votre recherche d’emploi ?</h2>
            <p className="text-zinc-400 mb-8">Rejoignez CareerAI : assistant IA, CV, lettres et candidatures automatiques en un seul endroit.</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/auth/signup')} className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-xl border border-blue-500/50 hover:bg-blue-500 transition-colors">Créer mon compte gratuit</motion.button>
          </motion.div>
        </section>

        <footer className="relative z-10 py-10 px-4 border-t border-white/10">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-900/80 rounded-lg flex items-center justify-center border border-blue-800/50"><span className="text-white font-bold text-sm">CV</span></div>
              <span className="font-bold text-white">CareerAI</span>
            </div>
            <p className="text-zinc-500 text-sm">Assistant carrière propulsé par l’IA · Données sécurisées</p>
            <div className="flex gap-6 text-sm">
              <a href="/auth/login" className="text-zinc-400 hover:text-white transition-colors">Connexion</a>
              <a href="/auth/signup" className="text-zinc-400 hover:text-white transition-colors">Inscription</a>
            </div>
          </div>
        </footer>
      </motion.div>
    )
  )
}
