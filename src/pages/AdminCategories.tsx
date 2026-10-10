import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, BookOpen, Layers, Loader2, PencilLine, Plus, Sparkles, Trash2 } from 'lucide-react'
import { categoriesApi } from '../lib/supabase'
import type { Category } from '../lib/types/admin'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { cn } from '../lib/utils'

// Extended Category type for UI display
interface DisplayCategory extends Category {
  courseCount?: number
}

export default function AdminCategories() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [categories, setCategories] = useState<DisplayCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<DisplayCategory | null>(null)
  const [confirming, setConfirming] = useState<DisplayCategory | null>(null)
  const [mutating, setMutating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await categoriesApi.list()
      const categoriesArray = Array.isArray(data) ? data : []
      
      // Map to display format with courseCount
      const mappedCategories: DisplayCategory[] = categoriesArray.map(c => ({
        ...c,
        courseCount: c.course_count || 0
      }))
      
      setCategories(mappedCategories)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.categoriesLoadFailed'))
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const runMutation = useCallback(async (fn: () => Promise<unknown>, successTitle: string, successBody?: string) => {
    setMutating(true)
    try {
      await fn()
      toast(successTitle, successBody)
      load()
      return true
    } catch (err) {
      toast(t('admin.errorTitle'), err instanceof Error ? err.message : t('admin.errorGeneric'), 'error')
      return false
    } finally {
      setMutating(false)
    }
  }, [load, t, toast])

  const totalCourses = categories.reduce((sum, c) => sum + (c.courseCount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('admin.categoryManagement')}</h1>
          <p className="mt-1 text-sm text-muted">{t('admin.categoryManagementDesc')}</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> {t('admin.newCategory')}</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCardMini label={t('admin.statCategories')} value={categories.length} icon={<Layers className="h-4 w-4" />} tone="brand" />
        <StatCardMini label={t('admin.statCategoryCourses')} value={totalCourses} icon={<BookOpen className="h-4 w-4" />} tone="success" />
        <StatCardMini label={t('admin.statFeaturedCategories')} value={categories.filter((c) => (c.courseCount || 0) > 0).length} icon={<Sparkles className="h-4 w-4" />} tone="warning" />
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" onClick={() => load()}><Loader2 className="h-3.5 w-3.5" /> {t('admin.retry')}</Button>
        </div>
      )}

      {loading && categories.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-card" />
                <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-2.5 w-40" /></div>
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title={t('admin.noCategoriesTitle')}
          message={t('admin.noCategoriesMessage')}
          action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> {t('admin.newCategory')}</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="card group p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card text-white" style={{ backgroundColor: c.color || '#1B4E9B' }}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{c.name}</p>
                    <Badge color={(c.courseCount || 0) > 0 ? 'success' : 'line'}>{c.courseCount || 0}</Badge>
                  </div>
                  <p className="truncate text-xs text-muted">/{c.slug}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setEditing(c)}
                    className="rounded p-1.5 text-brand-700 hover:bg-brand-50"
                    aria-label={t('admin.editCategory')}
                  ><PencilLine className="h-4 w-4" /></button>
                  <button
                    onClick={() => setConfirming(c)}
                    className="rounded p-1.5 text-danger hover:bg-danger/10"
                    aria-label={t('admin.delete')}
                  ><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {c.description && <p className="mt-3 line-clamp-2 text-xs text-muted">{c.description}</p>}
            </div>
          ))}
        </div>
      )}

      <CreateCategoryModal
        open={creating}
        busy={mutating}
        onClose={() => setCreating(false)}
        onCreate={(input) => runMutation(
          async () => await categoriesApi.create(input),
          t('admin.categoryCreated'),
          input.name
        ).then((ok) => { if (ok) setCreating(false) })}
      />

      {editing && (
        <EditCategoryModal
          category={editing}
          busy={mutating}
          onClose={() => setEditing(null)}
          onSave={(patch) => runMutation(
            async () => await categoriesApi.update(editing.id, patch),
            t('admin.categoryUpdated'),
            patch.name ?? editing.name
          ).then((ok) => { if (ok) setEditing(null) })}
        />
      )}

      {confirming && (
        <DeleteCategoryModal
          category={confirming}
          busy={mutating}
          onClose={() => setConfirming(null)}
          onConfirm={() => runMutation(
            async () => await categoriesApi.delete(confirming.id),
            t('admin.categoryDeleted'),
            confirming.name
          ).then((ok) => { if (ok) setConfirming(null) })}
        />
      )}
    </div>
  )
}

function StatCardMini({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'brand' | 'success' | 'warning' }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning'
  }
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={cn('rounded-full p-2.5', tones[tone])}>{icon}</span>
      <div><p className="text-lg font-bold text-ink">{value}</p><p className="text-xs text-muted">{label}</p></div>
    </div>
  )
}

function CreateCategoryModal({ open, busy, onClose, onCreate }: {
  open: boolean
  busy: boolean
  onClose: () => void
  onCreate: (input: any) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#1B4E9B')

  const reset = () => { setName(''); setSlug(''); setDescription(''); setColor('#1B4E9B') }
  const valid = name.trim().length > 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('admin.createCategory')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('admin.cancel')}</Button>
          <Button onClick={() => {
            onCreate({ name: name.trim(), slug: slug.trim() || undefined, description: description.trim(), color })
            reset()
          }} disabled={!valid || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('admin.create')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-base">{t('admin.categoryName')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('admin.categoryNamePlaceholder')} className="input-base" autoFocus />
        </div>
        <div>
          <label className="label-base">{t('admin.categorySlug')}</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. machine-learning" className="input-base" />
        </div>
        <div>
          <label className="label-base">{t('admin.categoryDescription')}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('admin.categoryDescriptionPlaceholder')} rows={3} className="input-base resize-none" />
        </div>
        <div>
          <label className="label-base">{t('admin.categoryColor')}</label>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-line bg-transparent p-1" />
            <input value={color} onChange={(e) => setColor(e.target.value)} className="input-base flex-1" />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function EditCategoryModal({ category, busy, onClose, onSave }: {
  category: DisplayCategory
  busy: boolean
  onClose: () => void
  onSave: (patch: any) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(category.name)
  const [slug, setSlug] = useState(category.slug)
  const [description, setDescription] = useState(category.description || '')
  const [color, setColor] = useState(category.color || '#1B4E9B')

  const valid = name.trim().length > 0

  return (
    <Modal
      open
      onClose={onClose}
      title={t('admin.editCategory')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('admin.cancel')}</Button>
          <Button onClick={() => onSave({ name: name.trim(), slug: slug.trim() || undefined, description: description.trim(), color })} disabled={!valid || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {t('admin.saveChanges')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card text-white" style={{ backgroundColor: color }}>
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{category.name}</p>
            <p className="text-xs text-muted">/{category.slug} · {category.courseCount || 0} courses</p>
          </div>
        </div>
        <div>
          <label className="label-base">{t('admin.categoryName')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="label-base">{t('admin.categorySlug')}</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="label-base">{t('admin.categoryDescription')}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-base resize-none" />
        </div>
        <div>
          <label className="label-base">{t('admin.categoryColor')}</label>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-line bg-transparent p-1" />
            <input value={color} onChange={(e) => setColor(e.target.value)} className="input-base flex-1" />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function DeleteCategoryModal({ category, busy, onClose, onConfirm }: {
  category: DisplayCategory
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  const blocked = (category.courseCount || 0) > 0
  return (
    <Modal
      open
      onClose={onClose}
      title={t('admin.deleteCategory')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('admin.cancel')}</Button>
          <Button onClick={onConfirm} disabled={busy || blocked} className={cn('text-danger', blocked && 'cursor-not-allowed')}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {t('admin.delete')}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span className="rounded-full bg-danger/10 p-3 text-danger"><Trash2 className="h-5 w-5" /></span>
        <div>
          <p className="font-semibold text-ink">{t('admin.deleteCategoryBody', { name: category.name })}</p>
          <p className="mt-1 text-sm text-muted">
            {blocked ? t('admin.deleteCategoryBlocked', { count: category.courseCount || 0 }) : t('admin.deleteCategoryWarning')}
          </p>
        </div>
      </div>
    </Modal>
  )
}