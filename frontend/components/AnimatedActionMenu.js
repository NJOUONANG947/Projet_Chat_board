'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ANIMATION_DURATION_MS = 380
const STAGGER_DELAY = 0.045

const icons = {
  create_cv: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  analyze_cv: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  candidatures: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  campagnes: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  recruteur: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  parametres: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

export default function AnimatedActionMenu({
  open,
  onOpen,
  onClose,
  onAction,
  actions,
  triggerClassName = '',
}) {
  const triggerRef = useRef(null)
  const [canInteract, setCanInteract] = useState(false)
  const [triggerRect, setTriggerRect] = useState(null)
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const check = () => setIsNarrow(typeof window !== 'undefined' && window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!open) {
      setCanInteract(false)
      return
    }
    const t = setTimeout(() => setCanInteract(true), ANIMATION_DURATION_MS)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open || !triggerRef.current) return
    const updateRect = () => {
      if (triggerRef.current) setTriggerRect(triggerRef.current.getBoundingClientRect())
    }
    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [open])

  const handleAction = (id) => {
    if (!canInteract) return
    onClose()
    onAction(id)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const count = actions.length
  const radius = isNarrow ? 72 : 88
  const startAngleDeg = 160
  const endAngleDeg = 20
  const angleStep = count > 1 ? (endAngleDeg - startAngleDeg) / (count - 1) : 0

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? onClose : onOpen}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all duration-300 flex-shrink-0 ${triggerClassName || 'bg-[#007AFF] text-white hover:bg-[#0066dd] shadow-lg shadow-[#007AFF]/25'}`}
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="flex items-center justify-center"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={handleBackdropClick}
              aria-hidden="true"
            />
            <div
              className="fixed z-50 pointer-events-none"
              style={{
                left: triggerRect ? triggerRect.left + triggerRect.width / 2 : '50%',
                top: triggerRect ? triggerRect.bottom + 8 : 0,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="pointer-events-auto relative" style={{ width: 280, height: 220 }}>
                {actions.map((action, i) => {
                  const angleDeg = startAngleDeg + i * angleStep
                  const rad = (angleDeg * Math.PI) / 180
                  const x = Math.cos(rad) * radius
                  const y = Math.sin(rad) * radius
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x,
                        y,
                      }}
                      exit={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                      transition={{
                        type: 'spring',
                        damping: 24,
                        stiffness: 320,
                        delay: i * STAGGER_DELAY,
                      }}
                      onClick={() => handleAction(action.id)}
                      disabled={!canInteract}
                      className={`absolute left-1/2 top-0 flex items-center gap-3 rounded-xl px-4 py-3 min-w-[200px] sm:min-w-[220px] text-left transition-colors outline-none focus:ring-2 focus:ring-[#007AFF]/50 focus:ring-offset-2 focus:ring-offset-[#0d0d0d] ${
                        action.id === 'logout'
                          ? 'bg-white/[0.08] text-zinc-300 hover:bg-red-500/20 hover:text-red-300 border border-white/[0.08]'
                          : 'bg-[#1a1a1a] border border-white/[0.1] text-white hover:bg-white/[0.12] hover:border-[#007AFF]/30'
                      } ${!canInteract ? 'pointer-events-none' : ''}`}
                      style={{ transform: `translate(calc(-50% + ${x}px), ${y}px)` }}
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.08] text-[#007AFF] shrink-0">
                        {icons[action.id] ?? icons.parametres}
                      </span>
                      <span className="font-medium text-sm">{action.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export { icons }
