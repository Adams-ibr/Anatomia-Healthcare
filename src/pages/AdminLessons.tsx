import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BookOpen, ChevronLeft, ChevronRight, Clock, Box, Eye, FileText,
  HelpCircle, Layers, Loader2, Play, PlusCircle, Save, Search,
  Trash2, Type, Video, X, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Tabs } from '../components/ui'
import { cn, formatDate } from '../lib/utils'

type ContentType = 'text' | 'video' | 'interactive' | 'image' | 'embed'

interface LessonContent {
  id: string
  type: ContentType
  order: number
  data: {
    text?: string
    videoUrl?: string
    imageUrl?: string
    embedUrl?: string
    caption?: string
  }
}

interface ImportedResource {
  id: string
  type: 'quiz' | 'flashcard' | 'model'
  resourceId: string
  resourceName: string
  order: number
}

interface Lesson {
  id: string
  moduleId: string
  title: string
  description: string
  duration: number // in minutes
  order: number
  isPublished: boolean
  isFree: boolean
  content: LessonContent[]
  importedResources: ImportedResource[]
  createdAt: string
  updatedAt: string
}

export default function AdminLessons() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 10
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Lesson | null>(null)
  const [deleting, setDeleting] = useState<Lesson | null>(null)
  const [viewing, setViewing] = useState<Lesson | null>(null)

  // Mock data
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockLessons: Lesson[] = [
        {
          id: '1',
          moduleId: 'mod1',
          title: 'Introduction to the Heart',
          description: 'Learn about the structure and function of the human heart',
          duration: 15,
          order: 1,
          isPublished: true,
          isFree: true,
          content: [
            {
              id: 'c1',
              type: 'text',
              order: 1,
              data: {
                text: 'The heart is a muscular organ that pumps blood throughout the body. It consists of four chambers...'
              }
            },
            {
              id: 'c2',
              type: 'video',
              order: 2,
              data: {
                videoUrl: 'https://example.com/heart-video.mp4',
                caption: 'Heart anatomy overview'
              }
            }
          ],
          importedResources: [
            {
              id: 'r1',
              type: 'model',
              resourceId: 'm1',
              resourceName: 'Human Heart - Complete',
              order: 1
            },
            {
              id: 'r2',
              type: 'flashcard',
              resourceId: 'deck1',
              resourceName: 'Cardiovascular System Basics',
              order: 2
            }
          ],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          moduleId: 'mod1',
          title: 'Blood Circulation Pathways',
          description: 'Understanding pulmonary and systemic circulation',
          duration: 20,
          order: 2,
          isPublished: true,
          isFree: false,
          content: [
            {
              id: 'c3',
              type: 'text',
              order: 1,
              data: {
                text: 'Blood flows through two main pathways: pulmonary and systemic circulation...'
              }
            }
          ],
          importedResources: [
            {
              id: 'r3',
              type: 'quiz',
              resourceId: 'q1',
              resourceName: 'Circulation Quiz',
              order: 1
            }
          ],
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          moduleId: 'mod2',
          title: 'Skeletal System Overview',
          description: 'Introduction to bones and skeletal structure',
          duration: 18,
          order: 1,
          isPublished: false,
          isFree: true,
          content: [],
          importedResources: [],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      let filtered = mockLessons
      if (search) {
        filtered = filtered.filter(l =>
          l.title.toLowerCase().includes(search.toLowerCase()) ||
          l.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (moduleFilter !== 'all') {
        filtered = filtered.filter(l => l.moduleId === moduleFilter)
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(l =>
          statusFilter === 'published' ? l.isPublished : !l.isPublished
        )
      }

      setLessons(filtered)
      setTotal(filtered.length)
      setLoading(false)
    }, 500)
  }, [search, moduleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Lessons</h1>
          <p className="mt-1 text-sm text-muted">Create and manage course lessons with rich content</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <PlusCircle className="h-4 w-4" />
          Create Lesson
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{lessons.length}</p>
              <p className="text-xs text-muted">Total Lessons</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{lessons.filter(l => l.isPublished).length}</p>
              <p className="text-xs text-muted">Published</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-warning/10 p-2 text-warning">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">
                {lessons.reduce((sum, l) => sum + l.duration, 0)}
              </p>
              <p className="text-xs text-muted">Total Minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-base"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Lessons List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse p-6">
              <div className="h-4 w-1/3 rounded bg-line" />
              <div className="mt-2 h-3 w-2/3 rounded bg-line" />
            </div>
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="No lessons found"
          message="Create your first lesson to start building course content"
          action={
            <Button onClick={() => setCreating(true)}>
              <PlusCircle className="h-4 w-4" />
              Create Lesson
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="card group p-6 transition-all hover:border-brand-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-ink">{lesson.title}</h3>
                      <Badge color={lesson.isPublished ? 'success' : 'warning'}>
                        {lesson.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      {lesson.isFree && <Badge color="brand">Free</Badge>}
                    </div>
                    <p className="text-sm text-muted mb-3">{lesson.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted">
                        <Clock className="h-4 w-4" />
                        {lesson.duration} min
                      </span>
                      <span className="flex items-center gap-1 text-muted">
                        <FileText className="h-4 w-4" />
                        {lesson.content.length} content blocks
                      </span>
                      <span className="flex items-center gap-1 text-muted">
                        <Layers className="h-4 w-4" />
                        {lesson.importedResources.length} resources
                      </span>
                      <span className="text-xs text-muted">
                        Updated {formatDate(lesson.updatedAt)}
                      </span>
                    </div>

                    {/* Imported Resources Preview */}
                    {lesson.importedResources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {lesson.importedResources.map((res) => (
                          <Badge
                            key={res.id}
                            color={
                              res.type === 'quiz' ? 'warning' :
                              res.type === 'flashcard' ? 'brand' : 'success'
                            }
                          >
                            {res.type === 'quiz' && <HelpCircle className="h-3 w-3" />}
                            {res.type === 'flashcard' && <Layers className="h-3 w-3" />}
                            {res.type === 'model' && <Box className="h-3 w-3" />}
                            {res.resourceName}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setViewing(lesson)}
                      className="rounded-card p-2 text-ink hover:bg-line/40"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditing(lesson)}
                      className="rounded-card p-2 text-ink hover:bg-line/40"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(lesson)}
                      className="rounded-card p-2 text-danger hover:bg-danger/5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} lessons
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {(creating || editing) && (
        <LessonEditorModal
          lesson={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSuccess={() => {
            setCreating(false)
            setEditing(null)
            toast('Success', editing ? 'Lesson updated' : 'Lesson created')
          }}
        />
      )}

      {/* View Modal */}
      {viewing && (
        <LessonViewModal
          lesson={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal open={true} onClose={() => setDeleting(null)} title="Delete Lesson">
          <p className="text-sm text-muted">
            Are you sure you want to delete "{deleting.title}"? This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast('Success', 'Lesson deleted successfully')
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

function LessonEditorModal({ lesson, onClose, onSuccess }: { lesson?: Lesson | null; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useApp()
  const [activeTab, setActiveTab] = useState<'details' | 'content' | 'resources'>('details')

  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    duration: lesson?.duration || 10,
    isPublished: lesson?.isPublished || false,
    isFree: lesson?.isFree || false
  })

  const [content, setContent] = useState<LessonContent[]>(lesson?.content || [])
  const [resources, setResources] = useState<ImportedResource[]>(lesson?.importedResources || [])
  const [saving, setSaving] = useState(false)

  const [addingContent, setAddingContent] = useState<ContentType | null>(null)
  const [addingResource, setAddingResource] = useState<'quiz' | 'flashcard' | 'model' | null>(null)

  const handleSubmit = async () => {
    if (!formData.title) {
      toast('Error', 'Please enter a lesson title', 'error')
      return
    }

    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onSuccess()
    }, 1500)
  }

  const addContentBlock = (type: ContentType) => {
    const newBlock: LessonContent = {
      id: `c${Date.now()}`,
      type,
      order: content.length + 1,
      data: {}
    }
    setContent([...content, newBlock])
    setAddingContent(null)
  }

  const updateContentBlock = (id: string, data: any) => {
    setContent(content.map(c => c.id === id ? { ...c, data: { ...c.data, ...data } } : c))
  }

  const removeContentBlock = (id: string) => {
    setContent(content.filter(c => c.id !== id))
  }

  const addResource = (type: 'quiz' | 'flashcard' | 'model', resourceId: string, resourceName: string) => {
    const newResource: ImportedResource = {
      id: `r${Date.now()}`,
      type,
      resourceId,
      resourceName,
      order: resources.length + 1
    }
    setResources([...resources, newResource])
    setAddingResource(null)
    toast('Success', 'Resource imported')
  }

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id))
  }

  return (
    <Modal open={true} onClose={onClose} title={lesson ? 'Edit Lesson' : 'Create Lesson'}>
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'details', label: 'Details' },
            { id: 'content', label: `Content (${content.length})` },
            { id: 'resources', label: `Resources (${resources.length})` }
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as any)}
        />

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div>
              <label className="label-base">Lesson Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-base"
                placeholder="e.g., Introduction to the Heart"
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
                placeholder="Brief description of what students will learn..."
              />
            </div>

            <div>
              <label className="label-base">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                className="input-base"
                min="1"
                max="180"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded border-line"
                />
                <label htmlFor="published" className="text-sm text-ink">
                  Published
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="free"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  className="rounded border-line"
                />
                <label htmlFor="free" className="text-sm text-ink">
                  Free Preview
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {content.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted" />
                <p className="mt-2 text-sm text-muted">No content blocks yet</p>
                <p className="mt-1 text-xs text-muted">Add text, videos, or interactive elements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {content.map((block, index) => (
                  <ContentBlockEditor
                    key={block.id}
                    block={block}
                    index={index}
                    onUpdate={(data) => updateContentBlock(block.id, data)}
                    onRemove={() => removeContentBlock(block.id)}
                  />
                ))}
              </div>
            )}

            {/* Add Content Menu */}
            {addingContent ? (
              <div className="card p-4">
                <p className="mb-3 text-sm font-medium text-ink">Select Content Type:</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    { type: 'text' as const, icon: Type, label: 'Text' },
                    { type: 'video' as const, icon: Video, label: 'Video' },
                    { type: 'image' as const, icon: ImageIcon, label: 'Image' },
                    { type: 'embed' as const, icon: LinkIcon, label: 'Embed' },
                    { type: 'interactive' as const, icon: Box, label: 'Interactive' }
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => addContentBlock(type)}
                      className="flex flex-col items-center gap-2 rounded-card border border-line p-3 hover:border-brand-500 hover:bg-brand-50"
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setAddingContent(null)}
                  className="mt-3 w-full"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setAddingContent('text')}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4" />
                Add Content Block
              </Button>
            )}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="rounded-card border border-line bg-surface p-4 text-sm">
              <p className="font-medium text-ink">Import Resources</p>
              <p className="mt-1 text-muted">Add quizzes, flashcard decks, or 3D models to this lesson</p>
            </div>

            {resources.length > 0 && (
              <div className="space-y-2">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between rounded-card border border-line p-3"
                  >
                    <div className="flex items-center gap-3">
                      {resource.type === 'quiz' && <HelpCircle className="h-5 w-5 text-warning" />}
                      {resource.type === 'flashcard' && <Layers className="h-5 w-5 text-brand-700" />}
                      {resource.type === 'model' && <Box className="h-5 w-5 text-success" />}
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

            {/* Import Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  // Mock import - in real app, this would open a selection modal
                  addResource('quiz', 'q1', 'Sample Quiz')
                }}
                className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-line p-4 hover:border-warning hover:bg-warning/5"
              >
                <HelpCircle className="h-6 w-6 text-warning" />
                <span className="text-xs font-medium">Import Quiz</span>
              </button>

              <button
                onClick={() => {
                  addResource('flashcard', 'deck1', 'Sample Flashcard Deck')
                }}
                className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-line p-4 hover:border-brand-500 hover:bg-brand-50"
              >
                <Layers className="h-6 w-6 text-brand-700" />
                <span className="text-xs font-medium">Import Flashcards</span>
              </button>

              <button
                onClick={() => {
                  addResource('model', 'm1', 'Sample 3D Model')
                }}
                className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-line p-4 hover:border-success hover:bg-success/5"
              >
                <Box className="h-6 w-6 text-success" />
                <span className="text-xs font-medium">Import 3D Model</span>
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 border-t border-line pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {lesson ? 'Update Lesson' : 'Create Lesson'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ContentBlockEditor({ block, index, onUpdate, onRemove }: {
  block: LessonContent
  index: number
  onUpdate: (data: any) => void
  onRemove: () => void
}) {
  const getIcon = () => {
    switch (block.type) {
      case 'text': return <Type className="h-5 w-5" />
      case 'video': return <Video className="h-5 w-5" />
      case 'image': return <ImageIcon className="h-5 w-5" />
      case 'embed': return <LinkIcon className="h-5 w-5" />
      case 'interactive': return <Box className="h-5 w-5" />
    }
  }

  return (
    <div className="rounded-card border border-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded bg-brand-50 p-1.5 text-brand-700">
            {getIcon()}
          </div>
          <span className="text-sm font-medium capitalize text-ink">{block.type} Block #{index + 1}</span>
        </div>
        <button
          onClick={onRemove}
          className="rounded-card p-1 text-danger hover:bg-danger/5"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {block.type === 'text' && (
        <textarea
          value={block.data.text || ''}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="input-base"
          rows={4}
          placeholder="Enter your text content..."
        />
      )}

      {block.type === 'video' && (
        <div className="space-y-2">
          <input
            type="url"
            value={block.data.videoUrl || ''}
            onChange={(e) => onUpdate({ videoUrl: e.target.value })}
            className="input-base"
            placeholder="Video URL (YouTube, Vimeo, or direct link)"
          />
          <input
            type="text"
            value={block.data.caption || ''}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            className="input-base"
            placeholder="Caption (optional)"
          />
        </div>
      )}

      {block.type === 'image' && (
        <div className="space-y-2">
          <input
            type="url"
            value={block.data.imageUrl || ''}
            onChange={(e) => onUpdate({ imageUrl: e.target.value })}
            className="input-base"
            placeholder="Image URL"
          />
          <input
            type="text"
            value={block.data.caption || ''}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            className="input-base"
            placeholder="Caption (optional)"
          />
        </div>
      )}

      {block.type === 'embed' && (
        <input
          type="url"
          value={block.data.embedUrl || ''}
          onChange={(e) => onUpdate({ embedUrl: e.target.value })}
          className="input-base"
          placeholder="Embed URL or iframe code"
        />
      )}

      {block.type === 'interactive' && (
        <div className="rounded-card bg-surface p-4 text-center text-sm text-muted">
          Interactive content placeholder
        </div>
      )}
    </div>
  )
}

function LessonViewModal({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  return (
    <Modal open={true} onClose={onClose} title="Lesson Preview">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-ink">{lesson.title}</h2>
            <Badge color={lesson.isPublished ? 'success' : 'warning'}>
              {lesson.isPublished ? 'Published' : 'Draft'}
            </Badge>
            {lesson.isFree && <Badge color="brand">Free</Badge>}
          </div>
          <p className="text-muted">{lesson.description}</p>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {lesson.duration} minutes
            </span>
            <span>{lesson.content.length} content blocks</span>
            <span>{lesson.importedResources.length} resources</span>
          </div>
        </div>

        {/* Content Preview */}
        {lesson.content.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Content</h3>
            <div className="space-y-3">
              {lesson.content.map((block, index) => (
                <div key={block.id} className="rounded-card border border-line p-4">
                  <p className="mb-2 text-xs font-medium uppercase text-muted">
                    {block.type} Block #{index + 1}
                  </p>
                  {block.type === 'text' && <p className="text-sm text-ink">{block.data.text}</p>}
                  {block.type === 'video' && (
                    <div className="text-sm">
                      <p className="text-brand-700">{block.data.videoUrl}</p>
                      {block.data.caption && <p className="mt-1 text-muted">{block.data.caption}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources Preview */}
        {lesson.importedResources.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Imported Resources</h3>
            <div className="space-y-2">
              {lesson.importedResources.map((resource) => (
                <div key={resource.id} className="flex items-center gap-3 rounded-card border border-line p-3">
                  {resource.type === 'quiz' && <HelpCircle className="h-5 w-5 text-warning" />}
                  {resource.type === 'flashcard' && <Layers className="h-5 w-5 text-brand-700" />}
                  {resource.type === 'model' && <Box className="h-5 w-5 text-success" />}
                  <div>
                    <p className="text-sm font-medium text-ink">{resource.resourceName}</p>
                    <p className="text-xs text-muted capitalize">{resource.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </Modal>
  )
}
