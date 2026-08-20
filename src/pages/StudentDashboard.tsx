import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, CheckCircle2, Clock, GraduationCap, Trophy, Award, ArrowRight, Megaphone } from 'lucide-react'
import { useApp } from '../lib/store'
import { studentApi, getStoredToken } from '../lib/api/auth'
import { Avatar, Badge, ProgressBar, StatCard } from '../components/ui'
import { greeting, timeAgo } from '../lib/utils'

function Announcements() {
  const { t } = useTranslation()
  const [items, setItems] = useState<{ id: string; title: string; body: string; authorName: string; createdAt: string }[]>([])
  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    studentApi.listAnnouncements(token)
      .then((res) => setItems(res.announcements))
      .catch(() => {})
  }, [])
  if (items.length === 0) return null
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-ink">{t('sdash.announcements')}</h2>
      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="card flex items-start gap-3 p-4">
            <div className="rounded-card bg-brand-50 p-2.5 text-brand-700"><Megaphone className="h-4 w-4" /></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{a.title}</p>
              {a.body && <p className="mt-0.5 text-sm text-muted">{a.body}</p>}
              <p className="mt-1 text-xs text-muted">{timeAgo(a.createdAt)} · {a.authorName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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

  const overallProgress = mine.length ? Math.round(mine.reduce((a, e) => a + e.progress, 0) / mine.length) : 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{greeting()}, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-muted">{t('sdash.today')}</p>
        </div>
      </div>

      <Announcements />

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
              const course = en.course
              if (!course) return null
              const current = undefined
              return (
                <button key={en.id} onClick={() => nav(`/learning/${course.id}`)} className="group flex items-center gap-3 rounded-card border border-line bg-surface p-3 text-left transition-colors hover:border-brand-300">
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
                const course = en.course
                if (!course) return null
                const current = undefined
                return (
                  <button key={en.id} onClick={() => nav(`/learning/${course.id}`)} className="card group flex flex-col overflow-hidden text-left transition-shadow hover:shadow-lift">
                    <div className="relative aspect-video bg-brand-900">
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                      <span className="absolute bottom-2 left-2 rounded-full bg-surface/95 px-2 py-0.5 text-xs font-semibold text-ink">{en.progress}%</span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <p className="line-clamp-1 font-semibold text-ink">{course.title}</p>
                      <p className="text-xs text-muted">{t('sdash.continueColon', { title: course.title })}</p>
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
              <button onClick={() => nav('/courses')} className="btn-outline mt-3 text-sm">{t('sdash.exploreRecs')}</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-ink">{t('sdash.recentActivity')}</h2>
            {mine.length === 0 ? (
              <div className="card p-6 text-center text-sm text-muted">{t('sdash.noActivity')}</div>
            ) : (
              <div className="card divide-y divide-line p-2">
                {mine.slice(0, 5).map((en) => (
                  <div key={en.id} className="flex items-start gap-3 px-3 py-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    <div className="flex-1">
                      <p className="text-sm text-ink">{t('sdash.activityCourse', { title: en.course?.title ?? t('common.course') })}</p>
                      <p className="text-xs text-muted">{en.progress}% · {t(en.status === 'completed' ? 'sdash.completedShort' : 'sdash.inProgressShort')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}