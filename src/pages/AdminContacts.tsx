import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Archive, Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock,
  Eye, Filter, Loader2, Mail, MessageSquare, Phone, Search, Star,
  Tag, Trash2, User, X
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal } from '../components/ui'
import { cn, formatDate } from '../lib/utils'
import { contactsApi } from '../lib/supabase'

type ContactStatus = 'new' | 'read' | 'replied' | 'archived'

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  category: string
  status: ContactStatus
  isStarred: boolean
  notes?: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
}

export default function AdminContacts() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [page, setPage] = useState(1)
  const perPage = 15
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all')

  const [viewing, setViewing] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState<Contact | null>(null)
  const [addingNote, setAddingNote] = useState<Contact | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadContacts = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const rows = await contactsApi.list()
      setContacts((rows ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone ?? undefined,
        subject: row.subject || row.topic || 'Contact message',
        message: row.message,
        category: row.category || row.topic || 'General',
        status: row.status || (row.is_read ? 'read' : 'new'),
        isStarred: Boolean(row.is_starred),
        notes: row.notes ?? undefined,
        assignedTo: row.assigned_to ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? row.created_at
      })))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load contact submissions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadContacts() }, [loadContacts])

  const filteredContacts = useMemo(() => contacts.filter((contact) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || `${contact.name} ${contact.email} ${contact.subject} ${contact.message}`.toLowerCase().includes(query)
    return matchesSearch && (categoryFilter === 'all' || contact.category === categoryFilter) && (statusFilter === 'all' || contact.status === statusFilter)
  }), [contacts, search, categoryFilter, statusFilter])
  const total = filteredContacts.length
  const visibleContacts = filteredContacts.slice((page - 1) * perPage, page * perPage)
  useEffect(() => { setPage(1) }, [search, categoryFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const categories = Array.from(new Set(contacts.map(c => c.category)))

  const toggleStar = async (contact: Contact) => {
    try {
      const row = await contactsApi.update(contact.id, { is_starred: !contact.isStarred })
      setContacts((current) => current.map((item) => item.id === contact.id ? { ...item, isStarred: Boolean(row.is_starred) } : item))
      toast('Success', 'Contact updated')
    } catch (error) {
      toast('Unable to update contact', error instanceof Error ? error.message : 'Please try again.', 'error')
    }
  }

  const updateStatus = async (id: string, status: ContactStatus) => {
    try {
      const row = await contactsApi.update(id, { status, is_read: status !== 'new' })
      const existing = contacts.find((contact) => contact.id === id)
      if (!existing) return undefined
      const updated = { ...existing, status: row.status, updatedAt: row.updated_at }
      setContacts((current) => current.map((item) => item.id === id ? updated : item))
      toast('Success', `Status changed to ${status}`)
      return updated
    } catch (error) {
      toast('Unable to update contact', error instanceof Error ? error.message : 'Please try again.', 'error')
      return undefined
    }
  }

  const saveNote = async (contact: Contact, notes: string) => {
    try {
      await contactsApi.update(contact.id, { notes })
      setContacts((current) => current.map((item) => item.id === contact.id ? { ...item, notes } : item))
      setAddingNote(null)
      toast('Success', 'Note saved')
    } catch (error) {
      toast('Unable to save note', error instanceof Error ? error.message : 'Please try again.', 'error')
      throw error
    }
  }

  const deleteContact = async () => {
    if (!deleting) return
    try {
      await contactsApi.delete(deleting.id)
      setDeleting(null)
      toast('Success', 'Contact deleted successfully')
      await loadContacts()
    } catch (error) {
      toast('Unable to delete contact', error instanceof Error ? error.message : 'Please try again.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Contact Submissions</h1>
          <p className="mt-1 text-sm text-muted">View and manage contact form messages</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{contacts.length}</p>
              <p className="text-xs text-muted">Total Messages</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-danger/10 p-2 text-danger">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{contacts.filter(c => c.status === 'new').length}</p>
              <p className="text-xs text-muted">New Messages</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{contacts.filter(c => c.status === 'replied').length}</p>
              <p className="text-xs text-muted">Replied</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-warning/10 p-2 text-warning">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{contacts.filter(c => c.isStarred).length}</p>
              <p className="text-xs text-muted">Starred</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-base"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        {categories.length > 0 && (
          <div className="mt-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-base"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <span>{loadError}</span><Button variant="outline" onClick={() => void loadContacts()}>Retry</Button>
        </div>
      )}

      {/* Contacts List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse p-5">
              <div className="h-4 w-2/3 rounded bg-line" />
              <div className="mt-2 h-3 w-1/2 rounded bg-line" />
            </div>
          ))}
        </div>
      ) : visibleContacts.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-12 w-12" />}
          title="No contact messages"
          message="Contact form submissions will appear here"
        />
      ) : (
        <>
          <div className="space-y-3">
            {visibleContacts.map((contact) => (
              <div
                key={contact.id}
                className={cn(
                  'card group cursor-pointer p-5 transition-all hover:border-brand-200',
                  contact.status === 'new' && 'border-l-4 border-l-danger'
                )}
                onClick={() => {
                  setViewing(contact)
                  if (contact.status === 'new') {
                    void updateStatus(contact.id, 'read')
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          void toggleStar(contact)
                        }}
                        className={cn(
                          'rounded p-1 transition-colors',
                          contact.isStarred ? 'text-warning' : 'text-muted hover:text-warning'
                        )}
                      >
                        <Star className={cn('h-4 w-4', contact.isStarred && 'fill-current')} />
                      </button>
                      <Badge color={
                        contact.status === 'new' ? 'danger' :
                        contact.status === 'read' ? 'warning' :
                        contact.status === 'replied' ? 'success' : 'line'
                      }>
                        {contact.status}
                      </Badge>
                      <Badge color="brand">{contact.category}</Badge>
                    </div>

                    <div className="ml-9">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-ink">{contact.name}</h3>
                        <span className="text-sm text-muted">•</span>
                        <span className="text-sm text-muted">{contact.email}</span>
                        {contact.phone && (
                          <>
                            <span className="text-sm text-muted">•</span>
                            <span className="text-sm text-muted">{contact.phone}</span>
                          </>
                        )}
                      </div>
                      <p className="font-medium text-ink">{contact.subject}</p>
                      <p className="mt-1 text-sm text-muted line-clamp-2">{contact.message}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(contact.createdAt)}
                        </span>
                        {contact.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Assigned to {contact.assignedTo}
                          </span>
                        )}
                        {contact.notes && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Has notes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setAddingNote(contact)
                      }}
                      className="rounded-card p-2 text-ink hover:bg-line/40"
                      title="Add Note"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        void updateStatus(contact.id, 'archived')
                      }}
                      className="rounded-card p-2 text-ink hover:bg-line/40"
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleting(contact)
                      }}
                      className="rounded-card p-2 text-danger hover:bg-danger/5"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} messages
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Modal */}
      {viewing && (
        <ContactViewModal
          contact={viewing}
          onClose={() => setViewing(null)}
          onUpdateStatus={async (status) => {
            const updated = await updateStatus(viewing.id, status)
            if (updated) setViewing(updated)
          }}
        />
      )}

      {/* Add Note Modal */}
      {addingNote && (
        <AddNoteModal
          contact={addingNote}
          onClose={() => setAddingNote(null)}
          onSuccess={(notes) => saveNote(addingNote, notes)}
        />
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal open={true} onClose={() => setDeleting(null)} title="Delete Contact">
          <p className="text-sm text-muted">
            Are you sure you want to delete this contact message from {deleting.name}? This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => void deleteContact()}
              className="flex-1 bg-danger hover:bg-danger/90"
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ContactViewModal({ contact, onClose, onUpdateStatus }: {
  contact: Contact
  onClose: () => void
  onUpdateStatus: (status: ContactStatus) => void
}) {
  return (
    <Modal open={true} onClose={onClose} title="Contact Message">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge color={
            contact.status === 'new' ? 'danger' :
            contact.status === 'read' ? 'warning' :
            contact.status === 'replied' ? 'success' : 'line'
          }>
            {contact.status}
          </Badge>
          <Badge color="brand">{contact.category}</Badge>
          {contact.isStarred && (
            <Badge color="warning">
              <Star className="h-3 w-3 fill-current" />
              Starred
            </Badge>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-ink">{contact.subject}</h3>
        </div>

        <div className="rounded-card border border-line bg-surface p-4">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted" />
              <span className="font-medium text-ink">{contact.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted" />
              <a href={`mailto:${contact.email}`} className="text-brand-700 hover:underline">
                {contact.email}
              </a>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted" />
                <a href={`tel:${contact.phone}`} className="text-brand-700 hover:underline">
                  {contact.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted" />
              <span className="text-muted">{formatDate(contact.createdAt)}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Message</p>
          <div className="rounded-card border border-line bg-surface p-4 text-sm text-ink whitespace-pre-wrap">
            {contact.message}
          </div>
        </div>

        {contact.notes && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Internal Notes</p>
            <div className="rounded-card border border-line bg-warning/5 p-4 text-sm text-ink">
              {contact.notes}
            </div>
          </div>
        )}

        {contact.assignedTo && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Assigned To</p>
            <Badge>{contact.assignedTo}</Badge>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Update Status</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => onUpdateStatus('read')}
              disabled={contact.status === 'read'}
            >
              Mark as Read
            </Button>
            <Button
              variant="outline"
              onClick={() => onUpdateStatus('replied')}
              disabled={contact.status === 'replied'}
            >
              Mark as Replied
            </Button>
            <Button
              variant="outline"
              onClick={() => onUpdateStatus('archived')}
              disabled={contact.status === 'archived'}
            >
              Archive
            </Button>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </Modal>
  )
}

function AddNoteModal({ contact, onClose, onSuccess }: {
  contact: Contact
  onClose: () => void
  onSuccess: (notes: string) => Promise<void>
}) {
  const [notes, setNotes] = useState(contact.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSuccess(notes)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save note.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose} title="Add Internal Note">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Note</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-base"
            rows={4}
            placeholder="Add internal notes about this contact..."
            required
          />
          <p className="mt-1 text-xs text-muted">Internal notes are not visible to the contact</p>
        </div>

        {error && <p role="alert" className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Note'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
