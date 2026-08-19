import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, BookOpen, CheckCircle2, Clock, Compass, GraduationCap, HelpCircle,
  LifeBuoy, Mail, MessageSquare, Search, ShieldCheck, Sparkles, Star, Users
} from 'lucide-react'
import { useState } from 'react'
import { BLOG_POSTS, CATEGORIES, COURSES, FAQS, INSTRUCTORS, LEARNING_PATHS, PLANS } from '../lib/data'
import { useApp } from '../lib/store'
import { useTranslation } from 'react-i18next'
import { CourseCard, InstructorCard } from '../components/cards'
import { Accordion, Avatar, Badge, Button, Rating } from '../components/ui'
import { cn, formatPrice } from '../lib/utils'
import { Reveal } from '../lib/motion'

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
          {PLANS.map((p, i) => (
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
                {p.name === 'Business' ? t('mktg.contactSales') : p.price === 0 ? t('mktg.startFree') : t('mktg.getPremium')}
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
      <section className="border-y border-line bg-surface py-16">
        <div className="container-page">
          <Reveal>
            <h2 className="mb-10 text-center font-display text-2xl font-semibold text-ink">{t('mktg.teamTitle')}</h2>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {INSTRUCTORS.slice(0, 4).map((i, idx) => (
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
      <section className="container-page py-16">
        <div className="grid gap-5 lg:grid-cols-4">
          {[['2019', t('mktg.founded')], ['500+', t('mktg.expertInstructors')], ['1,200+', t('mktg.coursesPaths')], ['50K+', t('mktg.learnersWorldwide')]].map(([v, l], i) => (
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INSTRUCTORS.map((i, idx) => (
            <Reveal key={i.id} delay={Math.min(idx * 0.06, 0.3)}>
              <InstructorCard instructor={i} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}

export function InstructorProfile() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t } = useTranslation()
  const instructor = INSTRUCTORS.find((i) => i.id === id)
  if (!instructor) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('mktg.instructorNotFound')}</h1>
        <Button className="mt-4" onClick={() => nav('/instructors')}>{t('mktg.allInstructors')}</Button>
      </div>
    )
  }
  const courses = COURSES.filter((c) => c.instructorId === instructor.id)
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
                <p className="mt-2 text-sm leading-relaxed text-muted">{instructor.headline}</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted sm:justify-start">
                  <Rating value={instructor.rating ?? 4.8} />
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {t('mktg.students', { count: instructor.studentCount ?? 0 })}</span>
                  <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {t('mktg.coursesCount', { count: courses.length })}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button onClick={() => nav('/messages')}><MessageSquare className="h-4 w-4" /> {t('mktg.message')}</Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="mb-5 text-xl font-semibold text-ink">{t('mktg.coursesBy', { name: instructor.name })}</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {courses.map((c, i) => (
                <Reveal key={c.id} delay={Math.min(i * 0.07, 0.21)}>
                  <CourseCard course={c} />
                </Reveal>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="mb-3 font-semibold text-ink">{t('mktg.about')}</h3>
              <p className="text-sm leading-relaxed text-muted">{instructor.bio}</p>
            </div>
            <div className="card p-6">
              <h3 className="mb-3 font-semibold text-ink">{t('mktg.expertise')}</h3>
              <div className="flex flex-wrap gap-2">
                {(instructor.skills ?? []).map((s) => <Badge key={s} color="brand">{s}</Badge>)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export function Blog() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const [cat, setCat] = useState('all')
  const cats = ['all', ...Array.from(new Set(BLOG_POSTS.map((b) => b.category)))]
  const list = BLOG_POSTS.filter((b) => cat === 'all' || b.category === cat)
  return (
    <div>
      <section className="border-b border-line bg-surface py-14 text-center">
        <div className="container-page max-w-2xl">
          <Reveal>
            <Badge color="brand" className="mb-4"><BookOpen className="h-3.5 w-3.5" /> {t('mktg.resources')}</Badge>
            <h1 className="font-display text-4xl font-bold text-ink">{t('mktg.blogTitle')}</h1>
            <p className="mt-4 text-lg text-muted">{t('mktg.blogDesc')}</p>
          </Reveal>
        </div>
      </section>
      <section className="container-page py-12">
        <div className="mb-8 flex gap-2 overflow-x-auto scrollbar-none">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn('chip shrink-0 capitalize', cat === c && 'border-brand-500 bg-brand-50 text-brand-700')}>{c}</button>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {list.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 0.06, 0.24)}>
              <button onClick={() => nav(`/blog/${p.slug}`)} className="card group flex h-full w-full flex-col overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="relative aspect-[16/7] bg-brand-900">
                  <img src={p.thumbnail} alt={p.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <Badge color="ink" className="absolute bottom-3 left-3">{p.category}</Badge>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="line-clamp-2 font-display text-lg font-semibold text-ink group-hover:text-brand-700">{p.title}</h2>
                  <p className="line-clamp-2 text-sm text-muted">{p.excerpt}</p>
                  <div className="mt-auto flex items-center gap-3 border-t border-line pt-4 text-xs text-muted">
                    <Avatar name={p.author} size="xs" />
                    <span className="font-medium text-ink">{p.author}</span>
                    <span>·</span>
                    <span>{new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="ml-auto flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t('mktg.minRead', { count: p.readTime })}</span>
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
  const post = BLOG_POSTS.find((p) => p.slug === slug)
  const nav = useNavigate()
  const { t } = useTranslation()
  if (!post) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('mktg.articleNotFound')}</h1>
        <Button className="mt-4" onClick={() => nav('/blog')}>{t('mktg.backToBlog')}</Button>
      </div>
    )
  }
  return (
    <div>
      <section className="border-b border-line bg-surface py-12">
        <div className="container-page max-w-3xl">
          <Reveal>
            <button onClick={() => nav('/blog')} className="text-sm text-muted hover:text-brand-700">{t('mktg.backToBlogShort')}</button>
            <Badge color="brand" className="mt-4">{post.category}</Badge>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-ink">{post.title}</h1>
            <p className="mt-3 text-lg text-muted">{post.excerpt}</p>
            <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <Avatar name={post.author} size="md" />
              <div>
                <p className="text-sm font-semibold text-ink">{post.author}</p>
                <p className="text-xs text-muted">{post.authorTitle} · {t('mktg.minRead', { count: post.readTime })} · {new Date(post.date).toLocaleDateString()}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <article className="container-page max-w-3xl py-10">
        <img src={post.thumbnail} alt={post.title} className="aspect-[16/7] w-full rounded-card object-cover" />
        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted">
          {post.content.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </article>
    </div>
  )
}

export function Support() {
  const { toast } = useApp()
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', topic: t('mktg.courseHelp'), message: '' })
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
          <Reveal>
            <h2 className="mb-5 text-xl font-semibold text-ink">{t('mktg.faq')}</h2>
          </Reveal>
          <div className="card px-6">
            {FAQS.map((f, i) => (
              <Accordion key={i} title={f.q} defaultOpen={i === 0}>
                <p className="text-sm text-muted">{f.a}</p>
              </Accordion>
            ))}
          </div>
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