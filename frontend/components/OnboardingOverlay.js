'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ONBOARDING_KEY = 'careerai_onboarding_done'

export function hasCompletedOnboarding() {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function setOnboardingComplete() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ONBOARDING_KEY, 'true')
}

/**
 * Onboarding overlay : spotlight sur l'élément cible, fond assombri, bulle de texte, Suivant / Ignorer.
 * @param {Object} props
 * @param {Array<{ id: string, targetRef: React.RefObject, title: string, description: string }>} props.steps
 * @param {() => void} props.onComplete - appelé à la fin ou au clic Ignorer
 * @param {boolean} props.visible
 */
export default function OnboardingOverlay({ steps = [], onComplete, visible }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [spotlight, setSpotlight] = useState({ top: 0, left: 0, width: 0, height: 0 })

  const step = steps[stepIndex]
  const isLast = stepIndex >= steps.length - 1

  const bubbleAbove = typeof window !== 'undefined' && spotlight.top + spotlight.height / 2 > window.innerHeight / 2

  useEffect(() => {
    if (!visible || !step?.targetRef?.current) return
    const PADDING = 8
    const update = () => {
      const el = step.targetRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setSpotlight({
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      })
    }
    update()
    const onResize = () => update()
    window.addEventListener('resize', onResize)
    const raf = requestAnimationFrame(update)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [visible, stepIndex, step?.targetRef])

  const handleNext = () => {
    if (isLast) {
      setOnboardingComplete()
      onComplete?.()
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  const handleSkip = () => {
    setOnboardingComplete()
    onComplete?.()
  }

  if (!visible || steps.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[10000] pointer-events-auto"
        aria-modal="true"
        role="dialog"
        aria-label="Guide de démarrage"
      >
        {/* Fond assombri avec trou (spotlight) */}
        <div
          className="absolute transition-all duration-300 ease-out rounded-2xl"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          }}
        />

        {/* Bulle de texte — en dessous ou au-dessus du spotlight selon l'espace */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-full max-w-sm px-4"
          style={
            bubbleAbove
              ? { bottom: typeof window !== 'undefined' ? window.innerHeight - spotlight.top + 16 : spotlight.top + spotlight.height + 16 }
              : { top: spotlight.top + spotlight.height + 16 }
          }
        >
          <motion.div
            key={step?.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl bg-[#1a1a1c] border border-white/[0.12] shadow-xl p-4 text-center"
          >
            {step && (
              <>
                <h3 className="text-white font-semibold text-sm sm:text-base mb-1">
                  {step.title}
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm mb-4">
                  {step.description}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-3 py-2 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
                  >
                    Ignorer
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062cc] text-white text-xs sm:text-sm font-medium transition-colors duration-200"
                  >
                    {isLast ? 'Compris' : 'Suivant'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
