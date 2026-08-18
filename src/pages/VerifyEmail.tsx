import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { useApp } from '../lib/store'

type Status = 'verifying' | 'success' | 'error'

export default function VerifyEmail() {
  const { verifyEmail } = useApp()
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [status, setStatus] = useState<Status>('verifying')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError(t('auth.verify.errorMissing'))
      return
    }
    let cancelled = false
    verifyEmail(token).then((res) => {
      if (cancelled) return
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setError(res.error ?? t('auth.verify.errorTitle'))
      }
    })
    return () => {
      cancelled = true
    }
  }, [token, verifyEmail, t])

  return (
    <AuthShell
      title={t('auth.verify.title')}
      subtitle={status === 'verifying' ? t('auth.verify.confirming') : t('auth.verify.title')}
      footer={<Link to="/login" className="font-medium text-brand-700 hover:underline">{t('auth.verify.backToLogin')}</Link>}
    >
      <div className="card flex flex-col items-center p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-brand-500" />
            <h2 className="mt-4 font-display text-lg font-semibold text-ink">{t('auth.verify.verifyingTitle')}</h2>
            <p className="mt-2 text-sm text-muted">{t('auth.verify.verifyingBody')}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mb-4 rounded-full bg-success/10 p-4 text-success"><CheckCircle2 className="h-8 w-8" /></div>
            <h2 className="font-display text-lg font-semibold text-ink">{t('auth.verify.successTitle')}</h2>
            <p className="mt-2 text-sm text-muted">{t('auth.verify.successBody')}</p>
            <Link to="/login" className="btn-primary mt-6">{t('auth.verify.login')}</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mb-4 rounded-full bg-danger/10 p-4 text-danger"><XCircle className="h-8 w-8" /></div>
            <h2 className="font-display text-lg font-semibold text-ink">{t('auth.verify.errorTitle')}</h2>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <Link to="/login" className="btn-primary mt-6">{t('auth.verify.backToLogin')}</Link>
          </>
        )}
      </div>
    </AuthShell>
  )
}