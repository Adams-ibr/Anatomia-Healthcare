import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2, ChevronLeft, ChevronRight, Loader2,
  PencilLine, Plus, Search, Trash2, Users
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { departmentsApi } from '../lib/supabase'

interface Department {
  id: string
  name: string
  code: string
  description: string
  headId?: string
  headName?: string
  memberCount: number
  courseCount: number
  color?: string
  isActive: boolean
  createdAt: string
}

export default function AdminDepartments() {
  const { toast } = useApp()
  const [departments, setDepartments] = useState<Department[]>([])
  const [page, setPage] = useState(1)
  const perPage = 20
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [deleting, setDeleting] = useState<Department | null>(null)
  const [mutating, setMutating] = useState(false)
  const [loadError, setLoadError] = useState('')

  const loadDepartments = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const rows = await departmentsApi.list()
      setDepartments((rows ?? []).map((row: any) => ({
        id: row.id, name: row.name, code: row.code ?? '', description: row.description ?? '',
        headId: row.head_id ?? undefined, headName: row.head_name ?? undefined,
        memberCount: Number(row.member_count) || 0, courseCount: Number(row.course_count) || 0,
        color: row.color ?? undefined, isActive: Boolean(row.is_active), createdAt: row.created_at
      })))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load departments.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadDepartments() }, [loadDepartments])

  const filteredDepartments = useMemo(() => departments.filter((department) => {
    const q = search.trim().toLowerCase()
    return (!q || `${department.name} ${department.code} ${department.description}`.toLowerCase().includes(q)) &&
      (statusFilter === 'all' || (statusFilter === 'active' ? department.isActive : !department.isActive))
  }), [departments, search, statusFilter])
  const total = filteredDepartments.length
  const visibleDepartments = filteredDepartments.slice((page - 1) * perPage, page * perPage)
  useEffect(() => { setPage(1) }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const handleDelete = async (department: Department) => {
    setMutating(true)
    try {
      await departmentsApi.delete(department.id)
      setDeleting(null)
      toast('Success', `Department "${department.name}" deleted`)
      await loadDepartments()
    } catch (error) {
      toast('Unable to delete department', error instanceof Error ? error.message : 'Please try again.', 'error')
    } finally { setMutating(false) }
  }

  const toggleStatus = async (department: Department) => {
    try {
      await departmentsApi.update(department.id, { is_active: !department.isActive })
      toast('Success', 'Department status updated')
      await loadDepartments()
    } catch (error) {
      toast('Unable to update department', error instanceof Error ? error.message : 'Please try again.', 'error')
    }
  }

  const saveDepartment = async (data: any, department?: Department) => {
    setMutating(true)
    try {
      const payload = { name: data.name.trim(), code: data.code.trim().toUpperCase(), description: data.description.trim(), color: data.color, is_active: data.isActive }
      if (department) await departmentsApi.update(department.id, payload)
      else await departmentsApi.create(payload)
      toast('Success', `Department ${department ? 'updated' : 'created'} successfully`)
      setCreating(false)
      setEditing(null)
      await loadDepartments()
    } catch (error) {
      toast('Unable to save department', error instanceof Error ? error.message : 'Please check the details and try again.', 'error')
    } finally { setMutating(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Department Management</h1>
          <p className="mt-1 text-sm text-muted">Manage academic departments and their structure</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New Department
        </Button>
      </div>

      {loadError && <div role="alert" className="flex items-center justify-between gap-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"><span>{loadError}</span><Button variant="outline" onClick={() => void loadDepartments()}>Retry</Button></div>}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{departments.length}</p>
              <p className="text-xs text-muted">Total Departments</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{departments.filter(d => d.isActive).length}</p>
              <p className="text-xs text-muted">Active</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{departments.reduce((sum, d) => sum + d.memberCount, 0)}</p>
              <p className="text-xs text-muted">Total Members</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{departments.reduce((sum, d) => sum + d.courseCount, 0)}</p>
              <p className="text-xs text-muted">Total Courses</p>
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
            placeholder="Search departments..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="input-base"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Departments Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
              <Skeleton className="mt-3 h-3 w-full" />
            </div>
          ))
        ) : visibleDepartments.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={<Building2 className="h-6 w-6" />}
              title="No departments found"
              message="Create your first department to get started"
              action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New Department</Button>}
            />
          </div>
        ) : (
          visibleDepartments.map((dept) => (
            <div
              key={dept.id}
              className="card group relative overflow-hidden p-5 transition-all hover:border-brand-200"
            >
              {/* Color indicator */}
              {dept.color && (
                <div
                  className="absolute left-0 top-0 h-full w-1"
                  style={{ backgroundColor: dept.color }}
                />
              )}

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink">{dept.name}</h3>
                    {!dept.isActive && <Badge color="line">Inactive</Badge>}
                  </div>
                  <p className="mt-1 text-xs font-medium text-brand-700">{dept.code}</p>
                  <p className="mt-2 text-sm text-muted line-clamp-2">{dept.description}</p>
                </div>
              </div>

              {dept.headName && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                  <Users className="h-4 w-4" />
                  <span>Head: {dept.headName}</span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                <span>{dept.memberCount} members</span>
                <span>•</span>
                <span>{dept.courseCount} courses</span>
              </div>

              <div className="mt-4 flex items-center gap-1 border-t border-line pt-4 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setEditing(dept)}
                  className="flex-1 rounded-card py-2 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  <PencilLine className="mx-auto h-4 w-4" />
                </button>
                <button
                  onClick={() => void toggleStatus(dept)}
                  className="flex-1 rounded-card py-2 text-xs font-medium text-ink hover:bg-line/40"
                  title={dept.isActive ? 'Deactivate' : 'Activate'}
                >
                  <Building2 className="mx-auto h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleting(dept)}
                  className="flex-1 rounded-card py-2 text-xs font-medium text-danger hover:bg-danger/10"
                >
                  <Trash2 className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted">
            Showing {total === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} departments
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
        <DepartmentFormModal
          title="Create Department"
          onClose={() => setCreating(false)}
          onSubmit={(data) => void saveDepartment(data)}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <DepartmentFormModal
          title="Edit Department"
          department={editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => void saveDepartment(data, editing)}
        />
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Delete Department"
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
            Are you sure you want to delete "{deleting.name}"? This will affect {deleting.memberCount} members and {deleting.courseCount} courses.
          </p>
        </Modal>
      )}
    </div>
  )
}

function DepartmentFormModal({ title, department, onClose, onSubmit }: {
  title: string
  department?: Department
  onClose: () => void
  onSubmit: (data: any) => void
}) {
  const [name, setName] = useState(department?.name || '')
  const [code, setCode] = useState(department?.code || '')
  const [description, setDescription] = useState(department?.description || '')
  const [color, setColor] = useState(department?.color || '#3B82F6')
  const [isActive, setIsActive] = useState(department?.isActive ?? true)

  const valid = name.trim().length > 0 && code.trim().length > 0

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ name, code, description, color, isActive })} disabled={!valid}>
            {department ? 'Save Changes' : <><Plus className="h-4 w-4" /> Create</>}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-base">Department Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Human Anatomy"
            className="input-base"
            autoFocus
          />
        </div>
        <div>
          <label className="label-base">Department Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g., ANAT"
            className="input-base"
            maxLength={10}
          />
        </div>
        <div>
          <label className="label-base">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the department"
            className="input-base"
            rows={3}
          />
        </div>
        <div>
          <label className="label-base">Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-20 cursor-pointer rounded-card border border-line"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#3B82F6"
              className="input-base flex-1"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-brand-500"
          />
          Active department
        </label>
      </div>
    </Modal>
  )
}
