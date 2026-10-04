import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box, ChevronLeft, ChevronRight, Filter, Loader2, MoreVertical,
  PencilLine, Plus, Search, Trash2, Upload, X, Eye
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Avatar, Badge, Button, EmptyState, Modal, Tabs } from '../components/ui'
import { cn, formatDate } from '../lib/utils'

const BODY_SYSTEMS = [
  'Skeletal System',
  'Muscular System',
  'Cardiovascular System',
  'Respiratory System',
  'Digestive System',
  'Nervous System',
  'Endocrine System',
  'Lymphatic System',
  'Urinary System',
  'Reproductive System',
  'Integumentary System'
]

const MODEL_TYPES = [
  'Full Body',
  'Organ',
  'Bone',
  'Muscle',
  'Tissue',
  'Cell',
  'System Overview',
  'Region'
]

interface AnatomyModel {
  id: string
  name: string
  description: string
  bodySystem: string
  modelType: string
  fileUrl: string
  thumbnailUrl?: string
  fileSize: number
  format: 'GLB' | 'GLTF'
  tags: string[]
  isPublished: boolean
  views: number
  createdAt: string
  updatedAt: string
}

export default function AdminAnatomyModels() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [models, setModels] = useState<AnatomyModel[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 12
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [systemFilter, setSystemFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AnatomyModel | null>(null)
  const [viewing, setViewing] = useState<AnatomyModel | null>(null)
  const [deleting, setDeleting] = useState<AnatomyModel | null>(null)
  const [uploading, setUploading] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockModels: AnatomyModel[] = [
        {
          id: '1',
          name: 'Human Heart - Complete',
          description: 'Detailed 3D model of the human heart showing all chambers, valves, and major blood vessels',
          bodySystem: 'Cardiovascular System',
          modelType: 'Organ',
          fileUrl: '/models/heart-complete.glb',
          thumbnailUrl: '/thumbnails/heart.jpg',
          fileSize: 45000000,
          format: 'GLB',
          tags: ['heart', 'cardiovascular', 'anatomy', 'detailed'],
          isPublished: true,
          views: 1523,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Human Skeleton',
          description: 'Complete skeletal system with all 206 bones',
          bodySystem: 'Skeletal System',
          modelType: 'Full Body',
          fileUrl: '/models/skeleton.glb',
          thumbnailUrl: '/thumbnails/skeleton.jpg',
          fileSize: 78000000,
          format: 'GLB',
          tags: ['skeleton', 'bones', 'full-body'],
          isPublished: true,
          views: 2891,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Brain Anatomy',
          description: 'Detailed brain model showing lobes, ventricles, and major structures',
          bodySystem: 'Nervous System',
          modelType: 'Organ',
          fileUrl: '/models/brain.glb',
          fileSize: 52000000,
          format: 'GLB',
          tags: ['brain', 'nervous', 'neurology'],
          isPublished: false,
          views: 0,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Apply filters
      let filtered = mockModels
      if (search) {
        filtered = filtered.filter(m => 
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.description.toLowerCase().includes(search.toLowerCase()) ||
          m.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
        )
      }
      if (systemFilter !== 'all') {
        filtered = filtered.filter(m => m.bodySystem === systemFilter)
      }
      if (typeFilter !== 'all') {
        filtered = filtered.filter(m => m.modelType === typeFilter)
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(m => 
          statusFilter === 'published' ? m.isPublished : !m.isPublished
        )
      }

      setModels(filtered)
      setTotal(filtered.length)
      setLoading(false)
    }, 500)
  }, [search, systemFilter, typeFilter, statusFilter, page])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">3D Anatomy Models</h1>
          <p className="mt-1 text-sm text-muted">Manage interactive 3D anatomy models for courses</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Upload New Model
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>

          {/* Body System Filter */}
          <select
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            className="input-base"
          >
            <option value="all">All Systems</option>
            {BODY_SYSTEMS.map(system => (
              <option key={system} value={system}>{system}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-base"
          >
            <option value="all">All Types</option>
            {MODEL_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="mt-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              statusFilter === 'all' ? 'bg-brand-100 text-brand-700' : 'text-muted hover:bg-line/40'
            )}
          >
            All ({total})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              statusFilter === 'published' ? 'bg-success/10 text-success' : 'text-muted hover:bg-line/40'
            )}
          >
            Published
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              statusFilter === 'draft' ? 'bg-warning/10 text-warning' : 'text-muted hover:bg-line/40'
            )}
          >
            Drafts
          </button>
        </div>
      </div>

      {/* Models Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse p-4">
              <div className="aspect-video rounded bg-line" />
              <div className="mt-4 h-4 rounded bg-line" />
              <div className="mt-2 h-3 w-2/3 rounded bg-line" />
            </div>
          ))}
        </div>
      ) : models.length === 0 ? (
        <EmptyState
          icon={<Box className="h-12 w-12" />}
          title="No 3D models found"
          message="Upload your first anatomy model to get started"
          action={
            <Button onClick={() => setCreating(true)}>
              <Upload className="h-4 w-4" />
              Upload Model
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <div key={model.id} className="card group overflow-hidden">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-brand-50 to-brand-100">
                  {model.thumbnailUrl ? (
                    <img src={model.thumbnailUrl} alt={model.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Box className="h-16 w-16 text-brand-300" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2 flex gap-1">
                    {model.isPublished ? (
                      <Badge color="success">Published</Badge>
                    ) : (
                      <Badge color="warning">Draft</Badge>
                    )}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setViewing(model)}
                      className="rounded-card bg-white p-2 text-ink hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditing(model)}
                      className="rounded-card bg-white p-2 text-ink hover:bg-gray-100"
                    >
                      <PencilLine className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(model)}
                      className="rounded-card bg-white p-2 text-danger hover:bg-gray-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-ink">{model.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{model.description}</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge color="brand">{model.bodySystem}</Badge>
                    <Badge>{model.modelType}</Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>{model.format} • {formatFileSize(model.fileSize)}</span>
                    <span>{model.views} views</span>
                  </div>

                  <div className="mt-2 text-xs text-muted">
                    Updated {formatDate(model.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} models
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

      {/* Create/Upload Modal */}
      {creating && (
        <ModelUploadModal
          onClose={() => setCreating(false)}
          onSuccess={() => {
            setCreating(false)
            toast('Success', 'Model uploaded successfully')
          }}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <ModelEditModal
          model={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null)
            toast('Success', 'Model updated successfully')
          }}
        />
      )}

      {/* View Modal */}
      {viewing && (
        <ModelViewModal
          model={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal
          open={true}
          onClose={() => setDeleting(null)}
          title="Delete Model"
        >
          <p className="text-sm text-muted">
            Are you sure you want to delete "{deleting.name}"? This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast('Success', 'Model deleted successfully')
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

function ModelUploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bodySystem: BODY_SYSTEMS[0],
    modelType: MODEL_TYPES[0],
    tags: '',
    isPublished: false
  })
  const [file, setFile] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    // Simulate upload
    setTimeout(() => {
      setUploading(false)
      onSuccess()
    }, 2000)
  }

  return (
    <Modal open={true} onClose={onClose} title="Upload 3D Model">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="label-base">3D Model File (GLB/GLTF)</label>
          <div className="mt-1">
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-base"
              required
            />
          </div>
          <p className="mt-1 text-xs text-muted">Maximum file size: 100MB</p>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="label-base">Thumbnail Image (Optional)</label>
          <div className="mt-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
              className="input-base"
            />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="label-base">Model Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-base"
            placeholder="e.g., Human Heart - Complete"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="label-base">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-base"
            rows={3}
            placeholder="Describe the anatomy model..."
            required
          />
        </div>

        {/* Body System */}
        <div>
          <label className="label-base">Body System</label>
          <select
            value={formData.bodySystem}
            onChange={(e) => setFormData({ ...formData, bodySystem: e.target.value })}
            className="input-base"
            required
          >
            {BODY_SYSTEMS.map(system => (
              <option key={system} value={system}>{system}</option>
            ))}
          </select>
        </div>

        {/* Model Type */}
        <div>
          <label className="label-base">Model Type</label>
          <select
            value={formData.modelType}
            onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
            className="input-base"
            required
          >
            {MODEL_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="label-base">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="input-base"
            placeholder="e.g., heart, cardiovascular, detailed"
          />
        </div>

        {/* Published */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            className="rounded border-line"
          />
          <label htmlFor="published" className="text-sm text-ink">
            Publish immediately
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={uploading} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={uploading || !file} className="flex-1">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Model
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ModelEditModal({ model, onClose, onSuccess }: { model: AnatomyModel; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: model.name,
    description: model.description,
    bodySystem: model.bodySystem,
    modelType: model.modelType,
    tags: model.tags.join(', '),
    isPublished: model.isPublished
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onSuccess()
    }, 1000)
  }

  return (
    <Modal open={true} onClose={onClose} title="Edit Model">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Model Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-base"
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
            required
          />
        </div>

        <div>
          <label className="label-base">Body System</label>
          <select
            value={formData.bodySystem}
            onChange={(e) => setFormData({ ...formData, bodySystem: e.target.value })}
            className="input-base"
            required
          >
            {BODY_SYSTEMS.map(system => (
              <option key={system} value={system}>{system}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-base">Model Type</label>
          <select
            value={formData.modelType}
            onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
            className="input-base"
            required
          >
            {MODEL_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-base">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="input-base"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="edit-published"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            className="rounded border-line"
          />
          <label htmlFor="edit-published" className="text-sm text-ink">
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
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ModelViewModal({ model, onClose }: { model: AnatomyModel; onClose: () => void }) {
  return (
    <Modal open={true} onClose={onClose} title="Model Details">
      <div className="space-y-4">
        <div className="aspect-video rounded-card bg-gradient-to-br from-brand-50 to-brand-100">
          {model.thumbnailUrl ? (
            <img src={model.thumbnailUrl} alt={model.name} className="h-full w-full rounded-card object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Box className="h-24 w-24 text-brand-300" />
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-ink">{model.name}</h3>
          <p className="mt-1 text-sm text-muted">{model.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted">Body System</p>
            <p className="font-medium text-ink">{model.bodySystem}</p>
          </div>
          <div>
            <p className="text-muted">Model Type</p>
            <p className="font-medium text-ink">{model.modelType}</p>
          </div>
          <div>
            <p className="text-muted">Format</p>
            <p className="font-medium text-ink">{model.format}</p>
          </div>
          <div>
            <p className="text-muted">File Size</p>
            <p className="font-medium text-ink">
              {(model.fileSize / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
          <div>
            <p className="text-muted">Views</p>
            <p className="font-medium text-ink">{model.views.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted">Status</p>
            <p className="font-medium text-ink">
              {model.isPublished ? (
                <Badge color="success">Published</Badge>
              ) : (
                <Badge color="warning">Draft</Badge>
              )}
            </p>
          </div>
        </div>

        {model.tags.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-muted">Tags</p>
            <div className="flex flex-wrap gap-1">
              {model.tags.map(tag => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs text-muted">
          <div>
            <p>Created</p>
            <p>{formatDate(model.createdAt)}</p>
          </div>
          <div>
            <p>Last Updated</p>
            <p>{formatDate(model.updatedAt)}</p>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </Modal>
  )
}
