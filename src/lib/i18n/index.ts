import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { DEFAULT_LANGUAGE } from './languages'
import en from './resources/en'
import ha from './resources/ha'
import yo from './resources/yo'
import ig from './resources/ig'
import pcm from './resources/pcm'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ha: { translation: ha },
      yo: { translation: yo },
      ig: { translation: ig },
      pcm: { translation: pcm }
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ['en', 'ha', 'yo', 'ig', 'pcm'],
    nonExplicitSupportedLngs: true,
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'dha:lang'
    },
    interpolation: { escapeValue: false }
  })

export default i18n