import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, Award, ChevronLeft, ChevronRight, Linkedin, Loader2,
  Mail, PencilLine, Plus, Search, Trash2, Twitter, Users
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Avatar, Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { cn, formatDate } from '../lib/utils'
import { departmentsApi, teamApi } from '../lib/supabase'
import { uploadAdminImage } from '../lib/adminMedia'
import { ImageUploadField } from '../components/admin/ImageUploadField'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  title: string
  department: string
  bio?: string
  avatar?: string
  phone?: string
  linkedIn?: string
  twitter?: string
  specialties: string[]
  isActive: boolean
  joinedAt: string
}

export default function AdminMembers() {
  const { toast } = useApp()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [page, setPage] = useState(1)
  const perPage = 20
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [viewing, setViewing] = useState<TeamMember | null>(null)
  const [deleting, setDeleting] = useState<TeamMember | null>(null)
  const [mutating, setMutating] = useState(false)

  const roles = ['Instructor', 'Researcher', 'Administrator', 'Support Staff', 'Content Creator']
  const [departments, setDepartments] = useState<string[]>(['General'])
  const [loadError, setLoadError] = useState('')

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [memberRows, departmentRows] = await Promise.all([teamApi.list(), departmentsApi.list()])
      const mapped = (memberRows ?? []).map((row: any): TeamMember => ({
        id: row.id, name: row.name, email: row.email ?? '', role: row.role ?? 'Team Member',
        title: row.title ?? row.headline ?? '', department: row.department ?? 'General',
        bio: row.description ?? row.bio ?? undefined, avatar: row.avatar ?? row.photo_url ?? undefined,
        phone: row.phone ?? undefined, linkedIn: row.linkedin_url ?? undefined,
        twitter: row.twitter_url ?? undefined,
        specialties: row.specialties ?? row.skills ?? [], isActive: Boolean(row.is_active),
        joinedAt: row.created_at ?? new Date().toISOString()
      }))
      setMembers(mapped)
      const departmentNames = (departmentRows ?? []).map((row: any) => row.name).filter(Boolean)
      const availableDepartments = [...new Set([...departmentNames, ...mapped.map((member) => member.department).filter(Boolean)])]
      setDepartments(availableDepartments.length ? availableDepartments : ['General'])
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load team members.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadMembers() }, [loadMembers])

  const filteredMembers = useMemo(() => members.filter((member) => {
    const q = search.trim().toLowerCase()
    return (!q || `${member.name} ${member.email} ${member.title}`.toLowerCase().includes(q)) &&
      (departmentFilter === 'all' || member.department === departmentFilter) &&
      (roleFilter === 'all' || member.role === roleFilter) &&
      (statusFilter === 'all' || (statusFilter === 'active' ? member.isActive : !member.isActive))
  }), [members, search, departmentFilter, roleFilter, statusFilter])
  const total = filteredMembers.length
  const visibleMembers = filteredMembers.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  useEffect(() => { setPage(1) }, [search, departmentFilter, roleFilter, statusFilter])

  const handleDelete = async (member: TeamMember) => {
    setMutating(true)
    try {
      await teamApi.delete(member.id)
      setDeleting(null)
      toast('Success', `Team member "${member.name}" removed`)
      await loadMembers()
    } catch (error) {
      toast('Unable to remove team member', error instanceof Error ? error.message : 'Please try again.', 'error')
    } finally { setMutating(false) }
  }

  const toggleStatus = async (member: TeamMember) => {
    try {
      await teamApi.update(member.id, { is_active: !member.isActive })
      toast('Success', 'Member status updated')
      await loadMembers()
    } catch (error) {
      toast('Unable to update member', error instanceof Error ? error.message : 'Please try again.', 'error')
    }
  }

  const saveMember = async (data: any) => {
    setMutating(true)
    try {
      const payload = {
        name: data.name.trim(), email: data.email.trim(), role: data.role,
        title: data.title.trim(), headline: data.title.trim(), department: data.department,
        description: data.bio.trim(), phone: data.phone.trim(), is_active: data.isActive,
        linkedin_url: data.linkedIn?.trim() || null, twitter_url: data.twitter?.trim() || null,
        specialties: data.specialties ?? [], skills: data.specialties ?? [],
        ...(data.avatarFile ? { photo_url: await uploadAdminImage(data.avatarFile, 'team') } : {})
      }
      if (editing) await teamApi.update(editing.id, payload)
      else await teamApi.create(payload)
      toast('Success', `Team member ${editing ? 'updated' : 'added'} successfully`)
      setCreating(false)
      setEditing(null)
      await loadMembers()
    } catch (error) {
      toast('Unable to save team member', error instanceof Error ? error.message : 'Please check the details and try again.', 'error')
    } finally { setMutating(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Team Members</h1>
          <p className="mt-1 text-sm text-muted">Manage faculty and staff members</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </div>

      {loadError && <div role="alert" className="flex items-center justify-between gap-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"><span>{loadError}</span><Button variant="outline" onClick={() => void loadMembers()}>Retry</Button></div>}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{members.length}</p>
              <p className="text-xs text-muted">Total Members</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{members.filter(m => m.isActive).length}</p>
              <p className="text-xs text-muted">Active</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{members.filter(m => m.role === 'Instructor').length}</p>
              <p className="text-xs text-muted">Instructors</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{departments.length}</p>
              <p className="text-xs text-muted">Departments</p>
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
            placeholder="Search members..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="input-base"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-base"
        >
          <option value="all">All Roles</option>
          {roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
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

      {/* Members List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleMembers.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No team members found"
            message="Add your first team member to get started"
            action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add Member</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">Member</th>
                  <th className="hidden px-5 py-3 font-semibold md:table-cell">Role</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">Department</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">Specialties</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleMembers.map((member) => (
                  <tr key={member.id} className="group hover:bg-paper/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} src={member.avatar} size="md" />
                        <div>
                          <p className="font-medium text-ink">{member.name}</p>
                          <p className="text-xs text-muted">{member.title}</p>
                          <p className="flex items-center gap-1 text-xs text-muted">
                            <Mail className="h-3 w-3" /> {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">
                      <Badge color="brand">{member.role}</Badge>
                    </td>
                    <td className="hidden px-5 py-4 text-muted lg:table-cell">{member.department}</td>
                    <td className="hidden px-5 py-4 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.slice(0, 2).map((specialty, idx) => (
                          <Badge key={idx} color="line" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {member.specialties.length > 2 && (
                          <Badge color="line" className="text-xs">
                            +{member.specialties.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'flex items-center gap-1.5 text-xs font-medium',
                        member.isActive ? 'text-success' : 'text-danger'
                      )}>
                        <span className={cn(
                          'h-2 w-2 rounded-full',
                          member.isActive ? 'bg-success' : 'bg-danger'
                        )} />
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewing(member)}
                          className="rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                          title="View profile"
                        >
                          <Users className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditing(member)}
                          className="rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                          aria-label="Edit member"
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => void toggleStatus(member)}
                          className="rounded px-2 py-1 text-xs font-medium text-ink hover:bg-line/50"
                          title={member.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Award className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleting(member)}
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
            Showing {total === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} members
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

      {/* View Profile Modal */}
      {viewing && (
        <ViewMemberModal member={viewing} onClose={() => setViewing(null)} />
      )}

      {/* Create/Edit Modal */}
      {(creating || editing) && (
        <MemberFormModal
          title={editing ? 'Edit Team Member' : 'Add Team Member'}
          member={editing || undefined}
          departments={departments}
          roles={roles}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSubmit={saveMember}
        />
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Remove Team Member"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)} disabled={mutating}>
                Cancel
              </Button>
              <Button onClick={() => handleDelete(deleting)} disabled={mutating} className="text-danger">
                {mutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Remove
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted">
            Are you sure you want to remove "{deleting.name}" from the team? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}

function ViewMemberModal({ member, onClose }: {
  member: TeamMember
  onClose: () => void
}) {
  return (
    <Modal open onClose={onClose} title="Member Profile">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar name={member.name} src={member.avatar} size="lg" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-ink">{member.name}</h3>
            <p className="text-sm text-muted">{member.title}</p>
            <Badge color="brand" className="mt-2">{member.role}</Badge>
          </div>
        </div>

        {member.bio && (
          <div>
            <p className="text-sm font-medium text-ink">Bio</p>
            <p className="mt-1 text-sm text-muted">{member.bio}</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted">Department</p>
            <p className="mt-1 text-sm text-ink">{member.department}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Status</p>
            <Badge color={member.isActive ? 'success' : 'line'} className="mt-1">
              {member.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted">Contact</p>
          <div className="mt-2 space-y-2 text-sm text-ink">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted" />
              <a href={`mailto:${member.email}`} className="text-brand-700 hover:underline">
                {member.email}
              </a>
            </p>
            {member.phone && (
              <p className="flex items-center gap-2">
                <span className="text-muted">📞</span>
                {member.phone}
              </p>
            )}
          </div>
        </div>

        {(member.linkedIn || member.twitter) && (
          <div>
            <p className="text-xs font-medium text-muted">Social Links</p>
            <div className="mt-2 flex gap-2">
              {member.linkedIn && (
                <a
                  href={member.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-card bg-brand-50 p-2 text-brand-700 hover:bg-brand-100"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {member.twitter && (
                <a
                  href={`https://twitter.com/${member.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-card bg-brand-50 p-2 text-brand-700 hover:bg-brand-100"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        )}

        {member.specialties.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted">Specialties</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {member.specialties.map((specialty, idx) => (
                <Badge key={idx} color="brand">{specialty}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted">
          Joined {formatDate(member.joinedAt)}
        </div>

        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </Modal>
  )
}

function MemberFormModal({ title, member, departments, roles, onClose, onSubmit }: {
  title: string
  member?: TeamMember
  departments: string[]
  roles: string[]
  onClose: () => void
  onSubmit: (data: any) => void
}) {
  const [name, setName] = useState(member?.name || '')
  const [email, setEmail] = useState(member?.email || '')
  const [role, setRole] = useState(member?.role || roles[0])
  const [jobTitle, setJobTitle] = useState(member?.title || '')
  const [department, setDepartment] = useState(member?.department || departments[0])
  const [bio, setBio] = useState(member?.bio || '')
  const [phone, setPhone] = useState(member?.phone || '')
  const [linkedIn, setLinkedIn] = useState(member?.linkedIn || '')
  const [twitter, setTwitter] = useState(member?.twitter || '')
  const [specialties, setSpecialties] = useState(member?.specialties.join(', ') || '')
  const [isActive, setIsActive] = useState(member?.isActive ?? true)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const valid = name.trim().length > 0 && email.trim().length > 0 && jobTitle.trim().length > 0

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ name, email, role, title: jobTitle, department, bio, phone, linkedIn, twitter, specialties: specialties.split(',').map((item) => item.trim()).filter(Boolean), isActive, avatarFile })} disabled={!valid}>
            {member ? 'Save Changes' : <><Plus className="h-4 w-4" /> Add Member</>}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ImageUploadField label="Profile photo" value={member?.avatar} onChange={setAvatarFile} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Jane Smith"
              className="input-base"
              autoFocus
            />
          </div>
          <div>
            <label className="label-base">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane.smith@anatomia.edu"
              className="input-base"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">Job Title</label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Professor of Anatomy"
              className="input-base"
            />
          </div>
          <div>
            <label className="label-base">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="input-base"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input-base">
              {roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-base">Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input-base">
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label-base">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Brief professional biography"
            className="input-base"
            rows={3}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label-base">LinkedIn URL</label><input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} className="input-base" placeholder="https://linkedin.com/in/..." /></div>
          <div><label className="label-base">Twitter URL</label><input value={twitter} onChange={(e) => setTwitter(e.target.value)} className="input-base" placeholder="https://x.com/..." /></div>
        </div>
        <div><label className="label-base">Specialties</label><input value={specialties} onChange={(e) => setSpecialties(e.target.value)} className="input-base" placeholder="Anatomy, Education" /></div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-brand-500"
          />
          Active member
        </label>
      </div>
    </Modal>
  )
}
