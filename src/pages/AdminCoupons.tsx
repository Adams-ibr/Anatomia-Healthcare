import { useEffect, useState } from 'react'
import { Loader2, Plus, Tag, Trash2 } from 'lucide-react'
import { Button, Input } from '../components/ui'
import { useApp } from '../lib/store'
import { supabase } from '../lib/supabase'

type Course = { id: string; title: string }
type Coupon = { id: string; code: string; discount_percent: number; is_active: boolean; starts_at: string | null; ends_at: string | null; coupon_courses: { course_id: string }[] }

export default function AdminCoupons() {
  const { toast } = useApp()
  const [courses, setCourses] = useState<Course[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [code, setCode] = useState('')
  const [percent, setPercent] = useState('10')
  const [courseIds, setCourseIds] = useState<string[]>([])
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [courseResult, couponResult] = await Promise.all([
      supabase.from('courses').select('id,title').order('title'),
      supabase.from('coupons').select('id,code,discount_percent,is_active,starts_at,ends_at,coupon_courses(course_id)').order('created_at', { ascending: false })
    ])
    if (courseResult.error || couponResult.error) toast('Could not load coupons', courseResult.error?.message ?? couponResult.error?.message, 'error')
    setCourses((courseResult.data ?? []) as Course[])
    setCoupons((couponResult.data ?? []) as Coupon[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedCode = code.trim().toUpperCase()
    const value = Number(percent)
    if (!normalizedCode || !courseIds.length || !Number.isInteger(value) || value < 1 || value > 100) {
      toast('Check the coupon details', 'Add a code, select at least one course, and choose a whole percentage from 1 to 100.', 'error')
      return
    }
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      toast('Check the coupon dates', 'The end date must be after the start date.', 'error')
      return
    }
    setSaving(true)
    const { data, error } = await supabase.from('coupons').insert({
      code: normalizedCode,
      discount_percent: value,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null
    }).select('id').single()
    if (!error && data) {
      const links = await supabase.from('coupon_courses').insert(courseIds.map((course_id) => ({ coupon_id: data.id, course_id })))
      if (links.error) {
        await supabase.from('coupons').delete().eq('id', data.id)
        toast('Could not save coupon', links.error.message, 'error')
      } else {
        toast('Coupon created', `${normalizedCode} gives ${value}% off selected courses.`)
        setCode(''); setPercent('10'); setCourseIds([]); setStartsAt(''); setEndsAt('')
        await load()
      }
    } else toast('Could not save coupon', error?.message ?? 'Please try again.', 'error')
    setSaving(false)
  }

  const toggleActive = async (coupon: Coupon) => {
    const { error } = await supabase.from('coupons').update({ is_active: !coupon.is_active, updated_at: new Date().toISOString() }).eq('id', coupon.id)
    if (error) toast('Could not update coupon', error.message, 'error')
    else { toast('Coupon updated', `${coupon.code} is ${coupon.is_active ? 'inactive' : 'active'}.`); await load() }
  }

  const remove = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return
    const { error } = await supabase.from('coupons').delete().eq('id', coupon.id)
    if (error) toast('Could not delete coupon', error.message, 'error')
    else { toast('Coupon deleted', coupon.code); await load() }
  }

  return <div className="container-page py-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="font-display text-3xl font-bold text-ink">Course coupons</h1><p className="mt-2 text-muted">Create discount codes that work only for the courses you select.</p></div>
    </div>
    <form onSubmit={save} className="card mt-6 space-y-5 p-6">
      <h2 className="flex items-center gap-2 font-semibold text-ink"><Plus className="h-4 w-4" /> Create coupon</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-ink">Coupon code<Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ANATOMY50" maxLength={64} required /></label>
        <label className="space-y-1.5 text-sm font-medium text-ink">Discount percentage (1–100)<Input type="number" min="1" max="100" step="1" value={percent} onChange={(e) => setPercent(e.target.value)} required /></label>
      </div>
      <fieldset><legend className="mb-2 text-sm font-medium text-ink">Eligible courses</legend><div className="grid max-h-48 gap-2 overflow-auto rounded-control border border-line p-3 sm:grid-cols-2">
        {courses.map((course) => <label key={course.id} className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={courseIds.includes(course.id)} onChange={(e) => setCourseIds((ids) => e.target.checked ? [...ids, course.id] : ids.filter((id) => id !== course.id))} />{course.title}</label>)}
        {!courses.length && <p className="text-sm text-muted">No courses found.</p>}
      </div><p className="mt-1 text-xs text-muted">The code discounts only selected courses in the shopper’s cart.</p></fieldset>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-ink">Starts (optional)<Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></label>
        <label className="space-y-1.5 text-sm font-medium text-ink">Expires (optional)<Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></label>
      </div>
      <Button type="submit" disabled={saving || !courses.length}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Create coupon</Button>
    </form>
    <section className="mt-8">
      <h2 className="mb-4 font-display text-xl font-bold text-ink">Existing coupons</h2>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand-700" /></div> : coupons.length ? <div className="space-y-3">{coupons.map((coupon) => {
        const eligible = coupon.coupon_courses.map((link) => courses.find((course) => course.id === link.course_id)?.title).filter(Boolean)
        return <article key={coupon.id} className="card flex flex-wrap items-center gap-4 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Tag className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-ink">{coupon.code}</strong><span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">{coupon.discount_percent}% off</span><span className={`rounded-full px-2 py-0.5 text-xs ${coupon.is_active ? 'bg-success/10 text-success' : 'bg-muted/15 text-muted'}`}>{coupon.is_active ? 'Active' : 'Inactive'}</span></div><p className="mt-1 truncate text-sm text-muted">{eligible.join(', ') || 'No linked courses'}</p><p className="text-xs text-muted">{coupon.ends_at ? `Expires ${new Date(coupon.ends_at).toLocaleString()}` : 'No expiry'}</p></div>
          <Button type="button" variant="outline" onClick={() => void toggleActive(coupon)}>{coupon.is_active ? 'Deactivate' : 'Activate'}</Button><button aria-label={`Delete ${coupon.code}`} className="rounded p-2 text-danger hover:bg-danger/10" onClick={() => void remove(coupon)}><Trash2 className="h-4 w-4" /></button>
        </article>
      })}</div> : <div className="card py-12 text-center text-sm text-muted">No coupons created yet.</div>}
    </section>
  </div>
}
