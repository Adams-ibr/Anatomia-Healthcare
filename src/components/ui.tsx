import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Check, Minus, Plus, Search, Star, X } from 'lucide-react'
import { cn, initials } from '../lib/utils'
import { EASE } from '../lib/motion'

export function Button({ className, variant, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' }) {
  return <button className={cn(variant === 'primary' ? 'btn-primary' : variant === 'outline' ? 'btn-outline' : 'btn-ghost', 'active:scale-[0.98]', className)} {...props} />
}

export function Input({ className, label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div>
      {label && <label className="label-base">{label}</label>}
      <input className={cn('input-base', error && 'border-danger focus:border-danger focus:ring-danger/20', className)} {...props} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

const AVATAR_COLORS = ['bg-brand-500', 'bg-[#1E7B4F]', 'bg-[#B7791F]', 'bg-[#16417F]', 'bg-[#5B6472]', 'bg-[#8AADD9]']

export function Avatar({ name, src, size = 'md', className }: { name?: string; src?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const safeName = name || ''
  const sizes = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl' }
  const color = AVATAR_COLORS[(safeName.length ?? 0) % AVATAR_COLORS.length]
  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-full font-semibold text-white', sizes[size], color, className)}>
      {src ? <img src={src} alt={safeName} className="h-full w-full rounded-full object-cover" /> : initials(safeName)}
    </div>
  )
}

export function Rating({ value, count, className, size = 'sm' }: { value?: number; count?: number; className?: string; size?: 'xs' | 'sm' }) {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Star className={cn('fill-[#B7791F] text-[#B7791F]', size === 'xs' ? 'h-3 w-3' : 'h-4 w-4')} />
      <span className={cn('font-semibold text-ink', size === 'xs' ? 'text-xs' : 'text-sm')}>{safeValue.toFixed(1)}</span>
      {typeof count === 'number' && <span className="text-xs text-muted">({count.toLocaleString()})</span>}
    </div>
  )
}

export function Badge({ children, color = 'line', className }: { children: ReactNode; color?: 'line' | 'brand' | 'success' | 'warning' | 'danger' | 'ink'; className?: string }) {
  const colors = {
    line: 'border-line bg-surface text-muted',
    brand: 'border-brand-200 bg-brand-50 text-brand-700',
    success: 'border-success/30 bg-success/10 text-success',
    warning: 'border-warning/30 bg-warning/10 text-warning',
    danger: 'border-danger/30 bg-danger/10 text-danger',
    ink: 'border-white/10 bg-black/70 text-white'
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', colors[color], className)}>{children}</span>
}

export function ProgressBar({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-line', className)}>
      <motion.div
        className={cn('h-full rounded-full bg-brand-500', barClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.8, ease: EASE }}
      />
    </div>
  )
}

export function StatCard({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: string; icon?: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
        </div>
        {icon && <div className="rounded-card bg-brand-50 p-2.5 text-brand-700">{icon}</div>}
      </div>
    </div>
  )
}

let tabsKey = 0

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  const [uid] = useState(() => `tabs-${tabsKey++}`)
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line scrollbar-none">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
            active === t.id ? 'text-brand-700' : 'text-muted hover:text-ink'
          )}
        >
          {t.label}
          {active === t.id && (
            <motion.span layoutId={uid} className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-500" transition={{ duration: 0.25, ease: EASE }} />
          )}
        </button>
      ))}
    </div>
  )
}

export function Accordion({ title, defaultOpen, children, right }: { title: ReactNode; defaultOpen?: boolean; children: ReactNode; right?: ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-4 w-4 items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'minus' : 'plus'}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.12 }}
              >
                {open ? <Minus className="h-4 w-4 text-muted" /> : <Plus className="h-4 w-4 text-muted" />}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="font-medium text-ink">{title}</span>
        </div>
        {right}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-7">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-lg rounded-card bg-surface shadow-panel"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
              <button onClick={onClose} className="rounded p-1 text-muted hover:bg-line/50 hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function EmptyState({ icon, title, message, action }: { icon?: ReactNode; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface px-6 py-14 text-center">
      {icon && <div className="mb-4 rounded-full bg-brand-50 p-4 text-brand-700">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-card bg-line/70', className)} />
}

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-base pl-9" />
    </div>
  )
}

export function CheckRow({ checked, label, sub }: { checked: boolean; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-control border', checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-line bg-surface text-transparent')}>
        <Check className="h-3 w-3" />
      </span>
      <span className="text-sm text-ink">{label}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  )
}

export function useScrollTop() {
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  const { t } = useTranslation()
  return (
    <nav className="flex items-center gap-2 text-sm text-muted" aria-label={t('common.breadcrumb')}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-line">/</span>}
          {item.href ? <a href={item.href} className="hover:text-brand-700">{item.label}</a> : <span className="font-medium text-ink">{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}
