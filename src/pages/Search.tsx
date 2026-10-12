import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, Search as SearchIcon, TrendingUp, Users } from 'lucide-react'
import { coursesApi, categoriesApi, membersApi } from '../lib/supabase'
import { CourseCard } from '../components/cards'
import { Avatar, Badge } from '../components/ui'

const POPULAR = ['Anatomy', 'Human Skeleton', 'Histology', 'Embryology', 'Brachial Plexus']

export default function Search() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [recent, setRecent] = useState<string[]>(['Upper Extremity', 'Nerve Roots'])

  const [coursesData, setCoursesData] = useState<any[]>([])
  const [instructorsData, setInstructorsData] = useState<any[]>([])
  const [categoriesData, setCategoriesData] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      coursesApi.list({ status: 'published' }).catch(() => []),
      membersApi.list({ role: 'instructor' }).catch(() => []),
      categoriesApi.list().catch(() => [])
    ]).then(([c, i, cats]) => {
      setCoursesData(c ?? [])
      setInstructorsData(i ?? [])
      setCategoriesData(cats ?? [])
    })
  }, [])

  const results = useMemo(() => {
    if (!q.trim()) return { courses: [], instructors: [], categories: [] }
    const s = q.toLowerCase()
    const courses = (coursesData || [])
      .filter((c: any) => (c.title || '').toLowerCase().includes(s) || (c.short_description || c.subtitle || '').toLowerCase().includes(s) || (c.description || '').toLowerCase().includes(s))
      .map((c: any) => ({
        ...c,
        subtitle: c.short_description || c.subtitle || '',
        thumbnail: c.thumbnail_url || c.thumbnail || '',
        price: typeof c.price === 'number' ? c.price : (parseFloat(c.price) || 0),
        duration: typeof c.duration === 'string' ? (parseInt(c.duration) || 0) : (c.duration ?? 0),
        rating: typeof c.rating === 'number' ? c.rating : 5.0,
      }))
    const instructors = (instructorsData || []).filter((i: any) => (i.name || '').toLowerCase().includes(s) || (i.skills ?? []).some((k: string) => k.toLowerCase().includes(s)))
    const categories = (categoriesData || []).filter((c: any) => (c.name || '').toLowerCase().includes(s))
    return { courses, instructors, categories }
  }, [q, coursesData, instructorsData, categoriesData])

  return (
    <div className="container-page py-10">
      <div className="relative mx-auto max-w-2xl">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search.placeholder')}
          className="input-base py-3.5 pl-12 text-base"
          autoFocus
        />
      </div>

      {!q.trim() ? (
        <div className="mx-auto mt-8 max-w-2xl space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{t('search.popular')}</h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map((p) => (
                <button key={p} onClick={() => setQ(p)} className="chip hover:border-brand-300 hover:text-brand-700">{p}</button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{t('search.recent')}</h2>
            <div className="space-y-1">
              {recent.map((r) => (
                <button key={r} onClick={() => setQ(r)} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-muted hover:bg-line/40 hover:text-ink">
                  <Clock className="h-4 w-4" /> {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-4xl space-y-8">
          {results.courses.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
                <TrendingUp className="h-5 w-5 text-brand-500" /> {t('search.courses', { count: results.courses.length })}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {results.courses.slice(0, 6).map((c) => <CourseCard key={c.id} course={c} />)}
              </div>
            </div>
          )}
          {results.instructors.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
                <Users className="h-5 w-5 text-brand-500" /> {t('search.instructors', { count: results.instructors.length })}
              </h2>
              <div className="space-y-2">
                {results.instructors.slice(0, 4).map((ins) => (
                  <button key={ins.id} onClick={() => nav(`/instructors/${ins.id}`)} className="card flex w-full items-center gap-3 p-4 text-left transition-shadow hover:shadow-lift">
                    <Avatar name={ins.name} size="md" />
                    <div className="flex-1">
                      <p className="font-semibold text-ink">{ins.name}</p>
                      <p className="text-sm text-muted">{ins.title}</p>
                    </div>
                    <Badge color="line">{t('search.students', { count: ins.studentCount ?? 0 })}</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
          {results.categories.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink">{t('search.categories')}</h2>
              <div className="flex flex-wrap gap-2">
                {results.categories.map((c) => (
                  <button key={c.id} onClick={() => nav(`/courses?category=${c.slug}`)} className="chip hover:border-brand-300 hover:text-brand-700">{c.name}</button>
                ))}
              </div>
            </div>
          )}
          {results.courses.length === 0 && results.instructors.length === 0 && results.categories.length === 0 && (
            <div className="card p-12 text-center">
              <p className="font-display text-lg font-semibold text-ink">{t('search.noResults', { query: q })}</p>
              <p className="mt-1 text-sm text-muted">{t('search.noResultsBody')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}