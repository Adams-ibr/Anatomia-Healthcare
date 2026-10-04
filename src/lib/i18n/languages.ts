export interface Language {
  code: string
  label: string
  flag: string
}

export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pcm', label: 'Pidgin', flag: '🇳🇬' }
]

export const DEFAULT_LANGUAGE = 'en'