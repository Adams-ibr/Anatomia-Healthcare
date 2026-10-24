import { useCallback, useEffect, useState } from 'react'
import { Loader2, Mail, Plus, Trash2, Users } from 'lucide-react'
import { useApp } from '../lib/store'
import { newsletterApi } from '../lib/supabase'
import { Button, EmptyState } from '../components/ui'
import { formatDate } from '../lib/utils'

interface Subscriber {
  id: string
  email: string
  created_at: string | null
}

export default function AdminNewsletter() {
  const { toast } = useApp()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSubscribers((await newsletterApi.list()) as Subscriber[])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load subscribers.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const add = async () => {
    const normalized = email.trim().toLowerCase()
    if (!normalized || mutating) return
    setMutating(true)
    try {
      await newsletterApi.create(normalized)
      setEmail('')
      toast('Success', 'Subscriber added')
      await load()
    } catch (reason) {
      const message = reason instanceof Error && reason.message.includes('duplicate')
        ? 'This email is already subscribed.'
        : reason instanceof Error ? reason.message : 'Unable to add subscriber.'
      toast('Unable to add subscriber', message, 'error')
    } finally {
      setMutating(false)
    }
  }

  const remove = async (subscriber: Subscriber) => {
    if (mutating) return
    setMutating(true)
    try {
      await newsletterApi.delete(subscriber.id)
      toast('Success', 'Subscriber removed')
      await load()
    } catch (reason) {
      toast('Unable to remove subscriber', reason instanceof Error ? reason.message : 'Please try again.', 'error')
    } finally {
      setMutating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Newsletter Subscribers</h1>
        <p className="mt-1 text-sm text-muted">Manage people who receive platform updates.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <span className="rounded-card bg-brand-50 p-2.5 text-brand-700"><Users className="h-5 w-5" /></span>
          <div><p className="text-2xl font-bold text-ink">{subscribers.length}</p><p className="text-xs text-muted">Subscribers</p></div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-semibold text-ink">Add a subscriber</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') void add() }}
            placeholder="name@example.com"
            className="input-base flex-1"
          />
          <Button onClick={() => void add()} disabled={!email.trim() || mutating}>
            {mutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Subscriber
          </Button>
        </div>
      </div>

      {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"><span>{error}</span><Button variant="outline" onClick={() => void load()}>Retry</Button></div>}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading subscribers…</div>
        ) : subscribers.length === 0 ? (
          <EmptyState icon={<Mail className="h-6 w-6" />} title="No subscribers yet" message="Add a subscriber or collect signups from the website." />
        ) : (
          <div className="divide-y divide-line">
            {subscribers.map((subscriber) => (
              <div key={subscriber.id} className="flex items-center justify-between gap-4 p-4">
                <div><p className="font-medium text-ink">{subscriber.email}</p><p className="mt-1 text-xs text-muted">Subscribed {subscriber.created_at ? formatDate(subscriber.created_at) : '—'}</p></div>
                <Button variant="outline" onClick={() => void remove(subscriber)} disabled={mutating} aria-label={`Remove ${subscriber.email}`}><Trash2 className="h-4 w-4 text-danger" /> Remove</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
