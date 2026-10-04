import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Facebook, Instagram, Linkedin, Mail, Twitter, Youtube } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../lib/store'

export function Footer() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')

  const cols = [
    { title: t('footer.platform'), links: [{ label: t('nav.courses'), to: '/courses' }, { label: t('nav.categories'), to: '/courses' }, { label: t('footer.learningPaths'), to: '/courses' }, { label: t('nav.instructors'), to: '/instructors' }, { label: t('nav.pricing'), to: '/pricing' }] },
    { title: t('footer.resources'), links: [{ label: t('nav.blog'), to: '/blog' }, { label: t('footer.helpCenter'), to: '/support' }, { label: t('footer.verifyCertificate'), to: '/verify-certificate' }, { label: t('nav.community'), to: '/community' }, { label: t('nav.about'), to: '/about' }] },
    { title: t('footer.company'), links: [{ label: t('footer.aboutUs'), to: '/about' }, { label: t('footer.careers'), to: '/about' }, { label: t('footer.forBusiness'), to: '/pricing' }, { label: t('footer.becomeInstructor'), to: '/register' }] },
    { title: t('footer.support'), links: [{ label: t('footer.contact'), to: '/support' }, { label: t('footer.faqs'), to: '/support' }, { label: t('footer.terms'), to: '/support' }, { label: t('footer.privacy'), to: '/support' }] }
  ]

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center">
              <img src="/logo.png" alt="Anatomia" className="h-14 w-auto" />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {t('footer.tagline')}
            </p>
            <div className="mt-5 flex gap-2">
              {[Twitter, Linkedin, Youtube, Instagram, Facebook].map((Icon, i) => (
                <a key={i} href="#" aria-label={t('nav.community')} className="rounded-card border border-line p-2.5 text-muted transition-colors hover:border-brand-300 hover:text-brand-700">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {cols.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-ink">{col.title}</h4>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="text-sm text-muted transition-colors hover:text-brand-700">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">© {new Date().getFullYear()} {t('brand.name')}. {t('footer.rights')}</p>
          <form
            className="flex w-full max-w-md gap-2"
            onSubmit={(e) => { e.preventDefault(); if (!email) return; toast(t('footer.subscribedTitle'), t('footer.subscribedBody')); setEmail('') }}
          >
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder={t('footer.emailForUpdates')} className="input-base pl-9" />
            </div>
            <button type="submit" className="btn-primary">{t('footer.subscribe')}</button>
          </form>
        </div>
      </div>
    </footer>
  )
}