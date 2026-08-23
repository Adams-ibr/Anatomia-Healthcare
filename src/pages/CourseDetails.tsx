import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Award, BookOpen, CheckCircle2, ChevronDown, Clock, FileText, Globe, Heart,
  Info, ListVideo, MessageSquare, PlayCircle, RotateCcw, ShieldCheck, Users
} from 'lucide-react'
import { CATEGORIES, COURSES } from '../lib/data'
import { Course } from '../lib/types'
import { useApp } from '../lib/store'
import { CourseCard } from '../components/cards'
import { Accordion, Avatar, Badge, Button, Rating } from '../components/ui'
import { discountPercent, formatDuration, formatPrice, timeAgo } from '../lib/utils'
import { cn } from '../lib/utils'
import { publicApi } from '../lib/api/auth'

const TYPE_ICON: Record<string, React.ReactNode> = {
  video: <PlayCircle className="h-4 w-4" />,
  article: <FileText className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  audio: <PlayCircle className="h-4 w-4" />,
  quiz: <CheckCircle2 className="h-4 w-4" />,
  assignment: <ListVideo className="h-4 w-4" />,
  exam: <Award className="h-4 w-4" />,
  project: <CodeIcon />
}

function CodeIcon() {
  return <span className="text-xs font-bold" />
}

const INSTRUCTOR_NAMES: Record<string, string> = {
  u_in_1: 'Dr. Amara Okafor', u_in_2: 'Marcus Bennett', u_in_3: 'Sofia Reyes',
  u_in_4: 'David Chen', u_in_5: 'Priya Sharma', u_in_6: 'James Oyelaran',
  u_in_7: 'Elena Petrova', u_in_8: 'Kwame Mensah', u_in_9: 'Laura Kim'
}

export default function CourseDetails() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { t } = useTranslation()
  const { currentUser, enrollments, wishlist, toggleWishlist, enroll, toast, addToCart } = useApp()

  // Normalize slug - remove leading/trailing slashes and whitespace
  const normalizedSlug = slug?.trim().replace(/^\/|\/$/g, '')
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      if (!normalizedSlug) {
        setLoading(false)
        return
      }
      try {
        const result = await publicApi.getCourseFull(normalizedSlug)
        setCourse(result.course)
      } catch (err) {
        console.error('Failed to fetch course:', err)
      }
      setLoading(false)
    })()
  }, [normalizedSlug])

  if (loading) {
    return (
      <div className="container-page py-20">
        <h1 className="font-display text-2xl font-bold text-ink">{t('course.loading')}</h1>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('course.notFound')}</h1>
        <Button className="mt-4" onClick={() => nav('/courses')}>{t('course.browseAll')}</Button>
      </div>
    )
  }

  const instructor = useMemo(() => course ? { id: course.instructorId, name: course.instructorId.replace('u_in_', 'Instructor '), rating: 4.8, students: 8000 } : null, [course])

  const category = CATEGORIES.find((c) => c.id === course.categoryId)
  const saved = wishlist.includes(course.id)
  const totalLessons = course.sections.reduce((a, s) => a + s.lessons.length, 0)
  const enrolled = currentUser && enrollments.some((e) => e.userId === currentUser.id && e.courseId === course.id)
  const myEnrollment = currentUser ? enrollments.find((e) => e.userId === currentUser.id && e.courseId === course.id) : null
  const disc = discountPercent(course.price, course.discountPrice)
  const displayPrice = course.discountPrice ?? course.price
  const related = COURSES.filter((c) => c.categoryId === course.categoryId && c.id !== course.id).slice(0, 4)

  const handleEnroll = () => {
    if (!currentUser) { nav(`/login?next=/courses/${course.slug}`); return }
    if (enrolled) { nav(`/learning/${course.id}/${myEnrollment?.currentLessonId ?? course.sections[0].lessons[0].id}`); return }
    if (course.price === 0 || displayPrice === 0) {
      enroll(course.id)
      toast(t('common.success'), t('course.enrolledBody', { title: course.title }))
      nav(`/learning/${course.id}/${course.sections[0].lessons[0].id}`)
    } else {
      addToCart(course.id)
      toast(t('course.addedToCart'), t('course.addedToCartBody'), 'info')
      nav('/checkout')
    }
  }

  const tabs = [
    { id: 'overview', label: t('course.overview') },
    { id: 'curriculum', label: t('course.curriculum', { count: totalLessons }) },
    { id: 'instructor', label: t('course.instructor') },
    { id: 'reviews', label: t('course.reviews', { count: course.reviewCount }) }
  ]

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <div className="container-page py-8 lg:py-12">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link to="/courses" className="hover:text-brand-700">{t('nav.courses')}</Link>
            <span>/</span>
            <span className="font-medium text-ink">{category?.name}</span>
          </div>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_400px]">
            <div>
              <Badge color="brand" className="mb-3">{course.level} · {category?.name}</Badge>
              <h1 className="font-display text-3xl font-bold leading-tight text-ink lg:text-4xl">{course.title}</h1>
              <p className="mt-3 text-lg text-muted">{course.subtitle}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
                <Rating value={course.rating} count={course.reviewCount} />
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{t('course.students', { count: course.studentCount })}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{t('course.total', { count: formatDuration(course.duration * 60) })}</span>
                <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" />{course.language}</span>
                <span className="flex items-center gap-1.5">{t('course.updated', { date: new Date(course.lastUpdated).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) })}</span>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <Avatar name={course.instructorId} size="md" />
                <div>
                  <p className="text-sm font-semibold text-ink">{t('course.taughtBy', { name: INSTRUCTOR_NAMES[course.instructorId] ?? 'Tomás Ferreira' })}</p>
                  <p className="text-xs text-muted">{t('course.instructorRating')}</p>
                </div>
              </div>
            </div>

            <div className="lg:order-last">
              <div className="card overflow-hidden shadow-panel lg:sticky lg:top-24">
                <div className="relative aspect-video bg-brand-900">
                  <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                  <button className="absolute inset-0 flex items-center justify-center bg-black/20 text-white transition-colors hover:bg-black/30" onClick={() => toast(t('course.preview'), t('course.previewBody'), 'info')}>
                    <PlayCircle className="h-14 w-14" />
                  </button>
                </div>
                <div className="p-5">
                  <div className="flex items-baseline gap-2">
                    {course.price === 0 ? (
                      <span className="text-3xl font-bold text-success">{t('course.free')}</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-ink">{formatPrice(displayPrice)}</span>
                        {course.discountPrice && <span className="text-lg text-muted line-through">{formatPrice(course.price)}</span>}
                        {disc > 0 && <Badge color="danger">{t('course.off', { pct: disc })}</Badge>}
                      </>
                    )}
                  </div>
                  <div className="mt-5 space-y-2.5">
                    <Button className="w-full py-3" onClick={handleEnroll}>
                      {enrolled ? t('course.continueLearning') : course.price === 0 || displayPrice === 0 ? t('course.enrollFree') : t('course.addToCart')}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => { toggleWishlist(course.id); toast(saved ? t('course.removedFromWishlist') : t('course.savedToWishlist'), course.title) }}>
                      <Heart className={cn('h-4 w-4', saved && 'fill-danger text-danger')} /> {saved ? t('course.inWishlist') : t('course.addToWishlist')}
                    </Button>
                  </div>
                  <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-muted">
                    <p className="flex items-center gap-2"><ListVideo className="h-4 w-4" /> {t('course.lessonsAcross', { count: totalLessons, sections: course.sections.length })}</p>
                    <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {t('course.onDemand', { count: formatDuration(course.duration * 60) })}</p>
                    <p className="flex items-center gap-2"><Award className="h-4 w-4" /> {course.hasCertificate ? t('course.certificate') : t('course.noCertificate')}</p>
                    <p className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {t('course.lifetimeAccess')}</p>
                    <p className="flex items-center gap-2"><RotateCcw className="h-4 w-4" /> {t('course.guarantee')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="overflow-x-auto border-b border-line scrollbar-none">
              <div className="flex gap-1">
                {tabs.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)} className={cn('whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium', tab === t.id ? 'border-brand-500 text-brand-700' : 'border-transparent text-muted hover:text-ink')}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              {tab === 'overview' && (
                <div className="space-y-10">
                  <div>
                    <h2 className="mb-4 text-xl font-semibold text-ink">{t('course.whatLearn')}</h2>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {course.objectives.map((o) => (
                        <li key={o.id} className="flex items-start gap-2.5 text-sm text-ink">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {o.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h2 className="mb-3 text-xl font-semibold text-ink">{t('course.description')}</h2>
                    <div className="prose-plain text-muted">
                      <p>{course.longDescription}</p>
                    </div>
                  </div>
                  <div>
                    <h2 className="mb-4 text-xl font-semibold text-ink">{t('course.requirements')}</h2>
                    <ul className="space-y-2">
                      {course.requirements.map((r) => (
                        <li key={r.id} className="flex items-start gap-2.5 text-sm text-ink">
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /> {r.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h2 className="mb-4 text-xl font-semibold text-ink">{t('course.faq')}</h2>
                    <div className="space-y-3">
                      {course.faqs.map((f, i) => (
                        <Accordion key={i} title={f.q}>
                          <p className="text-sm text-muted">{f.a}</p>
                        </Accordion>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'curriculum' && (
                <div>
                  <p className="mb-6 text-sm text-muted">
                    {t('course.sectionsLessons', { sections: course.sections.length, count: totalLessons, duration: formatDuration(course.duration * 60) })}
                  </p>
                  <div className="card divide-y divide-line px-6">
                    {course.sections.map((s, i) => (
                      <Accordion key={s.id} title={<span>{i + 1}. {s.title}</span>} defaultOpen={i === 0} right={<span className="shrink-0 text-xs text-muted">{t('course.lessonsCount', { count: s.lessons.length })}</span>}>
                        <ul className="divide-y divide-line">
                          {s.lessons.map((l) => (
                            <li key={l.id} className="flex items-center gap-3 py-2.5">
                              <span className="text-brand-500">{TYPE_ICON[l.type]}</span>
                              <button className="flex-1 text-left text-sm text-ink hover:text-brand-700" onClick={() => enrolled ? nav(`/learning/${course.id}/${l.id}`) : toast(t('course.enrollToStart'), t('course.enrollToStartBody'), 'info')}>{l.title}</button>
                              <span className="text-xs text-muted">{formatDuration(l.duration)}</span>
                            </li>
                          ))}
                        </ul>
                      </Accordion>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'instructor' && (
                <div className="card p-6">
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <Avatar name={course.instructorId} size="xl" />
                    <div className="flex-1">
                      <h2 className="font-display text-xl font-semibold text-ink">{INSTRUCTOR_NAMES[course.instructorId] ?? 'Tomás Ferreira'}</h2>
                      <p className="text-sm text-muted">{course.instructorId === 'u_in_1' ? 'Cybersecurity Researcher & CISSP' : course.instructorId === 'u_in_2' ? 'Penetration Tester & OSCP Trainer' : course.instructorId === 'u_in_3' ? 'Machine Learning Engineer' : course.instructorId === 'u_in_4' ? 'Senior Cloud Architect' : course.instructorId === 'u_in_5' ? 'Full-Stack Engineer & Educator' : course.instructorId === 'u_in_6' ? 'DevOps Engineer' : course.instructorId === 'u_in_7' ? 'UX Designer & Design Lead' : course.instructorId === 'u_in_8' ? 'Finance Strategist' : course.instructorId === 'u_in_9' ? 'Digital Marketing Director' : 'Data Engineer & Analytics Lead'}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
                        <Rating value={4.8} />
                        <span>{t('course.students', { count: course.studentCount })}</span>
                        <span>{t('course.reviewsCount', { count: course.reviewCount })}</span>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => currentUser ? nav('/messages') : nav('/login')}>{t('course.message')}</Button>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-muted">{course.instructorId === 'u_in_1' ? 'Former SOC director with 15 years in threat detection and incident response.' : course.instructorId === 'u_in_2' ? 'Ethical hacker focused on web and cloud exploitation.' : course.instructorId === 'u_in_3' ? 'Building ML systems that are accurate, explainable, and production-ready.' : course.instructorId === 'u_in_4' ? 'AWS and GCP certified architect specializing in serverless.' : course.instructorId === 'u_in_5' ? '12 years building web products; loves turning beginners into builders.' : course.instructorId === 'u_in_6' ? 'Automation obsessed. CI/CD pipelines and Kubernetes at scale.' : course.instructorId === 'u_in_7' ? 'Human-centered design that ships.' : course.instructorId === 'u_in_8' ? 'Chartered accountant and ex-investment banker, now an educator.' : course.instructorId === 'u_in_9' ? 'Growth marketing for SaaS and education brands.' : 'Turning raw data into decisions.'}</p>
                </div>
              )}

              {tab === 'reviews' && (
                <div>
                  <div className="mb-6 flex items-center gap-6">
                    <div className="text-center">
                      <p className="font-display text-5xl font-bold text-ink">{course.rating.toFixed(1)}</p>
                      <Rating value={course.rating} size="xs" className="mt-1 justify-center" />
                    </div>
                    <div className="flex-1">
                      <div className="space-y-1.5 text-xs text-muted">
                        {[5, 4, 3, 2, 1].map((s) => {
                          const pct = s === 5 ? 74 : s === 4 ? 21 : s === 3 ? 4 : s === 2 ? 1 : 0
                          return (
                            <div key={s} className="flex items-center gap-2">
                              <span className="w-4">{s}★</span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full bg-[#B7791F]" style={{ width: `${pct}%` }} /></div>
                              <span className="w-8 text-right">{pct}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {course.reviews.map((r) => (
                      <div key={r.id} className="card p-5">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.userName} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-ink">{r.userName}</p>
                            <div className="flex items-center gap-2"><Rating value={r.rating} size="xs" /><span className="text-xs text-muted">{timeAgo(r.date)}</span></div>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted">{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {related.length > 0 && (
                <section className="border-t border-line bg-surface py-12">
                  <div className="container-page">
                    <h2 className="mb-6 text-xl font-semibold text-ink">{t('course.moreIn', { name: category?.name })}</h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      {related.map((c) => <CourseCard key={c.id} course={c} />)}
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="card p-5">
                <h3 className="mb-3 font-semibold text-ink">{t('course.thisCourseIncludes')}</h3>
                <ul className="space-y-2.5 text-sm text-muted">
                  <li className="flex items-center gap-2.5"><ListVideo className="h-4 w-4 text-brand-500" /> {t('course.lessonsOnDemand', { count: totalLessons })}</li>
                  <li className="flex items-center gap-2.5"><Award className="h-4 w-4 text-brand-500" /> {course.hasCertificate ? t('course.certificate') : t('course.noCertificate')}</li>
                  <li className="flex items-center gap-2.5"><MessageSquare className="h-4 w-4 text-brand-500" /> {t('course.discussionCommunity')}</li>
                  <li className="flex items-center gap-2.5"><Users className="h-4 w-4 text-brand-500" /> {t('course.qaSupport')}</li>
                  <li className="flex items-center gap-2.5"><Globe className="h-4 w-4 text-brand-500" /> {course.language}</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}