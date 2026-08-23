import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Filter, SlidersHorizontal } from 'lucide-react'
import { CourseCard } from '../components/cards'
import { Button, SearchInput, Skeleton } from '../components/ui'
import { cn } from '../lib/utils'
import { EASE, Reveal } from '../lib/motion'
import { motion } from 'framer-motion'
import { publicApi } from '../lib/api/auth'
import type { Course } from '../lib/types'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

type CourseFromAPI = {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  price: number
  discountPrice?: number
  rating: number
  reviewCount: number
  studentCount: number
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  language: string
  hasCertificate: boolean
  isFeatured?: boolean
  isTrending?: boolean
  isNew?: boolean
  categoryName?: string
}

type MappedCourse = {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  longDescription: string
  categoryId: string
  instructorId: string
  thumbnail: string
  price: number
  discountPrice?: number
  rating: number
  reviewCount: number
  studentCount: number
  duration: number
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  language: string
  lastUpdated: string
  hasCertificate: boolean
  isFeatured?: boolean
  isTrending?: boolean
  isNew?: boolean
  status: 'published' | 'draft' | 'pending' | 'approved' | 'archived'
  instructorName?: string
  objectives?: string[]
  requirements?: string[]
  sections?: any[]
  reviews?: any[]
  faqs?: any[]
  categoryName?: string
}

export default function Courses() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; description: string }>>([])
  const [courses, setCourses] = useState<MappedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const category = params.get('category') ?? 'all'
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [sort, setSort] = useState('popular')
  const [level, setLevel] = useState('all')
  const [price, setPrice] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [certOnly, setCertOnly] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [cats, courseList] = await Promise.all([
          publicApi.listCategories(),
          publicApi.listCourses({ search, category })
        ])
        setCategories(cats.categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description })))
        // Map AdminCourse to MappedCourse for CourseCard compatibility
        const mapped = (courseList.courses ?? []).map((c: any) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          subtitle: c.subtitle,
          description: c.description,
          price: c.price,
          discountPrice: c.discountPrice,
          rating: c.rating,
          reviewCount: c.reviewCount,
          studentCount: c.studentCount,
          level: c.level,
          language: c.language,
          hasCertificate: c.hasCertificate,
          isFeatured: c.isFeatured,
          isTrending: c.isTrending,
          isNew: c.isNew,
          categoryName: c.categoryName
        }))
        setCourses(mapped as MappedCourse[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    })()
  }, [search, category])

  useEffect(() => {
    const qs = new URLSearchParams()
    if (category !== 'all') qs.set('category', category)
    if (search) qs.set('q', search)
    setParams(qs.toString())
  }, [category, search])

  const activeCategory = categories.find((c) => c.slug === category)

  const renderCourses = () => {
    let list = [...courses]

    if (category !== 'all') list = list.filter((c) => c.categoryName === activeCategory?.name)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    }
    if (level !== 'all') list = list.filter((c) => c.level === level)
    if (price === 'free') list = list.filter((c) => c.price === 0)
    if (price === 'paid') list = list.filter((c) => c.price > 0)
    if (price === 'discount') list = list.filter((c) => c.discountPrice)
    if (certOnly) list = list.filter((c) => c.hasCertificate)

    if (sort === 'popular') list.sort((a, b) => b.studentCount - a.studentCount)
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating)
    if (sort === 'price-asc') list.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price))
    if (sort === 'price-desc') list.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price))
    if (sort === 'new') list.sort((a, b) => (a.isNew ? 1 : 0) - (b.isNew ? 1 : 0))

    return list
  }

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <div className="container-page py-10">
          <Reveal>
            <p className="text-sm font-semibold text-brand-700">{t('catalog.courseCatalog')}</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-ink">
              {activeCategory ? t('catalog.categoryCourses', { name: activeCategory.name }) : t('catalog.exploreCourses')}
            </h1>
            <p className="mt-2 max-w-xl text-muted">{activeCategory?.description ?? t('catalog.heroDesc')}</p>
            <div className="mt-6 max-w-2xl">
              <SearchInput value={search} onChange={(v) => { setSearch(v); if (v) setParams({ q: v }) }} placeholder={t('catalog.searchPlaceholder')} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setParams(category === 'all' ? {} : { category: 'all' })}
            className={cn('chip shrink-0', category === 'all' && 'border-brand-500 bg-brand-50 text-brand-700')}
          >
            {t('catalog.all')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setParams({ category: c.slug })}
              className={cn('chip shrink-0', category === c.slug && 'border-brand-500 bg-brand-50 text-brand-700')}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className="btn-outline">
            <Filter className="h-4 w-4" /> {t('catalog.filters')} <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
          </button>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-muted sm:inline">{t('catalog.coursesCount', { count: courses.length })}</span>
            <label className="hidden items-center gap-2 text-muted md:flex">
              <SlidersHorizontal className="h-4 w-4" />
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-base w-auto py-1.5 pr-8">
                <option value="popular">{t('catalog.mostPopular')}</option>
                <option value="rating">{t('catalog.highestRated')}</option>
                <option value="new">{t('catalog.newest')}</option>
                <option value="price-asc">{t('catalog.priceLowHigh')}</option>
                <option value="price-desc">{t('catalog.priceHighLow')}</option>
              </select>
            </label>
          </div>
        </div>

        {showFilters && (
          <motion.div
            key="filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="card mt-4 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label-base">{t('catalog.level')}</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-base">
                  <option value="all">{t('catalog.allLevels')}</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">{t('catalog.price')}</label>
                <select value={price} onChange={(e) => setPrice(e.target.value)} className="input-base">
                  <option value="all">{t('catalog.allPrices')}</option>
                  <option value="free">{t('catalog.free')}</option>
                  <option value="paid">{t('catalog.paid')}</option>
                  <option value="discount">{t('catalog.onSale')}</option>
                </select>
              </div>
              <div>
                <label className="label-base">{t('catalog.certificate')}</label>
                <label className="flex items-center gap-2 pt-2 text-sm text-ink">
                  <input type="checkbox" checked={certOnly} onChange={(e) => setCertOnly(e.target.checked)} className="h-4 w-4 rounded border-line accent-brand-500" />
                  {t('catalog.certificateAvailable')}
                </label>
              </div>
              <div>
                <label className="label-base">{t('catalog.sort')}</label>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-base md:hidden">
                  <option value="popular">{t('catalog.mostPopular')}</option>
                  <option value="rating">{t('catalog.highestRated')}</option>
                  <option value="new">{t('catalog.newest')}</option>
                  <option value="price-asc">{t('catalog.priceLowHigh')}</option>
                  <option value="price-desc">{t('catalog.priceHighLow')}</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="font-display text-lg font-semibold text-ink">{t('catalog.noResults')}</p>
              <p className="mt-1 text-sm text-muted">{t('catalog.noResultsBody')}</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setLevel('all'); setPrice('all'); setCertOnly(false) }}>{t('catalog.clearFilters')}</Button>
            </div>
          ) : (
            <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {renderCourses().map((c) => (
                <motion.div key={c.id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                  <CourseCard course={c as unknown as Course} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}