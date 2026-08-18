import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { ASSIGNMENTS, COURSES } from '../lib/data'
import { cn, formatDate } from '../lib/utils'

export default function Calendar() {
  const { t, i18n } = useTranslation()
  const [month, setMonth] = useState(() => new Date())
  const year = month.getFullYear()
  const m = month.getMonth()
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const firstDay = new Date(year, m, 1).getDay()
  const today = new Date()
  const deadlines = ASSIGNMENTS.slice(0, 5).map((a) => ({
    day: new Date(a.deadline).getDate(),
    title: a.title,
    courseId: a.courseId
  }))
  const monthName = month.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
  const dayNames = Array.from({ length: 7 }).map((_, i) => new Date(2024, 0, i + 1).toLocaleDateString(i18n.language, { weekday: 'short' }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('cal.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('cal.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonth(new Date(year, m - 1, 1))} className="rounded p-2 text-muted hover:bg-line/40 hover:text-ink" aria-label={t('cal.prevMonth')}><ChevronLeft className="h-5 w-5" /></button>
          <span className="w-36 text-center text-sm font-semibold text-ink">{monthName}</span>
          <button onClick={() => setMonth(new Date(year, m + 1, 1))} className="rounded p-2 text-muted hover:bg-line/40 hover:text-ink" aria-label={t('cal.nextMonth')}><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted">
          {dayNames.map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday = today.getFullYear() === year && today.getMonth() === m && today.getDate() === day
            const items = deadlines.filter((d) => d.day === day)
            return (
              <div key={day} className={cn('min-h-20 rounded-card border p-1.5', isToday ? 'border-brand-500 bg-brand-50' : 'border-line bg-surface')}>
                <span className={cn('text-xs font-medium', isToday ? 'text-brand-700' : 'text-muted')}>{day}</span>
                {items.slice(0, 2).map((it, j) => (
                  <div key={j} className="mt-1 truncate rounded bg-brand-500/10 px-1 py-0.5 text-[10px] font-medium text-brand-700">{it.title.split('—')[0].slice(0, 22)}</div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink">{t('cal.upcomingDeadlines')}</h2>
        <div className="space-y-2">
          {ASSIGNMENTS.slice(0, 5).map((a) => {
            const course = COURSES.find((c) => c.id === a.courseId)
            return (
              <div key={a.id} className="card flex items-center gap-3 p-4">
                <div className="rounded-card bg-danger/10 p-2.5 text-danger"><AlertCircle className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{a.title}</p>
                  <p className="text-xs text-muted">{course?.title} · {t('cal.points', { count: a.points })}</p>
                </div>
                <span className="text-xs text-danger">{t('cal.due', { date: formatDate(a.deadline) })}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}