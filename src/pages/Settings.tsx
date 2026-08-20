import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Check, LogOut, Shield, Trash2, User } from 'lucide-react'
import { useApp } from '../lib/store'
import { Avatar, Button, Input } from '../components/ui'
import { authApi, getStoredToken } from '../lib/api/auth'
import type { UserPreferences } from '../lib/api/auth'
import { LANGUAGES } from '../lib/i18n/languages'
import { cn } from '../lib/utils'

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-brand-500' : 'bg-line')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

const DEFAULT_PREFS: UserPreferences = {
  emailNotifications: true,
  courseNotifications: true,
  assignmentNotifications: true,
  marketingNotifications: false,
  publicProfile: true,
  showLearning: true,
  showSkills: true,
  language: 'en'
}

export default function SettingsPage() {
  const { currentUser, updateProfile, changePassword, deleteAccount, toast, logout, updatePreferences, changeEmail, uploadAvatar, revokeSessions } = useApp()
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const user = currentUser!
  const token = getStoredToken()

  const [tab, setTab] = useState('account')
  const [name, setName] = useState(user.name)
  const [headline, setHeadline] = useState(user.headline ?? '')
  const [website, setWebsite] = useState(user.website ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [skills, setSkills] = useState((user.skills ?? []).join(', '))
  const [accountError, setAccountError] = useState('')
  const [saving, setSaving] = useState(false)

  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)

  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [prefsBusy, setPrefsBusy] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [changing, setChanging] = useState(false)

  const [sessions, setSessions] = useState<{ id: string; userAgent: string; ip: string; createdAt: string; lastSeenAt: string; current: boolean; revoked?: boolean }[] | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    authApi.getPreferences(token).then((res) => {
      if (cancelled) return
      setPrefs(res.preferences)
      if (LANGUAGES.some((l) => l.code === res.preferences.language) && i18n.language !== res.preferences.language) {
        i18n.changeLanguage(res.preferences.language)
      }
    }).catch(() => {})
    authApi.listSessions(token).then((res) => {
      if (!cancelled) setSessions(res.sessions)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [token, i18n])

  const tabs = [
    { id: 'account', label: t('settings.account'), icon: <User className="h-4 w-4" /> },
    { id: 'notifications', label: t('settings.notifications'), icon: <Bell className="h-4 w-4" /> },
    { id: 'privacy', label: t('settings.privacy'), icon: <Shield className="h-4 w-4" /> },
    { id: 'security', label: t('settings.security'), icon: <LogOut className="h-4 w-4" /> }
  ]

  const saveProfile = async () => {
    setSaving(true)
    setAccountError('')
    const res = await updateProfile({ name, headline, website, bio, skills: skills.split(',').map((s) => s.trim()).filter(Boolean) })
    setSaving(false)
    if (res.ok) {
      toast(t('settings.saved'))
    } else {
      setAccountError(res.error ?? t('settings.saveFailed'))
    }
  }

  const pickAvatar = () => fileRef.current?.click()

  const onAvatarFile = async (file: File | null) => {
    if (!file) return
    if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(file.type)) { toast(t('settings.photoInvalid'), undefined, 'error'); return }
    if (file.size > 2 * 1024 * 1024) { toast(t('settings.photoTooLarge'), undefined, 'error'); return }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const res = await uploadAvatar(String(reader.result))
      setUploading(false)
      if (res.ok) toast(t('settings.photoUpdated'))
      else toast(res.error ?? t('settings.photoFailed'), undefined, 'error')
    }
    reader.onerror = () => { setUploading(false); toast(t('settings.photoFailed'), undefined, 'error') }
    reader.readAsDataURL(file)
  }

  const submitEmail = async () => {
    setEmailMsg('')
    setEmailError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailError(t('settings.emailRequired')); return }
    if (newEmail.toLowerCase() === user.email.toLowerCase()) { setEmailError(t('settings.emailSame')); return }
    if (!emailPassword) { setEmailError(t('settings.passwordRequired')); return }
    setEmailBusy(true)
    const res = await changeEmail(newEmail, emailPassword)
    setEmailBusy(false)
    if (res.ok) {
      setEmailMsg(t('settings.emailUpdated'))
      setNewEmail('')
      setEmailPassword('')
    } else {
      setEmailError(res.error ?? t('settings.emailChangeFailed'))
    }
  }

  const patchPrefs = (p: Partial<UserPreferences>) => setPrefs((s) => ({ ...(s ?? DEFAULT_PREFS), ...p }))

  const savePrefs = async (p?: Partial<UserPreferences>) => {
    const next = p ? { ...(prefs ?? DEFAULT_PREFS), ...p } : prefs
    if (!next) return
    setPrefsBusy(true)
    const res = await updatePreferences(next)
    setPrefsBusy(false)
    if (res.ok) toast(t('settings.preferencesSaved'))
    else toast(res.error ?? t('settings.saveFailed'), undefined, 'error')
  }

  const setLanguage = async (code: string) => {
    i18n.changeLanguage(code)
    patchPrefs({ language: code })
    await savePrefs({ language: code })
  }

  const changePw = async () => {
    setSecurityError('')
    if (newPassword.length < 8) { setSecurityError(t('settings.passwordTooShort')); return }
    if (newPassword !== confirmPassword) { setSecurityError(t('settings.passwordMismatch')); return }
    setChanging(true)
    const res = await changePassword(currentPassword, newPassword)
    setChanging(false)
    if (res.ok) {
      toast(t('settings.passwordUpdated'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setSecurityError(res.error ?? t('settings.updateFailed'))
    }
  }

  const revokeOthers = async () => {
    if (!window.confirm(t('settings.revokeConfirm'))) return
    setRevoking(true)
    const res = await revokeSessions()
    setRevoking(false)
    if (res.ok) {
      toast(t('settings.othersRevoked'))
      if (token) authApi.listSessions(token).then((r) => setSessions(r.sessions)).catch(() => {})
    } else {
      toast(res.error ?? t('settings.revokeFailed'), undefined, 'error')
    }
  }

  const removeAccount = async () => {
    if (!window.confirm(t('settings.deleteConfirm'))) return
    const res = await deleteAccount()
    if (res.ok) {
      toast(t('settings.accountDeleted'))
      nav('/')
    } else {
      toast(t('settings.deleteFailed'), res.error, 'error')
    }
  }

  const signOut = async () => {
    await logout()
    nav('/')
  }

  const toggleRow = (label: string, desc: string, on: boolean, toggle: () => void) => (
    <div className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <Toggle on={on} onToggle={toggle} />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('settings.manageAccount')}</h1>
        <p className="mt-1 text-sm text-muted">{t('settings.subtitle')}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
          {tabs.map((tabItem) => (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)} className={cn('flex items-center gap-2 whitespace-nowrap rounded-control px-3 py-2 text-left text-sm font-medium', tab === tabItem.id ? 'bg-brand-50 text-brand-700' : 'text-muted hover:text-ink')}>
              {tabItem.icon}{tabItem.label}
            </button>
          ))}
        </div>
        <div className="card p-6">
          {tab === 'account' && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold text-ink">{t('settings.accountDetails')}</h2>
              <div className="flex items-center gap-4">
                <Avatar name={user.name} src={user.avatar} size="xl" />
                <div>
                  <Button variant="outline" onClick={pickAvatar} disabled={uploading}>{uploading ? t('settings.photoUploading') : t('settings.changePhoto')}</Button>
                  <p className="mt-1 text-xs text-muted">{t('settings.photoHint')}</p>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={t('settings.fullName')} value={name} onChange={(e) => setName(e.target.value)} />
                <Input label={t('settings.headline')} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={t('settings.headlinePlaceholder')} />
              </div>
              <Input label={t('settings.website')} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
              <div>
                <label className="label-base">{t('settings.bio')}</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input-base" placeholder={t('settings.bioPlaceholder')} />
              </div>
              <Input label={t('settings.skills')} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder={t('settings.skillsPlaceholder')} />
              {accountError && <p className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{accountError}</p>}
              <Button onClick={saveProfile} disabled={saving}>{saving ? t('settings.saving') : t('settings.saveChanges')}</Button>

              <div className="border-t border-line pt-5">
                <h3 className="mb-2 text-sm font-semibold text-ink">{t('settings.emailHeading')}</h3>
                <p className="mb-3 text-xs text-muted">{t('settings.emailDesc')}</p>
                <div className="mb-3 flex items-center gap-3 rounded-card bg-paper px-4 py-3 text-sm">
                  <span className="text-muted">{t('settings.email')}</span>
                  <span className="font-medium text-ink">{user.email}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label={t('settings.newEmail')} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@example.com" />
                  <Input label={t('settings.confirmPasswordShort')} type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} placeholder="••••••••" />
                </div>
                {emailError && <p className="mt-2 rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{emailError}</p>}
                {emailMsg && <p className="mt-2 rounded-card border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">{emailMsg}</p>}
                <Button className="mt-3" variant="outline" onClick={submitEmail} disabled={emailBusy}>{emailBusy ? t('settings.saving') : t('settings.updateEmail')}</Button>
              </div>

              <div className="border-t border-line pt-5">
                <h3 className="mb-2 text-sm font-semibold text-ink">{t('settings.language')}</h3>
                <p className="mb-3 text-xs text-muted">{t('settings.languageDesc')}</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <button key={l.code} onClick={() => setLanguage(l.code)} className={cn('flex items-center gap-2 rounded-control border px-3 py-2 text-sm font-medium', (prefs?.language ?? i18n.language) === l.code ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-muted hover:text-ink')}>
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                      {(prefs?.language ?? i18n.language) === l.code && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold text-ink">{t('settings.notifHeading')}</h2>
              <p className="text-sm text-muted">{t('settings.notifDesc')}</p>
              <div className="mt-2">
                {toggleRow(t('settings.emailNotifications'), t('settings.emailNotificationsDesc'), prefs?.emailNotifications ?? true, () => patchPrefs({ emailNotifications: !prefs?.emailNotifications }))}
                {toggleRow(t('settings.courseNotifications'), t('settings.courseNotificationsDesc'), prefs?.courseNotifications ?? true, () => patchPrefs({ courseNotifications: !prefs?.courseNotifications }))}
                {toggleRow(t('settings.assignmentNotifications'), t('settings.assignmentNotificationsDesc'), prefs?.assignmentNotifications ?? true, () => patchPrefs({ assignmentNotifications: !prefs?.assignmentNotifications }))}
                {toggleRow(t('settings.marketingNotifications'), t('settings.marketingNotificationsDesc'), prefs?.marketingNotifications ?? false, () => patchPrefs({ marketingNotifications: !prefs?.marketingNotifications }))}
              </div>
              <Button onClick={() => savePrefs()} disabled={prefsBusy || !prefs}>{prefsBusy ? t('settings.saving') : t('settings.savePreferences')}</Button>
            </div>
          )}
          {tab === 'privacy' && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold text-ink">{t('settings.privacyHeading')}</h2>
              <p className="text-sm text-muted">{t('settings.privacyDesc')}</p>
              <div className="mt-2">
                {toggleRow(t('settings.publicProfile'), t('settings.publicProfileDesc'), prefs?.publicProfile ?? true, () => patchPrefs({ publicProfile: !prefs?.publicProfile }))}
                {toggleRow(t('settings.showLearning'), t('settings.showLearningDesc'), prefs?.showLearning ?? true, () => patchPrefs({ showLearning: !prefs?.showLearning }))}
                {toggleRow(t('settings.showSkills'), t('settings.showSkillsDesc'), prefs?.showSkills ?? true, () => patchPrefs({ showSkills: !prefs?.showSkills }))}
              </div>
              <Button onClick={() => savePrefs()} disabled={prefsBusy || !prefs}>{prefsBusy ? t('settings.saving') : t('settings.privacySaved')}</Button>
            </div>
          )}
          {tab === 'security' && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold text-ink">{t('settings.security')}</h2>
              <div className="space-y-4">
                <Input label={t('settings.currentPassword')} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label={t('settings.newPassword')} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('settings.passwordTooShort')} />
                  <Input label={t('settings.confirmNewPassword')} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('settings.confirmNewPassword')} />
                </div>
              </div>
              {securityError && <p className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{securityError}</p>}
              <Button onClick={changePw} disabled={changing}>{changing ? t('settings.updating') : t('settings.updatePassword')}</Button>

              <div className="border-t border-line pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{t('settings.activeSessions')}</h3>
                    <p className="text-xs text-muted">{t('settings.sessionsDesc')}</p>
                  </div>
                  <Button variant="outline" onClick={revokeOthers} disabled={revoking || (sessions ?? []).length <= 1}>{revoking ? t('settings.saving') : t('settings.revokeOthers')}</Button>
                </div>
                {sessions === null ? (
                  <p className="rounded-card border border-line p-4 text-sm text-muted">{t('settings.loadingSessions')}</p>
                ) : sessions.length === 0 ? (
                  <p className="rounded-card border border-line p-4 text-sm text-muted">{t('settings.sessionsEmpty')}</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((s) => (
                      <div key={s.id} className={cn('flex items-center justify-between rounded-card border border-line p-4 text-sm', s.revoked && 'opacity-60')}>
                        <div>
                          <p className="font-medium text-ink">{s.userAgent || t('settings.unknownDevice')}</p>
                          <p className="text-xs text-muted">{s.ip || '—'} · {new Date(s.lastSeenAt).toLocaleString()}</p>
                        </div>
                        {s.revoked ? (
                          <span className="text-xs text-muted">{t('settings.signedOut')}</span>
                        ) : s.current ? (
                          <span className="flex items-center gap-1 text-xs text-success"><span className="h-2 w-2 rounded-full bg-success" /> {t('settings.currentSession')}</span>
                        ) : (
                          <span className="text-xs text-muted">{t('settings.otherDevice')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
                <div>
                  <p className="text-sm font-medium text-ink">{t('settings.session')}</p>
                  <p className="text-xs text-muted">{t('settings.signOutDesc')}</p>
                </div>
                <Button variant="outline" onClick={signOut} className="text-danger">{t('settings.signOut')}</Button>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
                <div>
                  <p className="text-sm font-medium text-danger">{t('settings.dangerZone')}</p>
                  <p className="text-xs text-muted">{t('settings.dangerZoneDesc')}</p>
                </div>
                <Button variant="outline" onClick={removeAccount} className="text-danger"><Trash2 className="h-4 w-4" /> {t('settings.deleteAccount')}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}