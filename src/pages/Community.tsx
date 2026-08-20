import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { COURSES } from '../lib/data'
import { useApp } from '../lib/store'
import { Button, SearchInput } from '../components/ui'
import { cn } from '../lib/utils'

export default function Community() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const courses = COURSES.filter((c) => c.status === 'published')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('community.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('community.subtitle')}</p>
        </div>
        <Button onClick={() => toast(t('community.ask'))}><Plus className="h-4 w-4" /> {t('community.ask')}</Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-60">
          <SearchInput value={search} onChange={setSearch} placeholder={t('community.search')} />
          <div className="mt-4 space-y-1">
            <button onClick={() => setFilter('all')} className={cn('block w-full rounded px-3 py-2 text-left text-sm', filter === 'all' ? 'bg-brand-50 font-medium text-brand-700' : 'text-muted hover:bg-line/40')}>{t('community.allDiscussions')}</button>
            {courses.slice(0, 6).map((c) => (
              <button key={c.id} onClick={() => setFilter(c.id)} className={cn('block w-full truncate rounded px-3 py-2 text-left text-sm', filter === c.id ? 'bg-brand-50 font-medium text-brand-700' : 'text-muted hover:bg-line/40')}>{c.title}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="card p-12 text-center">
            <p className="font-display text-lg font-semibold text-ink">{t('community.emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('community.emptyMessage')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}