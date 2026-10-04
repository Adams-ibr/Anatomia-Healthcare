import { clsx, type ClassValue } from 'clsx'
import type { Role } from './types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function homePath(role: Role): string {
  return role === 'admin' ? '/admin' : role === 'instructor' ? '/instructor' : '/dashboard'
}

export function formatPrice(price?: number) {
  if (price === undefined || price === null || price === 0 || isNaN(price)) return 'Free'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(price)
}

export function formatDuration(minutes?: number) {
  const safeMinutes = typeof minutes === 'number' && !isNaN(minutes) ? minutes : 0
  if (safeMinutes < 60) return `${safeMinutes} min`
  const h = Math.floor(safeMinutes / 60)
  const m = safeMinutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function timeAgo(date?: string) {
  if (!date) return ''
  const parsed = new Date(date).getTime()
  if (isNaN(parsed)) return ''
  const seconds = Math.floor((Date.now() - parsed) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function formatDate(date?: string) {
  if (!date) return ''
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function slugify(s: string) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function initials(name?: string) {
  if (!name) return ''
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function discountPercent(price: number, discount?: number) {
  if (!discount || discount >= price) return 0
  return Math.round(((price - discount) / price) * 100)
}

export function printCertificate(opts: {
  title: string
  studentName: string
  verificationCode: string
  completionDate: string
  certId: string
}) {
  const { title, studentName, verificationCode, completionDate, certId } = opts
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const date = new Date(completionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  w.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Certificate — ${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #e8e6e0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: Georgia, 'Times New Roman', serif; padding: 24px; }
  .cert { position: relative; width: 100%; max-width: 820px; background: #FBF9F3; border: 2px solid #1B4E9B; padding: 56px 48px; text-align: center; overflow: hidden; }
  .cert::before { content: ''; position: absolute; inset: 10px; border: 1px solid #1B4E9B; opacity: .6; pointer-events: none; }
  img.logo { height: 52px; width: auto; }
  .kicker { margin-top: 40px; font-size: 12px; letter-spacing: .3em; text-transform: uppercase; color: #555; }
  .line { margin: 24px auto; width: 90px; height: 2px; background: #1B4E9B; }
  .name { margin-top: 16px; font-size: 34px; font-weight: 700; color: #111; }
  .body { margin-top: 24px; font-size: 15px; color: #555; }
  .course { margin-top: 10px; font-size: 26px; font-weight: 700; color: #1B4E9B; }
  .meta { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #555; }
  .meta b { display: block; margin-bottom: 4px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #111; }
  @media print { body { background: #fff; padding: 0; } .cert { max-width: 100%; } }
</style>
</head>
<body>
  <div class="cert">
    <div><img class="logo" src="${origin}/logo.png" alt="Anatomia" /></div>
    <div class="kicker">Certificate of Completion</div>
    <div class="line"></div>
    <div class="name">${studentName}</div>
    <div class="body">has successfully completed the course</div>
    <div class="course">${title}</div>
    <div class="meta">
      <div><b>Certificate ID</b>${certId}</div>
      <div><b>Completion Date</b>${date}</div>
      <div><b>Verification Code</b>${verificationCode}</div>
    </div>
  </div>
  <script>window.onload = function () { window.focus(); setTimeout(function () { window.print(); }, 300); }<\/script>
</body>
</html>`)
  w.document.close()
}
