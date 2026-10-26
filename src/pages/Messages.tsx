import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Search, Send } from 'lucide-react'
import { useApp } from '../lib/store'
import { Avatar, Button } from '../components/ui'
import { cn, timeAgo } from '../lib/utils'
import { messagesApi, publicApi, getStoredToken, type MessageConversation, type PublicInstructor } from '../lib/api/auth'
import type { Message } from '../lib/types'

export default function Messages() {
  const { currentUser, toast } = useApp()
  const { t } = useTranslation()
  const [conversations, setConversations] = useState<MessageConversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [instructors, setInstructors] = useState<PublicInstructor[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [showThread, setShowThread] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadMessages = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setError('Please sign in again to view your messages.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [messageData, instructorData] = await Promise.all([
        messagesApi.list(token),
        publicApi.listInstructors()
      ])
      setConversations(messageData.conversations ?? [])
      setMessages(messageData.messages ?? [])
      setInstructors(instructorData.instructors ?? [])
      setActive((existing) => existing && messageData.conversations.some((conversation) => conversation.id === existing)
        ? existing
        : messageData.conversations[0]?.id ?? null)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load messages.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadMessages() }, [loadMessages])

  const conv = conversations.find((conversation) => conversation.id === active)
  const thread = useMemo(() => messages.filter((message) => message.conversationId === active), [messages, active])
  const other = conv?.otherParticipant ?? null
  const visibleConversations = conversations.filter((conversation) =>
    (conversation.otherParticipant?.name ?? '').toLowerCase().includes(search.toLowerCase()))
  const visibleInstructors = instructors.filter((instructor) =>
    instructor.id !== currentUser?.id && instructor.name.toLowerCase().includes(search.toLowerCase()))

  const openInstructor = async (instructor: PublicInstructor) => {
    const existing = conversations.find((conversation) => conversation.otherParticipant?.id === instructor.id)
    if (existing) {
      setActive(existing.id)
      setShowThread(true)
      return
    }
    const token = getStoredToken()
    if (!token) {
      toast('Sign in required', 'Please sign in again to start a conversation.', 'error')
      return
    }
    try {
      const result = await messagesApi.start(token, instructor.id)
      await loadMessages()
      setActive(result.conversationId)
      setShowThread(true)
    } catch (cause) {
      toast('Could not start conversation', cause instanceof Error ? cause.message : 'Please try again.', 'error')
    }
  }

  const submitMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    const messageText = text.trim()
    if (!messageText || !conv || !other || sending) return
    const token = getStoredToken()
    if (!token) {
      toast('Sign in required', 'Please sign in again to send a message.', 'error')
      return
    }
    setSending(true)
    try {
      const result = await messagesApi.send(token, { conversationId: conv.id, toId: other.id, text: messageText })
      setMessages((existing) => [...existing, result.message])
      setConversations((existing) => existing
        .map((conversation) => conversation.id === conv.id ? { ...conversation, lastMessageAt: result.message.createdAt } : conversation)
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)))
      setText('')
    } catch (cause) {
      toast('Message not sent', cause instanceof Error ? cause.message : 'Please try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('msg.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('msg.subtitle')}</p>
      </div>
      {error && (
        <div role="alert" className="flex items-center justify-between rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <span>{error}</span>
          <button className="font-semibold underline" onClick={() => void loadMessages()}>{t('common.retry', { defaultValue: 'Retry' })}</button>
        </div>
      )}
      <div className="card grid min-h-[420px] overflow-hidden md:grid-cols-[280px_1fr]">
        <div className={`border-b border-line md:border-b-0 md:border-r ${showThread ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center gap-2 border-b border-line p-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('msg.search')} className="input-base py-1.5 pl-8 text-xs" />
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {loading && <p className="p-4 text-sm text-muted">Loading conversations…</p>}
            {!loading && conversations.length === 0 && <p className="p-4 text-sm text-muted">{t('msg.noConversations')}</p>}
            {visibleConversations.map((conversation) => {
              const contact = conversation.otherParticipant
              const conversationMessages = messages.filter((message) => message.conversationId === conversation.id)
              const last = conversationMessages[conversationMessages.length - 1]
              return (
                <button key={conversation.id} onClick={() => { setActive(conversation.id); setShowThread(true) }} className={cn('flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left', active === conversation.id ? 'bg-brand-50' : 'hover:bg-line/30')}>
                  <Avatar name={contact?.name ?? 'Unknown'} src={contact?.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{contact?.name ?? 'Unknown'}</p>
                    <p className="truncate text-xs text-muted">{last?.text}</p>
                  </div>
                  <span className="text-[10px] text-muted">{last ? timeAgo(last.createdAt) : ''}</span>
                </button>
              )
            })}
          </div>
          <div className="border-t border-line p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t('msg.newConversation')}</p>
            <div className="space-y-1">
              {visibleInstructors.slice(0, 8).map((instructor) => (
                <button key={instructor.id} onClick={() => void openInstructor(instructor)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-muted hover:bg-line/40 hover:text-ink">
                  <Avatar name={instructor.name} src={instructor.avatar} size="xs" /> {instructor.name}
                </button>
              ))}
              {!loading && visibleInstructors.length === 0 && <p className="px-2 py-1 text-xs text-muted">No instructors found.</p>}
            </div>
          </div>
        </div>

        <div className={`flex flex-col ${showThread ? 'block' : 'hidden md:flex'}`}>
          {conv && other ? (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <button onClick={() => setShowThread(false)} className="rounded p-1 text-muted hover:text-ink md:hidden" aria-label={t('msg.backToConversations')}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </button>
                <Avatar name={other.name} src={other.avatar} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-ink">{other.name}</p>
                  <p className="text-xs text-muted">{other.title || other.role}</p>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-paper p-4" style={{ minHeight: 300 }}>
                {thread.map((message) => {
                  const mine = message.fromId === currentUser?.id
                  return (
                    <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[75%] rounded-card px-4 py-2.5 text-sm', mine ? 'bg-brand-500 text-white' : 'bg-surface text-ink shadow-card')}>
                        <p>{message.text}</p>
                        <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-muted')}>{timeAgo(message.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
                {thread.length === 0 && <p className="py-8 text-center text-sm text-muted">Start the conversation with {other.name}.</p>}
              </div>
              <form className="flex gap-2 border-t border-line p-3" onSubmit={submitMessage}>
                <input value={text} onChange={(event) => setText(event.target.value)} placeholder={t('msg.typeMessage')} className="input-base flex-1" />
                <Button type="submit" disabled={!text.trim() || sending}><Send className="h-4 w-4" /></Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
              <div className="rounded-full bg-brand-50 p-5 text-brand-700"><MessageSquare className="h-8 w-8" /></div>
              <p className="mt-4 font-display text-lg font-semibold text-ink">{t('msg.selectConversation')}</p>
              <p className="mt-1 max-w-xs text-sm text-muted">{t('msg.selectDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
