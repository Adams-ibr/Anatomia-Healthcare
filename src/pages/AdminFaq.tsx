import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, HelpCircle,
  Loader2, PencilLine, Plus, Search, Trash2
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { cn } from '../lib/utils'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order: number
  isPublished: boolean
  viewCount: number
  helpfulCount: number
  createdAt: string
  updatedAt: string
}

export default function AdminFaq() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 20
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<FAQ | null>(null)
  const [deleting, setDeleting] = useState<FAQ | null>(null)
  const [mutating, setMutating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const categories = ['General', 'Courses', 'Account', 'Payment', 'Technical', 'Certificates']

  // Mock data
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockFaqs: FAQ[] = [
        {
          id: '1',
          question: 'How do I enroll in a course?',
          answer: 'To enroll in a course, browse our course catalog, select the course you\'re interested in, and click the "Enroll Now" button. You\'ll be guided through the payment process if applicable.',
          category: 'Courses',
          order: 1,
          isPublished: true,
          viewCount: 1245,
          helpfulCount: 892,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          question: 'Can I get a refund for a course?',
          answer: 'Yes, we offer a 30-day money-back guarantee for all courses. If you\'re not satisfied with your purchase, you can request a full refund within 30 days of enrollment.',
          category: 'Payment',
          order: 2,
          isPublished: true,
          viewCount: 876,
          helpfulCount: 654,
          createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          question: 'How do I reset my password?',
          answer: 'Click on "Forgot Password" on the login page. Enter your email address, and we\'ll send you a link to reset your password. The link is valid for 24 hours.',
          category: 'Account',
          order: 3,
          isPublished: true,
          viewCount: 2341,
          helpfulCount: 1876,
          createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          question: 'Will I receive a certificate after completing a course?',
          answer: 'Yes, upon successful completion of a course (passing all assessments), you\'ll receive a digital certificate that you can download and share on LinkedIn or other platforms.',
          category: 'Certificates',
          order: 4,
          isPublished: true,
          viewCount: 1567,
          helpfulCount: 1234,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          question: 'What payment methods do you accept?',
          answer: 'We accept major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All transactions are secure and encrypted.',
          category: 'Payment',
          order: 5,
          isPublished: false,
          viewCount: 0,
          helpfulCount: 0,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '6',
          question: 'Can I access courses on mobile devices?',
          answer: 'Absolutely! Our platform is fully responsive and works seamlessly on smartphones, tablets, and desktop computers. You can learn anywhere, anytime.',
          category: 'Technical',
          order: 6,
          isPublished: true,
          viewCount: 987,
          helpfulCount: 765,
          createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      let filtered = mockFaqs
      if (search) {
        filtered = filtered.filter(faq =>
          faq.question.toLowerCase().includes(search.toLowerCase()) ||
          faq.answer.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(faq => faq.category === categoryFilter)
      }
      if (statusFilter === 'published') {
        filtered = filtered.filter(faq => faq.isPublished)
      } else if (statusFilter === 'draft') {
        filtered = filtered.filter(faq => !faq.isPublished)
      }

      setFaqs(filtered)
      setTotal(filtered.length)
      setLoading(false)
    }, 500)
  }, [search, categoryFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const handleDelete = (faq: FAQ) => {
    setMutating(true)
    setTimeout(() => {
      setFaqs(faqs.filter(f => f.id !== faq.id))
      setDeleting(null)
      setMutating(false)
      toast('Success', 'FAQ deleted successfully')
    }, 500)
  }

  const togglePublish = (id: string) => {
    setFaqs(faqs.map(f =>
      f.id === id ? { ...f, isPublished: !f.isPublished } : f
    ))
    toast('Success', 'FAQ status updated')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">FAQ Management</h1>
          <p className="mt-1 text-sm text-muted">Manage frequently asked questions</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New FAQ
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{faqs.length}</p>
              <p className="text-xs text-muted">Total FAQs</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{faqs.filter(f => f.isPublished).length}</p>
              <p className="text-xs text-muted">Published</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{faqs.reduce((sum, f) => sum + f.viewCount, 0).toLocaleString()}</p>
              <p className="text-xs text-muted">Total Views</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{faqs.reduce((sum, f) => sum + f.helpfulCount, 0).toLocaleString()}</p>
              <p className="text-xs text-muted">Helpful Votes</p>
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
            placeholder="Search FAQs..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-base"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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

      {/* FAQs List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))
        ) : faqs.length === 0 ? (
          <EmptyState
            icon={<HelpCircle className="h-6 w-6" />}
            title="No FAQs found"
            message="Create your first FAQ to get started"
            action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New FAQ</Button>}
          />
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className="card overflow-hidden">
              <div
                className="flex cursor-pointer items-start justify-between gap-4 p-5 hover:bg-paper/60"
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-ink">{faq.question}</h3>
                    <Badge color={faq.isPublished ? 'success' : 'line'}>
                      {faq.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge color="brand">{faq.category}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
                    <span>{faq.viewCount.toLocaleString()} views</span>
                    <span>•</span>
                    <span>{faq.helpfulCount.toLocaleString()} helpful</span>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 shrink-0 text-muted transition-transform',
                    expandedId === faq.id && 'rotate-180'
                  )}
                />
              </div>

              {expandedId === faq.id && (
                <div className="border-t border-line bg-surface p-5">
                  <p className="text-sm text-ink whitespace-pre-wrap">{faq.answer}</p>
                  <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditing(faq)
                      }}
                    >
                      <PencilLine className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePublish(faq.id)
                      }}
                    >
                      {faq.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleting(faq)
                      }}
                      className="text-danger"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted">
            Showing {total === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} FAQs
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

      {/* Create/Edit Modal */}
      {(creating || editing) && (
        <FAQFormModal
          title={editing ? 'Edit FAQ' : 'Create FAQ'}
          faq={editing || undefined}
          categories={categories}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSubmit={(data) => {
            toast('Success', `FAQ ${editing ? 'updated' : 'created'} successfully`)
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Delete FAQ"
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
            Are you sure you want to delete this FAQ? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}

function FAQFormModal({ title, faq, categories, onClose, onSubmit }: {
  title: string
  faq?: FAQ
  categories: string[]
  onClose: () => void
  onSubmit: (data: any) => void
}) {
  const [question, setQuestion] = useState(faq?.question || '')
  const [answer, setAnswer] = useState(faq?.answer || '')
  const [category, setCategory] = useState(faq?.category || categories[0])
  const [isPublished, setIsPublished] = useState(faq?.isPublished ?? true)

  const valid = question.trim().length > 0 && answer.trim().length > 0

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ question, answer, category, isPublished })} disabled={!valid}>
            {faq ? 'Save Changes' : <><Plus className="h-4 w-4" /> Create</>}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-base">Question</label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter the question"
            className="input-base"
            autoFocus
          />
        </div>
        <div>
          <label className="label-base">Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Provide a detailed answer"
            className="input-base"
            rows={6}
          />
        </div>
        <div>
          <label className="label-base">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-brand-500"
          />
          Publish immediately
        </label>
      </div>
    </Modal>
  )
}
