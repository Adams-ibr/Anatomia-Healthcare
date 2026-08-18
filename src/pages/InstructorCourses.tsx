import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, FilePlus, GripVertical, Plus, Save, Trash2, Video } from 'lucide-react'
import { COURSES } from '../lib/data'
import { useApp } from '../lib/store'
import { Avatar, Badge, Button, Input, ProgressBar, Tabs } from '../components/ui'
import { cn, formatPrice } from '../lib/utils'
import { CATEGORIES } from '../lib/data'

export function InstructorCourses() {
  const { t } = useTranslation()
  const { currentUser, toast } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState('all')
  const myCourses = COURSES.filter((c) => c.instructorId === currentUser?.id).concat(
    COURSES.filter((c) => currentUser && c.instructorId !== currentUser.id).slice(0, 3).map((c) => ({ ...c, status: 'published' as const }))
  )

  const list = myCourses.filter((c) => tab === 'all' || c.status === tab)
  const tabs = [
    { id: 'all', label: `All (${myCourses.length})` },
    { id: 'draft', label: `Drafts (${myCourses.filter((c) => c.status === 'draft').length})` },
    { id: 'pending', label: `Pending review (${myCourses.filter((c) => c.status === 'pending').length})` },
    { id: 'published', label: `Published (${myCourses.filter((c) => c.status === 'published').length})` }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{t('instrCourses.myCourses')}</h1>
          <p className="mt-1 text-sm text-muted">{t('instrCourses.myCoursesDesc')}</p>
        </div>
        <Button onClick={() => nav('/instructor/courses/new')}><Plus className="h-4 w-4" /> {t('instrCourses.newCourse')}</Button>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="grid gap-5 lg:grid-cols-2">
        {list.map((c) => (
          <div key={c.id} className="card flex gap-4 p-4">
            <img src={c.thumbnail} alt="" className="h-24 w-36 shrink-0 rounded-card object-cover" />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="line-clamp-1 font-semibold text-ink">{c.title}</h3>
                  <p className="mt-0.5 text-xs text-muted">{t('instrCourses.studentsSections', { students: c.studentCount.toLocaleString(), sections: c.sections.length, rating: c.rating.toFixed(1) })}</p>
                </div>
                <Badge color={c.status === 'published' ? 'success' : c.status === 'pending' ? 'warning' : c.status === 'draft' ? 'line' : 'ink'}>{c.status}</Badge>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar value={c.status === 'published' ? 100 : 60} className="flex-1" />
                <span className="text-xs text-muted">{c.status === 'published' ? t('instrCourses.live') : '60%'}</span>
              </div>
              <div className="mt-auto flex items-center gap-2 pt-3">
                <Button variant="outline" className="flex-1 py-1.5 text-xs" onClick={() => nav(`/instructor/courses/${c.id}/edit`)}>{t('instrCourses.editCourse')}</Button>
                <Button variant="outline" className="flex-1 py-1.5 text-xs" onClick={() => toast(c.status === 'published' ? t('instrCourses.courseUnpublished') : t('instrCourses.submittedForReview'), c.title, 'info')}>
                  {c.status === 'published' ? t('instrCourses.unpublish') : c.status === 'pending' ? t('instrCourses.withdraw') : t('instrCourses.submitForReview')}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const STEPS = [
  { id: 'info', label: 'instrCourses.courseInfo' },
  { id: 'content', label: 'instrCourses.curriculum' },
  { id: 'assessments', label: 'instrCourses.assessments' },
  { id: 'pricing', label: 'instrCourses.pricing' },
  { id: 'preview', label: 'instrCourses.previewPublish' }
]

function StepBar({ step, setStep }: { step: string; setStep: (s: string) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
      {STEPS.map((s, i) => {
        const idx = STEPS.findIndex((x) => x.id === step)
        const done = i < idx
        const active = s.id === step
        return (
          <button key={s.id} onClick={() => setStep(s.id)} className="flex shrink-0 items-center gap-1.5">
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold', done ? 'bg-success text-white' : active ? 'bg-brand-500 text-white' : 'bg-line text-muted')}>
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn('whitespace-nowrap text-xs font-medium', active ? 'text-ink' : 'text-muted')}>{t(s.label)}</span>
            {i < STEPS.length - 1 && <ChevronDown className="hidden rotate-[-90deg] text-line sm:block" />}
          </button>
        )
      })}
    </div>
  )
}

export function CourseBuilder() {
  const { t } = useTranslation()
  const { toast } = useApp()
  const nav = useNavigate()
  const [step, setStep] = useState('info')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [category, setCategory] = useState('c1')
  const [level, setLevel] = useState('Beginner')
  const [price, setPrice] = useState('49')
  const [sections, setSections] = useState([{ title: 'Section 1', lessons: ['Lesson 1'] }])

  const next = () => {
    const idx = STEPS.findIndex((s) => s.id === step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id)
    else nav('/instructor/courses')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/instructor/courses" className="flex items-center gap-1 text-sm text-muted hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> {t('instrCourses.backToCourses')}</Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">{t('instrCourses.createNewCourse')}</h1>
      </div>

      <div className="card p-5">
        <StepBar step={step} setStep={setStep} />
      </div>

      <div className="card p-6">
        {step === 'info' && (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.courseInformation')}</h2>
            <Input label={t('instrCourses.courseTitle')} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('instrCourses.titlePlaceholder')} />
            <div>
              <label className="label-base">{t('instrCourses.subtitle')}</label>
              <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2} className="input-base" placeholder={t('instrCourses.subtitlePlaceholder')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-base">{t('instrCourses.category')}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">{t('instrCourses.level')}</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-base">
                  {['Beginner', 'Intermediate', 'Advanced'].map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="rounded-card border border-dashed border-line p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Video className="h-6 w-6" /></div>
              <p className="mt-3 text-sm font-medium text-ink">{t('instrCourses.courseThumbnail')}</p>
              <p className="text-xs text-muted">{t('instrCourses.thumbnailBody')}</p>
              <Button variant="outline" className="mt-3" onClick={() => toast(t('instrCourses.thumbnailUploaded'), t('instrCourses.thumbnailUploadedBody'))}>{t('instrCourses.uploadThumbnail')}</Button>
            </div>
            <div>
              <label className="label-base">{t('instrCourses.whatStudentsLearn')}</label>
              <textarea rows={4} className="input-base" defaultValue={'Understand zero trust principles\nDesign network segmentation\nImplement continuous verification'} />
            </div>
          </div>
        )}

        {step === 'content' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.curriculum')}</h2>
              <Button variant="outline" onClick={() => setSections([...sections, { title: `Section ${sections.length + 1}`, lessons: ['Lesson 1'] }])}><Plus className="h-4 w-4" /> {t('instrCourses.addSection')}</Button>
            </div>
            {sections.map((sec, si) => (
              <div key={si} className="rounded-card border border-line bg-paper p-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted" />
                  <input defaultValue={sec.title} className="input-base" />
                  <button onClick={() => setSections(sections.filter((_, i) => i !== si))} className="rounded p-2 text-muted hover:text-danger" aria-label={t('instrCourses.removeSection')}><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-3 space-y-2 pl-7">
                  {sec.lessons.map((_, li) => (
                    <div key={li} className="flex items-center gap-2">
                      <Video className="h-4 w-4 shrink-0 text-brand-500" />
                      <input defaultValue={`Lesson ${li + 1}`} className="input-base py-1.5 text-xs" />
                      <button className="rounded p-1.5 text-muted hover:text-danger" aria-label={t('instrCourses.removeLesson')}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button
                    className="flex items-center gap-1.5 pl-1 text-xs font-medium text-brand-700 hover:underline"
                    onClick={() => setSections(sections.map((s, i) => i === si ? { ...s, lessons: [...s.lessons, `Lesson ${s.lessons.length + 1}`] } : s))}
                  >
                    <Plus className="h-3.5 w-3.5" /> {t('instrCourses.addLesson')}
                  </button>
                </div>
              </div>
            ))}
            <div className="rounded-card border border-line bg-paper p-3 text-xs text-muted">
              {t('instrCourses.dragHint')}
            </div>
          </div>
        )}

        {step === 'assessments' && (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.assessmentsHeading')}</h2>
            {[['Knowledge check quiz', 'Multiple choice · 5 questions'], ['Final exam', 'Mixed types · 15 questions · timed'], ['Capstone assignment', 'Points: 100 · due in 2 weeks']].map(([t2, d]) => (
              <div key={t2} className="flex items-center gap-3 rounded-card border border-line p-4">
                <CheckCircle2 className="h-5 w-5 text-brand-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{t2}</p>
                  <p className="text-xs text-muted">{d}</p>
                </div>
                <button className="text-sm font-medium text-brand-700 hover:underline">{t('instrCourses.edit')}</button>
              </div>
            ))}
            <Button variant="outline"><Plus className="h-4 w-4" /> {t('instrCourses.addAssessment')}</Button>
          </div>
        )}

        {step === 'pricing' && (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.pricingAvailability')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-base">{t('instrCourses.coursePriceUsd')}</label>
                <input value={price} onChange={(e) => setPrice(e.target.value)} className="input-base" type="number" min={0} />
              </div>
              <div>
                <label className="label-base">{t('instrCourses.discountPrice')}</label>
                <input className="input-base" placeholder="29" type="number" />
              </div>
            </div>
            <div className="rounded-card border border-line bg-paper p-4">
              <p className="mb-2 text-sm font-medium text-ink">{t('instrCourses.freeVsPaid')}</p>
              <p className="text-xs text-muted">{t('instrCourses.freeVsPaidBody')}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-line accent-brand-500" /> {t('instrCourses.issueCertificate')}
            </label>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-ink">{t('instrCourses.previewPublishHeading')}</h2>
            <div className="flex items-center gap-4 rounded-card border border-line p-4">
              <img src={undefined} alt="" className="hidden h-16 w-28 rounded-card bg-brand-900 sm:block" />
              <div>
                <p className="font-semibold text-ink">{title || t('instrCourses.yourTitle')}</p>
                <p className="mt-0.5 text-sm text-muted">{subtitle || t('instrCourses.yourSubtitle')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge color="brand">{CATEGORIES.find((c) => c.id === category)?.name}</Badge>
                  <Badge color="line">{level}</Badge>
                  <Badge color="success">{formatPrice(Number(price) || 0)}</Badge>
                </div>
              </div>
            </div>
            <div className="rounded-card border border-line bg-paper p-4 text-xs text-muted">
              <p className="mb-1 font-medium text-ink">{t('instrCourses.checklist')}</p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>{t('instrCourses.checklist1')}</li>
                <li>{t('instrCourses.checklist2')}</li>
                <li>{t('instrCourses.checklist3')}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => { toast(t('instrCourses.draftSaved'), t('instrCourses.draftSavedBody')) }}><Save className="h-4 w-4" /> {t('instrCourses.saveDraft')}</Button>
        <div className="flex gap-2">
          {step !== 'info' && <Button variant="outline" onClick={() => setStep(STEPS[STEPS.findIndex((s) => s.id === step) - 1].id)}>{t('instrCourses.back')}</Button>}
          <Button onClick={next}>{step === 'preview' ? t('instrCourses.submitForReviewBtn') : t('instrCourses.continue')} {step !== 'preview' && <ArrowRight className="h-4 w-4" />}</Button>
        </div>
      </div>
    </div>
  )
}