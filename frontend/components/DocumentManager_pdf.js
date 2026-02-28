'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { apiRequest } from '../lib/api.js'
import { CV_TEMPLATES, CV_COLORS } from '../lib/cvTemplates.js'
import jsPDF from 'jspdf'
import CVViewer from './CVViewer'

export default function DocumentManager({ onClose }) {
  const toast = useToast()
  const confirm = useConfirm()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [generatedLetter, setGeneratedLetter] = useState(null)
  const [generatedCV, setGeneratedCV] = useState(null)
  const [showCVViewer, setShowCVViewer] = useState(false)
  const [cvAnalysis, setCvAnalysis] = useState(null)
  const [cvTemplate, setCvTemplate] = useState('moderne')
  const [editableLetterText, setEditableLetterText] = useState('')
  const [cvAccentColor, setCvAccentColor] = useState('blue')
  const [cvPhoto, setCvPhoto] = useState(null)
  const [cvPhotoObjectUrl, setCvPhotoObjectUrl] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const { user } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const fetchDocuments = async () => {
    try {
      console.log('Fetching documents for user:', user.id)
      const data = await apiRequest('/api/upload', { cache: 'no-store' })

      console.log('Fetched documents:', data.documents)
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Erreur lors du chargement des documents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!user) {
      toast.error('Vous devez être connecté pour uploader des fichiers')
      return
    }

    setUploading(true)

    try {
      console.log('Starting file upload for user:', user.id)
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Type de fichier non supporté. Utilisez PDF, DOCX ou TXT.')
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux (max 10MB)')
      }

      // Determine file type
      let fileType = 'document'
      if (file.type.includes('pdf')) {
        fileType = 'cv'
      } else if (file.name.toLowerCase().includes('cv') || file.name.toLowerCase().includes('resume')) {
        fileType = 'cv'
      } else {
        fileType = 'job_offer'
      }

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', fileType)

      // Use the authenticated upload API endpoint
      const response = await apiRequest('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set content-type for FormData
      })

      if (response.error) {
        throw new Error(response.error)
      }

      console.log('Document uploaded successfully:', response.document)

      // Update local state
      setDocuments(prev => [response.document, ...prev])

      // Show success message
      toast.success('Document uploadé avec succès !')

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(`Erreur lors de l'upload: ${error.message}`)
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const analyzeDocument = async (document, type) => {
    setAnalyzing(true)
    setSelectedDocument(document)
    setAnalysis(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          documentIds: [document.id]
        })
      })

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (error) {
      console.error('Analysis error:', error)
      setAnalysis('Erreur lors de l\'analyse')
    } finally {
      setAnalyzing(false)
    }
  }

  const generateCoverLetter = async () => {
    if (selectedDocuments.length === 0) return

    setAnalyzing(true)
    setGeneratedLetter(null)
    setCvAnalysis(null)

    try {
      // Use authenticated API request
      const data = await apiRequest('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({
          type: 'generate_cover_letter',
          documentIds: selectedDocuments
        })
      })

      if (data.error) {
        setGeneratedLetter({ error: data.error })
      } else {
        setGeneratedLetter(data)
        setEditableLetterText(data.cover_letter || '')
      }
    } catch (error) {
      console.error('Generation error:', error)
      setGeneratedLetter({ error: 'Erreur lors de la génération' })
    } finally {
      setAnalyzing(false)
    }
  }

  const generateOptimizedCV = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Veuillez sélectionner au moins un document (CV)')
      return
    }

    setAnalyzing(true)
    setGeneratedCV(null)
    setGeneratedLetter(null)

    try {
      const data = await apiRequest('/api/generate-cv', {
        method: 'POST',
        body: JSON.stringify({
          documentIds: selectedDocuments
        })
      })

      if (data.error) {
        toast.error('Erreur: ' + data.error)
      } else {
        setGeneratedCV({
          ...data.optimized_cv,
          template: cvTemplate,
          accentColor: cvAccentColor
        })
        setGeneratedLetter({
          cover_letter: data.cover_letter,
          documents: data.documents
        })
        setEditableLetterText(data.cover_letter || '')
        if (cvPhoto) {
          setCvPhotoObjectUrl(URL.createObjectURL(cvPhoto))
        } else {
          setCvPhotoObjectUrl(null)
        }
        setShowCVViewer(false)
      }
    } catch (error) {
      console.error('CV Generation error:', error)
      toast.error('Erreur lors de la génération du CV')
    } finally {
      setAnalyzing(false)
    }
  }

  const generateCVFromJob = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Veuillez sélectionner une offre d\'emploi')
      return
    }

    setAnalyzing(true)
    setGeneratedCV(null)
    setGeneratedLetter(null)

    try {
      const data = await apiRequest('/api/generate-cv', {
        method: 'POST',
        body: JSON.stringify({
          documentIds: selectedDocuments,
          generationType: 'cv_from_job'
        })
      })

      if (data.error) {
        toast.error('Erreur: ' + data.error)
      } else {
        setGeneratedCV({
          ...data.optimized_cv,
          template: cvTemplate,
          accentColor: cvAccentColor
        })
        setGeneratedLetter({
          cover_letter: data.cover_letter,
          documents: data.documents
        })
        setEditableLetterText(data.cover_letter || '')
        if (cvPhoto) {
          setCvPhotoObjectUrl(URL.createObjectURL(cvPhoto))
        } else {
          setCvPhotoObjectUrl(null)
        }
        setShowCVViewer(false)
      }
    } catch (error) {
      console.error('CV from job generation error:', error)
      toast.error(error?.message || 'Erreur lors de la génération du CV à partir de l\'offre')
    } finally {
      setAnalyzing(false)
    }
  }

  const analyzeCV = async () => {
    if (selectedDocuments.length !== 1) {
      toast.error('Veuillez sélectionner exactement un document CV pour l\'analyse')
      return
    }

    setAnalyzing(true)
    setCvAnalysis(null)
    setGeneratedLetter(null)
    setGeneratedCV(null)

    try {
      const data = await apiRequest('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({
          type: 'cv_analysis',
          documentIds: selectedDocuments
        })
      })

      if (data.error) {
        toast.error('Erreur: ' + data.error)
      } else {
        setCvAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('CV analysis error:', error)
      toast.error('Erreur lors de l\'analyse du CV')
    } finally {
      setAnalyzing(false)
    }
  }

  const downloadLetter = (letterText) => {
    try {
      // Create PDF with jsPDF
      const pdf = new jsPDF()

      // Set font and size
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(12)

      // Split text into lines that fit the page width
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 20
      const maxWidth = pageWidth - 2 * margin

      const lines = pdf.splitTextToSize(letterText, maxWidth)

      // Add content to PDF
      let yPosition = 30
      lines.forEach((line) => {
        if (yPosition > 270) { // Check if we need a new page
          pdf.addPage()
          yPosition = 30
        }
        pdf.text(line, margin, yPosition)
        yPosition += 7 // Line height
      })

      // Save the PDF
      pdf.save('lettre_de_motivation.pdf')
    } catch (error) {
      console.error('PDF Download error:', error)
      toast.error('Erreur lors du téléchargement du PDF')
    }
  }

  const toggleDocumentSelection = (docId) => {
    setSelectedDocuments(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId)
      } else {
        return [...prev, docId]
      }
    })
  }

  const deleteDocument = async (docId) => {
    const ok = await confirm({ title: 'Supprimer le document', message: 'Êtes-vous sûr de vouloir supprimer ce document ?', confirmLabel: 'Supprimer', danger: true })
    if (!ok) return

    setDeletingId(docId)
    try {
      const url = `/api/upload?documentId=${encodeURIComponent(String(docId))}`
      const res = await apiRequest(url, { method: 'DELETE' })
      if (!res || res.success !== true) {
        throw new Error(res?.error || 'Suppression échouée')
      }
      const data = await apiRequest('/api/upload', { cache: 'no-store' })
      setDocuments(data.documents || [])
      setSelectedDocuments(prev => prev.filter(id => id !== docId))
    } catch (error) {
      toast.error(error?.message || 'Erreur lors de la suppression du document')
    } finally {
      setDeletingId(null)
    }
  }

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    return '📃'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderGeneratedLetter = () => {
    if (!generatedLetter) return null

    if (generatedLetter.error) {
      return (
        <div className="p-5 rounded-2xl bg-zinc-800/60 border border-zinc-600/50 shadow-sm">
          <p className="text-sm font-semibold text-zinc-100">Erreur</p>
          <p className="text-sm text-zinc-300 mt-1.5 leading-relaxed">{generatedLetter.error}</p>
        </div>
      )
    }

    const { cover_letter, documents: docInfo } = generatedLetter

    return (
      <div className="space-y-5">
        {generatedCV && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowCVViewer(true)}
              className="py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 border border-blue-500/50 transition-colors"
            >
              Voir le CV
            </button>
          </div>
        )}
        {/* Documents utilisés */}
        <div className="grid grid-cols-1 gap-3">
          {docInfo.cv && (
            <div className="px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08]">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">CV utilisé</p>
              <p className="text-sm font-medium text-zinc-100 truncate mt-0.5">{docInfo.cv.name}</p>
            </div>
          )}
          {docInfo.job && (
            <div className="px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08]">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Offre utilisée</p>
              <p className="text-sm font-medium text-zinc-100 truncate mt-0.5">{docInfo.job.name}</p>
            </div>
          )}
        </div>

        {/* Lettre de motivation générée — modifiable */}
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/[0.08] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-blue-500/20">
            <h3 className="text-sm font-semibold text-blue-200">Lettre de motivation — modifiez si besoin avant téléchargement</h3>
          </div>
          <div className="p-4">
            <textarea
              value={editableLetterText}
              onChange={(e) => setEditableLetterText(e.target.value)}
              className="w-full rounded-xl bg-zinc-900/70 border border-zinc-700/60 p-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-80 min-h-[200px] overflow-y-auto resize-y focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none"
              placeholder="Votre lettre de motivation…"
              spellCheck="true"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(editableLetterText)}
                className="py-2.5 px-4 rounded-xl text-sm font-medium text-zinc-200 bg-zinc-700/80 hover:bg-zinc-600/90 border border-zinc-600/60 transition-colors"
              >
                Copier
              </button>
              <button
                onClick={() => downloadLetter(editableLetterText)}
                className="py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 border border-blue-500/50 transition-colors"
              >
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCvAnalysis = () => {
    if (!cvAnalysis) return null

    const resultCard = 'rounded-xl border p-4 shadow-sm'
    const resultTitle = 'text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3'
    const listItem = 'text-sm text-zinc-200 leading-relaxed flex items-start gap-2'

    return (
      <div className="space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
        {/* Score global */}
        <div className={`${resultCard} bg-blue-500/10 border-blue-500/25`}>
          <h3 className={resultTitle}>Score global du CV</h3>
          <div className="text-3xl font-bold text-blue-200 tabular-nums">{cvAnalysis.overall_score}/100</div>
          <p className="text-sm text-zinc-300 mt-1.5">Adéquation sectorielle : {cvAnalysis.industry_fit}</p>
        </div>

        {/* Points forts */}
        <div className={`${resultCard} bg-white/[0.04] border-white/[0.08]`}>
          <h3 className={resultTitle}>Points forts</h3>
          <ul className="space-y-2">
            {cvAnalysis.strengths.map((strength, index) => (
              <li key={index} className={listItem}>
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Points faibles */}
        <div className={`${resultCard} bg-zinc-800/50 border-zinc-600/50`}>
          <h3 className={resultTitle}>Points à améliorer</h3>
          <ul className="space-y-2">
            {cvAnalysis.weaknesses.map((weakness, index) => (
              <li key={index} className={listItem}>
                <span className="text-amber-400/90 mt-0.5">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Compétences détectées */}
        <div className={`${resultCard} bg-white/[0.04] border-white/[0.08]`}>
          <h3 className={resultTitle}>Compétences clés détectées</h3>
          <div className="flex flex-wrap gap-2">
            {cvAnalysis.key_skills_detected.map((skill, index) => (
              <span key={index} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-200 border border-blue-500/30">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Compétences manquantes */}
        <div className={`${resultCard} bg-zinc-800/50 border-zinc-600/50`}>
          <h3 className={resultTitle}>Compétences à renforcer</h3>
          <div className="flex flex-wrap gap-2">
            {cvAnalysis.missing_skills.map((skill, index) => (
              <span key={index} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-600/40 text-zinc-200 border border-zinc-500/40">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className={`${resultCard} bg-white/[0.04] border-white/[0.08]`}>
          <h3 className={resultTitle}>Suggestions d&apos;amélioration</h3>
          <ul className="space-y-2">
            {cvAnalysis.improvement_suggestions.map((suggestion, index) => (
              <li key={index} className={listItem}>
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  const cardBase = 'rounded-2xl border border-white/[0.08] bg-zinc-900/50 shadow-xl shadow-black/20 backdrop-blur-sm'
  const cardPadding = 'p-6 sm:p-7'
  const sectionTitle = 'text-base font-semibold text-zinc-100 tracking-tight'
  const btnPrimary =
    'w-full py-3 px-4 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 border border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors duration-200'
  const btnSecondary =
    'w-full py-3 px-4 rounded-xl text-sm font-medium text-zinc-200 bg-zinc-700/80 hover:bg-zinc-600/90 border border-zinc-600/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'

  return (
    <div className="page-root document-manager w-full min-h-screen flex flex-col box-border max-w-6xl mx-auto px-0 py-4 sm:py-10">
      {/* Header */}
      <header className="mb-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Gestionnaire de Documents
            </h1>
            <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
              Uploadez vos CV et offres d&apos;emploi pour générer des lettres de motivation et des CV optimisés.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 py-2.5 px-4 rounded-xl text-sm font-medium text-zinc-300 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] hover:text-zinc-100 transition-colors"
          >
            Retour au Chat
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Colonne 1 : Upload */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`${cardBase} ${cardPadding}`}
        >
          <h2 className={`${sectionTitle} mb-5`}>Importer un document</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Fichier
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-zinc-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-500 cursor-pointer rounded-xl border border-white/[0.1] bg-white/[0.04] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-shadow"
              />
              <p className="mt-2 text-xs text-zinc-500">
                PDF, DOCX ou TXT — max 10 Mo
              </p>
            </div>
            {uploading && (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="h-8 w-8 rounded-full border-2 border-blue-500/60 border-t-blue-400 animate-spin" />
                <p className="mt-3 text-sm text-zinc-400">Upload en cours…</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Colonne 2 : Mes Documents + Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className={`${cardBase} ${cardPadding} flex flex-col min-h-0`}
        >
          <h2 className={`${sectionTitle} mb-4`}>Mes documents</h2>

          {/* Compteur + Actions */}
          <div className="mb-5 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
              Sélectionnés · {selectedDocuments.length}
            </p>
            <div className="space-y-3">
              {selectedDocuments.length > 0 && (
                <>
                  <button
                    onClick={generateCoverLetter}
                    disabled={analyzing}
                    className={btnPrimary}
                  >
                    {analyzing ? 'Génération…' : 'Générer lettre de motivation'}
                  </button>
                  <button
                    onClick={generateOptimizedCV}
                    disabled={analyzing}
                    className={btnPrimary}
                  >
                    {analyzing ? 'Génération…' : 'Générer CV + Lettre'}
                  </button>
                </>
              )}
              {selectedDocuments.length === 1 && (
                <button
                  onClick={analyzeCV}
                  disabled={analyzing}
                  className={btnSecondary}
                >
                  {analyzing ? 'Analyse…' : 'Analyser le CV'}
                </button>
              )}
              {selectedDocuments.length >= 1 && (
                <>
                  <div className="pt-2 border-t border-white/[0.06]">
                    <p className="text-xs font-medium text-zinc-500 mb-2">Template & style du CV</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Template</label>
                        <select
                          value={cvTemplate}
                          onChange={(e) => setCvTemplate(e.target.value)}
                          className="w-full py-2 px-3 rounded-xl text-sm text-zinc-100 bg-white/[0.06] border border-white/[0.1] focus:ring-2 focus:ring-blue-500/40 outline-none"
                        >
                          {CV_TEMPLATES.map((t) => (
                            <option key={t.id} value={t.id}>{t.name} — {t.description}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Couleur d&apos;accent</label>
                        <select
                          value={cvAccentColor}
                          onChange={(e) => setCvAccentColor(e.target.value)}
                          className="w-full py-2 px-3 rounded-xl text-sm text-zinc-100 bg-white/[0.06] border border-white/[0.1] focus:ring-2 focus:ring-blue-500/40 outline-none"
                        >
                          {CV_COLORS.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Photo (optionnel)</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setCvPhoto(e.target.files?.[0] || null)}
                          className="block w-full text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-white/10 file:text-zinc-200 cursor-pointer"
                        />
                        {cvPhoto && (
                          <p className="mt-1 text-xs text-zinc-400 truncate">{cvPhoto.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={generateCVFromJob}
                    disabled={analyzing}
                    className={btnSecondary}
                  >
                    {analyzing ? 'Génération…' : 'Générer CV à partir d&apos;offre'}
                  </button>
                </>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-xs font-medium text-zinc-500 mb-2">Guide</p>
              <ul className="text-xs text-zinc-400 space-y-1 leading-relaxed">
                <li><span className="text-zinc-300">Analyser CV</span> — 1 CV</li>
                <li><span className="text-zinc-300">Lettre seule</span> — CV ± offre</li>
                <li><span className="text-zinc-300">CV + Lettre</span> — CV ± offre</li>
                <li><span className="text-zinc-300">CV depuis offre</span> — 1 offre + template</li>
              </ul>
            </div>
          </div>

          {/* Liste des documents */}
          <div className="flex-1 min-h-0 flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-white/[0.02]">
                <div className="h-8 w-8 rounded-full border-2 border-blue-500/60 border-t-blue-400 animate-spin" />
                <p className="mt-3 text-sm text-zinc-500">Chargement…</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="py-10 text-center rounded-xl bg-white/[0.02] border border-white/[0.04] border-dashed">
                <p className="text-sm font-medium text-zinc-500">Aucun document</p>
                <p className="mt-1 text-xs text-zinc-600">Importez un fichier pour commencer</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocumentSelection(doc.id)}
                    className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedDocuments.includes(doc.id)
                        ? 'bg-blue-500/15 border border-blue-500/30'
                        : 'bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="text-xl shrink-0" aria-hidden>{getFileIcon(doc.metadata?.mime_type || doc.file_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">
                        {doc.metadata?.original_name || doc.file_name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {doc.file_type} · {formatFileSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedDocuments.includes(doc.id) && (
                        <span className="text-blue-400 text-sm font-medium" aria-hidden>✓</span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id) }}
                        disabled={deletingId === doc.id}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Supprimer"
                        aria-label="Supprimer le document"
                      >
                        {deletingId === doc.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" aria-hidden />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Colonne 3 : Résultats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className={`${cardBase} ${cardPadding} flex flex-col min-h-0`}
        >
          <h2 className={`${sectionTitle} mb-5`}>Résultats</h2>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-14 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="h-9 w-9 rounded-full border-2 border-blue-500/60 border-t-blue-400 animate-spin" />
                <p className="mt-4 text-sm text-zinc-400">Génération en cours…</p>
              </div>
            ) : generatedLetter ? (
              <div className="overflow-y-auto pr-1 min-h-0 flex-1 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
                {renderGeneratedLetter()}
              </div>
            ) : cvAnalysis ? (
              <div className="min-h-0 flex-1 overflow-hidden">
                {renderCvAnalysis()}
              </div>
            ) : selectedDocuments.length > 0 ? (
              <p className="text-sm text-zinc-500 leading-relaxed">
                Choisissez une action dans la colonne du centre pour générer du contenu.
              </p>
            ) : (
              <p className="text-sm text-zinc-500 leading-relaxed">
                Sélectionnez un ou plusieurs documents pour commencer.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {showCVViewer && generatedCV && (
        <CVViewer
          cvData={generatedCV}
          photoUrl={cvPhotoObjectUrl}
          onClose={() => {
            if (cvPhotoObjectUrl) URL.revokeObjectURL(cvPhotoObjectUrl)
            setCvPhotoObjectUrl(null)
            setShowCVViewer(false)
          }}
        />
      )}
    </div>
  )
}
