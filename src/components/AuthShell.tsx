import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { ArrowUpRight, BookOpenCheck, Check, Sparkles } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="auth-shell min-h-screen overflow-hidden bg-paper">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 sm:px-8 lg:px-12">
        <header className="flex h-[84px] shrink-0 items-center justify-between">
          <Link to="/" aria-label="Anatomia home" className="inline-flex rounded-xl bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-line/70">
            <img src="/logo.png" alt="Anatomia Education" className="h-10 w-auto sm:h-11" />
          </Link>
          <LanguageSwitcher />
        </header>

        <main className="flex flex-1 items-center py-6 sm:py-10">
          <div className="mx-auto grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <section className="auth-hero relative hidden min-h-[620px] flex-col justify-between overflow-hidden rounded-[2rem] border border-brand-100 bg-brand-50 p-9 sm:p-12 lg:flex">
              <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-20 h-80 w-80 rounded-full bg-brand-200/55 blur-3xl" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-brand-100 blur-3xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                  <Sparkles className="h-3.5 w-3.5" /> Anatomia learning
                </div>
                <h2 className="auth-hero-title mt-10 max-w-lg text-4xl font-semibold leading-[1.12] tracking-tight text-ink xl:text-5xl">
                  A clearer path to understanding the human body.
                </h2>
                <p className="mt-5 max-w-md text-base leading-7 text-muted">
                  Learn with practical, expert-led courses designed to make complex anatomy easier to understand.
                </p>
              </div>

              <div className="auth-hero-note relative z-10 rounded-2xl border border-white/80 bg-white/75 p-5 shadow-sm backdrop-blur-sm sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <BookOpenCheck className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">Make progress that lasts</p>
                    <p className="mt-1 text-sm leading-6 text-muted">Study at your own pace, revisit lessons, and keep your learning journey in one place.</p>
                  </div>
                  <ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-brand-600" />
                </div>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line/80 pt-4 text-xs font-medium text-muted">
                  <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Expert-led learning</span>
                  <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Learn on your schedule</span>
                </div>
              </div>
            </section>

            <section className="card mx-auto w-full max-w-xl self-center rounded-[2rem] border-line/80 bg-surface p-6 shadow-[0_24px_80px_-40px_rgba(23,43,50,0.26)] sm:p-9 lg:p-10">
              <div className="mb-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Welcome to Anatomia</p>
                <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-[2.1rem]">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-muted sm:text-base">{subtitle}</p>
              </div>
              {children}
              <div className="mt-7 border-t border-line pt-5 text-center text-sm text-muted">{footer}</div>
            </section>
          </div>
        </main>

        <footer className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-t border-line/80 py-4 text-xs text-muted">
          <span>© {new Date().getFullYear()} Anatomia Education</span>
          <Link to="/" className="font-medium transition-colors hover:text-brand-700">Back to home</Link>
        </footer>
      </div>
    </div>
  )
}
