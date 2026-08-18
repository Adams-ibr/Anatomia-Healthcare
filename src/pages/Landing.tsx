import { Link, useNavigate } from 'react-router-dom'
import {
  Award, BookOpen, CheckCircle2, ChevronRight, Clock, Code2, Compass, GraduationCap,
  ListChecks, MessageSquare, PlayCircle, ShieldCheck, Sparkles, TrendingUp, Trophy, Users, X
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../lib/store'
import { CATEGORIES, COURSES, FAQS, INSTRUCTORS, LEARNING_PATHS, PLANS, TESTIMONIALS } from '../lib/data'
import { CourseCard, InstructorCard } from '../components/cards'
import { Accordion, Avatar, Badge, Button, Rating } from '../components/ui'
import { formatPrice } from '../lib/utils'
import { cn } from '../lib/utils'
import { Counter, EASE, Reveal } from '../lib/motion'

const HERO_LEFT = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
}
const HERO_ITEM = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } }
}

function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 44, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.15, ease: EASE }}
        className="card overflow-hidden shadow-panel"
      >
        <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
          <Avatar name="John Adedeji" size="sm" />
          <div>
            <p className="text-sm font-semibold text-ink">Good morning, John</p>
            <p className="text-xs text-muted">You are on a 5-day learning streak</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs font-medium text-success">
            <Trophy className="h-3.5 w-3.5" /> 5 days
          </div>
        </div>
        <div className="space-y-4 bg-surface p-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-ink">Cybersecurity Fundamentals</span>
              <span className="text-muted">78%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full w-[78%] rounded-full bg-brand-500" />
            </div>
            <p className="mt-2 text-xs text-muted">Continue: Incident Response Lifecycle</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-card border border-line p-3">
              <p className="text-xs text-muted">Completed courses</p>
              <p className="text-lg font-bold text-ink">3</p>
            </div>
            <div className="rounded-card border border-line p-3">
              <p className="text-xs text-muted">Certificates</p>
              <p className="text-lg font-bold text-ink">2</p>
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -34 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
      >
        <div className="card absolute -bottom-6 -left-4 hidden w-56 p-4 shadow-panel sm:block" style={{ animation: 'float 5s ease-in-out infinite' }}>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-brand-50 p-2 text-brand-700"><ShieldCheck className="h-4 w-4" /></div>
            <div>
              <p className="text-xs font-semibold text-ink">Certificate earned</p>
              <p className="text-[11px] text-muted">Python for Security</p>
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
              <p className="text-xs font-semibold text-ink">Assessment score</p>
              <p className="text-[11px] text-muted">92% — passed</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const STATS = [
  { value: 50, suffix: 'K+', label: 'Learners' },
  { value: 1200, suffix: '+', label: 'Courses' },
  { value: 500, suffix: '+', label: 'Instructors' },
  { value: 95, suffix: '%', label: 'Completion satisfaction' }
]

const WHY = [
  { icon: <Award className="h-5 w-5" />, title: 'Expert instructors', text: 'Learn from practitioners at the top of their fields.' },
  { icon: <ListChecks className="h-5 w-5" />, title: 'Structured learning', text: 'Purpose-built curricula that build skill progressively.' },
  { icon: <Code2 className="h-5 w-5" />, title: 'Practical projects', text: 'Apply what you learn in realistic, portfolio-ready work.' },
  { icon: <GraduationCap className="h-5 w-5" />, title: 'Verified certificates', text: 'Earn shareable, verifiable proof of your skills.' },
  { icon: <Clock className="h-5 w-5" />, title: 'Flexible learning', text: 'Self-paced courses that fit around your life.' },
  { icon: <MessageSquare className="h-5 w-5" />, title: 'Community support', text: 'Ask questions, share progress, and learn together.' }
]

const FLOW = [
  { step: 'Discover', text: 'Find the right course', icon: <Compass className="h-5 w-5" /> },
  { step: 'Enroll', text: 'Start in minutes', icon: <PlayCircle className="h-5 w-5" /> },
  { step: 'Learn', text: 'Structured lessons', icon: <BookOpen className="h-5 w-5" /> },
  { step: 'Practice', text: 'Labs and projects', icon: <Code2 className="h-5 w-5" /> },
  { step: 'Assess', text: 'Prove your mastery', icon: <CheckCircle2 className="h-5 w-5" /> },
  { step: 'Certify', text: 'Earn your credential', icon: <Trophy className="h-5 w-5" /> }
]

export default function Landing() {
  const nav = useNavigate()
  const { toast } = useApp()
  const [faqOpen, setFaqOpen] = useState<string | null>('0')

  const featured = COURSES.filter((c) => c.isFeatured).slice(0, 4)
  const trending = COURSES.filter((c) => c.isTrending).slice(0, 4)

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-brand-50 blur-3xl" />
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <motion.div variants={HERO_LEFT} initial="hidden" animate="show">
            <motion.div variants={HERO_ITEM}>
              <Badge color="brand" className="mb-5">
                <Sparkles className="h-3.5 w-3.5" /> New: SIEM & Threat Hunting
              </Badge>
            </motion.div>
            <motion.div variants={HERO_ITEM}>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
                Learn Without Limits. Build Skills That Matter.
              </h1>
            </motion.div>
            <motion.div variants={HERO_ITEM}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
                Learn practical, professional, and academic skills through structured courses taught by experienced instructors — with labs, projects, and verifiable certificates.
              </p>
            </motion.div>
            <motion.div variants={HERO_ITEM}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={() => nav('/courses')} className="px-6 py-3 text-base">
                  Explore Courses <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => nav('/register?role=instructor')} className="px-6 py-3 text-base">
                  Become an Instructor
                </Button>
              </div>
            </motion.div>
            <motion.div variants={HERO_ITEM}>
              <div className="mt-8 flex items-center gap-4 text-sm text-muted">
                <div className="flex -space-x-2">
                  {['John Adedeji', 'Grace Okonkwo', 'Sofia Reyes'].map((n) => <Avatar key={n} name={n} size="sm" className="ring-2 ring-paper" />)}
                </div>
                <div>
                  <Rating value={4.8} />
                  <p className="text-xs text-muted">Trusted by 50,000+ learners</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
          <HeroMock />
        </div>
      </section>

      <section className="border-b border-line bg-surface py-10">
        <div className="container-page">
          <Reveal y={16}>
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted">Trusted by teams at</p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm font-semibold text-muted/70">
              {['NORTHWIND', 'APEX BANK', 'HELIOS LABS', 'CRESTLINE U', 'VANTA TELECOM', 'GRIDSOFT', 'ORBITA'].map((name) => (
                <span key={name} className="tracking-widest">{name}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-700">Categories</p>
              <h2 className="section-title mt-1">Explore Popular Categories</h2>
            </div>
            <Link to="/courses" className="hidden items-center gap-1 text-sm font-medium text-brand-700 hover:underline sm:flex">All courses <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.id} delay={Math.min(i * 0.05, 0.3)}>
              <Link to={`/courses?category=${cat.slug}`} className="card group flex items-start gap-3 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="rounded-card p-2.5 text-white transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: cat.color }}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink">{cat.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{cat.courseCount} courses</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-brand-700">Featured</p>
              <h2 className="section-title mt-1">Courses Our Learners Love</h2>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c, i) => (
              <Reveal key={c.id} delay={Math.min(i * 0.07, 0.28)}>
                <CourseCard course={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-brand-700">Why Hama</p>
            <h2 className="section-title mt-1">Why Learn With Us?</h2>
          </div>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((w, i) => (
            <Reveal key={w.title} delay={Math.min(i * 0.06, 0.3)}>
              <div className="card group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="mb-4 inline-flex rounded-card bg-brand-50 p-3 text-brand-700 transition-transform duration-300 group-hover:scale-110">{w.icon}</div>
                <h3 className="font-semibold text-ink">{w.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{w.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold text-brand-700">The Experience</p>
              <h2 className="section-title mt-1">A Complete Learning Journey</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {FLOW.map((f, i) => (
              <Reveal key={f.step} delay={Math.min(i * 0.07, 0.35)} className="group">
                <div className="relative text-center">
                  {i < FLOW.length - 1 && <div className="absolute left-[60%] top-8 hidden h-px w-[80%] bg-line lg:block" />}
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

      <section className="container-page py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="text-sm font-semibold text-brand-700">For Instructors</p>
              <h2 className="section-title mt-1">Share Your Expertise With the World</h2>
              <p className="mt-4 leading-relaxed text-muted">
                Build structured courses with videos, labs, assessments, and assignments. Get transparent analytics, engaged students, and fair revenue share. We handle the platform so you can focus on teaching.
              </p>
              <ul className="mt-6 space-y-3">
                {['Drag-and-drop course builder', 'Quizzes, exams, and assignments', 'Student analytics & earnings', 'Dedicated instructor support'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-ink">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-8" onClick={() => nav('/register?role=instructor')}>Become an Instructor <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {INSTRUCTORS.slice(0, 4).map((ins, i) => (
              <Reveal key={ins.id} delay={Math.min(i * 0.07, 0.28)}>
                <InstructorCard instructor={ins} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-brand-700">In numbers</p>
              <h2 className="section-title mt-1">A Platform That Delivers Results</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08}>
                <div className="text-center">
                  <Counter to={s.value} suffix={s.suffix} className="font-display text-4xl font-bold text-brand-700" />
                  <p className="mt-1 text-sm text-muted">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-brand-700">Learning Paths</p>
            <h2 className="section-title mt-1">Career-Focused Learning Paths</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">Structured sequences of courses that take you from beginner to job-ready.</p>
          </div>
        </Reveal>
        <div className="grid gap-5 lg:grid-cols-3">
          {LEARNING_PATHS.slice(0, 3).map((lp, i) => (
            <Reveal key={lp.id} delay={Math.min(i * 0.08, 0.24)}>
              <div className="card group flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="mb-4 inline-flex w-fit rounded-card bg-brand-50 p-3 text-brand-700 transition-transform duration-300 group-hover:scale-110"><ShieldCheck className="h-5 w-5" /></div>
                <h3 className="font-display text-lg font-semibold text-ink">{lp.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{lp.description}</p>
                <p className="mt-3 text-xs font-medium text-brand-700">{lp.career}</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-xs text-muted">{lp.courses.length} courses · {lp.level}</span>
                  <button onClick={() => { toast('Learning path saved', 'Start with the first course in this path.'); nav('/courses') }} className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">View path <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" /></button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-brand-700">What learners say</p>
              <h2 className="section-title mt-1">Loved by Students Everywhere</h2>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.id} delay={Math.min(i * 0.07, 0.28)}>
                <figure className="card flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <Rating value={t.rating} size="xs" />
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink">"{t.text}"</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <Avatar name={t.name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{t.name}</p>
                      <p className="text-xs text-muted">{t.role} · {t.company}</p>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-brand-700">Trending</p>
            <h2 className="section-title mt-1">What's Popular Right Now</h2>
          </div>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((c, i) => (
            <Reveal key={c.id} delay={Math.min(i * 0.07, 0.28)}>
              <CourseCard course={c} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-brand-700">Pricing</p>
              <h2 className="section-title mt-1">Invest in Your Future</h2>
            </div>
          </Reveal>
          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 0.08, 0.24)}>
                <div className={cn('card group relative flex h-full flex-col p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift', p.highlight && 'border-brand-500 ring-1 ring-brand-500')}>
                  {p.highlight && <Badge color="brand" className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>}
                  <h3 className="font-display text-xl font-semibold text-ink">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted">{p.description}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-ink">{p.price === 0 ? 'Free' : formatPrice(p.price)}</span>
                    {p.price > 0 && <span className="text-sm text-muted">/{p.period}</span>}
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-ink">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button variant={p.highlight ? 'primary' : 'outline'} className="mt-7 w-full" onClick={() => nav('/register')}>
                    {p.price === 0 ? 'Start for Free' : 'Get Started'}
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page max-w-3xl py-16 lg:py-20">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-brand-700">FAQ</p>
            <h2 className="section-title mt-1">Frequently Asked Questions</h2>
          </div>
        </Reveal>
        <div className="card px-6">
          {FAQS.map((f, i) => (
            <Accordion key={i} title={<span>{f.q}</span>} defaultOpen={faqOpen === String(i)}>
              <p className="text-sm leading-relaxed text-muted">{f.a}</p>
            </Accordion>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-brand-900">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
          <Reveal>
            <h2 className="max-w-2xl font-display text-3xl font-bold text-white">Ready to start learning without limits?</h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-200">Join 50,000+ learners building skills that matter. Your first course is one click away.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => nav('/register')} className="bg-white px-6 py-3 text-base text-brand-900 hover:bg-brand-50">Create Free Account</Button>
              <Button onClick={() => nav('/courses')} className="border border-brand-400 bg-transparent px-6 py-3 text-base text-white hover:bg-brand-800">Browse Courses</Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
