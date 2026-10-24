import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Download, FileText, HelpCircle,
  Lightbulb, Loader2, MoreVertical, PencilLine, Plus, Search, Sparkles,
  Trash2, Upload, X, Eye, Layers, Copy
} from 'lucide-react'
import { useApp } from '../lib/store'
import { flashcardDecksApi, flashcardsApi } from '../lib/supabase'
import { Badge, Button, EmptyState, Modal, Tabs } from '../components/ui'
import { cn, formatDate } from '../lib/utils'
import { uploadAdminImage } from '../lib/adminMedia'
import { ImageUploadField } from '../components/admin/ImageUploadField'

const CARD_TYPES = [
  { id: 'learning', label: 'Learning', icon: BookOpen, color: 'brand' },
  { id: 'question', label: 'Question', icon: HelpCircle, color: 'warning' },
  { id: 'funfact', label: 'Fun Fact', icon: Sparkles, color: 'success' },
  { id: 'tip', label: 'Tip', icon: Lightbulb, color: 'danger' }
] as const

type CardType = typeof CARD_TYPES[number]['id']

interface Flashcard {
  id: string
  deckId: string
  type: CardType
  front: string
  back: string
  imageUrl?: string
  order: number
  createdAt: string
  updatedAt: string
}

interface FlashcardDeck {
  id: string
  name: string
  description: string
  category: string
  cardCount: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminFlashcards() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [view, setView] = useState<'decks' | 'cards'>('decks')
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null)

  const [decks, setDecks] = useState<FlashcardDeck[]>([])
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const [creatingDeck, setCreatingDeck] = useState(false)
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null)
  const [deletingDeck, setDeletingDeck] = useState<FlashcardDeck | null>(null)

  const [creatingCard, setCreatingCard] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null)
  const [viewingCard, setViewingCard] = useState<Flashcard | null>(null)

  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  const loadDecks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await flashcardDecksApi.list()
      const mapped: FlashcardDeck[] = (data ?? []).map((d: any) => ({
        id: d.id,
        name: d.name ?? d.title ?? '',
        description: d.description ?? '',
        category: d.category ?? 'General',
        cardCount: d.flashcards?.[0]?.count ?? 0,
        isPublished: d.is_published ?? false,
        createdAt: d.created_at ?? '',
        updatedAt: d.updated_at ?? d.created_at ?? ''
      }))
      setDecks(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCards = useCallback(async (deckId: string) => {
    try {
      const data = await flashcardsApi.list(deckId)
      const mapped: Flashcard[] = (data ?? []).map((c: any) => ({
        id: c.id,
        deckId: c.deck_id,
        type: (c.card_type as CardType) || 'learning',
        front: c.front,
        back: c.back,
        imageUrl: c.image_url ?? undefined,
        order: c.order ?? 0,
        createdAt: c.created_at ?? '',
        updatedAt: c.created_at ?? ''
      }))
      setCards(mapped)
    } catch {
      setCards([])
    }
  }, [])

  useEffect(() => { loadDecks() }, [loadDecks])

  const handleDeleteDeck = async () => {
    if (!deletingDeck) return
    setMutating(true)
    try {
      await flashcardDecksApi.delete(deletingDeck.id)
      toast('Success', `Deck "${deletingDeck.name}" deleted`)
      setDeletingDeck(null)
      if (selectedDeck?.id === deletingDeck.id) { setSelectedDeck(null); setView('decks') }
      loadDecks()
    } catch (err) {
      toast('Error', err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setMutating(false)
    }
  }

  const handleDeleteCard = async () => {
    if (!deletingCard) return
    setMutating(true)
    try {
      await flashcardsApi.delete(deletingCard.id)
      toast('Success', 'Card deleted')
      setDeletingCard(null)
      if (selectedDeck) loadCards(selectedDeck.id)
    } catch (err) {
      toast('Error', err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setMutating(false)
    }
  }

  const filteredDecks = decks.filter(deck => {
    if (search && !deck.name.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== 'all' && deck.category !== categoryFilter) return false
    return true
  })

  const deckCards = selectedDeck ? cards.filter(c => c.deckId === selectedDeck.id) : []

  const categories = Array.from(new Set(decks.map(d => d.category)))


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Flashcards Management</h1>
          <p className="mt-1 text-sm text-muted">
            {view === 'decks' ? 'Organize flashcards into decks' : `Managing cards in "${selectedDeck?.name}"`}
          </p>
        </div>
        <div className="flex gap-2">
          {view === 'cards' && selectedDeck && (
            <>
              <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                <Upload className="h-4 w-4" />
                Bulk Import
              </Button>
              <Button onClick={() => setCreatingCard(true)}>
                <Plus className="h-4 w-4" />
                Add Card
              </Button>
            </>
          )}
          {view === 'decks' && (
            <Button onClick={() => setCreatingDeck(true)}>
              <Plus className="h-4 w-4" />
              Create Deck
            </Button>
          )}
        </div>
      </div>

      {/* Navigation breadcrumb for cards view */}
      {view === 'cards' && selectedDeck && (
        <button
          onClick={() => {
            setView('decks')
            setSelectedDeck(null)
          }}
          className="flex items-center gap-2 text-sm text-brand-700 hover:text-brand-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Decks
        </button>
      )}

      {/* Decks View */}
      {view === 'decks' && (
        <>
          {/* Filters */}
          <div className="card p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search decks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-base pl-9"
                />
              </div>
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
          </div>

          {/* Decks List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card animate-pulse p-6">
                  <div className="h-4 w-1/3 rounded bg-line" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-line" />
                </div>
              ))}
            </div>
          ) : filteredDecks.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-12 w-12" />}
              title="No flashcard decks found"
              message="Create your first deck to organize flashcards"
              action={
                <Button onClick={() => setCreatingDeck(true)}>
                  <Plus className="h-4 w-4" />
                  Create Deck
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="card group cursor-pointer p-6 transition-all hover:border-brand-300 hover:shadow-md"
                  onClick={() => {
                    setSelectedDeck(deck)
                    setView('cards')
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-ink">{deck.name}</h3>
                        <Badge color={deck.isPublished ? 'success' : 'warning'}>
                          {deck.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">{deck.description}</p>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <span className="text-muted">
                          <Layers className="mb-0.5 inline h-4 w-4" /> {deck.cardCount} cards
                        </span>
                        <Badge color="brand">{deck.category}</Badge>
                        <span className="text-xs text-muted">Updated {formatDate(deck.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingDeck(deck)
                        }}
                        className="rounded-card p-2 text-ink hover:bg-line/40"
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Duplicate deck
                          toast('Success', 'Deck duplicated')
                        }}
                        className="rounded-card p-2 text-ink hover:bg-line/40"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingDeck(deck)
                        }}
                        className="rounded-card p-2 text-danger hover:bg-danger/5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Cards View */}
      {view === 'cards' && selectedDeck && (
        <>
          {/* Card Type Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            {CARD_TYPES.map(({ id, label, icon: Icon, color }) => {
              const count = deckCards.filter(c => c.type === id).length
              return (
                <div key={id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'rounded-card p-2',
                      color === 'brand' && 'bg-brand-50 text-brand-700',
                      color === 'warning' && 'bg-warning/10 text-warning',
                      color === 'success' && 'bg-success/10 text-success',
                      color === 'danger' && 'bg-danger/10 text-danger'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ink">{count}</p>
                      <p className="text-xs text-muted">{label}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cards List */}
          {deckCards.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title="No flashcards yet"
              message="Add flashcards to this deck or import them in bulk"
              action={
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                    <Upload className="h-4 w-4" />
                    Bulk Import
                  </Button>
                  <Button onClick={() => setCreatingCard(true)}>
                    <Plus className="h-4 w-4" />
                    Add Card
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="space-y-3">
              {deckCards.map((card) => {
                const cardType = CARD_TYPES.find(t => t.id === card.type)!
                const Icon = cardType.icon
                return (
                  <div
                    key={card.id}
                    className="card group p-5 transition-all hover:border-brand-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'rounded-card p-2',
                        cardType.color === 'brand' && 'bg-brand-50 text-brand-700',
                        cardType.color === 'warning' && 'bg-warning/10 text-warning',
                        cardType.color === 'success' && 'bg-success/10 text-success',
                        cardType.color === 'danger' && 'bg-danger/10 text-danger'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <Badge color={cardType.color} className="mb-2">{cardType.label}</Badge>
                            <p className="font-medium text-ink">{card.front}</p>
                            <p className="mt-2 text-sm text-muted line-clamp-2">{card.back}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => setViewingCard(card)}
                              className="rounded-card p-2 text-ink hover:bg-line/40"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingCard(card)}
                              className="rounded-card p-2 text-ink hover:bg-line/40"
                            >
                              <PencilLine className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingCard(card)}
                              className="rounded-card p-2 text-danger hover:bg-danger/5"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Create Deck Modal */}
      {creatingDeck && (
        <DeckFormModal
          onClose={() => setCreatingDeck(false)}
          onSuccess={() => {
            setCreatingDeck(false)
            toast('Success', 'Deck created successfully')
            loadDecks()
          }}
        />
      )}

      {/* Edit Deck Modal */}
      {editingDeck && (
        <DeckFormModal
          deck={editingDeck}
          onClose={() => setEditingDeck(null)}
          onSuccess={() => {
            setEditingDeck(null)
            toast('Success', 'Deck updated successfully')
            loadDecks()
          }}
        />
      )}

      {/* Delete Deck Confirmation */}
      {deletingDeck && (
        <Modal open={true} onClose={() => setDeletingDeck(null)} title="Delete Deck">
          <p className="text-sm text-muted">
            Are you sure you want to delete "{deletingDeck.name}"? This will also delete all {deletingDeck.cardCount} flashcards in this deck. This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeletingDeck(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteDeck}
              className="flex-1 bg-danger hover:bg-danger/90"
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}

      {/* Create/Edit Card Modal */}
      {(creatingCard || editingCard) && selectedDeck && (
        <CardFormModal
          deckId={selectedDeck.id}
          card={editingCard}
          onClose={() => {
            setCreatingCard(false)
            setEditingCard(null)
          }}
          onSuccess={() => {
            setCreatingCard(false)
            setEditingCard(null)
            toast('Success', editingCard ? 'Card updated' : 'Card created')
            if (selectedDeck) loadCards(selectedDeck.id)
          }}
        />
      )}

      {/* View Card Modal */}
      {viewingCard && (
        <CardViewModal
          card={viewingCard}
          onClose={() => setViewingCard(null)}
        />
      )}

      {/* Delete Card Confirmation */}
      {deletingCard && (
        <Modal open={true} onClose={() => setDeletingCard(null)} title="Delete Card">
          <p className="text-sm text-muted">
            Are you sure you want to delete this flashcard? This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeletingCard(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCard}
              className="flex-1 bg-danger hover:bg-danger/90"
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}

      {/* Bulk Import Modal */}
      {bulkImportOpen && selectedDeck && (
        <BulkImportModal
          deckId={selectedDeck.id}
          onClose={() => setBulkImportOpen(false)}
          onSuccess={(count) => {
            setBulkImportOpen(false)
            toast('Success', `Imported ${count} flashcards successfully`)
          }}
        />
      )}
    </div>
  )
}

function DeckFormModal({ deck, onClose, onSuccess }: { deck?: FlashcardDeck; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: deck?.name || '',
    description: deck?.description || '',
    category: deck?.category || 'Cardiovascular System',
    isPublished: deck?.isPublished || false
  })
  const [saving, setSaving] = useState(false);
  const { toast } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
setSaving(true)
try {
  if (deck) {
    await flashcardDecksApi.update(deck.id, {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      is_published: formData.isPublished
    })
  } else {
    await flashcardDecksApi.create({
      name: formData.name,
      description: formData.description,
      category: formData.category,
      is_published: formData.isPublished
    })
  }
  onSuccess()
} catch (err) {
  toast('Error', err instanceof Error ? err.message : 'Failed to save deck', 'error')
} finally {
  setSaving(false)
}
  }

  return (
    <Modal open={true} onClose={onClose} title={deck ? 'Edit Deck' : 'Create Deck'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Deck Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-base"
            placeholder="e.g., Cardiovascular System Basics"
            required
          />
        </div>

        <div>
          <label className="label-base">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-base"
            rows={3}
            placeholder="Describe what this deck covers..."
            required
          />
        </div>

        <div>
          <label className="label-base">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="input-base"
            placeholder="e.g., Cardiovascular System"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="deck-published"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            className="rounded border-line"
          />
          <label htmlFor="deck-published" className="text-sm text-ink">
            Published
          </label>
        </div>

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
              deck ? 'Save Changes' : 'Create Deck'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function CardFormModal({ deckId, card, onClose, onSuccess }: { deckId: string; card?: Flashcard | null; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useApp()
  const [formData, setFormData] = useState({
    type: card?.type || 'learning' as CardType,
    front: card?.front || '',
    back: card?.back || '',
    imageUrl: card?.imageUrl || ''
  })
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        deck_id: deckId,
        type: formData.type,
        front: formData.front.trim(),
        back: formData.back.trim(),
        image_url: imageFile ? await uploadAdminImage(imageFile, 'flashcards') : (formData.imageUrl.trim() || null),
        order: card?.order ?? 0
      }
      if (card) await flashcardsApi.update(card.id, payload)
      else await flashcardsApi.create(payload)
      onSuccess()
    } catch (err) {
      toast('Error', err instanceof Error ? err.message : 'Failed to save flashcard', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose} title={card ? 'Edit Flashcard' : 'Create Flashcard'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Card Type</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CARD_TYPES.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFormData({ ...formData, type: id })}
                className={cn(
                  'flex items-center gap-2 rounded-card border-2 p-3 text-left transition-all',
                  formData.type === id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-line hover:border-brand-200'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label-base">Front (Question/Prompt)</label>
          <textarea
            value={formData.front}
            onChange={(e) => setFormData({ ...formData, front: e.target.value })}
            className="input-base"
            rows={3}
            placeholder="Enter the front side content..."
            required
          />
        </div>

        <div>
          <label className="label-base">Back (Answer/Content)</label>
          <textarea
            value={formData.back}
            onChange={(e) => setFormData({ ...formData, back: e.target.value })}
            className="input-base"
            rows={4}
            placeholder="Enter the back side content..."
            required
          />
        </div>

        <div>
          <ImageUploadField label="Flashcard image" value={formData.imageUrl} onChange={(file) => { setImageFile(file); if (file) setFormData((current) => ({ ...current, imageUrl: '' })) }} />
          <label className="label-base mt-3">Or use an image URL (Optional)</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="input-base"
            placeholder="https://example.com/image.jpg"
          />
        </div>

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
              card ? 'Save Changes' : 'Create Card'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function CardViewModal({ card, onClose }: { card: Flashcard; onClose: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const cardType = CARD_TYPES.find(t => t.id === card.type)!
  const Icon = cardType.icon

  return (
    <Modal open={true} onClose={onClose} title="Flashcard Preview">
      <div className="space-y-4">
        <Badge color={cardType.color}>{cardType.label}</Badge>
        
        <div
          className="card cursor-pointer p-6 transition-all hover:shadow-lg"
          onClick={() => setFlipped(!flipped)}
        >
          <div className="flex items-center gap-3 mb-4">
            <Icon className="h-5 w-5 text-muted" />
            <p className="text-sm font-medium text-muted">{flipped ? 'Back' : 'Front'}</p>
          </div>
          <p className="text-ink whitespace-pre-wrap">
            {flipped ? card.back : card.front}
          </p>
          {card.imageUrl && (
            <img src={card.imageUrl} alt="Flashcard" className="mt-4 rounded-card max-h-48 w-full object-cover" />
          )}
        </div>

        <p className="text-center text-sm text-muted">Click the card to flip</p>

        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </Modal>
  )
}

function BulkImportModal({ deckId, onClose, onSuccess }: { deckId: string; onClose: () => void; onSuccess: (count: number) => void }) {
  const [importType, setImportType] = useState<'csv' | 'json'>('csv')
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  const csvTemplate = `type,front,back,imageUrl
learning,What is the heart?,The heart is a muscular organ that pumps blood,
question,How many chambers does the heart have?,Four chambers: two atria and two ventricles,
funfact,Fun Fact,Your heart beats about 100000 times per day!,
tip,Study Tip,Remember: Right=deoxygenated Left=oxygenated,`

  const jsonTemplate = `[
  {
    "type": "learning",
    "front": "What is the heart?",
    "back": "The heart is a muscular organ that pumps blood",
    "imageUrl": ""
  },
  {
    "type": "question",
    "front": "How many chambers does the heart have?",
    "back": "Four chambers: two atria and two ventricles",
    "imageUrl": ""
  }
]`

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setImporting(true)
    setTimeout(() => {
      setImporting(false)
      onSuccess(15) // Mock import count
    }, 2000)
  }

  const downloadTemplate = () => {
    const content = importType === 'csv' ? csvTemplate : jsonTemplate
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flashcard-template.${importType}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal open={true} onClose={onClose} title="Bulk Import Flashcards">
      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <label className="label-base">Import Format</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setImportType('csv')}
              className={cn(
                'rounded-card border-2 p-3 text-center transition-all',
                importType === 'csv'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-line hover:border-brand-200'
              )}
            >
              <FileText className="mx-auto h-6 w-6 mb-1" />
              <span className="text-sm font-medium">CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setImportType('json')}
              className={cn(
                'rounded-card border-2 p-3 text-center transition-all',
                importType === 'json'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-line hover:border-brand-200'
              )}
            >
              <FileText className="mx-auto h-6 w-6 mb-1" />
              <span className="text-sm font-medium">JSON</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label-base">Upload File</label>
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-sm text-brand-700 hover:text-brand-800 flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
          </div>
          <input
            type="file"
            accept={importType === 'csv' ? '.csv' : '.json'}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="input-base"
            required
          />
        </div>

        <div className="rounded-card border border-line bg-surface p-4 text-sm text-muted">
          <p className="font-medium text-ink mb-2">Import Format:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Type: learning, question, funfact, or tip</li>
            <li>Front: The question or prompt</li>
            <li>Back: The answer or content</li>
            <li>Image URL: Optional image (leave empty if none)</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={importing} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={importing || !file} className="flex-1">
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import Cards
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
