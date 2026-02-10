'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '../contexts/AuthContext'
import { apiRequest } from '../lib/api.js'

export default function DocumentManager({ onClose }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [selectedForComparison, setSelectedForComparison] = useState([])
  const [comparisonResult, setComparisonResult] = useState(null)

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
      const { data: documents, error } = await supabase
        .from('uploaded_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
        throw error
      }

      console.log('Fetched documents:', documents)
      setDocuments(documents || [])
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

      // Generate unique filename with user ID path
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileName = `${timestamp}-${randomId}.${fileExt}`
      const storagePath = `CV/${user.id}/${fileName}`

      console.log('Uploading to path:', storagePath)

      // Upload file directly to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('CV')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Supabase Storage upload error:', uploadError)
        throw new Error(`Erreur d'upload: ${uploadError.message}`)
      }

      console.log('File uploaded successfully:', uploadData)

      // Extract text content (client-side for basic files)
      let extractedText = ''
      try {
        if (file.type === 'text/plain') {
          extractedText = await file.text()
        } else {
          // For PDF and DOCX, we'll need server-side processing
          console.log('Text extraction will be handled server-side for PDF/DOCX')
        }
      } catch (extractError) {
        console.error('Text extraction error:', extractError)
        // Continue without extracted text
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

      // Save document metadata to database - CORRECTED COLUMN NAMES
      const { data: docData, error: dbError } = await supabase
        .from('uploaded_documents')
        .insert({
          user_id: user.id,
          file_name: fileName,           // ✅ Corrected from 'filename'
          file_path: storagePath,        // ✅ Corrected from 'storage_path'
          file_type: fileType,
          file_size: file.size,
          extracted_text: extractedText,
          metadata: {
            mime_type: file.type,
            original_name: file.name,    // ✅ Moved to metadata
            uploaded_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database save error:', dbError)
        // Try to clean up uploaded file
        await supabase.storage.from('CV').remove([storagePath])
        throw new Error(`Erreur de sauvegarde: ${dbError.message}`)
      }

      console.log('Document metadata saved:', docData)

      // Update local state
      setDocuments(prev => [docData, ...prev])

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

  const compareDocuments = async () => {
    if (selectedForComparison.length !== 2) return

    setAnalyzing(true)
    setComparisonResult(null)

    try {
      // Use authenticated API request
      const data = await apiRequest('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({
          type: 'cv_job_comparison',
          documentIds: selectedForComparison
        })
      })

      if (data.error) {
        setComparisonResult({ error: data.error })
      } else {
        setComparisonResult(data)
      }
    } catch (error) {
      console.error('Comparison error:', error)
      setComparisonResult({ error: 'Erreur lors de la comparaison' })
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleDocumentSelection = (docId) => {
    if (comparisonMode) {
      setSelectedForComparison(prev => {
        if (prev.includes(docId)) {
          return prev.filter(id => id !== docId)
        } else if (prev.length < 2) {
          return [...prev, docId]
        }
        return prev
      })
    } else {
      const doc = documents.find(d => d.id === docId)
      setSelectedDocument(doc)
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

  const renderComparisonResult = () => {
    if (!comparisonResult) return null

    if (comparisonResult.error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Erreur</p>
          <p className="text-red-600 text-sm mt-1">{comparisonResult.error}</p>
        </div>
      )
    }

    const { comparison, documents: docInfo } = comparisonResult
    const { compatibility_score, is_compatible, analysis, cover_letter } = comparison

    return (
      <div className="space-y-4">
        {/* Score de compatibilité */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600 mb-2">{compatibility_score}%</div>
          <div className={`text-lg font-semibold ${is_compatible ? 'text-green-600' : 'text-red-600'}`}>
            {is_compatible ? '✓ Compatible' : '✗ Non compatible'}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Score de compatibilité CV/Offre d'emploi
          </p>
        </div>

        {/* Documents analysés */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">CV analysé</p>
            <p className="text-sm text-gray-600 truncate">{docInfo.cv.name}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Offre analysée</p>
            <p className="text-sm text-gray-600 truncate">{docInfo.job.name}</p>
          </div>
        </div>

        {/* Forces */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Forces du candidat</h3>
            <ul className="space-y-1">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-green-700 flex items-start">
                  <span className="mr-2">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Compétences manquantes */}
        {analysis.missing_skills && analysis.missing_skills.length > 0 && (
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Compétences à développer</h3>
            <ul className="space-y-1">
              {analysis.missing_skills.map((skill, index) => (
                <li key={index} className="text-sm text-orange-700 flex items-start">
                  <span className="mr-2">⚠</span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lettre de motivation */}
        {is_compatible && cover_letter && (
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-3">Lettre de motivation générée</h3>
            <div className="bg-white p-3 rounded border text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
              {cover_letter}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(cover_letter)}
              className="mt-2 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
            >
              Copier la lettre
            </button>
          </div>
        )}
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
              onClick={() => {
                setComparisonMode(!comparisonMode)
                setSelectedForComparison([])
                setComparisonResult(null)
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                comparisonMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {comparisonMode ? 'Mode Comparaison' : 'Comparer CV/Offre'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Retour au Chat
            </button>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          {comparisonMode
            ? 'Sélectionnez un CV et une offre d\'emploi à comparer'
            : 'Uploadez et analysez vos CV et offres d\'emploi'
          }
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {comparisonMode ? 'Sélection pour Comparaison' : 'Mes Documents'}
            </h2>
            {comparisonMode && (
              <div className="mb-4 p-2 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  Sélectionnés: {selectedForComparison.length}/2
                </p>
                {selectedForComparison.length === 2 && (
                  <button
                    onClick={compareDocuments}
                    disabled={analyzing}
                    className="mt-2 w-full px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {analyzing ? 'Comparaison...' : 'Comparer'}
                  </button>
                )}
              </div>
            )}
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
                      (comparisonMode && selectedForComparison.includes(doc.id)) ||
                      (!comparisonMode && selectedDocument?.id === doc.id)
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
                      {comparisonMode && selectedForComparison.includes(doc.id) && (
                        <span className="text-green-600">✓</span>
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
            {comparisonMode ? (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Résultat de Comparaison</h2>
                {analyzing ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Analyse en cours...</p>
                  </div>
                ) : comparisonResult ? (
                  renderComparisonResult()
                ) : selectedForComparison.length === 2 ? (
                  <p className="text-gray-600">Cliquez sur "Comparer" pour analyser la compatibilité.</p>
                ) : (
                  <p className="text-gray-600">Sélectionnez un CV et une offre d'emploi pour les comparer.</p>
                )}
              </>
            ) : selectedDocument ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Analyse du Document</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => analyzeDocument(selectedDocument,
                        selectedDocument.file_type === 'cv' ? 'cv_analysis' : 'job_analysis'
                      )}
                      disabled={analyzing}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm flex items-center space-x-1"
                    >
                      <span>🤖</span>
                      <span>{analyzing ? 'Analyse...' : 'Analyser'}</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Nom du fichier</p>
                    <p className="text-sm text-gray-600">{selectedDocument.metadata?.original_name || selectedDocument.file_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Type</p>
                    <p className="text-sm text-gray-600 capitalize">{selectedDocument.file_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Taille</p>
                    <p className="text-sm text-gray-600">{formatFileSize(selectedDocument.file_size)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Uploadé le</p>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedDocument.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {selectedDocument.extracted_text && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Contenu extrait</p>
                      <div className="max-h-32 overflow-y-auto p-2 bg-gray-50 rounded text-xs text-gray-700">
                        {selectedDocument.extracted_text.substring(0, 300)}
                        {selectedDocument.extracted_text.length > 300 && '...'}
                      </div>
                    </div>
                  )}
                  {analysis && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-800 mb-2">Analyse IA</p>
                      <p className="text-sm text-purple-700 whitespace-pre-wrap">{analysis}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Sélectionnez un document pour voir l'analyse</p>
              </div>
            )}
          </motion.div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Contenu extrait</p>
                      <div className="max-h-32 overflow-y-auto p-2 bg-gray-50 rounded text-xs text-gray-700">
                        {selectedDocument.extracted_text.substring(0, 300)}
                        {selectedDocument.extracted_text.length > 300 && '...'}
                      </div>
                    </div>
                  )}
                  {analysis && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-800 mb-2">Analyse IA</p>
                      <p className="text-sm text-purple-700 whitespace-pre-wrap">{analysis}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Sélectionnez un document pour voir l'analyse</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
