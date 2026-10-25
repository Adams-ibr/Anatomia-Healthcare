import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRound, Loader2, PencilLine, Plus, Shield, Trash2, Users } from 'lucide-react'
import { adminApi, ADMIN_PERMISSION_MODULES, type CustomRole } from '../lib/api/auth'
import { getStoredToken } from '../lib/api/auth'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'

const tokenOrThrow = () => {
  const token = getStoredToken()
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  return token
}

export default function AdminRoles() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const [roles, setRoles] = useState<CustomRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<CustomRole | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  const loadRoles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { roles: result } = await adminApi.listRoles(tokenOrThrow())
      setRoles(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load custom roles.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadRoles() }, [loadRoles])

  const saveRole = async (input: { name: string; description: string; permissions: string[] }) => {
    setBusy(true)
    try {
      const token = tokenOrThrow()
      if (editing) await adminApi.updateRole(token, editing.id, input)
      else await adminApi.createRole(token, input)
      toast(editing ? 'Role updated' : 'Role created', input.name)
      setEditing(undefined)
      await loadRoles()
    } catch (err) {
      toast('Could not save role', err instanceof Error ? err.message : 'Please try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const deleteRole = async (role: CustomRole) => {
    if (!window.confirm(`Delete “${role.name}”? Users assigned to it will return to their base role.`)) return
    setBusy(true)
    try {
      await adminApi.deleteRole(tokenOrThrow(), role.id)
      toast('Role deleted', role.name)
      await loadRoles()
    } catch (err) {
      toast('Could not delete role', err instanceof Error ? err.message : 'Please try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Custom roles</h1>
        <p className="mt-1 text-sm text-muted">Create permission tiers and assign them to accounts from User Management.</p>
      </div>
      <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> Create role</Button>
    </div>

    <div className="rounded-card border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
      <div className="flex gap-3"><Shield className="mt-0.5 h-5 w-5 shrink-0" /><p>Custom roles grant only the modules and actions selected below. Platform administrator access remains reserved for built-in administrators.</p></div>
    </div>

    {error && <div className="rounded-card border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{error} <button className="ml-2 underline" onClick={() => void loadRoles()}>{t('admin.retry')}</button></div>}
    {loading ? <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((n) => <div key={n} className="card space-y-3 p-5"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-64" /><Skeleton className="h-8 w-full" /></div>)}</div> : roles.length === 0 ? <div className="card"><EmptyState icon={<KeyRound className="h-6 w-6" />} title="No custom roles yet" message="Create a role to control which admin modules a team member can access." action={<Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" /> Create role</Button>} /></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => <article key={role.id} className="card flex flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="font-semibold text-ink">{role.name}</h2><p className="mt-1 min-h-10 text-sm text-muted">{role.description || 'No description provided.'}</p></div>
          <Badge color="brand"><Users className="mr-1 h-3 w-3" />{role.assignedUsers}</Badge>
        </div>
        <div className="my-4 flex flex-wrap gap-1.5">{role.permissions.length ? role.permissions.map((permission) => <Badge key={permission} color="line">{permission.replace(':view', '').replace(':manage', ' · manage')}</Badge>) : <span className="text-xs text-muted">No module permissions</span>}</div>
        <div className="mt-auto flex justify-end gap-2 border-t border-line pt-3">
          <Button variant="outline" onClick={() => setEditing(role)} disabled={busy}><PencilLine className="h-4 w-4" /> Edit</Button>
          <Button variant="outline" className="text-danger" onClick={() => void deleteRole(role)} disabled={busy}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </article>)}
    </div>}

    {editing !== undefined && <RoleEditor role={editing} busy={busy} onClose={() => setEditing(undefined)} onSave={saveRole} />}
  </div>
}

function RoleEditor({ role, busy, onClose, onSave }: {
  role: CustomRole | null
  busy: boolean
  onClose: () => void
  onSave: (input: { name: string; description: string; permissions: string[] }) => void
}) {
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? [])
  const toggle = (key: string, action: 'view' | 'manage') => {
    const permission = `${key}:${action}`
    setPermissions((current) => current.includes(permission) ? current.filter((p) => p !== permission) : [...current, permission])
  }

  return <Modal open onClose={onClose} title={role ? 'Edit custom role' : 'Create custom role'} footer={<>
    <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
    <Button onClick={() => onSave({ name: name.trim(), description: description.trim(), permissions })} disabled={busy || name.trim().length < 2}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}{role ? 'Save role' : 'Create role'}
    </Button>
  </>}>
    <div className="space-y-4">
      <div><label className="label-base">Role name</label><input autoFocus maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Content editor" className="input-base" /></div>
      <div><label className="label-base">Description</label><textarea maxLength={500} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role is responsible for" className="input-base" /></div>
      <div>
        <div className="mb-2 flex items-center justify-between"><div><h3 className="font-semibold text-ink">Module access</h3><p className="text-xs text-muted">Manage permission includes view permission.</p></div><div className="hidden gap-8 pr-7 text-xs font-semibold text-muted sm:flex"><span>View</span><span>Manage</span></div></div>
        <div className="max-h-[45vh] overflow-y-auto rounded-card border border-line divide-y divide-line">
          {ADMIN_PERMISSION_MODULES.map((module) => <div key={module.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-sm font-medium text-ink">{module.label}</span>
            <div className="flex gap-7 sm:gap-10">
              {(['view', 'manage'] as const).map((action) => <label key={action} className="flex min-w-12 items-center justify-center gap-1.5 text-xs text-muted sm:min-w-14">
                <input type="checkbox" checked={permissions.includes(`${module.key}:${action}`)} onChange={() => toggle(module.key, action)} />
                <span className="sm:hidden">{action}</span>
              </label>)}
            </div>
          </div>)}
        </div>
      </div>
    </div>
  </Modal>
}
