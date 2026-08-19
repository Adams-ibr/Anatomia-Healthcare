export interface Language {
  code: string
  label: string
  flag: string
}

export const LANGUAGES: Language[] = [
  { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pcm', label: 'Pidgin', flag: '🇳🇬' },
  { code: 'yo', label: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', label: 'Igbo', flag: '🇳🇬' }
]

export const DEFAULT_LANGUAGE = 'ha'