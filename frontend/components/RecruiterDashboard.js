'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import QuizPreview from './QuizPreview'

/**
 * Dashboard Recruteur - Interface principale pour gérer les candidats et postes
 * 
 * Fonctionnalités :
 * - Créer et gérer les postes
 * - Ajouter des candidats et analyser leurs CV
 * - Générer des quiz personnalisés
 * - Classer les candidats automatiquement
 * - Visualiser les scores de pertinence
 */
export default function RecruiterDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState('jobs') // 'jobs', 'candidates', 'quizzes', 'rankings'
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [rankings, setRankings] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [previewQuiz, setPreviewQuiz] = useState(null)

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    if (activeTab === 'quizzes') loadQuizzes()
  }, [activeTab])

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/recruiter/job-postings', { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur chargement postes')
      setJobs(data.jobPostings || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
      setJobs([])
    }
  }

  const loadQuizzes = async () => {
    try {
      const response = await fetch('/api/recruiter/quizzes', { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur chargement quiz')
      setQuizzes(data.quizzes || [])
    } catch (error) {
      console.error('Error loading quizzes:', error)
      setQuizzes([])
    }
  }

  const loadCandidates = async (jobPostingId = null) => {
    try {
      const url = jobPostingId 
        ? `/api/recruiter/candidates?jobPostingId=${jobPostingId}`
        : '/api/recruiter/candidates'
      const response = await fetch(url, { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur chargement candidats')
      setCandidates(data.candidates || [])
    } catch (error) {
      console.error('Error loading candidates:', error)
      setCandidates([])
    }
  }

  const loadRankings = async (jobPostingId) => {
    if (!jobPostingId) return
    try {
      const response = await fetch(`/api/recruiter/rankings?jobPostingId=${jobPostingId}`, { credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur chargement classement')
      setRankings(prev => ({ ...prev, [jobPostingId]: data.rankings || [] }))
    } catch (error) {
      console.error('Error loading rankings:', error)
      setRankings(prev => ({ ...prev, [jobPostingId]: [] }))
    }
  }

  const handleCreateJob = async (jobData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/recruiter/job-postings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur création')
      if (data.jobPosting) {
        setJobs(prev => [data.jobPosting, ...prev])
        alert('Poste créé avec succès.')
      }
    } catch (error) {
      alert(error.message || 'Erreur lors de la création du poste')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCandidate = async (formData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur ajout candidat')
      if (data.candidate) {
        setCandidates(prev => [data.candidate, ...prev])
        alert('Candidat ajouté et CV analysé.')
      }
    } catch (error) {
      alert(error.message || 'Erreur lors de l\'ajout du candidat')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQuiz = async (jobPostingId, quizType = 'mixed') => {
    setLoading(true)
    try {
      const response = await fetch('/api/recruiter/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobPostingId,
          quizType,
          numQuestions: 10
        }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur génération quiz')
      if (data.quiz) {
        setQuizzes(prev => [data.quiz, ...prev])
        setPreviewQuiz(data.quiz)
      }
    } catch (error) {
      alert(error.message || 'Erreur lors de la génération du quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveQuiz = async (quizId) => {
    try {
      const response = await fetch(`/api/recruiter/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur approbation')
      if (data.quiz) {
        setQuizzes(prev => prev.map(q => q.id === quizId ? data.quiz : q))
        setPreviewQuiz(null)
        alert('Quiz approuvé et activé.')
      }
    } catch (error) {
      alert(error.message || 'Erreur lors de l\'approbation du quiz')
    }
  }

  const handleRejectQuiz = async (quizId) => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter ce quiz ? Il sera supprimé.')) return
    try {
      const response = await fetch(`/api/recruiter/quizzes/${quizId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur suppression')
      }
      setQuizzes(prev => prev.filter(q => q.id !== quizId))
      setPreviewQuiz(null)
      alert('Quiz rejeté et supprimé.')
    } catch (error) {
      alert(error.message || 'Erreur lors du rejet du quiz')
    }
  }

  const handleSendQuizToCandidate = async (quizId, candidateId, candidateEmail) => {
    if (!confirm(`Envoyer ce quiz à ${candidateEmail} ?`)) return
    setLoading(true)
    try {
      const response = await fetch(`/api/recruiter/quizzes/${quizId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, candidateEmail }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur envoi')
      if (data.success) {
        alert('Quiz envoyé avec succès. Le candidat recevra un email avec le lien.')
      } else {
        alert('Erreur: ' + (data.error || 'Erreur lors de l\'envoi'))
      }
    } catch (error) {
      alert(error.message || 'Erreur lors de l\'envoi du quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleRankCandidates = async (jobPostingId) => {
    setLoading(true)
    try {
      const response = await fetch('/api/recruiter/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobPostingId }),
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur classement')
      if (data.rankings) {
        setRankings(prev => ({ ...prev, [jobPostingId]: data.rankings }))
        alert(`${data.rankings.length} candidat(s) classé(s).`)
      }
    } catch (error) {
      alert(error.message || 'Erreur lors du classement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-900 border border-zinc-700/50 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 bg-zinc-900/80 border-b border-zinc-700/50">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Recruteur</h2>
            <p className="text-sm text-zinc-400 mt-0.5">Postes, candidats, quiz et classements</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-700/80 text-zinc-200 hover:bg-zinc-600 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-2 border-b border-zinc-700/50 bg-zinc-900/50">
          {[
            { id: 'jobs', label: 'Postes', icon: '💼' },
            { id: 'candidates', label: 'Candidats', icon: '👥' },
            { id: 'quizzes', label: 'Quiz', icon: '📝' },
            { id: 'rankings', label: 'Classements', icon: '🏆' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'candidates') loadCandidates()
                if (tab.id === 'rankings' && selectedJob) loadRankings(selectedJob)
              }}
              className={`px-5 py-3 rounded-t-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-zinc-700/80 text-white shadow-inner border-b-2 border-blue-800'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/30">
          {activeTab === 'jobs' && (
            <JobsTab 
              jobs={jobs} 
              onCreateJob={handleCreateJob}
              onSelectJob={setSelectedJob}
              loading={loading}
            />
          )}
          
          {activeTab === 'candidates' && (
            <CandidatesTab 
              candidates={candidates}
              jobs={jobs}
              onAddCandidate={handleAddCandidate}
              loading={loading}
            />
          )}
          
          {activeTab === 'quizzes' && (
            <QuizzesTab 
              quizzes={quizzes}
              jobs={jobs}
              candidates={candidates}
              onGenerateQuiz={handleGenerateQuiz}
              onPreviewQuiz={setPreviewQuiz}
              onSendQuiz={handleSendQuizToCandidate}
              loading={loading}
            />
          )}
          
          {activeTab === 'rankings' && (
            <RankingsTab 
              rankings={rankings}
              jobs={jobs}
              onRankCandidates={handleRankCandidates}
              onLoadRankings={loadRankings}
              loading={loading}
            />
          )}
        </div>
      </motion.div>

      {/* Prévisualisation du quiz */}
      {previewQuiz && (
        <QuizPreview
          quiz={previewQuiz}
          onClose={() => setPreviewQuiz(null)}
          onApprove={() => handleApproveQuiz(previewQuiz.id)}
          onReject={() => handleRejectQuiz(previewQuiz.id)}
        />
      )}
    </div>
  )
}

// Composant pour l'onglet Postes
function JobsTab({ jobs, onCreateJob, onSelectJob, loading }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_skills: '',
    required_experience: '',
    location: '',
    employment_type: 'full-time'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreateJob({
      ...formData,
      required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(Boolean),
      required_experience: parseInt(formData.required_experience) || null
    })
    setShowForm(false)
    setFormData({
      title: '',
      description: '',
      required_skills: '',
      required_experience: '',
      location: '',
      employment_type: 'full-time'
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Postes à pourvoir</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-900/80 text-white rounded-lg hover:bg-blue-800/90 border border-blue-800/50"
        >
          + Nouveau poste
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-white/5 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Titre du poste"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            rows={4}
            required
          />
          <input
            type="text"
            placeholder="Compétences requises (séparées par des virgules)"
            value={formData.required_skills}
            onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Années d'expérience"
              value={formData.required_experience}
              onChange={(e) => setFormData({ ...formData, required_experience: e.target.value })}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
            <select
              value={formData.employment_type}
              onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="full-time">Temps plein</option>
              <option value="part-time">Temps partiel</option>
              <option value="contract">Contrat</option>
              <option value="internship">Stage</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-900/80 text-white rounded-lg hover:bg-blue-800/90 border border-blue-800/50"
              disabled={loading}
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {jobs.map(job => (
          <div
            key={job.id}
            className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-blue-500/50 cursor-pointer"
            onClick={() => onSelectJob(job.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold text-white">{job.title}</h4>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{job.description}</p>
                <div className="flex gap-2 mt-2">
                  {job.required_skills?.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                job.status === 'open' ? 'bg-blue-900/30 text-blue-200' : 'bg-zinc-600/50 text-zinc-300'
              }`}>
                {job.status === 'open' ? 'Ouvert' : 'Fermé'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Composant pour l'onglet Candidats
function CandidatesTab({ candidates, jobs, onAddCandidate, loading }) {
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    if (file) {
      formData.append('cv', file)
      await onAddCandidate(formData)
      setShowForm(false)
      setFile(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Candidats</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-900/80 text-white rounded-lg hover:bg-blue-800/90 border border-blue-800/50"
        >
          + Ajouter candidat
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-white/5 rounded-lg space-y-3">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="firstName"
              placeholder="Prénom"
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Nom"
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          <select
            name="jobPostingId"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="">Sélectionner un poste (optionnel)</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-900/80 text-white rounded-lg hover:bg-blue-800/90 border border-blue-800/50"
              disabled={loading}
            >
              Ajouter et analyser
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {candidates.map(candidate => (
          <div key={candidate.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold text-white">
                  {candidate.first_name} {candidate.last_name}
                </h4>
                <p className="text-sm text-gray-400">{candidate.email}</p>
                {candidate.cv_analyses?.[0] && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Score CV:</span>
                      <span className={`font-semibold ${
                        candidate.cv_analyses[0].overall_score >= 70 ? 'text-blue-200' : 'text-zinc-400'
                      }`}>
                        {candidate.cv_analyses[0].overall_score}/100
                      </span>
                    </div>
                    {candidate.relevance_scores?.[0] && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-400">Pertinence:</span>
                        <span className="font-semibold text-blue-400">
                          {candidate.relevance_scores[0].overall_score}/100
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                candidate.status === 'shortlisted' ? 'bg-blue-900/30 text-blue-200' :
                candidate.status === 'rejected' ? 'bg-zinc-600/50 text-zinc-300' :
                'bg-zinc-600/50 text-zinc-300'
              }`}>
                {candidate.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Composant pour l'onglet Quiz
function QuizzesTab({ quizzes, jobs, candidates, onGenerateQuiz, onPreviewQuiz, onSendQuiz, loading }) {
  const [selectedJob, setSelectedJob] = useState('')
  const [quizType, setQuizType] = useState('mixed')
  const [showSendModal, setShowSendModal] = useState(null) // { quizId, jobPostingId }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Quiz générés</h3>
        <div className="flex gap-2">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="">Sélectionner un poste</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <select
            value={quizType}
            onChange={(e) => setQuizType(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="mixed">Mixte</option>
            <option value="qcm">QCM uniquement</option>
            <option value="open">Questions ouvertes</option>
            <option value="case-study">Cas pratiques</option>
          </select>
          <button
            onClick={() => selectedJob && onGenerateQuiz(selectedJob, quizType)}
            disabled={!selectedJob || loading}
            className="px-4 py-2 bg-blue-900/80 text-white rounded-lg hover:bg-blue-800/90 border border-blue-800/50 disabled:opacity-50"
          >
            Générer quiz
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-blue-500/50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-semibold text-white">{quiz.title}</h4>
                  {quiz.is_active === false && (
                    <span className="px-2 py-1 bg-zinc-600/50 text-zinc-300 text-xs rounded border border-zinc-500/40">
                      ⚠️ Brouillon
                    </span>
                  )}
                  {quiz.is_active === true && (
                    <span className="px-2 py-1 bg-blue-900/30 text-blue-200 text-xs rounded border border-blue-800/40">
                      ✅ Actif
                    </span>
                  )}
                  {quiz.is_active === undefined && (
                    <span className="px-2 py-1 bg-zinc-600/50 text-zinc-300 text-xs rounded border border-zinc-500/40">
                      ⚠️ Brouillon
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{quiz.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-blue-900/30 text-blue-200 text-xs rounded">
                    {quiz.quiz_type}
                  </span>
                  <span className="px-2 py-1 bg-zinc-600/50 text-zinc-300 text-xs rounded">
                    {quiz.questions?.length || 0} questions
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => onPreviewQuiz(quiz)}
                  className="px-3 py-2 bg-blue-900/80 text-white text-sm rounded-lg hover:bg-blue-800/90 border border-blue-800/50"
                >
                  👁️ Prévisualiser
                </button>
                {quiz.is_active && (
                  <button
                    onClick={() => setShowSendModal({ quizId: quiz.id, jobPostingId: quiz.job_posting_id })}
                    className="px-3 py-2 bg-blue-900/80 text-white text-sm rounded-lg hover:bg-blue-800/90 border border-blue-800/50"
                  >
                    📧 Envoyer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'envoi de quiz */}
      {showSendModal && (
        <SendQuizModal
          quizId={showSendModal.quizId}
          jobPostingId={showSendModal.jobPostingId}
          candidates={candidates || []}
          onSend={onSendQuiz}
          onClose={() => setShowSendModal(null)}
        />
      )}
    </div>
  )
}

// Composant pour l'onglet Classements
function RankingsTab({ rankings, jobs, onRankCandidates, onLoadRankings, loading }) {
  const [selectedJob, setSelectedJob] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-xl font-semibold text-white">Classements des candidats</h3>
        <div className="flex gap-2">
          <select
            value={selectedJob}
            onChange={(e) => {
              const jobId = e.target.value
              setSelectedJob(jobId)
              if (jobId && onLoadRankings) onLoadRankings(jobId)
            }}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un poste</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <button
            onClick={() => selectedJob && onRankCandidates(selectedJob)}
            disabled={!selectedJob || loading}
            className="px-4 py-2 bg-blue-900/80 text-white rounded-lg hover:bg-blue-800/90 border border-blue-800/50 disabled:opacity-50"
          >
            Classer candidats
          </button>
        </div>
      </div>

      {selectedJob && rankings[selectedJob] && (
        <div className="space-y-2">
          {rankings[selectedJob].map((ranking, idx) => (
            <div
              key={idx}
              className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold">
                  {ranking.rank}
                </div>
                <div>
                  <p className="text-white font-medium">{ranking.candidate_name || `Candidat #${String(ranking.candidate_id).slice(0, 8)}`}</p>
                  <p className="text-sm text-gray-400">
                    Score: {Number(ranking.overall_score).toFixed(0)}/100
                  </p>
                </div>
              </div>
              {ranking.breakdown && (
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-900/30 text-blue-200 rounded">
                    Compétences: {Number(ranking.breakdown.skills?.score ?? 0).toFixed(0)}
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                    Expérience: {Number(ranking.breakdown.experience?.score ?? 0).toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Modal pour envoyer un quiz à un candidat
function SendQuizModal({ quizId, jobPostingId, candidates, onSend, onClose }) {
  const [selectedCandidate, setSelectedCandidate] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedCandidate) {
      alert('Veuillez sélectionner un candidat')
      return
    }

    const candidate = candidates.find(c => c.id === selectedCandidate)
    if (candidate) {
      onSend(quizId, candidate.id, candidate.email)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Envoyer le quiz</h3>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Sélectionner un candidat
            </label>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              required
            >
              <option value="">Choisir un candidat...</option>
              {candidates.map(candidate => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.first_name} {candidate.last_name} ({candidate.email})
                </option>
              ))}
            </select>
            {candidates.length === 0 && (
              <p className="text-sm text-zinc-400 mt-2">
                Aucun candidat disponible. Ajoutez d'abord des candidats dans l'onglet "Candidats".
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={candidates.length === 0}
              className="px-4 py-2 bg-blue-900/80 text-white rounded-lg hover:bg-blue-800/90 border border-blue-800/50 disabled:opacity-50"
            >
              📧 Envoyer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
