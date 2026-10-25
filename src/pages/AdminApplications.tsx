import { useCallback, useEffect, useState } from 'react'
import { FileText, Users, CheckCircle, Clock, Loader2, Eye } from 'lucide-react'
import { useApp } from '../lib/store'
import { applicationsApi } from '../lib/supabase'
import { Badge, Button, EmptyState, Modal } from '../components/ui'
import { formatDate } from '../lib/utils'
import { supabase } from '../lib/supabase'

interface Application {
  id: string
  name: string
  email: string
  position: string
  status: string
  date: string
  phone: string
  location: string
  experience: number
  coverLetter: string
  portfolioUrl?: string
  resumePath?: string
  startDate: string
}

export default function AdminApplications() {
  const { toast } = useApp()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Application | null>(null)
  const [resumeUrl, setResumeUrl] = useState('')
  const [resumeLoading, setResumeLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const rows = await applicationsApi.list()
      setApplications((rows ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        position: row.careers?.title ?? 'Job application',
        status: row.status ?? 'pending',
        date: row.created_at,
        phone: row.phone ?? '',
        location: row.location ?? '',
        experience: Number(row.experience) || 0,
        coverLetter: row.cover_letter ?? '',
        portfolioUrl: row.portfolio_url ?? undefined,
        resumePath: row.resume_url ?? undefined,
        startDate: row.start_date ?? ''
      })))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load applications.')
    } finally {
      setLoading(false)
    }
  }, [])

  const viewApplication = async (application: Application) => {
    setViewing(application)
    setResumeUrl('')
    if (!application.resumePath) return
    setResumeLoading(true)
    try {
      if (/^https?:\/\//i.test(application.resumePath)) setResumeUrl(application.resumePath)
      else {
        const { data, error } = await supabase.storage.from('job-resumes').createSignedUrl(application.resumePath, 60 * 15)
        if (error) throw error
        setResumeUrl(data.signedUrl)
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not open the resume.')
    } finally { setResumeLoading(false) }
  }

  useEffect(() => { void load() }, [load])

  const updateStatus = async (application: Application, status: string) => {
    setUpdating(application.id)
    try {
      await applicationsApi.update(application.id, { status })
      setApplications((current) => current.map((item) => item.id === application.id ? { ...item, status } : item))
      toast('Success', 'Application status updated')
    } catch (error) {
      toast('Unable to update application', error instanceof Error ? error.message : 'Please try again.', 'error')
    } finally {
      setUpdating(null)
    }
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentCount = applications.filter((application) => new Date(application.date).getTime() >= weekAgo).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Applications</h1>
        <p className="mt-1 text-sm text-muted">Review applications submitted for open job postings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4"><div className="flex items-center gap-3"><span className="rounded-card bg-brand-50 p-2 text-brand-700"><FileText className="h-5 w-5" /></span><div><p className="text-2xl font-bold text-ink">{applications.length}</p><p className="text-xs text-muted">Total Applications</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><span className="rounded-card bg-warning/10 p-2 text-warning"><Clock className="h-5 w-5" /></span><div><p className="text-2xl font-bold text-ink">{applications.filter((a) => a.status === 'pending').length}</p><p className="text-xs text-muted">Pending Review</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><span className="rounded-card bg-success/10 p-2 text-success"><CheckCircle className="h-5 w-5" /></span><div><p className="text-2xl font-bold text-ink">{applications.filter((a) => a.status === 'approved').length}</p><p className="text-xs text-muted">Approved</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><span className="rounded-card bg-brand-50 p-2 text-brand-700"><Users className="h-5 w-5" /></span><div><p className="text-2xl font-bold text-ink">{recentCount}</p><p className="text-xs text-muted">This Week</p></div></div></div>
      </div>

      {loadError && <div role="alert" className="flex items-center justify-between gap-4 rounded-card border border-danger/30 bg-danger/5 p-3 text-sm text-danger"><span>{loadError}</span><Button variant="outline" onClick={() => void load()}>Retry</Button></div>}

      <div className="card overflow-hidden">
        {loading ? <div className="p-8 text-center text-sm text-muted">Loading applications…</div> : applications.length === 0 ? (
          <EmptyState icon={<FileText className="h-6 w-6" />} title="No applications" message="Applications submitted for open jobs will appear here." />
        ) : (
          <div className="divide-y divide-line">
            {applications.map((application) => (
              <div key={application.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink">{application.name}</p>
                  <p className="text-sm text-muted">{application.email} · {application.position}</p>
                  <p className="mt-1 text-xs text-muted">{formatDate(application.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => void viewApplication(application)}><Eye className="h-4 w-4" /> Details</Button>
                  <Badge color={application.status === 'approved' ? 'success' : application.status === 'rejected' ? 'danger' : 'warning'}>{application.status}</Badge>
                  <select value={application.status} onChange={(event) => void updateStatus(application, event.target.value)} disabled={updating === application.id} className="input-base w-auto">
                    <option value="pending">Pending</option><option value="reviewing">Reviewing</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
                  </select>
                  {updating === application.id && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {viewing && <Modal open onClose={() => setViewing(null)} title={`Application: ${viewing.position}`}>
        <div className="space-y-4 text-sm"><div className="grid gap-3 sm:grid-cols-2"><p><span className="text-muted">Name</span><br /><strong>{viewing.name}</strong></p><p><span className="text-muted">Email</span><br /><a className="text-brand-700 underline" href={`mailto:${viewing.email}`}>{viewing.email}</a></p><p><span className="text-muted">Phone</span><br />{viewing.phone || '—'}</p><p><span className="text-muted">Location</span><br />{viewing.location || '—'}</p><p><span className="text-muted">Experience</span><br />{viewing.experience} years</p><p><span className="text-muted">Available from</span><br />{viewing.startDate || '—'}</p></div><div><p className="font-medium text-ink">Cover letter</p><p className="mt-1 whitespace-pre-wrap text-muted">{viewing.coverLetter || '—'}</p></div>{viewing.portfolioUrl && <p><a className="text-brand-700 underline" href={viewing.portfolioUrl} target="_blank" rel="noreferrer">Open portfolio</a></p>}{viewing.resumePath && (resumeLoading ? <p className="text-muted">Preparing resume…</p> : resumeUrl ? <p><a className="text-brand-700 underline" href={resumeUrl} target="_blank" rel="noreferrer">Open resume</a></p> : <p className="text-danger">Resume could not be opened. Retry by closing and reopening the application.</p>)}<p className="text-xs text-muted">Submitted {formatDate(viewing.date)}</p></div>
      </Modal>}
    </div>
  )
}
