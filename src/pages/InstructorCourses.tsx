import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useApp } from '../lib/store'
import { getStoredToken, studentApi, type AdminCourse } from '../lib/api/auth'
import { Badge, Button, ProgressBar, Tabs } from '../components/ui'

export function InstructorCourses() {
  const { t } = useTranslation()
  const { toast } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState('all')
  const [myCourses, setMyCourses] = useState<AdminCourse[]>([])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    studentApi.listMyCourses(token).then((r) => setMyCourses(r.courses)).catch(() => {})
  }, [])

  const list = myCourses.filter((c) => tab === 'all' || c.status === tab)
  const tabs = [
    { id: 'all', label: `All (${myCourses.length})` },
    { id: 'draft', label: `Drafts (${myCourses.filter((c) => c.status === 'draft').length})` },
    { id: 'pending', label: `Pending review (${myCourses.filter((c) => c.status === 'pending').length})` },
    { id: 'published', label: `Published (${myCourses.filter((c) => c.status === 'published').length})` }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('instrCourses.myCourses')}</h1>
          <p className="mt-1 text-sm text-muted">{t('instrCourses.myCoursesDesc')}</p>
        </div>
        <Button onClick={() => nav('/instructor/courses/new')}><Plus className="h-4 w-4" /> {t('instrCourses.newCourse')}</Button>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-lg font-semibold text-ink">{t('instrCourses.emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('instrCourses.emptyMessage')}</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {list.map((c) => (
            <div key={c.id} className="card flex gap-4 p-4">
              <img src={c.thumbnail} alt="" className="h-24 w-36 shrink-0 rounded-card object-cover" />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 font-semibold text-ink">{c.title}</h3>
                    <p className="mt-0.5 text-xs text-muted">{t('instrCourses.studentsRating', { students: c.studentCount.toLocaleString(), rating: c.rating.toFixed(1) })}</p>
                  </div>
                  <Badge color={c.status === 'published' ? 'success' : c.status === 'pending' ? 'warning' : c.status === 'draft' ? 'line' : 'ink'}>{c.status}</Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar value={c.status === 'published' ? 100 : 60} className="flex-1" />
                  <span className="text-xs text-muted">{c.status === 'published' ? t('instrCourses.live') : '60%'}</span>
                </div>
                <div className="mt-auto flex items-center gap-2 pt-3">
                  <Button variant="outline" className="flex-1 py-1.5 text-xs" onClick={() => nav(`/instructor/courses/${c.id}/edit`)}>{t('instrCourses.editCourse')}</Button>
                  <Button variant="outline" className="flex-1 py-1.5 text-xs" onClick={() => toast(c.status === 'published' ? t('instrCourses.courseUnpublished') : t('instrCourses.submittedForReview'), c.title, 'info')}>
                    {c.status === 'published' ? t('instrCourses.unpublish') : c.status === 'pending' ? t('instrCourses.withdraw') : t('instrCourses.submitForReview')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}