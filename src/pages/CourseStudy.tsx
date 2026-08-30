import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Award, BookOpen, Check, CheckCircle2, ChevronRight, CirclePlay, Clock, FileText,
  Flag, GraduationCap, ListVideo, PlayCircle, Play, Sparkles, Target, Trophy
} from 'lucide-react'
import { useApp } from '../lib/store'
import { getStoredToken, studentApi } from '../lib/api/auth'
import { Badge, Button, ProgressBar, Rating } from '../components/ui'
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

export default function CourseStudy() {
  const { courseId } = useParams()
  const nav = useNavigate()
  const { t } = useTranslation()
  const { currentUser, enrollments, certificates } = useApp()
  const [fullCourse, setFullCourse] = useState<Course | null>(null)
  const course = fullCourse ?? (enrollments.find((e) => e.courseId === courseId)?.course as unknown as Course | undefined) ?? null

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    const token = getStoredToken()
    studentApi.getCourseFull(token, courseId)
      .then(({ course: full }) => {
        if (cancelled || !full) return
        const sections = (full.sections ?? []).map((s) => ({
          id: s.id,
          title: s.title,
          lessons: (s.lessons ?? []).map((l) => ({
            id: l.id, title: l.title, type: l.type as Lesson['type'], duration: l.duration,
            content: l.content, videoUrl: l.videoUrl, resourceUrl: l.resourceUrl
          }))
        }))
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
          sections,
          reviews: [],
          faqs: full.faqs ?? []
        } as unknown as Course)
      })
      .catch(() => { /* fall back to mock/enrollment summary */ })
    return () => { cancelled = true }
  }, [courseId])

  const enrollment = useMemo(
    () => currentUser ? enrollments.find((e) => e.userId === currentUser.id && e.courseId === courseId) : null,
    [enrollments, currentUser, courseId]
  )

  const cert = useMemo(
    () => currentUser ? certificates.find((c) => c.userId === currentUser.id && c.courseId === courseId) : null,
    [certificates, currentUser, courseId]
  )

  const allLessons = useMemo(() => course?.sections?.flatMap((s) => s.lessons ?? []) ?? [], [course])

  if (!course || !currentUser || !enrollment) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-ink">{t('study.notFound')}</h1>
        <Button onClick={() => nav('/my-learning')}>{t('study.backToMyLearning')}</Button>
      </div>
    )
  }

  const completed = enrollment.completedLessons?.length ?? 0
  const total = allLessons.length
  const progress = enrollment.progress ?? 0
  const hoursLearned = Math.round((progress / 100) * (course.duration ?? 0))
  const isComplete = enrollment.status === 'completed' || progress >= 100
  const current = allLessons.find((l) => l.id === enrollment.currentLessonId) ?? allLessons[0]
  const doneCount = allLessons.filter((l) => (enrollment.completedLessons ?? []).includes(l.id)).length

  const stats = [
    { label: t('study.lessonsCompleted'), value: `${doneCount}/${total}`, icon: <ListVideo className="h-4 w-4" /> },
    { label: t('study.hoursLearned'), value: `${hoursLearned}h`, icon: <Clock className="h-4 w-4" /> },
    {
      label: t('study.certificate'),
      value: cert
        ? t('study.earned')
        : isComplete
          ? t('study.eligible')
          : t('study.inProgress'),
      icon: <Trophy className="h-4 w-4" />
    }
  ]

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="relative aspect-video bg-brand-900 md:aspect-auto md:min-h-[180px]">
            <img src={course.thumbnail} alt={course.title} className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute bottom-2 left-2 rounded-full bg-surface/95 px-2 py-0.5 text-xs font-semibold text-ink">{progress}%</span>
          </div>
          <div className="flex flex-col gap-3 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color="brand">{course.level}</Badge>
              {course.hasCertificate && <Badge color="success"><Trophy className="mr-1 h-3 w-3" /> {t('study.certificateCourse')}</Badge>}
            </div>
            <h1 className="font-display text-2xl font-bold text-ink">{course.title}</h1>
            <p className="text-sm text-muted">{course.subtitle}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <Rating value={course.rating} size="xs" count={course.reviewCount} />
              <span>{t('study.students', { count: course.studentCount })}</span>
              <span>{t('study.duration', { duration: formatDuration(course.duration * 60) })}</span>
            </div>
            <div className="mt-auto flex flex-wrap gap-3 pt-2">
              {isComplete ? (
                <Button variant="outline" onClick={() => nav(`/courses/${course.slug}`)}><CheckCircle2 className="h-4 w-4" /> {t('study.completedCourse')}</Button>
              ) : (
                <Button onClick={() => nav(`/learning/${course.id}/${current.id}`)}><Play className="h-4 w-4" /> {doneCount === 0 ? t('study.startLearning') : t('study.continueLearning')}</Button>
              )}
              {course.hasCertificate && !cert && (
                <Button variant="outline" onClick={() => nav('/assessments')}><Award className="h-4 w-4" /> {t('study.takeExam', 'Take Exam (70% Pass Mark)')}</Button>
              )}
              {cert && <Button variant="outline" onClick={() => nav(`/certificates/${cert.id}`)}><Award className="h-4 w-4" /> {t('study.viewCertificate')}</Button>}
            </div>
          </div>
        </div>
        <div className="border-t border-line px-5 py-4 sm:px-6">
          <ProgressBar value={progress} className="bg-line/70" barClassName="bg-brand-500" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <span className="rounded-full bg-brand-50 p-2.5 text-brand-700">{s.icon}</span>
            <div>
              <p className="text-lg font-bold text-ink">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink"><GraduationCap className="h-5 w-5 text-brand-500" /> {t('study.curriculum')}</h2>
          <span className="text-xs text-muted">{total} {t('study.lessonsTotal')}</span>
        </div>
        <div className="space-y-3">
          {course.sections.map((s, si) => {
            const sectionDone = s.lessons.every((l) => enrollment.completedLessons.includes(l.id))
            return (
              <div key={s.id} className="overflow-hidden rounded-card border border-line">
                <div className="flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', sectionDone ? 'bg-success text-white' : 'bg-brand-50 text-brand-700')}>
                      {sectionDone ? '✓' : si + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{s.title}</p>
                      <p className="text-xs text-muted">{s.lessons.length} {t('study.lessonsTotal')} · {formatDuration(s.lessons.reduce((a, l) => a + l.duration, 0))}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                </div>
                <div>
                  {s.lessons.map((l) => {
                    const done = enrollment.completedLessons.includes(l.id)
                    const isCurrent = l.id === current.id
                    return (
                      <button
                        key={l.id}
                        onClick={() => nav(`/learning/${course.id}/${l.id}`)}
                        className={cn('flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-line/30', isCurrent ? 'bg-brand-50' : '')}
                      >
                        <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]', done ? 'border-success bg-success text-white' : isCurrent ? 'border-brand-500 text-brand-500' : 'border-line')}>
                          {done ? '✓' : <LessonIcon type={l.type} />}
                        </span>
                        <span className="flex-1 leading-snug text-ink">{l.title}</span>
                        {isCurrent && <Badge color="brand">{t('study.currentLesson')}</Badge>}
                        <span className="text-[10px] text-muted">{formatDuration(l.duration)}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {course.objectives.length > 0 && (
        <div className="card p-5 sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink"><Target className="h-5 w-5 text-brand-500" /> {t('study.whatYouLearn')}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {course.objectives.map((o) => (
              <p key={o.id} className="flex items-start gap-2 text-sm text-muted"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {o.text}</p>
            ))}
          </div>
        </div>
      )}

      {!isComplete && (
        <div className="card flex flex-col items-center gap-3 border-dashed p-6 text-center sm:flex-row sm:text-left">
          <span className="rounded-full bg-brand-50 p-3 text-brand-700"><Sparkles className="h-5 w-5" /></span>
          <div className="flex-1">
            <p className="font-display font-semibold text-ink">{t('study.finishCta')}</p>
            <p className="text-sm text-muted">{t('study.finishCtaBody', { remaining: total - doneCount })}</p>
          </div>
          <Button variant="outline" onClick={() => nav(`/learning/${course.id}/${current.id}`)}>{t('study.resume')} <ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-line pt-4">
        <Link to="/my-learning" className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">{t('study.backToMyLearning')}</Link>
        <Flag className="h-4 w-4 text-muted" />
      </div>
    </div>
  )
}