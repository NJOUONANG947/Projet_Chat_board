'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

/**
 * Composant de prévisualisation de quiz pour le recruteur
 * Permet de voir toutes les questions avec les bonnes réponses avant d'envoyer au candidat
 */
export default function QuizPreview({ quiz, onClose, onApprove, onReject }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const questions = quiz?.questions || []

  if (!questions.length) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="glass-card max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Aucune question</h2>
          <p className="text-gray-300 mb-4">Ce quiz ne contient aucune question.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const renderQuestion = (question) => {
    switch (question.type) {
      case 'qcm':
        return (
          <div className="space-y-3">
            <div className="p-4 bg-black/30 rounded-xl border border-white/10">
              <p className="text-base text-white leading-relaxed font-medium">
                {question.question}
              </p>
            </div>
            <div className="space-y-2">
              {question.options?.map((option, idx) => {
                const isCorrect = idx === question.correct_answer
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect
                        ? 'bg-blue-900/30 border-blue-800/50'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isCorrect
                          ? 'bg-blue-800 border-blue-800'
                          : 'bg-white/10 border-white/20'
                      }`}>
                        {isCorrect && (
                          <span className="text-white text-xs font-bold">✓</span>
                        )}
                      </div>
                      <span className={`flex-1 ${
                        isCorrect ? 'text-blue-100 font-medium' : 'text-white'
                      }`}>
                        {option}
                      </span>
                      {isCorrect && (
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-200 text-xs rounded">
                          Bonne réponse
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {question.explanation && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/25 rounded-lg">
                <p className="text-xs text-blue-200/80 mb-1 uppercase tracking-wide">Explication</p>
                <p className="text-sm text-blue-50">{question.explanation}</p>
              </div>
            )}
          </div>
        )

      case 'open':
        return (
          <div className="space-y-3">
            <div className="p-4 bg-black/30 rounded-xl border border-white/10">
              <p className="text-base text-white leading-relaxed font-medium">
                {question.question}
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400 mb-2">Mots-clés attendus :</p>
              <div className="flex flex-wrap gap-2">
                {question.expected_keywords?.map((keyword, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            {question.sample_answer && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/25 rounded-lg">
                <p className="text-xs text-blue-200/80 mb-1 uppercase tracking-wide">Exemple de réponse</p>
                <p className="text-sm text-blue-50 whitespace-pre-wrap">{question.sample_answer}</p>
              </div>
            )}
          </div>
        )

      case 'case-study':
        return (
          <div className="space-y-3">
            <div className="p-4 bg-black/30 rounded-xl border border-white/10">
              <p className="text-base text-white leading-relaxed font-medium mb-3">
                {question.question}
              </p>
              {question.context && (
                <div className="mt-3 p-3 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{question.context}</p>
                </div>
              )}
            </div>
            {question.expected_approach && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/25 rounded-lg">
                <p className="text-xs text-blue-200/80 mb-2 uppercase tracking-wide">Approche attendue</p>
                <p className="text-sm text-blue-50 whitespace-pre-wrap">{question.expected_approach}</p>
              </div>
            )}
            {question.evaluation_criteria && (
              <div className="p-4 bg-blue-900/20 border border-blue-800/40 rounded-lg">
                <p className="text-xs text-blue-200/80 mb-2 uppercase tracking-wide">Critères d'évaluation</p>
                <ul className="space-y-1">
                  {question.evaluation_criteria.map((criterion, idx) => (
                    <li key={idx} className="text-sm text-zinc-100 flex items-start gap-2">
                      <span className="text-blue-200">•</span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="p-4 bg-black/30 rounded-xl border border-white/10">
            <p className="text-base text-white leading-relaxed">{question.question}</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Prévisualisation du Quiz</h2>
            <p className="text-sm text-gray-400 mt-1">
              {quiz.title} · {questions.length} questions · Type: {quiz.quiz_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm"
          >
            ✕ Fermer
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Question {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-xs text-gray-400">
              Type: <span className="text-blue-300 capitalize">{currentQuestion.type}</span>
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-blue-800 transition-all"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {renderQuestion(currentQuestion)}
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="p-6 border-t border-white/10 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={isFirstQuestion}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Précédent
            </button>
            <button
              onClick={handleNext}
              disabled={isLastQuestion}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant →
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onReject}
              className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 border border-zinc-600"
            >
              Rejeter
            </button>
            <button
              onClick={onApprove}
              className="px-4 py-2 bg-blue-900/80 text-white rounded-lg hover:bg-blue-800/90 border border-blue-800/50"
            >
              ✓ Approuver et activer
            </button>
          </div>
        </div>

        {/* Question List (Mini navigation) */}
        <div className="px-6 py-3 border-t border-white/10 bg-black/20">
          <div className="flex gap-2 overflow-x-auto">
            {questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  idx === currentQuestionIndex
                    ? 'bg-blue-500 text-white'
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
  )
}
