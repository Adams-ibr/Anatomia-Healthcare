import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Award, Bell, Check } from 'lucide-react'
import { useApp } from '../lib/store'
import { Button, Tabs } from '../components/ui'
import { cn, timeAgo } from '../lib/utils'

export default function NotificationsPage() {
  const { currentUser, notifications, markNotificationsRead } = useApp()
  const { t } = useTranslation()
  const [tab, setTab] = useState('all')
  const mine = notifications.filter((n) => n.userId === currentUser!.id)
  const list = mine.filter((n) => tab === 'all' || (tab === 'unread' && !n.read))
  const unreadCount = mine.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('notif.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('notif.unread', { count: unreadCount })}</p>
        </div>
        <Button variant="outline" onClick={markNotificationsRead}><Check className="h-4 w-4" /> {t('notif.markAllRead')}</Button>
      </div>
      <Tabs tabs={[{ id: 'all', label: t('notif.all') }, { id: 'unread', label: t('notif.unreadTab', { count: unreadCount }) }]} active={tab} onChange={setTab} />
      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-lg font-semibold text-ink">{t('notif.emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('notif.emptyBody')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((n) => (
            <Link key={n.id} to={n.link ?? '#'} className={cn('card flex items-start gap-3 p-4 transition-shadow hover:shadow-lift', !n.read && 'border-brand-200 bg-brand-50/40')}>
              <div className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', n.read ? 'bg-line' : 'bg-brand-500')} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                <p className="mt-0.5 text-sm text-muted">{n.message}</p>
                <p className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</p>
              </div>
              {n.type === 'certificate' && <Award className="h-5 w-5 text-warning" />}
              {n.type === 'assignment' && <AlertCircle className="h-5 w-5 text-danger" />}
              {n.type === 'system' && <Bell className="h-5 w-5 text-brand-500" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}