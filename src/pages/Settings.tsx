import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, LogOut, RotateCcw, Shield, Trash2, User } from 'lucide-react'
import { useApp } from '../lib/store'
import { Avatar, Button, Input } from '../components/ui'
import { cn } from '../lib/utils'

function Toggle({ on }: { on: boolean }) {
  return (
    <button className={cn('relative h-6 w-11 rounded-full transition-colors', on ? 'bg-brand-500' : 'bg-line')} aria-label="Toggle">
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

export default function SettingsPage() {
  const { currentUser, updateProfile, changePassword, deleteAccount, toast, logout, resetAll } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = currentUser!
  const [tab, setTab] = useState('account')
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio ?? '')
  const [skills, setSkills] = useState((user.skills ?? []).join(', '))
  const [accountError, setAccountError] = useState('')
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [changing, setChanging] = useState(false)

  const tabs = [
    { id: 'account', label: t('settings.account'), icon: <User className="h-4 w-4" /> },
    { id: 'notifications', label: t('settings.notifications'), icon: <Bell className="h-4 w-4" /> },
    { id: 'privacy', label: t('settings.privacy'), icon: <Shield className="h-4 w-4" /> },
    { id: 'security', label: t('settings.security'), icon: <LogOut className="h-4 w-4" /> }
  ]

  const saveProfile = async () => {
    setSaving(true)
    setAccountError('')
    const res = await updateProfile({ name, bio, skills: skills.split(',').map((s) => s.trim()).filter(Boolean) })
    setSaving(false)
    if (res.ok) {
      toast(t('settings.saved'), t('settings.saved'))
    } else {
      setAccountError(res.error ?? t('settings.saveFailed'))
    }
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('settings.title')}</h1>
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
              <div className="flex items-center gap-3">
                <Avatar name={user.name} size="lg" />
                <Button variant="outline" onClick={() => toast(t('settings.changePhoto'), t('settings.photoInfo'), 'info')}>{t('settings.changePhoto')}</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={t('settings.fullName')} value={name} onChange={(e) => setName(e.target.value)} />
                <Input label={t('settings.email')} value={user.email} disabled />
              </div>
              <div>
                <label className="label-base">{t('settings.bio')}</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input-base" placeholder={t('settings.bioPlaceholder')} />
              </div>
              <Input label={t('settings.skills')} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder={t('settings.skillsPlaceholder')} />
              {accountError && <p className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{accountError}</p>}
              <Button onClick={saveProfile} disabled={saving}>{saving ? t('settings.saving') : t('settings.saveChanges')}</Button>
            </div>
          )}
          {tab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold text-ink">{t('settings.notifHeading')}</h2>
              {[
                ['emailNotifications', 'emailNotificationsDesc', true],
                ['courseNotifications', 'courseNotificationsDesc', true],
                ['assignmentNotifications', 'assignmentNotificationsDesc', true],
                ['marketingNotifications', 'marketingNotificationsDesc', false]
              ].map(([label, desc, on]) => (
                <div key={label as string} className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <p className="text-sm font-medium text-ink">{t(`settings.${label}`)}</p>
                    <p className="text-xs text-muted">{t(`settings.${desc}`)}</p>
                  </div>
                  <Toggle on={on as boolean} />
                </div>
              ))}
              <Button onClick={() => toast(t('settings.preferencesSaved'))}>{t('settings.savePreferences')}</Button>
            </div>
          )}
          {tab === 'privacy' && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold text-ink">{t('settings.privacyHeading')}</h2>
              {[
                ['publicProfile', 'publicProfileDesc', true],
                ['showLearning', 'showLearningDesc', true],
                ['showSkills', 'showSkillsDesc', true]
              ].map(([label, desc, on]) => (
                <div key={label as string} className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <p className="text-sm font-medium text-ink">{t(`settings.${label}`)}</p>
                    <p className="text-xs text-muted">{t(`settings.${desc}`)}</p>
                  </div>
                  <Toggle on={on as boolean} />
                </div>
              ))}
              <Button onClick={() => toast(t('settings.privacySaved'))}>{t('settings.privacySaved')}</Button>
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
              <div className="flex items-center justify-between rounded-card border border-line bg-paper p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{t('settings.twoFactor')}</p>
                  <p className="text-xs text-muted">{t('settings.twoFactorDesc')}</p>
                </div>
                <Toggle on={false} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-ink">{t('settings.activeSessions')}</p>
                <div className="rounded-card border border-line p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink">{t('settings.thisDevice')}</p>
                      <p className="text-xs text-muted">{t('settings.currentSession')}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-success"><span className="h-2 w-2 rounded-full bg-success" /> {t('settings.active')}</span>
                  </div>
                </div>
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { if (window.confirm(t('settings.resetConfirm'))) resetAll() }}><RotateCcw className="h-4 w-4" /> {t('settings.resetDemo')}</Button>
                  <Button variant="outline" onClick={removeAccount} className="text-danger"><Trash2 className="h-4 w-4" /> {t('settings.deleteAccount')}</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}