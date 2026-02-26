'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

/** Évite l'erreur "Objects are not valid as a React child" : renvoie toujours une chaîne. */
function safeStr(val) {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object' && val !== null) {
    if ('projet' in val && 'entreprise' in val)
      return [val.entreprise, val.projet].filter(Boolean).join(' – ') || ''
    return Object.values(val).filter(Boolean).join(' – ') || ''
  }
  return String(val)
}

/**
 * Interface pour que le candidat réponde au quiz
 * Différente de QuizViewer car elle ne montre pas les réponses correctes
 */
export default function QuizCandidateViewer({ quiz, candidate, quizResultId, token }) {
  const questions = quiz?.questions || []
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionIndex: answer }
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [timeStarted, setTimeStarted] = useState(null)
  const [timeSpent, setTimeSpent] = useState(0)

  useEffect(() => {
    setTimeStarted(Date.now())
  }, [])

  useEffect(() => {
    if (timeStarted && !isCompleted) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - timeStarted) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timeStarted, isCompleted])

  const handleAnswerSelect = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      if (!confirm('Vous n\'avez pas répondu à toutes les questions. Voulez-vous quand même soumettre ?')) {
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Calculer le score
      let correctCount = 0
      const submittedAnswers = {}

      questions.forEach((question, idx) => {
        const userAnswer = answers[idx]
        submittedAnswers[idx] = {
          question: question.question,
          type: question.type,
          userAnswer: userAnswer,
          correct: false
        }

        if (question.type === 'qcm' && typeof userAnswer === 'number') {
          if (userAnswer === question.correct_answer) {
            correctCount++
            submittedAnswers[idx].correct = true
          }
        }
        // Pour les questions ouvertes et cas pratiques, le score sera calculé par le recruteur
      })

      const score = (() => {
        const qcmCount = questions.filter(q => q.type === 'qcm').length
        if (qcmCount === 0 || questions.length === 0) return 0
        return Math.round((correctCount / qcmCount) * 100)
      })()

      // Sauvegarder les réponses
      const response = await fetch(`/api/candidate/quiz/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizResultId,
          answers: submittedAnswers,
          score,
          correctAnswers: correctCount,
          totalQuestions: questions.length,
          timeSpent
        })
      })

      const data = await response.json()

      if (data.error) {
        alert('Erreur lors de la soumission: ' + data.error)
      } else {
        setIsCompleted(true)
        // Notifier le recruteur (optionnel)
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Erreur lors de la soumission du quiz')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card max-w-md w-full p-8 text-center"
        >
          <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-800/40">
            <svg className="w-10 h-10 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Quiz complété !</h2>
          <p className="text-gray-300 mb-6">
            Merci d'avoir complété le quiz. Le recruteur a été notifié et examinera vos réponses.
          </p>
          <p className="text-sm text-gray-400">
            Vous pouvez fermer cette page.
          </p>
        </motion.div>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Aucune question</h2>
          <p className="text-gray-300">Ce quiz ne contient aucune question.</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const answeredCount = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">{safeStr(quiz.title)}</h1>
            <p className="text-gray-300 text-sm">{safeStr(quiz.description)}</p>
            <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
              <span>Question {currentIndex + 1} / {questions.length}</span>
              <span>⏱ {formatTime(timeSpent)}</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="h-2 bg-blue-800 transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <div className="p-4 bg-black/30 rounded-xl border border-white/10 mb-4">
              <p className="text-base text-white leading-relaxed font-medium">
                {safeStr(currentQuestion.question)}
              </p>
            </div>

            {/* Réponses selon le type */}
            {currentQuestion.type === 'qcm' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentIndex] === idx
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(currentIndex, idx)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'bg-blue-900/30 border-blue-800'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-800 border-blue-800'
                            : 'bg-white/10 border-white/20'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="flex-1 text-white">{safeStr(option)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {currentQuestion.type === 'open' && (
              <textarea
                value={answers[currentIndex] || ''}
                onChange={(e) => handleAnswerSelect(currentIndex, e.target.value)}
                placeholder="Tapez votre réponse ici..."
                className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 min-h-[150px] resize-none"
              />
            )}

            {currentQuestion.type === 'case-study' && (
              <div className="space-y-4">
                {currentQuestion.context && (
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{safeStr(currentQuestion.context)}</p>
                  </div>
                )}
                <textarea
                  value={answers[currentIndex] || ''}
                  onChange={(e) => handleAnswerSelect(currentIndex, e.target.value)}
                  placeholder="Décrivez votre approche..."
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 min-h-[200px] resize-none"
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Précédent
            </button>

            <div className="text-sm text-gray-400">
              {answeredCount} / {questions.length} répondues
            </div>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-900/80 text-white rounded-lg hover:bg-blue-800/90 border border-blue-800/50 disabled:opacity-50"
              >
                {isSubmitting ? 'Envoi...' : '✓ Soumettre'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-4 py-2 bg-blue-900/80 text-white rounded-lg hover:bg-blue-800/90 border border-blue-800/50"
              >
                Suivant →
              </button>
            )}
          </div>

          {/* Mini navigation */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex gap-2 flex-wrap">
              {questions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                    idx === currentIndex
                      ? 'bg-blue-500 text-white'
                      : answers[idx] !== undefined
                      ? 'bg-blue-900/30 text-blue-200 border border-blue-800/40'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
