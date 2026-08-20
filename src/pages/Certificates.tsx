import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award, CheckCircle2, Download, Link2, Loader2, QrCode, Share2 } from 'lucide-react'
import { COURSES } from '../lib/data'
import { useApp } from '../lib/store'
import { authApi } from '../lib/api/auth'
import { Button } from '../components/ui'
import { formatDate, printCertificate } from '../lib/utils'
import type { PublicCertificate } from '../lib/api/auth'

export function CertificateDetail() {
  const { id } = useParams()
  const { certificates, currentUser } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const cert = certificates.find((c) => c.id === id)
  const course = cert ? cert.course ?? COURSES.find((c) => c.id === cert.courseId) : null

  if (!cert || !course) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('cert.notFound')}</h1>
        <Button className="mt-4" onClick={() => nav('/certificates')}>{t('cert.myCertificates')}</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('cert.title')}</h1>
          <p className="mt-1 text-sm text-muted">{course.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(window.location.href); alert(t('cert.linkCopied')) }}><Link2 className="h-4 w-4" /> {t('cert.share')}</Button>
          <Button
            onClick={() => printCertificate({
              title: course.title,
              studentName: currentUser?.name ?? t('cert.student'),
              verificationCode: cert.verificationCode || cert.id,
              completionDate: cert.completionDate,
              certId: cert.id
            })}
          >
            <Download className="h-4 w-4" /> {t('cert.downloadPdf')}
          </Button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="relative border border-line bg-[#FBF9F3] p-8 sm:p-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1B4E9B 0 2px, transparent 2px 18px)' }} />
          <div className="relative text-center">
            <div className="mx-auto flex w-fit items-center justify-center">
              <img src="/logo.png" alt="HamaAcademy" className="h-14 w-auto" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-muted">{t('cert.ofCompletion')}</p>
            <p className="mt-8 text-sm text-muted">{t('cert.certify')}</p>
            <p className="mt-2 font-display text-3xl font-bold text-ink">{currentUser?.name ?? t('cert.student')}</p>
            <p className="mt-6 text-sm text-muted">{t('cert.completedCourse')}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-brand-700">{course.title}</p>
            <div className="mx-auto mt-10 flex max-w-md items-end justify-between border-t border-line pt-6 text-left">
              <div>
                <p className="text-xs font-semibold text-ink">{t('cert.completionDate')}</p>
                <p className="mt-0.5 text-sm text-muted">{formatDate(cert.completionDate)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-ink">{t('cert.certId')}</p>
                <p className="mt-0.5 font-mono text-sm text-muted">{cert.verificationCode || cert.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-ink">{t('cert.verification')}</p>
                <p className="mt-0.5 text-sm text-muted">{t('cert.scanToVerify')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="rounded-card bg-brand-50 p-4 text-brand-700"><QrCode className="h-10 w-10" /></div>
        <div className="flex-1">
          <p className="font-semibold text-ink">{t('cert.shareAchievement')}</p>
          <p className="mt-1 text-sm text-muted">{t('cert.shareDesc')}</p>
        </div>
        <Button variant="outline" onClick={() => nav(`/verify-certificate/${cert.verificationCode || cert.id}`)}>{t('cert.viewPublic')}</Button>
      </div>
    </div>
  )
}

export function VerifyCertificate() {
  const { id } = useParams()
  const { certificates } = useApp()
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PublicCertificate | null>(null)
  const [error, setError] = useState<string | null>(null)

  const verify = async (value: string) => {
    if (!value) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await authApi.verifyCertificate(value)
      setResult(data)
    } catch {
      const local = certificates.find((c) => c.id === value || c.verificationCode === value)
      if (local) {
        const course = COURSES.find((c) => c.id === local.courseId)
        setResult({
          certificate: {
            id: local.id,
            userId: local.userId,
            courseId: local.courseId,
            issuedAt: local.issuedAt,
            completionDate: local.completionDate,
            verificationCode: local.verificationCode
          },
          course: course ? { id: course.id, title: course.title, slug: course.slug } : null,
          student: null
        })
      } else {
        setError(t('cert.noMatch', { id: value }))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) verify(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('cert.verifyTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{t('cert.verifySubtitle')}</p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); verify(input.trim()) }}
        >
          <input name="cid" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('cert.verifyPlaceholder')} className="input-base" />
          <Button type="submit" disabled={loading || !input.trim()}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('cert.verify')}</Button>
        </form>

        {loading && (
          <div className="card mt-8 p-8">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-700" />
          </div>
        )}

        {!loading && error && (
          <div className="card mt-8 p-8">
            <p className="font-semibold text-danger">{t('cert.unable')}</p>
            <p className="mt-1 text-sm text-muted">{error}</p>
          </div>
        )}

        {!loading && result && (
          <div className="card mt-8 p-8 text-left">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">{t('cert.verified')}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{t('cert.genuine')}</p>
            <div className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
              <div className="flex justify-between"><span className="text-muted">{t('cert.fieldCertificate')}</span><span className="font-mono font-medium text-ink">{result.certificate.id}</span></div>
              <div className="flex justify-between"><span className="text-muted">{t('cert.fieldCourse')}</span><span className="font-medium text-ink">{result.course?.title ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted">{t('cert.fieldStudent')}</span><span className="font-medium text-ink">{result.student?.name ?? t('cert.student')}</span></div>
              <div className="flex justify-between"><span className="text-muted">{t('cert.fieldIssued')}</span><span className="font-medium text-ink">{formatDate(result.certificate.issuedAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted">{t('cert.fieldCode')}</span><span className="font-mono font-medium text-ink">{result.certificate.verificationCode}</span></div>
            </div>
            <div className="mt-5 flex items-center justify-center rounded-card bg-paper py-5">
              <Award className="h-12 w-12 text-brand-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}