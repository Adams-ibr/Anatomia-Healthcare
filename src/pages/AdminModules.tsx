import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, BookOpen, ChevronDown, ChevronUp, Box,
  Eye, Layers, Loader2, Move, PencilLine, Plus,
  PlusCircle, Search, Trash2, X
} from 'lucide-react'
import { useApp } from '../lib/store'
import { modulesApi, lessonsApi, coursesApi, flashcardDecksApi, anatomyModelsApi } from '../lib/supabase'
import { Badge, Button, EmptyState, Modal } from '../components/ui'
import { cn } from '../lib/utils'

interface DbModule {
  id: string
  course_id: string
  title: string
  description: string | null
  order: number | null
  is_published: boolean | null
  created_at: string | null
}

interface DbLesson {
  id: string
  module_id: string
  title: string
  duration: number | null
  order: number | null
  is_published: boolean | null
  content_type: string
}

interface DbCourse {
  id: string
  title: string
}

export default function AdminModules() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [modules, setModules] = useState<DbModule[]>([])
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, DbLesson[]>>({})
  const [courses, setCourses] = useState<DbCourse[]>([])
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)

  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<DbModule | null>(null)
  const [deleting, setDeleting] = useState<DbModule | null>(null)

  const loadCourses = useCallback(async () => {
    try {
      const data = await coursesApi.list({ adminView: true })
      setCourses((data ?? []).map((c: any) => ({ id: c.id, title: c.title })))
    } catch {
      // optional — filter still works without course list
    }
  }, [])

  const loadModules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await modulesApi.list(courseFilter === 'all' ? undefined : courseFilter)
      const mods = (data ?? []) as DbModule[]
      setModules(mods)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load modules')
    } finally {
      setLoading(false)
    }
  }, [courseFilter])

  useEffect(() => { loadCourses() }, [loadCourses])
  useEffect(() => { loadModules() }, [loadModules])

  const loadLessonsForModule = useCallback(async (moduleId: string) => {
    if (lessonsByModule[moduleId]) return
    try {
      const data = await lessonsApi.list({ module_id: moduleId })
      setLessonsByModule(prev => ({ ...prev, [moduleId]: (data ?? []) as DbLesson[] }))
    } catch {
      setLessonsByModule(prev => ({ ...prev, [moduleId]: [] }))
    }
  }, [lessonsByModule])

  const toggleModule = (id: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
      loadLessonsForModule(id)
    }
    setExpandedModules(newExpanded)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setMutating(true)
    try {
      await modulesApi.delete(deleting.id)
      toast('Success', `Module "${deleting.title}" deleted`)
      setDeleting(null)
      loadModules()
    } catch (err) {
      toast('Error', err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setMutating(false)
    }
  }

  const filtered = modules.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const publishedCount = modules.filter(m => m.is_published).length
  const totalLessons = Object.values(lessonsByModule).reduce((sum, ls) => sum + ls.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Course Modules</h1>
          <p className="mt-1 text-sm text-muted">Organize courses into modules containing lessons</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <PlusCircle className="h-4 w-4" />
          Create Module
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700"><Layers className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-ink">{modules.length}</p>
              <p className="text-xs text-muted">Total Modules</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success"><Eye className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-ink">{publishedCount}</p>
              <p className="text-xs text-muted">Published</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-warning/10 p-2 text-warning"><BookOpen className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-ink">{totalLessons}</p>
              <p className="text-xs text-muted">Loaded Lessons</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search modules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="input-base">
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" onClick={loadModules}><Loader2 className="h-3.5 w-3.5" /> Retry</Button>
        </div>
      )}

      {/* Modules List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse p-6">
              <div className="h-4 w-1/3 rounded bg-line" />
              <div className="mt-2 h-3 w-2/3 rounded bg-line" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-12 w-12" />}
          title={search ? 'No modules match your search' : 'No modules found'}
          message={search ? 'Try a different search term' : 'Create your first module to organize course content'}
          action={
            !search ? (
              <Button onClick={() => setCreating(true)}>
                <PlusCircle className="h-4 w-4" /> Create Module
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((mod) => {
            const isExpanded = expandedModules.has(mod.id)
            const lessons = lessonsByModule[mod.id] ?? []
            const course = courses.find(c => c.id === mod.course_id)
            return (
              <div key={mod.id} className="card overflow-hidden">
                {/* Module Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <button onClick={() => toggleModule(mod.id)} className="rounded p-1 hover:bg-line/40">
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-muted" /> : <ChevronDown className="h-5 w-5 text-muted" />}
                        </button>
                        <h3 className="font-semibold text-ink">{mod.title}</h3>
                        <Badge color={mod.is_published ? 'success' : 'warning'}>
                          {mod.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {mod.order != null && (
                          <span className="text-xs text-muted">Order: {mod.order}</span>
                        )}
                      </div>
                      {mod.description && (
                        <p className="ml-11 text-sm text-muted">{mod.description}</p>
                      )}
                      <div className="ml-11 mt-3 flex flex-wrap items-center gap-4 text-sm">
                        {course && <Badge color="line">{course.title}</Badge>}
                        <span className="text-muted text-xs">
                          Created {mod.created_at ? new Date(mod.created_at).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button onClick={() => setEditing(mod)} className="rounded-card p-2 text-ink hover:bg-line/40" title="Edit">
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleting(mod)} className="rounded-card p-2 text-danger hover:bg-danger/5" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Lessons */}
                {isExpanded && (
                  <div className="border-t border-line bg-surface p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-ink">
                        Lessons ({lessons.length})
                      </h4>
                    </div>
                    {lessons.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted">No lessons in this module yet. Use Lessons → Create Lesson to add one.</p>
                    ) : (
                      <div className="space-y-2">
                        {lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between rounded-card border border-line bg-paper p-3">
                            <div className="flex items-center gap-3">
                              <Move className="h-4 w-4 text-muted" />
                              <div>
                                <p className="text-sm font-medium text-ink">{lesson.title}</p>
                                <p className="text-xs text-muted">{lesson.content_type} · {lesson.duration ?? 0} min</p>
                              </div>
                            </div>
                            <Badge color={lesson.is_published ? 'success' : 'warning'}>
                              {lesson.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Module Modal */}
      {(creating || editing) && (
        <ModuleFormModal
          module={editing}
          courses={courses}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => {
            setCreating(false)
            setEditing(null)
            loadModules()
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal open={true} onClose={() => setDeleting(null)} title="Delete Module">
          <p className="text-sm text-muted">
            Are you sure you want to delete "<strong>{deleting.title}</strong>"? This will also remove all lessons in this module. This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={mutating} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={mutating} className="flex-1 bg-danger hover:bg-danger/90">
              {mutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ModuleFormModal({
  module, courses, onClose, onSuccess
}: {
  module?: DbModule | null
  courses: DbCourse[]
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useApp()
  const [formData, setFormData] = useState({
    course_id: module?.course_id || (courses[0]?.id ?? ''),
    title: module?.title || '',
    description: module?.description || '',
    order: module?.order ?? 1,
    is_published: module?.is_published ?? false
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast('Error', 'Module title is required', 'error')
      return
    }
    if (!formData.course_id) {
      toast('Error', 'Please select a course', 'error')
      return
    }
    setSaving(true)
    try {
      if (module) {
        await modulesApi.update(module.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          order: formData.order,
          is_published: formData.is_published
        })
        toast('Success', 'Module updated successfully')
      } else {
        await modulesApi.create({
          course_id: formData.course_id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          order: formData.order,
          is_published: formData.is_published
        })
        toast('Success', 'Module created successfully')
      }
      onSuccess()
    } catch (err) {
      toast('Error', err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose} title={module ? 'Edit Module' : 'Create Module'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Course *</label>
          <select
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            className="input-base"
            required
          >
            <option value="">Select a course…</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        <div>
          <label className="label-base">Module Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input-base"
            placeholder="e.g., Module 1: Cardiovascular System"
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
            rows={3}
            placeholder="Brief description of what this module covers..."
          />
        </div>

        <div>
          <label className="label-base">Order</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
            className="input-base"
            min="1"
          />
          <p className="mt-1 text-xs text-muted">Position of this module in the course</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={formData.is_published}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            className="rounded border-line"
          />
          Published (visible to students)
        </label>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : module ? 'Save Changes' : 'Create Module'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
