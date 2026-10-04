import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Briefcase, ChevronLeft, ChevronRight, Eye, Loader2, MapPin,
  PencilLine, Plus, Search, Trash2, Users
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { cn, formatDate } from '../lib/utils'

type JobStatus = 'open' | 'closed' | 'draft'
type JobType = 'full_time' | 'part_time' | 'contract' | 'remote'

interface JobPosting {
  id: string
  title: string
  department: string
  location: string
  type: JobType
  status: JobStatus
  description: string
  requirements: string[]
  salary?: string
  applicationCount: number
  postedAt: string
  closingDate?: string
}

const STATUS_BADGE: Record<JobStatus, 'success' | 'line' | 'warning'> = {
  open: 'success',
  closed: 'line',
  draft: 'warning'
}

const TYPE_BADGE: Record<JobType, 'brand' | 'success' | 'warning' | 'ink'> = {
  full_time: 'brand',
  part_time: 'success',
  contract: 'warning',
  remote: 'ink'
}

export default function AdminCareers() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 20
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | JobType>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<JobPosting | null>(null)
  const [viewing, setViewing] = useState<JobPosting | null>(null)
  const [deleting, setDeleting] = useState<JobPosting | null>(null)
  const [mutating, setMutating] = useState(false)

  // Mock data
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockJobs: JobPosting[] = [
        {
          id: '1',
          title: 'Senior Anatomy Instructor',
          department: 'Human Anatomy',
          location: 'Boston, MA',
          type: 'full_time',
          status: 'open',
          description: 'We are seeking an experienced anatomy instructor to join our teaching faculty.',
          requirements: ['PhD in Anatomy or related field', '5+ years teaching experience', 'Strong communication skills'],
          salary: '$80,000 - $120,000',
          applicationCount: 23,
          postedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: '3D Content Creator',
          department: 'Technology',
          location: 'Remote',
          type: 'remote',
          status: 'open',
          description: 'Create stunning 3D anatomical models and animations for our educational platform.',
          requirements: ['3D modeling expertise (Blender, Maya, or similar)', 'Medical illustration experience', 'Portfolio required'],
          salary: '$60,000 - $90,000',
          applicationCount: 45,
          postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          title: 'Student Success Coordinator',
          department: 'Student Services',
          location: 'New York, NY',
          type: 'part_time',
          status: 'open',
          description: 'Support students in achieving their learning goals through personalized guidance.',
          requirements: ['Bachelor\'s degree', 'Customer service experience', 'Excellent interpersonal skills'],
          applicationCount: 12,
          postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          title: 'Medical Education Consultant',
          department: 'Consulting',
          location: 'San Francisco, CA',
          type: 'contract',
          status: 'closed',
          description: 'Provide expert consultation on medical education curriculum development.',
          requirements: ['MD or PhD', 'Curriculum development experience', 'Strong analytical skills'],
          salary: '$100 - $150/hour',
          applicationCount: 34,
          postedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          closingDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      let filtered = mockJobs
      if (search) {
        filtered = filtered.filter(j =>
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          j.department.toLowerCase().includes(search.toLowerCase()) ||
          j.location.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (statusFilter !== 'all') filtered = filtered.filter(j => j.status === statusFilter)
      if (typeFilter !== 'all') filtered = filtered.filter(j => j.type === typeFilter)

      setJobs(filtered)
      setTotal(filtered.length)
      setLoading(false)
    }, 500)
  }, [search, statusFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Career Opportunities</h1>
          <p className="mt-1 text-sm text-muted">Manage job postings and applications</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Post Job
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{jobs.length}</p>
              <p className="text-xs text-muted">Total Positions</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{jobs.filter(j => j.status === 'open').length}</p>
              <p className="text-xs text-muted">Open Positions</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{jobs.reduce((sum, j) => sum + j.applicationCount, 0)}</p>
              <p className="text-xs text-muted">Applications</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{jobs.filter(j => j.type === 'remote').length}</p>
              <p className="text-xs text-muted">Remote Jobs</p>
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
            placeholder="Search jobs..."
            className="input-base pl-9"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="input-base">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="input-base">
          <option value="all">All Types</option>
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
          <option value="contract">Contract</option>
          <option value="remote">Remote</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-6 w-6" />}
            title="No job postings"
            message="Create your first job posting"
            action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Post Job</Button>}
          />
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="card p-5 hover:border-brand-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{job.title}</h3>
                    <Badge color={STATUS_BADGE[job.status]}>{job.status}</Badge>
                    <Badge color={TYPE_BADGE[job.type]}>{job.type.replace('_', ' ')}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {job.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.applicationCount} applications
                    </span>
                  </div>
                  {job.salary && (
                    <p className="mt-2 text-sm font-medium text-brand-700">{job.salary}</p>
                  )}
                  <p className="mt-2 text-xs text-muted">Posted {formatDate(job.postedAt)}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewing(job)}
                    className="rounded px-2 py-1 text-brand-700 hover:bg-brand-50"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditing(job)}
                    className="rounded px-2 py-1 text-brand-700 hover:bg-brand-50"
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(job)}
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

      {viewing && <JobViewModal job={viewing} onClose={() => setViewing(null)} />}
      {(creating || editing) && (
        <JobFormModal
          title={editing ? 'Edit Job' : 'Post Job'}
          job={editing || undefined}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSubmit={(data) => {
            toast('Success', `Job ${editing ? 'updated' : 'posted'}`)
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Delete Job Posting"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button onClick={() => { toast('Success', 'Job deleted'); setDeleting(null) }} className="text-danger">
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

function JobViewModal({ job, onClose }: { job: JobPosting; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={job.title}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Badge color={STATUS_BADGE[job.status]}>{job.status}</Badge>
          <Badge color={TYPE_BADGE[job.type]}>{job.type.replace('_', ' ')}</Badge>
        </div>
        <div className="grid gap-3 text-sm">
          <div><span className="font-medium">Department:</span> {job.department}</div>
          <div><span className="font-medium">Location:</span> {job.location}</div>
          {job.salary && <div><span className="font-medium">Salary:</span> {job.salary}</div>}
          <div><span className="font-medium">Applications:</span> {job.applicationCount}</div>
        </div>
        <div>
          <p className="text-sm font-medium">Description</p>
          <p className="mt-1 text-sm text-muted">{job.description}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Requirements</p>
          <ul className="mt-1 list-inside list-disc text-sm text-muted">
            {job.requirements.map((req, i) => <li key={i}>{req}</li>)}
          </ul>
        </div>
        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </Modal>
  )
}

function JobFormModal({ title, job, onClose, onSubmit }: {
  title: string
  job?: JobPosting
  onClose: () => void
  onSubmit: (data: any) => void
}) {
  const [jobTitle, setJobTitle] = useState(job?.title || '')
  const [department, setDepartment] = useState(job?.department || '')
  const [location, setLocation] = useState(job?.location || '')
  const [type, setType] = useState<JobType>(job?.type || 'full_time')
  const [status, setStatus] = useState<JobStatus>(job?.status || 'draft')
  const [description, setDescription] = useState(job?.description || '')

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ jobTitle, department, location, type, status, description })}>
            {job ? 'Save' : <><Plus className="h-4 w-4" /> Post</>}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-base">Job Title</label>
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="input-base" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">Department</label>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} className="input-base" />
          </div>
          <div>
            <label className="label-base">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="input-base" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as JobType)} className="input-base">
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
          </div>
          <div>
            <label className="label-base">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className="input-base">
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label-base">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-base" rows={4} />
        </div>
      </div>
    </Modal>
  )
}
