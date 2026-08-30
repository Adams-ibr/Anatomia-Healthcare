import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle, Award, BookOpen, CheckCircle2, ChevronLeft, ChevronRight,
  Clock, FileText, Loader2, RotateCcw, Trophy, XCircle
} from 'lucide-react'
import { getStoredToken, studentApi } from '../lib/api/auth'
import type { StudentAssessment, StudentAssessmentFull, AssessmentResult } from '../lib/api/auth'
import { Badge, Button, EmptyState, ProgressBar } from '../components/ui'
import { cn, formatDuration } from '../lib/utils'

// ---------------------------------------------------------------------------
// Assignments — still a placeholder (backend work needed separately)
// ---------------------------------------------------------------------------
export function Assignments() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('asgn.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('asgn.subtitle')}</p>
      </div>
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title={t('asgn.emptyTitle')}
        message={t('asgn.emptyMessage')}
        action={<Link to="/courses" className="btn-primary">{t('asgn.browseCourses')}</Link>}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assessments list
// ---------------------------------------------------------------------------
export function Assessments() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [assessments, setAssessments] = useState<StudentAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) { setLoading(false); return }
    studentApi.listAssessments(token)
      .then((res) => setAssessments(res.assessments))
      .catch((err) => setError(err?.message ?? 'Failed to load assessments.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('assess.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('assess.subtitle')}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {!error && assessments.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 className="h-8 w-8" />}
          title={t('assess.emptyTitle')}
          message={t('assess.emptyMessage')}
          action={<Link to="/courses" className="btn-primary">{t('asgn.browseCourses')}</Link>}
        />
      )}

      {assessments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((a) => {
            const canRetake = a.attemptCount < a.retakeLimit
            const attemptsLeft = a.retakeLimit - a.attemptCount

            return (
              <div key={a.id} className="card flex flex-col gap-4 p-5">
                {/* Course badge */}
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-50">
                    <BookOpen className="h-4 w-4 text-brand-700" />
                  </div>
                  <p className="truncate text-xs font-medium text-muted">{a.courseTitle}</p>
                </div>

                {/* Title + status */}
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-ink">{a.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      {t('assess.minutes', { count: a.timeLimit })}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t('assess.pass', { score: a.passingScore })}
                    </span>
                  </div>
                </div>

                {/* Best score */}
                {a.attemptCount > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{t('assess.youScored')}</span>
                      <span className={cn('font-semibold', a.passed ? 'text-success' : 'text-danger')}>
                        {a.bestScore}%
                      </span>
                    </div>
                    <ProgressBar
                      value={a.bestScore ?? 0}
                      className="bg-line"
                      barClassName={a.passed ? 'bg-success' : 'bg-danger'}
                    />
                    <div className="flex items-center gap-1.5">
                      {a.passed
                        ? <><Trophy className="h-3.5 w-3.5 text-success" /><span className="text-xs text-success">{t('assess.passed')}</span></>
                        : <><XCircle className="h-3.5 w-3.5 text-danger" /><span className="text-xs text-danger">{t('assess.keepPracticing')}</span></>
                      }
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-line pt-3">
                  {a.passed ? (
                    <>
                      <Badge color="success"><Trophy className="h-3 w-3" /> {t('assess.passed')}</Badge>
                      {canRetake && (
                        <Button variant="outline" className="ml-auto text-xs" onClick={() => nav(`/assessments/${a.id}`)}>
                          <RotateCcw className="h-3.5 w-3.5" /> {t('assess.retake')}
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {canRetake
                        ? (
                          <Button className="w-full" onClick={() => nav(`/assessments/${a.id}`)}>
                            {a.attemptCount === 0 ? t('assess.start') : t('assess.retake')}
                          </Button>
                        )
                        : <Badge color="line">{t('assess.retakes', { count: 0 })} left</Badge>
                      }
                    </>
                  )}
                  {canRetake && a.attemptCount > 0 && !a.passed && (
                    <span className="ml-auto text-xs text-muted">{attemptsLeft} left</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assessment Player
// ---------------------------------------------------------------------------
type Phase = 'briefing' | 'playing' | 'result'

export function AssessmentPlayer() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { t } = useTranslation()

  const [assessment, setAssessment] = useState<StudentAssessmentFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [phase, setPhase] = useState<Phase>('briefing')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AssessmentResult | null>(null)

  // Timer
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  // Auto-submit when time runs out
  const handleSubmit = useCallback(async (currentAnswers: Record<string, string | string[]>) => {
    const token = getStoredToken()
    if (!id || !token) return
    stopTimer()
    setSubmitting(true)
    try {
      const res = await studentApi.submitAssessment(token, id, currentAnswers)
      setResult(res.result)
      setPhase('result')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit.')
    } finally {
      setSubmitting(false)
    }
  }, [id, stopTimer])

  useEffect(() => {
    if (phase === 'playing' && assessment && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            handleSubmit(answers)
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return stopTimer
  }, [phase, assessment, stopTimer]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const token = getStoredToken()
    if (!id || !token) { setLoading(false); return }
    studentApi.getAssessment(token, id)
      .then((res) => { setAssessment(res.assessment); setSecondsLeft(res.assessment.timeLimit * 60) })
      .catch((err) => setError(err?.message ?? 'Assessment not found.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-sm text-danger">{error ?? t('assess.notFound')}</p>
        <Button variant="outline" onClick={() => nav('/assessments')}>
          <ChevronLeft className="h-4 w-4" /> {t('assess.back')}
        </Button>
      </div>
    )
  }

  const questions = assessment.questions
  const totalQ = questions.length

  // ── BRIEFING SCREEN ──────────────────────────────────────────────────────
  if (phase === 'briefing') {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-8">
        <button
          onClick={() => nav('/assessments')}
          className="flex items-center gap-1 text-sm text-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" /> {t('assess.back')}
        </button>

        <div className="card p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Award className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">{assessment.title}</h1>
          <p className="mt-1 text-sm text-muted">{assessment.courseTitle}</p>
          {assessment.description && (
            <p className="mt-3 text-sm text-muted">{assessment.description}</p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-ink">{totalQ}</p>
              <p className="text-xs text-muted">{t('assess.questions', { count: totalQ })}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-ink">{t('assess.minutes', { count: assessment.timeLimit })}</p>
              <p className="text-xs text-muted">{t('assess.beforeYouBegin')}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-ink">{assessment.passingScore}%</p>
              <p className="text-xs text-muted">{t('assess.pass', { score: assessment.passingScore })}</p>
            </div>
          </div>

          <ul className="mt-5 space-y-1.5 text-left text-sm text-muted">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-brand-500" />
              {t('assess.timeLimit', { count: assessment.timeLimit })}
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 shrink-0 text-brand-500" />
              {t('assess.retakes', { count: assessment.retakeLimit })}
            </li>
          </ul>

          {assessment.attemptCount >= assessment.retakeLimit ? (
            <div className="mt-6 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              You have used all {assessment.retakeLimit} attempt(s).
            </div>
          ) : (
            <Button
              className="mt-6 w-full py-2.5"
              onClick={() => { setCurrent(0); setAnswers({}); setPhase('playing') }}
            >
              {assessment.attemptCount === 0 ? t('assess.start') : t('assess.retake')}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ── RESULT SCREEN ────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const pct = result.score
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <div className="card p-8 text-center">
          <div className={cn(
            'mx-auto flex h-20 w-20 items-center justify-center rounded-full',
            result.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          )}>
            {result.passed
              ? <Trophy className="h-10 w-10" />
              : <XCircle className="h-10 w-10" />
            }
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-ink">
            {result.passed ? t('assess.passed') : t('assess.keepPracticing')}
          </h1>
          <p className="mt-1 text-4xl font-bold text-ink">{pct}%</p>
          <p className="mt-1 text-sm text-muted">
            {t('assess.scoredOf', { correct: result.correct, total: result.total })}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t('assess.passingScore', { score: result.passingScore })}
          </p>

          <ProgressBar
            value={pct}
            className="mt-5 bg-line"
            barClassName={result.passed ? 'bg-success' : 'bg-danger'}
          />

          {result.passed && (result.certificateIssued || result.certificateId) && (
            <div className="mt-6 rounded-card border border-success/30 bg-success/5 p-5 text-center">
              <div className="flex items-center justify-center gap-2 font-semibold text-success">
                <Award className="h-6 w-6" />
                <span className="text-base">{t('assess.certificateEarned', 'Certificate Earned!')}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {t('assess.certificateEarnedDesc', 'Congratulations! You passed the 70% cutoff requirement and earned your official certificate.')}
              </p>
              {result.certificateId && (
                <Button className="mt-3" onClick={() => nav(`/certificates/${result.certificateId}`)}>
                  <Award className="h-4 w-4" /> {t('assess.viewCertificate', 'View Certificate')}
                </Button>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!result.passed && assessment.attemptCount < assessment.retakeLimit && (
              <Button onClick={() => { setCurrent(0); setAnswers({}); setResult(null); setSecondsLeft(assessment.timeLimit * 60); setPhase('briefing') }}>
                <RotateCcw className="h-4 w-4" /> {t('assess.retake')}
              </Button>
            )}
            <Button variant="outline" onClick={() => nav(`/courses/${assessment.courseSlug}`)}>
              <BookOpen className="h-4 w-4" /> {t('assess.backToCourse')}
            </Button>
            <Button variant="outline" onClick={() => nav('/assessments')}>
              {t('assess.back')}
            </Button>
          </div>
        </div>

        {/* Answer review */}
        <div className="card divide-y divide-line">
          <h2 className="px-6 py-4 font-semibold text-ink">Answer review</h2>
          {questions.map((q, qi) => {
            const graded = result.gradedAnswers[q.id]
            if (!graded) return null
            const isEssay = q.type === 'essay'
            return (
              <div key={q.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <span className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                    isEssay ? 'bg-line text-muted' : graded.isCorrect ? 'bg-success text-white' : 'bg-danger text-white'
                  )}>
                    {isEssay ? '?' : graded.isCorrect ? '✓' : '✗'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{qi + 1}. {q.question}</p>
                    <p className="mt-1 text-xs text-muted">
                      Your answer: <span className="font-medium text-ink">
                        {Array.isArray(graded.given) ? graded.given.join(', ') : graded.given || '—'}
                      </span>
                    </p>
                    {!graded.isCorrect && !isEssay && graded.correct && (
                      <p className="mt-0.5 text-xs text-muted">
                        Correct answer: <span className="font-medium text-success">
                          {Array.isArray(graded.correct) ? graded.correct.join(', ') : graded.correct}
                        </span>
                      </p>
                    )}
                    {graded.explanation && (
                      <p className="mt-1 text-xs text-muted italic">{graded.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── PLAYING SCREEN ───────────────────────────────────────────────────────
  const q = questions[current]
  const progressPct = Math.round(((current + 1) / totalQ) * 100)
  const minutesLeft = Math.floor(secondsLeft / 60)
  const secsLeft = secondsLeft % 60
  const timeWarning = secondsLeft <= 60

  const setAnswer = (val: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }))
  }

  const toggleMulti = (option: string) => {
    const current = (answers[q.id] as string[] | undefined) ?? []
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option]
    setAnswer(next)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted">{assessment.title}</p>
          <p className="text-sm font-semibold text-ink">
            {t('assess.questionOf', { current: current + 1, total: totalQ })}
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold tabular-nums',
          timeWarning
            ? 'border-danger/40 bg-danger/5 text-danger'
            : 'border-line bg-surface text-ink'
        )}>
          <Clock className="h-4 w-4" />
          {minutesLeft}:{String(secsLeft).padStart(2, '0')}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <ProgressBar value={progressPct} className="bg-line" barClassName="bg-brand-500" />
        <p className="text-right text-xs text-muted">{t('assess.progress', { pct: progressPct })}</p>
      </div>

      {/* Question card */}
      <div className="card p-6">
        <p className="font-medium text-ink">{q.question}</p>

        <div className="mt-5 space-y-2.5">
          {/* Multiple choice */}
          {(q.type === 'mc' || q.type === 'truefalse') && q.options.map((opt, oi) => {
            const selected = answers[q.id] === String(oi)
            return (
              <button
                key={oi}
                onClick={() => setAnswer(String(oi))}
                className={cn(
                  'flex w-full items-center gap-3 rounded-control border px-4 py-3 text-left text-sm transition-colors',
                  selected
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-line hover:border-brand-300 hover:bg-brand-50/40'
                )}
              >
                <span className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                  selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-line'
                )}>
                  {selected ? '✓' : String.fromCharCode(65 + oi)}
                </span>
                {opt}
              </button>
            )
          })}

          {/* Multi-select */}
          {q.type === 'multi' && q.options.map((opt, oi) => {
            const sel = ((answers[q.id] as string[] | undefined) ?? []).includes(String(oi))
            return (
              <button
                key={oi}
                onClick={() => toggleMulti(String(oi))}
                className={cn(
                  'flex w-full items-center gap-3 rounded-control border px-4 py-3 text-left text-sm transition-colors',
                  sel
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-line hover:border-brand-300 hover:bg-brand-50/40'
                )}
              >
                <span className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-control border text-xs',
                  sel ? 'border-brand-500 bg-brand-500 text-white' : 'border-line'
                )}>
                  {sel ? '✓' : ''}
                </span>
                {opt}
              </button>
            )
          })}

          {/* Short / Fill / Essay */}
          {(q.type === 'short' || q.type === 'fill' || q.type === 'essay') && (
            <>
              <p className="text-xs text-muted">
                {q.type === 'essay' ? t('assess.briefResponse') : t('assess.typeAnswer')}
              </p>
              {q.type === 'essay'
                ? (
                  <textarea
                    rows={5}
                    value={(answers[q.id] as string) ?? ''}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={t('assess.yourAnswerPlaceholder')}
                    className="input-base resize-none"
                  />
                )
                : (
                  <input
                    type="text"
                    value={(answers[q.id] as string) ?? ''}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={t('assess.typeAnswerPlaceholder')}
                    className="input-base"
                  />
                )
              }
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> {t('assess.previous')}
        </Button>

        {current < totalQ - 1 ? (
          <Button onClick={() => setCurrent((c) => c + 1)}>
            {t('assess.nextQuestion')} <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            disabled={submitting}
            onClick={() => {
              if (window.confirm(t('assess.confirmSubmit'))) {
                handleSubmit(answers)
              }
            }}
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              : <><CheckCircle2 className="h-4 w-4" /> {t('assess.submitAssessment')}</>
            }
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {questions.map((_, qi) => (
          <button
            key={qi}
            onClick={() => setCurrent(qi)}
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-colors',
              qi === current
                ? 'bg-brand-500 scale-125'
                : answers[questions[qi].id] !== undefined
                  ? 'bg-brand-200'
                  : 'bg-line'
            )}
            aria-label={`Question ${qi + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
