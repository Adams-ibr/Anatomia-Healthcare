import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award, Banknote, BookOpen, CheckCircle2, GraduationCap, Megaphone, ShoppingBag, TrendingUp, UserCog, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../lib/store'
import { adminApi, courseApi, getStoredToken, studentApi } from '../lib/api/auth'
import { supabase } from '../lib/supabase'
import { Avatar, Badge, ProgressBar, StatCard } from '../components/ui'
import { formatPrice } from '../lib/utils'

export function AdminDashboard() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [stats, setStats] = useState<{
    users: number
    students: number
    instructors: number
    revenue: number
    courses: number
    enrollments: number
    certificates: number
    completionRate: number
    monthly: { m: string; users: number }[]
  } | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoadingStats(true)
    setStatsError(null)
    supabase.functions.invoke('auth/admin/dashboard', { method: 'GET' })
      .then(({ data, error }) => {
        if (error) throw error
        if (!data) throw new Error('The dashboard returned no statistics.')
        if (!cancelled) setStats(data)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setStatsError(error instanceof Error ? error.message : 'Unable to load dashboard statistics.')
      })
      .finally(() => { if (!cancelled) setLoadingStats(false) })
    return () => { cancelled = true }
  }, [])

  const growth = useMemo(() => stats?.monthly?.map((m) => ({ month: m.m, users: m.users })) ?? [], [stats])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('admin.platformDashboard')}</h1>
        <p className="mt-1 text-sm text-muted">{t('admin.platformDesc')}</p>
      </div>

      {statsError && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <span>{statsError}</span>
          <button onClick={() => window.location.reload()} className="shrink-0 font-semibold underline">{t('admin.retry')}</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('admin.totalUsers')} value={stats ? stats.users.toLocaleString() : loadingStats ? '…' : '—'} sub={t('admin.registered')} icon={<Users className="h-5 w-5" />} />
        <StatCard label={t('admin.students')} value={stats ? stats.students.toLocaleString() : loadingStats ? '…' : '—'} sub={t('admin.activeLearners')} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label={t('admin.instructors')} value={stats ? stats.instructors.toLocaleString() : loadingStats ? '…' : '—'} sub={t('admin.plusNewThisMonth')} icon={<UserCog className="h-5 w-5" />} />
        <StatCard label={t('admin.revenue')} value={stats ? formatPrice(stats.revenue) : loadingStats ? '…' : '—'} sub={t('admin.allTime')} icon={<Banknote className="h-5 w-5" />} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('admin.courses')} value={stats ? stats.courses.toLocaleString() : loadingStats ? '…' : '—'} sub={t('admin.publishedCount')} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label={t('admin.enrollments')} value={stats ? stats.enrollments.toLocaleString() : loadingStats ? '…' : '—'} sub={t('admin.platformWide')} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label={t('admin.certificatesIssued')} value={stats ? stats.certificates.toLocaleString() : loadingStats ? '…' : '—'} sub={t('admin.issuedAllTime')} icon={<Award className="h-5 w-5" />} />
        <StatCard label={t('admin.completionRate')} value={stats ? `${stats.completionRate}%` : loadingStats ? '…' : '—'} sub={t('admin.acrossAll')} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-ink">{t('admin.userGrowth')}</h2>
          {loadingStats ? (
            <p className="py-16 text-center text-sm text-muted">{t('common.loading')}</p>
          ) : growth.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t('admin.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={growth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} />
                <Area type="monotone" dataKey="users" stroke="var(--brand-500)" strokeWidth={2} fill="url(#userg)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-ink">{t('admin.quickActions')}</h2>
          <div className="space-y-2">
            {[
              { label: t('admin.reviewPending'), to: '/admin/courses', icon: <BookOpen className="h-4 w-4" /> },
              { label: t('admin.manageUsers'), to: '/admin/users', icon: <UserCog className="h-4 w-4" /> },
              { label: t('admin.viewRecentOrders'), to: '/admin/orders', icon: <ShoppingBag className="h-4 w-4" /> },
              { label: t('admin.postAnnouncement'), to: '/admin/announcements', icon: <Megaphone className="h-4 w-4" /> }
            ].map((a) => (
              <button key={a.label} onClick={() => nav(a.to)} className="flex w-full items-center gap-3 rounded-card border border-line p-3 text-left text-sm font-medium text-ink hover:border-brand-300 hover:text-brand-700">
                <span className="text-brand-700">{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted">{t('admin.activityUp')}</p>
        </div>
      </div>
    </div>
  )
}

const ROLE_COLORS: Record<string, 'brand' | 'success' | 'warning' | 'danger' | 'ink'> = {
  admin: 'danger', instructor: 'brand', student: 'success', support: 'warning'
}

export function AdminEnrollments() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [remote, setRemote] = useState<{
    id: string
    userId: string
    studentName: string
    courseId: string
    courseTitle: string
    courseThumbnail?: string
    enrolledAt: string
    progress: number
    status: string
    pricePaid: number
  }[] | null>(null)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    let cancelled = false
    studentApi.listAdminEnrollments(token)
      .then((res) => { if (!cancelled) setRemote(res.enrollments) })
      .catch(() => { if (!cancelled) toast(t('admin.errorGeneric'), t('admin.loadFailed'), 'error') })
    return () => { cancelled = true }
  }, [t, toast])

  const rows = remote ?? []

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('admin.enrollments')}</h1>
      {rows.length === 0 ? (
        <div className="card p-12 text-center text-sm text-muted">{t('admin.noData')}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">{t('admin.students')}</th>
                  <th className="px-5 py-3 font-semibold">{t('admin.courses')}</th>
                  <th className="px-5 py-3 font-semibold">{t('admin.date')}</th>
                  <th className="px-5 py-3 font-semibold">{t('admin.progress')}</th>
                  <th className="px-5 py-3 font-semibold">{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((en) => (
                  <tr key={en.id} className="hover:bg-paper/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={en.studentName} size="xs" />
                        <span className="font-medium text-ink">{en.studentName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">{en.courseTitle || en.courseId}</td>
                    <td className="px-5 py-3 text-muted">{new Date(en.enrolledAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex w-28 items-center gap-2">
                        <ProgressBar value={en.progress} className="flex-1" />
                        <span className="text-xs text-muted">{en.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><Badge color={en.status === 'completed' ? 'success' : 'brand'}>{en.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
