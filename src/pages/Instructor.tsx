import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Download, MessageSquare, Star, TrendingUp, Users, Wallet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COURSES, INSTRUCTORS, ALL_STUDENTS } from '../lib/data'
import { useApp } from '../lib/store'
import { Avatar, Badge, Button, EmptyState, ProgressBar, Rating, StatCard, Tabs } from '../components/ui'
import { formatPrice } from '../lib/utils'

function useInstructor() {
  const { currentUser, users } = useApp()
  const instructor = currentUser?.role === 'instructor' ? currentUser : INSTRUCTORS[0]
  const students = ALL_STUDENTS
  const myCourses = COURSES.filter((c) => c.instructorId === instructor.id)
  return { instructor, students, myCourses }
}

export function InstructorDashboard() {
  const { instructor, myCourses } = useInstructor()
  const { t } = useTranslation()
  const nav = useNavigate()
  const totalStudents = myCourses.reduce((a, c) => a + c.studentCount, 0)
  const revenue = myCourses.reduce((a, c) => a + c.studentCount * (c.price * 0.7), 0)
  const completion = Math.round(myCourses.reduce((a, c) => a + c.rating * 10, 0) / Math.max(1, myCourses.length))
  const avgRating = myCourses.length ? myCourses.reduce((a, c) => a + c.rating, 0) / myCourses.length : 0

  const enrollData = useMemo(() => [
    { month: 'Jan', enrollments: 420 }, { month: 'Feb', enrollments: 560 }, { month: 'Mar', enrollments: 480 },
    { month: 'Apr', enrollments: 720 }, { month: 'May', enrollments: 640 }, { month: 'Jun', enrollments: 890 }
  ], [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('instrDash.welcomeBack', { name: instructor.name.split(' ')[0] })}</h1>
          <p className="mt-1 text-sm text-muted">{t('instrDash.performing')}</p>
        </div>
        <Button onClick={() => nav('/instructor/courses/new')}>{t('instrDash.createCourse')}</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label={t('instrDash.totalStudents')} value={totalStudents.toLocaleString()} sub={t('instrDash.plusThisMonth')} icon={<Users className="h-5 w-5" />} />
        <StatCard label={t('instrDash.activeStudents')} value={(totalStudents * 0.31).toFixed(0)} sub={t('instrDash.learned30')} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label={t('instrDash.courses')} value={myCourses.length} sub={t('instrDash.published', { count: myCourses.filter((c) => c.status === 'published').length })} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label={t('instrDash.revenue')} value={formatPrice(Math.round(revenue))} sub={t('instrDash.allTime')} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label={t('instrDash.avgRating')} value={avgRating.toFixed(1)} sub={t('instrDash.acrossCourses')} icon={<Star className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-ink">{t('instrDash.enrollmentGrowth')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={enrollData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} />
              <Line type="monotone" dataKey="enrollments" stroke="var(--brand-500)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--brand-500)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-ink">{t('instrDash.coursePerformance')}</h2>
          <div className="space-y-5">
            {myCourses.slice(0, 4).map((c) => (
              <div key={c.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="line-clamp-1 font-medium text-ink">{c.title}</span>
                  <span className="text-xs text-muted">{c.studentCount.toLocaleString()}</span>
                </div>
                <ProgressBar value={c.rating * 20} className="bg-line/70" />
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-6 w-full" onClick={() => nav('/instructor/analytics')}>{t('instrDash.viewAnalytics')}</Button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-ink">{t('instrDash.recentEnrollments')}</h2>
        <div className="card divide-y divide-line">
          {ALL_STUDENTS.slice(0, 5).map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar name={s.name} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{s.name}</p>
                <p className="text-xs text-muted">{s.title} · {t('instrDash.enrolledAgo', { count: i + 1 })}</p>
              </div>
              <Badge color={i === 0 ? 'brand' : 'line'}>{myCourses[i % Math.max(1, myCourses.length)]?.title ?? t('instrDash.course')}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function InstructorStudents() {
  const { myCourses } = useInstructor()
  const { t } = useTranslation()
  const [courseId, setCourseId] = useState('all')
  const [search, setSearch] = useState('')

  const list = ALL_STUDENTS.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    const matchCourse = courseId === 'all' || true
    return matchSearch && matchCourse
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('instrDash.students')}</h1>
        <p className="mt-1 text-sm text-muted">{t('instrDash.manageStudents')}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('instrDash.searchStudents')} className="input-base max-w-xs" />
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="input-base max-w-xs">
          <option value="all">{t('instrDash.allCourses')}</option>
          {myCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <Button variant="outline" className="sm:ml-auto"><Download className="h-4 w-4" /> {t('instrDash.exportCsv')}</Button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">{t('instrDash.student')}</th>
                <th className="px-5 py-3 font-semibold">{t('instrDash.course')}</th>
                <th className="px-5 py-3 font-semibold">{t('instrDash.progress')}</th>
                <th className="px-5 py-3 font-semibold">{t('instrDash.status')}</th>
                <th className="px-5 py-3 text-right font-semibold">{t('instrDash.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((s, i) => (
                <tr key={s.id} className="hover:bg-paper/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <div>
                        <p className="font-medium text-ink">{s.name}</p>
                        <p className="text-xs text-muted">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">{myCourses[i % Math.max(1, myCourses.length)]?.title}</td>
                  <td className="px-5 py-3">
                    <div className="flex w-32 items-center gap-2">
                      <ProgressBar value={(i * 17) % 101} className="flex-1" />
                      <span className="text-xs text-muted">{(i * 17) % 101}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><Badge color={(i * 17) % 101 === 100 ? 'success' : 'brand'}>{(i * 17) % 101 === 100 ? t('instrDash.completed') : t('instrDash.active')}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    <Link to="/messages" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"><MessageSquare className="h-4 w-4" /> {t('instrDash.message')}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function InstructorAnalytics() {
  const { myCourses } = useInstructor()
  const { t } = useTranslation()
  const totalStudents = myCourses.reduce((a, c) => a + c.studentCount, 0)
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('instrDash.analytics')}</h1>
      <Tabs tabs={[{ id: 'overview', label: t('instrDash.overview') }, { id: 'engagement', label: t('instrDash.engagement') }, { id: 'revenue', label: t('instrDash.revenue') }]} active="overview" onChange={() => {}} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-ink">{t('instrDash.revenueByMonth')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[{ m: 'Jan', v: 3200 }, { m: 'Feb', v: 4100 }, { m: 'Mar', v: 3800 }, { m: 'Apr', v: 5200 }, { m: 'May', v: 6100 }, { m: 'Jun', v: 7300 }]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} formatter={(v) => [formatPrice(Number(v)), t('instrDash.revenue')]} />
              <Bar dataKey="v" fill="var(--brand-500)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-ink">{t('instrDash.studentEngagement')}</h2>
          <div className="space-y-5">
            {[
              { label: t('instrDash.avgCompletion'), value: 78 },
              { label: t('instrDash.assessPass'), value: 84 },
              { label: t('instrDash.discussionParticipation'), value: 42 },
              { label: t('instrDash.active30'), value: 31 }
            ].map((x) => (
              <div key={x.label}>
                <div className="mb-1.5 flex justify-between text-sm"><span className="text-muted">{x.label}</span><span className="font-medium text-ink">{x.value}%</span></div>
                <ProgressBar value={x.value} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-ink">{t('instrDash.courseRatings')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myCourses.map((c) => (
            <div key={c.id} className="rounded-card border border-line p-4">
              <p className="line-clamp-1 text-sm font-medium text-ink">{c.title}</p>
              <div className="mt-2 flex items-center gap-2"><Rating value={c.rating} size="xs" /><span className="text-xs text-muted">{t('instrDash.reviews', { count: c.reviewCount })}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function InstructorEarnings() {
  const { myCourses } = useInstructor()
  const { t } = useTranslation()
  const total = myCourses.reduce((a, c) => a + c.studentCount * c.price * 0.7, 0)
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('instrDash.earnings')}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('instrDash.totalEarnings')} value={formatPrice(Math.round(total))} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label={t('instrDash.thisMonth')} value={formatPrice(3420)} sub={t('instrDash.vsLastMonth')} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label={t('instrDash.nextPayout')} value={formatPrice(1280)} sub="Aug 30, 2026" icon={<Download className="h-5 w-5" />} />
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">{t('instrDash.course')}</th>
              <th className="px-5 py-3 font-semibold">{t('instrDash.enrollments')}</th>
              <th className="px-5 py-3 font-semibold">{t('instrDash.revenue')}</th>
              <th className="px-5 py-3 font-semibold">{t('instrDash.yourShare')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {myCourses.map((c) => (
              <tr key={c.id} className="hover:bg-paper/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img src={c.thumbnail} alt="" className="h-10 w-16 rounded object-cover" />
                    <span className="font-medium text-ink">{c.title}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted">{c.studentCount.toLocaleString()}</td>
                <td className="px-5 py-3 text-muted">{formatPrice(c.studentCount * c.price)}</td>
                <td className="px-5 py-3 font-semibold text-success">{formatPrice(c.studentCount * c.price * 0.7)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}