import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, BookOpen, Calendar, CheckCircle2, ChevronLeft, ChevronRight,
  Eye, Loader2, PencilLine, Plus, Search, Trash2, User
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { cn, formatDate } from '../lib/utils'

type ArticleStatus = 'draft' | 'published' | 'archived'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  authorId: string
  authorName: string
  categoryId?: string
  categoryName?: string
  status: ArticleStatus
  viewCount: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

const STATUS_BADGE: Record<ArticleStatus, 'line' | 'success' | 'ink'> = {
  draft: 'line',
  published: 'success',
  archived: 'ink'
}

export default function AdminArticles() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()

  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 20
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [deleting, setDeleting] = useState<Article | null>(null)
  const [mutating, setMutating] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockArticles: Article[] = [
        {
          id: '1',
          title: 'Understanding Human Anatomy: A Beginner\'s Guide',
          slug: 'understanding-human-anatomy-beginners-guide',
          excerpt: 'Explore the fundamentals of human anatomy and learn how to study effectively.',
          content: 'Full article content here...',
          coverImage: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800',
          authorId: '1',
          authorName: 'Dr. Sarah Johnson',
          categoryId: '1',
          categoryName: 'Educational',
          status: 'published',
          viewCount: 1245,
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['anatomy', 'education', 'beginner']
        },
        {
          id: '2',
          title: '3D Learning: The Future of Medical Education',
          slug: '3d-learning-future-medical-education',
          excerpt: 'Discover how 3D models are revolutionizing the way students learn anatomy.',
          content: 'Full article content here...',
          coverImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
          authorId: '2',
          authorName: 'Prof. Michael Chen',
          categoryId: '2',
          categoryName: 'Technology',
          status: 'published',
          viewCount: 892,
          publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['3D', 'technology', 'innovation']
        },
        {
          id: '3',
          title: 'Study Tips for Medical Students',
          slug: 'study-tips-medical-students',
          excerpt: 'Practical tips and strategies to help you excel in your medical studies.',
          content: 'Full article content here...',
          authorId: '1',
          authorName: 'Dr. Sarah Johnson',
          categoryId: '1',
          categoryName: 'Educational',
          status: 'draft',
          viewCount: 0,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['study', 'tips', 'medical']
        },
        {
          id: '4',
          title: 'The Importance of Clinical Practice',
          slug: 'importance-clinical-practice',
          excerpt: 'Why hands-on experience is crucial for medical education.',
          content: 'Full article content here...',
          authorId: '3',
          authorName: 'Dr. Emily Rodriguez',
          categoryId: '3',
          categoryName: 'Clinical',
          status: 'archived',
          viewCount: 543,
          publishedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['clinical', 'practice', 'education']
        }
      ]

      let filtered = mockArticles
      if (search) {
        filtered = filtered.filter(a =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.excerpt.toLowerCase().includes(search.toLowerCase()) ||
          a.authorName.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(a => a.status === statusFilter)
      }

      setArticles(filtered)
      setTotal(filtered.length)
      setLoading(false)
    }, 500)
  }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const handleDelete = (article: Article) => {
    setMutating(true)
    setTimeout(() => {
      setArticles(articles.filter(a => a.id !== article.id))
      setDeleting(null)
      setMutating(false)
      toast('Success', `Article "${article.title}" deleted`)
    }, 500)
  }

  const handleStatusChange = (articleId: string, newStatus: ArticleStatus) => {
    setArticles(articles.map(a =>
      a.id === articleId ? { ...a, status: newStatus, publishedAt: newStatus === 'published' ? new Date().toISOString() : a.publishedAt } : a
    ))
    toast('Success', 'Article status updated')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Article Management</h1>
          <p className="mt-1 text-sm text-muted">Manage blog posts and educational articles</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{articles.length}</p>
              <p className="text-xs text-muted">Total Articles</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{articles.filter(a => a.status === 'published').length}</p>
              <p className="text-xs text-muted">Published</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-warning/10 p-2 text-warning">
              <PencilLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{articles.filter(a => a.status === 'draft').length}</p>
              <p className="text-xs text-muted">Drafts</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{articles.reduce((sum, a) => sum + a.viewCount, 0).toLocaleString()}</p>
              <p className="text-xs text-muted">Total Views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ArticleStatus)}
          className="input-base"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Articles List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-20 w-32 shrink-0 rounded-card" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="No articles found"
            message="Create your first article to get started"
            action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New Article</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">Article</th>
                  <th className="hidden px-5 py-3 font-semibold md:table-cell">Author</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">Category</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">Views</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {articles.map((article) => (
                  <tr key={article.id} className="group hover:bg-paper/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-4">
                        {article.coverImage ? (
                          <img
                            src={article.coverImage}
                            alt=""
                            className="h-20 w-32 shrink-0 rounded-card object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-card bg-paper">
                            <BookOpen className="h-6 w-6 text-muted" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{article.title}</p>
                          <p className="mt-1 text-xs text-muted line-clamp-2">{article.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted" />
                        <span className="text-muted">{article.authorName}</span>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 text-muted lg:table-cell">{article.categoryName ?? '—'}</td>
                    <td className="hidden px-5 py-3 text-muted lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        {article.viewCount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge color={STATUS_BADGE[article.status]}>{article.status}</Badge>
                    </td>
                    <td className="hidden px-5 py-3 text-muted lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(article.publishedAt || article.createdAt)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(article)}
                          className="rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                          aria-label="Edit article"
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                        </button>
                        {article.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(article.id, 'published')}
                            className="rounded px-2 py-1 text-xs font-medium text-success hover:bg-success/10"
                            title="Publish"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleting(article)}
                          className="rounded px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted">
            Showing {total === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} articles
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <span className="text-xs text-muted">{page} / {totalPages}</span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {creating && (
        <CreateArticleModal
          onClose={() => setCreating(false)}
          onCreate={(data) => {
            toast('Success', 'Article created successfully')
            setCreating(false)
          }}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <EditArticleModal
          article={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            toast('Success', 'Article updated successfully')
            setEditing(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Delete Article"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)} disabled={mutating}>
                Cancel
              </Button>
              <Button onClick={() => handleDelete(deleting)} disabled={mutating} className="text-danger">
                {mutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted">
            Are you sure you want to delete "{deleting.title}"? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}

function CreateArticleModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (data: any) => void
}) {
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<ArticleStatus>('draft')

  const valid = title.trim().length > 0 && excerpt.trim().length > 0

  return (
    <Modal
      open
      onClose={onClose}
      title="Create Article"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate({ title, excerpt, content, status })} disabled={!valid}>
            <Plus className="h-4 w-4" /> Create
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-base">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title"
            className="input-base"
            autoFocus
          />
        </div>
        <div>
          <label className="label-base">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief description of the article"
            className="input-base"
            rows={3}
          />
        </div>
        <div>
          <label className="label-base">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Full article content"
            className="input-base"
            rows={8}
          />
        </div>
        <div>
          <label className="label-base">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ArticleStatus)} className="input-base">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}

function EditArticleModal({ article, onClose, onSave }: {
  article: Article
  onClose: () => void
  onSave: (data: any) => void
}) {
  const [title, setTitle] = useState(article.title)
  const [excerpt, setExcerpt] = useState(article.excerpt)
  const [status, setStatus] = useState(article.status)

  const valid = title.trim().length > 0 && excerpt.trim().length > 0

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Article"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ title, excerpt, status })} disabled={!valid}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-base">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-base"
          />
        </div>
        <div>
          <label className="label-base">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="input-base"
            rows={3}
          />
        </div>
        <div>
          <label className="label-base">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ArticleStatus)} className="input-base">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}
