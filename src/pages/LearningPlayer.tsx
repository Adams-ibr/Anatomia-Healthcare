import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Award, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, CirclePlay,
  Download, FileText, ListVideo, MessageSquare, PlayCircle, StickyNote, X
} from 'lucide-react'
import { COURSES } from '../lib/data'
import { useApp } from '../lib/store'
import { getStoredToken, studentApi } from '../lib/api/auth'
import { Badge, Button, ProgressBar, Rating, Tabs } from '../components/ui'
import { cn, formatDuration } from '../lib/utils'
import type { Course, Lesson } from '../lib/types'

function LessonIcon({ type }: { type: Lesson['type'] }) {
  const map: Record<string, React.ReactNode> = {
    video: <CirclePlay className="h-4 w-4" />,
    article: <FileText className="h-4 w-4" />,
    pdf: <FileText className="h-4 w-4" />,
    audio: <PlayCircle className="h-4 w-4" />,
    quiz: <Check className="h-4 w-4" />,
    assignment: <ListVideo className="h-4 w-4" />,
    exam: <Award className="h-4 w-4" />,
    project: <span className="text-xs font-bold">&lt;/&gt;</span>
  }
  return <>{map[type] ?? <FileText className="h-4 w-4" />}</>
}

function VideoPlayer({ url, title, onEnded, autoplayNext }: { url?: string; title: string; onEnded?: () => void; autoplayNext?: boolean }) {
  const [speed, setSpeed] = useState(1)
  if (!url) return null
  return (
    <div className="overflow-hidden rounded-card bg-black">
      <video controls className="aspect-video w-full" poster={undefined} onEnded={onEnded}>
        <source src={url} type="video/mp4" />
      </video>
      <div className="flex items-center gap-1 border-t border-white/10 bg-black px-3 py-2 text-xs text-white/80">
        <button onClick={() => setSpeed(speed === 1 ? 1.5 : speed === 1.5 ? 2 : speed === 2 ? 0.5 : 1)} className="rounded px-2 py-1 hover:bg-white/10">{speed}x</button>
        <span className="ml-auto">{title}</span>
      </div>
    </div>
  )
}

export default function LearningPlayer() {
  const { courseId, lessonId } = useParams()
  const nav = useNavigate()
  const { t } = useTranslation()
  const { currentUser, enrollments, completeLesson, setCurrentLesson, toast } = useApp()
  const mockCourse = COURSES.find((c) => c.id === courseId)
  const [fullCourse, setFullCourse] = useState<Course | null>(null)
  const course = fullCourse ?? mockCourse ?? (enrollments.find((e) => e.courseId === courseId)?.course as unknown as Course | undefined) ?? undefined
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [tab, setTab] = useState('notes')
  const [curriculumOpen, setCurriculumOpen] = useState(false)
  const [completedFlash, setCompletedFlash] = useState(false)
  const [autoplay, setAutoplay] = useState(false)

  useEffect(() => {
    if (!courseId || mockCourse) return
    let cancelled = false
    const token = getStoredToken()
    studentApi.getCourseFull(token, courseId)
      .then(({ course: full }) => {
        if (cancelled || !full) return
        setFullCourse({
          ...full,
          price: full.price ?? 0,
          discountPrice: full.discountPrice,
          rating: full.rating ?? 0,
          reviewCount: full.reviewCount ?? 0,
          studentCount: full.studentCount ?? 0,
          duration: full.duration ?? 0,
          level: full.level as Course['level'],
          language: full.language ?? 'en',
          lastUpdated: full.lastUpdated ?? '',
          hasCertificate: full.hasCertificate ?? false,
          isFeatured: full.isFeatured ?? false,
          isTrending: full.isTrending ?? false,
          isNew: full.isNew ?? false,
          status: full.status ?? 'published',
          objectives: (full.objectives ?? []).map((o) => ({ text: o })),
          requirements: (full.requirements ?? []).map((r) => ({ text: r })),
          sections: (full.sections ?? []).map((s) => ({
            id: s.id,
            title: s.title,
            lessons: (s.lessons ?? []).map((l) => ({
              id: l.id, title: l.title, type: l.type as Lesson['type'], duration: l.duration,
              content: l.content, videoUrl: l.videoUrl, resourceUrl: l.resourceUrl
            }))
          })),
          reviews: [],
          faqs: full.faqs ?? []
        } as unknown as Course)
      })
      .catch(() => { /* fall back to mock/enrollment summary */ })
    return () => { cancelled = true }
  }, [courseId, mockCourse])

  const enrollment = useMemo(
    () => currentUser ? enrollments.find((e) => e.userId === currentUser.id && e.courseId === courseId) : null,
    [enrollments, currentUser, courseId]
  )

  const allLessons = useMemo(() => course?.sections.flatMap((s) => s.lessons) ?? [], [course])
  const lesson = allLessons.find((l) => l.id === lessonId) ?? allLessons[0]
  const idx = allLessons.findIndex((l) => l.id === lesson?.id)
  const prev = allLessons[idx - 1]
  const next = allLessons[idx + 1]

  useEffect(() => {
    if (lesson) setCurrentLesson(courseId!, lesson.id)
  }, [lesson?.id, courseId, setCurrentLesson])

  useEffect(() => {
    if (completedFlash) {
      const t = setTimeout(() => setCompletedFlash(false), 2000)
      return () => clearTimeout(t)
    }
  }, [completedFlash])

  if (!course || !lesson) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('player.lessonNotFound')}</h1>
        <Button className="mt-4" onClick={() => nav('/my-learning')}>{t('player.backToMyLearning')}</Button>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('player.signInToStart')}</h1>
        <Button className="mt-4" onClick={() => nav(`/login?next=/learning/${course.id}/${lesson.id}`)}>{t('player.logIn')}</Button>
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('player.enrollToAccess')}</h1>
        <Button className="mt-4" onClick={() => nav(`/courses/${course.slug}`)}>{t('player.viewCourse')}</Button>
      </div>
    )
  }

  const isDone = enrollment.completedLessons.includes(lesson.id)
  const progress = enrollment.progress
  const discussion = courseId ? COURSES.length : 0

  const markComplete = () => {
    completeLesson(course.id, lesson.id)
    setCompletedFlash(true)
    toast(t('player.lessonCompleted'), next ? t('player.nextUp', { title: next.title }) : t('player.courseComplete'))
    if (next) nav(`/learning/${course.id}/${next.id}`, { replace: true })
  }

  const autoAdvance = () => {
    if (autoplay && next) {
      completeLesson(course.id, lesson.id)
      nav(`/learning/${course.id}/${next.id}`, { replace: true })
    }
  }

  const renderContent = () => {
    if (lesson.type === 'video' || lesson.type === 'audio') {
      return <VideoPlayer url={lesson.videoUrl} title={lesson.title} onEnded={autoAdvance} autoplayNext={autoplay} />
    }    if (lesson.type === 'quiz' || lesson.type === 'exam') {
      return (
        <div className="card flex flex-col items-center p-10 text-center">
          <div className="rounded-full bg-brand-50 p-5 text-brand-700">{lesson.type === 'exam' ? <Award className="h-10 w-10" /> : <Check className="h-10 w-10" />}</div>
          <h2 className="mt-4 font-display text-xl font-semibold text-ink">{lesson.type === 'exam' ? t('player.finalAssessment') : t('player.knowledgeCheck')}</h2>
          <p className="mt-2 max-w-md text-sm text-muted">{lesson.type === 'exam' ? t('player.finalAssessmentDesc') : t('player.knowledgeCheckDesc')}</p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => { const a = COURSES; const assessment = a.find((c) => c.id === courseId); nav(assessment ? `/assessments/as_${course.id}` : '/assessments') }}>{t('player.start', { type: lesson.type })}</Button>
            <Button variant="outline" onClick={markComplete}>{t('player.markAsComplete')}</Button>
          </div>
        </div>
      )
    }
    if (lesson.type === 'assignment') {
      return (
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-ink">{lesson.title}</h2>
          <div className="prose-plain mt-3 text-muted"><p>{lesson.content}</p></div>
          <div className="mt-4 rounded-card border border-line bg-paper p-4 text-sm">
            <p className="mb-2 font-medium text-ink">{t('player.deliverables')}</p>
            <p className="text-muted">{t('player.deliverablesDesc')}</p>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => nav('/assignments')}>{t('player.goToAssignments')}</Button>
            <Button variant="outline" onClick={markComplete}>{t('player.markAsComplete')}</Button>
          </div>
        </div>
      )
    }
    return (
      <div className="card p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-ink">{lesson.title}</h2>
        <div className="prose-plain mt-4 text-muted" dangerouslySetInnerHTML={{ __html: lesson.content }} />
        {lesson.resourceUrl && (
          <div className="mt-6 flex items-center justify-between rounded-card border border-line bg-paper p-4">
            <span className="flex items-center gap-2 text-sm font-medium text-ink"><FileText className="h-4 w-4 text-brand-500" /> {t('player.supportingResource')}</span>
            <Button variant="outline" onClick={() => toast(t('player.downloadStarted'), t('player.resourceDownloaded'), 'info')}><Download className="h-4 w-4" /> {t('player.download')}</Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/my-learning" className="rounded p-1.5 text-muted hover:bg-line/40 hover:text-ink" aria-label={t('player.backToMyLearningAria')}><ChevronLeft className="h-5 w-5" /></Link>
            <div className="hidden sm:block">
              <Link to={`/courses/${course.slug}`} className="text-sm font-semibold text-ink hover:text-brand-700">{course.title}</Link>
              <p className="text-xs text-muted">{course.instructorId === 'u_in_1' ? 'Dr. Amara Okafor' : 'Instructor'} · <Rating value={course.rating} size="xs" /></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden w-40 items-center gap-2 md:flex">
              <ProgressBar value={progress} className="bg-line/70" barClassName="bg-brand-500" />
              <span className="text-xs font-medium text-muted">{progress}%</span>
            </div>
            <button
              onClick={() => setAutoplay(!autoplay)}
              className={cn('hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:flex', autoplay ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-muted hover:text-ink')}
              aria-pressed={autoplay}
            >
              <PlayCircle className="h-3.5 w-3.5" /> {t('player.autoplay')}
            </button>
            <Button variant="outline" className="lg:hidden" onClick={() => setCurriculumOpen(!curriculumOpen)}>
              <ListVideo className="h-4 w-4" /> {t('player.curriculum')}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        <aside className={cn(
          'fixed inset-y-0 left-0 z-40 w-80 overflow-y-auto border-r border-line bg-surface transition-transform lg:sticky lg:top-0 lg:z-0 lg:translate-x-0 lg:h-screen',
          curriculumOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">{t('player.courseContent')}</p>
            <button className="rounded p-1 text-muted hover:text-ink lg:hidden" onClick={() => setCurriculumOpen(false)} aria-label={t('player.closeCurriculum')}><X className="h-5 w-5" /></button>
          </div>
          <div className="py-2">
            {course.sections.map((s, si) => (
              <div key={s.id} className="mb-1">
                <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  <span>{t('player.section', { count: si + 1, title: s.title })}</span>
                </div>
                {s.lessons.map((l) => {
                  const done = enrollment.completedLessons.includes(l.id)
                  const active = l.id === lesson.id
                  return (
                    <button
                      key={l.id}
                      onClick={() => { setCurriculumOpen(false); nav(`/learning/${course.id}/${l.id}`) }}
                      className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors', active ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-line/30 hover:text-ink')}
                    >
                      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]', done ? 'border-success bg-success text-white' : active ? 'border-brand-500 text-brand-500' : 'border-line')}>
                        {done ? '✓' : si * 10 + s.lessons.indexOf(l) + 1}
                      </span>
                      <LessonIcon type={l.type} />
                      <span className="flex-1 leading-snug">{l.title}</span>
                      <span className="text-[10px] text-muted">{formatDuration(l.duration)}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </aside>

        {curriculumOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setCurriculumOpen(false)} />}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {course.title}</span>
            <span>/</span>
            <span className="font-medium text-ink">{lesson.title}</span>
          </div>

          <div className="max-w-4xl">
            {renderContent()}

            {autoplay && next && (
              <div className="mt-3 flex items-center gap-2 rounded-card border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700">
                <PlayCircle className="h-3.5 w-3.5" />
                <span>{t('player.autoplayNextUp')}</span>
                <span className="font-semibold">{next.title}</span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={() => prev ? nav(`/learning/${course.id}/${prev.id}`) : toast(t('player.atStart'), t('player.firstLesson'))} disabled={!prev}>
                <ChevronLeft className="h-4 w-4" /> {t('player.previous')}
              </Button>
              <Button onClick={markComplete} variant={isDone ? 'outline' : 'primary'} disabled={isDone}>
                <Check className="h-4 w-4" /> {isDone ? t('player.completed') : t('player.markAsComplete')}
              </Button>
              <Button variant="outline" onClick={() => next ? nav(`/learning/${course.id}/${next.id}`) : toast(t('player.courseComplete'), t('player.greatWork'))} disabled={!next}>
                {t('player.next')} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {completedFlash && (
              <div className="fixed inset-x-0 top-16 z-40 mx-auto w-fit rounded-full bg-success px-6 py-2.5 text-sm font-semibold text-white shadow-panel">{t('player.lessonCompletedFlash')}</div>
            )}

            <div className="mt-10">
              <Tabs tabs={[{ id: 'notes', label: t('player.myNotes') }, { id: 'resources', label: t('player.resources') }, { id: 'discussion', label: t('player.discussion') }]} active={tab} onChange={setTab} />
              {tab === 'notes' && (
                <div className="py-4">
                  <div className="flex items-center gap-2 text-sm text-muted"><StickyNote className="h-4 w-4 text-brand-500" /> {t('player.privateNotes')}</div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    placeholder={t('player.notesPlaceholder')}
                    className="input-base mt-3"
                  />
                  <p className="mt-1 text-xs text-muted">{t('player.notesSaved')}</p>
                </div>
              )}
              {tab === 'resources' && (
                <div className="space-y-2 py-4">
                  {[['Lecture slides.pdf', 'PDF'], ['Worksheet.docx', 'Worksheet'], ['Example code.zip', 'Code']].map(([name, type]) => (
                    <button key={name} onClick={() => toast(t('player.downloadStarted'), `${name} (demo)`, 'info')} className="flex w-full items-center justify-between rounded-card border border-line p-3.5 text-left hover:border-brand-300">
                      <span className="flex items-center gap-2.5 text-sm text-ink"><Download className="h-4 w-4 text-brand-500" /> {name}</span>
                      <Badge color="line">{type}</Badge>
                    </button>
                  ))}
                </div>
              )}
              {tab === 'discussion' && (
                <div className="py-4">
                  <div className="rounded-card border border-line bg-surface p-4">
                    <p className="text-sm font-medium text-ink">{t('player.askAboutLesson')}</p>
                    <div className="mt-3 flex gap-2">
                      <input placeholder={t('player.typeQuestion')} className="input-base flex-1" />
                      <Button onClick={() => toast(t('player.questionPosted'), t('player.questionPostedBody'))}>{t('player.post')}</Button>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted">{t('player.noQuestionsYet')}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}