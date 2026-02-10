'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
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
      if (session) {
        router.push('/')
      }
    }
    checkUser()

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [router, supabase])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  }

  const features = [
    {
      icon: "🤖",
      title: "IA Avancée",
      description: "Analyse intelligente de vos CV avec des suggestions personnalisées et optimisation automatique.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: "📊",
      title: "Matching Intelligent",
      description: "Comparez vos compétences aux offres d'emploi et obtenez un score de compatibilité précis.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: "✍️",
      title: "Rédaction Automatisée",
      description: "Générez des lettres de motivation et CV optimisés en quelques secondes avec l'IA.",
      gradient: "from-green-500 to-teal-500"
    },
    {
      icon: "📈",
      title: "Suivi de Carrière",
      description: "Suivez vos candidatures, analysez vos performances et planifiez votre évolution professionnelle.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: "🔒",
      title: "Sécurité Totale",
      description: "Vos données sont chiffrées et stockées en toute sécurité avec une confidentialité garantie.",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: "⚡",
      title: "Rapidité",
      description: "Obtenez des résultats instantanés grâce à notre technologie de traitement ultra-rapide.",
      gradient: "from-yellow-500 to-orange-500"
    }
  ]

  return (
    <AnimatePresence>
      {isLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative"
        >
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-purple-800/20"></div>

            {/* Floating Orbs */}
            <motion.div
              animate={{
                x: mousePosition.x * 0.02,
                y: mousePosition.y * 0.02,
              }}
              className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: mousePosition.x * -0.01,
                y: mousePosition.y * -0.01,
              }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            />
          </div>

          {/* Header */}
          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 p-6"
          >
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">CV</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">CareerAI</h1>
                  <p className="text-purple-200 text-sm">Assistant Carrière IA</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="hidden md:flex space-x-4"
              >
                <button
                  onClick={() => router.push('/auth/login')}
                  className="px-6 py-2 text-white hover:text-purple-300 transition-colors"
                >
                  Connexion
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/auth/signup')}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Commencer
                </motion.button>
              </motion.div>
            </div>
          </motion.header>

          {/* Hero Section */}
          <motion.section
            style={{ y }}
            className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-20"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-6xl mx-auto text-center"
            >
              <motion.div
                variants={itemVariants}
                className="mb-8"
              >
                <motion.div
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent text-sm font-semibold uppercase tracking-wider mb-4"
                >
                  🚀 Propulsé par l'IA de Nouvelle Génération
                </motion.div>

                <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
                  Révolutionnez
                  <motion.span
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                  >
                    Votre Carrière
                  </motion.span>
                </h1>

                <motion.p
                  variants={itemVariants}
                  className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
                >
                  Analysez vos CV, générez des lettres de motivation personnalisées,
                  suivez vos candidatures et optimisez votre recherche d'emploi avec
                  l'intelligence artificielle la plus avancée.
                </motion.p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-6 justify-center mb-20"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/auth/signup')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg text-lg"
                >
                  🚀 Commencer Gratuitement
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/auth/login')}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-lg"
                >
                  Se Connecter
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
              >
                {[
                  { number: "10K+", label: "CV Analysés" },
                  { number: "95%", label: "Taux de Succès" },
                  { number: "24/7", label: "Support IA" }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                  >
                    <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                    <div className="text-purple-200">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Features Section */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative z-10 py-20 px-4"
          >
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Fonctionnalités
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    Révolutionnaires
                  </span>
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Découvrez comment notre IA transforme votre approche de la recherche d'emploi
                </p>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
                    }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/30 transition-all group"
                  >
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="text-4xl mb-4"
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                    <motion.div
                      className={`w-full h-1 bg-gradient-to-r ${feature.gradient} rounded-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity`}
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative z-10 py-20 px-4"
          >
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-3xl p-12 border border-white/20"
              >
                <h2 className="text-4xl font-bold text-white mb-6">
                  Prêt à Booster Votre Carrière ?
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Rejoignez des milliers de professionnels qui ont transformé leur recherche d'emploi avec CareerAI
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/auth/signup')}
                  className="px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg text-xl"
                >
                  🚀 Créer Mon Compte Gratuit
                </motion.button>
              </motion.div>
            </div>
          </motion.section>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative z-10 py-12 px-4 border-t border-white/10"
          >
            <div className="max-w-7xl mx-auto text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CV</span>
                </div>
                <span className="text-xl font-bold text-white">CareerAI</span>
              </div>
              <p className="text-gray-400 mb-4">
                Propulsé par l'IA • Sécurisé et Confidentiel • Support 24/7
              </p>
              <div className="flex justify-center space-x-6 text-sm text-gray-500">
                <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
                <a href="#" className="hover:text-white transition-colors">Conditions</a>
                <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
            </div>
          </motion.footer>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
