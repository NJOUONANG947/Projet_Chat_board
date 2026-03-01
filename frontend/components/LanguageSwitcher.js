'use client'

import { useLanguage } from '../contexts/LanguageContext'

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useLanguage()

  return (
    <div className={`flex rounded-lg border border-white/[0.1] bg-white/[0.04] p-0.5 ${className}`} role="group" aria-label="Language">
      <button
        type="button"
        onClick={() => setLang('fr')}
        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${lang === 'fr' ? 'bg-[#007AFF] text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${lang === 'en' ? 'bg-[#007AFF] text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
      >
        EN
      </button>
    </div>
  )
}
