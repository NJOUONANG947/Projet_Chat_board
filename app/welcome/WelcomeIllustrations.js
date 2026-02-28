'use client'

/**
 * Illustrations parlantes + animations réelles (Framer Motion).
 * Hero : scène narrative (chat IA, CV, progression). Animations : typing, courbe, float.
 * Icônes : hover et entrée animées.
 */

import { motion } from 'framer-motion'

const stroke = 'currentColor'
const strokeWidth = 1.5
const className = 'w-full h-full'

// —— Hero : scène parlante (écran = chat IA + document CV + courbe de progression)
export function HeroIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex justify-center"
    >
      <motion.svg
        viewBox="0 0 320 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} max-w-[520px] max-h-[292px] text-zinc-600`}
        aria-hidden
      >
        {/* Cadre écran */}
        <motion.rect
          x="24"
          y="20"
          width="272"
          height="140"
          rx="10"
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={0.35}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        <line x1="24" y1="44" x2="296" y2="44" stroke={stroke} strokeWidth={strokeWidth} opacity={0.25} />

        {/* Bulle de réponse IA (avec texte simulé) */}
        <motion.path
          d="M48 58 h140 v52 l-24 -10 H48 a6 6 0 01-6-6V58a6 6 0 016-6z"
          stroke="#007AFF"
          strokeWidth={strokeWidth}
          fill="rgba(0,122,255,0.06)"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        />
        {/* Ligne de texte simulé */}
        <motion.line
          x1="64"
          y1="76"
          x2="160"
          y2="76"
          stroke="#007AFF"
          strokeWidth={1}
          opacity={0.5}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ transformOrigin: '64px 76px' }}
        />
        <motion.line
          x1="64"
          y1="86"
          x2="128"
          y2="86"
          stroke="#007AFF"
          strokeWidth={1}
          opacity={0.4}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          style={{ transformOrigin: '64px 86px' }}
        />
        {/* Points de typing (animation en boucle) */}
        <motion.circle
          cx="72"
          cy="100"
          r="3"
          fill="#007AFF"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.2 }}
        />
        <motion.circle
          cx="84"
          cy="100"
          r="3"
          fill="#007AFF"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.2, delay: 0.15 }}
        />
        <motion.circle
          cx="96"
          cy="100"
          r="3"
          fill="#007AFF"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.2, delay: 0.3 }}
        />

        {/* Document CV (à droite) — léger float */}
        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.rect
            x="208"
            y="56"
            width="80"
            height="100"
            rx="6"
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={0.5}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.5, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          />
          <line x1="220" y1="76" x2="272" y2="76" stroke={stroke} strokeWidth={1} opacity={0.4} />
          <line x1="220" y1="88" x2="260" y2="88" stroke={stroke} strokeWidth={1} opacity={0.4} />
          <line x1="220" y1="100" x2="276" y2="100" stroke={stroke} strokeWidth={1} opacity={0.4} />
          <motion.rect
            x="238"
            y="118"
            width="32"
            height="8"
            rx="2"
            fill="#007AFF"
            opacity={0.25}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          />
        </motion.g>

        {/* Courbe de progression — tracé animé (pathLength sur path équivalent) */}
        <motion.path
          d="M 48 138 L 72 122 L 96 130 L 120 110 L 144 118 L 168 98 L 192 106"
          stroke="#007AFF"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        />
        <motion.circle
          cx="192"
          cy="106"
          r="5"
          fill="#007AFF"
          opacity={0.8}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 1.2 }}
        />

        {/* Petit label "CV" sur le document */}
        <motion.text
          x="258"
          y="126"
          fontFamily="system-ui, sans-serif"
          fontSize="8"
          fill="#007AFF"
          opacity={0.8}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 1 }}
        >
          CV
        </motion.text>
      </motion.svg>
    </motion.div>
  )
}

// —— Icônes avec animation au hover et à l'entrée
function IconWrapper({ children, delay = 0 }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.08 }}
      className="inline-flex items-center justify-center"
    >
      {children}
    </motion.span>
  )
}

export function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconDocument() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconFolder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconSend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <line x1="22" y1="2" x2="11" y2="13" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2L15 22 11 13 2 9l20-7z" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconChecklist() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path d="M9 11l3 3L22 4" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconBriefcase() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <rect x="2" y="7" width="20" height="14" rx="2" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const featureIcons = {
  chat: IconChat,
  document: IconDocument,
  folder: IconFolder,
  send: IconSend,
  checklist: IconChecklist,
  briefcase: IconBriefcase
}

export function FeatureIcon({ name, className: cn, index = 0 }) {
  const Icon = featureIcons[name] || IconChat
  return (
    <IconWrapper delay={index * 0.05}>
      <span
        className={cn || 'flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.06] text-zinc-400'}
        aria-hidden
      >
        <Icon />
      </span>
    </IconWrapper>
  )
}
