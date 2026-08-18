import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../lib/store'
import { cn } from '../lib/utils'
import { EASE } from '../lib/motion'

export function ToastHost() {
  const { toasts, dismissToast } = useApp()
  const { t } = useTranslation()
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: EASE }}
            className={cn('card flex items-start gap-3 p-4 shadow-lift', toast.kind === 'error' && 'border-danger/30')}
            role="status"
          >
            {toast.kind === 'success' && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />}
            {toast.kind === 'error' && <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />}
            {toast.kind === 'info' && <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />}
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{toast.title}</p>
              {toast.message && <p className="mt-0.5 text-xs text-muted">{toast.message}</p>}
            </div>
            <button onClick={() => dismissToast(toast.id)} className="rounded p-0.5 text-muted hover:bg-line/50 hover:text-ink" aria-label={t('common.close')}>
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
