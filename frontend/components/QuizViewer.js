'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

const QUESTION_DURATION_SECONDS = 60

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function QuizViewer({ quizData, documents, onClose }) {
  const questions = useMemo(() => {
    if (!quizData) return []
    const list = []
    // Only include technical and general questions
    if (Array.isArray(quizData.technical_questions)) {
      quizData.technical_questions.forEach((q, idx) =>
        list.push({ ...q, category: 'technique', index: list.length, rawIndex: idx })
      )
    }
    if (Array.isArray(quizData.general_questions)) {
      quizData.general_questions.forEach((q, idx) =>
        list.push({ ...q, category: 'générale', index: list.length, rawIndex: idx })
      )
    }
    return list
  }, [quizData])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION_SECONDS)
  const [showAnswer, setShowAnswer] = useState(false)
  const [statusByIndex, setStatusByIndex] = useState({}) // 'correct' | 'wrong'
  const [isFinished, setIsFinished] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null) // Track user's selected answer index
  const [showFeedback, setShowFeedback] = useState(false) // Track if feedback is shown
  const [answeredQuestions, setAnsweredQuestions] = useState({}) // Track which questions have been answered

  // Reset timer and answer state when question changes
  useEffect(() => {
    if (!questions.length) return
    setTimeLeft(QUESTION_DURATION_SECONDS)
    setShowAnswer(false)
    setSelectedAnswer(null)
    setShowFeedback(false)
  }, [currentIndex, questions.length])

  // Countdown timer
  useEffect(() => {
    if (!questions.length || isFinished) return
    if (timeLeft <= 0) {
      if (!showAnswer) {
        // Temps écoulé = question ratée, on affiche la réponse
        setStatusByIndex(prev => ({ ...prev, [currentIndex]: 'wrong' }))
        setShowAnswer(true)
      }
      return
    }

    const id = setTimeout(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(id)
  }, [timeLeft, isFinished, questions.length, showAnswer, currentIndex])

  if (!questions.length) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Aucun quiz disponible</h2>
          <p className="text-gray-300 mb-4">
            Les données du quiz sont vides ou invalides.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  const current = questions[currentIndex]
  const total = questions.length
  const correctCount = Object.values(statusByIndex).filter(s => s === 'correct').length
  const wrongCount = Object.values(statusByIndex).filter(s => s === 'wrong').length

  const handleAnswerSelect = (answerIndex) => {
    if (answeredQuestions[currentIndex]) return // Already answered
    
    const current = questions[currentIndex]
    const isCorrect = answerIndex === current.correct_answer
    
    setSelectedAnswer(answerIndex)
    setAnsweredQuestions(prev => ({ ...prev, [currentIndex]: true }))
    setShowFeedback(true)
    
    if (isCorrect) {
      setStatusByIndex(prev => ({ ...prev, [currentIndex]: 'correct' }))
    } else {
      setStatusByIndex(prev => ({ ...prev, [currentIndex]: 'wrong' }))
      setShowAnswer(true)
    }
  }

  const goToNextQuestion = () => {
    if (currentIndex + 1 >= total) {
      setIsFinished(true)
      return
    }
    setCurrentIndex(prev => prev + 1)
  }

  const handleRestart = () => {
    setStatusByIndex({})
    setCurrentIndex(0)
    setIsFinished(false)
    setTimeLeft(QUESTION_DURATION_SECONDS)
    setShowAnswer(false)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setAnsweredQuestions({})
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">
                🎯 Session d'entretien interactive
              </h2>
              <p className="text-sm text-gray-300">
                1 minute par question. La réponse s'affiche uniquement si vous ne trouvez pas.
              </p>
              {documents && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {documents.job && (
                    <span className="px-3 py-1 bg-blue-900/30 text-blue-200 text-xs rounded-full border border-blue-800/40">
                      📋 Offre: {documents.job.name}
                    </span>
                  )}
                  {documents.cv && (
                    <span className="px-3 py-1 bg-blue-500/15 text-blue-200 text-xs rounded-full border border-blue-500/30">
                      📄 CV: {documents.cv.name}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm"
            >
              ✕ Fermer
            </button>
          </div>

          {/* Progress + timer */}
          {!isFinished && (
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Question {currentIndex + 1} / {total}</span>
                  <span>
                    Réussies: <span className="text-blue-200">{correctCount}</span> ·
                    Ratées: <span className="text-zinc-400">{wrongCount}</span>
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-blue-800 transition-all"
                    style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-mono ${
                    timeLeft <= 10
                      ? 'bg-zinc-600/50 text-zinc-200 border border-zinc-500/40'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  ⏱ {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          )}

          {/* Current question or summary */}
          {isFinished ? (
            <div className="mt-4 space-y-4">
              <h3 className="text-xl font-semibold text-white">Bilan de la session</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Questions totales</p>
                  <p className="text-2xl font-semibold text-white">{total}</p>
                </div>
                <div className="p-3 bg-blue-900/30 rounded-xl border border-blue-800/40">
                  <p className="text-xs text-blue-200/80 mb-1">Réussies</p>
                  <p className="text-2xl font-semibold text-blue-200">{correctCount}</p>
                </div>
                <div className="p-3 bg-zinc-700/50 rounded-xl border border-zinc-600/40">
                  <p className="text-xs text-zinc-300/80 mb-1">À retravailler</p>
                  <p className="text-2xl font-semibold text-zinc-300">{wrongCount}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/15 border border-white/15"
                >
                  Rejouer le quiz
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-900/80 text-white text-sm rounded-lg hover:bg-blue-800/90 border border-blue-800/50"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Question {currentIndex + 1} · Catégorie&nbsp;
                <span className="text-blue-200 font-semibold">
                  {current.category}
                </span>
              </div>
              <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                <p className="text-base text-white leading-relaxed">
                  {current.question}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-gray-400 mb-3">
                  Sélectionnez la bonne réponse parmi les options ci-dessous.
                </p>
                <div className="space-y-2">
                  {current.options && current.options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx
                    const isCorrect = idx === current.correct_answer
                    const isWrong = isSelected && !isCorrect
                    const showResult = showFeedback && (isSelected || isCorrect)
                    const isDisabled = answeredQuestions[currentIndex]
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        disabled={isDisabled}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isDisabled
                            ? isCorrect
                              ? 'bg-blue-900/30 border-blue-800/50 cursor-default'
                              : isWrong
                              ? 'bg-zinc-700/50 border-zinc-600 cursor-default'
                              : 'bg-white/5 border-white/10 cursor-default opacity-50'
                            : isSelected
                            ? isCorrect
                              ? 'bg-blue-900/30 border-blue-800 hover:bg-blue-900/40'
                              : 'bg-zinc-700/50 border-zinc-600 hover:bg-zinc-600/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            showResult
                              ? isCorrect
                                ? 'bg-blue-800 border-blue-800'
                                : isWrong
                                ? 'bg-zinc-600 border-zinc-600'
                                : 'bg-white/10 border-white/20'
                              : isSelected
                              ? 'bg-blue-800 border-blue-800'
                              : 'bg-white/10 border-white/20'
                          }`}>
                            {showResult && (
                              <span className="text-white text-xs font-bold">
                                {isCorrect ? '✓' : '✗'}
                              </span>
                            )}
                            {!showResult && isSelected && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`flex-1 ${
                            showResult && isCorrect
                              ? 'text-blue-100 font-medium'
                              : showResult && isWrong
                              ? 'text-zinc-200 font-medium'
                              : 'text-white'
                          }`}>
                            {option}
                          </span>
                          {showResult && isCorrect && (
                            <span className="text-blue-200 text-lg">✓</span>
                          )}
                          {showResult && isWrong && (
                            <span className="text-zinc-400 text-lg">✗</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
                
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 p-3 rounded-lg ${
                      selectedAnswer === current.correct_answer
                        ? 'bg-blue-900/30 border border-blue-800/40'
                        : 'bg-zinc-700/50 border border-zinc-600/40'
                    }`}
                  >
                    <p className={`text-sm font-medium ${
                      selectedAnswer === current.correct_answer
                        ? 'text-blue-200'
                        : 'text-zinc-300'
                    }`}>
                      {selectedAnswer === current.correct_answer
                        ? '✓ Excellente réponse !'
                        : '✗ Réponse incorrecte'}
                    </p>
                  </motion.div>
                )}
              </div>

              {(showAnswer || showFeedback) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 p-4 rounded-xl ${
                    selectedAnswer === current.correct_answer
                      ? 'bg-blue-500/10 border border-blue-500/25'
                      : 'bg-zinc-700/50 border border-zinc-600/40'
                  }`}
                >
                  <p className={`text-xs mb-1 uppercase tracking-wide ${
                    selectedAnswer === current.correct_answer
                      ? 'text-blue-200/80'
                      : 'text-zinc-300/80'
                  }`}>
                    {selectedAnswer === current.correct_answer ? 'Explication' : 'Réponse suggérée'}
                  </p>
                  <p className={`text-sm whitespace-pre-wrap leading-relaxed bg-black/20 p-3 rounded-lg ${
                    selectedAnswer === current.correct_answer
                      ? 'text-blue-50'
                      : 'text-zinc-200'
                  }`}>
                    {current.suggested_answer}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={goToNextQuestion}
                      className="px-4 py-2 bg-blue-900/80 text-white text-sm rounded-lg hover:bg-blue-800/90 border border-blue-800/50"
                    >
                      Question suivante
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
