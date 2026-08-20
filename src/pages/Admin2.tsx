import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award, Download, DollarSign, FileText, Megaphone, Receipt, RefreshCcw, Settings, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORIES, COURSES, ORDERS } from '../lib/data'
import { useApp } from '../lib/store'
import { adminApi, getStoredToken } from '../lib/api/auth'
import { Badge, Button, Input, ProgressBar, StatCard, Tabs } from '../components/ui'
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
      .catch(() => setRows(ORDERS.map((o) => ({
        id: o.id,
        customerName: o.userId === 'u_st_1' ? 'John Adedeji' : 'Customer',
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        createdAt: o.date,
        items: o.items.map((it) => ({ courseId: it.courseId, title: it.title, price: it.price }))
      }))))
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
                  <td className="px-5 py-3 text-muted">{t('admin2.coursesCount', { count: o.items.length })}</td>
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
  const data = [
    { m: 'Jan', revenue: 8200 }, { m: 'Feb', revenue: 9400 }, { m: 'Mar', revenue: 11100 },
    { m: 'Apr', revenue: 13200 }, { m: 'May', revenue: 14800 }, { m: 'Jun', revenue: 16900 }
  ]
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('admin2.payments')}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('admin2.grossRevenue')} value={formatPrice(73600)} sub={t('admin2.last6Months')} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label={t('admin2.instructorPayouts')} value={formatPrice(51500)} sub={t('admin2.revenueShare')} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label={t('admin2.refunds')} value={formatPrice(890)} sub={t('admin2.pctGross')} icon={<RefreshCcw className="h-5 w-5" />} />
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-ink">{t('admin2.monthlyRevenue')}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} formatter={(v) => formatPrice(Number(v))} />
            <Bar dataKey="revenue" fill="var(--brand-500)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
          <Button onClick={() => { if (!title.trim()) return; toast(t('admin2.announcementPosted'), t('admin2.sentAllUsers')); setTitle(''); setBody('') }}>{t('admin2.postAnnouncement')}</Button>
        </div>
      </div>
      <div className="space-y-3">
        {[[t('admin2.annNew'), '2h ago', 'system'], [t('admin2.annMaint'), '1d ago', 'system'], [t('admin2.annWelcome'), '3d ago', 'community']].map(([tt, time, kind]) => (
          <div key={tt} className="card flex items-start gap-3 p-4">
            <div className="rounded-card bg-brand-50 p-2.5 text-brand-700"><Megaphone className="h-4 w-4" /></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{tt}</p>
              <p className="mt-0.5 text-xs text-muted">{time} {t('admin2.sentToAll')}</p>
            </div>
            <Badge color="line">{kind}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminReports() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const rows = [
    { name: t('admin2.userGrowth'), desc: t('admin2.userGrowthDesc'), icon: <Users className="h-4 w-4" /> },
    { name: t('admin2.coursePerformance'), desc: t('admin2.coursePerformanceDesc'), icon: <BarChart3Icon /> },
    { name: t('admin2.revenueSummary'), desc: t('admin2.revenueSummaryDesc'), icon: <DollarSign className="h-4 w-4" /> },
    { name: t('admin2.certIssuance'), desc: t('admin2.certIssuanceDesc'), icon: <Award className="h-4 w-4" /> },
    { name: t('admin2.assessAnalytics'), desc: t('admin2.assessAnalyticsDesc'), icon: <FileText className="h-4 w-4" /> }
  ]
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('admin2.reports')}</h1>
          <p className="mt-1 text-sm text-muted">{t('admin2.reportsDesc')}</p>
        </div>
        <Button variant="outline" onClick={() => nav('/admin/analytics')}>{t('admin2.liveAnalytics')}</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.name} className="card flex items-center gap-4 p-5">
            <div className="rounded-card bg-brand-50 p-3 text-brand-700">{r.icon}</div>
            <div className="flex-1">
              <p className="font-semibold text-ink">{r.name}</p>
              <p className="mt-0.5 text-sm text-muted">{r.desc}</p>
            </div>
            <Button variant="outline" onClick={() => window.alert(t('admin2.exportQueued'))}><Download className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart3Icon() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" rx="0.5" /><rect x="12" y="8" width="3" height="10" rx="0.5" /><rect x="17" y="5" width="3" height="13" rx="0.5" /></svg>
}

export function AdminAnalytics() {
  const { t } = useTranslation()
  const data = [
    { m: 'Jan', enrollments: 3200 }, { m: 'Feb', enrollments: 3800 }, { m: 'Mar', enrollments: 4100 },
    { m: 'Apr', enrollments: 4600 }, { m: 'May', enrollments: 5200 }, { m: 'Jun', enrollments: 5800 }
  ]
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('admin2.analytics')}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('admin2.activeUsers30')} value="18,240" sub={t('admin2.plus14MoM')} icon={<Users className="h-5 w-5" />} />
        <StatCard label={t('admin2.retention90')} value="62%" sub={t('admin2.studentsReturning')} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label={t('admin2.avgSession')} value="24m" sub={t('admin2.perLearner')} icon={<FileText className="h-5 w-5" />} />
        <StatCard label={t('admin2.nps')} value="+58" sub={t('admin2.learnerSatisfaction')} icon={<Award className="h-5 w-5" />} />
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-ink">{t('admin2.platformEnrollment')}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="enrg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} />
            <Area type="monotone" dataKey="enrollments" stroke="var(--brand-500)" strokeWidth={2} fill="url(#enrg)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function AdminSettings() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const [tabs] = useState([t('admin2.general'), t('admin2.branding'), t('admin2.payments'), t('admin2.policies'), t('admin2.notifications')])
  const [tab, setTab] = useState(t('admin2.general'))
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">{t('admin2.systemSettings')}</h1>
      <Tabs tabs={tabs.map((tt) => ({ id: tt, label: tt }))} active={tab} onChange={setTab} />
      <div className="card p-6">
        {tab === t('admin2.general') && (
          <div className="space-y-4">
            <Input label={t('admin2.platformName')} defaultValue="HamaAcademy" />
            <Input label={t('admin2.supportEmail')} defaultValue="support@defendhub.io" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t('admin2.defaultCurrency')} defaultValue="USD" />
              <Input label={t('admin2.instructorShare')} defaultValue="70" />
            </div>
            <Button onClick={() => toast(t('admin2.settingsSaved'))}>{t('admin2.saveSettings')}</Button>
          </div>
        )}
        {tab === t('admin2.branding') && (
          <div className="space-y-4">
            <Input label={t('admin2.primaryColor')} defaultValue="#1B4E9B" />
            <Input label={t('admin2.tagline')} defaultValue="Learn Without Limits. Build Skills That Matter." />
            <Button onClick={() => toast(t('admin2.brandingSaved'))}>{t('admin2.saveBranding')}</Button>
          </div>
        )}
        {tab === t('admin2.payments') && (
          <div className="space-y-4">
            <p className="text-sm text-muted">{t('admin2.providerNote')}</p>
            <Input label={t('admin2.provider')} defaultValue="stripe (sandbox)" disabled />
            <Button onClick={() => toast(t('admin2.providerSaved'))}>{t('admin2.save')}</Button>
          </div>
        )}
        {tab === t('admin2.policies') && (
          <div className="space-y-4">
            <Input label={t('admin2.refundWindow')} defaultValue="7" />
            <Input label={t('admin2.passScore')} defaultValue="70" />
            <Button onClick={() => toast(t('admin2.policiesSaved'))}>{t('admin2.savePolicies')}</Button>
          </div>
        )}
        {tab === t('admin2.notifications') && (
          <div className="space-y-4">
            {[t('admin2.welcomeEmail'), t('admin2.completionEmail'), t('admin2.assignmentReminders'), t('admin2.weeklyDigest')].map((n) => (
              <div key={n} className="flex items-center justify-between border-b border-line pb-4">
                <span className="text-sm font-medium text-ink">{n}</span>
                <Button variant="outline" onClick={() => toast(t('admin2.preferenceToggled'))}>{t('admin2.enabled')}</Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-card border border-line bg-paper p-4 text-xs text-muted">
        <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> {t('admin2.securityNote')}
      </div>
    </div>
  )
}