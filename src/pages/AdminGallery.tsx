import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, ChevronRight, Eye, Image, Loader2, PencilLine,
  Plus, Search, Trash2, Upload
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { formatDate } from '../lib/utils'

interface GalleryItem {
  id: string
  title: string
  description?: string
  imageUrl: string
  category: string
  tags: string[]
  uploadedBy: string
  uploadedAt: string
  viewCount: number
  isPublished: boolean
}

export default function AdminGallery() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [items, setItems] = useState<GalleryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 24
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [viewing, setViewing] = useState<GalleryItem | null>(null)
  const [deleting, setDeleting] = useState<GalleryItem | null>(null)

  const categories = ['Anatomy Models', 'Classroom', 'Events', 'Laboratory', 'Student Work', 'Facilities']

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockItems: GalleryItem[] = [
        {
          id: '1',
          title: 'Advanced 3D Heart Model',
          description: 'Interactive 3D model showing cardiovascular anatomy',
          imageUrl: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400',
          category: 'Anatomy Models',
          tags: ['3D', 'heart', 'cardiovascular'],
          uploadedBy: 'Dr. Sarah Johnson',
          uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 543,
          isPublished: true
        },
        {
          id: '2',
          title: 'Anatomy Lab Session',
          imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400',
          category: 'Classroom',
          tags: ['lab', 'students', 'learning'],
          uploadedBy: 'Admin',
          uploadedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 234,
          isPublished: true
        },
        {
          id: '3',
          title: 'Skeletal System Display',
          description: 'Full skeleton model in our main exhibition hall',
          imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400',
          category: 'Facilities',
          tags: ['skeleton', 'display', 'exhibition'],
          uploadedBy: 'Prof. Chen',
          uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 876,
          isPublished: true
        },
        {
          id: '4',
          title: 'Student Graduation Ceremony',
          imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
          category: 'Events',
          tags: ['graduation', 'ceremony', 'students'],
          uploadedBy: 'Admin',
          uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 1234,
          isPublished: true
        }
      ]

      let filtered = mockItems
      if (search) {
        filtered = filtered.filter(item =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
        )
      }
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(item => item.category === categoryFilter)
      }

      setItems(filtered)
      setTotal(filtered.length)
      setLoading(false)
    }, 500)
  }, [search, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Photo Gallery</h1>
          <p className="mt-1 text-sm text-muted">Manage institutional photos and media</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Upload className="h-4 w-4" /> Upload Photo
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Image className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{items.length}</p>
              <p className="text-xs text-muted">Total Photos</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <Image className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{items.filter(i => i.isPublished).length}</p>
              <p className="text-xs text-muted">Published</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{items.reduce((sum, i) => sum + i.viewCount, 0).toLocaleString()}</p>
              <p className="text-xs text-muted">Total Views</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Image className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{categories.length}</p>
              <p className="text-xs text-muted">Categories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gallery..."
            className="input-base pl-9"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-base">
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-3">
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Image className="h-6 w-6" />}
          title="No photos"
          message="Upload your first photo"
          action={<Button onClick={() => setCreating(true)}><Upload className="h-4 w-4" /> Upload</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="card group relative overflow-hidden">
              <img src={item.imageUrl} alt={item.title} className="aspect-video w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setViewing(item)}
                  className="rounded-card bg-white p-2 text-ink hover:bg-paper"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditing(item)}
                  className="rounded-card bg-white p-2 text-ink hover:bg-paper"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleting(item)}
                  className="rounded-card bg-white p-2 text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <p className="font-medium text-ink line-clamp-1">{item.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge color="brand" className="text-xs">{item.category}</Badge>
                  {item.isPublished && <Badge color="success" className="text-xs">Published</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted">{item.viewCount} views</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={viewing.title}>
          <div className="space-y-4">
            <img src={viewing.imageUrl} alt={viewing.title} className="w-full rounded-card" />
            {viewing.description && <p className="text-sm text-muted">{viewing.description}</p>}
            <div className="grid gap-2 text-sm">
              <div><span className="font-medium">Category:</span> {viewing.category}</div>
              <div><span className="font-medium">Uploaded by:</span> {viewing.uploadedBy}</div>
              <div><span className="font-medium">Date:</span> {formatDate(viewing.uploadedAt)}</div>
              <div><span className="font-medium">Views:</span> {viewing.viewCount}</div>
            </div>
            <div className="flex flex-wrap gap-1">
              {viewing.tags.map(tag => <Badge key={tag} color="brand">{tag}</Badge>)}
            </div>
            <Button onClick={() => setViewing(null)} className="w-full">Close</Button>
          </div>
        </Modal>
      )}

      {(creating || editing) && (
        <GalleryFormModal
          title={editing ? 'Edit Photo' : 'Upload Photo'}
          item={editing || undefined}
          categories={categories}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSubmit={() => {
            toast('Success', editing ? 'Photo updated' : 'Photo uploaded')
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Delete Photo"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button onClick={() => { toast('Success', 'Photo deleted'); setDeleting(null) }} className="text-danger">
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted">Delete "{deleting.title}"?</p>
        </Modal>
      )}
    </div>
  )
}

function GalleryFormModal({ title, item, categories, onClose, onSubmit }: {
  title: string
  item?: GalleryItem
  categories: string[]
  onClose: () => void
  onSubmit: () => void
}) {
  const [photoTitle, setPhotoTitle] = useState(item?.title || '')
  const [description, setDescription] = useState(item?.description || '')
  const [category, setCategory] = useState(item?.category || categories[0])
  const [isPublished, setIsPublished] = useState(item?.isPublished ?? true)

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit}>
            {item ? 'Save' : <><Upload className="h-4 w-4" /> Upload</>}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-base">Title</label>
          <input value={photoTitle} onChange={(e) => setPhotoTitle(e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="label-base">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-base" rows={3} />
        </div>
        <div>
          <label className="label-base">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        {!item && (
          <div>
            <label className="label-base">Image File</label>
            <input type="file" accept="image/*" className="input-base" />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded" />
          Publish immediately
        </label>
      </div>
    </Modal>
  )
}
