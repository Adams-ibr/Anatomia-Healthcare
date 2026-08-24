import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award, Banknote, BookOpen, Download, FileText, Megaphone, RefreshCcw, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORIES, COURSES } from '../lib/data'
import { useApp } from '../lib/store'
import { adminApi, courseApi, getStoredToken } from '../lib/api/auth'
import type { PlatformSettings } from '../lib/api/auth'
import type { AuthUser } from '../lib/types'
import { Badge, Button, Input, StatCard, Tabs } from '../components/ui'
import { formatPrice, timeAgo } from '../lib/utils'

export function AdminCertificates() {
  const { certificates } = useApp()
  const { t } = useTranslation()
  const [rows, setRows] = useState<{
    id: string
    studentName: string
    courseTitle: string
    issuedAt: string
    verificationCode: string
  }[] | null>(null)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    let cancelled = false
    adminApi.listCertificates(token)
      .then((res) => { if (!cancelled) setRows(res.certificates) })
      .catch(() => { /* fall back to local */ })
    return () => { cancelled = true }
  }, [])

  const list = rows ?? certificates.map((c) => ({
    id: c.id,
    studentName: '',
    courseTitle: c.course?.title ?? COURSES.find((x) => x.id === c.courseId)?.title ?? '',
    issuedAt: c.issuedAt,
    verificationCode: c.verificationCode
  }))

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('admin2.certificates')}</h1>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">{t('admin2.student')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.course')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.issued')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.code')}</th>
                <th className="px-5 py-3 text-right font-semibold">{t('admin2.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-paper/60">
                  <td className="px-5 py-3 font-medium text-ink">{c.studentName || t('admin2.student')}</td>
                  <td className="px-5 py-3 text-muted">{c.courseTitle}</td>
                  <td className="px-5 py-3 text-muted">{new Date(c.issuedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">{c.verificationCode}</td>
                  <td className="px-5 py-3 text-right">
                    <Link to={`/verify-certificate/${c.verificationCode}`} className="text-sm font-medium text-brand-700 hover:underline">{t('admin2.verify')}</Link>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted">{t('admin2.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function AdminOrders() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const [rows, setRows] = useState<{
    id: string
    customerName: string
    total: number
    status: string
    paymentMethod: string
    createdAt: string
    items: { courseId: string; title: string; price: number }[]
  }[] | null>(null)

  const load = () => {
    const token = getStoredToken()
    if (!token) return
    adminApi.listOrders(token)
      .then((res) => setRows(res.orders))
      .catch(() => setRows([]))
  }

  useEffect(() => { load() }, [])

  const refund = async (id: string) => {
    if (!window.confirm(t('admin2.refundConfirm'))) return
    const token = getStoredToken()
    if (!token) return
    try {
      await adminApi.refundOrder(token, id)
      toast(t('admin2.refundIssued'), id, 'info')
      load()
    } catch (err) {
      toast(t('admin2.refundFailed'), err instanceof Error ? err.message : '', 'error')
    }
  }

  const statusColor = (s: string) => s === 'completed' ? 'success' : s === 'pending' ? 'warning' : s === 'refunded' ? 'brand' : 'danger'
  const statusLabel = (s: string) => s === 'completed' ? t('orders.completed') : s === 'pending' ? t('orders.pending') : s === 'refunded' ? t('orders.refunded') : t('orders.failed')

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('admin2.orders')}</h1>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">{t('admin2.order')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.customer')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.items')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.total')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.payment')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.status')}</th>
                <th className="px-5 py-3 text-right font-semibold">{t('admin2.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(rows ?? []).map((o) => (
                <tr key={o.id} className="hover:bg-paper/60">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-ink">{o.id}</td>
                  <td className="px-5 py-3 text-muted">{o.customerName}</td>
                  <td className="px-5 py-3 text-muted">{t('admin2.coursesCount', { count: o.items?.length ?? 0 })}</td>
                  <td className="px-5 py-3 font-semibold text-ink">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3 text-muted">{o.paymentMethod}</td>
                  <td className="px-5 py-3"><Badge color={statusColor(o.status)}>{statusLabel(o.status)}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    {o.status === 'completed' ? (
                      <button onClick={() => refund(o.id)} className="text-xs font-medium text-warning hover:underline">{t('admin2.refund')}</button>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {(rows ?? []).length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted">{t('admin2.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function AdminPayments() {
  const { t } = useTranslation()
  const [data, setData] = useState<{
    grossRevenue: number
    netRevenue: number
    refunds: number
    instructorPayouts: number
    orderCount: number
    completedCount: number
    refundedCount: number
    monthly: { m: string; revenue: number }[]
    byMethod: Record<string, { count: number; revenue: number }>
    recent: { id: string; total: number; status: string; paymentMethod: string; createdAt: string }[]
  } | null>(null)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    adminApi.getPayments(token).then(setData).catch(() => {})
  }, [])

  const statusColor = (s: string) => s === 'completed' ? 'success' : s === 'pending' ? 'warning' : s === 'refunded' ? 'brand' : 'danger'
  const statusLabel = (s: string) => s === 'completed' ? t('orders.completed') : s === 'pending' ? t('orders.pending') : s === 'refunded' ? t('orders.refunded') : t('orders.failed')
  const monthly = data?.monthly ?? [
    { m: '—', revenue: 0 }, { m: '—', revenue: 0 }, { m: '—', revenue: 0 },
    { m: '—', revenue: 0 }, { m: '—', revenue: 0 }, { m: '—', revenue: 0 }
  ]
  const methods = Object.entries(data?.byMethod ?? {})
  const hasOrders = data != null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('admin2.payments')}</h1>
          <p className="mt-1 text-sm text-muted">{t('admin2.paymentsLoading')}</p>
        </div>
        <Badge color="line">{t('admin2.ordersCount', { count: data?.orderCount ?? 0 })}</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('admin2.grossRevenue')} value={formatPrice(data?.grossRevenue ?? 0)} sub={t('admin2.completedOrders', { count: data?.completedCount ?? 0 })} icon={<Banknote className="h-5 w-5" />} />
        <StatCard label={t('admin2.netRevenue')} value={formatPrice(data?.netRevenue ?? 0)} sub={t('admin2.afterRefunds')} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label={t('admin2.instructorPayouts')} value={formatPrice(data?.instructorPayouts ?? 0)} sub={t('admin2.revenueShare')} icon={<Users className="h-5 w-5" />} />
        <StatCard label={t('admin2.refunds')} value={formatPrice(data?.refunds ?? 0)} sub={t('admin2.refundedOrders', { count: data?.refundedCount ?? 0 })} icon={<RefreshCcw className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <h2 className="mb-4 font-semibold text-ink">{t('admin2.monthlyRevenue')}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} formatter={(v) => formatPrice(Number(v))} />
              <Bar dataKey="revenue" fill="var(--brand-500)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-ink">{t('admin2.byMethod')}</h2>
          {methods.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{hasOrders ? t('admin2.empty') : t('admin2.paymentsLoading')}</p>
          ) : (
            <div className="space-y-3">
              {methods.map(([m, s]) => (
                <div key={m} className="flex items-center justify-between rounded-card border border-line bg-paper px-4 py-3">
                  <div>
                    <p className="text-sm font-medium capitalize text-ink">{m}</p>
                    <p className="text-xs text-muted">{t('admin2.transactionsCount', { count: s.count })}</p>
                  </div>
                  <p className="font-semibold text-ink">{formatPrice(s.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold text-ink">{t('admin2.recentTransactions')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">{t('admin2.order')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.total')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.payment')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.status')}</th>
                <th className="px-5 py-3 font-semibold">{t('admin2.issued')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(data?.recent ?? []).map((o) => (
                <tr key={o.id} className="hover:bg-paper/60">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-ink">{o.id.slice(0, 8)}…</td>
                  <td className="px-5 py-3 font-semibold text-ink">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3 text-muted">{o.paymentMethod}</td>
                  <td className="px-5 py-3"><Badge color={statusColor(o.status)}>{statusLabel(o.status)}</Badge></td>
                  <td className="px-5 py-3 text-muted">{timeAgo(o.createdAt)}</td>
                </tr>
              ))}
              {(data?.recent ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted">{t('admin2.noOrders')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-card border border-line bg-paper p-4 text-xs text-muted">
        {t('admin2.paymentsNote')}
      </div>
    </div>
  )
}

export function AdminAnnouncements() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [rows, setRows] = useState<{
    id: string
    authorName: string
    title: string
    body: string
    createdAt: string
  }[] | null>(null)

  const load = () => {
    const token = getStoredToken()
    if (!token) return
    adminApi.listAnnouncements(token)
      .then((res) => setRows(res.announcements))
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const post = async () => {
    if (!title.trim() || posting) return
    const token = getStoredToken()
    if (!token) return
    setPosting(true)
    try {
      await adminApi.createAnnouncement(token, { title, message: body })
      toast(t('admin2.announcementPosted'), t('admin2.sentAllUsers'))
      setTitle('')
      setBody('')
      load()
    } catch (err) {
      toast(t('admin2.postFailed'), err instanceof Error ? err.message : '', 'error')
    } finally {
      setPosting(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm(t('admin2.deleteConfirm'))) return
    const token = getStoredToken()
    if (!token) return
    try {
      await adminApi.deleteAnnouncement(token, id)
      toast(t('admin2.announcementDeleted'))
      load()
    } catch (err) {
      toast(t('admin2.postFailed'), err instanceof Error ? err.message : '', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('admin2.announcements')}</h1>
      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-ink">{t('admin2.newAnnouncement')}</h2>
        <div className="space-y-4">
          <Input label={t('admin2.title')} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('admin2.titlePlaceholder')} />
          <div>
            <label className="label-base">{t('admin2.message')}</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="input-base" placeholder={t('admin2.messagePlaceholder')} />
          </div>
          <Button onClick={post} disabled={!title.trim() || posting}>{posting ? t('admin2.posting') : t('admin2.postAnnouncement')}</Button>
        </div>
      </div>
      <div className="space-y-3">
        {(rows ?? []).map((a) => (
          <div key={a.id} className="card flex items-start gap-3 p-4">
            <div className="rounded-card bg-brand-50 p-2.5 text-brand-700"><Megaphone className="h-4 w-4" /></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{a.title}</p>
              {a.body && <p className="mt-0.5 text-sm text-muted">{a.body}</p>}
              <p className="mt-1 text-xs text-muted">{timeAgo(a.createdAt)} · {t('admin2.postedBy')} {a.authorName}</p>
            </div>
            <button onClick={() => remove(a.id)} className="text-xs font-medium text-danger hover:underline">{t('admin2.delete')}</button>
          </div>
        ))}
        {(rows ?? []).length === 0 && (
          <div className="card p-12 text-center text-sm text-muted">{t('admin2.announcementsEmpty')}</div>
        )}
      </div>
    </div>
  )
}

function downloadCsv(filename: string, headers: string[], rows: (string | number | undefined)[][]) {
  const esc = (v: string | number | undefined) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function fetchAllUsers(token: string): Promise<AuthUser[]> {
  const out: AuthUser[] = []
  const page = async (n: number): Promise<AuthUser[]> => {
    const res = await adminApi.listUsers(token, { page: n, perPage: 100 })
    out.push(...res.users)
    return res.hasMore ? page(n + 1) : out
  }
  return page(1)
}

export function AdminReports() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const [report, setReport] = useState<Awaited<ReturnType<typeof adminApi.getReports>> | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = () => {
    const token = getStoredToken()
    if (!token) return
    setFailed(false)
    adminApi.getReports(token).then(setReport).catch(() => setFailed(true))
  }
  useEffect(load, [])

  const token = getStoredToken()

  const run = async (kind: string, fn: () => Promise<void>) => {
    if (busy || !token) return
    setBusy(kind)
    try {
      await fn()
    } catch {
      window.alert(t('admin2.exportFailed'))
    } finally {
      setBusy(null)
    }
  }

  const exportUsers = () => run('users', async () => {
    const users = await fetchAllUsers(token!)
    downloadCsv('hamaacademy-users.csv',
      [t('admin2.name'), t('admin2.email'), t('admin2.role'), t('admin2.status'), t('admin2.joined')],
      users.map((u) => [u.name, u.email, u.role, u.isActive ? t('admin2.active') : t('admin2.suspended'), new Date(u.joinedAt).toLocaleDateString()]))
  })

  const exportCourses = () => run('courses', async () => {
    const res = await courseApi.listCourses(token!, { page: 1, perPage: 500, status: 'all' })
    downloadCsv('hamaacademy-courses.csv',
      [t('admin2.title'), t('admin2.category'), t('admin2.instructor'), t('admin2.price'), t('admin2.status'), t('admin2.avgRatingShort'), t('admin2.students'), t('admin2.reviews')],
      res.courses.map((c) => [c.title, c.categoryName ?? '', c.instructorName ?? '', c.price, c.status, c.rating, c.studentCount, c.reviewCount]))
  })

  const exportRevenue = () => run('revenue', async () => {
    const res = await adminApi.listOrders(token!)
    downloadCsv('hamaacademy-revenue.csv',
      [t('admin2.order'), t('admin2.customer'), t('admin2.total'), t('admin2.payment'), t('admin2.status'), t('admin2.issued')],
      res.orders.map((o) => [o.id, o.customerName, o.total, o.paymentMethod, o.status, new Date(o.createdAt).toLocaleDateString()]))
  })

  const exportCerts = () => run('certs', async () => {
    const res = await adminApi.listCertificates(token!)
    downloadCsv('hamaacademy-certificates.csv',
      [t('admin2.certificateId'), t('admin2.student'), t('admin2.course'), t('admin2.issued'), t('admin2.code')],
      res.certificates.map((c) => [c.id, c.studentName, c.courseTitle, new Date(c.issuedAt).toLocaleDateString(), c.verificationCode]))
  })

  const exportAssessments = () => run('assessments', async () => {
    const res = await adminApi.listAssessmentAttempts(token!)
    downloadCsv('hamaacademy-assessments.csv',
      [t('admin2.student'), t('admin2.assessment'), t('admin2.course'), t('admin2.score'), t('admin2.passed'), t('admin2.attemptedAt')],
      res.attempts.map((a) => [a.studentName, a.assessmentTitle, a.courseTitle ?? '', a.score, a.passed ? t('admin2.yes') : t('admin2.no'), new Date(a.attemptedAt).toLocaleString()]))
  })

  const btn = (kind: string, fn: () => void, label?: string) => (
    <Button variant="outline" onClick={fn} disabled={busy !== null}>
      {busy === kind ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      <span className="ml-2 hidden sm:inline">{label ?? t('admin2.export')}</span>
    </Button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('admin2.reports')}</h1>
          <p className="mt-1 text-sm text-muted">{t('admin2.reportsDesc')}</p>
        </div>
        <Button variant="outline" onClick={() => nav('/admin/analytics')}>{t('admin2.liveAnalytics')}</Button>
      </div>

      {failed ? (
        <div className="card p-12 text-center text-sm text-muted">
          <p>{t('admin2.reportsFailed')}</p>
          <Button variant="outline" className="mt-4" onClick={load}>{t('admin2.retry')}</Button>
        </div>
      ) : !report ? (
        <p className="card p-12 text-center text-sm text-muted">{t('admin2.reportsLoading')}</p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-card bg-brand-50 p-2.5 text-brand-700"><Users className="h-4 w-4" /></div>
                  <div>
                    <p className="font-semibold text-ink">{t('admin2.userGrowth')}</p>
                    <p className="text-xs text-muted">{t('admin2.userGrowthDesc')}</p>
                  </div>
                </div>
                {btn('users', exportUsers)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label={t('admin2.totalUsers')} value={report.users.total.toLocaleString()} />
                <MiniStat label={t('admin2.students')} value={report.users.students.toLocaleString()} />
                <MiniStat label={t('admin2.instructors')} value={report.users.instructors.toLocaleString()} />
                <MiniStat label={t('admin2.newThisMonth')} value={report.users.newThisMonth.toLocaleString()} />
              </div>
              <div className="mt-4 flex h-14 items-end gap-1">
                {report.users.monthly.map((b, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-brand-700">{b.count}</span>
                    <div className="w-full rounded-t bg-brand-500/80" style={{ height: `${b.count ? Math.max(8, (b.count / Math.max(...report.users.monthly.map((x) => x.count), 1)) * 100) : 4}%` }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-card bg-brand-50 p-2.5 text-brand-700"><BookOpen className="h-4 w-4" /></div>
                  <div>
                    <p className="font-semibold text-ink">{t('admin2.coursePerformance')}</p>
                    <p className="text-xs text-muted">{t('admin2.coursePerformanceDesc')}</p>
                  </div>
                </div>
                {btn('courses', exportCourses)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label={t('admin2.published')} value={report.courses.published.toLocaleString()} />
                <MiniStat label={t('admin2.pending')} value={report.courses.pending.toLocaleString()} />
                <MiniStat label={t('admin2.avgRatingShort')} value={String(report.courses.avgRating)} />
                <MiniStat label={t('admin2.reviews')} value={report.courses.totalReviews.toLocaleString()} />
              </div>
              {(report.courses.top ?? []).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('admin2.topCourses')}</p>
                  {(report.courses.top ?? []).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="truncate pr-3 text-ink">{c.title}</span>
                      <span className="shrink-0 text-xs text-muted">{c.studentCount} {t('admin2.students')} · {c.rating}★</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-card bg-brand-50 p-2.5 text-brand-700"><Banknote className="h-4 w-4" /></div>
                  <div>
                    <p className="font-semibold text-ink">{t('admin2.revenueSummary')}</p>
                    <p className="text-xs text-muted">{t('admin2.revenueSummaryDesc')}</p>
                  </div>
                </div>
                {btn('revenue', exportRevenue)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label={t('admin2.gross')} value={formatPrice(report.revenue.gross)} />
                <MiniStat label={t('admin2.net')} value={formatPrice(report.revenue.net)} />
                <MiniStat label={t('admin2.payouts')} value={formatPrice(report.revenue.payouts)} />
                <MiniStat label={t('admin2.avgOrder')} value={formatPrice(report.revenue.avgOrderValue)} />
              </div>
              <p className="mt-4 text-xs text-muted">{report.revenue.completed} {t('admin2.completed')} · {report.revenue.refunded} {t('admin2.refundedOrders')}</p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-card bg-brand-50 p-2.5 text-brand-700"><Award className="h-4 w-4" /></div>
                  <div>
                    <p className="font-semibold text-ink">{t('admin2.certIssuance')}</p>
                    <p className="text-xs text-muted">{t('admin2.certIssuanceDesc')}</p>
                  </div>
                </div>
                {btn('certs', exportCerts)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label={t('admin2.issuedTotal')} value={report.certificates.total.toLocaleString()} />
                <MiniStat label={t('admin2.thisMonth')} value={report.certificates.thisMonth.toLocaleString()} />
              </div>
              <div className="mt-4 flex h-14 items-end gap-1">
                {report.certificates.monthly.map((b, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-brand-700">{b.count}</span>
                    <div className="w-full rounded-t bg-brand-500/80" style={{ height: `${b.count ? Math.max(8, (b.count / Math.max(...report.certificates.monthly.map((x) => x.count), 1)) * 100) : 4}%` }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-card bg-brand-50 p-2.5 text-brand-700"><FileText className="h-4 w-4" /></div>
                  <div>
                    <p className="font-semibold text-ink">{t('admin2.assessAnalytics')}</p>
                    <p className="text-xs text-muted">{t('admin2.assessAnalyticsDesc')}</p>
                  </div>
                </div>
                {btn('assessments', exportAssessments)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label={t('admin2.assessments')} value={report.assessments.totalAssessments.toLocaleString()} />
                <MiniStat label={t('admin2.attempts')} value={report.assessments.attempts.toLocaleString()} />
                <MiniStat label={t('admin2.passed')} value={report.assessments.passed.toLocaleString()} />
                <MiniStat label={t('admin2.passRate')} value={`${report.assessments.passRate}%`} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-paper p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  )
}

export function AdminAnalytics() {
  const { t } = useTranslation()
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.getAnalytics>> | null>(null)
  const [failed, setFailed] = useState(false)

  const load = () => {
    const token = getStoredToken()
    if (!token) return
    setFailed(false)
    adminApi.getAnalytics(token).then(setData).catch(() => setFailed(true))
  }
  useEffect(load, [])

  const revData = (data?.revenue.monthly ?? []).map((m) => ({ m: m.m, revenue: Math.round(m.revenue) }))
  const usersSeries = data?.users.monthly ?? []
  const enrSeries = data?.enrollments.monthly ?? []
  const certSeries = data?.certificates.monthly ?? []
  const byCategory = data?.courses.byCategory ?? []
  const maxCatStudents = Math.max(...byCategory.map((c) => c.students), 1)

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('admin2.analytics')}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('admin2.totalUsers')} value={(data?.users.total ?? 0).toLocaleString()} sub={t('admin2.registeredUsers')} icon={<Users className="h-5 w-5" />} />
        <StatCard label={t('admin2.enrollments')} value={(data?.enrollments.total ?? 0).toLocaleString()} sub={`${data?.enrollments.active ?? 0} ${t('admin2.active')} · ${data?.enrollments.completed ?? 0} ${t('admin2.completed')}`} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label={t('admin2.certificates')} value={(data?.certificates.total ?? 0).toLocaleString()} sub={t('admin2.thisMonth')} icon={<Award className="h-5 w-5" />} />
        <StatCard label={t('admin2.revenue')} value={formatPrice(data?.revenue.gross ?? 0)} sub={`${t('admin2.net')} · ${formatPrice(data?.revenue.net ?? 0)}`} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      {failed ? (
        <div className="card p-12 text-center text-sm text-muted">
          <p>{t('admin2.reportsFailed')}</p>
          <Button variant="outline" className="mt-4" onClick={load}>{t('admin2.retry')}</Button>
        </div>
      ) : !data ? (
        <p className="card p-12 text-center text-sm text-muted">{t('admin2.reportsLoading')}</p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t('admin2.usersGrowth')}>
              {usersSeries.every((x) => x.count === 0) ? <NoData t={t} /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={usersSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usrg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" name={t('admin2.usersShort')} stroke="var(--brand-500)" strokeWidth={2} fill="url(#usrg)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title={t('admin2.enrollmentTrend')}>
              {enrSeries.every((x) => x.count === 0) ? <NoData t={t} /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={enrSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} />
                    <Bar dataKey="count" name={t('admin2.enrollments')} fill="var(--brand-500)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title={t('admin2.platformRevenue')}>
              {revData.every((x) => x.revenue === 0) ? <NoData t={t} /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={revData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="enrg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} formatter={(v) => [formatPrice(Number(v)), t('admin2.revenue')]} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--brand-500)" strokeWidth={2} fill="url(#enrg)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title={t('admin2.certTrend')}>
              {certSeries.every((x) => x.count === 0) ? <NoData t={t} /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={certSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" name={t('admin2.certificates')} stroke="var(--brand-500)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-ink">{t('admin2.categoryBreakdown')}</h2>
            {byCategory.length === 0 ? <NoData t={t} /> : (
              <div className="space-y-3">
                {byCategory.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-sm text-ink">{c.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(c.students / maxCatStudents) * 100}%` }} />
                    </div>
                    <span className="w-32 shrink-0 text-right text-xs text-muted">{c.count} {t('admin2.coursesShort')} · {c.students} {t('admin2.students')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="mb-4 font-semibold text-ink">{title}</h2>
      {children}
    </div>
  )
}

function NoData({ t }: { t: (k: string) => string }) {
  return <p className="py-16 text-center text-sm text-muted">{t('admin2.noData')}</p>
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-0">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button type="button" role="switch" aria-checked={on} onClick={onToggle} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-brand-500' : 'bg-line'}`}>
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

export function AdminSettings() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const [tab, setTab] = useState('general')
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  const tabs = [
    { id: 'general', label: t('admin2.general') },
    { id: 'branding', label: t('admin2.branding') },
    { id: 'payments', label: t('admin2.payments') },
    { id: 'policies', label: t('admin2.policies') },
    { id: 'notifications', label: t('admin2.notifications') }
  ]

  const load = () => {
    const token = getStoredToken()
    if (!token) return
    setFailed(false)
    adminApi.getSettings(token).then((res) => setSettings(res.settings)).catch(() => setFailed(true))
  }
  useEffect(load, [])

  const patch = (p: Partial<PlatformSettings>) => setSettings((s) => (s ? { ...s, ...p } : s))

  const save = async () => {
    const token = getStoredToken()
    if (!token || !settings) return
    setSaving(true)
    try {
      const res = await adminApi.updateSettings(token, {
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        defaultCurrency: settings.defaultCurrency,
        instructorShare: Number(settings.instructorShare),
        primaryColor: settings.primaryColor,
        tagline: settings.tagline,
        refundWindowDays: Number(settings.refundWindowDays),
        passingScore: Number(settings.passingScore),
        welcomeEmail: settings.welcomeEmail,
        completionEmail: settings.completionEmail,
        assignmentReminders: settings.assignmentReminders,
        weeklyDigest: settings.weeklyDigest
      })
      setSettings(res.settings)
      toast(t('admin2.changesSaved'))
    } catch {
      toast(t('admin2.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('admin2.systemSettings')}</h1>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="card p-6">
        {failed ? (
          <div className="py-12 text-center text-sm text-muted">
            <p>{t('admin2.loadingFailed')}</p>
            <Button variant="outline" className="mt-4" onClick={load}>{t('admin2.retry')}</Button>
          </div>
        ) : !settings ? (
          <p className="py-12 text-center text-sm text-muted">{t('admin2.reportsLoading')}</p>
        ) : (
          <>
            {tab === 'general' && (
              <div className="space-y-4">
                <Input label={t('admin2.platformName')} value={settings.platformName} onChange={(e) => patch({ platformName: e.target.value })} />
                <Input label={t('admin2.supportEmail')} value={settings.supportEmail} onChange={(e) => patch({ supportEmail: e.target.value })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label={t('admin2.defaultCurrency')} value={settings.defaultCurrency} onChange={(e) => patch({ defaultCurrency: e.target.value })} />
                  <Input label={t('admin2.instructorShare')} type="number" min={0} max={100} value={settings.instructorShare} onChange={(e) => patch({ instructorShare: Number(e.target.value) })} />
                </div>
                <p className="text-xs text-muted">{t('admin2.billingNote')}</p>
                <Button onClick={save} disabled={saving}>{saving ? t('admin2.saving') : t('admin2.saveSettings')}</Button>
              </div>
            )}
            {tab === 'branding' && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label={t('admin2.primaryColor')} type="color" value={settings.primaryColor} onChange={(e) => patch({ primaryColor: e.target.value })} />
                  <Input label={t('admin2.colorValue')} value={settings.primaryColor} onChange={(e) => patch({ primaryColor: e.target.value })} />
                </div>
                <Input label={t('admin2.tagline')} value={settings.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
                <Button onClick={save} disabled={saving}>{saving ? t('admin2.saving') : t('admin2.saveBranding')}</Button>
              </div>
            )}
            {tab === 'payments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-card bg-paper p-4">
                  <div>
                    <p className="text-sm font-medium text-ink">{t('admin2.provider')}</p>
                    <p className="text-xs text-muted">{t('admin2.providerNote')}</p>
                  </div>
                  <Badge color="success">{t('admin2.live')}</Badge>
                </div>
                <Input label={t('admin2.publicKey')} value={settings.paystackPublicKey ?? ''} disabled />
                <p className="text-xs text-muted">{t('admin2.providerActive')}</p>
              </div>
            )}
            {tab === 'policies' && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label={t('admin2.refundWindowDays')} type="number" min={0} value={settings.refundWindowDays} onChange={(e) => patch({ refundWindowDays: Number(e.target.value) })} />
                  <Input label={t('admin2.passingScorePct')} type="number" min={0} max={100} value={settings.passingScore} onChange={(e) => patch({ passingScore: Number(e.target.value) })} />
                </div>
                <p className="text-xs text-muted">{t('admin2.currencyNote')}</p>
                <Button onClick={save} disabled={saving}>{saving ? t('admin2.saving') : t('admin2.savePolicies')}</Button>
              </div>
            )}
            {tab === 'notifications' && (
              <div>
                <p className="mb-2 text-sm text-muted">{t('admin2.notificationsNote')}</p>
                <div className="divide-y divide-line">
                  <Toggle label={t('admin2.welcomeEmail')} on={settings.welcomeEmail} onToggle={() => patch({ welcomeEmail: !settings.welcomeEmail })} />
                  <Toggle label={t('admin2.completionEmail')} on={settings.completionEmail} onToggle={() => patch({ completionEmail: !settings.completionEmail })} />
                  <Toggle label={t('admin2.assignmentReminders')} on={settings.assignmentReminders} onToggle={() => patch({ assignmentReminders: !settings.assignmentReminders })} />
                  <Toggle label={t('admin2.weeklyDigest')} on={settings.weeklyDigest} onToggle={() => patch({ weeklyDigest: !settings.weeklyDigest })} />
                </div>
                <Button className="mt-4" onClick={save} disabled={saving}>{saving ? t('admin2.saving') : t('admin2.saveSettings')}</Button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="rounded-card border border-line bg-paper p-4 text-xs text-muted">
        <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> {t('admin2.securityNote')}
      </div>
    </div>
  )
}