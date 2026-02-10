'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CareerForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    education: '',
    experiences: '',
    skills: '',
    targetPosition: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.education || !formData.experiences || !formData.skills || !formData.targetPosition) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    onSubmit(formData)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto p-6 bg-white/80 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50"
    >
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-gray-800 mb-6 text-center"
      >
        Assistant de Carrière
      </motion.h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom (optionnel)
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            placeholder="Votre nom"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Formation <span className="text-red-500">*</span>
          </label>
          <textarea
            name="education"
            value={formData.education}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
            placeholder="Décrivez votre formation (diplômes, certifications, etc.)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expériences professionnelles <span className="text-red-500">*</span>
          </label>
          <textarea
            name="experiences"
            value={formData.experiences}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
            placeholder="Décrivez vos expériences professionnelles (postes, entreprises, responsabilités)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compétences <span className="text-red-500">*</span>
          </label>
          <textarea
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
            placeholder="Listez vos compétences techniques et soft skills"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Poste ou domaine visé <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="targetPosition"
            value={formData.targetPosition}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            placeholder="Ex: Développeur Full Stack, Chef de projet, etc."
            required
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-lg transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl"
        >
          {loading ? 'Génération en cours...' : 'Générer mon profil professionnel'}
        </motion.button>
      </form>
    </motion.div>
  )
}
