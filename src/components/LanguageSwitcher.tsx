import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Globe } from 'lucide-react'
import { LANGUAGES } from '../lib/i18n/languages'
import { cn } from '../lib/utils'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded p-2 text-muted transition-colors hover:bg-line/40 hover:text-ink"
        aria-label={i18n.t('nav.switchLanguage')}
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm">{current.flag}</span>
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-label="Close" />
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-card border border-line bg-surface p-1 shadow-card">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => { i18n.changeLanguage(l.code); setOpen(false) }}
                className={cn('flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm', l.code === current.code ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-line/40')}
              >
                <span>{l.flag}</span>
                <span className="flex-1">{l.label}</span>
                {l.code === current.code && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}