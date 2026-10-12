import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, BarChart3, Bell, BookOpen, Calendar, CheckSquare, ChevronDown,
  ClipboardList, FileText, GraduationCap, Heart, LayoutDashboard, LogOut, Mail,
  Megaphone, MessageSquare, Package, Palette, Settings, ShoppingBag,
  Tag, Users, Wallet, X, Home, Search, Trophy, UserCog, DollarSign, Receipt, ChartColumn, PanelLeft,
  Box, Layers, HelpCircle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../lib/store'
import { Avatar, Badge } from '../components/ui'
import { cn, initials } from '../lib/utils'
import { EASE } from '../lib/motion'

export interface NavItem { 
  label: string
  to?: string
  icon: React.ReactNode
  end?: boolean
  children?: NavItem[]
}

const STUDENT_NAV: NavItem[] = [
  { label: 'dashboard', to: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  {
    label: 'nav.learning',
    icon: <BookOpen className="h-4 w-4" />,
    children: [
      { label: 'myLearning', to: '/my-learning', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'discover', to: '/courses', icon: <Search className="h-4 w-4" /> },
      { label: 'wishlist', to: '/wishlist', icon: <Heart className="h-4 w-4" /> }
    ]
  },
  {
    label: 'nav.academics',
    icon: <ClipboardList className="h-4 w-4" />,
    children: [
      { label: 'assignments', to: '/assignments', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'assessments', to: '/assessments', icon: <CheckSquare className="h-4 w-4" /> },
      { label: 'calendar', to: '/calendar', icon: <Calendar className="h-4 w-4" /> }
    ]
  },
  {
    label: 'nav.account',
    icon: <UserCog className="h-4 w-4" />,
    children: [
      { label: 'certificates', to: '/certificates', icon: <GraduationCap className="h-4 w-4" /> },
      { label: 'My Orders', to: '/orders', icon: <ShoppingBag className="h-4 w-4" /> }
    ]
  },
  { label: 'messages', to: '/messages', icon: <MessageSquare className="h-4 w-4" /> },
  { label: 'nav.community', to: '/community', icon: <Users className="h-4 w-4" /> }
]

const INSTRUCTOR_NAV: NavItem[] = [
  { label: 'dashboard', to: '/instructor', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  {
    label: 'nav.courses',
    icon: <BookOpen className="h-4 w-4" />,
    children: [
      { label: 'myCourses', to: '/instructor/courses', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'createCourse', to: '/instructor/courses/new', icon: <PanelLeft className="h-4 w-4" /> }
    ]
  },
  {
    label: 'nav.insights',
    icon: <BarChart3 className="h-4 w-4" />,
    children: [
      { label: 'students', to: '/instructor/students', icon: <Users className="h-4 w-4" /> },
      { label: 'analytics', to: '/instructor/analytics', icon: <BarChart3 className="h-4 w-4" /> },
      { label: 'earnings', to: '/instructor/earnings', icon: <Wallet className="h-4 w-4" /> }
    ]
  },
  { label: 'messages', to: '/messages', icon: <MessageSquare className="h-4 w-4" /> }
]

const ADMIN_NAV: NavItem[] = [
  { label: 'dashboard', to: '/admin', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { label: 'users', to: '/admin/users', icon: <UserCog className="h-4 w-4" /> },
  { label: 'courses', to: '/admin/courses', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'categories', to: '/admin/categories', icon: <Tag className="h-4 w-4" /> },
  { label: 'modules', to: '/admin/modules', icon: <Layers className="h-4 w-4" /> },
  { label: 'lessons', to: '/admin/lessons', icon: <FileText className="h-4 w-4" /> },
  { label: '3D Models', to: '/admin/anatomy-models', icon: <Box className="h-4 w-4" /> },
  { label: 'flashcards', to: '/admin/flashcards', icon: <Layers className="h-4 w-4" /> },
  { label: 'questionBank', to: '/admin/question-bank', icon: <HelpCircle className="h-4 w-4" /> },
  { label: 'enrollments', to: '/admin/enrollments', icon: <Users className="h-4 w-4" /> },
  { label: 'certificates', to: '/admin/certificates', icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'orders', to: '/admin/orders', icon: <ShoppingBag className="h-4 w-4" /> },
  { label: 'payments', to: '/admin/payments', icon: <DollarSign className="h-4 w-4" /> },
  { label: 'announcements', to: '/admin/announcements', icon: <Megaphone className="h-4 w-4" /> },
  { label: 'reports', to: '/admin/reports', icon: <FileText className="h-4 w-4" /> },
  { label: 'analytics', to: '/admin/analytics', icon: <ChartColumn className="h-4 w-4" /> },
  { label: 'adminSettings', to: '/admin/settings', icon: <Settings className="h-4 w-4" /> }
]

function SidebarContent({ nav, role }: { nav: NavItem[]; role: string }) {
  const { t } = useTranslation()
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link to="/" className="mb-6 flex shrink-0 items-center gap-2 px-3">
        <img src="/logo.png" alt="Anatomia" className="h-10 w-auto" />
      </Link>
      
      {/* Section Label */}
      <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
        {t(`nav.${role}Dashboard`)}
      </p>
      
      {/* Scrollable nav area */}
      <div className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
        <nav className="flex flex-col gap-1 px-2" aria-label="Portal navigation">
          {nav.map((item) => {
            const isExpanded = expandedGroups.includes(item.label)
            
            // Group with children (dropdown)
            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-ink"
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0">{item.icon}</span>
                      <span>{t(item.label)}</span>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-9 mt-1 space-y-1 border-l-2 border-line pl-3">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.to}
                              to={child.to!}
                              end={child.end}
                              className={({ isActive }) => cn(
                                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                                isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-muted hover:bg-surface-raised hover:text-ink'
                              )}
                            >
                              <span className="shrink-0">{child.icon}</span>
                              <span>{t(child.label)}</span>
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            }
            
            // Regular nav item
            return (
              <NavLink
                key={item.to}
                to={item.to!}
                end={item.end}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-surface-raised hover:text-ink'
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{t(item.label)}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
      
      {/* Fixed bottom section */}
      <div className="mt-4 shrink-0 space-y-1 border-t border-line px-2 pt-4">
        <NavLink 
          to="/settings" 
          className={({ isActive }) => cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', 
            isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-surface-raised hover:text-ink'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>{t('nav.settings')}</span>
        </NavLink>
        <Link 
          to="/" 
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-ink"
        >
          <Home className="h-4 w-4 shrink-0" />
          <span>{t('nav.backToSite')}</span>
        </Link>
      </div>
    </div>
  )
}

const getMobileNav = (role: string): NavItem[] => {
  if (role === 'student') {
    return [
      { label: 'dashboard', to: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, end: true },
      { label: 'discover', to: '/courses', icon: <Search className="h-5 w-5" /> },
      { label: 'messages', to: '/messages', icon: <MessageSquare className="h-5 w-5" /> },
      { label: 'settings', to: '/settings', icon: <Settings className="h-5 w-5" /> },
      { label: 'profile', to: '/profile', icon: <Users className="h-5 w-5" /> }
    ]
  }
  if (role === 'instructor') {
    return [
      { label: 'dashboard', to: '/instructor', icon: <LayoutDashboard className="h-5 w-5" />, end: true },
      { label: 'myCourses', to: '/instructor/courses', icon: <BookOpen className="h-5 w-5" /> },
      { label: 'students', to: '/instructor/students', icon: <Users className="h-5 w-5" /> },
      { label: 'messages', to: '/messages', icon: <MessageSquare className="h-5 w-5" /> },
      { label: 'settings', to: '/settings', icon: <Settings className="h-5 w-5" /> }
    ]
  }
  if (role === 'admin') {
    return [
      { label: 'dashboard', to: '/admin', icon: <LayoutDashboard className="h-5 w-5" />, end: true },
      { label: 'users', to: '/admin/users', icon: <Users className="h-5 w-5" /> },
      { label: 'courses', to: '/admin/courses', icon: <BookOpen className="h-5 w-5" /> },
      { label: 'analytics', to: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" /> },
      { label: 'adminSettings', to: '/admin/settings', icon: <Settings className="h-5 w-5" /> }
    ]
  }
  return [
    { label: 'home', to: '/', icon: <Home className="h-5 w-5" />, end: true }
  ]
}

export function PortalLayout({ nav, role }: { nav: NavItem[]; role: string }) {
  const { currentUser, logout, notifications, conversations, messages } = useApp()
  const { t } = useTranslation()
  const [mobileNav, setMobileNav] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navTo = useNavigate()
  if (!currentUser) return null

  const unread = (notifications ?? []).filter((n) => !n.read).length
  const unreadMsg = (conversations ?? []).reduce((acc, cv) => {
    const msgs = (messages ?? []).filter((m) => m.conversationId === cv.id && m.toId === currentUser.id && !m.read)
    return acc + msgs.length
  }, 0)

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-60 border-r border-line bg-surface px-3 py-5 lg:block">
        <SidebarContent nav={nav} role={role} />
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
          <button className="rounded p-2 text-ink lg:hidden" onClick={() => setMobileNav(true)} aria-label={t('nav.openNavigation')}>
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-muted lg:block">
            <Link to="/" className="hover:text-brand-700">Anatomia</Link>
            <span className="mx-2 text-line">/</span>
            <span className="font-medium text-ink capitalize">{role}</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/courses" className="rounded p-2 text-muted hover:bg-line/40 hover:text-ink" aria-label={t('common.search')}>
              <Search className="h-4.5 h-5 w-5" />
            </Link>

            <div className="relative">
              <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }} className="relative rounded p-2 text-muted hover:bg-line/40 hover:text-ink" aria-label={t('nav.notifications')}>
                <Bell className="h-5 w-5" />
                {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread}</span>}
              </button>
              {notifOpen && (
                <AnimatePresence>
                  <motion.div
                    key="notif-menu"
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: EASE }}
                  >
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="card absolute right-0 z-50 mt-2 w-80 p-0 shadow-panel">
                      <div className="flex items-center justify-between border-b border-line px-4 py-3">
                        <p className="text-sm font-semibold text-ink">{t('nav.notifications')}</p>
                        <Link to="/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-medium text-brand-700 hover:underline">{t('common.seeAll')}</Link>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.slice(0, 5).map((n) => (
                          <Link key={n.id} to={n.link ?? '/notifications'} onClick={() => setNotifOpen(false)} className="flex gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-line/30">
                            <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-line' : 'bg-brand-500')} />
                            <div>
                              <p className="text-sm font-medium text-ink">{n.title}</p>
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted">{n.message}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            <div className="relative">
              <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }} className="flex items-center gap-2 rounded p-1.5 hover:bg-line/40">
                <Avatar name={currentUser.name} size="sm" />
                <ChevronDown className="hidden h-4 w-4 text-muted sm:block" />
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
                    <div className="card absolute right-0 z-50 mt-2 w-56 p-1.5 shadow-panel">
                      <div className="border-b border-line px-3 py-2.5">
                        <p className="text-sm font-semibold text-ink">{currentUser.name}</p>
                        <p className="text-xs text-muted">{currentUser.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="mt-1 block rounded px-3 py-2 text-sm text-ink hover:bg-line/40">{t('nav.profile')}</Link>
                      <Link to="/settings" onClick={() => setProfileOpen(false)} className="block rounded px-3 py-2 text-sm text-ink hover:bg-line/40">{t('nav.settings')}</Link>
                      <button onClick={() => { logout(); navTo('/') }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-danger hover:bg-danger/5">
                        <LogOut className="h-4 w-4" />{t('nav.signOut')}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {mobileNav && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileNav(false)}
            />
            <motion.div
              className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              <div className="flex shrink-0 justify-end p-4">
                <button onClick={() => setMobileNav(false)} className="rounded p-2 text-muted hover:text-ink" aria-label={t('nav.closeNavigation')}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <SidebarContent nav={nav} role={role} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-surface py-1.5 pb-[max(6px,env(safe-area-inset-bottom))] lg:hidden" aria-label="Mobile">
        {getMobileNav(role).map((item) => (
          <NavLink key={item.label} to={item.to!} end={item.end} aria-label={t(item.label)} className={({ isActive }) => cn('flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded px-3 py-1 text-[10px] font-medium', isActive ? 'text-brand-700' : 'text-muted')}>
            {item.icon}
            <span>{t(item.label)}</span>
          </NavLink>
        ))}
      </nav>
      <div className="h-14 lg:hidden" />
    </div>
  )
}
