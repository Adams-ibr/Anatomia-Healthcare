import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogOut, Menu, Search, X } from 'lucide-react'
import { useApp } from '../lib/store'
import { Avatar, Button } from './ui'
import { LanguageSwitcher } from './LanguageSwitcher'
import { cn } from '../lib/utils'
import { EASE } from '../lib/motion'

function Logo() {
  return (
    <Link to="/" className="flex items-center">
      <img src="/logo.png" alt="Anatomia" className="h-14 w-auto" />
    </Link>
  )
}

export function Navbar() {
  const { currentUser, logout } = useApp()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const nav = useNavigate()

  const portal = currentUser?.role === 'admin' ? '/admin' : currentUser?.role === 'instructor' ? '/instructor' : '/dashboard'

  const publicLinks = [
    { to: '/courses', label: t('nav.courses') },
    { to: '/instructors', label: t('nav.instructors') },
    { to: '/pricing', label: t('nav.pricing') },
    { to: '/about', label: t('nav.about') },
    { to: '/blog', label: t('nav.blog') },
    { to: '/support', label: t('nav.support') }
  ]

  const portalLabel = currentUser?.role === 'admin' ? t('nav.adminDashboard') : currentUser?.role === 'instructor' ? t('nav.instructorDashboard') : t('nav.studentDashboard')

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t('nav.home')}>
          {publicLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => cn('rounded px-3 py-2 text-sm font-medium transition-colors', isActive ? 'text-brand-700' : 'text-muted hover:text-ink')}>
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/courses" className="rounded p-2 text-muted hover:text-ink" aria-label={t('nav.searchCourses')}>
            <Search className="h-4.5 h-5 w-5" />
          </NavLink>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          {currentUser ? (
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-control px-2 py-1.5 hover:bg-line/50">
                <Avatar name={currentUser.name} size="sm" />
                <span className="text-sm font-medium text-ink">{currentUser.name.split(' ')[0]}</span>
                <ChevronDown className="h-4 w-4 text-muted" />
              </button>
              {profileOpen && (
                <AnimatePresence>
                  <motion.div
                    key="profile-menu"
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: EASE }}
                  >
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="card absolute right-0 z-50 mt-2 w-52 p-1.5 shadow-panel">
                      <Link to={portal} onClick={() => setProfileOpen(false)} className="block rounded px-3 py-2 text-sm text-ink hover:bg-line/40">{portalLabel}</Link>
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="block rounded px-3 py-2 text-sm text-ink hover:bg-line/40">{t('nav.profile')}</Link>
                      <Link to="/settings" onClick={() => setProfileOpen(false)} className="block rounded px-3 py-2 text-sm text-ink hover:bg-line/40">{t('nav.settings')}</Link>
                      <button onClick={() => { logout(); setProfileOpen(false); nav('/') }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-danger hover:bg-danger/5">
                        <LogOut className="h-4 w-4" /> {t('nav.signOut')}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={() => nav('/login')}>{t('nav.login')}</Button>
              <Button onClick={() => nav('/register')}>{t('nav.getStarted')}</Button>
            </>
          )}
        </div>

        <button className="rounded p-2 text-ink lg:hidden" onClick={() => setOpen(!open)} aria-label={t('common.close')}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden border-t border-line bg-surface lg:hidden"
          >
            <div className="container-page flex flex-col gap-1 py-3">
              {publicLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded px-3 py-2.5 text-sm font-medium text-ink hover:bg-line/40">{l.label}</Link>
              ))}
              <div className="my-2 border-t border-line" />
              {currentUser ? (
                <>
                  <Link to={portal} onClick={() => setOpen(false)} className="rounded px-3 py-2.5 text-sm font-medium text-brand-700">{t('nav.dashboard')}</Link>
                  <button onClick={() => { logout(); setOpen(false); nav('/') }} className="rounded px-3 py-2.5 text-left text-sm text-danger">{t('nav.signOut')}</button>
                </>
              ) : (
                <div className="flex gap-2 px-3 pb-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setOpen(false); nav('/login') }}>{t('nav.login')}</Button>
                  <Button className="flex-1" onClick={() => { setOpen(false); nav('/register') }}>{t('nav.getStarted')}</Button>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 pt-1">
                <LanguageSwitcher className="ml-auto" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}