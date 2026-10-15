import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Clock, Eye,
  Layers, Loader2, PencilLine, Plus, PlusCircle, Search, Trash2, Video
} from 'lucide-react'
import { useApp } from '../lib/store'
import { lessonsApi, modulesApi } from '../lib/supabase'
import { Badge, Button, EmptyState, Modal } from '../components/ui'
import { cn } from '../lib/utils'

interface DbLesson {
  id: string
  module_id: string
  title: string
  description: string | null
  content_type: string
  duration: number | null
  order: number | null
  is_free: boolean | null
  is_published: boolean | null
  video_url: string | null
  content: string | null
  created_at: string | null
  updated_at: string | null
}

interface DbModule {
  id: string
  title: string
  course_id: string
}

const CONTENT_TYPES = ['video', 'article', 'pdf', 'audio', 'quiz', 'interactive']

export default function AdminLessons() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [lessons, setLessons] = useState<DbLesson[]>([])
  const [modules, setModules] = useState<DbModule[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 15
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)

  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<DbLesson | null>(null)
  const [deleting, setDeleting] = useState<DbLesson | null>(null)

  const loadModules = useCallback(async () => {
    try {
      const data = await modulesApi.list()
      setModules((data ?? []).map((m: any) => ({ id: m.id, title: m.title, course_id: m.course_id })))
    } catch { /* optional */ }
  }, [])

  const loadLessons = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await lessonsApi.list(moduleFilter !== 'all' ? { module_id: moduleFilter } : undefined)
      let all = (data ?? []) as DbLesson[]

      // Client-side filter for search and status (small datasets)
      if (search) all = all.filter(l => l.title.toLowerCase().includes(search.toLowerCase()))
      if (statusFilter === 'published') all = all.filter(l => l.is_published)
      if (statusFilter === 'draft') all = all.filter(l => !l.is_published)

      setTotal(all.length)
      const start = (page - 1) * perPage
      setLessons(all.slice(start, start + perPage))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lessons')
    } finally {
      setLoading(false)
    }
  }, [moduleFilter, search, statusFilter, page, perPage])

  useEffect(() => { loadModules() }, [loadModules])
  useEffect(() => { loadLessons() }, [loadLessons])
  useEffect(() => { setPage(1) }, [search, moduleFilter, statusFilter])

  const handleDelete = async () => {
    if (!deleting) return
    setMutating(true)
    try {
      await lessonsApi.delete(deleting.id)
      toast('Success', `Lesson "${deleting.title}" deleted`)
      setDeleting(null)
      loadLessons()
    } catch (err) {
      toast('Error', err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setMutating(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const publishedCount = lessons.filter(l => l.is_published).length

  const getModuleName = (moduleId: string) => modules.find(m => m.id === moduleId)?.title ?? 'Unknown Module'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Lessons</h1>
          <p className="mt-1 text-sm text-muted">Create and manage course lessons with rich content</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <PlusCircle className="h-4 w-4" /> Create Lesson
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700"><BookOpen className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-ink">{total}</p><p className="text-xs text-muted">Total Lessons</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success"><Eye className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-ink">{publishedCount}</p><p className="text-xs text-muted">Published (this page)</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-warning/10 p-2 text-warning"><Layers className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-ink">{modules.length}</p><p className="text-xs text-muted">Modules</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="input-base">
            <option value="all">All Modules</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="input-base">
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" onClick={loadLessons}><Loader2 className="h-3.5 w-3.5" /> Retry</Button>
        </div>
      )}

      {/* Lessons List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse p-5">
              <div className="h-4 w-1/3 rounded bg-line" />
              <div className="mt-2 h-3 w-2/3 rounded bg-line" />
            </div>
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="No lessons found"
          message={search ? 'Try a different search term or filter' : 'Create your first lesson to start building course content'}
          action={!search ? <Button onClick={() => setCreating(true)}><PlusCircle className="h-4 w-4" /> Create Lesson</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="card group p-5 transition-all hover:border-brand-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-ink">{lesson.title}</h3>
                    <Badge color={lesson.is_published ? 'success' : 'warning'}>
                      {lesson.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    {lesson.is_free && <Badge color="brand">Free</Badge>}
                  </div>
                  {lesson.description && (
                    <p className="text-sm text-muted mb-2 line-clamp-2">{lesson.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Video className="h-3.5 w-3.5" /> {lesson.content_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {lesson.duration ?? 0} min
                    </span>
                    <Badge color="line">{getModuleName(lesson.module_id)}</Badge>
                    {lesson.order != null && <span>Order: {lesson.order}</span>}
                    {lesson.updated_at && <span>Updated {new Date(lesson.updated_at).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => setEditing(lesson)} className="rounded-card p-2 text-ink hover:bg-line/40">
                    <PencilLine className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(lesson)} className="rounded-card p-2 text-danger hover:bg-danger/5">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total} lessons
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(creating || editing) && (
        <LessonFormModal
          lesson={editing}
          modules={modules}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); loadLessons() }}
        />
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal open={true} onClose={() => setDeleting(null)} title="Delete Lesson">
          <p className="text-sm text-muted">
            Are you sure you want to delete "<strong>{deleting.title}</strong>"? This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={mutating} className="flex-1">Cancel</Button>
            <Button onClick={handleDelete} disabled={mutating} className="flex-1 bg-danger hover:bg-danger/90">
              {mutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function LessonFormModal({
  lesson, modules, onClose, onSuccess
}: {
  lesson?: DbLesson | null
  modules: DbModule[]
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useApp()
  const [formData, setFormData] = useState({
    module_id: lesson?.module_id || (modules[0]?.id ?? ''),
    title: lesson?.title || '',
    description: lesson?.description || '',
    content_type: lesson?.content_type || 'video',
    duration: lesson?.duration ?? 10,
    order: lesson?.order ?? 1,
    is_free: lesson?.is_free ?? false,
    is_published: lesson?.is_published ?? false,
    video_url: lesson?.video_url || '',
    content: lesson?.content || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast('Error', 'Lesson title is required', 'error')
      return
    }
    if (!formData.module_id) {
      toast('Error', 'Please select a module', 'error')
      return
    }
    setSaving(true)
    try {
      if (lesson) {
        await lessonsApi.update(lesson.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          content_type: formData.content_type,
          duration: formData.duration,
          order: formData.order,
          is_free: formData.is_free,
          is_published: formData.is_published,
          video_url: formData.video_url.trim() || null,
          content: formData.content.trim() || null,
          updated_at: new Date().toISOString()
        })
        toast('Success', 'Lesson updated successfully')
      } else {
        await lessonsApi.create({
          module_id: formData.module_id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          content_type: formData.content_type,
          duration: formData.duration,
          order: formData.order,
          is_free: formData.is_free,
          is_published: formData.is_published,
          video_url: formData.video_url.trim() || null,
          content: formData.content.trim() || null
        })
        toast('Success', 'Lesson created successfully')
      }
      onSuccess()
    } catch (err) {
      toast('Error', err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose} title={lesson ? 'Edit Lesson' : 'Create Lesson'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Module *</label>
          <select
            value={formData.module_id}
            onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
            className="input-base"
            required
          >
            <option value="">Select a module…</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>

        <div>
          <label className="label-base">Lesson Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input-base"
            placeholder="e.g., Introduction to the Heart"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="label-base">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-base"
            rows={2}
            placeholder="Brief description of what students will learn..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">Content Type *</label>
            <select
              value={formData.content_type}
              onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
              className="input-base"
            >
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">Duration (minutes)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="input-base"
              min="0"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              className="input-base"
              min="1"
            />
          </div>
          <div>
            <label className="label-base">Video URL</label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              className="input-base"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="label-base">Content / Notes</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="input-base font-mono text-sm"
            rows={4}
            placeholder="Lesson content, transcript, or notes..."
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={formData.is_free} onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })} className="rounded border-line" />
            Free preview lesson
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="rounded border-line" />
            Published
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : lesson ? 'Save Changes' : 'Create Lesson'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
