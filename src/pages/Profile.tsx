import { useTranslation } from 'react-i18next'
import { Award } from 'lucide-react'
import { useApp } from '../lib/store'
import { Avatar, Badge } from '../components/ui'
import { formatDate } from '../lib/utils'

export default function ProfilePage() {
  const { currentUser, users, enrollments, certificates } = useApp()
  const { t } = useTranslation()
  const user = currentUser!
  const myCerts = certificates.filter((c) => c.userId === user.id)
  const completed = enrollments.filter((e) => e.userId === user.id && e.status === 'completed')
  const allStudents = users.filter((u) => u.role === 'student')
  const learnedHours = Math.round(completed.length * 12 + enrollments.filter((e) => e.userId === user.id && e.status === 'active').reduce((a, e) => a + e.progress * 0.4, 0))

  return (
    <div className="space-y-6">
      <div className="card flex flex-col items-center gap-4 p-8 sm:flex-row sm:items-start">
        <Avatar name={user.name} size="xl" />
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold text-ink">{user.name}</h1>
          <p className="text-sm text-muted">{user.title ?? t('profile.learner')} · {t('profile.joined', { date: formatDate(user.joinedAt) })}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{user.bio ?? t('profile.bioFallback')}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {(user.skills ?? []).map((s) => <Badge key={s} color="brand">{s}</Badge>)}
            {myCerts.length === 0 && <Badge color="line">{t('profile.newLearner')}</Badge>}
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div><p className="text-2xl font-bold text-ink">{completed.length}</p><p className="text-xs text-muted">{t('profile.courses')}</p></div>
          <div><p className="text-2xl font-bold text-ink">{myCerts.length}</p><p className="text-xs text-muted">{t('profile.certificates')}</p></div>
          <div><p className="text-2xl font-bold text-ink">{learnedHours}h</p><p className="text-xs text-muted">{t('profile.learned')}</p></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-ink">{t('profile.achievements')}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['achievement1', 'achievement1Desc'],
                ['achievement2', 'achievement2Desc'],
                ['achievement3', 'achievement3Desc']
              ].map(([title, desc]) => (
                <div key={title} className="card flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Award className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t(`profile.${title}`)}</p>
                    <p className="text-xs text-muted">{t(`profile.${desc}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold text-ink">{t('profile.community')}</h2>
            <p className="mb-4 text-sm text-muted">{t('profile.studentsLearning', { count: allStudents.length })}</p>
            <div className="flex -space-x-2">
              {allStudents.slice(0, 8).map((s) => <Avatar key={s.id} name={s.name} size="sm" className="ring-2 ring-paper" />)}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 ring-2 ring-paper">+{Math.max(0, allStudents.length - 8)}</div>
            </div>
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">{t('profile.learningActivity')}</h2>
          <div className="card p-5">
            <div className="space-y-4">
              {[
                ['thisWeek', '0h'],
                ['avgDaily', '0m'],
                ['bestDay', '—']
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-muted">{t(`profile.${label}`)}</span>
                  <span className="text-sm font-semibold text-ink">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}