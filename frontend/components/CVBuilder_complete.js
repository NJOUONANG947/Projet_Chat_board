'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CVBuilder({ onSave, onCancel }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [cvData, setCvData] = useState({
    personal: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      website: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    template: 'modern'
  })

  const steps = [
    { id: 'personal', title: 'Informations Personnelles', icon: '👤' },
    { id: 'summary', title: 'Résumé Professionnel', icon: '📝' },
    { id: 'experience', title: 'Expérience', icon: '💼' },
    { id: 'education', title: 'Formation', icon: '🎓' },
    { id: 'skills', title: 'Compétences', icon: '🛠️' },
    { id: 'languages', title: 'Langues', icon: '🌍' },
    { id: 'template', title: 'Modèle', icon: '🎨' },
    { id: 'preview', title: 'Aperçu', icon: '👁️' }
  ]

  const templates = [
    { id: 'classic', name: 'Classique', description: 'Modèle traditionnel et professionnel' },
    { id: 'modern', name: 'Moderne', description: 'Design contemporain et épuré' },
    { id: 'minimal', name: 'Minimal', description: 'Style simple et élégant' },
    { id: 'creative', name: 'Créatif', description: 'Modèle original et dynamique' }
  ]

  const updateCvData = (section, data) => {
    setCvData(prev => ({
      ...prev,
      [section]: data
    }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSave = () => {
    onSave(cvData)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Info
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Informations Personnelles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  value={cvData.personal.firstName}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={cvData.personal.lastName}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={cvData.personal.email}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="votre.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={cvData.personal.phone}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+33 6 XX XX XX XX"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input
                  type="text"
                  value={cvData.personal.address}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Rue de la Paix, 75001 Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={cvData.personal.linkedin}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, linkedin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://linkedin.com/in/votreprofil"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Web</label>
                <input
                  type="url"
                  value={cvData.personal.website}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://votresite.com"
                />
              </div>
            </div>
          </div>
        )

      case 1: // Summary
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Résumé Professionnel</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rédigez un résumé accrocheur de vos compétences et expériences (3-5 phrases)
              </label>
              <textarea
                value={cvData.summary}
                onChange={(e) => updateCvData('summary', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Professionnel expérimenté en... Passionné par... Spécialisé dans..."
              />
            </div>
          </div>
        )

      case 2: // Experience
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Expérience Professionnelle</h2>
            <div className="space-y-4">
              {cvData.experience.map((exp, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Poste occupé"
                      value={exp.position}
                      onChange={(e) => {
                        const newExp = [...cvData.experience]
                        newExp[index].position = e.target.value
                        updateCvData('experience', newExp)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Entreprise"
                      value={exp.company}
                      onChange={(e) => {
                        const newExp = [...cvData.experience]
                        newExp[index].company = e.target.value
                        updateCvData('experience', newExp)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Période (ex: 2020 - 2023)"
                      value={exp.period}
                      onChange={(e) => {
                        const newExp = [...cvData.experience]
                        newExp[index].period = e.target.value
                        updateCvData('experience', newExp)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Lieu"
                      value={exp.location}
                      onChange={(e) => {
                        const newExp = [...cvData.experience]
                        newExp[index].location = e.target.value
                        updateCvData('experience', newExp)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <textarea
                    placeholder="Description des missions et responsabilités"
                    value={exp.description}
                    onChange={(e) => {
                      const newExp = [...cvData.experience]
                      newExp[index].description = e.target.value
                      updateCvData('experience', newExp)
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      const newExp = cvData.experience.filter((_, i) => i !== index)
                      updateCvData('experience', newExp)
                    }}
                    className="mt-2 px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  updateCvData('experience', [...cvData.experience, {
                    position: '',
                    company: '',
                    period: '',
                    location: '',
                    description: ''
                  }])
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                + Ajouter une expérience
              </button>
            </div>
          </div>
        )

      case 3: // Education
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Formation</h2>
            <div className="space-y-4">
              {cvData.education.map((edu, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Diplôme obtenu"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEdu = [...cvData.education]
                        newEdu[index].degree = e.target.value
                        updateCvData('education', newEdu)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Établissement"
                      value={edu.school}
                      onChange={(e) => {
                        const newEdu = [...cvData.education]
                        newEdu[index].school = e.target.value
                        updateCvData('education', newEdu)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Année d'obtention"
                      value={edu.year}
                      onChange={(e) => {
                        const newEdu = [...cvData.education]
                        newEdu[index].year = e.target.value
                        updateCvData('education', newEdu)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Lieu"
                      value={edu.location}
                      onChange={(e) => {
                        const newEdu = [...cvData.education]
                        newEdu[index].location = e.target.value
                        updateCvData('education', newEdu)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newEdu = cvData.education.filter((_, i) => i !== index)
                      updateCvData('education', newEdu)
                    }}
                    className="mt-2 px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  updateCvData('education', [...cvData.education, {
                    degree: '',
                    school: '',
                    year: '',
                    location: ''
                  }])
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                + Ajouter une formation
              </button>
            </div>
          </div>
        )

      case 4: // Skills
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Compétences</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listez vos compétences (séparées par des virgules)
              </label>
              <textarea
                value={cvData.skills.join(', ')}
                onChange={(e) => updateCvData('skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="JavaScript, React, Node.js, Python, SQL, Git..."
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {cvData.skills.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )

      case 5: // Languages
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Langues</h2>
            <div className="space-y-4">
              {cvData.languages.map((lang, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <input
                    type="text"
                    placeholder="Langue"
                    value={lang.name}
                    onChange={(e) => {
                      const newLang = [...cvData.languages]
                      newLang[index].name = e.target.value
                      updateCvData('languages', newLang)
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={lang.level}
                    onChange={(e) => {
                      const newLang = [...cvData.languages]
                      newLang[index].level = e.target.value
                      updateCvData('languages', newLang)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Niveau</option>
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                    <option value="Courant">Courant</option>
                    <option value="Langue maternelle">Langue maternelle</option>
                  </select>
                  <button
                    onClick={() => {
                      const newLang = cvData.languages.filter((_, i) => i !== index)
                      updateCvData('languages', newLang)
                    }}
                    className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  updateCvData('languages', [...cvData.languages, { name: '', level: '' }])
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                + Ajouter une langue
              </button>
            </div>
          </div>
        )

      case 6: // Template
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Choisissez un modèle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => updateCvData('template', template.id)}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    cvData.template === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 7: // Preview
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Aperçu de votre CV</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-4xl mx-auto">
              {/* CV Preview */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">
                  {cvData.personal.firstName} {cvData.personal.lastName}
                </h1>
                <div className="mt-4 space-y-1 text-gray-600">
                  {cvData.personal.email && <p>📧 {cvData.personal.email}</p>}
                  {cvData.personal.phone && <p>📱 {cvData.personal.phone}</p>}
                  {cvData.personal.address && <p>📍 {cvData.personal.address}</p>}
                </div>
              </div>

              {cvData.summary && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-1">
                    PROFIL PROFESSIONNEL
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{cvData.summary}</p>
                </div>
              )}

              {cvData.experience.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-1">
                    EXPÉRIENCE PROFESSIONNELLE
                  </h3>
                  <div className="space-y-4">
                    {cvData.experience.map((exp, index) => (
                      <div key={index}>
                        <h4 className="font-semibold text-gray-800">{exp.position}</h4>
                        <p className="text-blue-600">{exp.company} • {exp.period}</p>
                        {exp.location && <p className="text-gray-600">{exp.location}</p>}
                        {exp.description && <p className="text-gray-700 mt-2">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cvData.education.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-1">
                    FORMATION
                  </h3>
                  <div className="space-y-2">
                    {cvData.education.map((edu, index) => (
                      <div key={index} className="flex justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">{edu.degree}</h4>
                          <p className="text-gray-600">{edu.school}</p>
                          {edu.location && <p className="text-gray-600">{edu.location}</p>}
                        </div>
                        <span className="text-blue-600">{edu.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cvData.skills.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-1">
                    COMPÉTENCES
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {cvData.skills.map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {cvData.languages.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-1">
                    LANGUES
                  </h3>
                  <div className="space-y-1">
                    {cvData.languages.map((lang, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-800">{lang.name}</span>
                        <span className="text-gray-600">{lang.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Créateur de CV</h1>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index < currentStep ? '✓' : step.icon}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Précédent
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Sauvegarder le CV
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
