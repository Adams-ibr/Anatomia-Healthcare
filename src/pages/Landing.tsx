import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Award, BookOpen, CheckCircle2, ChevronRight, Clock, Code2, Compass,
  GraduationCap, ListChecks, MessageSquare, PlayCircle, ShieldCheck,
  Sparkles, TrendingUp, Trophy
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useApp } from '../lib/store'
import { categoriesApi, coursesApi, membersApi, faqApi, partnersApi, articlesApi } from '../lib/supabase'
import type { AdminCourse, AdminCategory, PublicInstructor } from '../lib/api/auth'
import { CourseCard, InstructorCard } from '../components/cards'
import { Accordion, Avatar, Badge, Button, Rating, Skeleton } from '../components/ui'
import { formatPrice } from '../lib/utils'
import { cn } from '../lib/utils'
import { Counter, EASE, Reveal } from '../lib/motion'
import type { Course, User } from '../lib/types'
import PartnersSlider from '../components/PartnersSlider'

// ---------------------------------------------------------------------------
// Motion variants
// ---------------------------------------------------------------------------
const HERO_LEFT = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
}
const HERO_ITEM = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } }
}

// ---------------------------------------------------------------------------
// Static sections (no API needed)
// ---------------------------------------------------------------------------
const WHY = (t: (key: string) => string) => [
  { icon: <Award className="h-5 w-5" />, title: t('landing.why1Title'), text: t('landing.why1Text') },
  { icon: <ListChecks className="h-5 w-5" />, title: t('landing.why2Title'), text: t('landing.why2Text') },
  { icon: <Code2 className="h-5 w-5" />, title: t('landing.why3Title'), text: t('landing.why3Text') },
  { icon: <GraduationCap className="h-5 w-5" />, title: t('landing.why4Title'), text: t('landing.why4Text') },
  { icon: <Clock className="h-5 w-5" />, title: t('landing.why5Title'), text: t('landing.why5Text') },
  { icon: <MessageSquare className="h-5 w-5" />, title: t('landing.why6Title'), text: t('landing.why6Text') }
]

const FLOW = (t: (key: string) => string) => [
  { step: t('landing.flow1Step'), text: t('landing.flow1Text'), icon: <Compass className="h-5 w-5" /> },
  { step: t('landing.flow2Step'), text: t('landing.flow2Text'), icon: <PlayCircle className="h-5 w-5" /> },
  { step: t('landing.flow3Step'), text: t('landing.flow3Text'), icon: <BookOpen className="h-5 w-5" /> },
  { step: t('landing.flow4Step'), text: t('landing.flow4Text'), icon: <Code2 className="h-5 w-5" /> },
  { step: t('landing.flow5Step'), text: t('landing.flow5Text'), icon: <CheckCircle2 className="h-5 w-5" /> },
  { step: t('landing.flow6Step'), text: t('landing.flow6Text'), icon: <Trophy className="h-5 w-5" /> }
]

// ---------------------------------------------------------------------------
// Helpers: adapt API shapes to component props
// ---------------------------------------------------------------------------
function apiCourseToCard(c: any): Course {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.short_description || c.subtitle || '',
    description: c.description || c.short_description || '',
    longDescription: c.description || '',
    categoryId: c.category || c.categoryId || '',
    instructorId: c.created_by || c.instructorId || '',
    instructorName: c.instructorName || c.instructor_name || 'Anatomia Faculty',
    thumbnail: c.thumbnail_url || c.thumbnail || '',
    price: typeof c.price === 'number' ? c.price : (parseFloat(c.price) || 0),
    discountPrice: c.discount_price ?? c.discountPrice,
    rating: typeof c.rating === 'number' ? c.rating : 5.0,
    reviewCount: c.review_count ?? c.reviewCount ?? 0,
    studentCount: c.student_count ?? c.studentCount ?? 0,
    duration: typeof c.duration === 'string' ? (parseInt(c.duration) || 0) : (c.duration ?? 0),
    level: c.level || 'Beginner',
    language: c.language || 'English',
    lastUpdated: c.updated_at || c.created_at || c.lastUpdated || '',
    hasCertificate: c.has_certificate ?? true,
    isFeatured: c.is_featured ?? c.isFeatured ?? false,
    isTrending: c.is_trending ?? c.isTrending ?? false,
    isNew: c.is_new ?? c.isNew ?? false,
    status: c.is_published ? 'published' : (c.status || 'draft'),
    objectives: [],
    requirements: [],
    sections: [],
    reviews: [],
    faqs: []
  } as Course
}

function apiInstructorToCard(i: PublicInstructor): User {
  return {
    id: i.id,
    name: i.name,
    email: '',
    role: 'instructor',
    avatar: i.avatar,
    title: i.title,
    bio: i.bio,
    headline: i.headline,
    skills: i.skills,
    studentCount: i.studentCount,
    courseCount: i.courseCount,
    rating: i.rating,
    joinedAt: '',
    isActive: true
  } as User
}

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------
function CourseSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3 mt-2" />
      </div>
    </div>
  )
}

function CategorySkeleton() {
  return (
    <div className="card flex items-start gap-3 p-5">
      <Skeleton className="h-10 w-10 rounded-card" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

function InstructorSkeleton() {
  return (
    <div className="card flex flex-col items-center gap-3 p-6">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Landing() {
  const nav = useNavigate()
  const { currentUser, toast } = useApp()
  const { t } = useTranslation()

  // API data
  const [categories, setCategories] = useState<any[]>([])
  const [featured, setFeatured] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])

  // Loading states per section
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [loadingInstructors, setLoadingInstructors] = useState(true)

  // Stats derived from live API data (updated once courses load)
  const [stats, setStats] = useState<{ value: number; suffix: string; label: string }[]>([])

  // Additional Supabase data
  const [faqs, setFaqs] = useState<any[]>([])
  const [partnersList, setPartnersList] = useState<any[]>([])
  const [articlesList, setArticlesList] = useState<any[]>([])

  useEffect(() => {
    // Fetch all live data sources in parallel from Supabase
    categoriesApi.list()
      .then((res) => setCategories(res ?? []))
      .catch(() => {})
      .finally(() => setLoadingCats(false))

    partnersApi.list({ is_active: true })
      .then((res) => setPartnersList(res ?? []))
      .catch(() => {})

    articlesApi.list({ is_published: true })
      .then((res) => setArticlesList(res ?? []))
      .catch(() => {})

    faqApi.list()
      .then((res) => setFaqs(res ?? []))
      .catch(() => {})

    coursesApi.list({ status: 'published' })
      .then((res) => {
        const published = res ?? []
        setFeatured(published.filter((c: any) => c.is_featured).slice(0, 4))
        setTrending(published.filter((c: any) => c.is_trending).slice(0, 4))
        
        // Derive stats from all published courses
        const courses = published
        const totalStudents = courses.reduce((s: number, c: any) => s + (c.student_count || c.studentCount || 0), 0)
        const avgRating = courses.length
          ? Number((courses.reduce((s: number, c: any) => s + (c.rating || 0), 0) / courses.length).toFixed(0))
          : 0
        setStats([
          { value: Math.max(1, Math.round(totalStudents / 1000)), suffix: 'K+', label: t('landing.statLearners') },
          { value: courses.length, suffix: '+', label: t('landing.statCourses') },
          { value: 0, suffix: '+', label: t('landing.statInstructors') }, // filled below
          { value: avgRating, suffix: '%', label: t('landing.statSatisfaction') }
        ])
      })
      .catch(() => {})

    membersApi.list({ role: 'instructor' })
      .then((res) => {
        const instructorsList = res ?? []
        setInstructors(instructorsList as any)
        setStats((prev) => prev.map((s) =>
          s.label === t('landing.statInstructors')
            ? { ...s, value: instructorsList.length }
            : s
        ))
      })
      .catch(() => {})
      .finally(() => {
        setLoadingFeatured(false)
        setLoadingTrending(false)
        setLoadingInstructors(false)
      })
  }, [t])

  const why = WHY(t)
  const flow = FLOW(t)

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-brand-50 blur-3xl" />
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <motion.div variants={HERO_LEFT} initial="hidden" animate="show">
            <motion.div variants={HERO_ITEM}>
              <Badge color="brand" className="mb-5">
                <Sparkles className="h-3.5 w-3.5" /> {t('landing.heroBadge')}
              </Badge>
            </motion.div>
            <motion.div variants={HERO_ITEM}>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
                {t('landing.heroTitle')}
              </h1>
            </motion.div>
            <motion.div variants={HERO_ITEM}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
                {t('landing.heroBody')}
              </p>
            </motion.div>
            <motion.div variants={HERO_ITEM}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={() => nav('/courses')} className="px-6 py-3 text-base">
                  {t('landing.exploreCourses')} <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => nav('/register?role=instructor')} className="px-6 py-3 text-base">
                  {t('landing.becomeInstructor')}
                </Button>
              </div>
            </motion.div>
            <motion.div variants={HERO_ITEM}>
              <div className="mt-8 flex items-center gap-4 text-sm text-muted">
                {instructors.length > 0 ? (
                  <div className="flex -space-x-2">
                    {instructors.slice(0, 3).map((ins) => (
                      <Avatar key={ins.id} name={ins.name} size="sm" className="ring-2 ring-paper" />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-brand-700 font-medium">
                    <ShieldCheck className="h-5 w-5 text-brand-600" />
                    <span>Specialized Anatomy & Health Sciences Platform</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Hero real course showcase */}
          <motion.div
            initial={{ opacity: 0, y: 44, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.15, ease: EASE }}
            className="relative mx-auto w-full max-w-xl"
          >
            {featured[0] ? (
              <div className="card overflow-hidden shadow-panel border border-line">
                {featured[0].thumbnail_url ? (
                  <div className="relative aspect-video w-full overflow-hidden bg-brand-900">
                    <img
                      src={featured[0].thumbnail_url}
                      alt={featured[0].title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-brand-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      Featured Course
                    </span>
                  </div>
                ) : null}
                <div className="p-6">
                  <div className="flex items-center justify-between text-xs font-medium text-brand-700">
                    <span className="rounded bg-brand-50 px-2 py-0.5 uppercase tracking-wide">
                      {featured[0].category || 'Anatomy'}
                    </span>
                    <span className="text-muted">{featured[0].duration || 'Comprehensive'}</span>
                  </div>
                  <h3 className="mt-2.5 font-display text-xl font-bold text-ink">
                    {featured[0].title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted line-clamp-2">
                    {featured[0].short_description || featured[0].description || 'Master clinical anatomy through detailed modular lessons.'}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <div>
                      <span className="text-xs text-muted">Access</span>
                      <p className="text-base font-bold text-ink">
                        {featured[0].is_free || featured[0].price === 0 ? 'Free' : `₦${featured[0].price?.toLocaleString()}`}
                      </p>
                    </div>
                    <Button onClick={() => nav(`/courses/${featured[0].slug}`)} className="px-4 py-2 text-sm">
                      Start Learning
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center shadow-panel">
                <BookOpen className="mx-auto h-12 w-12 text-brand-500" />
                <h3 className="mt-4 font-display text-lg font-bold text-ink">Anatomia Healthcare Portal</h3>
                <p className="mt-2 text-sm text-muted">Access structured medical courses and clinical modules.</p>
                <Button className="mt-5" onClick={() => nav('/courses')}>Browse Catalog</Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── PARTNERS / ACCREDITATIONS ────────────────────────────────────── */}
      {partnersList.length > 0 && (
        <section className="border-b border-line bg-surface py-10">
          <div className="container-page">
            <Reveal y={16}>
              <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted">
                Collaborating Institutions & Healthcare Partners
              </p>
              <PartnersSlider partners={partnersList} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── CATEGORIES GRID ──────────────────────────────────────────────── */}
      <section className="container-page py-16 lg:py-20">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-700">{t('landing.categoriesEyebrow')}</p>
              <h2 className="section-title mt-1">{t('landing.categoriesTitle')}</h2>
            </div>
            <Link to="/courses" className="hidden items-center gap-1 text-sm font-medium text-brand-700 hover:underline sm:flex">
              {t('landing.allCourses')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {loadingCats
            ? Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.map((cat, i) => (
                <Reveal key={cat.id} delay={Math.min(i * 0.05, 0.3)}>
                  <Link
                    to={`/courses?category=${cat.slug}`}
                    className="card group flex items-start gap-3 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                  >
                    <div
                      className="rounded-card p-2.5 text-white transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: cat.color ?? '#1B4E9B' }}
                    >
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{cat.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {t('landing.courseCount', { count: cat.courseCount })}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))
          }
        </div>
      </section>

      {/* ── FEATURED COURSES ─────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-brand-700">{t('landing.featuredEyebrow')}</p>
              <h2 className="section-title mt-1">{t('landing.featuredTitle')}</h2>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {loadingFeatured
              ? Array.from({ length: 4 }).map((_, i) => <CourseSkeleton key={i} />)
              : featured.length > 0
                ? featured.map((c, i) => (
                    <Reveal key={c.id} delay={Math.min(i * 0.07, 0.28)}>
                      <CourseCard course={apiCourseToCard(c)} />
                    </Reveal>
                  ))
                : (
                    <div className="col-span-4 py-12 text-center text-muted">
                      <p className="text-sm">{t('landing.noFeatured', 'No featured courses yet.')}</p>
                      <Button variant="outline" className="mt-4" onClick={() => nav('/courses')}>
                        {t('landing.browseCourses')}
                      </Button>
                    </div>
                  )
            }
          </div>
        </div>
      </section>

      {/* ── WHY HAMA ─────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-brand-700">{t('landing.whyEyebrow')}</p>
              <h2 className="section-title mt-1">{t('landing.whyTitle')}</h2>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {why.map((w, i) => (
              <Reveal key={w.title} delay={Math.min(i * 0.06, 0.3)}>
                <div className="card group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <div className="mb-4 inline-flex rounded-card bg-brand-50 p-3 text-brand-700 transition-transform duration-300 group-hover:scale-110">{w.icon}</div>
                  <h3 className="font-semibold text-ink">{w.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{w.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold text-brand-700">{t('landing.experienceEyebrow')}</p>
              <h2 className="section-title mt-1">{t('landing.experienceTitle')}</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {flow.map((f, i) => (
              <Reveal key={f.step} delay={Math.min(i * 0.07, 0.35)} className="group">
                <div className="relative text-center">
                  {i < flow.length - 1 && <div className="absolute left-[60%] top-8 hidden h-px w-[80%] bg-line lg:block" />}
                  <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-brand-700 transition-transform duration-300 group-hover:scale-110">
                    {f.icon}
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">{i + 1}</span>
                  </div>
                  <p className="font-semibold text-ink">{f.step}</p>
                  <p className="mt-1 text-xs text-muted">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTRUCTORS ──────────────────────────────────────────────────── */}
      <section className="container-page py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="text-sm font-semibold text-brand-700">{t('landing.instructorEyebrow')}</p>
              <h2 className="section-title mt-1">{t('landing.instructorTitle')}</h2>
              <p className="mt-4 leading-relaxed text-muted">{t('landing.instructorBody')}</p>
              <ul className="mt-6 space-y-3">
                {[
                  t('landing.instructorFeature1'),
                  t('landing.instructorFeature2'),
                  t('landing.instructorFeature3'),
                  t('landing.instructorFeature4')
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-ink">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-8" onClick={() => nav('/register?role=instructor')}>
                {t('landing.becomeInstructor')} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {loadingInstructors
              ? Array.from({ length: 4 }).map((_, i) => <InstructorSkeleton key={i} />)
              : instructors.length > 0
                ? instructors.slice(0, 4).map((ins, i) => (
                    <Reveal key={ins.id} delay={Math.min(i * 0.07, 0.28)}>
                      <InstructorCard instructor={apiInstructorToCard(ins)} />
                    </Reveal>
                  ))
                : (
                    <div className="col-span-2 py-8 text-center text-sm text-muted">
                      {t('landing.learnFromPros')}
                    </div>
                  )
            }
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-brand-700">{t('landing.numbersEyebrow')}</p>
              <h2 className="section-title mt-1">{t('landing.numbersTitle')}</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.length > 0
              ? stats.map((s, i) => (
                  <Reveal key={s.label} delay={i * 0.08}>
                    <div className="text-center">
                      <Counter to={s.value} suffix={s.suffix} className="font-display text-4xl font-bold text-brand-700" />
                      <p className="mt-1 text-sm text-muted">{s.label}</p>
                    </div>
                  </Reveal>
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="mx-auto mb-2 h-10 w-20" />
                    <Skeleton className="mx-auto h-4 w-24" />
                  </div>
                ))
            }
          </div>
        </div>
      </section>

      {/* ── CLINICAL ARTICLES & RESEARCH ─────────────────────────────────── */}
      {articlesList.length > 0 && (
        <section className="container-page py-16 lg:py-20">
          <Reveal>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-700">Clinical Library</p>
                <h2 className="section-title mt-1">Anatomical & Clinical Articles</h2>
              </div>
              <Link to="/articles" className="hidden items-center gap-1 text-sm font-medium text-brand-700 hover:underline sm:flex">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articlesList.map((article) => (
              <div key={article.id} className="card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift border border-line">
                {article.image_url && (
                  <div className="aspect-video w-full overflow-hidden bg-brand-50">
                    <img src={article.image_url} alt={article.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <span className="text-xs font-semibold uppercase text-brand-700">{article.category || 'Anatomy'}</span>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">{article.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{article.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
                    <span>By {article.author}</span>
                    <Link to={`/articles/${article.slug || article.id}`} className="font-medium text-brand-700 hover:underline">Read article →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── TRENDING COURSES ─────────────────────────────────────────────── */}
      <section className="container-page py-16 lg:py-20">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-brand-700">{t('landing.trendingEyebrow')}</p>
            <h2 className="section-title mt-1">{t('landing.trendingTitle')}</h2>
          </div>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loadingTrending
            ? Array.from({ length: 4 }).map((_, i) => <CourseSkeleton key={i} />)
            : trending.length > 0
              ? trending.map((c, i) => (
                  <Reveal key={c.id} delay={Math.min(i * 0.07, 0.28)}>
                    <CourseCard course={apiCourseToCard(c)} />
                  </Reveal>
                ))
              : (
                  <div className="col-span-4 py-12 text-center text-muted">
                    <p className="text-sm">{t('landing.noTrending', 'No trending courses yet.')}</p>
                    <Button variant="outline" className="mt-4" onClick={() => nav('/courses')}>
                      {t('landing.browseCourses')}
                    </Button>
                  </div>
                )
          }
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="container-page max-w-3xl py-16 lg:py-20">
          <Reveal>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-brand-700">{t('landing.faqEyebrow')}</p>
              <h2 className="section-title mt-1">{t('landing.faqTitle')}</h2>
            </div>
          </Reveal>
          <div className="card px-6">
            {faqs.map((f: any, i: number) => (
              <Accordion key={f.id || i} title={<span>{f.question || f.q}</span>} defaultOpen={i === 0}>
                <p className="text-sm leading-relaxed text-muted">{f.answer || f.a}</p>
              </Accordion>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-line bg-brand-900">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
          <Reveal>
            <h2 className="max-w-2xl font-display text-3xl font-bold text-white">{t('landing.ctaTitle')}</h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-200">{t('landing.ctaBody')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => nav('/register')}
                className="bg-white px-6 py-3 text-base text-brand-900 hover:bg-brand-50"
              >
                {t('landing.createFreeAccount')}
              </Button>
              <Button
                onClick={() => nav('/courses')}
                className="border border-brand-400 bg-transparent px-6 py-3 text-base text-white hover:bg-brand-800"
              >
                {t('landing.browseCourses')}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
