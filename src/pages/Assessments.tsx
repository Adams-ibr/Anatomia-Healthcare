import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, FileText } from 'lucide-react'
import { Button, EmptyState } from '../components/ui'

export function Assignments() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('asgn.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('asgn.subtitle')}</p>
      </div>
      <EmptyState icon={<FileText className="h-8 w-8" />} title={t('asgn.emptyTitle')} message={t('asgn.emptyMessage')} action={<Link to="/courses" className="btn-primary">{t('asgn.browseCourses')}</Link>} />
    </div>
  )
}

export function Assessments() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{t('assess.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('assess.subtitle')}</p>
      </div>
      <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title={t('assess.emptyTitle')} message={t('assess.emptyMessage')} action={<Link to="/courses" className="btn-primary">{t('asgn.browseCourses')}</Link>} />
    </div>
  )
}

export function AssessmentPlayer() {
  const { t } = useTranslation()
  const nav = useNavigate()
  return (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">{t('assess.notFound')}</h1>
      <Button className="mt-4" onClick={() => nav('/assessments')}>{t('assess.back')}</Button>
    </div>
  )
}