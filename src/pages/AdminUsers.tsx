import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Mail, MoreVertical,
  PencilLine, Plus, Search, ShieldAlert, ShieldCheck, Trash2, UserPlus, Users, X
} from 'lucide-react'
import { adminApi, type AdminRole, type AdminUser, type AdminUserListResult } from '../lib/api/auth'
import { getStoredToken } from '../lib/api/auth'
import { useApp } from '../lib/store'
import { Avatar, Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { cn, formatDate, timeAgo } from '../lib/utils'

const ROLES: AdminRole[] = ['student', 'instructor', 'admin', 'support']

const ROLE_BADGE: Record<AdminRole, 'brand' | 'success' | 'danger' | 'warning'> = {
  student: 'success',
  instructor: 'brand',
  admin: 'danger',
  support: 'warning'
}

export default function AdminUsers() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 25
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | AdminRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [confirming, setConfirming] = useState<{ user: AdminUser; mode: 'suspend' | 'activate' | 'delete' } | null>(null)
  const [mutating, setMutating] = useState(false)

  const searchTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => setDebouncedSearch(search), 350)
    return () => window.clearTimeout(searchTimer.current)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, roleFilter, statusFilter])

  const loadUsers = useCallback(async (p: number) => {
    const token = getStoredToken()
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.listUsers(token, {
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        page: p,
        perPage
      })
      setUsers(res.users)
      setTotal(res.total)
      setPage(res.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, roleFilter, statusFilter, t])

  useEffect(() => {
    loadUsers(page)
  }, [loadUsers])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const refetch = useCallback(() => loadUsers(page), [loadUsers, page])

  const runMutation = useCallback(async (fn: () => Promise<unknown>, successTitle: string, successBody?: string) => {
    setMutating(true)
    try {
      await fn()
      toast(successTitle, successBody)
      refetch()
      return true
    } catch (err) {
      toast(t('admin.errorTitle'), err instanceof Error ? err.message : t('admin.errorGeneric'), 'error')
      return false
    } finally {
      setMutating(false)
    }
  }, [refetch, t, toast])

  const stats = useMemo(() => ({
    total,
    active: users.filter((u) => u.isActive).length,
    suspended: users.filter((u) => !u.isActive).length
  }), [total, users])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('admin.userManagement')}</h1>
          <p className="mt-1 text-sm text-muted">{t('admin.userManagementDesc')}</p>
        </div>
        <Button onClick={() => setCreating(true)}><UserPlus className="h-4 w-4" /> {t('admin.newUser')}</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <span className="rounded-full bg-brand-50 p-2.5 text-brand-700"><Users className="h-4 w-4" /></span>
          <div><p className="text-lg font-bold text-ink">{total}</p><p className="text-xs text-muted">{t('admin.statTotal')}</p></div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="rounded-full bg-success/10 p-2.5 text-success"><CheckCircle2 className="h-4 w-4" /></span>
          <div><p className="text-lg font-bold text-ink">{stats.active}</p><p className="text-xs text-muted">{t('admin.statActive')}</p></div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="rounded-full bg-danger/10 p-2.5 text-danger"><ShieldAlert className="h-4 w-4" /></span>
          <div><p className="text-lg font-bold text-ink">{stats.suspended}</p><p className="text-xs text-muted">{t('admin.statSuspended')}</p></div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.searchNameEmail')}
            className="input-base pl-9"
          />
        </div>
        <div className="flex gap-3">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'all' | AdminRole)} className="input-base">
            <option value="all">{t('admin.allRoles')}</option>
            <option value="student">{t('admin.studentsLabel')}</option>
            <option value="instructor">{t('admin.instructorsLabel')}</option>
            <option value="admin">{t('admin.adminsLabel')}</option>
            <option value="support">{t('admin.supportLabel')}</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')} className="input-base">
            <option value="all">{t('admin.allStatuses')}</option>
            <option value="active">{t('admin.active')}</option>
            <option value="suspended">{t('admin.suspended')}</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" onClick={() => refetch()}><Loader2 className="h-3.5 w-3.5" /> {t('admin.retry')}</Button>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2"><Skeleton className="h-3 w-40" /><Skeleton className="h-2.5 w-56" /></div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={t('admin.noUsersTitle')}
            message={t('admin.noUsersMessage')}
            action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> {t('admin.newUser')}</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">{t('admin.user')}</th>
                  <th className="px-5 py-3 font-semibold">{t('admin.role')}</th>
                  <th className="px-5 py-3 font-semibold">{t('admin.status')}</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">{t('admin.joined')}</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">{t('admin.lastSeen')}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id} className="group hover:bg-paper/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} src={u.avatar} size="sm" />
                        <div>
                          <p className="font-medium text-ink">{u.name}</p>
                          <p className="flex items-center gap-1 text-xs text-muted"><Mail className="h-3 w-3" /> {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><Badge color={ROLE_BADGE[u.role]}>{t(`admin.role_${u.role}`)}</Badge></td>
                    <td className="px-5 py-3">
                      <span className={cn('flex items-center gap-1.5 text-xs font-medium', u.isActive ? 'text-success' : 'text-danger')}>
                        <span className={cn('h-2 w-2 rounded-full', u.isActive ? 'bg-success' : 'bg-danger')} />
                        {u.isActive ? t('admin.active') : t('admin.suspended')}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3 text-muted lg:table-cell">{formatDate(u.joinedAt)}</td>
                    <td className="hidden px-5 py-3 text-muted lg:table-cell">{u.lastSignInAt ? timeAgo(u.lastSignInAt) : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                        <button
                          onClick={() => setEditing(u)}
                          className="rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                          aria-label={t('admin.editUser')}
                        ><PencilLine className="h-3.5 w-3.5" /></button>
                        {u.isActive ? (
                          <button
                            onClick={() => setConfirming({ user: u, mode: 'suspend' })}
                            className="rounded px-2 py-1 text-xs font-medium text-warning hover:bg-warning/10"
                            aria-label={t('admin.suspend')}
                          ><ShieldAlert className="h-3.5 w-3.5" /></button>
                        ) : (
                          <button
                            onClick={() => setConfirming({ user: u, mode: 'activate' })}
                            className="rounded px-2 py-1 text-xs font-medium text-success hover:bg-success/10"
                            aria-label={t('admin.activate')}
                          ><ShieldCheck className="h-3.5 w-3.5" /></button>
                        )}
                        <button
                          onClick={() => setConfirming({ user: u, mode: 'delete' })}
                          className="rounded px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10"
                          aria-label={t('admin.delete')}
                        ><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-xs text-muted">{t('admin.showing', { from: total === 0 ? 0 : (page - 1) * perPage + 1, to: Math.min(page * perPage, total), total })}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1 || loading} onClick={() => loadUsers(page - 1)}>
            <ChevronLeft className="h-4 w-4" /> {t('admin.prev')}
          </Button>
          <span className="text-xs text-muted">{page} / {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages || loading} onClick={() => loadUsers(page + 1)}>
            {t('admin.next')} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CreateUserModal
        open={creating}
        onClose={() => setCreating(false)}
        busy={mutating}
        onCreate={(input) => runMutation(
          async () => { const token = getStoredToken(); if (token) await adminApi.createUser(token, input) },
          t('admin.userCreated'),
          input.name
        ).then((ok) => { if (ok) setCreating(false) })}
      />

      {editing && (
        <EditUserModal
          user={editing}
          busy={mutating}
          onClose={() => setEditing(null)}
          onSave={(patch) => runMutation(
            async () => { const token = getStoredToken(); if (token) await adminApi.updateUser(token, editing.id, patch) },
            t('admin.userUpdated'),
            editing.name
          ).then((ok) => { if (ok) setEditing(null) })}
        />
      )}

      {confirming && (
        <ConfirmModal
          user={confirming.user}
          mode={confirming.mode}
          busy={mutating}
          onClose={() => setConfirming(null)}
          onConfirm={() => {
            const token = getStoredToken()
            if (!token) return
            const { user, mode } = confirming
            const fn = mode === 'delete'
              ? () => adminApi.deleteUser(token, user.id)
              : () => adminApi.updateUser(token, user.id, { is_active: mode === 'activate' })
            runMutation(
              fn,
              mode === 'delete' ? t('admin.userDeleted') : mode === 'activate' ? t('admin.userActivated') : t('admin.userSuspended'),
              user.name
            ).then((ok) => { if (ok) setConfirming(null) })
          }}
        />
      )}
    </div>
  )
}

function CreateUserModal({ open, onClose, busy, onCreate }: {
  open: boolean
  onClose: () => void
  busy: boolean
  onCreate: (input: { name: string; email: string; password: string; role: AdminRole }) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AdminRole>('student')

  const reset = () => { setName(''); setEmail(''); setPassword(''); setRole('student') }
  const valid = name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 8

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('admin.createUser')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('admin.cancel')}</Button>
          <Button onClick={() => { onCreate({ name: name.trim(), email: email.trim(), password, role }); reset() }} disabled={!valid || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} {t('admin.create')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-base">{t('admin.fullName')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('admin.fullNamePlaceholder')} className="input-base" autoFocus />
        </div>
        <div>
          <label className="label-base">{t('admin.email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="input-base" />
        </div>
        <div>
          <label className="label-base">{t('admin.password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-base" />
          <p className="mt-1 text-xs text-muted">{t('admin.passwordHint')}</p>
        </div>
        <div>
          <label className="label-base">{t('admin.role')}</label>
          <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className="input-base">
            {ROLES.map((r) => <option key={r} value={r}>{t(`admin.role_${r}`)}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  )
}

function EditUserModal({ user, busy, onClose, onSave }: {
  user: AdminUser
  busy: boolean
  onClose: () => void
  onSave: (patch: { name: string; role: AdminRole; title?: string; bio?: string }) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState<AdminRole>(user.role)
  const [title, setTitle] = useState(user.title ?? '')
  const [bio, setBio] = useState(user.bio ?? '')

  return (
    <Modal
      open
      onClose={onClose}
      title={t('admin.editUser')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('admin.cancel')}</Button>
          <Button onClick={() => onSave({ name: name.trim(), role, title, bio })} disabled={!name.trim() || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {t('admin.saveChanges')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.avatar} size="lg" />
          <div>
            <p className="font-semibold text-ink">{user.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted"><Mail className="h-3 w-3" /> {user.email}</p>
          </div>
        </div>
        <div>
          <label className="label-base">{t('admin.fullName')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="label-base">{t('admin.role')}</label>
          <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className="input-base">
            {ROLES.map((r) => <option key={r} value={r}>{t(`admin.role_${r}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="label-base">{t('admin.title')}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('admin.titlePlaceholder')} className="input-base" />
        </div>
        <div>
          <label className="label-base">{t('admin.bio')}</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder={t('admin.bioPlaceholder')} className="input-base" />
        </div>
      </div>
    </Modal>
  )
}

function ConfirmModal({ user, mode, busy, onClose, onConfirm }: {
  user: AdminUser
  mode: 'suspend' | 'activate' | 'delete'
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  const isDelete = mode === 'delete'
  const icon = isDelete ? <Trash2 className="h-5 w-5" /> : mode === 'activate' ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />
  const tone = isDelete ? 'text-danger' : mode === 'activate' ? 'text-success' : 'text-warning'
  const bg = isDelete ? 'bg-danger/10' : mode === 'activate' ? 'bg-success/10' : 'bg-warning/10'

  return (
    <Modal
      open
      onClose={onClose}
      title={isDelete ? t('admin.deleteUser') : mode === 'activate' ? t('admin.activateUser') : t('admin.suspendUser')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('admin.cancel')}</Button>
          <Button
            variant={isDelete ? 'outline' : 'primary'}
            className={isDelete ? 'text-danger' : mode === 'activate' ? 'text-success' : ''}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isDelete ? t('admin.delete') : mode === 'activate' ? t('admin.activate') : t('admin.suspend')}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span className={cn('rounded-full p-3', bg, tone)}>{icon}</span>
        <div>
          <p className="font-semibold text-ink">{isDelete ? t('admin.deleteUserBody', { name: user.name }) : mode === 'activate' ? t('admin.activateUserBody', { name: user.name }) : t('admin.suspendUserBody', { name: user.name })}</p>
          <p className="mt-1 text-sm text-muted">{isDelete ? t('admin.deleteWarning') : t('admin.statusActionNote')}</p>
        </div>
      </div>
    </Modal>
  )
}