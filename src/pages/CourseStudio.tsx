import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronUp, Eye, FilePlus2,
  GripVertical, HelpCircle, ImagePlus, Layers, ListChecks, Loader2, Plus, Save, Settings2, Sparkles, Trash2, Video
} from 'lucide-react'
import type { AssessmentQuestion, Course, CourseStatus, LessonType } from '../lib/types'
import { ASSESSMENTS, CATEGORIES as MOCK_CATEGORIES, COURSES } from '../lib/data'
import { courseApi, getStoredToken, type AdminCategory, type AdminCourseFull } from '../lib/api/auth'
import { useApp } from '../lib/store'
import { Badge, Button, Input } from '../components/ui'
import { cn, formatDuration, formatPrice, uid } from '../lib/utils'

interface StudioLesson {
  id: string
  title: string
  type: LessonType
  duration: number
  content: string
  videoUrl?: string
  resourceUrl?: string
}

interface StudioSection {
  id: string
  title: string
  lessons: StudioLesson[]
}

interface StudioQuestion {
  id: string
  type: AssessmentQuestion['type']
  question: string
  options: string[]
  answer: string
  explanation: string
}

interface StudioAssessment {
  id: string
  title: string
  description: string
  timeLimit: number
  passingScore: number
  retakeLimit: number
  questions: StudioQuestion[]
}

interface StudioFaq {
  id: string
  q: string
  a: string
}

interface StudioDraft {
  title: string
  subtitle: string
  description: string
  longDescription: string
  categoryId: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  language: string
  thumbnail: string
  price: string
  discountPrice: string
  hasCertificate: boolean
  status: CourseStatus
  objectives: string[]
  requirements: string[]
  sections: StudioSection[]
  assessments: StudioAssessment[]
  faqs: StudioFaq[]
}

const LESSON_TYPES: LessonType[] = ['video', 'article', 'pdf', 'audio', 'quiz', 'assignment', 'exam', 'project']
const QUESTION_TYPES: AssessmentQuestion['type'][] = ['mc', 'multi', 'truefalse', 'short', 'essay', 'fill']

const lessonTypeKey = (t: LessonType) => `instrCourses.lessonType${t[0].toUpperCase()}${t.slice(1)}`
const questionTypeKey = (t: AssessmentQuestion['type']) => `instrCourses.qtype${t[0].toUpperCase()}${t.slice(1)}`

const placeholderThumb = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1e3a8a"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="320" y="190" font-family="system-ui" font-size="28" fill="#ffffff" text-anchor="middle" opacity="0.85">HamaAcademy</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function blank(): StudioDraft {
  return {
    title: '',
    subtitle: '',
    description: '',
    longDescription: '',
    categoryId: '',
    level: 'Beginner',
    language: 'English',
    thumbnail: '',
    price: '49',
    discountPrice: '',
    hasCertificate: true,
    status: 'draft',
    objectives: [''],
    requirements: [''],
    sections: [
      {
        id: uid('sec'),
        title: 'Section 1',
        lessons: [{ id: uid('les'), title: '', type: 'video', duration: 10, content: '' }]
      }
    ],
    assessments: [],
    faqs: []
  }
}

function fromCourse(c: Course): StudioDraft {
  return {
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    longDescription: c.longDescription,
    categoryId: c.categoryId,
    level: c.level,
    language: c.language,
    thumbnail: c.thumbnail,
    price: String(c.price ?? 0),
    discountPrice: c.discountPrice != null ? String(c.discountPrice) : '',
    hasCertificate: c.hasCertificate,
    status: c.status,
    objectives: c.objectives.map((o) => o.text),
    requirements: c.requirements.map((r) => r.text),
    sections: c.sections.map((s) => ({
      id: s.id,
      title: s.title,
      lessons: s.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        duration: l.duration,
        content: l.content,
        videoUrl: l.videoUrl,
        resourceUrl: l.resourceUrl
      }))
    })),
    assessments: ASSESSMENTS.filter((a) => a.courseId === c.id).map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      timeLimit: a.timeLimit,
      passingScore: a.passingScore,
      retakeLimit: a.retakeLimit,
      questions: a.questions.map((q) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options ?? [],
        answer: typeof q.answer === 'string' ? q.answer : (q.answer ?? []).join('|'),
        explanation: q.explanation ?? ''
      }))
    })),
    faqs: c.faqs.map((f, i) => ({ id: uid('faq'), q: f.q, a: f.a }))
  }
}

function toContentInput(d: StudioDraft, courseId?: string) {
  return {
    title: d.title,
    subtitle: d.subtitle,
    description: d.description,
    longDescription: d.longDescription,
    categoryId: d.categoryId,
    level: d.level,
    language: d.language,
    thumbnail: d.thumbnail,
    price: Number(d.price) || 0,
    discountPrice: d.discountPrice ? Number(d.discountPrice) : null,
    hasCertificate: d.hasCertificate,
    status: d.status,
    objectives: d.objectives.filter(Boolean),
    requirements: d.requirements.filter(Boolean),
    sections: d.sections.map((s, si) => ({
      id: s.id,
      title: s.title || `Section ${si + 1}`,
      lessons: s.lessons.map((l, li) => ({
        id: l.id,
        title: l.title || `Lesson ${li + 1}`,
        type: l.type,
        duration: l.duration || 0,
        content: l.content,
        videoUrl: l.videoUrl,
        resourceUrl: l.resourceUrl
      }))
    })),
    assessments: d.assessments.map((a, ai) => ({
      id: a.id,
      title: a.title || `Assessment ${ai + 1}`,
      description: a.description,
      timeLimit: a.timeLimit,
      passingScore: a.passingScore,
      retakeLimit: a.retakeLimit,
      questions: a.questions.map((q, qi) => ({
        id: q.id,
        type: q.type,
        question: q.question || `Question ${qi + 1}`,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation
      }))
    })),
    faqs: d.faqs.filter((f) => f.q || f.a)
  }
}

function toCourse(d: StudioDraft, instructorId: string): Course {
  const sections = d.sections.map((s, si) => ({
    id: s.id,
    title: s.title || `Section ${si + 1}`,
    lessons: s.lessons.map((l, li) => ({
      id: l.id,
      title: l.title || `Lesson ${li + 1}`,
      type: l.type,
      duration: l.duration || 0,
      content: l.content,
      videoUrl: l.videoUrl,
      resourceUrl: l.resourceUrl
    }))
  }))
  const duration = sections.reduce((a, s) => a + s.lessons.reduce((x, l) => x + (l.duration || 0), 0), 0)
  const slug = d.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'course'
  return {
    id: 'draft',
    slug,
    title: d.title.trim() || 'Untitled course',
    subtitle: d.subtitle,
    description: d.description,
    longDescription: d.longDescription,
    categoryId: d.categoryId,
    instructorId,
    thumbnail: d.thumbnail || placeholderThumb(),
    price: Number(d.price) || 0,
    discountPrice: d.discountPrice ? Number(d.discountPrice) : undefined,
    rating: 0,
    reviewCount: 0,
    studentCount: 0,
    duration,
    level: d.level,
    language: d.language,
    lastUpdated: new Date().toISOString().slice(0, 10),
    hasCertificate: d.hasCertificate,
    isFeatured: false,
    isTrending: false,
    isNew: true,
    status: d.status,
    objectives: d.objectives.filter(Boolean).map((text) => ({ id: uid('ob'), text })),
    requirements: d.requirements.filter(Boolean).map((text) => ({ id: uid('req'), text })),
    sections,
    reviews: [],
    faqs: d.faqs.filter((f) => f.q || f.a).map((f) => ({ q: f.q, a: f.a }))
  }
}

type Selection = { section: number; lesson?: number } | null

export default function CourseStudio() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t } = useTranslation()
  const { currentUser, toast } = useApp()
  const isEdit = Boolean(id)
  const key = `dha:studio:${id ?? 'new'}`
  const existing = useMemo(() => COURSES.find((c) => c.id === id), [id])

  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(Boolean(id))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<'details' | 'curriculum' | 'assessments' | 'faqs' | 'preview'>('details')
  const [draft, setDraft] = useState<StudioDraft>(() => {
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        const p = JSON.parse(raw)
        if (p && p.title !== undefined && Array.isArray(p.sections)) return p as StudioDraft
      } catch { /* ignore */ }
    }
    return isEdit && existing ? fromCourse(existing) : blank()
  })
  const [saveState, setSaveState] = useState<'saved' | 'dirty' | 'saving'>('saved')
  const [sel, setSel] = useState<Selection>(null)

  const loadCategories = useCallback(async () => {
    const token = getStoredToken()
    if (!token) return
    try {
      const res = await courseApi.listCategories(token)
      if (res.categories.length > 0) {
        setCategories(res.categories)
        setDraft((d) => (d.categoryId ? d : { ...d, categoryId: res.categories[0].id }))
      }
    } catch { /* fall back to mock */ }
  }, [])

  const loadFull = useCallback(async () => {
    const token = getStoredToken()
    if (!id || !token) return
    setLoading(true)
    setLoadError(null)
    try {
      const res = await courseApi.getCourseFull(token, id)
      const full = res.course
      const d: StudioDraft = {
        title: full.title,
        subtitle: full.subtitle,
        description: full.description,
        longDescription: full.longDescription,
        categoryId: full.categoryId,
        level: full.level,
        language: full.language,
        thumbnail: full.thumbnail ?? '',
        price: String(full.price ?? 0),
        discountPrice: full.discountPrice != null ? String(full.discountPrice) : '',
        hasCertificate: full.hasCertificate,
        status: full.status,
        objectives: full.objectives.length > 0 ? full.objectives : [''],
        requirements: full.requirements.length > 0 ? full.requirements : [''],
        sections: full.sections.length > 0 ? full.sections.map((s) => ({
          id: s.id,
          title: s.title,
          lessons: s.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            type: l.type as StudioLesson['type'],
            duration: l.duration,
            content: l.content,
            videoUrl: l.videoUrl,
            resourceUrl: l.resourceUrl
          }))
        })) : [{ id: uid('sec'), title: 'Section 1', lessons: [{ id: uid('les'), title: '', type: 'video', duration: 10, content: '' }] }],
        assessments: full.assessments.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description ?? '',
          timeLimit: a.timeLimit ?? 30,
          passingScore: a.passingScore ?? 60,
          retakeLimit: a.retakeLimit ?? 3,
          questions: a.questions.map((q) => ({
            id: q.id,
            type: q.type as StudioQuestion['type'],
            question: q.question,
            options: q.options ?? [],
            answer: q.answer ?? '',
            explanation: q.explanation ?? ''
          }))
        })),
        faqs: full.faqs.map((f) => ({ id: uid('faq'), q: f.q, a: f.a }))
      }
      setDraft(d)
      setSaveState('saved')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t('instrCourses.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    loadCategories()
    if (isEdit) loadFull()
  }, [loadCategories, loadFull, isEdit])

  useEffect(() => {
    setSaveState('dirty')
    const t2 = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(draft))
      setSaveState('saved')
    }, 700)
    return () => clearTimeout(t2)
  }, [draft, key])

  const patch = (p: Partial<StudioDraft>) => setDraft((d) => ({ ...d, ...p }))

  const setSectionTitle = (si: number, title: string) =>
    setDraft((d) => ({ ...d, sections: d.sections.map((s, i) => (i === si ? { ...s, title } : s)) }))

  const addSection = () => {
    const sec: StudioSection = { id: uid('sec'), title: `Section ${draft.sections.length + 1}`, lessons: [{ id: uid('les'), title: '', type: 'video', duration: 10, content: '' }] }
    setDraft((d) => ({ ...d, sections: [...d.sections, sec] }))
    setSel({ section: draft.sections.length })
  }

  const removeSection = (si: number) => {
    setDraft((d) => ({ ...d, sections: d.sections.filter((_, i) => i !== si) }))
    setSel(null)
  }

  const moveSection = (si: number, dir: -1 | 1) => {
    setDraft((d) => {
      const sections = [...d.sections]
      const target = si + dir
      if (target < 0 || target >= sections.length) return d
      ;[sections[si], sections[target]] = [sections[target], sections[si]]
      return { ...d, sections }
    })
    setSel({ section: si + dir })
  }

  const addLesson = (si: number) => {
    const les: StudioLesson = { id: uid('les'), title: '', type: 'video', duration: 10, content: '' }
    setDraft((d) => ({ ...d, sections: d.sections.map((s, i) => (i === si ? { ...s, lessons: [...s.lessons, les] } : s)) }))
    setSel({ section: si, lesson: draft.sections[si].lessons.length })
  }

  const removeLesson = (si: number, li: number) => {
    setDraft((d) => ({ ...d, sections: d.sections.map((s, i) => (i === si ? { ...s, lessons: s.lessons.filter((_, j) => j !== li) } : s)) }))
    setSel(null)
  }

  const patchLesson = (si: number, li: number, p: Partial<StudioLesson>) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, i) => (i === si ? { ...s, lessons: s.lessons.map((l, j) => (j === li ? { ...l, ...p } : l)) } : s))
    }))

  const moveLesson = (si: number, li: number, dir: -1 | 1) => {
    setDraft((d) => {
      const sections = d.sections.map((s, i) => {
        if (i !== si) return s
        const lessons = [...s.lessons]
        const target = li + dir
        if (target < 0 || target >= lessons.length) return s
        ;[lessons[li], lessons[target]] = [lessons[target], lessons[li]]
        return { ...s, lessons }
      })
      return { ...d, sections }
    })
    setSel({ section: si, lesson: li + dir })
  }

  const addAssessment = () => {
    const a: StudioAssessment = {
      id: uid('asg'),
      title: '',
      description: '',
      timeLimit: 30,
      passingScore: 70,
      retakeLimit: 3,
      questions: [{ id: uid('q'), type: 'mc', question: '', options: ['', ''], answer: '0', explanation: '' }]
    }
    setDraft((d) => ({ ...d, assessments: [...d.assessments, a] }))
  }

  const removeAssessment = (ai: number) =>
    setDraft((d) => ({ ...d, assessments: d.assessments.filter((_, i) => i !== ai) }))

  const patchAssessment = (ai: number, p: Partial<StudioAssessment>) =>
    setDraft((d) => ({ ...d, assessments: d.assessments.map((a, i) => (i === ai ? { ...a, ...p } : a)) }))

  const addQuestion = (ai: number) => {
    const q: StudioQuestion = { id: uid('q'), type: 'mc', question: '', options: ['', ''], answer: '0', explanation: '' }
    setDraft((d) => ({ ...d, assessments: d.assessments.map((a, i) => (i === ai ? { ...a, questions: [...a.questions, q] } : a)) }))
  }

  const removeQuestion = (ai: number, qi: number) =>
    setDraft((d) => ({ ...d, assessments: d.assessments.map((a, i) => (i === ai ? { ...a, questions: a.questions.filter((_, j) => j !== qi) } : a)) }))

  const patchQuestion = (ai: number, qi: number, p: Partial<StudioQuestion>) =>
    setDraft((d) => ({
      ...d,
      assessments: d.assessments.map((a, i) => (i === ai ? { ...a, questions: a.questions.map((q, j) => (j === qi ? { ...q, ...p } : q)) } : a))
    }))

  const addFaq = () => setDraft((d) => ({ ...d, faqs: [...d.faqs, { id: uid('faq'), q: '', a: '' }] }))
  const removeFaq = (fi: number) => setDraft((d) => ({ ...d, faqs: d.faqs.filter((_, i) => i !== fi) }))
  const patchFaq = (fi: number, p: Partial<StudioFaq>) =>
    setDraft((d) => ({ ...d, faqs: d.faqs.map((f, i) => (i === fi ? { ...f, ...p } : f)) }))

  const totalLessons = draft.sections.reduce((a, s) => a + s.lessons.length, 0)
  const totalMinutes = draft.sections.reduce((a, s) => a + s.lessons.reduce((x, l) => x + (l.duration || 0), 0), 0)
  const preview = toCourse(draft, currentUser?.id ?? 'u1')

  const checklist = [
    { ok: draft.title.trim().length > 0, label: t('instrCourses.checklist1') },
    { ok: draft.sections.length > 0 && totalLessons > 0, label: t('instrCourses.checklist2') },
    { ok: draft.assessments.length > 0, label: t('instrCourses.checklist3') }
  ]
  const complete = checklist.every((c) => c.ok)

  const saveNow = async () => {
    localStorage.setItem(key, JSON.stringify(draft))
    setSaveState('saving')
    const token = getStoredToken()
    try {
      if (isEdit && id && token) {
        await courseApi.saveCourseContent(token, id, toContentInput(draft))
      } else if (token && currentUser) {
        const catId = draft.categoryId || categories[0]?.id
        if (!catId) throw new Error(t('instrCourses.categoryRequired'))
        const { course } = await courseApi.createCourse(token, {
          title: draft.title.trim() || 'Untitled course',
          categoryId: catId,
          instructorId: currentUser.id,
          level: draft.level,
          price: Number(draft.price) || 0,
          duration: totalMinutes,
          hasCertificate: draft.hasCertificate,
          status: draft.status
        })
        await courseApi.saveCourseContent(token, course.id, toContentInput({ ...draft, status: draft.status }, course.id))
        nav(`/instructor/courses/${course.id}/edit`, { replace: true })
      } else {
        setSaveState('saved')
        toast(t('instrCourses.draftSaved'), t('instrCourses.draftSavedBody'))
        return
      }
      setSaveState('saved')
      toast(t('instrCourses.draftSaved'), t('instrCourses.draftSavedBody'))
    } catch (err) {
      setSaveState('dirty')
      toast(t('instrCourses.saveFailed'), err instanceof Error ? err.message : t('admin.errorGeneric'), 'error')
    }
  }

  const publish = async () => {
    if (!complete) {
      toast(t('instrCourses.publishWarning'), '', 'info')
      setTab('preview')
      return
    }
    setDraft((d) => ({ ...d, status: 'published' }))
    const published = { ...draft, status: 'published' as const }
    localStorage.setItem(key, JSON.stringify(published))
    setSaveState('saving')
    const token = getStoredToken()
    try {
      if (isEdit && id && token) {
        await courseApi.saveCourseContent(token, id, toContentInput(published))
      } else if (token && currentUser) {
        const catId = draft.categoryId || categories[0]?.id
        if (!catId) throw new Error(t('instrCourses.categoryRequired'))
        const { course } = await courseApi.createCourse(token, {
          title: published.title.trim() || 'Untitled course',
          categoryId: catId,
          instructorId: currentUser.id,
          level: published.level,
          price: Number(published.price) || 0,
          duration: totalMinutes,
          hasCertificate: published.hasCertificate,
          status: 'published'
        })
        await courseApi.saveCourseContent(token, course.id, toContentInput({ ...published, status: 'published' }, course.id))
        nav(`/instructor/courses/${course.id}/edit`, { replace: true })
      } else {
        setSaveState('saved')
        toast(t('instrCourses.publishedSuccess'), t('instrCourses.publishedSuccessBody'))
        return
      }
      setSaveState('saved')
      toast(t('instrCourses.publishedSuccess'), t('instrCourses.publishedSuccessBody'))
    } catch (err) {
      setDraft((d) => ({ ...d, status: published.status }))
      setSaveState('dirty')
      toast(t('instrCourses.publishFailed'), err instanceof Error ? err.message : t('admin.errorGeneric'), 'error')
    }
  }

  const tabs = [
    { id: 'details' as const, label: t('instrCourses.courseDetails') },
    { id: 'curriculum' as const, label: t('instrCourses.curriculum') },
    { id: 'assessments' as const, label: t('instrCourses.assessmentsHeading') },
    { id: 'faqs' as const, label: t('instrCourses.addFaq') },
    { id: 'preview' as const, label: t('instrCourses.previewCourse') }
  ]

  const saveLabel = saveState === 'saved' ? t('instrCourses.savedJustNow') : saveState === 'saving' ? t('instrCourses.savingChanges') : t('instrCourses.unsavedChanges')

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-sm">{t('instrCourses.loadingCourse')}</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-danger">{loadError}</p>
        <Button variant="outline" onClick={() => nav('/instructor/courses')}><ArrowLeft className="h-4 w-4" /> {t('instrCourses.backToCourses')}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link to="/instructor/courses" className="flex items-center gap-1 text-sm text-muted hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> {t('instrCourses.backToCourses')}</Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-ink">{isEdit ? t('instrCourses.editCourse') : t('instrCourses.createNewCourse')}</h1>
            <Badge color={draft.status === 'published' ? 'success' : draft.status === 'pending' ? 'warning' : 'line'}>{draft.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">{saveLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveNow}><Save className="h-4 w-4" /> {t('instrCourses.saveDraft')}</Button>
          <Button onClick={publish}>{t('instrCourses.publish')}</Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={cn('chip shrink-0', tab === tb.id && 'border-brand-500 bg-brand-50 text-brand-700')}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="card space-y-5 p-6">
            <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.courseInformation')}</h2>
            <Input label={t('instrCourses.courseTitle')} value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder={t('instrCourses.titlePlaceholder')} />
            <Input label={t('instrCourses.subtitle')} value={draft.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} placeholder={t('instrCourses.subtitlePlaceholder')} />
            <div>
              <label className="label-base">{t('instrCourses.description')}</label>
              <textarea value={draft.description} onChange={(e) => patch({ description: e.target.value })} rows={3} className="input-base" placeholder={t('instrCourses.descriptionPlaceholder')} />
            </div>
            <div>
              <label className="label-base">{t('instrCourses.longDescription')}</label>
              <textarea value={draft.longDescription} onChange={(e) => patch({ longDescription: e.target.value })} rows={5} className="input-base" placeholder={t('instrCourses.longDescriptionPlaceholder')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label-base">{t('instrCourses.category')}</label>
                <select value={draft.categoryId} onChange={(e) => patch({ categoryId: e.target.value })} className="input-base">
                  {(categories.length > 0 ? categories : MOCK_CATEGORIES).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">{t('instrCourses.level')}</label>
                <select value={draft.level} onChange={(e) => patch({ level: e.target.value as StudioDraft['level'] })} className="input-base">
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">{t('instrCourses.language')}</label>
                <input value={draft.language} onChange={(e) => patch({ language: e.target.value })} className="input-base" placeholder={t('instrCourses.languagePlaceholder')} />
              </div>
            </div>

            <div>
              <label className="label-base">{t('instrCourses.objectives')}</label>
              <p className="mb-2 text-xs text-muted">{t('instrCourses.objectivesBody')}</p>
              <div className="space-y-2">
                {draft.objectives.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 shrink-0 text-success" />
                    <input value={o} onChange={(e) => setDraft((d) => ({ ...d, objectives: d.objectives.map((x, j) => (j === i ? e.target.value : x)) }))} className="input-base py-1.5 text-sm" placeholder={t('instrCourses.objectivePlaceholder')} />
                    <button onClick={() => setDraft((d) => ({ ...d, objectives: d.objectives.filter((_, j) => j !== i) }))} className="rounded p-1.5 text-muted hover:text-danger" aria-label={t('common.remove')}><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-2" onClick={() => setDraft((d) => ({ ...d, objectives: [...d.objectives, ''] }))}><Plus className="h-4 w-4" /> {t('instrCourses.addObjective')}</Button>
            </div>

            <div>
              <label className="label-base">{t('instrCourses.requirementsTitle')}</label>
              <p className="mb-2 text-xs text-muted">{t('instrCourses.requirementsBody')}</p>
              <div className="space-y-2">
                {draft.requirements.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    <input value={r} onChange={(e) => setDraft((d) => ({ ...d, requirements: d.requirements.map((x, j) => (j === i ? e.target.value : x)) }))} className="input-base py-1.5 text-sm" placeholder={t('instrCourses.requirementPlaceholder')} />
                    <button onClick={() => setDraft((d) => ({ ...d, requirements: d.requirements.filter((_, j) => j !== i) }))} className="rounded p-1.5 text-muted hover:text-danger" aria-label={t('common.remove')}><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-2" onClick={() => setDraft((d) => ({ ...d, requirements: [...d.requirements, ''] }))}><Plus className="h-4 w-4" /> {t('instrCourses.addRequirement')}</Button>
            </div>
          </div>

          <div className="card h-fit p-6">
            <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.courseThumbnail')}</h2>
            <p className="mt-1 text-sm text-muted">{t('instrCourses.thumbnailBody')}</p>
            <div className="mt-4 aspect-[16/9] w-full overflow-hidden rounded-card bg-brand-900">
              {draft.thumbnail ? <img src={draft.thumbnail} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-brand-200"><ImagePlus className="h-8 w-8" /></div>}
            </div>
            <input value={draft.thumbnail} onChange={(e) => patch({ thumbnail: e.target.value })} className="input-base mt-3" placeholder="https://…" />
            <Button variant="outline" className="mt-2 w-full" onClick={() => patch({ thumbnail: placeholderThumb() })}><Sparkles className="h-4 w-4" /> {t('instrCourses.thumbnailUploaded')}</Button>
          </div>
        </div>
      )}

      {tab === 'curriculum' && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="card h-fit p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink">{t('instrCourses.outline')}</h2>
              <span className="text-xs text-muted">{t('instrCourses.totalContent', { lessons: totalLessons, minutes: totalMinutes })}</span>
            </div>
            <div className="space-y-2">
              {draft.sections.map((s, si) => (
                <div key={s.id} className={cn('rounded-card border p-3', sel?.section === si && !sel?.lesson && 'border-brand-500 bg-brand-50/50')}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted" />
                    <button onClick={() => setSel({ section: si })} className="min-w-0 flex-1 truncate text-left text-sm font-medium text-ink">{s.title || `Section ${si + 1}`}</button>
                    <button onClick={() => moveSection(si, -1)} className="rounded p-1 text-muted hover:text-ink" aria-label={t('instrCourses.moveUp')}><ChevronUp className="h-4 w-4" /></button>
                    <button onClick={() => moveSection(si, 1)} className="rounded p-1 text-muted hover:text-ink" aria-label={t('instrCourses.moveDown')}><ChevronDown className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {s.lessons.map((l, li) => (
                      <button
                        key={l.id}
                        onClick={() => setSel({ section: si, lesson: li })}
                        className={cn('flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-muted hover:bg-line/60', sel?.section === si && sel?.lesson === li && 'bg-line/70 text-ink')}
                      >
                        <Video className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                        <span className="min-w-0 flex-1 truncate">{l.title || `Lesson ${li + 1}`}</span>
                        {l.type !== 'video' && <Badge color="line">{t(lessonTypeKey(l.type))}</Badge>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-3 w-full" onClick={addSection}><Plus className="h-4 w-4" /> {t('instrCourses.newSection')}</Button>
          </div>

          <div className="card p-6">
            {sel === null && (
              <div className="py-12 text-center text-muted">
                <Layers className="mx-auto mb-3 h-10 w-10 text-brand-300" />
                <p>{t('instrCourses.selectItemHint')}</p>
              </div>
            )}

            {sel && sel.lesson === undefined && (() => {
              const s = draft.sections[sel.section]
              if (!s) return null
              return (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.sectionTitle')}</h2>
                    <button onClick={() => removeSection(sel.section)} className="flex items-center gap-1 text-sm text-danger hover:underline"><Trash2 className="h-4 w-4" /> {t('common.delete')}</button>
                  </div>
                  <Input value={s.title} onChange={(e) => setSectionTitle(sel.section, e.target.value)} placeholder={t('instrCourses.sectionTitlePlaceholder')} />
                  <div className="space-y-2">
                    {s.lessons.map((l, li) => (
                      <div key={l.id} className="flex items-center gap-2 rounded-card border border-line px-3 py-2">
                        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted" />
                        <button onClick={() => setSel({ section: sel.section, lesson: li })} className="min-w-0 flex-1 truncate text-left text-sm text-ink">{l.title || `Lesson ${li + 1}`}</button>
                        <Badge color="brand">{t(lessonTypeKey(l.type))}</Badge>
                        <button onClick={() => moveLesson(sel.section, li, -1)} className="rounded p-1 text-muted hover:text-ink" aria-label={t('instrCourses.moveUp')}><ChevronUp className="h-4 w-4" /></button>
                        <button onClick={() => moveLesson(sel.section, li, 1)} className="rounded p-1 text-muted hover:text-ink" aria-label={t('instrCourses.moveDown')}><ChevronDown className="h-4 w-4" /></button>
                        <button onClick={() => removeLesson(sel.section, li)} className="rounded p-1 text-muted hover:text-danger" aria-label={t('common.remove')}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" onClick={() => addLesson(sel.section)}><Plus className="h-4 w-4" /> {t('instrCourses.newLesson')}</Button>
                </div>
              )
            })()}

            {sel && sel.lesson !== undefined && (() => {
              const s = draft.sections[sel.section]
              const l = s?.lessons[sel.lesson]
              if (!s || !l) return null
              return (
                <div className="space-y-5">
                  <button onClick={() => setSel({ section: sel.section })} className="flex items-center gap-1 text-sm text-muted hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> {s.title || `Section ${sel.section + 1}`}</button>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.lessonTitle')}</h2>
                    <button onClick={() => removeLesson(sel.section, sel.lesson!)} className="flex items-center gap-1 text-sm text-danger hover:underline"><Trash2 className="h-4 w-4" /> {t('common.delete')}</button>
                  </div>
                  <Input value={l.title} onChange={(e) => patchLesson(sel.section, sel.lesson!, { title: e.target.value })} placeholder={t('instrCourses.lessonTitlePlaceholder')} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label-base">{t('instrCourses.lessonType')}</label>
                      <select value={l.type} onChange={(e) => patchLesson(sel.section, sel.lesson!, { type: e.target.value as LessonType })} className="input-base">
                        {LESSON_TYPES.map((lt) => <option key={lt} value={lt}>{t(lessonTypeKey(lt))}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label-base">{t('instrCourses.durationMinutes')}</label>
                      <input type="number" min={0} value={l.duration} onChange={(e) => patchLesson(sel.section, sel.lesson!, { duration: Number(e.target.value) || 0 })} className="input-base" />
                    </div>
                  </div>
                  {(l.type === 'video' || l.type === 'audio') && (
                    <Input label={t('instrCourses.videoUrl')} value={l.videoUrl ?? ''} onChange={(e) => patchLesson(sel.section, sel.lesson!, { videoUrl: e.target.value })} placeholder={t('instrCourses.videoUrlPlaceholder')} />
                  )}
                  {(l.type === 'pdf' || l.type === 'assignment' || l.type === 'project') && (
                    <Input label={t('instrCourses.resourceUrl')} value={l.resourceUrl ?? ''} onChange={(e) => patchLesson(sel.section, sel.lesson!, { resourceUrl: e.target.value })} placeholder={t('instrCourses.resourceUrlPlaceholder')} />
                  )}
                  <div>
                    <label className="label-base">{t('instrCourses.lessonContent')}</label>
                    <textarea value={l.content} onChange={(e) => patchLesson(sel.section, sel.lesson!, { content: e.target.value })} rows={8} className="input-base font-mono text-sm" placeholder={t('instrCourses.lessonContentPlaceholder')} />
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {tab === 'assessments' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.assessmentsHeading')}</h2>
              <p className="text-sm text-muted">{t('instrCourses.assessmentsDesc')}</p>
            </div>
            <Button onClick={addAssessment}><Plus className="h-4 w-4" /> {t('instrCourses.newAssessment')}</Button>
          </div>

          {draft.assessments.length === 0 && (
            <div className="card py-12 text-center text-muted">
              <FilePlus2 className="mx-auto mb-3 h-10 w-10 text-brand-300" />
              <p>{t('instrCourses.emptyAssessments')}</p>
            </div>
          )}

          {draft.assessments.map((a, ai) => (
            <div key={a.id} className="card space-y-5 p-6">
              <div className="flex items-end gap-3">
                <Input className="flex-1" label={t('instrCourses.assessmentTitle')} value={a.title} onChange={(e) => patchAssessment(ai, { title: e.target.value })} placeholder={t('instrCourses.assessmentTitlePlaceholder')} />
                <button onClick={() => removeAssessment(ai)} className="rounded p-2 text-muted hover:text-danger" aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea value={a.description} onChange={(e) => patchAssessment(ai, { description: e.target.value })} rows={2} className="input-base" placeholder={t('instrCourses.assessmentDescPlaceholder')} />
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label-base">{t('instrCourses.timeLimit')}</label>
                  <input type="number" min={0} value={a.timeLimit} onChange={(e) => patchAssessment(ai, { timeLimit: Number(e.target.value) || 0 })} className="input-base" />
                </div>
                <div>
                  <label className="label-base">{t('instrCourses.passingScore')}</label>
                  <input type="number" min={0} max={100} value={a.passingScore} onChange={(e) => patchAssessment(ai, { passingScore: Number(e.target.value) || 0 })} className="input-base" />
                </div>
                <div>
                  <label className="label-base">{t('instrCourses.retakeLimit')}</label>
                  <input type="number" min={0} value={a.retakeLimit} onChange={(e) => patchAssessment(ai, { retakeLimit: Number(e.target.value) || 0 })} className="input-base" />
                </div>
              </div>

              <div className="space-y-4 border-t border-line pt-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">{t('instrCourses.questions')}</h3>
                  <Button variant="outline" onClick={() => addQuestion(ai)}><Plus className="h-4 w-4" /> {t('instrCourses.addQuestion')}</Button>
                </div>
                {a.questions.map((q, qi) => (
                  <div key={q.id} className="rounded-card border border-line bg-paper p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <label className="label-base">{t('instrCourses.questionText')} {qi + 1}</label>
                        <textarea value={q.question} onChange={(e) => patchQuestion(ai, qi, { question: e.target.value })} rows={2} className="input-base" placeholder={t('instrCourses.questionTextPlaceholder')} />
                      </div>
                      <button onClick={() => removeQuestion(ai, qi)} className="mt-6 shrink-0 rounded p-1.5 text-muted hover:text-danger" aria-label={t('common.remove')}><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-3">
                      <label className="label-base">{t('instrCourses.questionType')}</label>
                      <select value={q.type} onChange={(e) => patchQuestion(ai, qi, { type: e.target.value as AssessmentQuestion['type'] })} className="input-base">
                        {QUESTION_TYPES.map((qt) => <option key={qt} value={qt}>{t(questionTypeKey(qt))}</option>)}
                      </select>
                    </div>

                    {(q.type === 'mc' || q.type === 'multi') && (
                      <div className="mt-3 space-y-2">
                        {q.options.map((opt, oi) => {
                          const isCorrect = q.answer.split('|').includes(String(oi))
                          return (
                            <div key={oi} className="flex items-center gap-2">
                              {q.type === 'mc' ? (
                                <input type="radio" name={`q-${q.id}`} checked={q.answer === String(oi)} onChange={() => patchQuestion(ai, qi, { answer: String(oi) })} className="h-4 w-4 accent-brand-500" />
                              ) : (
                                <input type="checkbox" checked={isCorrect} onChange={() => patchQuestion(ai, qi, { answer: isCorrect ? q.options.map((_, j) => String(j)).filter((x) => x !== String(oi)).join('|') : [...q.answer.split('|').filter(Boolean), String(oi)].join('|') })} className="h-4 w-4 accent-brand-500" />
                              )}
                              <input value={opt} onChange={(e) => patchQuestion(ai, qi, { options: q.options.map((x, j) => (j === oi ? e.target.value : x)) })} className="input-base py-1.5 text-sm" placeholder={`${t('instrCourses.option', { n: oi + 1 })}`} />
                              <button onClick={() => patchQuestion(ai, qi, { options: q.options.filter((_, j) => j !== oi) })} className="rounded p-1 text-muted hover:text-danger" aria-label={t('common.remove')}><Trash2 className="h-4 w-4" /></button>
                            </div>
                          )
                        })}
                        <Button variant="outline" className="mt-1" onClick={() => patchQuestion(ai, qi, { options: [...q.options, ''] })}><Plus className="h-4 w-4" /> {t('instrCourses.addOption')}</Button>
                      </div>
                    )}

                    {q.type === 'truefalse' && (
                      <div className="mt-3 flex gap-2">
                        {['0', '1'].map((v, i) => (
                          <label key={v} className={cn('flex flex-1 cursor-pointer items-center gap-2 rounded-card border px-3 py-2 text-sm', q.answer === v ? 'border-brand-500 bg-brand-50 text-ink' : 'border-line text-muted')}>
                            <input type="radio" name={`q-${q.id}`} checked={q.answer === v} onChange={() => patchQuestion(ai, qi, { answer: v })} className="h-4 w-4 accent-brand-500" />
                            {i === 0 ? t('instrCourses.qtypeTruefalse').split(' / ')[0] : t('instrCourses.qtypeTruefalse').split(' / ')[1]}
                          </label>
                        ))}
                      </div>
                    )}

                    {(q.type === 'short' || q.type === 'essay' || q.type === 'fill') && (
                      <div className="mt-3">
                        <label className="label-base">{t('instrCourses.correctAnswer')}</label>
                        <input value={q.answer} onChange={(e) => patchQuestion(ai, qi, { answer: e.target.value })} className="input-base" placeholder={t('instrCourses.questionTextPlaceholder')} />
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="label-base">{t('instrCourses.explanation')}</label>
                      <textarea value={q.explanation} onChange={(e) => patchQuestion(ai, qi, { explanation: e.target.value })} rows={2} className="input-base" placeholder={t('instrCourses.explanationPlaceholder')} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'faqs' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.addFaq')}</h2>
              <p className="text-sm text-muted">{t('instrCourses.courseDetails')}</p>
            </div>
            <Button onClick={addFaq}><Plus className="h-4 w-4" /> {t('instrCourses.addFaq')}</Button>
          </div>
          {draft.faqs.length === 0 && (
            <div className="card py-12 text-center text-muted">
              <HelpCircle className="mx-auto mb-3 h-10 w-10 text-brand-300" />
              <p>{t('instrCourses.emptyFaqs')}</p>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {draft.faqs.map((f, fi) => (
              <div key={f.id} className="card space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <Input label={t('instrCourses.faqQuestion')} value={f.q} onChange={(e) => patchFaq(fi, { q: e.target.value })} className="flex-1" />
                  <button onClick={() => removeFaq(fi)} className="mt-5 shrink-0 rounded p-2 text-muted hover:text-danger" aria-label={t('common.remove')}><Trash2 className="h-4 w-4" /></button>
                </div>
                <textarea value={f.a} onChange={(e) => patchFaq(fi, { a: e.target.value })} rows={3} className="input-base" placeholder={t('instrCourses.faqAnswer')} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'preview' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="card overflow-hidden">
            <div className="aspect-[16/9] w-full bg-brand-900">
              <img src={preview.thumbnail} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Badge color="brand">{(categories.length > 0 ? categories : MOCK_CATEGORIES).find((c) => c.id === draft.categoryId)?.name}</Badge>
                <Badge color="ink">{preview.level}</Badge>
                {preview.hasCertificate && <Badge color="success">{t('cards.certificate')}</Badge>}
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">{preview.title}</h2>
              {preview.subtitle && <p className="text-muted">{preview.subtitle}</p>}
              <div className="flex items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {t('instrCourses.totalLessons', { count: totalLessons })} · {t('instrCourses.totalDuration', { duration: formatDuration(totalMinutes) })}</span>
                <span className="flex items-center gap-1"><ListChecks className="h-4 w-4" /> {draft.objectives.filter(Boolean).length} {t('instrCourses.objectives').toLowerCase()}</span>
              </div>
              <div className="flex items-baseline gap-2 border-t border-line pt-4">
                {preview.price === 0 ? (
                  <span className="text-2xl font-bold text-success">{t('common.free')}</span>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-ink">{formatPrice(preview.price)}</span>
                    {preview.discountPrice && <span className="text-muted line-through">{formatPrice(preview.discountPrice)}</span>}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card h-fit space-y-5 p-6">
            <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.checklist')}</h2>
            <ul className="space-y-2">
              {checklist.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {c.ok ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> : <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-line" />}
                  <span className={c.ok ? 'text-ink' : 'text-muted'}>{c.label}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={publish} disabled={!complete}><Check className="h-4 w-4" /> {t('instrCourses.publish')}</Button>
            {!complete && <p className="text-center text-xs text-muted">{t('instrCourses.publishWarning')}</p>}
          </div>
        </div>
      )}
    </div>
  )
}