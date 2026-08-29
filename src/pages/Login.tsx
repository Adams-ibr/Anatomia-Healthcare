import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { useApp } from '../lib/store'
import { Button, Input } from '../components/ui'
import { homePath } from '../lib/utils'

export default function Login() {
  const { login, toast } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await login(email, password)
    setLoading(false)
    if (!res.ok || !res.user) {
      setError(res.error ?? t('auth.login.invalid'))
      return
    }
    toast(t('auth.login.welcomeBack'), t('auth.login.welcomeBody', { name: res.user.name.split(' ')[0] }))
    const target = next && next.startsWith('/') ? next : homePath(res.user.role)
    nav(target)
  }

  const demo = (em: string, pw: string) => { setEmail(em); setPassword(pw); setError('') }

  return (
    <AuthShell
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={<>{t('auth.login.newHere')} <Link to="/register" className="font-medium text-brand-700 hover:underline">{t('auth.login.createAccount')}</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Input label={t('auth.login.email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('common.emailPlaceholder')} />
        <div>
          <label className="label-base">{t('auth.login.password')}</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-base pr-10" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label={t('auth.login.password')}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-line accent-brand-500" />
            {t('auth.login.remember')}
          </label>
          <Link to="/forgot-password" className="font-medium text-brand-700 hover:underline">{t('auth.login.forgot')}</Link>
        </div>
        {error && <p className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('auth.login.submitting') : <><LogIn className="h-4 w-4" /> {t('auth.login.submit')}</>}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-line" /> {t('auth.or')} <div className="h-px flex-1 bg-line" />
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={() => toast(t('auth.login.google'), t('auth.login.googleInfo'), 'info')}>
        <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
        {t('auth.login.google')}
      </Button>

      <div className="mt-8 rounded-card border border-line bg-surface p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t('auth.login.demoTitle')}</p>
        <div className="space-y-1.5 text-sm">
          <button onClick={() => demo('student@hamaacademy.com', 'student123')} className="block w-full rounded px-2 py-1 text-left text-muted hover:bg-line/40 hover:text-ink">{t('auth.login.demoStudent')} — student@hamaacademy.com / student123</button>
          <button onClick={() => demo('admin@hamaacademy.com', 'admin123')} className="block w-full rounded px-2 py-1 text-left text-muted hover:bg-line/40 hover:text-ink">{t('auth.login.demoAdmin')} — admin@hamaacademy.com / admin123</button>
          <button onClick={() => demo('amara.okafor@hamaacademy.com', 'student123')} className="block w-full rounded px-2 py-1 text-left text-muted hover:bg-line/40 hover:text-ink">{t('auth.login.demoInstructor')} — amara.okafor@hamaacademy.com / student123</button>
        </div>
      </div>
    </AuthShell>
  )
}