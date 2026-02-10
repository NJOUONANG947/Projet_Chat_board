'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '../contexts/AuthContext'
import { apiRequest } from '../lib/api.js'
import jsPDF from 'jspdf'
import CVViewer from './CVViewer'

export default function DocumentManager({ onClose }) {
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
      const data = await apiRequest('/api/upload')

      console.log('Fetched documents:', data.documents)
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      alert('Erreur lors du chargement des documents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!user) {
      alert('Vous devez être connecté pour uploader des fichiers')
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
      alert('Document uploadé avec succès!')

    } catch (error) {
      console.error('Upload error:', error)
      alert(`Erreur lors de l'upload: ${error.message}`)
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
        // Automatically download the letter
        downloadLetter(data.cover_letter)
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
      alert('Veuillez sélectionner au moins un document (CV)')
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
        alert('Erreur: ' + data.error)
      } else {
        setGeneratedCV(data.optimized_cv)
        setGeneratedLetter({
          cover_letter: data.cover_letter,
          documents: data.documents
        })
        setShowCVViewer(true)
        // Auto-download the cover letter
        downloadLetter(data.cover_letter)
      }
    } catch (error) {
      console.error('CV Generation error:', error)
      alert('Erreur lors de la génération du CV')
    } finally {
      setAnalyzing(false)
    }
  }

  const generateCVFromJob = async () => {
    if (selectedDocuments.length === 0) {
      alert('Veuillez sélectionner une offre d\'emploi')
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
        alert('Erreur: ' + data.error)
      } else {
        setGeneratedCV(data.optimized_cv)
        setGeneratedLetter({
          cover_letter: data.cover_letter,
          documents: data.documents
        })
        setShowCVViewer(true)
        // Auto-download the cover letter
        downloadLetter(data.cover_letter)
      }
    } catch (error) {
      console.error('CV from job generation error:', error)
      alert('Erreur lors de la génération du CV à partir de l\'offre')
    } finally {
      setAnalyzing(false)
    }
  }

  const downloadLetter = (letterText) => {
    try {
      // Create a blob with the letter text
      const blob = new Blob([letterText], { type: 'text/plain;charset=utf-8' })

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob)

      // Create a temporary anchor element and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = 'lettre_de_motivation.txt'

      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the URL
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert('Erreur lors du téléchargement de la lettre')
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Erreur</p>
          <p className="text-red-600 text-sm mt-1">{generatedLetter.error}</p>
        </div>
      )
    }

    const { cover_letter, documents: docInfo } = generatedLetter

    return (
      <div className="space-y-4">
        {/* Documents utilisés */}
        <div className="grid grid-cols-1 gap-4">
          {docInfo.cv && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">CV utilisé</p>
              <p className="text-sm text-gray-600 truncate">{docInfo.cv.name}</p>
            </div>
          )}
          {docInfo.job && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Offre utilisée</p>
              <p className="text-sm text-gray-600 truncate">{docInfo.job.name}</p>
            </div>
          )}
        </div>

        {/* Lettre de motivation générée */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3">Lettre de motivation générée</h3>
          <div className="bg-white p-4 rounded border text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
            {cover_letter}
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => navigator.clipboard.writeText(cover_letter)}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              Copier
            </button>
            <button
              onClick={downloadLetter}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Télécharger PDF
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="document-manager max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Gestionnaire de Documents</h1>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Retour au Chat
            </button>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Uploadez vos CV et offres d'emploi pour générer des lettres de motivation et des CV optimisés
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Uploader un Document</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un fichier
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formats acceptés: PDF, DOCX, TXT (max 10MB)
                </p>
              </div>
              {uploading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Upload en cours...</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Mes Documents</h2>
            <div className="mb-4 p-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Sélectionnés: {selectedDocuments.length}
              </p>
              <div className="mt-2 space-y-2">
                {selectedDocuments.length > 0 && (
                  <button
                    onClick={generateCoverLetter}
                    disabled={analyzing}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {analyzing ? 'Génération...' : '📝 Générer lettre de motivation'}
                  </button>
                )}
                {selectedDocuments.length >= 1 && (
                  <button
                    onClick={generateOptimizedCV}
                    disabled={analyzing}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
                  >
                    {analyzing ? 'Génération...' : '🎨 Générer CV + Lettre'}
                  </button>
                )}
                {selectedDocuments.length >= 1 && (
                  <button
                    onClick={generateCVFromJob}
                    disabled={analyzing}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {analyzing ? 'Génération...' : '📋 Générer CV à partir d\'offre'}
                  </button>
                )}
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <p className="font-medium mb-1">💡 Guide d'utilisation :</p>
                  <p><strong>📝 Lettre seule:</strong> Sélectionnez CV ± offre</p>
                  <p><strong>🎨 CV + Lettre:</strong> Sélectionnez CV ± offre</p>
                  <p><strong>📋 CV à partir d'offre:</strong> Sélectionnez juste une offre</p>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Chargement...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun document uploadé</p>
                <p className="text-sm">Utilisez le formulaire à gauche pour commencer</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocumentSelection(doc.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedDocuments.includes(doc.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(doc.metadata?.mime_type || doc.file_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.metadata?.original_name || doc.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.file_type} • {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      {selectedDocuments.includes(doc.id) && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Résultats</h2>
            {analyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Génération en cours...</p>
              </div>
            ) : generatedLetter ? (
              renderGeneratedLetter()
            ) : selectedDocuments.length > 0 ? (
              <p className="text-gray-600">Cliquez sur un bouton de génération pour créer du contenu personnalisé.</p>
            ) : (
              <p className="text-gray-600">Sélectionnez un ou plusieurs documents pour commencer.</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* CV Viewer Modal */}
      {showCVViewer && generatedCV && (
        <CVViewer
          cvData={generatedCV}
          onClose={() => setShowCVViewer(false)}
        />
      )}
    </div>
  )
}
