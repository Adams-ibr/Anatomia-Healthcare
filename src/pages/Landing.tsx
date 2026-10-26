import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, BookOpen, Check, Clock3, GraduationCap,
  HeartPulse, ShieldCheck
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  articlesApi, careersApi, categoriesApi, coursesApi, faqApi, membersApi, partnersApi
} from '../lib/supabase'
import { Accordion, Avatar, Skeleton } from '../components/ui'
import { formatPrice } from '../lib/utils'
import type { PublicInstructor } from '../lib/api/auth'
import './Landing.css'

type Row = Record<string, any>

function coursePath(course: Row) {
  return `/courses/${course.slug || course.id}`
}

function CourseTile({ course }: { course: Row }) {
  const price = Number(course.price) || 0
  return (
    <Link to={coursePath(course)} className="home-course group">
      <div className="home-course-image">
        {course.thumbnail_url || course.thumbnail ? (
          <img src={course.thumbnail_url || course.thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="home-course-art"><BookOpen aria-hidden="true" /></div>
        )}
        <span className="home-course-level">{course.level || 'Course'}</span>
        <span className="home-course-open" aria-hidden="true"><ArrowUpRight /></span>
      </div>
      <div className="home-course-copy">
        <span className="home-course-category">{course.category_name || course.category || 'Anatomia course'}</span>
        <h3>{course.title}</h3>
        {course.short_description && <p>{course.short_description}</p>}
        <div className="home-course-meta">
          <span>{Number(course.duration) ? <><Clock3 /> {course.duration}h</> : <><GraduationCap /> Self-paced</>}</span>
          <strong>{price === 0 ? 'Free' : formatPrice(course.discount_price ?? price)}</strong>
        </div>
      </div>
    </Link>
  )
}

export default function Landing() {
  const nav = useNavigate()
  const [courses, setCourses] = useState<Row[]>([])
  const [categories, setCategories] = useState<Row[]>([])
  const [instructors, setInstructors] = useState<PublicInstructor[]>([])
  const [partners, setPartners] = useState<Row[]>([])
  const [articles, setArticles] = useState<Row[]>([])
  const [faqs, setFaqs] = useState<Row[]>([])
  const [jobs, setJobs] = useState<Row[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    let active = true
    const load = async <T,>(request: Promise<T>, setter: (value: T) => void) => {
      try {
        const result = await request
        if (active) setter(result)
      } catch {
        // A page section stays hidden when its public data source is unavailable.
      }
    }

    void load(coursesApi.list({ status: 'published' }), (rows) => setCourses((rows || []) as Row[]))
      .finally(() => { if (active) setLoadingCourses(false) })
    void load(categoriesApi.list({ is_active: true }), (rows) => setCategories((rows || []) as Row[]))
      .finally(() => { if (active) setLoadingCategories(false) })
    void load(membersApi.list({ role: 'instructor' }), (rows) => setInstructors((rows || []) as PublicInstructor[]))
    void load(partnersApi.list({ is_active: true }), (rows) => setPartners((rows || []) as Row[]))
    void load(articlesApi.list({ is_published: true }), (rows) => setArticles((rows || []) as Row[]))
    void load(faqApi.list(), (rows) => setFaqs((rows || []) as Row[]))
    void load(careersApi.list({ status: 'open', is_active: true }), (rows) => setJobs(((rows || []) as Row[]).slice(0, 3)))
    return () => { active = false }
  }, [])

  const shownCourses = useMemo(() => {
    const featured = courses.filter((course) => course.is_featured)
    return (featured.length ? featured : courses).slice(0, 4)
  }, [courses])
  const heroCourse = shownCourses[0]
  const whyItems = [
    { icon: <BookOpen />, title: 'Learn with clarity', body: 'Focused lessons make complex anatomy easier to understand and remember.' },
    { icon: <HeartPulse />, title: 'Built for health sciences', body: 'Explore structured learning created around the human body and clinical practice.' },
    { icon: <ShieldCheck />, title: 'Learn at your pace', body: 'Return to your lessons whenever it fits your schedule.' }
  ]

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-grid" aria-hidden="true" />
        <div className="container-page home-hero-inner">
          <motion.div className="home-hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="home-eyebrow"><span /> ANATOMIA EDUCATION</div>
            <h1>Understand the body.<br /><em>Advance your practice.</em></h1>
            <p>Thoughtful, practical learning for the people who care for human health.</p>
            <div className="home-hero-actions">
              <button className="home-button home-button-dark" onClick={() => nav('/courses')}>Explore courses <ArrowRight /></button>
              <Link className="home-text-link" to="/instructors">Meet the instructors <ArrowUpRight /></Link>
            </div>
            <div className="home-hero-note"><span><Check /></span> Learn from anywhere, at your own pace</div>
          </motion.div>

          <motion.div className="home-hero-visual" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, delay: 0.1 }}>
            <div className="home-visual-backdrop" />
            {heroCourse && (heroCourse.thumbnail_url || heroCourse.thumbnail) ? (
              <img className="home-hero-image" src={heroCourse.thumbnail_url || heroCourse.thumbnail} alt="" />
            ) : (
              <div className="home-anatomy-art" aria-hidden="true">
                <div className="anatomy-orbit orbit-one" /><div className="anatomy-orbit orbit-two" />
                <div className="anatomy-core"><HeartPulse /></div>
                <span className="anatomy-label label-top">FORM & FUNCTION</span><span className="anatomy-label label-bottom">HUMAN BODY · DEMYSTIFIED</span>
              </div>
            )}
            <div className="home-visual-caption">
              <span>{heroCourse ? 'START LEARNING' : 'A NEW WAY TO LEARN ANATOMY'}</span>
              <strong>{heroCourse?.title || 'Knowledge, made human.'}</strong>
              {heroCourse && <Link to={coursePath(heroCourse)} aria-label={`Explore ${heroCourse.title}`}><ArrowUpRight /></Link>}
            </div>
            <div className="home-visual-index">01 <span>—</span> LEARN</div>
          </motion.div>
        </div>
        <div className="home-hero-bottom container-page"><span>ANATOMY · HEALTH SCIENCES · PROFESSIONAL LEARNING</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      {partners.length > 0 && (
        <section className="home-partners">
          <div className="container-page home-partners-inner">
            <span className="home-partners-label">IN GOOD COMPANY</span>
            <div className="home-partner-list">{partners.slice(0, 5).map((partner) => <div key={partner.id}>
              {partner.logo_url && <img src={partner.logo_url} alt="" loading="lazy" />}
              <span>{partner.name}</span>
            </div>)}</div>
          </div>
        </section>
      )}

      <section className="home-section home-disciplines">
        <div className="container-page">
          <div className="home-section-heading">
            <div><span className="home-kicker">A PLACE TO BEGIN</span><h2>Explore the<br /><em>disciplines.</em></h2></div>
            <p>Build a deeper understanding of the systems, structures, and science that shape human health.</p>
          </div>
          {loadingCategories ? <div className="home-category-grid">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div> : categories.length > 0 ? (
            <div className="home-category-grid">{categories.slice(0, 4).map((category, index) => <Link key={category.id} to={`/courses?category=${category.slug}`} className="home-category">
              <span className="home-category-number">0{index + 1}</span><h3>{category.name}</h3><span className="home-category-arrow"><ArrowUpRight /></span>
            </Link>)}</div>
          ) : <div className="home-inline-empty">New learning areas are on the way.</div>}
          <Link to="/courses" className="home-underlined-link">Browse all courses <ArrowRight /></Link>
        </div>
      </section>

      <section className="home-section home-courses-section">
        <div className="container-page">
          <div className="home-section-heading home-course-heading">
            <div><span className="home-kicker">LEARN SOMETHING THAT MATTERS</span><h2>Courses worth<br /><em>your time.</em></h2></div>
            <Link to="/courses" className="home-outline-link">View course library <ArrowUpRight /></Link>
          </div>
          {loadingCourses ? <div className="home-course-grid">{Array.from({ length: 4 }).map((_, i) => <div className="card overflow-hidden" key={i}><Skeleton className="aspect-video w-full" /><div className="space-y-3 p-5"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></div>)}</div> : shownCourses.length > 0 ? (
            <div className="home-course-grid">{shownCourses.map((course) => <CourseTile key={course.id} course={course} />)}</div>
          ) : <div className="home-course-empty"><BookOpen /><span>Our first courses are taking shape.</span><Link to="/courses">Explore the library <ArrowRight /></Link></div>}
        </div>
      </section>

      <section className="home-story">
        <div className="container-page home-story-inner">
          <div className="home-story-aside"><span className="home-kicker">WHY ANATOMIA</span><span className="home-story-mark">A.</span></div>
          <div className="home-story-content"><h2>Medical knowledge,<br /><em>made more accessible.</em></h2><p>We believe understanding the human body should feel clear, connected, and within reach. Anatomia brings learning and practice together in one considered space.</p>
            <div className="home-benefits">{whyItems.map((item, index) => <div className="home-benefit" key={item.title}><span className="home-benefit-icon">{item.icon}</span><div><span className="home-benefit-index">0{index + 1}</span><h3>{item.title}</h3><p>{item.body}</p></div></div>)}</div>
          </div>
        </div>
      </section>

      {instructors.length > 0 && <section className="home-section home-instructors">
        <div className="container-page">
          <div className="home-section-heading"><div><span className="home-kicker">GUIDANCE THAT GOES FURTHER</span><h2>Learn from<br /><em>people who know.</em></h2></div><Link to="/instructors" className="home-outline-link">Meet our instructors <ArrowUpRight /></Link></div>
          <div className="home-instructor-grid">{instructors.slice(0, 3).map((instructor, index) => <Link to={`/instructors/${instructor.id}`} className="home-instructor" key={instructor.id}>
            <div className="home-instructor-avatar"><Avatar name={instructor.name} src={instructor.avatar} size="xl" /><span>0{index + 1}</span></div>
            <h3>{instructor.name}</h3><p>{instructor.title || instructor.headline}</p><ArrowUpRight className="home-instructor-arrow" />
          </Link>)}</div>
        </div>
      </section>}

      {articles.length > 0 && <section className="home-section home-journal">
        <div className="container-page"><div className="home-section-heading"><div><span className="home-kicker">FROM THE JOURNAL</span><h2>Ideas to keep<br /><em>you curious.</em></h2></div><Link to="/articles" className="home-outline-link">Read all articles <ArrowUpRight /></Link></div>
          <div className="home-journal-grid">{articles.slice(0, 3).map((article) => <Link className="home-journal-item" to={`/articles/${article.slug || article.id}`} key={article.id}>
            {article.image_url && <img src={article.image_url} alt="" loading="lazy" />}<span>{article.category || 'ANATOMIA JOURNAL'}</span><h3>{article.title}</h3><p>{article.excerpt}</p><b>Read story <ArrowRight /></b>
          </Link>)}</div>
        </div>
      </section>}

      {jobs.length > 0 && <section className="home-careers"><div className="container-page home-careers-inner"><div><span className="home-kicker">GROW WITH US</span><h2>Good work begins<br /><em>with good people.</em></h2></div><div><p>Help us make health education more thoughtful, useful, and accessible.</p><Link to="/careers" className="home-button home-button-dark">Explore careers <ArrowRight /></Link></div></div></section>}

      {faqs.length > 0 && <section className="home-section home-faq"><div className="container-page home-faq-inner"><div><span className="home-kicker">A FEW ANSWERS</span><h2>Good to<br /><em>know.</em></h2><Link to="/contact" className="home-underlined-link">Still have a question? <ArrowRight /></Link></div><div className="home-faq-list">{faqs.slice(0, 5).map((faq, index) => <Accordion key={faq.id || index} title={<span>{faq.question || faq.q}</span>}><p className="text-sm leading-relaxed text-muted">{faq.answer || faq.a}</p></Accordion>)}</div></div></section>}

      <section className="home-final-cta"><div className="home-final-orbit" aria-hidden="true" /><div className="container-page home-final-content"><span className="home-kicker">YOUR NEXT CHAPTER STARTS HERE</span><h2>Make room for<br /><em>what you can become.</em></h2><p>Find a course that moves your learning forward.</p><button className="home-button home-button-light" onClick={() => nav('/courses')}>Explore the course library <ArrowRight /></button></div><div className="home-final-foot container-page"><span>ANATOMIA EDUCATION</span><span>HUMAN BODY DEMYSTIFIED</span></div></section>
    </div>
  )
}
