import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award, BookOpen, CheckCircle2, DollarSign, GraduationCap, Megaphone, ShoppingBag, TrendingUp, UserCog, Users, X } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORIES, COURSES, ORDERS, ALL_STUDENTS, INSTRUCTORS } from '../lib/data'
import { useApp } from '../lib/store'
import { Avatar, Badge, Button, ProgressBar, StatCard, Tabs } from '../components/ui'
import { formatPrice } from '../lib/utils'

export function AdminDashboard() {
  const { users, enrollments } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const students = users.filter((u) => u.role === 'student')
  const instructors = users.filter((u) => u.role === 'instructor')
  const revenue = ORDERS.reduce((a, o) => a + o.total, 0)

  const growth = useMemo(() => [
    { month: 'Jan', users: 8000 }, { month: 'Feb', users: 9200 }, { month: 'Mar', users: 10800 },
    { month: 'Apr', users: 12400 }, { month: 'May', users: 14200 }, { month: 'Jun', users: 16800 }
  ], [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('admin.platformDashboard')}</h1>
        <p className="mt-1 text-sm text-muted">{t('admin.platformDesc')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('admin.totalUsers')} value={users.length.toLocaleString()} sub={t('admin.plusThisMonth')} icon={<Users className="h-5 w-5" />} />
        <StatCard label={t('admin.students')} value={students.length.toLocaleString()} sub={t('admin.activeLearners')} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label={t('admin.instructors')} value={instructors.length.toLocaleString()} sub={t('admin.plusNewThisMonth')} icon={<UserCog className="h-5 w-5" />} />
        <StatCard label={t('admin.revenue')} value={formatPrice(revenue)} sub={t('admin.allTime')} icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('admin.courses')} value={COURSES.length} sub={t('admin.featuredCount', { count: COURSES.filter((c) => c.isFeatured).length })} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label={t('admin.enrollments')} value={enrollments.length.toLocaleString()} sub={t('admin.platformWide')} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label={t('admin.certificatesIssued')} value="2,841" sub={t('admin.plusThisMonth')} icon={<Award className="h-5 w-5" />} />
        <StatCard label={t('admin.completionRate')} value="68%" sub={t('admin.acrossAll')} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-ink">{t('admin.userGrowth')}</h2>
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

export function AdminCourses() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const [status, setStatus] = useState('all')
  const list = COURSES.filter((c) => status === 'all' || c.status === status)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('admin.courseManagement')}</h1>
        <p className="mt-1 text-sm text-muted">{t('admin.courseManagementDesc')}</p>
      </div>
      <Tabs
        tabs={[
          { id: 'all', label: t('admin.all') },
          { id: 'pending', label: t('admin.pendingReview') },
          { id: 'published', label: t('admin.published') },
          { id: 'draft', label: t('admin.drafts') },
          { id: 'archived', label: t('admin.archived') }
        ]}
        active={status}
        onChange={setStatus}
      />
      <div className="space-y-3">
        {list.map((c) => (
          <div key={c.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <img src={c.thumbnail} alt="" className="h-16 w-28 shrink-0 rounded-card object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-ink">{c.title}</h3>
                <Badge color={c.status === 'published' ? 'success' : c.status === 'pending' ? 'warning' : 'line'}>{c.status}</Badge>
                {c.isFeatured && <Badge color="brand">{t('admin.featured')}</Badge>}
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {CATEGORIES.find((x) => x.id === c.categoryId)?.name} · {t('admin.studentsCount', { count: c.studentCount })} · {c.rating.toFixed(1)}★ · {formatPrice(c.price)}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" onClick={() => toast(t('admin.courseOpened'), c.title, 'info')}>{t('admin.view')}</Button>
              {c.status === 'pending' && (
                <>
                  <Button onClick={() => toast(t('admin.courseApproved'), t('admin.nowLive', { title: c.title }))}><CheckCircle2 className="h-4 w-4" /> {t('admin.approve')}</Button>
                  <Button variant="outline" className="text-danger" onClick={() => toast(t('admin.courseRejected'), c.title, 'error')}><X className="h-4 w-4" /> {t('admin.reject')}</Button>
                </>
              )}
              {c.status === 'published' && (
                <>
                  <Button variant="outline" onClick={() => toast(c.isFeatured ? t('admin.removedFeatured') : t('admin.markedFeatured'), c.title)}>{c.isFeatured ? t('admin.unfeature') : t('admin.feature')}</Button>
                  <Button variant="outline" onClick={() => toast(t('admin.courseUnpublished'), c.title, 'info')}>{t('admin.unpublish')}</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminCategories() {
  const { toast } = useApp()
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('admin.categories')}</h1>
          <p className="mt-1 text-sm text-muted">{t('admin.categoriesDesc')}</p>
        </div>
        <Button onClick={() => toast(t('admin.categoryCreated'), t('admin.categoryCreatedBody'), 'info')}>{t('admin.newCategory')}</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <div key={c.id} className="card flex items-center gap-3 p-4">
            <div className="rounded-card p-2.5 text-white" style={{ backgroundColor: c.color }}><BookOpen className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="font-semibold text-ink">{c.name}</p>
              <p className="text-xs text-muted">{t('admin.coursesSlug', { count: c.courseCount, slug: c.slug })}</p>
            </div>
            <button onClick={() => toast(t('admin.categoryUpdated'), c.name, 'info')} className="text-sm font-medium text-brand-700 hover:underline">{t('admin.edit')}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminEnrollments() {
  const { enrollments } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('admin.enrollments')}</h1>
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
              {enrollments.slice(0, 12).map((en) => {
                const course = COURSES.find((c) => c.id === en.courseId)
                const student = ALL_STUDENTS[0] ?? { name: 'Student' }
                return (
                  <tr key={en.id} className="hover:bg-paper/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={student.name} size="xs" />
                        <span className="font-medium text-ink">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">{course?.title}</td>
                    <td className="px-5 py-3 text-muted">{new Date(en.enrolledAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex w-28 items-center gap-2">
                        <ProgressBar value={en.progress} className="flex-1" />
                        <span className="text-xs text-muted">{en.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><Badge color={en.status === 'completed' ? 'success' : 'brand'}>{en.status}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}