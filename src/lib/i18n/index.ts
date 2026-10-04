import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { DEFAULT_LANGUAGE } from './languages'
import en from './resources/en'
import pcm from './resources/pcm'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pcm: { translation: pcm }
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ['en', 'pcm'],
    nonExplicitSupportedLngs: true,
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'dha:lang'
    },
    interpolation: { escapeValue: false }
  })

export default i18n