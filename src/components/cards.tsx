import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, BookOpen, Clock, Heart, Users } from 'lucide-react'
import type { Course, User } from '../lib/types'
import { discountPercent, formatDuration, formatPrice } from '../lib/utils'
import { useApp } from '../lib/store'
import { Avatar, Badge, Rating } from './ui'
import { cn } from '../lib/utils'

export function CourseCard({ course, large, compact }: { course: Course; large?: boolean; compact?: boolean }) {
  const nav = useNavigate()
  const { t } = useTranslation()
  const { currentUser, wishlist, toggleWishlist, toast } = useApp()
  const saved = wishlist.includes(course.id)
  const disc = discountPercent(course.price, course.discountPrice)

  const go = () => nav(`/courses/${course.slug}`)
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUser) { toast(t('cards.signInRequired'), t('cards.signInRequiredBody'), 'error'); return }
    toggleWishlist(course.id)
    toast(saved ? t('cards.removedFromWishlist') : t('cards.savedToWishlist'), course.title)
  }

  const sectionsCount = course.sections?.length ?? 0
  const studentCount = course.studentCount ?? 0
  const duration = course.duration ?? 0
  const rating = course.rating ?? 0
  const reviewCount = course.reviewCount ?? 0
  const price = course.price ?? 0

  return (
    <article
      onClick={go}
      className="group card flex h-full cursor-pointer flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-brand-900">
        <img src={course.thumbnail || '/placeholder-course.jpg'} alt={course.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        <button
          onClick={toggle}
          aria-label={saved ? t('cards.removeFromWishlist') : t('cards.addToWishlist')}
          className={cn('absolute right-3 top-3 rounded-full bg-surface/95 p-2 shadow-card transition-colors', saved ? 'text-danger' : 'text-muted hover:text-ink')}
        >
          <Heart className={cn('h-4 w-4', saved && 'fill-danger')} />
        </button>
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {course.level && <Badge color="ink">{t(`cards.level_${course.level.toLowerCase()}`)}</Badge>}
          {course.hasCertificate && <Badge color="brand">{t('cards.certificate')}</Badge>}
        </div>
      </div>

      <div className={cn('flex flex-1 flex-col gap-2 p-4', large && 'p-5')}>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{course.categoryId === 'c1' ? t('cards.cybersecurity') : t('cards.course')}</p>
        <h3 className={cn('line-clamp-2 font-semibold leading-snug text-ink', large ? 'text-lg' : 'text-[15px]')}>{course.title}</h3>
        <p className="line-clamp-1 text-xs text-muted">{course.subtitle}</p>

        <div className="flex items-center gap-1.5 text-xs">
          <Rating value={rating} size="xs" count={reviewCount} />
        </div>

        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{studentCount.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDuration(duration * 60)}</span>
          {!compact && sectionsCount > 0 && <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{t('cards.sections', { count: sectionsCount })}</span>}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            {price === 0 ? (
              <span className="text-base font-bold text-success">{t('cards.free')}</span>
            ) : (
              <>
                <span className="text-base font-bold text-ink">{formatPrice(course.discountPrice ?? price)}</span>
                {course.discountPrice && <span className="text-xs text-muted line-through">{formatPrice(price)}</span>}
                {disc > 0 && <Badge color="danger">{t('cards.off', { pct: disc })}</Badge>}
              </>
            )}
          </div>
          {!compact && <span className="text-sm font-medium text-brand-700 opacity-0 transition-opacity group-hover:opacity-100">{t('cards.view')}</span>}
        </div>
      </div>
    </article>
  )
}

export function InstructorCard({ instructor }: { instructor: User }) {
  const nav = useNavigate()
  const { t } = useTranslation()
  const courses = instructor.courseCount ?? 0
  return (
    <button onClick={() => nav(`/instructors/${instructor.id}`)} className="card group flex h-full flex-col items-center gap-3 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Avatar name={instructor.name} size="xl" />
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">{instructor.name}</h3>
        <p className="mt-0.5 text-sm text-muted">{instructor.title}</p>
      </div>
      <div className="flex items-center gap-1">
        <Rating value={instructor.rating ?? 4.8} size="xs" />
      </div>
      <div className="flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t('cards.students', { count: instructor.studentCount ?? 0 })}</span>
        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{t('cards.coursesCount', { count: courses })}</span>
      </div>
      <span className="mt-1 text-sm font-medium text-brand-700 opacity-0 transition-opacity group-hover:opacity-100">{t('cards.viewProfile')}</span>
    </button>
  )
}

export function PathIcon({ icon, className }: { icon: string; className?: string }) {
  const map: Record<string, React.ReactNode> = {
    Shield: <BarChart3 className={className} />,
    Code2: <BarChart3 className={className} />,
    BarChart3: <BarChart3 className={className} />,
    Cloud: <BarChart3 className={className} />,
    TrendingUp: <BarChart3 className={className} />
  }
  return <>{map[icon] ?? <BarChart3 className={className} />}</>
}
