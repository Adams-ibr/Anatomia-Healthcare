import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Search, Send } from 'lucide-react'
import { useApp } from '../lib/store'
import { Avatar, Button } from '../components/ui'
import { cn, timeAgo } from '../lib/utils'

export default function Messages() {
  const { currentUser, conversations, messages, sendMessage, users, toast } = useApp()
  const { t } = useTranslation()
  const [active, setActive] = useState<string | null>(conversations[0]?.id ?? null)
  const [text, setText] = useState('')
  const [showThread, setShowThread] = useState(false)

  const conv = conversations.find((c) => c.id === active)
  const thread = messages.filter((m) => m.conversationId === active)
  const otherId = conv?.participants.find((p) => p !== currentUser!.id)
  const other = users.find((u) => u.id === otherId)
  const allInstructors = users.filter((u) => u.role === 'instructor')

  const handleSelectConversation = (id: string) => {
    setActive(id)
    setShowThread(true)
  }

  const handleBackToList = () => {
    setShowThread(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('msg.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('msg.subtitle')}</p>
      </div>
      <div className="card grid overflow-hidden md:grid-cols-[280px_1fr]">
        <div className={`border-b border-line md:border-b-0 md:border-r ${showThread ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center gap-2 border-b border-line p-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input placeholder={t('msg.search')} className="input-base py-1.5 pl-8 text-xs" />
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {conversations.length === 0 && <p className="p-4 text-sm text-muted">{t('msg.noConversations')}</p>}
            {conversations.map((c) => {
              const oId = c.participants.find((p) => p !== currentUser!.id)
              const o = users.find((u) => u.id === oId)
              const last = messages.filter((m) => m.conversationId === c.id).slice(-1)[0]
              return (
                <button key={c.id} onClick={() => handleSelectConversation(c.id)} className={cn('flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left', active === c.id ? 'bg-brand-50' : 'hover:bg-line/30')}>
                  <Avatar name={o?.name ?? 'Unknown'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{o?.name}</p>
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
              {allInstructors.slice(0, 3).map((ins) => (
                <button key={ins.id} onClick={() => { sendMessage('', ins.id, t('msg.helloMsg')); toast(t('msg.messageSent'), t('msg.conversationStarted', { name: ins.name })) }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-muted hover:bg-line/40 hover:text-ink">
                  <Avatar name={ins.name} size="xs" /> {ins.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex flex-col ${showThread ? 'block' : 'hidden md:flex'}`}>
          {conv && other ? (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <button onClick={handleBackToList} className="md:hidden rounded p-1 text-muted hover:text-ink" aria-label="Back to conversations">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <Avatar name={other.name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-ink">{other.name}</p>
                  <p className="text-xs text-muted">{other.title}</p>
                </div>
                <span className="ml-auto flex items-center gap-1 text-xs text-success"><span className="h-2 w-2 rounded-full bg-success" /> {t('msg.online')}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-paper p-4" style={{ minHeight: 300 }}>
                {thread.map((msg) => {
                  const mine = msg.fromId === currentUser!.id
                  return (
                    <div key={msg.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[75%] rounded-card px-4 py-2.5 text-sm', mine ? 'bg-brand-500 text-white' : 'bg-surface text-ink shadow-card')}>
                        <p>{msg.text}</p>
                        <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-muted')}>{timeAgo(msg.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; sendMessage(conv.id, other.id, text); setText('') }}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('msg.typeMessage')} className="input-base flex-1" />
                <Button type="submit" disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
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