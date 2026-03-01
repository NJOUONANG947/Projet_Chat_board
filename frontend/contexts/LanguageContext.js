'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { getStoredLanguage, setStoredLanguage, getTranslations } from '../lib/translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('fr')

  useEffect(() => {
    setLangState(getStoredLanguage())
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = (newLang) => {
    if (newLang !== 'fr' && newLang !== 'en') return
    setLangState(newLang)
    setStoredLanguage(newLang)
  }

  const t = getTranslations(lang)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    const t = getTranslations(getStoredLanguage())
    return { lang: 'fr', setLang: () => {}, t }
  }
  return ctx
}
