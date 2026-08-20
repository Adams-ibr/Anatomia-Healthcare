import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Banknote,
  Clock3, CloudDownload, FileText, Flag, Layers, Loader2, PencilLine, Plus, Search, Star,
  Trash2
} from 'lucide-react'
import { courseApi, getStoredToken, type AdminCategory, type AdminCourse, type AdminCourseInput, type CourseLevel, type CourseStatus } from '../lib/api/auth'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { cn, formatPrice } from '../lib/utils'

const STATUS_TABS: ('all' | CourseStatus)[] = ['all', 'pending', 'published', 'draft', 'approved', 'archived']
const LEVELS: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced']

const STATUS_BADGE: Record<CourseStatus, 'success' | 'warning' | 'line' | 'brand' | 'ink'> = {
  published: 'success',
  pending: 'warning',
  draft: 'line',
  approved: 'brand',
  archived: 'ink'
}

export default function AdminCourses() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()

  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 20
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CourseStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([])

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminCourse | null>(null)
  const [confirming, setConfirming] = useState<{ course: AdminCourse; mode: 'delete' | 'publish' | 'unpublish' | 'archive' } | null>(null)
  const [mutating, setMutating] = useState(false)

  const searchTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => setDebouncedSearch(search), 350)
    return () => window.clearTimeout(searchTimer.current)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, categoryFilter])

  const loadCourses = useCallback(async (p: number) => {
    const token = getStoredToken()
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await courseApi.listCourses(token, {
        search: debouncedSearch,
        status: statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        page: p,
        perPage
      })
      setCourses(res.courses)
      setTotal(res.total)
      setPage(res.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.coursesLoadFailed'))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, categoryFilter, t])

  const loadCategories = useCallback(async () => {
    const token = getStoredToken()
    if (!token) return
    try {
      const res = await courseApi.listCategories(token)
      setCategories(res.categories)
    } catch {
      /* categories optional for filtering */
    }
  }, [])

  const loadInstructors = useCallback(async () => {
    const token = getStoredToken()
    if (!token) return
    try {
      const res = await courseApi.listInstructors(token)
      setInstructors(res.instructors)
    } catch {
      /* instructors optional for create form */
    }
  }, [])

  useEffect(() => {
    loadCategories()
    loadInstructors()
  }, [loadCategories, loadInstructors])

  useEffect(() => {
    loadCourses(page)
  }, [loadCourses])

  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const refetch = useCallback(() => loadCourses(page), [loadCourses, page])

  const runMutation = useCallback(async (fn: () => Promise<unknown>, successTitle: string, successBody?: string) => {
    setMutating(true)
    try {
      await fn()
      toast(successTitle, successBody)
      refetch()
      return true
    } catch (err) {
      toast(t('admin.errorTitle'), err instanceof Error ? err.message : t('admin.errorGeneric'), 'error')
      return false
    } finally {
      setMutating(false)
    }
  }, [refetch, t, toast])

  const stats = useMemo(() => ({
    total,
    published: 0,
    pending: 0,
    draft: 0
  }), [total])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('admin.courseManagement')}</h1>
          <p className="mt-1 text-sm text-muted">{t('admin.courseManagementDesc')}</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> {t('admin.newCourse')}</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCardMini label={t('admin.statCourses')} value={stats.total} icon={<BookOpen className="h-4 w-4" />} tone="brand" />
        <StatCardMini label={t('admin.statPublished')} value={stats.published} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
        <StatCardMini label={t('admin.statPending')} value={stats.pending} icon={<Clock3 className="h-4 w-4" />} tone="warning" />
        <StatCardMini label={t('admin.statDrafts')} value={stats.draft} icon={<FileText className="h-4 w-4" />} tone="line" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          tabs={STATUS_TABS.map((s) => ({ id: s, label: t(`admin.status_${s}`) }))}
          active={statusFilter}
          onChange={(id) => setStatusFilter(id as 'all' | CourseStatus)}
        />
        <div className="flex gap-3">
          <div className="relative max-w-xs flex-1 lg:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.searchCourses')}
              className="input-base pl-9"
            />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-base">
            <option value="all">{t('admin.allCategories')}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" onClick={() => refetch()}><Loader2 className="h-3.5 w-3.5" /> {t('admin.retry')}</Button>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading && courses.length === 0 ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-14 w-24 shrink-0 rounded-card" />
                <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-48" /><Skeleton className="h-2.5 w-64" /></div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title={t('admin.noCoursesTitle')}
            message={t('admin.noCoursesMessage')}
            action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> {t('admin.newCourse')}</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">{t('admin.course')}</th>
                  <th className="hidden px-5 py-3 font-semibold md:table-cell">{t('admin.category')}</th>
                  <th className="hidden px-5 py-3 font-semibold md:table-cell">{t('admin.instructor')}</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">{t('admin.price')}</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">{t('admin.enrolled')}</th>
                  <th className="px-5 py-3 font-semibold">{t('admin.status')}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {courses.map((c) => (
                  <tr key={c.id} className="group hover:bg-paper/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-4">
                        {c.thumbnail ? (
                          <img src={c.thumbnail} alt="" className="h-14 w-24 shrink-0 rounded-card object-cover" />
                        ) : (
                          <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-card bg-paper">
                            <BookOpen className="h-5 w-5 text-muted" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-ink">{c.title}</p>
                            {c.isFeatured && <Badge color="brand">{t('admin.featured')}</Badge>}
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                            <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {c.duration}h</span>
                            <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {c.rating.toFixed(1)}</span>
                            <span className="hidden lg:inline">{c.level}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 text-muted md:table-cell">{c.categoryName ?? '—'}</td>
                    <td className="hidden px-5 py-3 text-muted md:table-cell">{c.instructorName ?? '—'}</td>
                    <td className="hidden px-5 py-3 text-ink lg:table-cell">{formatPrice(c.price)}</td>
                    <td className="hidden px-5 py-3 text-muted lg:table-cell">{c.studentCount.toLocaleString()}</td>
                    <td className="px-5 py-3"><Badge color={STATUS_BADGE[c.status]}>{t(`admin.status_${c.status}`)}</Badge></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(c)}
                          className="rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                          aria-label={t('admin.editCourse')}
                        ><PencilLine className="h-3.5 w-3.5" /></button>
                        <button
                          onClick={() => nav(`/instructor/courses/${c.id}/edit`)}
                          className="rounded px-2 py-1 text-xs font-medium text-ink hover:bg-line/50"
                          aria-label={t('admin.editContent')}
                          title={t('admin.editContent')}
                        ><Layers className="h-3.5 w-3.5" /></button>
                        {c.status === 'pending' && (
                          <button
                            onClick={() => setConfirming({ course: c, mode: 'publish' })}
                            className="rounded px-2 py-1 text-xs font-medium text-success hover:bg-success/10"
                          ><CheckCircle2 className="h-3.5 w-3.5" /></button>
                        )}
                        {c.status === 'published' && (
                          <button
                            onClick={() => setConfirming({ course: c, mode: 'unpublish' })}
                            className="rounded px-2 py-1 text-xs font-medium text-warning hover:bg-warning/10"
                          ><CloudDownload className="h-3.5 w-3.5" /></button>
                        )}
                        {(c.status === 'published' || c.status === 'pending' || c.status === 'approved') && (
                          <button
                            onClick={() => setConfirming({ course: c, mode: 'archive' })}
                            className="rounded px-2 py-1 text-xs font-medium text-warning hover:bg-warning/10"
                          ><Flag className="h-3.5 w-3.5" /></button>
                        )}
                        <button
                          onClick={() => setConfirming({ course: c, mode: 'delete' })}
                          className="rounded px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10"
                          aria-label={t('admin.delete')}
                        ><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-xs text-muted">{t('admin.showing', { from: total === 0 ? 0 : (page - 1) * perPage + 1, to: Math.min(page * perPage, total), total })}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1 || loading} onClick={() => loadCourses(page - 1)}>
            <ChevronLeft className="h-4 w-4" /> {t('admin.prev')}
          </Button>
          <span className="text-xs text-muted">{page} / {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages || loading} onClick={() => loadCourses(page + 1)}>
            {t('admin.next')} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CreateCourseModal
        open={creating}
        onClose={() => setCreating(false)}
        busy={mutating}
        categories={categories}
        instructors={instructors}
        onCreate={(input) => runMutation(
          async () => { const token = getStoredToken(); if (token) await courseApi.createCourse(token, input) },
          t('admin.courseCreated'),
          input.title
        ).then((ok) => { if (ok) setCreating(false) })}
      />

      {editing && (
        <EditCourseModal
          course={editing}
          busy={mutating}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={(patch) => runMutation(
            async () => { const token = getStoredToken(); if (token) await courseApi.updateCourse(token, editing.id, patch) },
            t('admin.courseUpdated'),
            editing.title
          ).then((ok) => { if (ok) setEditing(null) })}
        />
      )}

      {confirming && (
        <ConfirmModal
          course={confirming.course}
          mode={confirming.mode}
          busy={mutating}
          onClose={() => setConfirming(null)}
          onConfirm={() => {
            const token = getStoredToken()
            if (!token) return
            const { course, mode } = confirming
            const statusFor: Record<string, CourseStatus> = { publish: 'published', unpublish: 'draft', archive: 'archived' }
            const fn = mode === 'delete'
              ? () => courseApi.deleteCourse(token, course.id)
              : () => courseApi.updateCourse(token, course.id, { status: statusFor[mode] })
            const title = mode === 'delete' ? t('admin.courseDeleted') : mode === 'publish' ? t('admin.coursePublished') : mode === 'unpublish' ? t('admin.courseUnpublished') : t('admin.courseArchived')
            runMutation(fn, title, course.title).then((ok) => { if (ok) setConfirming(null) })
          }}
        />
      )}
    </div>
  )
}

function StatCardMini({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'brand' | 'success' | 'warning' | 'line' }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    line: 'bg-paper text-muted'
  }
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={cn('rounded-full p-2.5', tones[tone])}>{icon}</span>
      <div><p className="text-lg font-bold text-ink">{value}</p><p className="text-xs text-muted">{label}</p></div>
    </div>
  )
}

function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-card bg-paper p-1">
      {tabs.map((tb) => (
        <button
          key={tb.id}
          onClick={() => onChange(tb.id)}
          className={cn(
            'rounded-card px-3 py-1.5 text-xs font-medium transition-colors',
            active === tb.id ? 'bg-brand-600 text-white' : 'text-muted hover:text-ink'
          )}
        >
          {tb.label}
        </button>
      ))}
    </div>
  )
}

function CreateCourseModal({ open, onClose, busy, categories, instructors, onCreate }: {
  open: boolean
  onClose: () => void
  busy: boolean
  categories: AdminCategory[]
  instructors: { id: string; name: string }[]
  onCreate: (input: AdminCourseInput) => void
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [level, setLevel] = useState<CourseLevel>('Beginner')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [hasCertificate, setHasCertificate] = useState(true)

  const reset = () => { setTitle(''); setCategoryId(''); setInstructorId(''); setLevel('Beginner'); setPrice(''); setDuration(''); setHasCertificate(true) }
  const valid = title.trim().length > 0 && categoryId !== '' && instructorId !== ''

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('admin.createCourse')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('admin.cancel')}</Button>
          <Button onClick={() => {
            onCreate({
              title: title.trim(),
              categoryId,
              instructorId,
              level,
              price: price ? Number(price) : 0,
              duration: duration ? Number(duration) : 0,
              hasCertificate,
              status: 'draft'
            })
            reset()
          }} disabled={!valid || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('admin.create')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-base">{t('admin.courseTitle')}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('admin.courseTitlePlaceholder')} className="input-base" autoFocus />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">{t('admin.category')}</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-base">
              <option value="">{t('admin.selectCategory')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">{t('admin.instructor')}</label>
            <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className="input-base">
              <option value="">{t('admin.selectInstructor')}</option>
              {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">{t('admin.level')}</label>
            <select value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)} className="input-base">
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">{t('admin.price')}</label>
            <div className="relative">
              <Banknote className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="input-base pl-9" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">{t('admin.duration')} (h)</label>
            <div className="relative">
              <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="0" className="input-base pl-9" />
            </div>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={hasCertificate} onChange={(e) => setHasCertificate(e.target.checked)} className="h-4 w-4 rounded border-line accent-brand-500" />
          {t('admin.offersCertificate')}
        </label>
      </div>
    </Modal>
  )
}

function EditCourseModal({ course, busy, categories, onClose, onSave }: {
  course: AdminCourse
  busy: boolean
  categories: AdminCategory[]
  onClose: () => void
  onSave: (patch: Partial<AdminCourseInput>) => void
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(course.title)
  const [categoryId, setCategoryId] = useState(course.categoryId)
  const [level, setLevel] = useState<CourseLevel>(course.level)
  const [price, setPrice] = useState(String(course.price))
  const [duration, setDuration] = useState(String(course.duration))
  const [hasCertificate, setHasCertificate] = useState(course.hasCertificate)
  const [isFeatured, setIsFeatured] = useState(course.isFeatured)

  const valid = title.trim().length > 0 && categoryId !== ''

  return (
    <Modal
      open
      onClose={onClose}
      title={t('admin.editCourse')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('admin.cancel')}</Button>
          <Button onClick={() => onSave({
            title: title.trim(),
            categoryId,
            level,
            price: price ? Number(price) : 0,
            duration: duration ? Number(duration) : 0,
            hasCertificate,
            isFeatured
          })} disabled={!valid || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {t('admin.saveChanges')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt="" className="h-16 w-28 shrink-0 rounded-card object-cover" />
          ) : (
            <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-card bg-paper"><BookOpen className="h-6 w-6 text-muted" /></div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-ink">{course.title}</p>
            <p className="text-xs text-muted">{course.instructorName ?? course.instructorId}</p>
          </div>
        </div>
        <div>
          <label className="label-base">{t('admin.courseTitle')}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-base" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">{t('admin.category')}</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-base">
              <option value="">{t('admin.selectCategory')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">{t('admin.level')}</label>
            <select value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)} className="input-base">
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">{t('admin.price')}</label>
            <div className="relative">
              <Banknote className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="input-base pl-9" />
            </div>
          </div>
          <div>
            <label className="label-base">{t('admin.duration')} (h)</label>
            <div className="relative">
              <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} className="input-base pl-9" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={hasCertificate} onChange={(e) => setHasCertificate(e.target.checked)} className="h-4 w-4 rounded border-line accent-brand-500" />
            {t('admin.offersCertificate')}
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 rounded border-line accent-brand-500" />
            {t('admin.featured')}
          </label>
        </div>
      </div>
    </Modal>
  )
}

function ConfirmModal({ course, mode, busy, onClose, onConfirm }: {
  course: AdminCourse
  mode: 'delete' | 'publish' | 'unpublish' | 'archive'
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  const config = {
    delete: {
      title: t('admin.deleteCourse'),
      icon: <Trash2 className="h-5 w-5" />,
      tone: 'text-danger',
      bg: 'bg-danger/10',
      body: t('admin.deleteCourseBody', { title: course.title }),
      note: t('admin.deleteCourseWarning'),
      btn: t('admin.delete')
    },
    publish: {
      title: t('admin.publishCourse'),
      icon: <CheckCircle2 className="h-5 w-5" />,
      tone: 'text-success',
      bg: 'bg-success/10',
      body: t('admin.publishCourseBody', { title: course.title }),
      note: t('admin.publishCourseNote'),
      btn: t('admin.publish')
    },
    unpublish: {
      title: t('admin.unpublishCourse'),
      icon: <CloudDownload className="h-5 w-5" />,
      tone: 'text-warning',
      bg: 'bg-warning/10',
      body: t('admin.unpublishCourseBody', { title: course.title }),
      note: t('admin.unpublishCourseNote'),
      btn: t('admin.unpublish')
    },
    archive: {
      title: t('admin.archiveCourse'),
      icon: <Flag className="h-5 w-5" />,
      tone: 'text-warning',
      bg: 'bg-warning/10',
      body: t('admin.archiveCourseBody', { title: course.title }),
      note: t('admin.archiveCourseNote'),
      btn: t('admin.archive')
    }
  }[mode]

  return (
    <Modal
      open
      onClose={onClose}
      title={config.title}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('admin.cancel')}</Button>
          <Button onClick={onConfirm} disabled={busy} className={config.tone}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {config.btn}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span className={cn('rounded-full p-3', config.bg, config.tone)}>{config.icon}</span>
        <div>
          <p className="font-semibold text-ink">{config.body}</p>
          <p className="mt-1 text-sm text-muted">{config.note}</p>
        </div>
      </div>
    </Modal>
  )
}