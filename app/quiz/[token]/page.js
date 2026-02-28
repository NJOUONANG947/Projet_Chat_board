'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QuizCandidateViewer from '../../../frontend/components/QuizCandidateViewer'

/**
 * Page publique pour que le candidat réponde au quiz
 * Accessible via un lien unique envoyé par email
 */
export default function QuizPage() {
  const params = useParams()
  const token = params?.token
  const [quizData, setQuizData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (token) {
      loadQuizByToken(token)
    }
  }, [token])

  const loadQuizByToken = async () => {
    try {
      const response = await fetch(`/api/candidate/quiz/${token}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setQuizData(data)
      }
    } catch (err) {
      setError('Erreur lors du chargement du quiz')
      console.error('Load quiz error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-root min-h-screen bg-zinc-950 flex items-center justify-center w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Chargement du quiz...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-root min-h-screen bg-zinc-950 flex items-center justify-center w-full">
        <div className="glass-card max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Erreur</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <p className="text-sm text-gray-400">
            Le lien du quiz est invalide ou a expiré. Veuillez contacter le recruteur.
          </p>
        </div>
      </div>
    )
  }

  if (!quizData) {
    return null
  }

  return (
    <QuizCandidateViewer
      quiz={quizData.quiz}
      candidate={quizData.candidate}
      quizResultId={quizData.quizResultId}
      token={token}
    />
  )
}
