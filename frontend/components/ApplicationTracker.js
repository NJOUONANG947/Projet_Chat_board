'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api.js'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { useLanguage } from '../contexts/LanguageContext'
import { logger } from '../lib/logger'

export default function ApplicationTracker({ onClose }) {
  const toast = useToast()
  const confirm = useConfirm()
  const { t, lang } = useLanguage()
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
      logger.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCVs = async () => {
    try {
      const data = await api.getCVs()
      setCvs(data.cvs || [])
    } catch (error) {
      logger.error('Error fetching CVs:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingApplication) {
        await api.updateApplication(editingApplication.id, formData)
        toast.success(t.tracker.saveSuccess)
      } else {
        await api.saveApplication(formData)
        toast.success(t.tracker.addSuccess)
      }

      await fetchApplications()
      resetForm()
    } catch (error) {
      logger.error('Save error:', error)
      toast.error(t.tracker.saveError + ': ' + (error?.message || ''))
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
    const ok = await confirm({ title: t.tracker.confirmDeleteTitle, message: t.tracker.confirmDeleteMessage, confirmLabel: t.tracker.delete, danger: true })
    if (!ok) return
    try {
      await api.deleteApplication(id)
      await fetchApplications()
      toast.success(t.tracker.deleteSuccess)
    } catch (error) {
      logger.error('Delete error:', error)
      toast.error(t.tracker.deleteError + ': ' + (error?.message || ''))
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
      saved: 'bg-white/5 text-gray-200 border border-white/10',
      applied: 'bg-blue-500/15 text-blue-200 border border-blue-500/25',
      interview: 'bg-zinc-600/50 text-zinc-200 border border-zinc-500/40',
      rejected: 'bg-zinc-700/50 text-zinc-200 border border-zinc-600/40',
      accepted: 'bg-blue-900/30 text-blue-200 border border-blue-800/40'
    }
    return colors[status] || colors.applied
  }

  const getStatusLabel = (status) => {
    const labels = {
      saved: t.tracker.statusSaved,
      applied: t.tracker.statusApplied,
      interview: t.tracker.statusInterview,
      rejected: t.tracker.statusRejected,
      accepted: t.tracker.statusAccepted
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="page-root min-h-screen flex items-center justify-center w-full">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-gray-300 mt-4">{t.tracker.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-root application-tracker w-full max-w-6xl mx-auto p-0 box-border">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t.tracker.title}</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary px-4 py-2 !rounded-lg !shadow-none !transform-none hover:!scale-100"
            >
              + {t.tracker.newApplication}
            </button>
            <button
              onClick={onClose}
              className="btn-secondary px-4 py-2 !rounded-lg"
            >
              {t.app.backToChat}
            </button>
          </div>
        </div>
        <p className="text-gray-300 mt-2">{t.tracker.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">{t.tracker.myApplications}</h2>

            {applications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>{t.tracker.noApplications}</p>
                <p className="text-sm">{t.tracker.clickNewToStart}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-white/10 rounded-xl p-4 bg-black/10 hover:bg-black/15 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{app.position_title}</h3>
                        <p className="text-gray-300">{app.company_name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.application_status)}`}>
                        {getStatusLabel(app.application_status)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>
                        {app.applied_date
                          ? new Date(app.applied_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')
                          : new Date(app.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')
                        }
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(app)}
                          className="text-blue-300 hover:text-blue-200"
                        >
                          ✏️ {t.tracker.edit}
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="text-zinc-400 hover:text-zinc-200"
                        >
                          🗑️ {t.tracker.delete}
                        </button>
                      </div>
                    </div>

                    {app.notes && (
                      <p className="text-sm text-gray-300 mt-2 truncate">{app.notes}</p>
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
              className="glass-card p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {editingApplication ? t.tracker.formTitleEdit : t.tracker.formTitleNew}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    {t.tracker.companyLabel}
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    className="input-readable w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    {t.tracker.positionLabel}
                  </label>
                  <input
                    type="text"
                    value={formData.position_title}
                    onChange={(e) => setFormData({...formData, position_title: e.target.value})}
                    className="input-readable w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    {t.tracker.statusLabel}
                  </label>
                  <select
                    value={formData.application_status}
                    onChange={(e) => setFormData({...formData, application_status: e.target.value})}
                    className="input-readable w-full"
                  >
                    <option value="saved">{t.tracker.statusSaved}</option>
                    <option value="applied">{t.tracker.statusApplied}</option>
                    <option value="interview">{t.tracker.statusInterview}</option>
                    <option value="rejected">{t.tracker.statusRejected}</option>
                    <option value="accepted">{t.tracker.statusAccepted}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    {t.tracker.dateLabel}
                  </label>
                  <input
                    type="date"
                    value={formData.applied_date}
                    onChange={(e) => setFormData({...formData, applied_date: e.target.value})}
                    className="input-readable w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    {t.tracker.cvUsedLabel}
                  </label>
                  <select
                    value={formData.cv_id}
                    onChange={(e) => setFormData({...formData, cv_id: e.target.value})}
                    className="input-readable w-full"
                  >
                    <option value="">{t.tracker.selectCV}</option>
                    {cvs.map((cv) => (
                      <option key={cv.id} value={cv.id}>{cv.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    {t.tracker.jobDescLabel}
                  </label>
                  <textarea
                    value={formData.job_description}
                    onChange={(e) => setFormData({...formData, job_description: e.target.value})}
                    rows={3}
                    className="input-readable w-full resize-none"
                    placeholder={t.tracker.jobDescPlaceholder}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    {t.tracker.notesLabel}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    className="input-readable w-full resize-none"
                    placeholder={t.tracker.notesPlaceholder}
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 btn-primary !py-2 !px-4 !rounded-md !shadow-none !transform-none hover:!scale-100"
                  >
                    {editingApplication ? t.tracker.update : t.tracker.add}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary px-4 py-2 !rounded-md"
                  >
                    {t.common.cancel}
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
