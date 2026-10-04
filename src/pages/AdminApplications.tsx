import { useEffect, useState } from 'react'
import { FileText, Users, CheckCircle, Clock } from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState } from '../components/ui'

export default function AdminApplications() {
  const { toast } = useApp()
  const [applications, setApplications] = useState([
    { id: '1', name: 'John Doe', position: 'Instructor', status: 'pending', date: '2024-01-15' },
    { id: '2', name: 'Jane Smith', position: 'Researcher', status: 'approved', date: '2024-01-10' }
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Applications</h1>
          <p className="mt-1 text-sm text-muted">Manage job and course applications</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{applications.length}</p>
              <p className="text-xs text-muted">Total Applications</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-warning/10 p-2 text-warning">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{applications.filter(a => a.status === 'pending').length}</p>
              <p className="text-xs text-muted">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{applications.filter(a => a.status === 'approved').length}</p>
              <p className="text-xs text-muted">Approved</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">5</p>
              <p className="text-xs text-muted">This Week</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {applications.length === 0 ? (
          <EmptyState icon={<FileText className="h-6 w-6" />} title="No applications" message="Applications will appear here" />
        ) : (
          <div className="divide-y divide-line">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-5 hover:bg-paper/60">
                <div>
                  <p className="font-medium text-ink">{app.name}</p>
                  <p className="text-sm text-muted">{app.position}</p>
                </div>
                <Badge color={app.status === 'approved' ? 'success' : 'warning'}>{app.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
