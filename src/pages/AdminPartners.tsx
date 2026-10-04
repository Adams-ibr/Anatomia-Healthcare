import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, ChevronRight, ExternalLink, Globe, Handshake, Loader2,
  PencilLine, Plus, Search, Trash2
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { formatDate } from '../lib/utils'

type PartnerType = 'academic' | 'corporate' | 'healthcare' | 'technology' | 'research'
type PartnerStatus = 'active' | 'inactive' | 'pending'

interface Partner {
  id: string
  name: string
  logo?: string
  type: PartnerType
  status: PartnerStatus
  description: string
  website?: string
  contactName?: string
  contactEmail?: string
  startDate: string
  isFeatured: boolean
}

const TYPE_BADGE: Record<PartnerType, 'brand' | 'success' | 'warning' | 'ink' | 'line'> = {
  academic: 'brand',
  corporate: 'success',
  healthcare: 'warning',
  technology: 'ink',
  research: 'line'
}

export default function AdminPartners() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [partners, setPartners] = useState<Partner[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 20
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | PartnerType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | PartnerStatus>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [deleting, setDeleting] = useState<Partner | null>(null)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockPartners: Partner[] = [
        {
          id: '1',
          name: 'Harvard Medical School',
          logo: 'https://via.placeholder.com/100x100?text=HMS',
          type: 'academic',
          status: 'active',
          description: 'Collaborative research and curriculum development partnership',
          website: 'https://hms.harvard.edu',
          contactName: 'Dr. James Wilson',
          contactEmail: 'jwilson@hms.harvard.edu',
          startDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
          isFeatured: true
        },
        {
          id: '2',
          name: 'Johnson & Johnson',
          logo: 'https://via.placeholder.com/100x100?text=J&J',
          type: 'corporate',
          status: 'active',
          description: 'Medical equipment and educational materials sponsorship',
          website: 'https://jnj.com',
          contactName: 'Sarah Mitchell',
          contactEmail: 'smitchell@jnj.com',
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          isFeatured: true
        },
        {
          id: '3',
          name: 'Mayo Clinic',
          type: 'healthcare',
          status: 'active',
          description: 'Clinical training and internship program partnership',
          website: 'https://mayoclinic.org',
          contactName: 'Dr. Robert Chen',
          contactEmail: 'chen.robert@mayo.edu',
          startDate: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
          isFeatured: false
        },
        {
          id: '4',
          name: 'Medical VR Technologies',
          type: 'technology',
          status: 'pending',
          description: 'Virtual reality platform development for anatomical education',
          website: 'https://medicalvr.com',
          contactName: 'Alex Thompson',
          contactEmail: 'alex@medicalvr.com',
          startDate: new Date().toISOString(),
          isFeatured: false
        },
        {
          id: '5',
          name: 'National Institutes of Health',
          logo: 'https://via.placeholder.com/100x100?text=NIH',
          type: 'research',
          status: 'active',
          description: 'Research grant and collaborative studies partnership',
          website: 'https://nih.gov',
          contactName: 'Dr. Patricia Martinez',
          contactEmail: 'martinez@nih.gov',
          startDate: new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000).toISOString(),
          isFeatured: true
        }
      ]

      let filtered = mockPartners
      if (search) {
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (typeFilter !== 'all') filtered = filtered.filter(p => p.type === typeFilter)
      if (statusFilter !== 'all') filtered = filtered.filter(p => p.status === statusFilter)

      setPartners(filtered)
      setTotal(filtered.length)
      setLoading(false)
    }, 500)
  }, [search, typeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Partner Organizations</h1>
          <p className="mt-1 text-sm text-muted">Manage institutional partnerships</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add Partner
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{partners.length}</p>
              <p className="text-xs text-muted">Total Partners</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{partners.filter(p => p.status === 'active').length}</p>
              <p className="text-xs text-muted">Active</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-warning/10 p-2 text-warning">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{partners.filter(p => p.status === 'pending').length}</p>
              <p className="text-xs text-muted">Pending</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{partners.filter(p => p.isFeatured).length}</p>
              <p className="text-xs text-muted">Featured</p>
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
            placeholder="Search partners..."
            className="input-base pl-9"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="input-base">
          <option value="all">All Types</option>
          <option value="academic">Academic</option>
          <option value="corporate">Corporate</option>
          <option value="healthcare">Healthcare</option>
          <option value="technology">Technology</option>
          <option value="research">Research</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="input-base">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          ))
        ) : partners.length === 0 ? (
          <EmptyState
            icon={<Handshake className="h-6 w-6" />}
            title="No partners"
            message="Add your first partner organization"
            action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add Partner</Button>}
          />
        ) : (
          partners.map((partner) => (
            <div key={partner.id} className="card p-5 hover:border-brand-200">
              <div className="flex items-start gap-4">
                {partner.logo ? (
                  <img src={partner.logo} alt={partner.name} className="h-16 w-16 rounded-card object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-card bg-paper">
                    <Handshake className="h-8 w-8 text-muted" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{partner.name}</h3>
                    <Badge color={TYPE_BADGE[partner.type]}>{partner.type}</Badge>
                    <Badge color={partner.status === 'active' ? 'success' : partner.status === 'pending' ? 'warning' : 'line'}>
                      {partner.status}
                    </Badge>
                    {partner.isFeatured && <Badge color="brand">Featured</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-muted">{partner.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
                    {partner.website && (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-brand-700 hover:underline"
                      >
                        <Globe className="h-3 w-3" />
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <span>Since {formatDate(partner.startDate)}</span>
                    {partner.contactName && <span>Contact: {partner.contactName}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(partner)}
                    className="rounded px-2 py-1 text-brand-700 hover:bg-brand-50"
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(partner)}
                    className="rounded px-2 py-1 text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {(creating || editing) && (
        <PartnerFormModal
          title={editing ? 'Edit Partner' : 'Add Partner'}
          partner={editing || undefined}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSubmit={() => {
            toast('Success', editing ? 'Partner updated' : 'Partner added')
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Remove Partner"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button onClick={() => { toast('Success', 'Partner removed'); setDeleting(null) }} className="text-danger">
                Remove
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted">Remove "{deleting.name}" from partners?</p>
        </Modal>
      )}
    </div>
  )
}

function PartnerFormModal({ title, partner, onClose, onSubmit }: {
  title: string
  partner?: Partner
  onClose: () => void
  onSubmit: () => void
}) {
  const [name, setName] = useState(partner?.name || '')
  const [type, setType] = useState<PartnerType>(partner?.type || 'academic')
  const [status, setStatus] = useState<PartnerStatus>(partner?.status || 'pending')
  const [description, setDescription] = useState(partner?.description || '')
  const [website, setWebsite] = useState(partner?.website || '')
  const [contactName, setContactName] = useState(partner?.contactName || '')
  const [contactEmail, setContactEmail] = useState(partner?.contactEmail || '')
  const [isFeatured, setIsFeatured] = useState(partner?.isFeatured ?? false)

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit}>
            {partner ? 'Save' : <><Plus className="h-4 w-4" /> Add</>}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-base">Partner Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-base" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as PartnerType)} className="input-base">
              <option value="academic">Academic</option>
              <option value="corporate">Corporate</option>
              <option value="healthcare">Healthcare</option>
              <option value="technology">Technology</option>
              <option value="research">Research</option>
            </select>
          </div>
          <div>
            <label className="label-base">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as PartnerStatus)} className="input-base">
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label-base">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-base" rows={3} />
        </div>
        <div>
          <label className="label-base">Website</label>
          <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="input-base" placeholder="https://" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">Contact Name</label>
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="input-base" />
          </div>
          <div>
            <label className="label-base">Contact Email</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="input-base" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 rounded" />
          Feature on homepage
        </label>
      </div>
    </Modal>
  )
}
