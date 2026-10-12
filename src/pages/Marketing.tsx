import { useParams, useNavigate } from 'react-router-dom'
import {
  BookOpen, CheckCircle2, Clock, Compass, HelpCircle,
  LifeBuoy, Mail, MessageSquare, Search, ShieldCheck, Sparkles, Users
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useApp } from '../lib/store'
import { useTranslation } from 'react-i18next'
import { CourseCard, InstructorCard } from '../components/cards'
import { Accordion, Avatar, Badge, Button } from '../components/ui'
import { cn, formatPrice } from '../lib/utils'
import { Reveal } from '../lib/motion'
import { coursesApi, articlesApi, membersApi, faqApi } from '../lib/supabase'

const DEFAULT_PLANS = [
  { id: 'free', name: 'Free Student Access', price: 0, period: 'lifetime', description: 'Open access to introductory anatomical modules.', features: ['Access to Free Modules', 'Community Discussions', 'Mobile & Web Access'] },
  { id: 'premium', name: 'Standard Professional', price: 15000, period: 'course', description: 'Comprehensive clinical modules with certification.', features: ['Full Module Access', 'Clinical Video Lectures', 'Verified Certificate', 'Direct Tutor Support'], highlight: true },
  { id: 'institution', name: 'Institutional / University', price: 0, period: 'annual', description: 'Custom licensing for universities & teaching hospitals.', features: ['Multi-student Seats', 'LMS & Curriculum Integration', 'Custom Exam Banks', 'Dedicated Account Manager'] }
]

export function Pricing() {
  const nav = useNavigate()
  const { t } = useTranslation()
  return (
    <div>
      <section className="border-b border-line bg-surface py-16 text-center">
        <div className="container-page max-w-2xl">
          <Reveal>
            <Badge color="brand" className="mb-4"><Sparkles className="h-3.5 w-3.5" /> {t('mktg.simpleFlexible')}</Badge>
            <h1 className="font-display text-4xl font-bold text-ink">{t('mktg.investFuture')}</h1>
            <p className="mt-4 text-lg text-muted">{t('mktg.pricingDesc')}</p>
          </Reveal>
        </div>
      </section>
      <section className="container-page py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {DEFAULT_PLANS.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 0.08, 0.24)}>
              <div className={cn('card relative flex h-full flex-col p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift', p.highlight && 'border-brand-500 ring-1 ring-brand-500')}>
              {p.highlight && <Badge color="brand" className="absolute -top-3 left-1/2 -translate-x-1/2">{t('mktg.mostPopular')}</Badge>}
              <h2 className="font-display text-xl font-semibold text-ink">{p.name}</h2>
              <p className="mt-1 text-sm text-muted">{p.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-ink">{p.price === 0 ? t('mktg.free') : formatPrice(p.price)}</span>
                {p.price > 0 && <span className="text-sm text-muted">/{p.period}</span>}
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}</li>
                ))}
              </ul>
              <Button variant={p.highlight ? 'primary' : 'outline'} className="mt-7 w-full" onClick={() => nav('/register')}>
                {p.name === 'Institutional / University' ? t('mktg.contactSales') : p.price === 0 ? t('mktg.startFree') : t('mktg.getPremium')}
              </Button>
            </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted">{t('mktg.guaranteeNote')}</p>
      </section>
    </div>
  )
}

export function About() {
  const { t } = useTranslation()
  const [team, setTeam] = useState<any[]>([])

  useEffect(() => {
    membersApi.list({ role: 'instructor' })
      .then((res) => setTeam(res ?? []))
      .catch(() => setTeam([]))
  }, [])

  return (
    <div>
      <section className="border-b border-line bg-surface py-16">
        <div className="container-page max-w-3xl text-center">
          <Reveal>
            <Badge color="brand" className="mb-4">{t('mktg.aboutBadge')}</Badge>
            <h1 className="font-display text-4xl font-bold text-ink">{t('mktg.missionTitle')}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              {t('mktg.missionBody')}
            </p>
          </Reveal>
        </div>
      </section>
      <section className="container-page grid gap-6 py-16 lg:grid-cols-3">
        {[
          { icon: <Compass className="h-6 w-6" />, title: t('mktg.ourVision'), text: t('mktg.ourVisionText') },
          { icon: <Sparkles className="h-6 w-6" />, title: t('mktg.whatWeBelieve'), text: t('mktg.whatWeBelieveText') },
          { icon: <Users className="h-6 w-6" />, title: t('mktg.whoWeAre'), text: t('mktg.whoWeAreText') }
        ].map((c, i) => (
          <Reveal key={c.title} delay={Math.min(i * 0.08, 0.24)}>
            <div className="card h-full p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="mb-4 inline-flex rounded-card bg-brand-50 p-3 text-brand-700">{c.icon}</div>
              <h2 className="font-display text-lg font-semibold text-ink">{c.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.text}</p>
            </div>
          </Reveal>
        ))}
      </section>
      {team.length > 0 && (
        <section className="border-y border-line bg-surface py-16">
          <div className="container-page">
            <Reveal>
              <h2 className="mb-10 text-center font-display text-2xl font-semibold text-ink">{t('mktg.teamTitle')}</h2>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {team.slice(0, 4).map((i, idx) => (
                <Reveal key={i.id} delay={Math.min(idx * 0.07, 0.28)}>
                  <div className="card flex flex-col items-center p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                    <Avatar name={i.name} size="lg" />
                    <p className="mt-3 font-semibold text-ink">{i.name}</p>
                    <p className="text-sm text-muted">{i.title}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="container-page py-16">
        <div className="grid gap-5 lg:grid-cols-4">
          {[['2024', t('mktg.founded')], ['Specialized', t('mktg.expertInstructors')], ['Accredited', t('mktg.coursesPaths')], ['Healthcare', t('mktg.learnersWorldwide')]].map(([v, l], i) => (
            <Reveal key={l as string} delay={Math.min(i * 0.08, 0.24)}>
              <div className="card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <p className="font-display text-3xl font-bold text-brand-700">{v}</p>
                <p className="mt-1 text-sm text-muted">{l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}

export function Instructors() {
  const { t } = useTranslation()
  const [instructorsList, setInstructorsList] = useState<any[]>([])

  useEffect(() => {
    membersApi.list({ role: 'instructor' })
      .then((res) => setInstructorsList(res ?? []))
      .catch(() => setInstructorsList([]))
  }, [])

  return (
    <div>
      <section className="border-b border-line bg-surface py-14 text-center">
        <div className="container-page max-w-2xl">
          <Reveal>
            <Badge color="brand" className="mb-4"><Users className="h-3.5 w-3.5" /> {t('mktg.meetInstructors')}</Badge>
            <h1 className="font-display text-4xl font-bold text-ink">{t('mktg.learnFromPros')}</h1>
            <p className="mt-4 text-lg text-muted">{t('mktg.instructorsDesc')}</p>
          </Reveal>
        </div>
      </section>
      <section className="container-page py-14">
        {instructorsList.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {instructorsList.map((i, idx) => (
              <Reveal key={i.id} delay={Math.min(idx * 0.06, 0.3)}>
                <InstructorCard instructor={i} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted">
            <p>{t('mktg.noInstructorsYet', 'Faculty and instructors will be listed here.')}</p>
          </div>
        )}
      </section>
    </div>
  )
}

export function InstructorProfile() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t } = useTranslation()
  const [instructor, setInstructor] = useState<any>(null)
  const [instructorCourses, setInstructorCourses] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    membersApi.getById(id)
      .then((res) => {
        setInstructor(res)
        return coursesApi.list()
      })
      .then((allCourses) => {
        setInstructorCourses((allCourses ?? []).filter((c: any) => c.created_by === id || c.instructor_id === id))
      })
      .catch(() => {
        setInstructor(null)
      })
  }, [id])

  if (!instructor) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('mktg.instructorNotFound')}</h1>
        <Button className="mt-4" onClick={() => nav('/instructors')}>{t('mktg.allInstructors')}</Button>
      </div>
    )
  }

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <div className="container-page py-12">
          <Reveal>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <Avatar name={instructor.name} size="xl" />
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-display text-2xl font-bold text-ink">{instructor.name}</h1>
                <p className="text-muted">{instructor.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{instructor.bio || instructor.headline}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      {instructorCourses.length > 0 && (
        <section className="container-page py-14">
          <h2 className="mb-6 font-display text-xl font-semibold text-ink">{t('mktg.coursesBy', { name: instructor.name })}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {instructorCourses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function Blog() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const [articles, setArticles] = useState<any[]>([])
  const [cat, setCat] = useState('all')

  useEffect(() => {
    articlesApi.list({ is_published: true })
      .then((res) => setArticles(res ?? []))
      .catch(() => setArticles([]))
  }, [])

  const cats = ['all', ...Array.from(new Set(articles.map((b) => b.category).filter(Boolean)))]
  const list = articles.filter((b) => cat === 'all' || b.category === cat)

  return (
    <div>
      <section className="border-b border-line bg-surface py-14 text-center">
        <div className="container-page max-w-2xl">
          <Reveal>
            <Badge color="brand" className="mb-4"><BookOpen className="h-3.5 w-3.5" /> {t('mktg.resources')}</Badge>
            <h1 className="font-display text-4xl font-bold text-ink">Clinical Articles & Research</h1>
            <p className="mt-4 text-lg text-muted">Evidence-based anatomical reviews and healthcare education resources.</p>
          </Reveal>
        </div>
      </section>
      <section className="container-page py-12">
        {cats.length > 1 && (
          <div className="mb-8 flex gap-2 overflow-x-auto scrollbar-none">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn('chip shrink-0 capitalize', cat === c && 'border-brand-500 bg-brand-50 text-brand-700')}>{c}</button>
            ))}
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {list.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 0.06, 0.24)}>
              <button onClick={() => nav(`/blog/${p.slug || p.id}`)} className="card group flex h-full w-full flex-col overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                {p.image_url && (
                  <div className="relative aspect-[16/7] bg-brand-900">
                    <img src={p.image_url} alt={p.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <Badge color="ink" className="absolute bottom-3 left-3">{p.category || 'Anatomy'}</Badge>
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="line-clamp-2 font-display text-lg font-semibold text-ink group-hover:text-brand-700">{p.title}</h2>
                  <p className="line-clamp-2 text-sm text-muted">{p.excerpt}</p>
                  <div className="mt-auto flex items-center gap-3 border-t border-line pt-4 text-xs text-muted">
                    <Avatar name={p.author || 'Author'} size="xs" />
                    <span className="font-medium text-ink">{p.author}</span>
                    <span>·</span>
                    <span>{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="ml-auto flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t('mktg.minRead', { count: p.read_time || 5 })}</span>
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}

export function BlogPost() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { t } = useTranslation()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    articlesApi.getBySlug(slug)
      .then((res) => {
        setPost(res)
      })
      .catch(() => {
        return articlesApi.getById(slug).then(setPost).catch(() => setPost(null))
      })
      .finally(() => setLoading(false))
  }, [slug])

  const handleShare = async () => {
    if (!post) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Share failed:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="container-page py-8">
          <div className="mx-auto max-w-4xl">
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-12 bg-gray-200 rounded w-3/4"></div>
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded-2xl"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-11/12"></div>
                <div className="h-4 bg-gray-200 rounded w-10/12"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center px-4">
          <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink mb-2">{t('mktg.articleNotFound')}</h1>
          <p className="text-muted mb-6 max-w-md">The blog post you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => nav('/blog')}>{t('mktg.backToBlog')}</Button>
        </div>
      </div>
    )
  }

  const readTime = post.content ? Math.ceil(post.content.split(' ').length / 200) : 5
  const publishDate = post.published_at || post.created_at

  return (
    <div className="min-h-screen bg-canvas">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-line bg-white">
        <div className="container-page py-4">
          <button
            onClick={() => nav('/blog')}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('mktg.backToBlogShort') || 'Back to Blog'}
          </button>
        </div>
      </div>

      {/* Article Header */}
      <div className="bg-white border-b border-line">
        <div className="container-page py-12">
          <div className="mx-auto max-w-4xl">
            <Reveal>
              {/* Category Badge */}
              {post.category && (
                <div className="mb-6">
                  <Badge color="brand" className="text-sm font-semibold">
                    {post.category}
                  </Badge>
                </div>
              )}
              
              {/* Title */}
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-6">
                {post.title}
              </h1>
              
              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xl md:text-2xl text-muted leading-relaxed mb-8">
                  {post.excerpt}
                </p>
              )}
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-sm border-t border-b border-line py-4">
                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar name={post.author || 'Author'} size="md" />
                  <div>
                    <p className="font-semibold text-ink">{post.author || 'Author'}</p>
                    <p className="text-muted">{post.author_title || 'Medical Writer'}</p>
                  </div>
                </div>
                
                <div className="hidden sm:block h-8 w-px bg-line"></div>
                
                {/* Date & Read Time */}
                <div className="flex items-center gap-4 text-muted">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <time dateTime={publishDate}>
                      {publishDate ? new Date(publishDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : ''}
                    </time>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{readTime} min read</span>
                  </div>
                  
                  {post.view_count && (
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{post.view_count.toLocaleString()} views</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleShare}
                  className="ml-auto flex items-center gap-2 text-brand-700 hover:text-brand-800 font-medium transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {(post.cover_image || post.image_url) && (
        <div className="bg-white">
          <div className="container-page py-8">
            <div className="mx-auto max-w-5xl">
              <Reveal>
                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <img
                    src={post.cover_image || post.image_url}
                    alt={post.title}
                    className="h-auto w-full object-cover"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="bg-white">
        <div className="container-page py-12">
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <article className="prose prose-lg md:prose-xl max-w-none
                prose-headings:font-display prose-headings:font-bold prose-headings:text-ink
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-brand-700 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-ink prose-strong:font-semibold
                prose-ul:my-6 prose-ol:my-6
                prose-li:text-gray-700 prose-li:my-2
                prose-blockquote:border-l-4 prose-blockquote:border-brand-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600
                prose-code:text-brand-700 prose-code:bg-brand-50 prose-code:px-2 prose-code:py-1 prose-code:rounded
                prose-pre:bg-gray-900 prose-pre:text-gray-100
                prose-img:rounded-xl prose-img:shadow-md
              ">
                {post.content && post.content.includes('<') ? (
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                ) : (
                  <div className="whitespace-pre-line">{post.content}</div>
                )}
              </article>

              {/* Tags Section */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-16 pt-8 border-t border-line">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">
                    Related Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Call to Action */}
              <div className="mt-16 p-8 bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl border border-brand-200">
                <h3 className="font-display text-2xl font-bold text-ink mb-3">
                  Continue Reading
                </h3>
                <p className="text-muted mb-6">
                  Explore more articles and insights on anatomy, medical education, and healthcare.
                </p>
                <Button onClick={() => nav('/blog')}>
                  Browse All Posts
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Support() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const [faqs, setFaqs] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', email: '', topic: t('mktg.courseHelp'), message: '' })

  useEffect(() => {
    faqApi.list()
      .then((res) => setFaqs(res ?? []))
      .catch(() => setFaqs([]))
  }, [])

  return (
    <div>
      <section className="border-b border-line bg-surface py-14 text-center">
        <div className="container-page max-w-2xl">
          <Reveal>
            <Badge color="brand" className="mb-4"><LifeBuoy className="h-3.5 w-3.5" /> {t('mktg.supportCenter')}</Badge>
            <h1 className="font-display text-4xl font-bold text-ink">{t('mktg.howCanWeHelp')}</h1>
            <div className="relative mx-auto mt-6 max-w-lg">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input placeholder={t('mktg.searchHelp')} className="input-base py-3 pl-10" />
            </div>
          </Reveal>
        </div>
      </section>
      <section className="container-page grid gap-8 py-14 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {faqs.length > 0 && (
            <>
              <Reveal>
                <h2 className="mb-5 text-xl font-semibold text-ink">{t('mktg.faq')}</h2>
              </Reveal>
              <div className="card px-6">
                {faqs.map((f: any, i: number) => (
                  <Accordion key={f.id || i} title={f.question || f.q} defaultOpen={i === 0}>
                    <p className="text-sm text-muted">{f.answer || f.a}</p>
                  </Accordion>
                ))}
              </div>
            </>
          )}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[[t('mktg.contactSupport'), <Mail key="m" className="h-5 w-5" />], [t('mktg.communityHelp'), <MessageSquare key="c" className="h-5 w-5" />], [t('mktg.knowledgeBase'), <HelpCircle key="k" className="h-5 w-5" />], [t('mktg.verifyCertificate'), <ShieldCheck key="v" className="h-5 w-5" />]].map(([label, icon], i) => (
              <Reveal key={label as string} delay={Math.min(i * 0.06, 0.18)}>
                <button onClick={() => toast(t('mktg.openingSupport'), label as string, 'info')} className="card flex w-full items-center gap-3 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <div className="rounded-card bg-brand-50 p-2.5 text-brand-700">{icon as React.ReactNode}</div>
                  <div>
                    <p className="font-semibold text-ink">{label}</p>
                    <p className="text-xs text-muted">{t('mktg.respond24')}</p>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
        <div>
          <div className="card p-6 lg:sticky lg:top-24">
            <h2 className="mb-1 font-semibold text-ink">{t('mktg.submitTicket')}</h2>
            <p className="mb-4 text-sm text-muted">{t('mktg.respondByEmail')}</p>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); toast(t('mktg.ticketSubmitted'), `Reference #${Math.floor(Math.random() * 90000) + 10000}`, 'info'); setForm({ name: '', email: '', topic: t('mktg.courseHelp'), message: '' }) }}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder={t('mktg.yourName')} className="input-base" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required type="email" placeholder={t('mktg.emailAddress')} className="input-base" />
              <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="input-base">
                <option>{t('mktg.courseHelp')}</option><option>{t('mktg.billing')}</option><option>{t('mktg.certificates')}</option><option>{t('mktg.technicalIssue')}</option><option>{t('mktg.other')}</option>
              </select>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={4} placeholder={t('mktg.howCanWeHelpShort')} className="input-base" />
              <Button type="submit" className="w-full">{t('mktg.submitTicketBtn')}</Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}