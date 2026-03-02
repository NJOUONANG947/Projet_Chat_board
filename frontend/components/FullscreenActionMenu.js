'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ANIMATION_DURATION_MS = 480
const STAGGER = 0.05
const TRANSITION_MS = 200

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const set = () => setIsMobile(mq.matches)
    set()
    mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [])
  return isMobile
}

const PRIMARY_IDS = ['create_cv', 'analyze_cv', 'candidatures', 'campagnes', 'recruteur', 'parametres']
const SECONDARY_IDS = []

const icons = {
  create_cv: (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  analyze_cv: (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  candidatures: (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  campagnes: (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  recruteur: (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  parametres: (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
}

function ActionCard({ action, index, variant, canInteract, onAction, iconsMap, compact }) {
  const isPrimary = variant === 'primary'
  const isSecondary = variant === 'secondary'
  const isLogout = action.id === 'logout'
  const isFirstPrimary = isPrimary && index === 0

  return (
    <motion.button
      key={action.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{
        duration: 0.22,
        ease: [0.25, 0.1, 0.25, 1],
        delay: index * STAGGER,
      }}
      whileHover={canInteract ? { y: -2, transition: { duration: 0.2 } } : undefined}
      whileTap={canInteract ? { scale: 0.98, transition: { duration: 0.12 } } : undefined}
      onClick={() => onAction(action.id)}
      disabled={!canInteract}
      className={`
        group relative flex flex-col items-center justify-center text-center outline-none
        border transition-all duration-200 ease-out
        focus-visible:ring-2 focus-visible:ring-[#007AFF]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]
        ${compact ? 'min-h-[88px] px-3 py-4 gap-2 md:min-h-[108px] md:px-4 md:py-5 md:gap-2.5' : 'min-h-[108px] sm:min-h-[120px] px-4 py-5 sm:px-5 sm:py-6 gap-2.5 sm:gap-3'}
        ${!canInteract ? 'pointer-events-none' : ''}
        ${isLogout
          ? 'rounded-2xl bg-white/[0.02] border-white/[0.05] text-zinc-500 hover:bg-red-950/25 hover:border-red-500/15 hover:text-red-400/90 active:scale-[0.99]'
          : isPrimary
            ? `rounded-2xl border-white/[0.1] text-white
               ${isFirstPrimary
                 ? 'bg-white/[0.08] shadow-[0_4px_20px_-8px_rgba(0,122,255,0.2),0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-white/[0.1] hover:border-[#007AFF]/30 hover:shadow-[0_8px_28px_-8px_rgba(0,122,255,0.22),0_0_0_1px_rgba(0,122,255,0.1)]'
                 : 'bg-white/[0.06] shadow-[0_2px_16px_-6px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.04)] hover:bg-white/[0.09] hover:border-[#007AFF]/25 hover:shadow-[0_6px_24px_-8px_rgba(0,122,255,0.18),0_0_0_1px_rgba(255,255,255,0.06)]'
               } active:scale-[0.99]`
            : 'rounded-xl sm:rounded-2xl bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:bg-white/[0.06] hover:border-white/[0.09] hover:text-zinc-300 shadow-[0_1px_12px_-4px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.25)] active:scale-[0.99]'
        }
      `}
    >
      <span className={`
        flex items-center justify-center rounded-xl border transition-colors duration-200
        ${compact ? 'w-9 h-9 [&_svg]:w-4 [&_svg]:h-4 md:w-10 md:h-10 md:[&_svg]:w-5 md:[&_svg]:h-5' : 'w-10 h-10 sm:w-11 sm:h-11'}
        ${isLogout
          ? 'bg-red-500/5 border-red-500/10 text-red-400/70 group-hover:bg-red-500/10 group-hover:border-red-500/20'
          : isPrimary
            ? 'bg-[#007AFF]/10 border-[#007AFF]/18 text-[#007AFF] group-hover:bg-[#007AFF]/16 group-hover:border-[#007AFF]/28'
            : 'bg-white/[0.05] border-white/[0.07] text-zinc-500 group-hover:text-zinc-400'
        }
      `}>
        {iconsMap[action.id] ?? iconsMap.parametres}
      </span>
      <span className={`block w-full font-medium tracking-tight text-inherit antialiased text-center ${compact ? 'text-[13px] md:text-[14px]' : 'text-[14px] sm:text-[15px]'} ${isPrimary && !isLogout ? 'text-white' : ''} ${isSecondary ? 'opacity-90' : ''}`}>
        {action.label}
      </span>
    </motion.button>
  )
}

export default function FullscreenActionMenu({
  open,
  onOpen,
  onClose,
  onAction,
  actions,
}) {
  const [canInteract, setCanInteract] = useState(false)
  const isMobile = useIsMobile()

  const { primary, secondary, logout } = useMemo(() => {
    const p = actions.filter((a) => PRIMARY_IDS.includes(a.id))
    const s = actions.filter((a) => SECONDARY_IDS.includes(a.id))
    const l = actions.find((a) => a.id === 'logout')
    return { primary: p, secondary: s, logout: l }
  }, [actions])

  useEffect(() => {
    if (!open) {
      setCanInteract(false)
      return
    }
    const t = setTimeout(() => setCanInteract(true), ANIMATION_DURATION_MS)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleAction = (id) => {
    if (!canInteract) return
    onClose()
    onAction(id)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-[#0a0a0a]/96 backdrop-blur-xl"
              onClick={handleBackdropClick}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed inset-0 z-[101] flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 lg:p-14 pointer-events-none overflow-y-auto min-h-[100dvh]"
            >
              <div className="pointer-events-auto w-full max-w-4xl mx-auto my-auto">
                <div className="flex justify-end mb-4 sm:mb-6 md:mb-10">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer"
                    className="p-2 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Primary actions — grille compacte sur mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 md:gap-7 lg:gap-8 mb-4 sm:mb-6 md:mb-10">
                  {primary.map((action, i) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      index={i}
                      variant="primary"
                      canInteract={canInteract}
                      onAction={handleAction}
                      iconsMap={icons}
                      compact={isMobile}
                    />
                  ))}
                </div>

                {/* Secondary actions */}
                {secondary.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 md:gap-7 lg:gap-8 mb-6 sm:mb-8 md:mb-12">
                    {secondary.map((action, i) => (
                      <ActionCard
                        key={action.id}
                        action={action}
                        index={primary.length + i}
                        variant="secondary"
                        canInteract={canInteract}
                        onAction={handleAction}
                        iconsMap={icons}
                        compact={isMobile}
                      />
                    ))}
                  </div>
                )}

                {/* Logout — isolé, discret */}
                {logout && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: (primary.length + secondary.length) * STAGGER + 0.1 }}
                    className="flex justify-center pt-3 sm:pt-4 md:pt-6 border-t border-white/[0.06]"
                  >
                    <div className="w-full max-w-[180px] sm:max-w-[220px]">
                      <ActionCard
                        action={logout}
                        index={primary.length + secondary.length}
                        variant="logout"
                        canInteract={canInteract}
                        onAction={handleAction}
                        iconsMap={icons}
                        compact={isMobile}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
  )
}

/** Bouton déclencheur : au-dessus du champ, centré, circulaire, bleu translucide premium, icône + fine */
export function ActionMenuTrigger({ open, onOpen, onClose, className = '' }) {
  return (
    <motion.button
      type="button"
      onClick={open ? onClose : onOpen}
      aria-expanded={open}
      aria-haspopup="true"
      aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
      initial={false}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex items-center justify-center w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full flex-shrink-0 border border-[#007AFF]/20 bg-[#007AFF]/10 text-[#007AFF] shadow-[0_2px_12px_-2px_rgba(0,122,255,0.15),0_0_0_1px_rgba(255,255,255,0.04)] hover:bg-[#007AFF]/16 hover:border-[#007AFF]/30 hover:shadow-[0_4px_20px_-4px_rgba(0,122,255,0.2),0_0_0_1px_rgba(0,122,255,0.08)] active:bg-[#007AFF]/12 transition-all duration-200 ease-out touch-manipulation select-none z-10 ${className}`}
    >
      <motion.span
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="flex items-center justify-center"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </motion.span>
    </motion.button>
  )
}

