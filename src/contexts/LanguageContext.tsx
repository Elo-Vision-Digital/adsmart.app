import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Language, Translations } from '@/locales/types'
import ptBR from '@/locales/pt-BR.json'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

const translations: Record<Language, Translations> = {
  pt: ptBR as Translations,
  en: en as Translations,
  es: es as Translations,
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, any>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language')
    if (saved && ['pt', 'en', 'es'].includes(saved)) {
      return saved as Language
    }

    const browserLang = navigator.language.split('-')[0]
    if (browserLang === 'pt') return 'pt'
    if (browserLang === 'es') return 'es'
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.')
    let value: any = translations[language]

    for (const k of keys) {
      value = value?.[k]
    }

    if (typeof value === 'string' && params) {
      // Replace placeholders with actual values
      return value.replace(/{(\w+)}/g, (match, param) => {
        return params[param]?.toString() || match
      })
    }

    return value || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
