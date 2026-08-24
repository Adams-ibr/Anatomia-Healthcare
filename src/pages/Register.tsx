import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, MailCheck, UserPlus } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { useApp } from '../lib/store'
import { Button, Input } from '../components/ui'
import { cn, homePath } from '../lib/utils'

export default function Register() {
  const { register, toast } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const initialRole = params.get('role') === 'instructor' ? 'instructor' : 'student'
  const next = params.get('next')
  const [role, setRole] = useState<'student' | 'instructor'>(initialRole)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError(t('auth.register.passwordTooShort')); return }
    if (password !== confirm) { setError(t('auth.register.passwordMismatch')); return }
    setLoading(true)
    const res = await register(name, email, password, role)
    setLoading(false)
    if (!res.ok) { setError(res.error ?? t('auth.register.failed')); return }
    if (res.pendingConfirmation) { setPending(email); return }
    toast(t('auth.register.created'), t('auth.register.welcomeBody', { name: res.user?.name ? res.user.name.split(' ')[0] : 'there' }))
    const target = next && next.startsWith('/') ? next : homePath(res.user?.role ?? 'student')
    nav(target)
  }

  if (pending) {
    return (
      <AuthShell
        title={t('auth.register.checkEmailTitle')}
        subtitle={t('auth.register.checkEmailBody', { email: pending })}
        footer={<><Link to="/login" className="font-medium text-brand-700 hover:underline">{t('auth.register.logIn')}</Link></>}
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success"><MailCheck className="h-8 w-8" /></div>
          <p className="text-sm text-muted">{t('auth.register.checkEmailHint')}</p>
          <Button variant="outline" className="w-full" onClick={() => setPending('')}>{t('auth.register.backToForm')}</Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={<>{t('auth.register.haveAccount')} <Link to="/login" className="font-medium text-brand-700 hover:underline">{t('auth.register.logIn')}</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(['student', 'instructor'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'rounded-control border px-4 py-2.5 text-sm font-medium capitalize transition-colors',
                role === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line bg-surface text-muted hover:text-ink'
              )}
            >
              {r === 'student' ? t('auth.register.student') : t('auth.register.instructor')}
            </button>
          ))}
        </div>
        <Input label={t('auth.register.name')} required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.register.namePlaceholder')} />
        <Input label={t('auth.register.email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('common.emailPlaceholder')} />
        <div>
          <label className="label-base">{t('auth.register.password')}</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.register.passwordHint')} className="input-base pr-10" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label={t('auth.register.password')}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Input label={t('auth.register.confirm')} type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('auth.register.confirmHint')} />
        {error && <p className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('auth.register.submitting') : <><UserPlus className="h-4 w-4" /> {t('auth.register.submit')}</>}
        </Button>
        <p className="text-xs text-muted">{t('auth.register.terms')}</p>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-line" /> {t('auth.or')} <div className="h-px flex-1 bg-line" />
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={() => toast(t('auth.login.google'), t('auth.login.googleInfo'), 'info')}>
        <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
        {t('auth.register.google')}
      </Button>
    </AuthShell>
  )
}