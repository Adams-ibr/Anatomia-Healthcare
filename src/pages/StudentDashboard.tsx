import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Calendar, CheckCircle2, Clock, Flame, GraduationCap, Trophy, Award, ArrowRight } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COURSES } from '../lib/data'
import { useApp } from '../lib/store'
import { Avatar, Badge, ProgressBar, StatCard } from '../components/ui'
import { greeting } from '../lib/utils'

export default function StudentDashboard() {
  const { currentUser, enrollments, certificates } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = currentUser!

  const mine = useMemo(() => enrollments.filter((e) => e.userId === user.id), [enrollments, user.id])
  const active = mine.filter((e) => e.status === 'active').sort((a, b) => b.progress - a.progress)
  const completed = mine.filter((e) => e.status === 'completed')
  const inProgress = mine.filter((e) => e.progress > 0 && e.progress < 100)
  const learningHours = Math.round(active.reduce((a, e) => a + e.progress * 0.4, 0) + completed.length * 12)
  const streak = 5

  const weekly = [
    { day: 'Mon', hours: 1.5 }, { day: 'Tue', hours: 2 }, { day: 'Wed', hours: 0.5 },
    { day: 'Thu', hours: 2.5 }, { day: 'Fri', hours: 1 }, { day: 'Sat', hours: 3 }, { day: 'Sun', hours: 0 }
  ]

  const overallProgress = mine.length ? Math.round(mine.reduce((a, e) => a + e.progress, 0) / mine.length) : 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{greeting()}, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-muted">{t('sdash.today')}</p>
        </div>
        <div className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-2.5">
          <Flame className="h-5 w-5 text-warning" />
          <div>
            <p className="text-sm font-semibold text-ink">{t('sdash.streak', { count: streak })}</p>
            <p className="text-xs text-muted">{t('sdash.keepGoing')}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--line)" strokeWidth="8" />
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--brand-500)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${overallProgress * 1.634} 163.4`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink">{overallProgress}%</span>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-ink">{t('sdash.overallProgress')}</p>
              <p className="text-sm text-muted">{t('sdash.overallProgressBody', { done: completed.length, total: mine.length })}</p>
            </div>
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-3 lg:pl-6">
            <div className="rounded-card border border-line p-3">
              <p className="text-2xl font-bold text-ink">{inProgress.length}</p>
              <p className="text-xs text-muted">{t('sdash.inProgressCourses')}</p>
            </div>
            <div className="rounded-card border border-line p-3">
              <p className="text-2xl font-bold text-ink">{completed.length}</p>
              <p className="text-xs text-muted">{t('sdash.completedCoursesShort')}</p>
            </div>
            <div className="rounded-card border border-line p-3">
              <p className="text-2xl font-bold text-ink">{learningHours}</p>
              <p className="text-xs text-muted">{t('sdash.hoursShort')}</p>
            </div>
          </div>
        </div>
        {mine.length > 0 && (
          <div className="grid gap-4 border-t border-line bg-paper p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
            {mine.slice(0, 6).map((en) => {
              const course = en.course ?? COURSES.find((c) => c.id === en.courseId)
              if (!course) return null
              const allLessons = 'sections' in course ? (course as typeof COURSES[number]).sections.flatMap((s) => s.lessons) : []
              const current = allLessons.find((l) => l.id === en.currentLessonId) ?? allLessons[0]
              return (
                <button key={en.id} onClick={() => nav(current && course.slug ? `/learning/${course.id}/${current.id}` : `/learning/${course.id}`)} className="group flex items-center gap-3 rounded-card border border-line bg-surface p-3 text-left transition-colors hover:border-brand-300">
                  <img src={course.thumbnail} alt={course.title} className="h-10 w-14 shrink-0 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-ink group-hover:text-brand-700">{course.title}</p>
                    <ProgressBar value={en.progress} className="mt-1.5 h-1.5" barClassName="bg-brand-500" />
                  </div>
                  <span className="text-xs font-semibold text-muted">{en.progress}%</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('sdash.coursesInProgress')} value={inProgress.length} sub={t('sdash.keepGoingSub')} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label={t('sdash.completedCourses')} value={completed.length} sub={t('sdash.completionPct', { pct: (completed.length / Math.max(1, mine.length) * 100).toFixed(0) })} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label={t('sdash.certificates')} value={certificates.filter((c) => c.userId === user.id).length} sub={t('sdash.verifiedCredentials')} icon={<Award className="h-5 w-5" />} />
        <StatCard label={t('sdash.learningHours')} value={learningHours} sub={t('sdash.totalThisMonth')} icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">{t('sdash.continueLearning')}</h2>
            <Link to="/my-learning" className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">{t('sdash.viewAll')} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {active.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="font-display text-lg font-semibold text-ink">{t('sdash.noCoursesInProgress')}</p>
              <p className="mt-1 text-sm text-muted">{t('sdash.exploreToday')}</p>
              <button onClick={() => nav('/courses')} className="btn-primary mt-4">{t('sdash.exploreCourses')}</button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {active.slice(0, 4).map((en) => {
                const course = en.course ?? COURSES.find((c) => c.id === en.courseId)
                if (!course) return null
                const allLessons = 'sections' in course ? (course as typeof COURSES[number]).sections.flatMap((s) => s.lessons) : []
                const current = allLessons.find((l) => l.id === en.currentLessonId) ?? allLessons[0]
                return (
                  <button key={en.id} onClick={() => nav(current && course.slug ? `/learning/${course.id}/${current.id}` : `/learning/${course.id}`)} className="card group flex flex-col overflow-hidden text-left transition-shadow hover:shadow-lift">
                    <div className="relative aspect-video bg-brand-900">
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                      <span className="absolute bottom-2 left-2 rounded-full bg-surface/95 px-2 py-0.5 text-xs font-semibold text-ink">{en.progress}%</span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <p className="line-clamp-1 font-semibold text-ink">{course.title}</p>
                      <p className="text-xs text-muted">{current ? t('sdash.continueColon', { title: current.title }) : t('sdash.continueColon', { title: course.title })}</p>
                      <ProgressBar value={en.progress} className="mt-auto" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div className="mb-4 mt-8 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">{t('sdash.recommended')}</h2>
            <Link to="/courses" className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">{t('sdash.more')} <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="card flex items-start gap-4 p-5">
            <div className="rounded-card bg-brand-50 p-3 text-brand-700"><Trophy className="h-6 w-6" /></div>
            <div>
              <p className="font-semibold text-ink">{t('sdash.basedOn')}</p>
              <p className="mt-1 text-sm text-muted">{t('sdash.studentsLikeYou')} <span className="font-medium text-brand-700">SIEM & Threat Hunting</span> {t('common.and')} <span className="font-medium text-brand-700">Ethical Hacking: Web Applications</span>.</p>
              <button onClick={() => nav('/courses?category=cybersecurity')} className="btn-outline mt-3 text-sm">{t('sdash.exploreRecs')}</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{t('sdash.upcomingTasks')}</h2>
              <Link to="/calendar" className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"><Calendar className="h-4 w-4" /> {t('sdash.calendar')}</Link>
            </div>
            <div className="space-y-3">
              {[
                { icon: <Award className="h-4 w-4" />, title: t('sdash.task1'), meta: t('sdash.dueIn', { days: 2 }), color: 'bg-brand-50 text-brand-700' },
                { icon: <BookOpen className="h-4 w-4" />, title: t('sdash.task2'), meta: t('sdash.dueIn', { days: 5 }), color: 'bg-success/10 text-success' },
                { icon: <Trophy className="h-4 w-4" />, title: t('sdash.task3'), meta: t('sdash.dueIn', { days: 7 }), color: 'bg-warning/10 text-warning' }
              ].map((task, i) => (
                <div key={i} className="card flex items-center gap-3 p-4">
                  <div className={`rounded-card p-2.5 ${task.color}`}>{task.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{task.title}</p>
                    <p className="text-xs text-muted">{task.meta}</p>
                  </div>
                  <Badge color="warning">{t('sdash.soon')}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-ink">{t('sdash.weeklyHours')}</h2>
            <div className="card p-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekly} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'var(--brand-50)' }} contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} />
                  <Bar dataKey="hours" fill="var(--brand-500)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-ink">{t('sdash.recentActivity')}</h2>
            <div className="card divide-y divide-line p-2">
              {[
                { label: t('sdash.activity1'), time: t('sdash.hoursAgo', { count: 2 }), color: 'bg-brand-500' },
                { label: t('sdash.activity2'), time: t('sdash.yesterday'), color: 'bg-success' },
                { label: t('sdash.activity3'), time: t('sdash.daysAgo', { count: 3 }), color: 'bg-warning' },
                { label: t('sdash.activity4'), time: t('sdash.weekAgo', { count: 1 }), color: 'bg-brand-300' }
              ].map((act, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${act.color}`} />
                  <div className="flex-1">
                    <p className="text-sm text-ink">{act.label}</p>
                    <p className="text-xs text-muted">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}