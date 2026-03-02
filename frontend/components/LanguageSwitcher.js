'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  const select = (l) => {
    setLang(l)
    setOpen(false)
  }

  const btnActive = 'bg-[#007AFF] text-white'
  const btnInactive = 'text-zinc-400 hover:text-zinc-200'

  return (
    <div ref={ref} className={`relative ${className}`} role="group" aria-label="Language">
      {/* Mobile: une seule pastille (langue active), tap = mini menu */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center gap-0.5 w-8 h-8 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 rounded-md bg-white/[0.04] border border-white/[0.06]"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={lang === 'fr' ? 'Langue : Français' : 'Language: English'}
        >
          <span className="uppercase tracking-wide">{lang}</span>
          <svg
            className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div
            className="absolute top-full right-0 mt-1 py-0.5 rounded-lg bg-zinc-900/95 border border-white/[0.08] shadow-xl z-[100] min-w-[72px] backdrop-blur-sm"
            role="listbox"
          >
            <button
              type="button"
              role="option"
              aria-selected={lang === 'fr'}
              onClick={() => select('fr')}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-colors ${lang === 'fr' ? btnActive : btnInactive}`}
            >
              FR
            </button>
            <button
              type="button"
              role="option"
              aria-selected={lang === 'en'}
              onClick={() => select('en')}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-colors ${lang === 'en' ? btnActive : btnInactive}`}
            >
              EN
            </button>
          </div>
        )}
      </div>

      {/* Desktop: switch FR | EN visible, compact */}
      <div
        className="hidden md:flex rounded-md border border-white/[0.08] bg-white/[0.04] p-0.5"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={lang === 'fr'}
          onClick={() => setLang('fr')}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${lang === 'fr' ? btnActive : btnInactive}`}
        >
          FR
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={lang === 'en'}
          onClick={() => setLang('en')}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${lang === 'en' ? btnActive : btnInactive}`}
        >
          EN
        </button>
      </div>
    </div>
  )
}
