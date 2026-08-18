import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, MessageSquare, Plus, ThumbsUp } from 'lucide-react'
import { COURSES, DISCUSSIONS } from '../lib/data'
import { useApp } from '../lib/store'
import { Avatar, Badge, Button, SearchInput } from '../components/ui'
import { cn, timeAgo } from '../lib/utils'

export default function Community() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const courses = COURSES.filter((c) => c.status === 'published')
  const list = useMemo(() => {
    let d = [...DISCUSSIONS]
    const empty: typeof d = []
    courses.slice(0, 8).forEach((c, i) => {
      empty.push({
        id: `dc_seed_${i}`, courseId: c.id, authorId: 'u_st_1', authorName: ['John Adedeji', 'Grace Okonkwo', 'Maya Thompson', 'Liam Anderson'][i % 4],
        title: ['How do you approach this lab?', 'Question about section 2', 'My solution for the project', 'Best study order for this course', 'Anyone else doing the learning path?', 'Explanation needed: final assessment', 'What tools do you use?', 'Completed the course — AMA'][i % 8],
        body: 'I have been working through this course and would love to compare notes with other learners. What has worked well for you?',
        likes: Math.floor(Math.random() * 20), answers: [], createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString()
      })
    })
    d = [...empty, ...d]
    if (filter !== 'all') d = d.filter((x) => x.courseId === filter)
    if (search) {
      const s = search.toLowerCase()
      d = d.filter((x) => x.title.toLowerCase().includes(s) || x.body.toLowerCase().includes(s))
    }
    return d
  }, [filter, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('community.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('community.subtitle')}</p>
        </div>
        <Button onClick={() => setQ('new')}><Plus className="h-4 w-4" /> {t('community.ask')}</Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-60">
          <SearchInput value={search} onChange={setSearch} placeholder={t('community.search')} />
          <div className="mt-4 space-y-1">
            <button onClick={() => setFilter('all')} className={cn('block w-full rounded px-3 py-2 text-left text-sm', filter === 'all' ? 'bg-brand-50 font-medium text-brand-700' : 'text-muted hover:bg-line/40')}>{t('community.allDiscussions')}</button>
            {courses.slice(0, 6).map((c) => (
              <button key={c.id} onClick={() => setFilter(c.id)} className={cn('block w-full truncate rounded px-3 py-2 text-left text-sm', filter === 'c.id' ? 'bg-brand-50 font-medium text-brand-700' : 'text-muted hover:bg-line/40')}>{c.title}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {list.length === 0 && (
            <div className="card p-12 text-center">
              <p className="font-display text-lg font-semibold text-ink">{t('community.emptyTitle')}</p>
              <p className="mt-1 text-sm text-muted">{t('community.emptyMessage')}</p>
            </div>
          )}
          {list.map((d) => {
            const course = COURSES.find((c) => c.id === d.courseId)
            return (
              <article key={d.id} className="card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Avatar name={d.authorName} size="xs" />
                  <span className="text-sm font-medium text-ink">{d.authorName}</span>
                  <span className="text-xs text-muted">· {timeAgo(d.createdAt)}</span>
                  <Badge color="brand" className="ml-auto">{course?.title}</Badge>
                </div>
                <h3 className="mt-3 font-semibold text-ink">{d.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted">{d.body}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                  <button onClick={() => toast(t('community.liked'), d.title)} className="flex items-center gap-1.5 hover:text-brand-700"><ThumbsUp className="h-4 w-4" /> {d.likes}</button>
                  <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> {t('community.replies', { count: d.answers.length })}</span>
                  <span className="ml-auto flex items-center gap-1.5"><Heart className="h-4 w-4" /> {course?.rating}</span>
                  {d.answers.length > 0 && (
                    <span className="text-brand-700">{d.answers[0].authorName} replied: "{d.answers[0].text.slice(0, 40)}…"</span>
                  )}
                </div>
                <div className="mt-4 border-t border-line pt-3">
                  <input
                    placeholder={t('community.replyPlaceholder')}
                    className="input-base"
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) { toast(t('community.replyToast'), t('community.replyToastBody')); (e.target as HTMLInputElement).value = '' } }}
                  />
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}