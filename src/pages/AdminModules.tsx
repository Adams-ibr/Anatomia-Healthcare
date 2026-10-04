import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Box,
  Eye, Layers, Loader2, MoreVertical, Move, PencilLine, Plus,
  PlusCircle, Search, Trash2, X
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal } from '../components/ui'
import { cn, formatDate } from '../lib/utils'

interface ModuleLesson {
  id: string
  title: string
  duration: number
  order: number
  isPublished: boolean
}

interface ImportedResource {
  id: string
  type: 'flashcard' | 'model'
  resourceId: string
  resourceName: string
  order: number
}

interface Module {
  id: string
  courseId: string
  courseName: string
  title: string
  description: string
  order: number
  lessons: ModuleLesson[]
  importedResources: ImportedResource[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminModules() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [modules, setModules] = useState<Module[]>([])
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Module | null>(null)
  const [deleting, setDeleting] = useState<Module | null>(null)
  const [managingResources, setManagingResources] = useState<Module | null>(null)

  // Mock data
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockModules: Module[] = [
        {
          id: 'm1',
          courseId: 'c1',
          courseName: 'Complete Anatomy Course',
          title: 'Module 1: Cardiovascular System',
          description: 'Comprehensive study of the heart and blood vessels',
          order: 1,
          lessons: [
            { id: 'l1', title: 'Introduction to the Heart', duration: 15, order: 1, isPublished: true },
            { id: 'l2', title: 'Blood Circulation Pathways', duration: 20, order: 2, isPublished: true },
            { id: 'l3', title: 'Heart Valves and Chambers', duration: 18, order: 3, isPublished: false }
          ],
          importedResources: [
            { id: 'r1', type: 'model', resourceId: 'model1', resourceName: 'Human Heart - Complete', order: 1 },
            { id: 'r2', type: 'flashcard', resourceId: 'deck1', resourceName: 'Cardiovascular System Basics', order: 2 }
          ],
          isPublished: true,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'm2',
          courseId: 'c1',
          courseName: 'Complete Anatomy Course',
          title: 'Module 2: Skeletal System',
          description: 'Study of bones, joints, and skeletal structure',
          order: 2,
          lessons: [
            { id: 'l4', title: 'Skeletal System Overview', duration: 18, order: 1, isPublished: true },
            { id: 'l5', title: 'Major Bones of the Body', duration: 25, order: 2, isPublished: true }
          ],
          importedResources: [
            { id: 'r3', type: 'model', resourceId: 'model2', resourceName: 'Human Skeleton', order: 1 },
            { id: 'r4', type: 'flashcard', resourceId: 'deck2', resourceName: 'Skeletal System - Bones', order: 2 }
          ],
          isPublished: true,
          createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'm3',
          courseId: 'c2',
          courseName: 'Advanced Neurology',
          title: 'Module 1: Brain Anatomy',
          description: 'Detailed exploration of brain structures and functions',
          order: 1,
          lessons: [
            { id: 'l6', title: 'Brain Regions Overview', duration: 22, order: 1, isPublished: false }
          ],
          importedResources: [
            { id: 'r5', type: 'model', resourceId: 'model3', resourceName: 'Brain Anatomy', order: 1 }
          ],
          isPublished: false,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      let filtered = mockModules
      if (search) {
        filtered = filtered.filter(m =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (courseFilter !== 'all') {
        filtered = filtered.filter(m => m.courseId === courseFilter)
      }

      setModules(filtered)
      setLoading(false)
    }, 500)
  }, [search, courseFilter])

  const toggleModule = (id: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedModules(newExpanded)
  }

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const publishedModules = modules.filter(m => m.isPublished).length

  const courses = Array.from(new Set(modules.map(m => ({ id: m.courseId, name: m.courseName }))))

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
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{modules.length}</p>
              <p className="text-xs text-muted">Total Modules</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{publishedModules}</p>
              <p className="text-xs text-muted">Published</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-warning/10 p-2 text-warning">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{totalLessons}</p>
              <p className="text-xs text-muted">Total Lessons</p>
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
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="input-base"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>
      </div>

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
      ) : modules.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-12 w-12" />}
          title="No modules found"
          message="Create your first module to organize course content"
          action={
            <Button onClick={() => setCreating(true)}>
              <PlusCircle className="h-4 w-4" />
              Create Module
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {modules.map((module) => {
            const isExpanded = expandedModules.has(module.id)
            return (
              <div key={module.id} className="card overflow-hidden">
                {/* Module Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="rounded p-1 hover:bg-line/40"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted" />
                          )}
                        </button>
                        <h3 className="font-semibold text-ink">{module.title}</h3>
                        <Badge color={module.isPublished ? 'success' : 'warning'}>
                          {module.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="ml-11 text-sm text-muted">{module.description}</p>
                      <div className="ml-11 mt-3 flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-muted">
                          <Badge color="line">{module.courseName}</Badge>
                        </span>
                        <span className="text-muted">
                          <BookOpen className="mb-0.5 inline h-4 w-4" /> {module.lessons.length} lessons
                        </span>
                        <span className="text-muted">
                          <Layers className="mb-0.5 inline h-4 w-4" /> {module.importedResources.length} resources
                        </span>
                        <span className="text-xs text-muted">
                          Updated {formatDate(module.updatedAt)}
                        </span>
                      </div>

                      {/* Quick Resource Actions */}
                      {!isExpanded && module.importedResources.length > 0 && (
                        <div className="ml-11 mt-3 flex flex-wrap gap-1">
                          {module.importedResources.slice(0, 3).map((res) => (
                            <Badge
                              key={res.id}
                              color={res.type === 'flashcard' ? 'brand' : 'success'}
                            >
                              {res.type === 'flashcard' ? (
                                <Layers className="h-3 w-3" />
                              ) : (
                                <Box className="h-3 w-3" />
                              )}
                              {res.resourceName}
                            </Badge>
                          ))}
                          {module.importedResources.length > 3 && (
                            <Badge>+{module.importedResources.length - 3} more</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => setManagingResources(module)}
                        className="rounded-card p-2 text-ink hover:bg-line/40"
                        title="Manage Resources"
                      >
                        <Layers className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditing(module)}
                        className="rounded-card p-2 text-ink hover:bg-line/40"
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(module)}
                        className="rounded-card p-2 text-danger hover:bg-danger/5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-line bg-surface p-6">
                    {/* Lessons */}
                    <div className="mb-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-ink">Lessons ({module.lessons.length})</h4>
                        <button
                          className="text-xs text-brand-700 hover:text-brand-800"
                          onClick={() => toast('Info', 'Lesson management coming soon')}
                        >
                          + Add Lesson
                        </button>
                      </div>
                      {module.lessons.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted">No lessons yet</p>
                      ) : (
                        <div className="space-y-2">
                          {module.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between rounded-card border border-line bg-paper p-3"
                            >
                              <div className="flex items-center gap-3">
                                <Move className="h-4 w-4 text-muted" />
                                <div>
                                  <p className="text-sm font-medium text-ink">{lesson.title}</p>
                                  <p className="text-xs text-muted">{lesson.duration} minutes</p>
                                </div>
                              </div>
                              <Badge color={lesson.isPublished ? 'success' : 'warning'}>
                                {lesson.isPublished ? 'Published' : 'Draft'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Imported Resources */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-ink">
                          Imported Resources ({module.importedResources.length})
                        </h4>
                        <button
                          className="text-xs text-brand-700 hover:text-brand-800"
                          onClick={() => setManagingResources(module)}
                        >
                          Manage Resources
                        </button>
                      </div>
                      {module.importedResources.length === 0 ? (
                        <div className="rounded-card border border-dashed border-line bg-paper p-6 text-center">
                          <p className="text-sm text-muted">No resources imported yet</p>
                          <div className="mt-4 flex justify-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setManagingResources(module)}
                            >
                              <Layers className="h-4 w-4" />
                              Import Flashcards
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setManagingResources(module)}
                            >
                              <Box className="h-4 w-4" />
                              Import 3D Model
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {module.importedResources.map((resource) => (
                            <div
                              key={resource.id}
                              className="flex items-center justify-between rounded-card border border-line bg-paper p-3"
                            >
                              <div className="flex items-center gap-3">
                                {resource.type === 'flashcard' ? (
                                  <Layers className="h-5 w-5 text-brand-700" />
                                ) : (
                                  <Box className="h-5 w-5 text-success" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-ink">{resource.resourceName}</p>
                                  <p className="text-xs text-muted capitalize">{resource.type}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSuccess={() => {
            setCreating(false)
            setEditing(null)
            toast('Success', editing ? 'Module updated' : 'Module created')
          }}
        />
      )}

      {/* Manage Resources Modal */}
      {managingResources && (
        <ManageResourcesModal
          module={managingResources}
          onClose={() => setManagingResources(null)}
          onSuccess={() => {
            setManagingResources(null)
            toast('Success', 'Resources updated')
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal open={true} onClose={() => setDeleting(null)} title="Delete Module">
          <p className="text-sm text-muted">
            Are you sure you want to delete "{deleting.title}"? This will also remove all lessons in this module. This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast('Success', 'Module deleted successfully')
                setDeleting(null)
              }}
              className="flex-1 bg-danger hover:bg-danger/90"
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ModuleFormModal({ module, onClose, onSuccess }: { module?: Module | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    courseId: module?.courseId || 'c1',
    title: module?.title || '',
    description: module?.description || '',
    order: module?.order || 1,
    isPublished: module?.isPublished || false
  })
  const [saving, setSaving] = useState(false)

  // Mock courses
  const courses = [
    { id: 'c1', name: 'Complete Anatomy Course' },
    { id: 'c2', name: 'Advanced Neurology' },
    { id: 'c3', name: 'Physiology Fundamentals' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onSuccess()
    }, 1000)
  }

  return (
    <Modal open={true} onClose={onClose} title={module ? 'Edit Module' : 'Create Module'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Course</label>
          <select
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
            className="input-base"
            required
          >
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-base">Module Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input-base"
            placeholder="e.g., Module 1: Cardiovascular System"
            required
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
            required
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
            required
          />
          <p className="mt-1 text-xs text-muted">Position of this module in the course</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="module-published"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            className="rounded border-line"
          />
          <label htmlFor="module-published" className="text-sm text-ink">
            Published
          </label>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              module ? 'Save Changes' : 'Create Module'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ManageResourcesModal({ module, onClose, onSuccess }: { module: Module; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useApp()
  const [resources, setResources] = useState<ImportedResource[]>(module.importedResources)

  // Mock available resources
  const availableFlashcards = [
    { id: 'deck1', name: 'Cardiovascular System Basics' },
    { id: 'deck2', name: 'Skeletal System - Bones' },
    { id: 'deck3', name: 'Brain Anatomy' }
  ]

  const availableModels = [
    { id: 'model1', name: 'Human Heart - Complete' },
    { id: 'model2', name: 'Human Skeleton' },
    { id: 'model3', name: 'Brain Anatomy' }
  ]

  const addResource = (type: 'flashcard' | 'model', resourceId: string, resourceName: string) => {
    // Check if already added
    if (resources.some(r => r.resourceId === resourceId)) {
      toast('Info', 'Resource already added')
      return
    }

    const newResource: ImportedResource = {
      id: `r${Date.now()}`,
      type,
      resourceId,
      resourceName,
      order: resources.length + 1
    }
    setResources([...resources, newResource])
    toast('Success', 'Resource added')
  }

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id))
  }

  const handleSave = () => {
    setTimeout(() => {
      onSuccess()
    }, 500)
  }

  return (
    <Modal open={true} onClose={onClose} title={`Manage Resources - ${module.title}`} size="large">
      <div className="space-y-6">
        {/* Current Resources */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink">Current Resources ({resources.length})</h3>
          {resources.length === 0 ? (
            <div className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
              No resources added yet. Import flashcard decks or 3D models below.
            </div>
          ) : (
            <div className="space-y-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between rounded-card border border-line p-3"
                >
                  <div className="flex items-center gap-3">
                    {resource.type === 'flashcard' ? (
                      <Layers className="h-5 w-5 text-brand-700" />
                    ) : (
                      <Box className="h-5 w-5 text-success" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-ink">{resource.resourceName}</p>
                      <p className="text-xs text-muted capitalize">{resource.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeResource(resource.id)}
                    className="rounded-card p-1 text-danger hover:bg-danger/5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Import Flashcard Decks */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Layers className="h-5 w-5 text-brand-700" />
            Import Flashcard Decks
          </h3>
          <div className="space-y-2">
            {availableFlashcards.map((deck) => {
              const isAdded = resources.some(r => r.resourceId === deck.id)
              return (
                <div
                  key={deck.id}
                  className="flex items-center justify-between rounded-card border border-line p-3"
                >
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-brand-700" />
                    <p className="text-sm text-ink">{deck.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => addResource('flashcard', deck.id, deck.name)}
                    disabled={isAdded}
                  >
                    {isAdded ? 'Added' : 'Import'}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Import 3D Models */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Box className="h-5 w-5 text-success" />
            Import 3D Models
          </h3>
          <div className="space-y-2">
            {availableModels.map((model) => {
              const isAdded = resources.some(r => r.resourceId === model.id)
              return (
                <div
                  key={model.id}
                  className="flex items-center justify-between rounded-card border border-line p-3"
                >
                  <div className="flex items-center gap-3">
                    <Box className="h-4 w-4 text-success" />
                    <p className="text-sm text-ink">{model.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => addResource('model', model.id, model.name)}
                    disabled={isAdded}
                  >
                    {isAdded ? 'Added' : 'Import'}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
