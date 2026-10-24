import { useCallback, useEffect, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Eye, Image, Loader2, PencilLine,
  Plus, Search, Trash2, Upload
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { formatDate } from '../lib/utils'
import { galleryApi } from '../lib/supabase'

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

  const [items, setItems] = useState<GalleryItem[]>([])
  const [page, setPage] = useState(1)
  const perPage = 24
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [viewing, setViewing] = useState<GalleryItem | null>(null)
  const [deleting, setDeleting] = useState<GalleryItem | null>(null)

  const categories = ['Anatomy Models', 'Classroom', 'Events', 'Laboratory', 'Student Work', 'Facilities']

  const reloadGallery = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await galleryApi.list()
      setItems((rows ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description ?? '',
        imageUrl: row.image_url ?? '',
        category: row.category ?? 'General',
        tags: row.tags ?? [],
        uploadedBy: row.uploaded_by ?? 'Admin',
        uploadedAt: row.created_at ?? '',
        viewCount: row.view_count ?? 0,
        isPublished: row.is_published ?? false
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery photos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reloadGallery() }, [reloadGallery])
  useEffect(() => { setPage(1) }, [search, categoryFilter])

  const filteredItems = items.filter(item => {
    if (search.trim() && !`${item.title} ${item.description ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())) return false
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
    return true
  })
  const pageItems = filteredItems.slice((page - 1) * perPage, page * perPage)
  const total = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const handleSubmit = async (data: { title: string; description: string; category: string; isPublished: boolean; imageFile: File | null }) => {
    setMutating(true)
    try {
      if (editing) await galleryApi.update(editing.id, data)
      else await galleryApi.create(data)
      await reloadGallery()
      toast('Success', editing ? 'Photo updated' : 'Photo uploaded')
      setCreating(false)
      setEditing(null)
    } catch (err) {
      toast('Error', err instanceof Error ? err.message : 'Failed to save gallery photo', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleDelete = async (item: GalleryItem) => {
    setMutating(true)
    try {
      await galleryApi.delete(item.id)
      await reloadGallery()
      setDeleting(null)
      toast('Success', 'Photo deleted')
    } catch (err) {
      toast('Error', err instanceof Error ? err.message : 'Failed to delete photo', 'error')
    } finally {
      setMutating(false)
    }
  }

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

      {error && (
        <div className="flex items-center justify-between rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <span>{error}</span>
          <Button variant="outline" onClick={reloadGallery}>Retry</Button>
        </div>
      )}

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
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Image className="h-6 w-6" />}
          title="No photos"
          message="Upload your first photo"
          action={<Button onClick={() => setCreating(true)}><Upload className="h-4 w-4" /> Upload</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pageItems.map((item) => (
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
          saving={mutating}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSubmit={handleSubmit}
        />
      )}

      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Delete Photo"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)} disabled={mutating}>Cancel</Button>
              <Button onClick={() => handleDelete(deleting)} disabled={mutating} className="text-danger">
                {mutating && <Loader2 className="h-4 w-4 animate-spin" />}
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

function GalleryFormModal({ title, item, categories, saving, onClose, onSubmit }: {
  title: string
  item?: GalleryItem
  categories: string[]
  saving: boolean
  onClose: () => void
  onSubmit: (data: { title: string; description: string; category: string; isPublished: boolean; imageFile: File | null }) => void
}) {
  const [photoTitle, setPhotoTitle] = useState(item?.title || '')
  const [description, setDescription] = useState(item?.description || '')
  const [category, setCategory] = useState(item?.category || categories[0])
  const [isPublished, setIsPublished] = useState(item?.isPublished ?? true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const valid = photoTitle.trim().length > 0 && (Boolean(item) || Boolean(imageFile))

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ title: photoTitle.trim(), description: description.trim(), category, isPublished, imageFile })} disabled={!valid || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : item ? 'Save' : <><Upload className="h-4 w-4" /> Upload</>}
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
        <div>
          <label className="label-base">{item ? 'Replace Image (optional)' : 'Image File *'}</label>
          <input type="file" accept="image/*" className="input-base" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded" />
          Publish immediately
        </label>
      </div>
    </Modal>
  )
}
