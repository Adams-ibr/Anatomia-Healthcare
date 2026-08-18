import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award, CheckCircle2, Download, Link2, QrCode, Share2 } from 'lucide-react'
import { COURSES } from '../lib/data'
import { useApp } from '../lib/store'
import { Button } from '../components/ui'
import { formatDate } from '../lib/utils'

export function CertificateDetail() {
  const { id } = useParams()
  const { certificates, currentUser } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const cert = certificates.find((c) => c.id === id)
  const course = cert ? COURSES.find((c) => c.id === cert.courseId) : null

  if (!cert || !course) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('cert.notFound')}</h1>
        <Button className="mt-4" onClick={() => nav('/certificates')}>{t('cert.myCertificates')}</Button>
      </div>
    )
  }

  const lessonCount = course.sections.reduce((a, s) => a + s.lessons.length, 0)

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('cert.title')}</h1>
          <p className="mt-1 text-sm text-muted">{course.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(window.location.href); alert(t('cert.linkCopied')) }}><Link2 className="h-4 w-4" /> {t('cert.share')}</Button>
          <Button><Download className="h-4 w-4" /> {t('cert.downloadPdf')}</Button>
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
            <p className="mt-6 text-sm text-muted">{t('cert.sectionsLessons', { sections: course.sections.length, lessons: lessonCount })}</p>
            <div className="mx-auto mt-10 flex max-w-md items-end justify-between border-t border-line pt-6 text-left">
              <div>
                <p className="text-xs font-semibold text-ink">{t('cert.completionDate')}</p>
                <p className="mt-0.5 text-sm text-muted">{formatDate(cert.completionDate)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-ink">{t('cert.certId')}</p>
                <p className="mt-0.5 font-mono text-sm text-muted">{cert.id}</p>
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
        <Button variant="outline" onClick={() => nav(`/verify-certificate/${cert.id}`)}>{t('cert.viewPublic')}</Button>
      </div>
    </div>
  )
}

export function VerifyCertificate() {
  const { id } = useParams()
  const { certificates } = useApp()
  const { t } = useTranslation()
  const cert = id ? certificates.find((c) => c.id === id) : null
  const course = cert ? COURSES.find((c) => c.id === cert.courseId) : null

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('cert.verifyTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{t('cert.verifySubtitle')}</p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); const v = (e.currentTarget.elements.namedItem('cid') as HTMLInputElement).value; window.location.href = `/verify-certificate/${encodeURIComponent(v)}` }}
        >
          <input name="cid" placeholder={t('cert.verifyPlaceholder')} className="input-base" />
          <Button type="submit">{t('cert.verify')}</Button>
        </form>

        {id && (
          cert && course ? (
            <div className="card mt-8 p-8 text-left">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">{t('cert.verified')}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{t('cert.genuine')}</p>
              <div className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
                <div className="flex justify-between"><span className="text-muted">{t('cert.fieldCertificate')}</span><span className="font-mono font-medium text-ink">{cert.id}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t('cert.fieldCourse')}</span><span className="font-medium text-ink">{course.title}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t('cert.fieldStudent')}</span><span className="font-medium text-ink">{cert.userId === 'u_st_1' ? 'John Adedeji' : t('cert.student')}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t('cert.fieldIssued')}</span><span className="font-medium text-ink">{formatDate(cert.issuedAt)}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t('cert.fieldCode')}</span><span className="font-mono font-medium text-ink">{cert.verificationCode}</span></div>
              </div>
              <div className="mt-5 flex items-center justify-center rounded-card bg-paper py-5">
                <Award className="h-12 w-12 text-brand-500" />
              </div>
            </div>
          ) : (
            <div className="card mt-8 p-8">
              <p className="font-semibold text-danger">{t('cert.unable')}</p>
              <p className="mt-1 text-sm text-muted">{t('cert.noMatch', { id })}</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}