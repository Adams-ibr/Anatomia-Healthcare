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
import { publicApi } from '../lib/api/auth'
import type { AdminCourse, AdminCategory, PublicInstructor } from '../lib/api/auth'
import { FAQS, LEARNING_PATHS, PLANS, TESTIMONIALS } from '../lib/data'
import { CourseCard, InstructorCard } from '../components/cards'
import { Accordion, Avatar, Badge, Button, Rating, Skeleton } from '../components/ui'
import { formatPrice } from '../lib/utils'
import { cn } from '../lib/utils'
import { Counter, EASE, Reveal } from '../lib/motion'
import type { Course, User } from '../lib/types'

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
function apiCourseToCard(c: AdminCourse): Course {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    longDescription: '',
    categoryId: c.categoryId,
    instructorId: c.instructorId,
    instructorName: c.instructorName,
    thumbnail: c.thumbnail,
    price: c.price,
    discountPrice: c.discountPrice,
    rating: c.rating,
    reviewCount: c.reviewCount,
    studentCount: c.studentCount,
    duration: c.duration,
    level: c.level,
    language: c.language,
    lastUpdated: c.lastUpdated,
    hasCertificate: c.hasCertificate,
    isFeatured: c.isFeatured ?? false,
    isTrending: c.isTrending ?? false,
    isNew: c.isNew ?? false,
    status: c.status,
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
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [featured, setFeatured] = useState<AdminCourse[]>([])
  const [trending, setTrending] = useState<AdminCourse[]>([])
  const [instructors, setInstructors] = useState<PublicInstructor[]>([])

  // Loading states per section
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [loadingInstructors, setLoadingInstructors] = useState(true)

  // Stats derived from live API data (updated once courses load)
  const [stats, setStats] = useState<{ value: number; suffix: string; label: string }[]>([])

  useEffect(() => {
    // Fetch all four data sources in parallel
    publicApi.listCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => {/* keep empty */})
      .finally(() => setLoadingCats(false))

    publicApi.listCourses({ featured: true, limit: 4 })
      .then((res) => setFeatured(res.courses ?? []))
      .catch(() => {/* keep empty */})
      .finally(() => setLoadingFeatured(false))

    publicApi.listCourses({ trending: true, limit: 4 })
      .then((res) => setTrending(res.courses ?? []))
      .catch(() => {/* keep empty */})
      .finally(() => setLoadingTrending(false))

    publicApi.listInstructors()
      .then((res) => setInstructors(res.instructors))
      .catch(() => {/* keep empty */})
      .finally(() => setLoadingInstructors(false))

    // Derive stats from all published courses
    publicApi.listCourses({ limit: 100 })
      .then((res) => {
        const courses = res.courses ?? []
        const totalStudents = courses.reduce((s, c) => s + c.studentCount, 0)
        const avgRating = courses.length
          ? Number((courses.reduce((s, c) => s + c.rating, 0) / courses.length).toFixed(0))
          : 0
        setStats([
          { value: Math.max(1, Math.round(totalStudents / 1000)), suffix: 'K+', label: t('landing.statLearners') },
          { value: courses.length, suffix: '+', label: t('landing.statCourses') },
          { value: 0, suffix: '+', label: t('landing.statInstructors') }, // filled below
          { value: avgRating, suffix: '%', label: t('landing.statSatisfaction') }
        ])
      })
      .catch(() => {})

    publicApi.listInstructors()
      .then((res) => {
        setStats((prev) => prev.map((s) =>
          s.label === t('landing.statInstructors')
            ? { ...s, value: res.instructors.length }
            : s
        ))
      })
      .catch(() => {})
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
                <div className="flex -space-x-2">
                  {instructors.slice(0, 3).map((ins) => (
                    <Avatar key={ins.id} name={ins.name} size="sm" className="ring-2 ring-paper" />
                  ))}
                  {loadingInstructors && [1, 2, 3].map((n) => (
                    <Skeleton key={n} className="h-8 w-8 rounded-full ring-2 ring-paper" />
                  ))}
                </div>
                <div>
                  <Rating value={4.8} />
                  <p className="text-xs text-muted">{t('landing.trustedBy')}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero mock UI */}
          <motion.div
            initial={{ opacity: 0, y: 44, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.15, ease: EASE }}
            className="relative mx-auto w-full max-w-xl"
          >
            <div className="card overflow-hidden shadow-panel">
              <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
                <Avatar name={currentUser?.name || 'Aminu Garba'} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {currentUser ? `${t('landing.mockGreeting')}, ${currentUser.name}` : t('landing.mockGreeting')}
                  </p>
                  <p className="text-xs text-muted">{t('landing.mockStreak')}</p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs font-medium text-success">
                  <Trophy className="h-3.5 w-3.5" /> {t('landing.mockDays')}
                </div>
              </div>
              <div className="space-y-4 bg-surface p-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">
                      {featured[0]?.title ?? t('landing.mockCourseTitle')}
                    </span>
                    <span className="text-muted">78%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div className="h-full w-[78%] rounded-full bg-brand-500" />
                  </div>
                  <p className="mt-2 text-xs text-muted">{t('landing.mockContinue')}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-card border border-line p-3">
                    <p className="text-xs text-muted">{t('landing.mockCompleted')}</p>
                    <p className="text-lg font-bold text-ink">3</p>
                  </div>
                  <div className="rounded-card border border-line p-3">
                    <p className="text-xs text-muted">{t('landing.mockCertificates')}</p>
                    <p className="text-lg font-bold text-ink">2</p>
                  </div>
                </div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -34 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
            >
              <div className="card absolute -bottom-6 -left-4 hidden w-56 p-4 shadow-panel sm:block" style={{ animation: 'float 5s ease-in-out infinite' }}>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-brand-50 p-2 text-brand-700"><ShieldCheck className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-semibold text-ink">{t('landing.mockCertEarned')}</p>
                    <p className="text-[11px] text-muted">{featured[0]?.title ?? t('landing.mockCertCourse')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 34 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
            >
              <div className="card absolute -right-4 -top-5 hidden w-48 p-4 shadow-panel sm:block" style={{ animation: 'float-delayed 6s ease-in-out infinite' }}>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-success/10 p-2 text-success"><TrendingUp className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-semibold text-ink">{t('landing.mockScore')}</p>
                    <p className="text-[11px] text-muted">{t('landing.mockScoreVal')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CATEGORY PILLS ───────────────────────────────────────────────── */}
      <section className="border-b border-line bg-surface py-10">
        <div className="container-page">
          <Reveal y={16}>
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted">{t('landing.trustedTeams')}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
              {loadingCats
                ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-32 rounded-full" />)
                : categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/courses?category=${cat.slug}`}
                      className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-brand-400 hover:text-brand-700"
                    >
                      <ShieldCheck className="h-4 w-4" /> {cat.name}
                    </Link>
                  ))}
            </div>
          </Reveal>
        </div>
      </section>

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

      {/* ── LEARNING PATHS ───────────────────────────────────────────────── */}
      <section className="container-page py-16 lg:py-20">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-brand-700">{t('landing.pathsEyebrow')}</p>
            <h2 className="section-title mt-1">{t('landing.pathsTitle')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">{t('landing.pathsBody')}</p>
          </div>
        </Reveal>
        <div className="grid gap-5 lg:grid-cols-3">
          {LEARNING_PATHS.slice(0, 3).map((lp, i) => (
            <Reveal key={lp.id} delay={Math.min(i * 0.08, 0.24)}>
              <div className="card group flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="mb-4 inline-flex w-fit rounded-card bg-brand-50 p-3 text-brand-700 transition-transform duration-300 group-hover:scale-110">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">{lp.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{lp.description}</p>
                <p className="mt-3 text-xs font-medium text-brand-700">{lp.career}</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-xs text-muted">
                    {t('landing.pathMeta', { count: lp.courses.length, level: lp.level })}
                  </span>
                  <button
                    onClick={() => { toast(t('landing.pathSaved'), t('landing.pathSavedBody')); nav('/courses') }}
                    className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
                  >
                    {t('landing.viewPath')} <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-brand-700">{t('landing.testimonialsEyebrow')}</p>
              <h2 className="section-title mt-1">{t('landing.testimonialsTitle')}</h2>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((item, i) => (
              <Reveal key={item.id} delay={Math.min(i * 0.07, 0.28)}>
                <figure className="card flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <Rating value={item.rating} size="xs" />
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink">"{item.text}"</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <Avatar name={item.name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      <p className="text-xs text-muted">{item.role} · {item.company}</p>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-brand-700">{t('landing.pricingEyebrow')}</p>
              <h2 className="section-title mt-1">{t('landing.pricingTitle')}</h2>
            </div>
          </Reveal>
          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 0.08, 0.24)}>
                <div className={cn(
                  'card group relative flex h-full flex-col p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift',
                  p.highlight && 'border-brand-500 ring-1 ring-brand-500'
                )}>
                  {p.highlight && (
                    <Badge color="brand" className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {t('landing.mostPopular')}
                    </Badge>
                  )}
                  <h3 className="font-display text-xl font-semibold text-ink">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted">{p.description}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-ink">
                      {p.price === 0 ? t('landing.free') : formatPrice(p.price)}
                    </span>
                    {p.price > 0 && <span className="text-sm text-muted">/{p.period}</span>}
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-ink">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={p.highlight ? 'primary' : 'outline'}
                    className="mt-7 w-full"
                    onClick={() => nav('/register')}
                  >
                    {p.price === 0 ? t('landing.startFree') : t('landing.getStarted')}
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="container-page max-w-3xl py-16 lg:py-20">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-brand-700">{t('landing.faqEyebrow')}</p>
            <h2 className="section-title mt-1">{t('landing.faqTitle')}</h2>
          </div>
        </Reveal>
        <div className="card px-6">
          {FAQS.map((f, i) => (
            <Accordion key={i} title={<span>{f.q}</span>} defaultOpen={i === 0}>
              <p className="text-sm leading-relaxed text-muted">{f.a}</p>
            </Accordion>
          ))}
        </div>
      </section>

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
