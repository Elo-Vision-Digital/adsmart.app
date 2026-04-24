import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Globe } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const { theme } = useTheme()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languageOptions = [
    { code: 'pt', label: 'PT', flag: '🇧🇷' },
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'es', label: 'ES', flag: '🇪🇸' },
  ]

  const currentLang = languageOptions.find((l) => l.code === language) || languageOptions[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-1 text-sm px-3 py-2 rounded-lg transition-colors ${
          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/10'
        }`}
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang.label}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute right-0 mt-2 w-32 rounded-lg shadow-lg overflow-hidden z-50 ${
              theme === 'dark'
                ? 'bg-black border border-white/20'
                : 'bg-white border border-black/10'
            }`}
          >
            {languageOptions.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as 'pt' | 'en' | 'es')
                  setShowDropdown(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                  language === lang.code
                    ? theme === 'dark'
                      ? 'bg-white/10'
                      : 'bg-black/10'
                    : theme === 'dark'
                      ? 'hover:bg-white/5'
                      : 'hover:bg-black/5'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
