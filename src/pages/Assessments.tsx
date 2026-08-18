import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, Clock, FileText, Send } from 'lucide-react'
import { ASSIGNMENTS, ASSESSMENTS, COURSES } from '../lib/data'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal } from '../components/ui'
import { formatDate } from '../lib/utils'

export function Assignments() {
  const { currentUser, submissions, enrollments, submitAssignment, toast } = useApp()
  const { t } = useTranslation()
  const [submitFor, setSubmitFor] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [link, setLink] = useState('')

  const enrolledCourseIds = enrollments.map((e) => e.courseId)
  const mine = useMemo(() => ASSIGNMENTS.filter((a) => enrolledCourseIds.includes(a.courseId)), [enrollments])

  const submittedIds = submissions.filter((s) => s.userId === currentUser!.id).map((s) => s.assignmentId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('asgn.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('asgn.subtitle')}</p>
      </div>

      {mine.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title={t('asgn.emptyTitle')} message={t('asgn.emptyMessage')} action={<Link to="/courses" className="btn-primary">{t('asgn.browseCourses')}</Link>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {mine.map((a) => {
            const course = COURSES.find((c) => c.id === a.courseId)
            const sub = submissions.find((s) => s.assignmentId === a.id && s.userId === currentUser!.id)
            const isSubmitted = submittedIds.includes(a.id)
            const overdue = new Date(a.deadline) < new Date()
            return (
              <div key={a.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-brand-700">{course?.title}</p>
                    <h3 className="mt-1 font-semibold text-ink">{a.title}</h3>
                  </div>
                  {isSubmitted ? <Badge color="success">{t('asgn.submitted')}</Badge> : overdue ? <Badge color="danger">{t('asgn.overdue')}</Badge> : <Badge color="warning">{t('asgn.open')}</Badge>}
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted">{a.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t('asgn.due', { date: formatDate(a.deadline) })}</span>
                  <span>{t('asgn.points', { count: a.points })}</span>
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  {isSubmitted && sub ? (
                    <div className="w-full rounded-card border border-success/30 bg-success/5 p-3">
                      {sub.grade !== undefined ? (
                        <p className="text-sm text-ink">{t('asgn.grade')} <span className="font-bold text-success">{sub.grade}/{a.points}</span></p>
                      ) : (
                        <p className="text-sm text-muted">{t('asgn.submittedOn', { date: formatDate(sub.submittedAt) })}</p>
                      )}
                      {sub.feedback && <p className="mt-1 text-xs text-muted">{t('asgn.feedback', { text: sub.feedback })}</p>}
                    </div>
                  ) : (
                    <Button className="w-full" onClick={() => setSubmitFor(a.id)}><Send className="h-4 w-4" /> {t('asgn.submit')}</Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={submitFor !== null}
        onClose={() => setSubmitFor(null)}
        title={t('asgn.modalTitle')}
        footer={
          <>
            <Button variant="outline" onClick={() => setSubmitFor(null)}>{t('asgn.cancel')}</Button>
            <Button onClick={() => { submitAssignment(submitFor!, text, link || undefined); setSubmitFor(null); setText(''); setLink(''); toast(t('asgn.submittedToast'), t('asgn.submittedToastBody')) }} disabled={!text.trim()}>{t('asgn.submitBtn')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">{t('asgn.modalDesc')}</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={t('asgn.answerPlaceholder')} className="input-base" />
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder={t('asgn.linkPlaceholder')} className="input-base" />
          <div className="rounded-card border border-line bg-paper p-3 text-xs text-muted">
            <p className="mb-1 font-medium text-ink">{t('asgn.resources')}</p>
            <p className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Assignment brief.pdf · Template.docx</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export function Assessments() {
  const { currentUser, enrollments } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const enrolledIds = enrollments.filter((e) => e.userId === currentUser!.id).map((e) => e.courseId)
  const mine = ASSESSMENTS.filter((a) => enrolledIds.includes(a.courseId))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('assess.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('assess.subtitle')}</p>
      </div>
      {mine.length === 0 ? (
        <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title={t('assess.emptyTitle')} message={t('assess.emptyMessage')} action={<Link to="/courses" className="btn-primary">{t('asgn.browseCourses')}</Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((a) => {
            const course = COURSES.find((c) => c.id === a.courseId)
            return (
              <div key={a.id} className="card flex flex-col p-5">
                <Badge color="brand" className="mb-3 w-fit">{course?.level}</Badge>
                <h3 className="font-semibold text-ink">{a.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{a.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t('assess.minutes', { count: a.timeLimit })}</span>
                  <span>{t('assess.questions', { count: a.questions.length })}</span>
                  <span>{t('assess.pass', { score: a.passingScore })}</span>
                </div>
                <Button className="mt-4" onClick={() => nav(`/assessments/${a.id}`)}>{t('assess.start')}</Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function AssessmentPlayer() {
  const { id } = useParams()
  const { toast, enrollments, currentUser } = useApp()
  const { t } = useTranslation()
  const nav = useNavigate()
  const assessment = ASSESSMENTS.find((a) => a.id === id)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [current, setCurrent] = useState(0)
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [remaining, setRemaining] = useState(assessment?.timeLimit ?? 20)
  const course = assessment ? COURSES.find((c) => c.id === assessment.courseId) : null

  const enrolled = assessment && currentUser && enrollments.some((e) => e.userId === currentUser.id && e.courseId === assessment.courseId)

  if (!assessment || !course) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t('assess.notFound')}</h1>
        <Button className="mt-4" onClick={() => nav('/assessments')}>{t('assess.back')}</Button>
      </div>
    )
  }

  const start = () => {
    setStarted(true)
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(interval); submit() }
        return Math.max(0, r - 1)
      })
    }, 60000)
    ;(window as unknown as { __timer: number }).__timer = interval as unknown as number
  }

  const submit = () => {
    let c = 0
    let total = 0
    assessment.questions.forEach((q) => {
      const ans = answers[q.id]
      if (ans === undefined) return
      total++
      if (Array.isArray(q.answer)) {
        if (Array.isArray(ans) && ans.length === q.answer.length && q.answer.every((x) => (ans as string[]).includes(x))) c++
      } else if (Array.isArray(ans) && ans.length === 1 && q.answer === ans[0]) {
        c++
      } else if (!Array.isArray(ans) && String(q.answer).toLowerCase() === String(ans).toLowerCase()) {
        c++
      }
    })
    const pct = Math.round((c / assessment.questions.length) * 100)
    setCorrect(c)
    setScore(pct)
    setDone(true)
    setStarted(false)
  }

  const q = assessment.questions[current]
  const answerValue = answers[q.id]

  const setAnswer = (v: string) => {
    if (q.type === 'multi') {
      const arr = (answers[q.id] as string[] | undefined) ?? []
      setAnswers((a) => ({ ...a, [q.id]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] }))
    } else {
      setAnswers((a) => ({ ...a, [q.id]: v }))
    }
  }

  const retake = () => {
    setAnswers({}); setCurrent(0); setDone(false); setScore(0); setCorrect(0); setRemaining(assessment.timeLimit); start()
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/assessments" className="text-sm text-muted hover:text-brand-700">← {t('assess.back')}</Link>
          <h1 className="mt-1 font-display text-xl font-bold text-ink">{assessment.title}</h1>
          <p className="text-sm text-muted">{course.title}</p>
        </div>
        {started && !done && <Badge color={remaining < 5 ? 'danger' : 'brand'} className="text-sm">{t('assess.minLeft', { count: remaining })}</Badge>}
      </div>

      {done ? (
        <div className="card p-8 text-center">
          <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${score >= assessment.passingScore ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">{score >= assessment.passingScore ? t('assess.passed') : t('assess.keepPracticing')}</h2>
          <p className="mt-2 text-lg text-muted">{t('assess.youScored')} <span className="font-bold text-ink">{score}%</span> {t('assess.scoredOf', { correct, total: assessment.questions.length })}</p>
          <p className="mt-1 text-sm text-muted">{t('assess.passingScore', { score: assessment.passingScore })}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
            <div className={`h-full ${score >= assessment.passingScore ? 'bg-success' : 'bg-danger'}`} style={{ width: `${score}%` }} />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={retake}>{t('assess.retake')}</Button>
            <Button variant="outline" onClick={() => nav(`/courses/${course.slug}`)}>{t('assess.backToCourse')}</Button>
          </div>
        </div>
      ) : !started ? (
        <div className="card p-8 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">{t('assess.beforeYouBegin')}</h2>
          <ul className="mx-auto mt-4 max-w-sm space-y-2 text-left text-sm text-muted">
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-500" /> {t('assess.timeLimit', { count: assessment.timeLimit })}</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-500" /> {t('assess.questions', { count: assessment.questions.length })}</li>
            <li className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-brand-500" /> {t('assess.passingScore', { score: assessment.passingScore })}</li>
            <li className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-brand-500" /> {t('assess.retakes', { count: assessment.retakeLimit })}</li>
          </ul>
          {!enrolled && <p className="mt-4 text-sm text-danger">{t('assess.notEnrolled')}</p>}
          <Button className="mt-6" onClick={start} disabled={!enrolled}>{t('assess.start')}</Button>
        </div>
      ) : (
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between text-sm text-muted">
            <span>{t('assess.questionOf', { current: current + 1, total: assessment.questions.length })}</span>
            <span>{t('assess.progress', { pct: Math.round(((current + 1) / assessment.questions.length) * 100) })}</span>
          </div>
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${((current + 1) / assessment.questions.length) * 100}%` }} />
          </div>
          <h2 className="font-display text-lg font-semibold text-ink">{q.question}</h2>
          {q.type === 'fill' && <p className="mt-2 text-sm text-muted">{t('assess.typeAnswer')}</p>}
          {q.type === 'short' && <p className="mt-2 text-sm text-muted">{t('assess.briefResponse')}</p>}
          <div className="mt-5 space-y-2.5">
            {q.options?.map((opt, i) => {
              const isSelected = Array.isArray(answerValue) ? answerValue.includes(opt) : answerValue === opt
              return (
                <button key={i} onClick={() => setAnswer(opt)} className={`flex w-full items-center justify-between rounded-card border px-4 py-3 text-left text-sm transition-colors ${isSelected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line bg-surface text-ink hover:border-brand-300'}`}>
                  {opt}
                  <span className={`flex h-5 w-5 items-center justify-center rounded-control border text-xs ${isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-line'}`}>{isSelected ? '✓' : String.fromCharCode(65 + i)}</span>
                </button>
              )
            })}
          </div>
          {(q.type === 'short' || q.type === 'fill') && (
            <textarea
              value={typeof answerValue === 'string' ? answerValue : ''}
              onChange={(e) => setAnswer(e.target.value)}
              rows={q.type === 'short' ? 5 : 2}
              placeholder={q.type === 'short' ? t('assess.typeAnswerPlaceholder') : t('assess.yourAnswerPlaceholder')}
              className="input-base mt-5"
            />
          )}
          <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
            <Button variant="outline" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>{t('assess.previous')}</Button>
            {current < assessment.questions.length - 1 ? (
              <Button onClick={() => setCurrent(current + 1)}>{t('assess.nextQuestion')}</Button>
            ) : (
              <Button onClick={() => { if (window.confirm(t('assess.confirmSubmit'))) submit() }}>{t('assess.submitAssessment')}</Button>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {assessment.questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`h-7 w-7 rounded text-xs font-medium ${answers[assessment.questions[i].id] !== undefined ? 'bg-brand-500 text-white' : 'bg-line text-muted'}`}>{i + 1}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}