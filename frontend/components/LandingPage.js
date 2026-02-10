import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: '📄',
      title: 'CV IA Intelligent',
      description: 'Générez des CV professionnels adaptés à votre secteur et au poste visé'
    },
    {
      icon: '🎨',
      title: 'Thèmes Professionnels',
      description: 'Choisissez parmi plusieurs styles : classique, moderne, minimal, créatif'
    },
    {
      icon: '📤',
      title: 'Analyse de Documents',
      description: 'Téléchargez vos CV existants et offres d\'emploi pour une analyse IA'
    },
    {
      icon: '🚀',
      title: 'Optimisation Carrière',
      description: 'Conseils personnalisés pour booster votre recherche d\'emploi'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-800">CV Assistant IA</div>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/auth/login')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Connexion
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              S'inscrire
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Créez le CV de vos
            <span className="text-blue-600"> Rêves</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Utilisez l'intelligence artificielle pour générer des CV professionnels,
            analyser vos documents et optimiser votre recherche d'emploi.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/auth/signup')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105"
            >
              Commencer Gratuitement
            </button>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 transition-colors">
              En savoir plus
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Fonctionnalités Puissantes
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Notre assistant IA vous accompagne à chaque étape de votre recherche d'emploi
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à Révolutionner Votre Recherche d'Emploi ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez des milliers de professionnels qui ont boosté leur carrière
          </p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Créer mon Compte
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">CV Assistant IA</div>
            <p className="text-gray-400">
              © 2024 CV Assistant IA. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
