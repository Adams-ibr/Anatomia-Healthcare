import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { LanguageSwitcher } from './LanguageSwitcher'

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[45%] flex-col justify-between bg-brand-900 p-10 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-brand-500">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold text-white">Hama</p>
            <p className="-mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-brand-300">Academy</p>
          </div>
        </Link>
        <div>
          <h2 className="max-w-md font-display text-3xl font-bold leading-snug text-white">
            {t('auth.quote')}
          </h2>
          <p className="mt-4 max-w-md text-brand-200">{t('auth.quoteAuthor')}</p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-brand-700 pt-8">
            {[[t('auth.statLearners'), t('auth.statLearnersLabel')], [t('auth.statCourses'), t('auth.statCoursesLabel')], [t('auth.statSatisfaction'), t('auth.statSatisfactionLabel')]].map(([v, l]) => (
              <div key={l}>
                <p className="text-2xl font-bold text-white">{v}</p>
                <p className="text-xs text-brand-300">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center bg-paper px-4 py-12">
        <div className="absolute right-4 top-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-card bg-brand-500">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <p className="font-display text-lg font-bold text-ink">{t('brand.name')}</p>
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        </div>
      </div>
    </div>
  )
}