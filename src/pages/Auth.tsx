import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, KeyRound, MailCheck } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { useApp } from '../lib/store'
import { Button, Input } from '../components/ui'

export default function ForgotPassword() {
  const { forgotPassword, toast } = useApp()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await forgotPassword(email)
    setLoading(false)
    if (!res.ok) { setError(res.error ?? t('auth.forgot.failed')); return }
    setSent(true)
    toast(t('auth.forgot.sentToast'), t('auth.forgot.sentToastBody', { email }), 'info')
  }

  return (
    <AuthShell
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
      footer={<Link to="/login" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" /> {t('auth.forgot.backToLogin')}</Link>}
    >
      {sent ? (
        <div className="card flex flex-col items-center p-8 text-center">
          <div className="mb-4 rounded-full bg-success/10 p-4 text-success"><MailCheck className="h-8 w-8" /></div>
          <h2 className="font-display text-lg font-semibold text-ink">{t('auth.forgot.sentTitle')}</h2>
          <p className="mt-2 text-sm text-muted">{t('auth.forgot.sentBody', { email })}</p>
          <Link to="/login" className="btn-primary mt-6">{t('auth.forgot.backToLogin')}</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input label={t('auth.forgot.email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          {error && <p className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">{loading ? t('auth.forgot.sending') : t('auth.forgot.send')}</Button>
        </form>
      )}
    </AuthShell>
  )
}

export function ResetPassword() {
  const { resetPassword, toast } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <AuthShell
        title={t('auth.reset.invalidTitle')}
        subtitle={t('auth.reset.invalidSubtitle')}
        footer={<Link to="/login" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" /> {t('auth.forgot.backToLogin')}</Link>}
      >
        <div className="card flex flex-col items-center p-8 text-center">
          <div className="mb-4 rounded-full bg-danger/10 p-4 text-danger"><KeyRound className="h-8 w-8" /></div>
          <h2 className="font-display text-lg font-semibold text-ink">{t('auth.reset.linkNotRecognized')}</h2>
          <p className="mt-2 text-sm text-muted">{t('auth.reset.invalidBody')}</p>
          <Link to="/forgot-password" className="btn-primary mt-6">{t('auth.reset.requestNew')}</Link>
        </div>
      </AuthShell>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError(t('auth.reset.passwordTooShort')); return }
    if (password !== confirm) { setError(t('auth.reset.passwordMismatch')); return }
    setLoading(true)
    const res = await resetPassword(token, password)
    setLoading(false)
    if (!res.ok) { setError(res.error ?? t('auth.reset.failed')); return }
    toast(t('auth.reset.updated'), t('auth.reset.updatedBody'))
    nav('/login')
  }

  return (
    <AuthShell
      title={t('auth.reset.title')}
      subtitle={t('auth.reset.subtitle')}
      footer={<Link to="/login" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" /> {t('auth.forgot.backToLogin')}</Link>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Input label={t('auth.reset.newPassword')} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.reset.confirmHint')} />
        <Input label={t('auth.reset.confirmNew')} type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('auth.reset.confirmHint')} />
        {error && <p className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">{loading ? t('auth.reset.submitting') : t('auth.reset.submit')}</Button>
      </form>
    </AuthShell>
  )
}