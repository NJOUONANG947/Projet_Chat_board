'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api.js'

export default function ApplicationTracker({ onClose }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingApplication, setEditingApplication] = useState(null)
  const [formData, setFormData] = useState({
    company_name: '',
    position_title: '',
    job_description: '',
    application_status: 'applied',
    applied_date: '',
    notes: '',
    cv_id: ''
  })
  const [cvs, setCvs] = useState([])

  useEffect(() => {
    fetchApplications()
    fetchCVs()
  }, [])

  const fetchApplications = async () => {
    try {
      const data = await api.getApplications()
      setApplications(data.applications || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCVs = async () => {
    try {
      const data = await api.getCVs()
      setCvs(data.cvs || [])
    } catch (error) {
      console.error('Error fetching CVs:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingApplication) {
        await api.updateApplication(editingApplication.id, formData)
        alert('Candidature mise à jour!')
      } else {
        await api.saveApplication(formData)
        alert('Candidature ajoutée!')
      }

      await fetchApplications()
      resetForm()
    } catch (error) {
      console.error('Save error:', error)
      alert('Erreur lors de la sauvegarde: ' + error.message)
    }
  }

  const handleEdit = (application) => {
    setEditingApplication(application)
    setFormData({
      company_name: application.company_name,
      position_title: application.position_title,
      job_description: application.job_description || '',
      application_status: application.application_status,
      applied_date: application.applied_date || '',
      notes: application.notes || '',
      cv_id: application.cv_id || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette candidature?')) return

    try {
      await api.deleteApplication(id)
      await fetchApplications()
      alert('Candidature supprimée!')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Erreur lors de la suppression: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      company_name: '',
      position_title: '',
      job_description: '',
      application_status: 'applied',
      applied_date: '',
      notes: '',
      cv_id: ''
    })
    setEditingApplication(null)
    setShowForm(false)
  }

  const getStatusColor = (status) => {
    const colors = {
      saved: 'bg-gray-100 text-gray-800',
      applied: 'bg-blue-100 text-blue-800',
      interview: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      accepted: 'bg-green-100 text-green-800'
    }
    return colors[status] || colors.applied
  }

  const getStatusLabel = (status) => {
    const labels = {
      saved: 'Sauvegardé',
      applied: 'Candidature envoyée',
      interview: 'Entretien',
      rejected: 'Refusé',
      accepted: 'Accepté'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="application-tracker max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement des candidatures...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="application-tracker max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Suivi des Candidatures</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Nouvelle Candidature
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Retour au Chat
            </button>
          </div>
        </div>
        <p className="text-gray-600 mt-2">Suivez vos candidatures et leur évolution</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Mes Candidatures</h2>

            {applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune candidature enregistrée</p>
                <p className="text-sm">Cliquez sur "Nouvelle Candidature" pour commencer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{app.position_title}</h3>
                        <p className="text-gray-600">{app.company_name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.application_status)}`}>
                        {getStatusLabel(app.application_status)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>
                        {app.applied_date
                          ? new Date(app.applied_date).toLocaleDateString('fr-FR')
                          : new Date(app.created_at).toLocaleDateString('fr-FR')
                        }
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(app)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>

                    {app.notes && (
                      <p className="text-sm text-gray-600 mt-2 truncate">{app.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Add/Edit Form */}
        <div className="lg:col-span-1">
          {showForm && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingApplication ? 'Modifier Candidature' : 'Nouvelle Candidature'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entreprise *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poste *
                  </label>
                  <input
                    type="text"
                    value={formData.position_title}
                    onChange={(e) => setFormData({...formData, position_title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.application_status}
                    onChange={(e) => setFormData({...formData, application_status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="saved">Sauvegardé</option>
                    <option value="applied">Candidature envoyée</option>
                    <option value="interview">Entretien</option>
                    <option value="rejected">Refusé</option>
                    <option value="accepted">Accepté</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de candidature
                  </label>
                  <input
                    type="date"
                    value={formData.applied_date}
                    onChange={(e) => setFormData({...formData, applied_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CV utilisé
                  </label>
                  <select
                    value={formData.cv_id}
                    onChange={(e) => setFormData({...formData, cv_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un CV</option>
                    {cvs.map((cv) => (
                      <option key={cv.id} value={cv.id}>{cv.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description du poste
                  </label>
                  <textarea
                    value={formData.job_description}
                    onChange={(e) => setFormData({...formData, job_description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Description du poste, exigences, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Vos notes personnelles..."
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingApplication ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
