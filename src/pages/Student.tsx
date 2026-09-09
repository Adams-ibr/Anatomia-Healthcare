import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Award, CheckCircle2, Clock, PlayCircle } from 'lucide-react'
import { useApp } from '../lib/store'
import { publicApi } from '../lib/api/auth'
import { Badge, ProgressBar, Rating, Tabs } from '../components/ui'
import { formatPrice, printCertificate } from '../lib/utils'
import type { AdminCourse } from '../lib/api/auth'

export default function MyLearning() {
  const { currentUser, enrollments } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState('all')
  const user = currentUser!

  const mine = useMemo(() => enrollments.filter((e) => e.userId === user.id), [enrollments, user.id])
  const list = mine.filter((e) => tab === 'all' || (tab === 'active' && e.status === 'active') || (tab === 'completed' && e.status === 'completed'))

  const tabs = [
    { id: 'all', label: t('learn.allTab', { count: mine.length }) },
    { id: 'active', label: t('learn.inProgressTab', { count: mine.filter((e) => e.status === 'active').length }) },
    { id: 'completed', label: t('learn.completedTab', { count: mine.filter((e) => e.status === 'completed').length }) }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('learn.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('learn.subtitle')}</p>
      </div>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-lg font-semibold text-ink">{t('learn.emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('learn.emptyMessage')}</p>
          <Link to="/courses" className="btn-primary mt-4">{t('learn.browseCourses')}</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((en) => {
            const course = en.course
            if (!course) return null
            return (
              <div key={en.id} className="card flex flex-col overflow-hidden">
                <div className="relative aspect-video bg-brand-900">
                  <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-surface/95 px-2 py-0.5 text-xs font-semibold text-ink">{en.progress}%</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="line-clamp-1 font-semibold text-ink">{course.title}</p>
                  <Rating value={course.rating} size="xs" />
                  <ProgressBar value={en.progress} className="my-1" />
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t('learn.learnedHours', { count: Math.round(en.progress / 100 * course.duration) })}</span>
                    {en.status === 'completed' ? (
                      <span className="flex items-center gap-1 font-medium text-success"><Award className="h-3.5 w-3.5" /> {t('learn.completed')}</span>
                    ) : null}
                  </div>
                  <button
                    onClick={() => nav(`/learning/${course.id}`)}
                    className="btn-primary mt-2 w-full"
                  >
                    {en.status === 'completed' ? t('learn.reviewCourse') : <>{t('learn.continue')} <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Wishlist() {
  const { currentUser, wishlist, removeFromCart, cart, addToCart, toast, enrollments } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [all, setAll] = useState<AdminCourse[]>([])
  useEffect(() => {
    publicApi.listCourses().then((r) => setAll(r.courses)).catch(() => {})
  }, [])
  const courses = all.filter((c) => wishlist.includes(c.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('wish.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('wish.saved', { count: courses.length })}</p>
      </div>
      {courses.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-lg font-semibold text-ink">{t('wish.emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('wish.emptyMessage')}</p>
          <Link to="/courses" className="btn-primary mt-4">{t('wish.exploreCourses')}</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const inCart = cart.includes(course.id)
            const enrolled = currentUser && enrollments.some((e) => e.userId === currentUser.id && e.courseId === course.id)
            return (
              <div key={course.id} className="card flex flex-col overflow-hidden">
                <button onClick={() => nav(`/courses/${course.slug}`)} className="relative aspect-video bg-brand-900">
                  <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                  <Badge color="brand" className="absolute bottom-2 left-2">{t(`cards.level_${course.level.toLowerCase()}`)}</Badge>
                </button>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <button onClick={() => nav(`/courses/${course.slug}`)} className="line-clamp-1 text-left font-semibold text-ink hover:text-brand-700">{course.title}</button>
                  <Rating value={course.rating} size="xs" count={course.reviewCount} />
                  <p className="mt-auto text-sm font-bold text-ink">{formatPrice(course.discountPrice ?? course.price)}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        if (inCart) { removeFromCart(course.id); toast(t('wish.removedFromCart'), course.title) }
                        else { addToCart(course.id); toast(t('wish.addedToCart'), course.title, 'info') }
                      }}
                      className="btn-primary flex-1"
                    >
                      {inCart ? t('wish.inCart') : t('wish.addToCart')}
                    </button>
                    <button onClick={() => { removeFromCart(course.id); toast(t('wish.removedFromWishlist'), course.title) }} className="btn-outline px-3" aria-label={t('wish.removedFromWishlist')}>✕</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Certificates() {
  const { currentUser, certificates } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const mine = certificates.filter((c) => c.userId === currentUser!.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('mycert.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('mycert.subtitle')}</p>
      </div>
      {mine.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-lg font-semibold text-ink">{t('mycert.emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('mycert.emptyMessage')}</p>
          <Link to="/courses" className="btn-primary mt-4">{t('mycert.findCourse')}</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
{mine.map((cert) => {
            const course = cert.course
            if (!course) return null
            return (
              <div key={cert.id} className="card overflow-hidden">
                <div className="relative border-b border-line bg-brand-900 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <img src="/logo.png" alt="HamaAcademy" className="h-10 w-auto" />
                    <Badge color="ink">{t('mycert.verified')}</Badge>
                  </div>
                  <div className="mt-8 text-center">
                    <p className="text-xs uppercase tracking-widest text-brand-200">{t('cert.ofCompletion')}</p>
                    <p className="mt-3 font-display text-2xl font-bold">{course.title}</p>
                    <p className="mt-2 text-sm text-brand-200">{t('mycert.awardedTo', { name: currentUser!.name })}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between text-[11px] text-brand-200">
                    <span>ID: {cert.verificationCode || cert.id}</span>
                    <span>{new Date(cert.completionDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 p-4">
                  <button onClick={() => nav(`/certificates/${cert.id}`)} className="btn-primary flex-1">{t('mycert.viewCertificate')}</button>
                  <button
                    onClick={() => {
                      printCertificate({
                        title: course.title,
                        studentName: currentUser!.name,
                        verificationCode: cert.verificationCode || cert.id,
                        completionDate: cert.completionDate,
                        certId: cert.id
                      })
                    }}
                    className="btn-outline flex-1"
                  >
                    {t('mycert.download')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CertificateView() {
  return <></>
}

export function Orders() {
  const { currentUser, orders } = useApp()
  const { t } = useTranslation()
  const mine = orders.filter((o) => o.userId === currentUser!.id)

  const statusColor = (s: string) => s === 'completed' ? 'success' : s === 'pending' ? 'warning' : s === 'refunded' ? 'brand' : 'danger'
  const statusLabel = (s: string) => s === 'completed' ? t('orders.completed') : s === 'pending' ? t('orders.pending') : s === 'refunded' ? t('orders.refunded') : t('orders.failed')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('orders.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('orders.subtitle')}</p>
      </div>
      {mine.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-lg font-semibold text-ink">{t('orders.emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('orders.emptyMessage')}</p>
          <Link to="/courses" className="btn-primary mt-4">{t('orders.browseCourses')}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {mine.map((o) => (
            <div key={o.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-5 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-medium text-ink">{o.id}</span>
                  <span className="text-xs text-muted">{new Date(o.date).toLocaleDateString()}</span>
                  <Badge color={statusColor(o.status)}>{statusLabel(o.status)}</Badge>
                </div>
                <div className="text-sm font-bold text-ink">{formatPrice(o.total)}</div>
              </div>
              <div className="divide-y divide-line">
                {o.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-control bg-brand-50 text-xs font-semibold text-brand-700">H</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{it.title}</p>
                      <p className="text-xs text-muted">{o.paymentMethod}</p>
                    </div>
                    <span className="text-sm font-semibold text-ink">{formatPrice(it.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}