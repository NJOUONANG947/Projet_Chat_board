'use client'

import { motion } from 'framer-motion'

export default function CareerResults({ results, onNewProfile }) {
  if (!results) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6 space-y-8"
    >
      <div className="flex justify-between items-center">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-gray-800"
        >
          Votre Profil Professionnel
        </motion.h2>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onNewProfile}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
        >
          Nouveau Profil
        </motion.button>
      </div>

      {/* CV Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 p-6"
      >
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
          📄 Curriculum Vitae
        </h3>
        <div className="prose prose-gray max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
            {results.cv}
          </pre>
        </div>
      </motion.div>

      {/* Letter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 p-6"
      >
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
          ✉️ Lettre de Motivation
        </h3>
        <div className="prose prose-gray max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
            {results.letter}
          </pre>
        </div>
      </motion.div>

      {/* Suggestions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 p-6"
      >
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
          💡 Conseils pour votre recherche
        </h3>
        <div className="prose prose-gray max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
            {results.suggestions}
          </pre>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-gray-500 text-sm"
      >
        Profil généré le {new Date(results.createdAt).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </motion.div>
    </motion.div>
  )
}
