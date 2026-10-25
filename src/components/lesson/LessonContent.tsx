import { useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, ImagePlus, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { uploadAdminImage } from '../../lib/adminMedia'
import { uid } from '../../lib/utils'

export type LessonContentBlock =
  | { id: string; type: 'section'; heading: string; body: string }
  | { id: string; type: 'image'; url: string; alt: string; caption: string }
  | { id: string; type: 'flashcards'; cards: { id: string; front: string; back: string; imageUrl?: string }[] }

const CONTENT_VERSION = 1

export function parseLessonContent(value: string): LessonContentBlock[] | null {
  if (!value.trim().startsWith('{')) return null
  try {
    const parsed = JSON.parse(value)
    if (parsed?.version !== CONTENT_VERSION || !Array.isArray(parsed.blocks)) return null
    return parsed.blocks.filter((block: any) =>
      block && typeof block.id === 'string' &&
      (block.type === 'section' && typeof block.heading === 'string' && typeof block.body === 'string' ||
       block.type === 'image' && typeof block.url === 'string' && typeof block.alt === 'string' && typeof block.caption === 'string' ||
       block.type === 'flashcards' && Array.isArray(block.cards) && block.cards.every((card: any) => card && typeof card.id === 'string' && typeof card.front === 'string' && typeof card.back === 'string' && (card.imageUrl === undefined || typeof card.imageUrl === 'string')))
    ) as LessonContentBlock[]
  } catch {
    return null
  }
}

export function serializeLessonContent(blocks: LessonContentBlock[]) {
  return JSON.stringify({ version: CONTENT_VERSION, blocks })
}

export function LessonContentView({ content }: { content: string }) {
  const blocks = parseLessonContent(content)
  if (!blocks) {
    return <div className="prose-plain whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content }} />
  }

  return (
    <div className="space-y-6">
      {blocks.map((block) => block.type === 'section' ? (
        <section key={block.id} className="space-y-3">
          {block.heading && <h3 className="font-display text-lg font-semibold text-ink">{block.heading}</h3>}
          {block.body && <div className="whitespace-pre-wrap leading-7">{block.body}</div>}
        </section>
      ) : block.type === 'image' && block.url ? (
        <figure key={block.id} className="space-y-2">
          <img src={block.url} alt={block.alt} className="h-auto max-h-[680px] w-full rounded-card object-contain" loading="lazy" />
          {block.caption && <figcaption className="text-center text-sm text-muted">{block.caption}</figcaption>}
        </figure>
      ) : block.type === 'flashcards' ? <LessonFlashcardSet key={block.id} cards={block.cards} /> : null)}
    </div>
  )
}

function LessonFlashcardSet({ cards }: { cards: Extract<LessonContentBlock, { type: 'flashcards' }>['cards'] }) {
  const [index, setIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const card = cards[index]
  if (!card) return null
  return (
    <section className="rounded-card border border-brand-200 bg-brand-50/40 p-5">
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted">
        <span>Interactive flashcards</span><span>{index + 1} / {cards.length}</span>
      </div>
      <button type="button" onClick={() => setShowBack((visible) => !visible)} className="flex min-h-48 w-full flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface p-6 text-center text-ink shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">{showBack ? 'Answer' : 'Prompt'} · click to flip</span>
        <span className="whitespace-pre-wrap text-lg font-medium">{showBack ? card.back : card.front}</span>
        {card.imageUrl && <img src={card.imageUrl} alt="" className="max-h-48 rounded-card object-contain" loading="lazy" />}
      </button>
      <div className="mt-3 flex items-center justify-between">
        <button type="button" disabled={index === 0} onClick={() => { setIndex((current) => current - 1); setShowBack(false) }} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40">Previous</button>
        <button type="button" disabled={index === cards.length - 1} onClick={() => { setIndex((current) => current + 1); setShowBack(false) }} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
      </div>
    </section>
  )
}

export function LessonContentEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')
  const valueRef = useRef(value)
  valueRef.current = value
  const parsed = useMemo(() => parseLessonContent(value), [value])
  const legacyBody = value.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '</$1>\n\n')
  const legacyText = legacyBody.includes('<') && typeof DOMParser !== 'undefined'
    ? new DOMParser().parseFromString(legacyBody, 'text/html').body.textContent ?? legacyBody
    : legacyBody
  const blocks = parsed ?? (value ? [{ id: 'legacy-content', type: 'section' as const, heading: '', body: legacyText }] : [])

  const commit = (next: LessonContentBlock[]) => onChange(serializeLessonContent(next))
  const patchBlock = (index: number, patch: Record<string, string>) => {
    const next = [...blocks]
    next[index] = { ...next[index], ...patch } as LessonContentBlock
    commit(next)
  }
  const patchBlockById = (id: string, patch: Partial<LessonContentBlock>) => {
    const current = parseLessonContent(valueRef.current)
    if (!current) return
    const index = current.findIndex((block) => block.id === id)
    if (index < 0) return
    current[index] = { ...current[index], ...patch } as LessonContentBlock
    onChange(serializeLessonContent(current))
  }
  const addSection = () => commit([...blocks, { id: uid('txt'), type: 'section', heading: '', body: '' }])
  const addImage = () => commit([...blocks, { id: uid('img'), type: 'image', url: '', alt: '', caption: '' }])
  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
  }
  const removeBlock = (index: number) => commit(blocks.filter((_, i) => i !== index))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="label-base">Lesson content</label>
          <p className="text-xs text-muted">Build the lesson from text sections and images. Reorder blocks to place illustrations between sections.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={addSection} className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-sm"><Plus className="h-4 w-4" /> Add text section</button>
          <button type="button" onClick={addImage} className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-sm"><ImagePlus className="h-4 w-4" /> Add image</button>
        </div>
      </div>

      {uploadError && <p role="alert" className="text-sm text-danger">{uploadError}</p>}
      {blocks.length === 0 && <div className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">Add a text section or an image to start building this lesson.</div>}

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-card border border-line bg-paper p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">{block.type === 'section' ? `Text section ${index + 1}` : block.type === 'image' ? `Image ${index + 1}` : `Flashcard set · ${block.cards.length} cards`}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} aria-label="Move block up" className="rounded p-1.5 text-muted hover:text-ink disabled:opacity-40"><ChevronUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} aria-label="Move block down" className="rounded p-1.5 text-muted hover:text-ink disabled:opacity-40"><ChevronDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeBlock(index)} aria-label="Remove block" className="rounded p-1.5 text-muted hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            {block.type === 'section' ? (
              <div className="space-y-3">
                <input value={block.heading} onChange={(event) => patchBlock(index, { heading: event.target.value })} className="input-base" placeholder="Section heading (optional)" aria-label="Section heading" />
                <textarea value={block.body} onChange={(event) => patchBlock(index, { body: event.target.value })} rows={5} className="input-base" placeholder="Write this part of the lesson…" aria-label="Section text" />
              </div>
            ) : block.type === 'image' ? (
              <div className="space-y-3">
                {block.url && <img src={block.url} alt={block.alt} className="max-h-72 w-full rounded-card bg-surface object-contain" />}
                <label className="btn-outline flex cursor-pointer items-center justify-center gap-2 px-3 py-2 text-sm">
                  {uploadingId === block.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {block.url ? 'Replace image from device' : 'Choose image from device'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={uploadingId !== null}
                    className="sr-only"
                    onChange={async (event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      if (!file) return
                      setUploadError('')
                      setUploadingId(block.id)
                      try {
                        const url = await uploadAdminImage(file, 'uploads', 'lesson-content')
                        patchBlockById(block.id, { url })
                      } catch (error) {
                        setUploadError(error instanceof Error ? error.message : 'Image upload failed. Please try again.')
                      } finally {
                        setUploadingId(null)
                      }
                    }}
                  />
                </label>
                <input value={block.alt} onChange={(event) => patchBlock(index, { alt: event.target.value })} className="input-base" placeholder="Describe the image for accessibility" aria-label="Image description" />
                <input value={block.caption} onChange={(event) => patchBlock(index, { caption: event.target.value })} className="input-base" placeholder="Image caption (optional)" aria-label="Image caption" />
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted">
                {block.cards.map((card, cardIndex) => <div key={card.id} className="rounded border border-line px-3 py-2"><p className="font-medium text-ink">{cardIndex + 1}. {card.front}</p><p className="mt-1">{card.back}</p></div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
