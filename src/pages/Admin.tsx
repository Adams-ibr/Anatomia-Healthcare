import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award, Banknote, BookOpen, CheckCircle2, GraduationCap, Megaphone, ShoppingBag, TrendingUp, UserCog, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../lib/store'
import { adminApi, courseApi, getStoredToken, studentApi } from '../lib/api/auth'
import { Avatar, Badge, ProgressBar, StatCard } from '../components/ui'
import { formatPrice } from '../lib/utils'

export function AdminDashboard() {
  const { enrollments } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [stats, setStats] = useState<{
    users: number
    students: number
    instructors: number
    revenue: number
    courses: number
    certificates: number
    orders: number
    monthly: { m: string; revenue: number }[]
  } | null>(null)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    let cancelled = false
    Promise.all([
      adminApi.getPayments(token),
      adminApi.listUsers(token, { page: 1, perPage: 1 }),
      adminApi.listUsers(token, { page: 1, perPage: 1, role: 'student' }),
      adminApi.listUsers(token, { page: 1, perPage: 1, role: 'instructor' }),
      courseApi.listCourses(token, { page: 1, perPage: 1, status: 'all' }),
      adminApi.listCertificates(token)
    ]).then(([pay, users, students, instructors, courses, certs]) => {
      if (cancelled) return
      setStats({
        users: users?.total ?? 0,
        students: students?.total ?? 0,
        instructors: instructors?.total ?? 0,
        revenue: pay?.grossRevenue ?? 0,
        courses: courses?.total ?? 0,
        certificates: certs?.certificates?.length ?? 0,
        orders: pay?.orderCount ?? 0,
        monthly: pay?.monthly ?? []
      })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const completed = (enrollments ?? []).filter((e) => e.status === 'completed').length
  const completionRate = (enrollments ?? []).length ? Math.round(completed / (enrollments ?? []).length * 100) : 0
  const growth = useMemo(() => stats?.monthly?.map((m) => ({ month: m.m, users: Math.round(m.revenue) })) ?? [], [stats])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('admin.platformDashboard')}</h1>
        <p className="mt-1 text-sm text-muted">{t('admin.platformDesc')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('admin.totalUsers')} value={(stats?.users ?? 0).toLocaleString()} sub={t('admin.registered')} icon={<Users className="h-5 w-5" />} />
        <StatCard label={t('admin.students')} value={(stats?.students ?? 0).toLocaleString()} sub={t('admin.activeLearners')} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label={t('admin.instructors')} value={(stats?.instructors ?? 0).toLocaleString()} sub={t('admin.plusNewThisMonth')} icon={<UserCog className="h-5 w-5" />} />
        <StatCard label={t('admin.revenue')} value={formatPrice(stats?.revenue ?? 0)} sub={t('admin.allTime')} icon={<Banknote className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('admin.courses')} value={(stats?.courses ?? 0).toLocaleString()} sub={t('admin.publishedCount')} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label={t('admin.enrollments')} value={enrollments.length.toLocaleString()} sub={t('admin.platformWide')} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label={t('admin.certificatesIssued')} value={(stats?.certificates ?? 0).toLocaleString()} sub={t('admin.issuedAllTime')} icon={<Award className="h-5 w-5" />} />
        <StatCard label={t('admin.completionRate')} value={`${completionRate}%`} sub={t('admin.acrossAll')} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-ink">{t('admin.userGrowth')}</h2>
          {growth.length === 0 ? (
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