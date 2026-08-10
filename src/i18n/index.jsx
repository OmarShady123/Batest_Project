import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ar } from './ar'
import { en } from './en'

export const LANGUAGES = ['ar', 'en']
const DICTIONARIES = { ar, en }
const STORAGE_KEY = 'bastet_lang'

// The Three.js tour iframe reads this key directly; keep it mirrored so the
// embedded tour and the site never disagree about the active language.
const TOUR_STORAGE_KEY = 'bastet_tour_lang'
const LEGACY_TOUR_STORAGE_KEY = 'bastet-language'

const LanguageContext = createContext(null)

function readInitialLanguage() {
  if (typeof window === 'undefined') return 'ar'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (LANGUAGES.includes(saved)) return saved
  const fromTour = window.localStorage.getItem(TOUR_STORAGE_KEY)
  if (LANGUAGES.includes(fromTour)) return fromTour
  const fromLegacyTour = window.localStorage.getItem(LEGACY_TOUR_STORAGE_KEY)
  if (LANGUAGES.includes(fromLegacyTour)) return fromLegacyTour
  return 'ar'
}

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict)
}

function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  )
}

/**
 * Resolve a dot-separated key for the given language.
 * Falls back to Arabic (the source language) and finally to the key itself,
 * so a missing translation degrades to readable text instead of blanking out.
 */
export function translate(lang, key, vars) {
  const value = lookup(DICTIONARIES[lang] || DICTIONARIES.ar, key)
  if (typeof value === 'string') return interpolate(value, vars)
  if (Array.isArray(value)) return value

  if (lang !== 'ar') {
    const fallback = lookup(DICTIONARIES.ar, key)
    if (typeof fallback === 'string') return interpolate(fallback, vars)
    if (Array.isArray(fallback)) return fallback
  }

  if (import.meta.env.DEV) {
    console.warn(`[i18n] missing key "${key}" for language "${lang}"`)
  }
  return key
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readInitialLanguage)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang)
    window.localStorage.setItem(TOUR_STORAGE_KEY, lang)
    window.localStorage.setItem(LEGACY_TOUR_STORAGE_KEY, lang)
    document.documentElement.lang = lang
    document.documentElement.dir = dir

    // Keep the tab title and the crawler-facing metadata in the active language.
    document.title = translate(lang, 'meta.title')
    const description = document.querySelector('meta[name="description"]')
    if (description) description.setAttribute('content', translate(lang, 'meta.description'))
    const ogLocale = document.querySelector('meta[property="og:locale"]')
    if (ogLocale) ogLocale.setAttribute('content', lang === 'ar' ? 'ar_AR' : 'en_US')
  }, [lang, dir])

  const setLanguage = useCallback((next) => {
    if (LANGUAGES.includes(next)) setLang(next)
  }, [])
  const toggleLang = useCallback(() => setLang((prev) => (prev === 'ar' ? 'en' : 'ar')), [])

  const value = useMemo(() => {
    const t = (key, vars) => translate(lang, key, vars)
    return {
      lang,
      dir,
      isAr: lang === 'ar',
      t,
      setLang: setLanguage,
      toggleLang,
      // Picks the localized variant of a data field that follows the
      // `field` / `fieldEn` convention used across src/data.
      field: (record, name) => {
        if (!record) return ''
        if (lang === 'ar') return record[name] ?? ''
        const enKey = `${name}En`
        return record[enKey] ?? record[name] ?? ''
      },
    }
  }, [lang, dir, setLanguage, toggleLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useI18n must be used inside a LanguageProvider')
  return ctx
}

/** Convenience hook for components that only need the lookup function. */
export function useT() {
  return useI18n().t
}
