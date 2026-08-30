import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle, Award, BookOpen, CheckCircle2, ChevronRight, Eye, Globe,
  Loader2, Mail, MoreVertical, PencilLine, Plus, Search, ShieldAlert,
  ShieldCheck, Star, UserCheck, UserPlus, Users, X
} from 'lucide-react'
import { adminApi } from '../lib/api/auth'
import type { AdminInstructor } from '../lib/api/auth'
import { getStoredToken } from '../lib/api/auth'
import { useApp } from '../lib/store'
import { Avatar, Badge, Button, EmptyState, Input, Modal, StatCard } from '../components/ui'
import { cn, formatDate } from '../lib/utils'

export default function AdminInstructors() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [instructors, setInstructors] = useState<AdminInstructor[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminInstructor | null>(null)
  const [viewing, setViewing] = useState<AdminInstructor | null>(null)
  const [confirming, setConfirming] = useState<{ instructor: AdminInstructor; mode: 'toggle' | 'remove' } | null>(null)
  const [mutating, setMutating] = useState(false)

  // Form states
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formHeadline, setFormHeadline] = useState('')
  const [formBio, setFormBio] = useState('')
  const [formSkills, setFormSkills] = useState('')

  const searchTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => setDebouncedSearch(search), 350)
    return () => window.clearTimeout(searchTimer.current)
  }, [search])

  const loadInstructors = useCallback(async () => {
    const token = getStoredToken()
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.listInstructorsDetailed(token, {
        search: debouncedSearch,
        status: statusFilter
      })
      setInstructors(res.instructors)
      setTotal(res.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('adminInstructors.loadFailed', 'Failed to load instructors.'))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, t])

  useEffect(() => {
    loadInstructors()
  }, [loadInstructors])

  const activeCount = useMemo(() => instructors.filter((i) => i.isActive).length, [instructors])
  const totalCourses = useMemo(() => instructors.reduce((acc, i) => acc + i.courseCount, 0), [instructors])
  const totalStudents = useMemo(() => instructors.reduce((acc, i) => acc + i.studentCount, 0), [instructors])

  const openCreateModal = () => {
    setFormName('')
    setFormEmail('')
    setFormPassword('Password123!')
    setFormTitle('')
    setFormHeadline('')
    setFormBio('')
    setFormSkills('')
    setCreating(true)
  }

  const openEditModal = (inst: AdminInstructor) => {
    setEditing(inst)
    setFormName(inst.name)
    setFormEmail(inst.email)
    setFormTitle(inst.title)
    setFormHeadline(inst.headline)
    setFormBio(inst.bio)
    setFormSkills(inst.skills.join(', '))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formEmail.trim()) return
    const token = getStoredToken()
    if (!token) return
    setMutating(true)
    try {
      await adminApi.createInstructor(token, {
        name: formName,
        email: formEmail,
        password: formPassword || 'Password123!',
        title: formTitle,
        headline: formHeadline,
        bio: formBio,
        skills: formSkills.split(',').map((s) => s.trim()).filter(Boolean)
      })
      toast(t('adminInstructors.createdTitle', 'Instructor Added'), t('adminInstructors.createdDesc', 'New instructor profile created successfully.'))
      setCreating(false)
      loadInstructors()
    } catch (err) {
      toast(t('adminInstructors.errorTitle', 'Error'), err instanceof Error ? err.message : 'Operation failed', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !formName.trim()) return
    const token = getStoredToken()
    if (!token) return
    setMutating(true)
    try {
      await adminApi.updateInstructor(token, editing.id, {
        name: formName,
        title: formTitle,
        headline: formHeadline,
        bio: formBio,
        skills: formSkills.split(',').map((s) => s.trim()).filter(Boolean)
      })
      toast(t('adminInstructors.updatedTitle', 'Instructor Updated'), t('adminInstructors.updatedDesc', 'Profile details updated successfully.'))
      setEditing(null)
      loadInstructors()
    } catch (err) {
      toast(t('adminInstructors.errorTitle', 'Error'), err instanceof Error ? err.message : 'Operation failed', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleToggleStatus = async (inst: AdminInstructor) => {
    const token = getStoredToken()
    if (!token) return
    setMutating(true)
    try {
      await adminApi.updateInstructor(token, inst.id, { isActive: !inst.isActive })
      toast(
        inst.isActive ? t('adminInstructors.suspendedTitle', 'Instructor Suspended') : t('adminInstructors.activatedTitle', 'Instructor Activated'),
        inst.name
      )
      setConfirming(null)
      loadInstructors()
    } catch (err) {
      toast(t('adminInstructors.errorTitle', 'Error'), err instanceof Error ? err.message : 'Operation failed', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleRemove = async (inst: AdminInstructor) => {
    const token = getStoredToken()
    if (!token) return
    setMutating(true)
    try {
      await adminApi.deleteInstructor(token, inst.id)
      toast(t('adminInstructors.removedTitle', 'Instructor Privileges Removed'), inst.name)
      setConfirming(null)
      loadInstructors()
    } catch (err) {
      toast(t('adminInstructors.errorTitle', 'Error'), err instanceof Error ? err.message : 'Operation failed', 'error')
    } finally {
      setMutating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('adminInstructors.title', 'Instructors Management')}</h1>
          <p className="mt-1 text-sm text-muted">{t('adminInstructors.subtitle', 'Manage faculty members, active instructor status, and course assignments.')}</p>
        </div>
        <Button onClick={openCreateModal}>
          <UserPlus className="h-4 w-4" /> {t('adminInstructors.addInstructor', 'Add Instructor')}
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('adminInstructors.totalInstructors', 'Total Instructors')}
          value={total.toLocaleString()}
          sub={t('adminInstructors.totalSub', 'Registered faculty')}
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          label={t('adminInstructors.activeInstructors', 'Active Instructors')}
          value={activeCount.toLocaleString()}
          sub={t('adminInstructors.activeSub', 'Currently active')}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label={t('adminInstructors.totalCourses', 'Instructor Courses')}
          value={totalCourses.toLocaleString()}
          sub={t('adminInstructors.coursesSub', 'Total published & active')}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          label={t('adminInstructors.totalStudents', 'Learners Taught')}
          value={totalStudents.toLocaleString()}
          sub={t('adminInstructors.studentsSub', 'Enrolled students')}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('adminInstructors.searchPlaceholder', 'Search by name, email, or expertise…')}
            className="input-base pl-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">{t('adminInstructors.statusFilter', 'Status:')}</span>
          <div className="flex rounded-control border border-line bg-paper p-0.5 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn('rounded-control px-3 py-1 transition-colors', statusFilter === 'all' ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-muted hover:text-ink')}
            >
              {t('adminInstructors.filterAll', 'All')}
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={cn('rounded-control px-3 py-1 transition-colors', statusFilter === 'active' ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-muted hover:text-ink')}
            >
              {t('adminInstructors.filterActive', 'Active')}
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={cn('rounded-control px-3 py-1 transition-colors', statusFilter === 'suspended' ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-muted hover:text-ink')}
            >
              {t('adminInstructors.filterSuspended', 'Suspended')}
            </button>
          </div>
        </div>
      </div>

      {/* Instructors Data Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-danger">
            <AlertCircle className="mx-auto h-8 w-8 opacity-80" />
            <p className="mt-2 font-semibold">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadInstructors}>{t('adminInstructors.retry', 'Retry')}</Button>
          </div>
        ) : instructors.length === 0 ? (
          <EmptyState
            icon={<UserCheck className="h-8 w-8" />}
            title={t('adminInstructors.emptyTitle', 'No instructors found')}
            message={t('adminInstructors.emptyMessage', 'Try adjusting your search query or status filter.')}
            action={<Button onClick={openCreateModal}>{t('adminInstructors.addInstructor', 'Add Instructor')}</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">{t('adminInstructors.colInstructor', 'Instructor')}</th>
                  <th className="px-5 py-3 font-semibold">{t('adminInstructors.colExpertise', 'Title / Specialty')}</th>
                  <th className="px-5 py-3 font-semibold">{t('adminInstructors.colCourses', 'Courses')}</th>
                  <th className="px-5 py-3 font-semibold">{t('adminInstructors.colStudents', 'Students')}</th>
                  <th className="px-5 py-3 font-semibold">{t('adminInstructors.colRating', 'Rating')}</th>
                  <th className="px-5 py-3 font-semibold">{t('adminInstructors.colStatus', 'Status')}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t('adminInstructors.colActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {instructors.map((inst) => (
                  <tr key={inst.id} className="hover:bg-paper/60">
                    {/* Instructor Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={inst.name} src={inst.avatar} size="sm" />
                        <div>
                          <p className="font-semibold text-ink">{inst.name}</p>
                          <p className="text-xs text-muted">{inst.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Specialty */}
                    <td className="px-5 py-3.5 text-muted">
                      <p className="font-medium text-ink">{inst.title || t('adminInstructors.noTitle', 'Instructor')}</p>
                      {inst.headline && <p className="text-xs text-muted truncate max-w-[200px]">{inst.headline}</p>}
                    </td>

                    {/* Course Count */}
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {inst.courseCount} {t('adminInstructors.coursesUnit', 'courses')}
                    </td>

                    {/* Student Count */}
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {inst.studentCount.toLocaleString()}
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-ink font-semibold">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        <span>{inst.rating > 0 ? inst.rating : '—'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <Badge color={inst.isActive ? 'success' : 'danger'}>
                        {inst.isActive ? t('adminInstructors.active', 'Active') : t('adminInstructors.suspended', 'Suspended')}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewing(inst)}
                          title={t('adminInstructors.viewDetails', 'View Details')}
                          className="rounded-control p-1.5 text-muted hover:bg-line hover:text-ink"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(inst)}
                          title={t('adminInstructors.editProfile', 'Edit Profile')}
                          className="rounded-control p-1.5 text-muted hover:bg-line hover:text-ink"
                        >
                          <PencilLine className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirming({ instructor: inst, mode: 'toggle' })}
                          title={inst.isActive ? t('adminInstructors.suspend', 'Suspend') : t('adminInstructors.activate', 'Activate')}
                          className={cn('rounded-control p-1.5 transition-colors', inst.isActive ? 'text-muted hover:bg-danger/10 hover:text-danger' : 'text-success hover:bg-success/10')}
                        >
                          {inst.isActive ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
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

      {/* CREATE / EDIT MODAL */}
      {(creating || editing) && (
        <Modal
          isOpen={true}
          onClose={() => { setCreating(false); setEditing(null) }}
          title={creating ? t('adminInstructors.modalAddTitle', 'Add New Instructor') : t('adminInstructors.modalEditTitle', 'Edit Instructor Profile')}
        >
          <form onSubmit={creating ? handleCreate : handleUpdate} className="space-y-4 pt-2">
            <Input
              label={t('adminInstructors.labelName', 'Full Name')}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Dr. Aminu Garba"
              required
            />
            <Input
              label={t('adminInstructors.labelEmail', 'Email Address')}
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="e.g. aminu@hamaacademy.com"
              disabled={!!editing}
              required
            />
            {creating && (
              <Input
                label={t('adminInstructors.labelPassword', 'Default Password')}
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Password123!"
              />
            )}
            <Input
              label={t('adminInstructors.labelTitle', 'Professional Title')}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer & Lecturer"
            />
            <Input
              label={t('adminInstructors.labelHeadline', 'Short Headline')}
              value={formHeadline}
              onChange={(e) => setFormHeadline(e.target.value)}
              placeholder="e.g. Expert in Web Security & Hausa Media Analysis"
            />
            <div>
              <label className="label-base">{t('adminInstructors.labelSkills', 'Specialties / Skills (comma separated)')}</label>
              <input
                type="text"
                value={formSkills}
                onChange={(e) => setFormSkills(e.target.value)}
                placeholder="Cybersecurity, Hausa Journalism, Python"
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">{t('adminInstructors.labelBio', 'Biography')}</label>
              <textarea
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                rows={3}
                className="input-base"
                placeholder="Brief professional biography..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { setCreating(false); setEditing(null) }}>
                {t('adminInstructors.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={mutating || !formName.trim()}>
                {mutating ? <Loader2 className="h-4 w-4 animate-spin" /> : creating ? t('adminInstructors.createBtn', 'Add Instructor') : t('adminInstructors.saveBtn', 'Save Changes')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewing && (
        <Modal
          isOpen={true}
          onClose={() => setViewing(null)}
          title={t('adminInstructors.viewTitle', 'Instructor Profile Details')}
        >
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-4 border-b border-line pb-4">
              <Avatar name={viewing.name} src={viewing.avatar} size="lg" />
              <div>
                <h3 className="font-display text-lg font-bold text-ink">{viewing.name}</h3>
                <p className="text-sm text-muted">{viewing.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge color={viewing.isActive ? 'success' : 'danger'}>
                    {viewing.isActive ? t('adminInstructors.active', 'Active') : t('adminInstructors.suspended', 'Suspended')}
                  </Badge>
                  <span className="text-xs text-muted">Joined {formatDate(viewing.joinedAt)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-card bg-paper p-3">
                <p className="text-xs text-muted">{t('adminInstructors.publishedCourses', 'Courses')}</p>
                <p className="mt-1 text-lg font-bold text-ink">{viewing.courseCount}</p>
              </div>
              <div className="rounded-card bg-paper p-3">
                <p className="text-xs text-muted">{t('adminInstructors.totalStudents', 'Students')}</p>
                <p className="mt-1 text-lg font-bold text-ink">{viewing.studentCount.toLocaleString()}</p>
              </div>
              <div className="rounded-card bg-paper p-3">
                <p className="text-xs text-muted">{t('adminInstructors.rating', 'Rating')}</p>
                <p className="mt-1 text-lg font-bold text-ink">{viewing.rating > 0 ? `${viewing.rating}★` : '—'}</p>
              </div>
            </div>

            {viewing.title && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase">{t('adminInstructors.colExpertise', 'Title / Specialty')}</p>
                <p className="mt-1 text-sm font-medium text-ink">{viewing.title}</p>
                {viewing.headline && <p className="text-xs text-muted">{viewing.headline}</p>}
              </div>
            )}

            {viewing.skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase mb-1.5">{t('adminInstructors.skills', 'Specialties')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {viewing.skills.map((skill) => (
                    <Badge key={skill} color="brand">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {viewing.bio && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase">{t('adminInstructors.bio', 'Bio')}</p>
                <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{viewing.bio}</p>
              </div>
            )}

            {viewing.courses && viewing.courses.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted uppercase mb-2">{t('adminInstructors.coursesList', 'Courses Taught')}</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {viewing.courses.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-card border border-line bg-paper px-3 py-2 text-xs">
                      <span className="font-medium text-ink truncate max-w-[220px]">{c.title}</span>
                      <span className="text-muted">{c.studentCount} students · {c.rating}★</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setViewing(null)}>
                {t('adminInstructors.close', 'Close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION MODAL */}
      {confirming && (
        <Modal
          isOpen={true}
          onClose={() => setConfirming(null)}
          title={confirming.mode === 'toggle'
            ? confirming.instructor.isActive ? t('adminInstructors.suspendConfirmTitle', 'Suspend Instructor?') : t('adminInstructors.activateConfirmTitle', 'Activate Instructor?')
            : t('adminInstructors.removeConfirmTitle', 'Remove Instructor Privileges?')}
        >
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted">
              {confirming.mode === 'toggle'
                ? confirming.instructor.isActive
                  ? t('adminInstructors.suspendConfirmMsg', 'Are you sure you want to suspend this instructor account? They will lose access to course management until reactivated.')
                  : t('adminInstructors.activateConfirmMsg', 'Are you sure you want to reactivate this instructor account?')
                : t('adminInstructors.removeConfirmMsg', 'Are you sure you want to remove instructor privileges for this user?')}
            </p>
            <div className="rounded-card bg-paper p-3 text-sm">
              <p className="font-semibold text-ink">{confirming.instructor.name}</p>
              <p className="text-xs text-muted">{confirming.instructor.email}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setConfirming(null)}>
                {t('adminInstructors.cancel', 'Cancel')}
              </Button>
              <Button
                variant={confirming.mode === 'toggle' && confirming.instructor.isActive ? 'danger' : 'primary'}
                onClick={() => confirming.mode === 'toggle' ? handleToggleStatus(confirming.instructor) : handleRemove(confirming.instructor)}
                disabled={mutating}
              >
                {mutating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('adminInstructors.confirm', 'Confirm')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
