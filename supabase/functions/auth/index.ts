import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const FRONTEND_URL = (Deno.env.get('FRONTEND_URL') ?? 'https://www.hamaacademy.com').replace(/\/+$/, '')
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''
const PAYSTACK_PUBLIC_KEY = Deno.env.get('PAYSTACK_PUBLIC_KEY') ?? ''
const PAYSTACK_API = 'https://api.paystack.co'

const SMTP_HOST = Deno.env.get('SMTP_HOST') ?? 'smtp.zoho.com'
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') ?? 465)
const SMTP_USER = Deno.env.get('SMTP_USER') ?? 'info@hamaacademy.com'
const SMTP_PASS = Deno.env.get('SMTP_PASS') ?? ''
const SMTP_SENDER_NAME = Deno.env.get('SMTP_SENDER_NAME') ?? 'Hama Academy'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// ---------------------------------------------------------------------------
// Fix: Migrate old accounts — set email_confirmed = true for existing profiles
// since these are accounts that were already verified before the GoTrue removal.
// Without this, all existing profiles default to email_confirmed=false (per schema),
// causing verified users to be repeatedly prompted to confirm email.
;(async () => {
  const { error } = await supabase
    .from('profiles')
    .update({ email_confirmed: true })
    .eq('email_confirmed', false)
  if (error) console.error('Failed to migrate email_confirmed:', error.message)
})()

// ---------------------------------------------------------------------------
// CORS / helpers
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400'
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function errorResponse(status: number, message: string): Response {
  return json({ error: message }, status)
}

// ---------------------------------------------------------------------------
// Custom auth (no GoTrue): password hashing, session & email tokens
// ---------------------------------------------------------------------------

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

function toB64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function randomHex(bytes = 32): string {
  const arr = crypto.getRandomValues(new Uint8Array(bytes))
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password: string): Promise<string> {
  const iterations = 100_000
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
  return `pbkdf2$${iterations}$${toB64(salt)}$${toB64(new Uint8Array(bits))}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false
  const [scheme, iterStr, saltB64, hashB64] = stored.split('$')
  if (scheme !== 'pbkdf2' || !iterStr || !saltB64 || !hashB64) return false
  const iterations = parseInt(iterStr, 10)
  const salt = fromB64(saltB64)
  const expected = fromB64(hashB64)
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, expected.byteLength * 8)
  const actual = new Uint8Array(bits)
  if (actual.byteLength !== expected.byteLength) return false
  let diff = 0
  for (let i = 0; i < actual.byteLength; i++) diff |= actual[i] ^ expected[i]
  return diff === 0
}

async function createSession(req: Request, userId: string): Promise<string> {
  const token = randomHex(32)
  const tokenHash = await sha256Hex(token)
  const ua = (req.headers.get('user-agent') ?? '').slice(0, 300)
  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('cf-connecting-ip') ?? '').trim().slice(0, 64)
  await supabase.from('user_sessions').insert({
    user_id: userId,
    token_hash: tokenHash,
    user_agent: ua,
    ip,
    expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString()
  })
  return token
}

async function currentSessionHash(req: Request): Promise<string | null> {
  const token = bearerToken(req)
  if (!token) return null
  return sha256Hex(token)
}

async function findProfileByEmail(email: string): Promise<ProfileRow | null> {
  const { data } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle()
  return (data as ProfileRow | null) ?? null
}

// ---------------------------------------------------------------------------
// Email delivery via SMTP (Zoho)
// ---------------------------------------------------------------------------

interface SmtpResult {
  code: number
  text: string
}

/** Minimal SMTP client for sending one message over implicit-TLS (465). */
async function smtpSend(to: string, subject: string, html: string): Promise<void> {
  if (!SMTP_PASS) throw new Error('SMTP_PASS is not configured')

  const conn = await Deno.connectTls({ hostname: SMTP_HOST, port: SMTP_PORT })
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let buffer = new Uint8Array(0)
  const readLine = async (): Promise<SmtpResult> => {
    while (true) {
      const idx = buffer.indexOf(0x0a)
      if (idx !== -1) {
        const line = decoder.decode(buffer.slice(0, idx + 1)).replace(/\r?\n$/, '')
        buffer = buffer.slice(idx + 1)
        return { code: parseInt(line.slice(0, 3), 10), text: line }
      }
      const chunk = new Uint8Array(1024)
      const n = await conn.read(chunk)
      if (n === null) throw new Error('SMTP connection closed unexpectedly')
      const next = new Uint8Array(buffer.length + n)
      next.set(buffer)
      next.set(chunk.subarray(0, n), buffer.length)
      buffer = next
    }
  }

  const readReply = async (): Promise<SmtpResult> => {
    let last: SmtpResult | null = null
    while (true) {
      const line = await readLine()
      last = line
      // "250-" is a continuation line; the response ends when the 4th char is a space.
      if (line.text.length < 4 || line.text[3] !== '-') break
    }
    return last!
  }

  const cmd = async (line: string): Promise<SmtpResult> => {
    await conn.write(encoder.encode(line + '\r\n'))
    return readReply()
  }

  const greet = await readReply()
  if (greet.code >= 400) throw new Error('SMTP greeting failed: ' + greet.text)

  const ehlo = await cmd('EHLO hamaacademy.com')
  if (ehlo.code >= 400) throw new Error('EHLO failed: ' + ehlo.text)

  const auth = await cmd(`AUTH LOGIN ${btoa(SMTP_USER)}`)
  if (auth.code !== 334) throw new Error('AUTH LOGIN failed: ' + auth.text)
  const authPass = await cmd(btoa(SMTP_PASS))
  if (authPass.code !== 235) throw new Error('AUTH failed: ' + authPass.text)

  const from = await cmd(`MAIL FROM:<${SMTP_USER}>`)
  if (from.code >= 400) throw new Error('MAIL FROM failed: ' + from.text)

  const rcpt = await cmd(`RCPT TO:<${to}>`)
  if (rcpt.code >= 400) throw new Error('RCPT TO failed: ' + rcpt.text)

  const data = await cmd('DATA')
  if (data.code !== 354) throw new Error('DATA failed: ' + data.text)

  const fromAddr = `${SMTP_SENDER_NAME.replace(/[<>]/g, '')} <${SMTP_USER}>`
  const message = [
    `From: ${fromAddr}`,
    `To: <${to}>`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    html
  ].join('\r\n')

  await conn.write(encoder.encode(message.replace(/\r?\n/g, '\r\n') + '\r\n.\r\n'))
  const end = await readLine()
  if (end.code >= 400) throw new Error('Message rejected: ' + end.text)

  try { await cmd('QUIT') } catch { /* ignore */ }
  conn.close()
}

function emailShell(
  heading: string,
  bodyHtml: string,
  buttonLabel: string,
  buttonUrl: string,
  noteHtml: string
): string {
  return `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:0;background:#f4f6f9">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 0">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;border:1px solid #e4e8ef">
<tr><td style="background:#1B4E9B;padding:24px 32px">
<span style="color:#ffffff;font-size:22px;font-weight:bold">HamaAcademy</span>
</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:20px;color:#111827">${heading}</h1>
<p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6">${bodyHtml}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="border-radius:8px;background:#1B4E9B">
<a href="${buttonUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none">${buttonLabel}</a>
</td></tr></table>
<p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6">${noteHtml}</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;color:#7a8699;font-size:12px;line-height:1.6">
&copy; 2026 HamaAcademy &middot; Learn skills that take you further<br/>
<a href="https://www.hamaacademy.com" style="color:#1B4E9B;text-decoration:none">Visit our website</a>
</td></tr>
</table>
</td></tr></table></body></html>`
}

type EmailKind = 'signup' | 'recovery'

function buildEmail(kind: EmailKind, link: string): { subject: string; html: string } {
  if (kind === 'signup') {
    return {
      subject: 'Confirm your email to activate your Hama Academy account',
      html: emailShell(
        'Welcome to Hama Academy! &#128075;',
        'Thanks for signing up. Please confirm your email address to activate your account and start learning.',
        'Confirm email address',
        link,
        'This link expires in 30 minutes. If you didn\'t create a Hama Academy account, you can safely ignore this email.'
      )
    }
  }
  return {
    subject: 'Reset your Hama Academy password',
    html: emailShell(
      'Reset your password',
      'We received a request to reset the password for your Hama Academy account. Click below to choose a new one.',
      'Reset password',
      link,
      'This link expires in 30 minutes. If you didn\'t request this, you can safely ignore this email.'
    )
  }
}

/** Generate a signup/recovery link using our own token store, then deliver it via SMTP. */
async function generateAndEmailLink(kind: EmailKind, email: string, extra: Record<string, unknown> = {}): Promise<void> {
  const rawToken = randomHex(32)
  const tokenHash = await sha256Hex(rawToken)
  const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS).toISOString()

  const patch: Record<string, unknown> = {}
  if (kind === 'signup') {
    patch.confirmation_token_hash = tokenHash
    patch.confirmation_token_expires_at = expiresAt
  } else {
    patch.reset_token_hash = tokenHash
    patch.reset_token_expires_at = expiresAt
  }
  const { error } = await supabase.from('profiles').update(patch).eq('email', email.toLowerCase())
  if (error) throw new Error('Failed to store email token: ' + error.message)

  const link = kind === 'signup'
    ? `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(rawToken)}`
    : `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(rawToken)}`

  const mail = buildEmail(kind, link)
  await smtpSend(email, mail.subject, mail.html)
}

type Role = 'student' | 'instructor' | 'admin' | 'support'

interface ProfileRow {
  id: string
  name: string
  email: string
  role: Role
  avatar: string | null
  title: string | null
  bio: string | null
  skills: string[] | null
  headline: string | null
  website: string | null
  student_count: number
  course_count: number
  rating: number
  is_active: boolean
  joined_at: string
  password_hash?: string
  email_confirmed?: boolean
  confirmation_token_hash?: string | null
  confirmation_token_expires_at?: string | null
  reset_token_hash?: string | null
  reset_token_expires_at?: string | null
  last_sign_in_at?: string | null
}

function mapProfile(p: ProfileRow) {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    avatar: p.avatar ?? undefined,
    title: p.title ?? undefined,
    bio: p.bio ?? undefined,
    skills: p.skills ?? [],
    headline: p.headline ?? undefined,
    website: p.website ?? undefined,
    studentCount: p.student_count,
    courseCount: p.course_count,
    rating: p.rating,
    isActive: p.is_active,
    joinedAt: p.joined_at
  }
}

async function getProfile(id: string): Promise<ProfileRow | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
  return (data as ProfileRow | null) ?? null
}

function bearerToken(req: Request): string | null {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') ?? '')
  return match ? match[1] : null
}

async function authUser(req: Request): Promise<{ id: string; email?: string } | null> {
  const token = bearerToken(req)
  if (!token) return null
  const tokenHash = await sha256Hex(token)
  const { data, error } = await supabase
    .from('user_sessions')
    .select('user_id, expires_at, is_revoked')
    .eq('token_hash', tokenHash)
    .eq('is_revoked', false)
    .maybeSingle()
  if (error || !data) return null
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null
  const profile = await getProfile(data.user_id)
  if (!profile) return null
  return { id: profile.id, email: profile.email }
}

function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

// ---------------------------------------------------------------------------
// Paystack helpers
// ---------------------------------------------------------------------------

function paystackReference(): string {
  return `HMA-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`
}

async function paystackInitialize(email: string, amountKobo: number, reference: string, callbackUrl: string, metadata: Record<string, unknown>) {
  try {
    const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: Math.round(amountKobo),
        reference,
        callback_url: callbackUrl,
        metadata
      })
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.status || !data?.data?.authorization_url) {
      return { error: data?.message ?? 'Paystack could not initialize this payment.' }
    }
    return { data: data.data as { authorization_url: string; access_code: string; reference: string } }
  } catch {
    return { error: 'Could not reach Paystack. Please try again.' }
  }
}

async function paystackVerify(reference: string) {
  try {
    const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.status) {
      return { error: data?.message ?? 'Paystack could not verify this payment.' }
    }
    return { data: data.data as { status: string; reference: string; amount: number; paid_at?: string } }
  } catch {
    return { error: 'Could not reach Paystack. Please try again.' }
  }
}

async function paystackSignatureValid(req: Request, rawBody: string): Promise<boolean> {
  const signature = req.headers.get('x-paystack-signature')
  if (!signature || !PAYSTACK_SECRET_KEY) return false
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(PAYSTACK_SECRET_KEY),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
    const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
    return hex === signature
  } catch {
    return false
  }
}

// Marks the order completed and creates enrollments for any course the user is
// not yet enrolled in. Safe to call more than once (idempotent).
async function finalizeOrder(orderId: string, userId: string, courseIds: string[]): Promise<{ created: number; skipped: number }> {
  const { data: existing } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', userId)
    .in('course_id', courseIds)
  const already = new Set((existing ?? []).map((e) => e.course_id))

  const newIds = courseIds.filter((id) => !already.has(id))
  let created = 0
  if (newIds.length > 0) {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, discount_price, price')
      .in('id', newIds)
    const priceMap = new Map((courses ?? []).map((c) => [c.id, Number(c.discount_price ?? c.price) || 0]))

    const { error } = await supabase.from('enrollments').insert(
      newIds.map((courseId) => ({
        user_id: userId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        progress: 0,
        status: 'active' as const,
        completed_lessons: [] as string[],
        price_paid: priceMap.get(courseId) ?? 0
      }))
    )
    if (error) throw new Error('Failed to create enrollments: ' + error.message)
    created = newIds.length
  }

  const { error: orderError } = await supabase
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', orderId)
  if (orderError) throw new Error('Failed to mark order as completed: ' + orderError.message)

  return { created, skipped: courseIds.length - created }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleRegister(req: Request): Promise<Response> {
  const { name, email, password, role } = await readBody(req)

  if (typeof name !== 'string' || !name.trim()) return errorResponse(422, 'Name is required.')
  if (!isEmail(email)) return errorResponse(422, 'A valid email is required.')
  if (typeof password !== 'string' || password.length < 8) return errorResponse(422, 'Password must be at least 8 characters.')
  if (role !== undefined && role !== 'student' && role !== 'instructor') return errorResponse(422, 'Role must be "student" or "instructor".')

  const chosenRole: 'student' | 'instructor' = role === 'instructor' ? 'instructor' : 'student'
  const normalizedEmail = email.toLowerCase()

  const existing = await findProfileByEmail(normalizedEmail)
  if (existing) return errorResponse(409, 'An account with this email already exists.')

  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)

  const { error: profileError } = await supabase.from('profiles').insert({
    id,
    name: name.trim(),
    email: normalizedEmail,
    role: chosenRole,
    password_hash: passwordHash
  })
  if (profileError) return errorResponse(500, 'Failed to create account: ' + profileError.message)

  // Store a confirmation token and deliver the confirmation email via Zoho SMTP.
  try {
    await generateAndEmailLink('signup', normalizedEmail, {
      data: { name: name.trim(), role: chosenRole }
    })
  } catch (e) {
    return errorResponse(500, 'Account created but we could not send the confirmation email: ' + (e as Error).message)
  }

  const profile = await getProfile(id)
  if (!profile) return errorResponse(500, 'Account created but profile could not be loaded.')

  return json({ user: mapProfile(profile), pendingConfirmation: true }, 201)
}

async function handleLogin(req: Request): Promise<Response> {
  const { email, password } = await readBody(req)
  if (!isEmail(email) || typeof password !== 'string' || !password) return errorResponse(422, 'Email and password are required.')

  const profile = await findProfileByEmail(email)
  if (!profile) return errorResponse(401, 'Invalid email or password.')

  if (profile.email_confirmed === false) return errorResponse(403, 'Please confirm your email address before signing in.')
  if (!profile.is_active) return errorResponse(403, 'This account has been disabled.')

  const ok = await verifyPassword(password, profile.password_hash ?? '')
  if (!ok) return errorResponse(401, 'Invalid email or password.')

  const token = await createSession(req, profile.id)
  await supabase.from('profiles').update({ last_sign_in_at: new Date().toISOString() }).eq('id', profile.id)

  return json({ user: mapProfile(profile), token })
}

async function handleMe(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')

  const profile = await getProfile(user.id)
  if (!profile) return errorResponse(401, 'No profile found for this account.')

  return json({ user: mapProfile(profile) })
}

async function handleLogout(req: Request): Promise<Response> {
  const token = bearerToken(req)
  if (token) {
    const tokenHash = await sha256Hex(token)
    await supabase.from('user_sessions').update({ is_revoked: true }).eq('token_hash', tokenHash)
  }
  return new Response(null, { status: 204, headers: corsHeaders })
}

async function recordSession(req: Request, userId: string, token: string): Promise<void> {
  try {
    const ua = (req.headers.get('user-agent') ?? '').slice(0, 300)
    const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('cf-connecting-ip') ?? '').trim().slice(0, 64)
    await supabase.from('user_sessions').insert({
      user_id: userId,
      token_hash: await sha256Hex(token),
      user_agent: ua,
      ip,
      expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString()
    })
  } catch {
    /* best effort */
  }
}

const PROFILE_FIELDS = ['name', 'avatar', 'title', 'bio', 'skills', 'headline', 'website'] as const

async function handleProfile(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')

  const body = await readBody(req)
  const patch: Record<string, unknown> = {}
  for (const field of PROFILE_FIELDS) {
    if (body[field] !== undefined) patch[field] = body[field]
  }
  if (patch.name !== undefined && (typeof patch.name !== 'string' || !patch.name.trim())) {
    return errorResponse(422, 'Name must be a non-empty string.')
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
    if (error) return errorResponse(400, error.message)
  }

  const profile = await getProfile(user.id)
  if (!profile) return errorResponse(500, 'Profile could not be loaded.')

  return json({ user: mapProfile(profile) })
}

async function handleChangePassword(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')

  const { currentPassword, newPassword } = await readBody(req)
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return errorResponse(422, 'Current and new passwords are required.')
  }
  if (newPassword.length < 8) return errorResponse(422, 'New password must be at least 8 characters.')

  const profile = await getProfile(user.id)
  if (!profile) return errorResponse(401, 'No profile found for this account.')

  const ok = await verifyPassword(currentPassword, profile.password_hash ?? '')
  if (!ok) return errorResponse(400, 'Current password is incorrect.')

  const passwordHash = await hashPassword(newPassword)
  const { error } = await supabase.from('profiles').update({ password_hash: passwordHash }).eq('id', user.id)
  if (error) return errorResponse(400, error.message)

  return json({ message: 'Password updated.' })
}

async function handleDeleteAccount(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')

  const { error } = await supabase.from('profiles').delete().eq('id', user.id)
  if (error) return errorResponse(400, error.message)

  return new Response(null, { status: 204, headers: corsHeaders })
}

// ---------------------------------------------------------------------------
// Account management (self-service)
// ---------------------------------------------------------------------------

const PREFERENCE_BOOLS = [
  'email_notifications',
  'course_notifications',
  'assignment_notifications',
  'marketing_notifications',
  'public_profile',
  'show_learning',
  'show_skills'
] as const

async function handleMyPreferences(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) return errorResponse(500, 'Failed to load preferences: ' + error.message)

  return json({
    preferences: {
      emailNotifications: data?.email_notifications ?? true,
      courseNotifications: data?.course_notifications ?? true,
      assignmentNotifications: data?.assignment_notifications ?? true,
      marketingNotifications: data?.marketing_notifications ?? false,
      publicProfile: data?.public_profile ?? true,
      showLearning: data?.show_learning ?? true,
      showSkills: data?.show_skills ?? true,
      language: data?.language ?? 'en',
      updatedAt: data?.updated_at ?? null
    }
  })
}

async function handleUpdateMyPreferences(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')

  const body = await readBody(req)
  const patch: Record<string, unknown> = {}
  for (const key of PREFERENCE_BOOLS) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    if (typeof body[camel] === 'boolean') patch[key] = body[camel]
  }
  if (typeof body.language === 'string' && /^[a-z]{2}(-[A-Za-z]+)?$/.test(body.language)) patch.language = body.language
  patch.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error) return errorResponse(500, 'Failed to save preferences: ' + error.message)

  return json({
    preferences: {
      emailNotifications: data.email_notifications,
      courseNotifications: data.course_notifications,
      assignmentNotifications: data.assignment_notifications,
      marketingNotifications: data.marketing_notifications,
      publicProfile: data.public_profile,
      showLearning: data.show_learning,
      showSkills: data.show_skills,
      language: data.language,
      updatedAt: data.updated_at
    }
  })
}

async function handleChangeEmail(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')
  if (!user.email) return errorResponse(400, 'Your account has no email address.')

  const { newEmail, password } = await readBody(req)
  if (typeof newEmail !== 'string' || !isEmail(newEmail)) return errorResponse(422, 'A valid new email is required.')
  if (typeof password !== 'string' || !password) return errorResponse(422, 'Your current password is required.')
  if (newEmail.toLowerCase() === user.email.toLowerCase()) return errorResponse(422, 'New email is the same as your current email.')

  const profile = await getProfile(user.id)
  if (!profile) return errorResponse(401, 'No profile found for this account.')

  const ok = await verifyPassword(password, profile.password_hash ?? '')
  if (!ok) return errorResponse(400, 'Current password is incorrect.')

  const dup = await findProfileByEmail(newEmail)
  if (dup && dup.id !== user.id) return errorResponse(409, 'An account with this email already exists.')

  const { error: updateError } = await supabase.from('profiles').update({ email: newEmail.toLowerCase() }).eq('id', user.id)
  if (updateError) return errorResponse(400, updateError.message)

  return json({ message: 'Email updated.', email: newEmail.toLowerCase() })
}

async function handleUploadAvatar(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')

  const body = await readBody(req)
  const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : ''
  const match = /^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i.exec(dataUrl)
  if (!match) return errorResponse(422, 'Provide a valid base64 image data URL.')

  const ext = match[1].toLowerCase() === 'jpg' ? 'jpg' : match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase() === 'webp' ? 'webp' : match[1].toLowerCase() === 'gif' ? 'gif' : 'png'
  const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0))
  if (bytes.byteLength > 2 * 1024 * 1024) return errorResponse(413, 'Image must be 2 MB or smaller.')

  const path = `${user.id}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, bytes, {
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: true
  })
  if (uploadError) return errorResponse(500, 'Failed to upload avatar: ' + uploadError.message)

  const avatar = `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
  const { error: profileError } = await supabase.from('profiles').update({ avatar }).eq('id', user.id)
  if (profileError) return errorResponse(500, 'Failed to update avatar: ' + profileError.message)

  return json({ avatar })
}

async function handleMySessions(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')

  const currentHash = await currentSessionHash(req)
  const { data, error } = await supabase
    .from('user_sessions')
    .select('id, token_hash, user_agent, ip, is_revoked, created_at, last_seen_at, expires_at')
    .eq('user_id', user.id)
    .order('last_seen_at', { ascending: false })
    .limit(50)
  if (error) return errorResponse(500, 'Failed to load sessions: ' + error.message)

  const sessions = (data ?? []).map((s) => ({
    id: s.id,
    userAgent: s.user_agent,
    ip: s.ip,
    createdAt: s.created_at,
    lastSeenAt: s.last_seen_at,
    expiresAt: s.expires_at,
    current: currentHash ? s.token_hash === currentHash : false,
    revoked: s.is_revoked
  }))
  return json({ sessions })
}

async function handleRevokeSessions(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')

  const currentHash = await currentSessionHash(req)
  if (currentHash) {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_revoked: true })
      .eq('user_id', user.id)
      .neq('token_hash', currentHash)
    if (error) return errorResponse(500, 'Failed to revoke sessions: ' + error.message)
  }

  return json({ message: 'Other sessions signed out.' })
}

async function handleForgotPassword(req: Request): Promise<Response> {
  const { email } = await readBody(req)
  if (!isEmail(email)) return errorResponse(422, 'A valid email is required.')

  // Do not leak whether the account exists — same response either way.
  try {
    await generateAndEmailLink('recovery', email)
  } catch {
    // Account may not exist, or send failed — respond identically either way.
  }

  return json({ message: 'If that email exists, a reset link has been sent.' })
}

async function handleResetPassword(req: Request): Promise<Response> {
  const { token, password } = await readBody(req)
  if (typeof token !== 'string' || !token) return errorResponse(400, 'Invalid or expired reset token.')
  if (typeof password !== 'string' || password.length < 8) return errorResponse(422, 'Password must be at least 8 characters.')

  const tokenHash = await sha256Hex(token)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, reset_token_hash, reset_token_expires_at')
    .eq('reset_token_hash', tokenHash)
    .maybeSingle()
  if (error || !data) return errorResponse(400, 'Invalid or expired reset token.')
  if (!data.reset_token_expires_at || new Date(data.reset_token_expires_at).getTime() < Date.now()) {
    return errorResponse(400, 'Invalid or expired reset token.')
  }

  const passwordHash = await hashPassword(password)
  const { error: pwError } = await supabase
    .from('profiles')
    .update({ password_hash: passwordHash, reset_token_hash: null, reset_token_expires_at: null })
    .eq('id', data.id)
  if (pwError) return errorResponse(400, pwError.message)

  return json({ message: 'Password updated.' })
}

async function handleVerifyEmail(req: Request): Promise<Response> {
  const { token } = await readBody(req)
  if (typeof token !== 'string' || !token) return errorResponse(400, 'Invalid or expired verification token.')

  const tokenHash = await sha256Hex(token)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, confirmation_token_hash, confirmation_token_expires_at')
    .eq('confirmation_token_hash', tokenHash)
    .maybeSingle()
  if (error || !data) return errorResponse(400, 'Invalid or expired verification token.')
  if (!data.confirmation_token_expires_at || new Date(data.confirmation_token_expires_at).getTime() < Date.now()) {
    return errorResponse(400, 'Invalid or expired verification token.')
  }

  const { error: updError } = await supabase
    .from('profiles')
    .update({ email_confirmed: true, confirmation_token_hash: null, confirmation_token_expires_at: null })
    .eq('id', data.id)
  if (updError) return errorResponse(400, updError.message)

  return json({ message: 'Email verified.' })
}

// ---------------------------------------------------------------------------
// Admin user management
// ---------------------------------------------------------------------------

async function requireAdmin(req: Request): Promise<{ profile: ProfileRow } | Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')
  const profile = await getProfile(user.id)
  if (!profile) return errorResponse(401, 'No profile found for this account.')
  if (profile.role !== 'admin') return errorResponse(403, 'Admin access required.')
  return { profile }
}

async function requireUser(req: Request): Promise<{ profile: ProfileRow } | Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')
  const profile = await getProfile(user.id)
  if (!profile) return errorResponse(401, 'No profile found for this account.')
  return { profile }
}

interface AdminUserRow extends ProfileRow {
  lastSignInAt?: string
}

function mapAdminUser(p: AdminUserRow) {
  return { ...mapProfile(p), lastSignInAt: p.lastSignInAt }
}

async function handleAdminListUsers(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
  const role = url.searchParams.get('role') ?? 'all'
  const status = url.searchParams.get('status') ?? 'all'
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('perPage') ?? '25', 10) || 25))
  const offset = (page - 1) * perPage

  let query = supabase.from('profiles').select('*', { count: 'exact' })
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  if (role !== 'all') query = query.eq('role', role)
  if (status === 'active') query = query.eq('is_active', true)
  if (status === 'suspended') query = query.eq('is_active', false)

  const { data, count, error } = await query
    .order('joined_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (error) return errorResponse(500, 'Failed to load users: ' + error.message)

  const rows = (data ?? []) as ProfileRow[]
  const users = rows.map((r) => ({
    ...mapProfile(r),
    lastSignInAt: r.last_sign_in_at ?? undefined
  }))

  return json({ users, total: count ?? rows.length, page, perPage, hasMore: (count ?? 0) > offset + rows.length })
}

async function handleAdminCreateUser(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const body = await readBody(req)
  const { name, email, password, role } = body as { name?: string; email?: string; password?: string; role?: string }
  if (typeof name !== 'string' || !name.trim()) return errorResponse(422, 'Name is required.')
  if (!isEmail(email)) return errorResponse(422, 'A valid email is required.')
  if (typeof password !== 'string' || password.length < 8) return errorResponse(422, 'Password must be at least 8 characters.')
  if (role !== 'student' && role !== 'instructor' && role !== 'admin' && role !== 'support') {
    return errorResponse(422, 'Role must be student, instructor, admin or support.')
  }

  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  const normalizedEmail = email.toLowerCase()

  const existing = await findProfileByEmail(normalizedEmail)
  if (existing) return errorResponse(409, 'An account with this email already exists.')

  const { error: profileError } = await supabase.from('profiles').insert({
    id,
    name: name.trim(),
    email: normalizedEmail,
    role,
    password_hash: passwordHash,
    email_confirmed: true
  })
  if (profileError) return errorResponse(500, 'Failed to create profile: ' + profileError.message)

  const profile = await getProfile(id)
  if (!profile) return errorResponse(500, 'Account created but profile could not be loaded.')

  return json({ user: mapProfile(profile) }, 201)
}

async function handleAdminUpdateUser(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const id = url.pathname.split('/').pop() ?? ''
  if (!id) return errorResponse(422, 'User id is required.')

  const target = await getProfile(id)
  if (!target) return errorResponse(404, 'User not found.')

  const body = await readBody(req)
  const allowedRoles = ['student', 'instructor', 'admin', 'support']
  const patch: Record<string, unknown> = {}
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) return errorResponse(422, 'Name must be a non-empty string.')
    patch.name = body.name.trim()
  }
  if (body.role !== undefined) {
    if (!allowedRoles.includes(body.role as string)) return errorResponse(422, 'Invalid role.')
    patch.role = body.role
  }
  if (body.is_active !== undefined && typeof body.is_active === 'boolean') patch.is_active = body.is_active
  if (body.title !== undefined && typeof body.title === 'string') patch.title = body.title || null
  if (body.bio !== undefined && typeof body.bio === 'string') patch.bio = body.bio || null

  if (id === guard.profile.id && patch.is_active === false) {
    return errorResponse(400, 'You cannot suspend your own account.')
  }
  if (id === guard.profile.id && patch.role !== undefined && patch.role !== 'admin') {
    return errorResponse(400, 'You cannot demote your own admin role.')
  }

  if (Object.keys(patch).length === 0) return errorResponse(422, 'No fields to update.')

  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) return errorResponse(500, 'Failed to update user: ' + error.message)

  const profile = await getProfile(id)
  return json({ user: profile ? mapProfile(profile) : null })
}

async function handleAdminDeleteUser(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const id = url.pathname.split('/').pop() ?? ''
  if (!id) return errorResponse(422, 'User id is required.')

  const target = await getProfile(id)
  if (!target) return errorResponse(404, 'User not found.')

  if (id === guard.profile.id) return errorResponse(400, 'You cannot delete your own account.')

  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) return errorResponse(500, 'Failed to delete user: ' + error.message)

  return new Response(null, { status: 204, headers: corsHeaders })
}

// ---------------------------------------------------------------------------
// Admin: courses
// ---------------------------------------------------------------------------

const COURSE_STATUSES = ['published', 'draft', 'pending', 'approved', 'archived']
const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

interface CourseRow {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  long_description: string | null
  category_id: string
  instructor_id: string
  thumbnail: string | null
  price: number
  discount_price: number | null
  rating: number
  review_count: number
  student_count: number
  duration: number
  level: string
  language: string
  last_updated: string
  has_certificate: boolean
  is_featured: boolean
  is_trending: boolean
  is_new: boolean
  status: string
  created_at: string
  categories?: { id: string; name: string } | null
  instructors?: { id: string; name: string } | null
}

function mapCourse(c: CourseRow) {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle ?? '',
    description: c.description ?? '',
    longDescription: c.long_description ?? '',
    categoryId: c.category_id,
    categoryName: c.categories?.name,
    instructorId: c.instructor_id,
    instructorName: c.instructors?.name,
    thumbnail: c.thumbnail ?? undefined,
    price: Number(c.price),
    discountPrice: c.discount_price != null ? Number(c.discount_price) : undefined,
    rating: Number(c.rating),
    reviewCount: c.review_count,
    studentCount: c.student_count,
    duration: c.duration,
    level: c.level,
    language: c.language,
    lastUpdated: c.last_updated,
    hasCertificate: c.has_certificate,
    isFeatured: c.is_featured,
    isTrending: c.is_trending,
    isNew: c.is_new,
    status: c.status,
    createdAt: c.created_at
  }
}

function slugify(value: string): string {
  return (value ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

interface EnrollmentRow {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  progress: number
  status: string
  completed_lessons: string[]
  current_lesson_id: string | null
  certificate_issued: boolean
  certificate_id: string | null
  price_paid: number
}

function mapEnrollment(e: EnrollmentRow, course?: Record<string, unknown>) {
  return {
    id: e.id,
    userId: e.user_id,
    courseId: e.course_id,
    enrolledAt: e.enrolled_at,
    progress: e.progress,
    status: e.status,
    completedLessons: e.completed_lessons ?? [],
    currentLessonId: e.current_lesson_id ?? undefined,
    certificateIssued: e.certificate_issued,
    certificateId: e.certificate_id ?? undefined,
    pricePaid: Number(e.price_paid),
    course: course ?? undefined
  }
}

async function handleAdminListCourses(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
  const status = url.searchParams.get('status') ?? 'all'
  const category = url.searchParams.get('category') ?? 'all'
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('perPage') ?? '25', 10) || 25))
  const offset = (page - 1) * perPage

  let query = supabase
    .from('courses')
    .select('*, categories(id,name), instructors:profiles!courses_instructor_id_fkey(id,name)', { count: 'exact' })
  if (search) query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`)
  if (status !== 'all') query = query.eq('status', status)
  if (category !== 'all') query = query.eq('category_id', category)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (error) return errorResponse(500, 'Failed to load courses: ' + error.message)

  const rows = (data ?? []) as CourseRow[]
  const courses = rows.map(mapCourse)

  return json({ courses, total: count ?? rows.length, page, perPage, hasMore: (count ?? 0) > offset + rows.length })
}

async function handleAdminCreateCourse(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const body = await readBody(req)
  const { title, categoryId, instructorId } = body as { title?: string; categoryId?: string; instructorId?: string }

  if (typeof title !== 'string' || !title.trim()) return errorResponse(422, 'Title is required.')
  if (typeof categoryId !== 'string' || !categoryId) return errorResponse(422, 'A category is required.')
  if (typeof instructorId !== 'string' || !instructorId) return errorResponse(422, 'An instructor is required.')

  const level = (body.level as string) ?? 'Beginner'
  if (!COURSE_LEVELS.includes(level)) return errorResponse(422, 'Level must be Beginner, Intermediate or Advanced.')
  const status = (body.status as string) ?? 'draft'
  if (!COURSE_STATUSES.includes(status)) return errorResponse(422, 'Invalid course status.')

  const baseSlug = slugify(body.slug as string) || slugify(title)
  if (!baseSlug) return errorResponse(422, 'A valid slug is required.')
  let slug = baseSlug
  const { count } = await supabase.from('courses').select('id', { count: 'exact', head: true }).eq('slug', slug)
  if ((count ?? 0) > 0) slug = `${baseSlug}-${Date.now().toString(36)}`

  const { data, error } = await supabase.from('courses').insert({
    slug,
    title: title.trim(),
    subtitle: (body.subtitle as string) ?? '',
    description: (body.description as string) ?? '',
    long_description: (body.longDescription as string) ?? '',
    category_id: categoryId,
    instructor_id: instructorId,
    thumbnail: (body.thumbnail as string) ?? null,
    price: Number(body.price ?? 0),
    discount_price: body.discountPrice != null && body.discountPrice !== '' ? Number(body.discountPrice) : null,
    level,
    language: (body.language as string) ?? 'English',
    duration: Number(body.duration ?? 0),
    has_certificate: body.hasCertificate === true,
    is_featured: body.isFeatured === true,
    status
  }).select('*, categories(id,name), instructors:profiles!courses_instructor_id_fkey(id,name)').single()

  if (error) {
    if (/violates foreign key constraint/i.test(error.message)) return errorResponse(422, 'Category or instructor does not exist.')
    if (/duplicate key/i.test(error.message)) return errorResponse(409, 'A course with this slug already exists.')
    return errorResponse(500, 'Failed to create course: ' + error.message)
  }

  return json({ course: mapCourse(data as CourseRow) }, 201)
}

async function handleAdminUpdateCourse(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const id = url.pathname.split('/').pop() ?? ''
  if (!id) return errorResponse(422, 'Course id is required.')

  const { data: existing } = await supabase.from('courses').select('id').eq('id', id).single()
  if (!existing) return errorResponse(404, 'Course not found.')

  const body = await readBody(req)
  const patch: Record<string, unknown> = {}

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) return errorResponse(422, 'Title must be a non-empty string.')
    patch.title = body.title.trim()
  }
  if (body.subtitle !== undefined && typeof body.subtitle === 'string') patch.subtitle = body.subtitle
  if (body.description !== undefined && typeof body.description === 'string') patch.description = body.description
  if (body.longDescription !== undefined && typeof body.longDescription === 'string') patch.long_description = body.longDescription
  if (body.categoryId !== undefined && typeof body.categoryId === 'string' && body.categoryId) patch.category_id = body.categoryId
  if (body.instructorId !== undefined && typeof body.instructorId === 'string' && body.instructorId) patch.instructor_id = body.instructorId
  if (body.thumbnail !== undefined && typeof body.thumbnail === 'string') patch.thumbnail = body.thumbnail || null
  if (body.price !== undefined) patch.price = Number(body.price)
  if (body.discountPrice !== undefined) patch.discount_price = body.discountPrice === null || body.discountPrice === '' ? null : Number(body.discountPrice)
  if (body.level !== undefined) {
    if (!COURSE_LEVELS.includes(body.level as string)) return errorResponse(422, 'Level must be Beginner, Intermediate or Advanced.')
    patch.level = body.level
  }
  if (body.language !== undefined && typeof body.language === 'string' && body.language.trim()) patch.language = body.language.trim()
  if (body.duration !== undefined) patch.duration = Number(body.duration)
  if (body.hasCertificate !== undefined && typeof body.hasCertificate === 'boolean') patch.has_certificate = body.hasCertificate
  if (body.isFeatured !== undefined && typeof body.isFeatured === 'boolean') patch.is_featured = body.isFeatured
  if (body.status !== undefined) {
    if (!COURSE_STATUSES.includes(body.status as string)) return errorResponse(422, 'Invalid course status.')
    patch.status = body.status
  }

  if (Object.keys(patch).length === 0) return errorResponse(422, 'No fields to update.')

  const { data, error } = await supabase.from('courses').update(patch)
    .eq('id', id)
    .select('*, categories(id,name), instructors:profiles!courses_instructor_id_fkey(id,name)')
    .single()
  if (error) {
    if (/duplicate key/i.test(error.message)) return errorResponse(409, 'A course with this slug already exists.')
    return errorResponse(500, 'Failed to update course: ' + error.message)
  }

  return json({ course: mapCourse(data as CourseRow) })
}

async function handleAdminDeleteCourse(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const id = url.pathname.split('/').pop() ?? ''
  if (!id) return errorResponse(422, 'Course id is required.')

  const { data: existing } = await supabase.from('courses').select('id').eq('id', id).single()
  if (!existing) return errorResponse(404, 'Course not found.')

  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) {
    if (/foreign key constraint/i.test(error.message)) return errorResponse(409, 'This course has paid orders and cannot be deleted.')
    return errorResponse(500, 'Failed to delete course: ' + error.message)
  }

  return new Response(null, { status: 204, headers: corsHeaders })
}

interface SectionRow {
  id: string
  course_id: string
  title: string
  position: number
}

interface LessonRow {
  id: string
  section_id: string
  title: string
  type: string
  duration: number
  content: string
  video_url: string | null
  resource_url: string | null
  position: number
}

interface ObjectiveRow {
  id: string
  course_id: string
  text: string
  position: number
}

interface RequirementRow {
  id: string
  course_id: string
  text: string
  position: number
}

interface FaqRow {
  id: string
  course_id: string
  question: string
  answer: string
}

interface AssessmentRow {
  id: string
  course_id: string
  title: string
  description: string
  time_limit: number
  passing_score: number
  retake_limit: number
}

interface QuestionRow {
  id: string
  assessment_id: string
  type: string
  question: string
  options: string[] | null
  answer: string | null
  explanation: string | null
  position: number
}

async function loadCourseContent(id: string): Promise<Record<string, unknown> | null> {
  const { data: course } = await supabase.from('courses').select('*').eq('id', id).single()
  if (!course) return null

  const [sections, objectives, requirements, faqs, assessments] = await Promise.all([
    supabase.from('course_sections').select('*').eq('course_id', id).order('position'),
    supabase.from('course_objectives').select('*').eq('course_id', id).order('position'),
    supabase.from('course_requirements').select('*').eq('course_id', id).order('position'),
    supabase.from('course_faqs').select('*').eq('course_id', id),
    supabase.from('assessments').select('*').eq('course_id', id)
  ])

  const sectionRows = (sections.data ?? []) as SectionRow[]
  const lessonRows = (await supabase.from('lessons').select('*').in('section_id', sectionRows.map((s) => s.id))).data as LessonRow[] | null
  const assessmentRows = (assessments.data ?? []) as AssessmentRow[]
  const questionRows = (await supabase.from('assessment_questions').select('*').in('assessment_id', assessmentRows.map((a) => a.id))).data as QuestionRow[] | null

  return {
    course: {
      ...mapCourse(course as CourseRow),
      objectives: (objectives.data ?? []).map((o: ObjectiveRow) => o.text),
      requirements: (requirements.data ?? []).map((r: RequirementRow) => r.text),
      sections: sectionRows.map((s) => ({
        id: s.id,
        title: s.title,
        lessons: (lessonRows ?? []).filter((l) => l.section_id === s.id).map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          duration: l.duration,
          content: l.content,
          videoUrl: l.video_url ?? undefined,
          resourceUrl: l.resource_url ?? undefined
        }))
      })),
      faqs: (faqs.data ?? []).map((f: FaqRow) => ({ q: f.question, a: f.answer })),
      assessments: assessmentRows.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        timeLimit: a.time_limit,
        passingScore: a.passing_score,
        retakeLimit: a.retake_limit,
        questions: (questionRows ?? []).filter((q) => q.assessment_id === a.id).map((q) => ({
          id: q.id,
          type: q.type,
          question: q.question,
          options: q.options ?? [],
          answer: q.answer ?? '',
          explanation: q.explanation ?? ''
        }))
      }))
    }
  }
}

async function handleAdminGetCourseFull(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const id = url.pathname.split('/').filter(Boolean).at(-2) ?? ''
  if (!id) return errorResponse(422, 'Course id is required.')

  const content = await loadCourseContent(id)
  if (!content) return errorResponse(404, 'Course not found.')
  return json(content)
}

async function handleGetCourseFull(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const id = url.pathname.split('/').filter(Boolean).at(-2) ?? ''
  if (!id) return errorResponse(422, 'Course id is required.')

  const content = await loadCourseContent(id)
  if (!content) return errorResponse(404, 'Course not found.')
  if (content.course.status !== 'published') return errorResponse(404, 'Course not found.')
  return json(content)
}

async function handleListCourses(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const category = url.searchParams.get('category') ?? 'all'
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()

  let query = supabase
    .from('courses')
    .select('*, categories(id,name), instructors:profiles!courses_instructor_id_fkey(id,name)')
    .eq('status', 'published')
  if (category !== 'all') query = query.eq('category_id', category)
  if (search) query = query.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%,description.ilike.%${search}%`)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
  if (error) return errorResponse(500, 'Failed to load courses: ' + error.message)
  return json({ courses: (data ?? []).map((c) => mapCourse(c as CourseRow)) })
}

async function handleListCategories(req: Request): Promise<Response> {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) return errorResponse(500, 'Failed to load categories: ' + error.message)
  return json({ categories: (data ?? []).map((c) => mapCategory(c as CategoryRow)) })
}

async function handleMyCourses(req: Request): Promise<Response> {
  const guard = await requireUser(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('courses')
    .select('*, categories(id,name), instructors:profiles!courses_instructor_id_fkey(id,name)')
    .eq('instructor_id', guard.profile.id)
    .order('created_at', { ascending: false })
  if (error) return errorResponse(500, 'Failed to load courses: ' + error.message)
  return json({ courses: (data ?? []).map((c) => mapCourse(c as CourseRow)) })
}

async function handleAdminSaveCourseContent(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const id = url.pathname.split('/').filter(Boolean).at(-2) ?? ''
  if (!id) return errorResponse(422, 'Course id is required.')

  const { data: existing } = await supabase.from('courses').select('id').eq('id', id).single()
  if (!existing) return errorResponse(404, 'Course not found.')

  const body = await readBody(req)

  const patch: Record<string, unknown> = {}
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) return errorResponse(422, 'Title must be a non-empty string.')
    patch.title = body.title.trim()
  }
  if (body.subtitle !== undefined && typeof body.subtitle === 'string') patch.subtitle = body.subtitle
  if (body.description !== undefined && typeof body.description === 'string') patch.description = body.description
  if (body.longDescription !== undefined && typeof body.longDescription === 'string') patch.long_description = body.longDescription
  if (body.categoryId !== undefined && typeof body.categoryId === 'string' && body.categoryId) patch.category_id = body.categoryId
  if (body.level !== undefined) {
    if (!COURSE_LEVELS.includes(body.level as string)) return errorResponse(422, 'Level must be Beginner, Intermediate or Advanced.')
    patch.level = body.level
  }
  if (body.language !== undefined && typeof body.language === 'string' && body.language.trim()) patch.language = body.language.trim()
  if (body.thumbnail !== undefined && typeof body.thumbnail === 'string') patch.thumbnail = body.thumbnail || null
  if (body.price !== undefined) patch.price = Number(body.price)
  if (body.discountPrice !== undefined) patch.discount_price = body.discountPrice === null || body.discountPrice === '' ? null : Number(body.discountPrice)
  if (body.hasCertificate !== undefined && typeof body.hasCertificate === 'boolean') patch.has_certificate = body.hasCertificate
  if (body.status !== undefined) {
    if (!COURSE_STATUSES.includes(body.status as string)) return errorResponse(422, 'Invalid course status.')
    patch.status = body.status
  }

  const sections = Array.isArray(body.sections) ? body.sections as { title?: string; lessons?: { title?: string; type?: string; duration?: number; content?: string; videoUrl?: string; resourceUrl?: string }[] }[] : []
  const objectives = Array.isArray(body.objectives) ? (body.objectives as unknown[]).filter((o): o is string => typeof o === 'string' && o.trim().length > 0) : []
  const requirements = Array.isArray(body.requirements) ? (body.requirements as unknown[]).filter((r): r is string => typeof r === 'string' && r.trim().length > 0) : []
  const faqs = Array.isArray(body.faqs) ? (body.faqs as { q?: string; a?: string }[]).filter((f) => f && (typeof f.q === 'string' || typeof f.a === 'string')) : []
  const assessments = Array.isArray(body.assessments) ? body.assessments as { title?: string; description?: string; timeLimit?: number; passingScore?: number; retakeLimit?: number; questions?: { type?: string; question?: string; options?: string[]; answer?: string; explanation?: string }[] }[] : []

  const duration = sections.reduce((total, s) => total + (s.lessons ?? []).reduce((t, l) => t + (Number(l.duration) || 0), 0), 0)
  if (sections.length > 0) patch.duration = duration

  const { error: updateError } = await supabase.from('courses').update(patch).eq('id', id)
  if (updateError) {
    if (/duplicate key/i.test(updateError.message)) return errorResponse(409, 'A course with this slug already exists.')
    return errorResponse(500, 'Failed to update course: ' + updateError.message)
  }

  await Promise.all([
    supabase.from('course_objectives').delete().eq('course_id', id),
    supabase.from('course_requirements').delete().eq('course_id', id),
    supabase.from('course_faqs').delete().eq('course_id', id),
    supabase.from('assessments').delete().eq('course_id', id),
    supabase.from('course_sections').delete().eq('course_id', id)
  ])

  for (let si = 0; si < sections.length; si++) {
    const s = sections[si]
    const { data: section } = await supabase.from('course_sections').insert({
      course_id: id,
      title: (s.title ?? '').trim() || `Section ${si + 1}`,
      position: si
    }).select('id').single()
    if (!section) continue
    const lessons = s.lessons ?? []
    for (let li = 0; li < lessons.length; li++) {
      const l = lessons[li]
      await supabase.from('lessons').insert({
        section_id: section.id,
        title: (l.title ?? '').trim() || `Lesson ${li + 1}`,
        type: l.type ?? 'video',
        duration: Number(l.duration) || 0,
        content: l.content ?? '',
        video_url: typeof l.videoUrl === 'string' && l.videoUrl.trim() ? l.videoUrl.trim() : null,
        resource_url: typeof l.resourceUrl === 'string' && l.resourceUrl.trim() ? l.resourceUrl.trim() : null,
        position: li
      })
    }
  }

  for (let oi = 0; oi < objectives.length; oi++) {
    await supabase.from('course_objectives').insert({ course_id: id, text: objectives[oi].trim(), position: oi })
  }
  for (let ri = 0; ri < requirements.length; ri++) {
    await supabase.from('course_requirements').insert({ course_id: id, text: requirements[ri].trim(), position: ri })
  }
  for (let fi = 0; fi < faqs.length; fi++) {
    await supabase.from('course_faqs').insert({ course_id: id, question: (faqs[fi].q ?? '').trim(), answer: (faqs[fi].a ?? '').trim() })
  }
  for (let ai = 0; ai < assessments.length; ai++) {
    const a = assessments[ai]
    const { data: assessment } = await supabase.from('assessments').insert({
      course_id: id,
      title: (a.title ?? '').trim() || `Assessment ${ai + 1}`,
      description: a.description ?? '',
      time_limit: Number(a.timeLimit) || 30,
      passing_score: Number(a.passingScore) || 60,
      retake_limit: Number(a.retakeLimit) || 3
    }).select('id').single()
    if (!assessment) continue
    const questions = a.questions ?? []
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi]
      await supabase.from('assessment_questions').insert({
        assessment_id: assessment.id,
        type: q.type ?? 'mc',
        question: (q.question ?? '').trim() || `Question ${qi + 1}`,
        options: Array.isArray(q.options) ? q.options : null,
        answer: typeof q.answer === 'string' && q.answer.trim() ? q.answer.trim() : null,
        explanation: q.explanation ?? '',
        position: qi
      })
    }
  }

  const content = await loadCourseContent(id)
  return json(content ?? { course: mapCourse(await (await supabase.from('courses').select('*').eq('id', id).single()).data as CourseRow) })
}

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
  color: string | null
  course_count: number
}

async function handleAdminListCategories(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) return errorResponse(500, 'Failed to load categories: ' + error.message)

  const rows = (data ?? []) as CategoryRow[]
  return json({ categories: rows.map(mapCategory) })
}

function mapCategory(c: CategoryRow) {
  return {
    id: c.id, name: c.name, slug: c.slug, description: c.description,
    icon: c.icon ?? undefined, color: c.color ?? undefined, courseCount: c.course_count
  }
}

async function handleAdminCreateCategory(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const body = await readBody(req)
  const { name, description, icon, color } = body as { name?: string; description?: string; icon?: string; color?: string }

  if (typeof name !== 'string' || !name.trim()) return errorResponse(422, 'Category name is required.')

  const baseSlug = slugify(body.slug as string) || slugify(name)
  if (!baseSlug) return errorResponse(422, 'A valid slug is required.')
  let slug = baseSlug
  const { count } = await supabase.from('categories').select('id', { count: 'exact', head: true }).eq('slug', slug)
  if ((count ?? 0) > 0) slug = `${baseSlug}-${Date.now().toString(36)}`

  const { data, error } = await supabase.from('categories').insert({
    slug,
    name: name.trim(),
    description: typeof description === 'string' ? description : '',
    icon: typeof icon === 'string' && icon.trim() ? icon.trim() : null,
    color: typeof color === 'string' && color.trim() ? color.trim() : null
  }).select('*').single()

  if (error) {
    if (/duplicate key/i.test(error.message)) return errorResponse(409, 'A category with this slug already exists.')
    return errorResponse(500, 'Failed to create category: ' + error.message)
  }

  return json({ category: mapCategory(data as CategoryRow) }, 201)
}

async function handleAdminUpdateCategory(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const id = url.pathname.split('/').pop() ?? ''
  if (!id) return errorResponse(422, 'Category id is required.')

  const { data: existing } = await supabase.from('categories').select('id').eq('id', id).single()
  if (!existing) return errorResponse(404, 'Category not found.')

  const body = await readBody(req)
  const patch: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) return errorResponse(422, 'Name must be a non-empty string.')
    patch.name = body.name.trim()
  }
  if (body.description !== undefined && typeof body.description === 'string') patch.description = body.description
  if (body.icon !== undefined && typeof body.icon === 'string') patch.icon = body.icon.trim() || null
  if (body.color !== undefined && typeof body.color === 'string') patch.color = body.color.trim() || null
  if (body.slug !== undefined) {
    if (typeof body.slug !== 'string' || !body.slug.trim()) return errorResponse(422, 'Slug must be a non-empty string.')
    const newSlug = slugify(body.slug)
    if (!newSlug) return errorResponse(422, 'A valid slug is required.')
    const { count } = await supabase.from('categories').select('id', { count: 'exact', head: true }).eq('slug', newSlug).neq('id', id)
    if ((count ?? 0) > 0) return errorResponse(409, 'A category with this slug already exists.')
    patch.slug = newSlug
  }

  if (Object.keys(patch).length === 0) return errorResponse(422, 'No fields to update.')

  const { data, error } = await supabase.from('categories').update(patch).eq('id', id).select('*').single()
  if (error) {
    if (/duplicate key/i.test(error.message)) return errorResponse(409, 'A category with this slug already exists.')
    return errorResponse(500, 'Failed to update category: ' + error.message)
  }

  return json({ category: mapCategory(data as CategoryRow) })
}

async function handleAdminDeleteCategory(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const id = url.pathname.split('/').pop() ?? ''
  if (!id) return errorResponse(422, 'Category id is required.')

  const { data: existing } = await supabase.from('categories').select('id').eq('id', id).single()
  if (!existing) return errorResponse(404, 'Category not found.')

  const { count } = await supabase.from('courses').select('id', { count: 'exact', head: true }).eq('category_id', id)
  if ((count ?? 0) > 0) return errorResponse(409, 'This category has courses and cannot be deleted.')

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return errorResponse(500, 'Failed to delete category: ' + error.message)

  return new Response(null, { status: 204, headers: corsHeaders })
}

async function handleAdminListInstructors(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name')
    .in('role', ['instructor', 'admin', 'support'])
    .order('name')
  if (error) return errorResponse(500, 'Failed to load instructors: ' + error.message)

  return json({ instructors: (data ?? []).map((p) => ({ id: p.id, name: p.name })) })
}

// ---------------------------------------------------------------------------
// Enrollment / learning handlers
// ---------------------------------------------------------------------------

async function loadEnrollmentCourses(rows: EnrollmentRow[]): Promise<Record<string, unknown>[]> {
  if (rows.length === 0) return []
  const ids = [...new Set(rows.map((r) => r.course_id))]
  const { data } = await supabase
    .from('courses')
    .select('*, categories(id,name), instructors:profiles!courses_instructor_id_fkey(id,name)')
    .in('id', ids)
  const courses = (data ?? []) as CourseRow[]
  const byId = new Map(courses.map((c) => [c.id, mapCourse(c)]))
  return rows.map((r) => byId.get(r.course_id) ?? {})
}

async function countLessons(courseId: string): Promise<number> {
  const { data: sections } = await supabase.from('course_sections').select('id').eq('course_id', courseId)
  const sectionIds = (sections ?? []).map((s) => s.id)
  if (sectionIds.length === 0) return 0
  const { count } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .in('section_id', sectionIds)
  return count ?? 0
}

async function issueCertificate(courseId: string, userId: string): Promise<string | null> {
  const { data: course } = await supabase.from('courses').select('id, instructor_id, title, has_certificate').eq('id', courseId).single()
  if (!course || !course.has_certificate) return null
  const verificationCode = `CERT-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const { data, error } = await supabase.from('certificates').insert({
    user_id: userId,
    course_id: courseId,
    instructor_id: course.instructor_id ?? userId,
    issued_at: new Date().toISOString(),
    completion_date: new Date().toISOString(),
    verification_code: verificationCode
  }).select('id').single()
  if (error) return null
  return data.id
}

async function handleMyEnrollments(req: Request): Promise<Response> {
  const guard = await requireUser(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', guard.profile.id)
    .order('enrolled_at', { ascending: false })
  if (error) return errorResponse(500, 'Failed to load enrollments: ' + error.message)

  const rows = (data ?? []) as EnrollmentRow[]
  const courses = await loadEnrollmentCourses(rows)
  return json({ enrollments: rows.map((r, i) => mapEnrollment(r, courses[i])) })
}

async function handleEnroll(req: Request): Promise<Response> {
  const guard = await requireUser(req)
  if (guard instanceof Response) return guard

  const { courseId, paymentMethod } = await readBody(req)
  if (typeof courseId !== 'string' || !courseId.trim()) return errorResponse(422, 'Course id is required.')

  const { data: course } = await supabase
    .from('courses')
    .select('id, price, discount_price, status')
    .eq('id', courseId)
    .single()
  if (!course) return errorResponse(404, 'Course not found.')
  if (course.status !== 'published') return errorResponse(409, 'This course is not available for enrollment yet.')

  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', guard.profile.id)
    .eq('course_id', courseId)
    .maybeSingle()
  if (existing) return errorResponse(409, 'You are already enrolled in this course.')

  const price = Number(course.discount_price ?? course.price) || 0
  if (price > 0 && !paymentMethod) return errorResponse(422, 'A payment method is required for paid courses.')

  const { data, error } = await supabase.from('enrollments').insert({
    user_id: guard.profile.id,
    course_id: courseId,
    enrolled_at: new Date().toISOString(),
    progress: 0,
    status: 'active',
    completed_lessons: [],
    price_paid: price
  }).select('*').single()
  if (error) return errorResponse(500, 'Failed to enroll: ' + error.message)

  if (price > 0) {
    await supabase.from('orders').insert({
      user_id: guard.profile.id,
      total: price,
      status: 'completed',
      payment_method: typeof paymentMethod === 'string' ? paymentMethod : 'card'
    }).select('id').single().then(async ({ data: order }) => {
      if (order) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          course_id: courseId,
          title: '',
          price
        })
      }
    })
  }

  const courseInfo = (await loadEnrollmentCourses([data as EnrollmentRow]))[0]
  return json({ enrollment: mapEnrollment(data as EnrollmentRow, courseInfo) }, 201)
}

async function handleUpdateEnrollment(req: Request): Promise<Response> {
  const guard = await requireUser(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const courseId = url.pathname.split('/').filter(Boolean).at(-1) ?? ''
  if (!courseId) return errorResponse(422, 'Course id is required.')

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', guard.profile.id)
    .eq('course_id', courseId)
    .single()
  if (!enrollment) return errorResponse(404, 'Enrollment not found.')

  const body = await readBody(req)
  const completedLessons = Array.isArray(body.completedLessons)
    ? (body.completedLessons as unknown[]).filter((x): x is string => typeof x === 'string')
    : (enrollment.completed_lessons ?? [])
  const currentLessonId = typeof body.currentLessonId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.currentLessonId)
    ? body.currentLessonId
    : undefined

  const total = await countLessons(courseId)
  const unique = [...new Set(completedLessons)]
  const progress = total > 0 ? Math.min(100, Math.round((unique.length / total) * 100)) : (enrollment.progress ?? 0)
  const status = progress >= 100 ? 'completed' : 'active'

  const patch: Record<string, unknown> = {
    completed_lessons: unique,
    progress,
    status
  }
  if (currentLessonId) patch.current_lesson_id = currentLessonId

  const { data, error } = await supabase.from('enrollments').update(patch).eq('id', enrollment.id).select('*').single()
  if (error) return errorResponse(500, 'Failed to update enrollment: ' + error.message)

  const updated = data as EnrollmentRow
  let certificateIssued = updated.certificate_issued
  let certificateId = updated.certificate_id

  if (status === 'completed' && !certificateIssued) {
    const certId = await issueCertificate(courseId, guard.profile.id)
    if (certId) {
      certificateIssued = true
      certificateId = certId
      await supabase.from('enrollments').update({ certificate_issued: true, certificate_id: certId }).eq('id', enrollment.id)
    }
  }

  const courseInfo = (await loadEnrollmentCourses([updated]))[0]
  return json({
    enrollment: {
      ...mapEnrollment(updated, courseInfo),
      certificateIssued,
      certificateId: certificateId ?? undefined
    }
  })
}

async function handleCheckout(req: Request): Promise<Response> {
  const guard = await requireUser(req)
  if (guard instanceof Response) return guard

  const { courseIds, paymentMethod, callbackUrl } = await readBody(req)
  if (!Array.isArray(courseIds) || courseIds.length === 0) return errorResponse(422, 'At least one course is required.')
  const ids = courseIds.filter((x): x is string => typeof x === 'string')

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, price, discount_price, status')
    .in('id', ids)
  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]))
  if ((courses ?? []).length !== ids.length) return errorResponse(404, 'One or more courses were not found.')

  const unpaid = ids.filter((id) => {
    const c = courseMap.get(id)!
    return (Number(c.discount_price ?? c.price) || 0) > 0
  })
  if (unpaid.length > 0 && !paymentMethod) return errorResponse(422, 'A payment method is required for paid courses.')

  const total = ids.reduce((sum, id) => sum + (Number(courseMap.get(id)!.discount_price ?? courseMap.get(id)!.price) || 0), 0)
  const method = typeof paymentMethod === 'string' && paymentMethod ? paymentMethod : 'card'

  if (total === 0) {
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      user_id: guard.profile.id,
      total: 0,
      status: 'completed',
      payment_method: 'free',
      created_at: new Date().toISOString()
    }).select('id').single()
    if (orderError) return errorResponse(500, 'Failed to create order: ' + orderError.message)

    const items = ids.map((courseId) => {
      const c = courseMap.get(courseId)!
      return { order_id: order.id, course_id: courseId, title: c.title, price: 0 }
    })
    const { error: itemsError } = await supabase.from('order_items').insert(items)
    if (itemsError) return errorResponse(500, 'Failed to create order items: ' + itemsError.message)

    const { data: existingEnrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', guard.profile.id)
      .in('course_id', ids)
    const alreadyEnrolled = new Set((existingEnrollments ?? []).map((e) => e.course_id))
    const newIds = ids.filter((id) => !alreadyEnrolled.has(id))
    if (newIds.length === 0) return errorResponse(409, 'You are already enrolled in all selected courses.')

    const enrollRows = newIds.map((courseId) => ({
      user_id: guard.profile.id,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      progress: 0,
      status: 'active' as const,
      completed_lessons: [] as string[],
      price_paid: 0
    }))
    const { data: enrollData, error: enrollError } = await supabase.from('enrollments').insert(enrollRows).select('*')
    if (enrollError) return errorResponse(500, 'Failed to create enrollments: ' + enrollError.message)

    const rows = (enrollData ?? []) as EnrollmentRow[]
    const coursesEmbedded = await loadEnrollmentCourses(rows)
    return json({
      order: { id: order.id, total, status: 'completed', paymentMethod: 'free', createdAt: new Date().toISOString() },
      enrollments: rows.map((r, i) => mapEnrollment(r, coursesEmbedded[i]))
    }, 201)
  }

  if (!PAYSTACK_SECRET_KEY) return errorResponse(503, 'Online payments are not configured yet. Please try again later.')

  const reference = paystackReference()
  const { data: order, error: orderError } = await supabase.from('orders').insert({
    user_id: guard.profile.id,
    total,
    status: 'pending',
    payment_method: 'paystack',
    payment_reference: reference,
    created_at: new Date().toISOString()
  }).select('id').single()
  if (orderError) return errorResponse(500, 'Failed to create order: ' + orderError.message)

  const items = ids.map((courseId) => {
    const c = courseMap.get(courseId)!
    return { order_id: order.id, course_id: courseId, title: c.title, price: Number(c.discount_price ?? c.price) || 0 }
  })
  const { error: itemsError } = await supabase.from('order_items').insert(items)
  if (itemsError) {
    await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id)
    return errorResponse(500, 'Failed to create order items: ' + itemsError.message)
  }

  const init = await paystackInitialize(
    guard.profile.email,
    total * 100,
    reference,
    typeof callbackUrl === 'string' && callbackUrl ? callbackUrl : `${FRONTEND_URL}/checkout`,
    { user_id: guard.profile.id, course_ids: ids }
  )
  if ('error' in init) {
    await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id)
    return errorResponse(502, init.error)
  }

  return json({
    order: { id: order.id, total, status: 'pending', paymentMethod: 'paystack', createdAt: new Date().toISOString() },
    authorizationUrl: init.data.authorization_url,
    reference,
    publicKey: PAYSTACK_PUBLIC_KEY || undefined
  }, 201)
}

async function handleCheckoutVerify(req: Request): Promise<Response> {
  const guard = await requireUser(req)
  if (guard instanceof Response) return guard

  const { reference } = await readBody(req)
  if (typeof reference !== 'string' || !reference) return errorResponse(422, 'Payment reference is required.')

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(course_id)')
    .eq('payment_reference', reference)
    .eq('user_id', guard.profile.id)
    .maybeSingle()
  if (!order) return errorResponse(404, 'Order not found.')

  if (order.status === 'completed') {
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', guard.profile.id)
      .in('course_id', (order.order_items ?? []).map((it: { course_id: string }) => it.course_id))
    const rows = (enrollData ?? []) as EnrollmentRow[]
    const coursesEmbedded = await loadEnrollmentCourses(rows)
    return json({
      order: { id: order.id, total: Number(order.total), status: 'completed', paymentMethod: order.payment_method, createdAt: order.created_at },
      enrollments: rows.map((r, i) => mapEnrollment(r, coursesEmbedded[i]))
    })
  }

  const verified = await paystackVerify(reference)
  if ('error' in verified) return errorResponse(502, verified.error)

  if (verified.data.status !== 'success') {
    return errorResponse(400, 'Payment was not completed. Your order is still pending — you can try again.')
  }

  const courseIds = (order.order_items ?? []).map((it: { course_id: string }) => it.course_id)
  try {
    await finalizeOrder(order.id, guard.profile.id, courseIds)
  } catch (err) {
    return errorResponse(500, err instanceof Error ? err.message : 'Failed to complete your order.')
  }

  const { data: enrollData } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', guard.profile.id)
    .in('course_id', courseIds)
  const rows = (enrollData ?? []) as EnrollmentRow[]
  const coursesEmbedded = await loadEnrollmentCourses(rows)
  return json({
    order: { id: order.id, total: Number(order.total), status: 'completed', paymentMethod: order.payment_method, createdAt: order.created_at },
    enrollments: rows.map((r, i) => mapEnrollment(r, coursesEmbedded[i]))
  })
}

async function handlePaystackWebhook(req: Request): Promise<Response> {
  const rawBody = await req.text()
  const valid = await paystackSignatureValid(req, rawBody)
  if (!valid) return errorResponse(401, 'Invalid signature.')

  let payload: { event?: string; data?: { reference?: string } }
  try {
    payload = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } }
  } catch {
    return errorResponse(400, 'Invalid payload.')
  }

  if (payload.event !== 'charge.success' || !payload.data?.reference) {
    return json({ received: true })
  }

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(course_id)')
    .eq('payment_reference', payload.data.reference)
    .maybeSingle()
  if (!order) return json({ received: true })

  if (order.status !== 'completed') {
    const courseIds = (order.order_items ?? []).map((it: { course_id: string }) => it.course_id)
    try {
      await finalizeOrder(order.id, order.user_id, courseIds)
    } catch {
      return errorResponse(500, 'Failed to complete the order.')
    }
  }

  return json({ received: true })
}

async function handleMyOrders(req: Request): Promise<Response> {
  const guard = await requireUser(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', guard.profile.id)
    .order('created_at', { ascending: false })
  if (error) return errorResponse(500, 'Failed to load orders: ' + error.message)

  const orders = (data ?? []).map((o) => ({
    id: o.id,
    userId: o.user_id,
    total: Number(o.total),
    status: o.status,
    paymentMethod: o.payment_method,
    createdAt: o.created_at,
    items: (o.order_items ?? []).map((it: { course_id: string; title: string; price: number }) => ({
      courseId: it.course_id,
      title: it.title,
      price: Number(it.price)
    }))
  }))
  return json({ orders })
}

async function handleMyCertificates(req: Request): Promise<Response> {
  const guard = await requireUser(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('certificates')
    .select('*, courses(id, title, slug, thumbnail, subtitle)')
    .eq('user_id', guard.profile.id)
    .order('issued_at', { ascending: false })
  if (error) return errorResponse(500, 'Failed to load certificates: ' + error.message)

  const certificates = (data ?? []).map((c) => ({
    id: c.id,
    userId: c.user_id,
    courseId: c.course_id,
    instructorId: c.instructor_id,
    issuedAt: c.issued_at,
    completionDate: c.completion_date,
    verificationCode: c.verification_code,
    course: c.courses ? {
      id: c.courses.id,
      title: c.courses.title,
      slug: c.courses.slug,
      thumbnail: c.courses.thumbnail ?? undefined,
      subtitle: c.courses.subtitle ?? undefined
    } : undefined
  }))
  return json({ certificates })
}

async function handleVerifyCertificate(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const idOrCode = url.pathname.split('/').filter(Boolean).at(-1) ?? ''
  if (!idOrCode) return errorResponse(422, 'Certificate id or code is required.')

  const select = '*, courses(id, title, slug, subtitle, has_certificate), profiles!certificates_user_id_fkey(id, name)'

  let data: Record<string, unknown> | null = null
  let error: { message: string } | null = null
  const { data: byCode, error: codeError } = await supabase
    .from('certificates')
    .select(select)
    .eq('verification_code', idOrCode)
    .maybeSingle()
  data = byCode as Record<string, unknown> | null
  error = codeError

  if (!data && !error && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode)) {
    const { data: byId, error: idError } = await supabase
      .from('certificates')
      .select(select)
      .eq('id', idOrCode)
      .maybeSingle()
    data = byId as Record<string, unknown> | null
    error = idError
  }

  if (error) return errorResponse(500, 'Failed to verify certificate: ' + error.message)
  if (!data) return errorResponse(404, 'No certificate matches that id or code.')

  return json({
    certificate: {
      id: data.id,
      userId: data.user_id,
      courseId: data.course_id,
      issuedAt: data.issued_at,
      completionDate: data.completion_date,
      verificationCode: data.verification_code
    },
    course: data.courses ? {
      id: data.courses.id,
      title: data.courses.title,
      slug: data.courses.slug,
      subtitle: data.courses.subtitle ?? undefined
    } : null,
    student: data.profiles ? { id: data.profiles.id, name: data.profiles.name } : null
  })
}

async function handleAdminListEnrollments(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('enrollments')
    .select('*, courses(id, title, thumbnail), profiles!enrollments_user_id_fkey(id, name)')
    .order('enrolled_at', { ascending: false })
    .limit(100)
  if (error) return errorResponse(500, 'Failed to load enrollments: ' + error.message)

  const enrollments = (data ?? []).map((e) => ({
    id: e.id,
    userId: e.user_id,
    studentName: e.profiles?.name ?? 'Student',
    courseId: e.course_id,
    courseTitle: e.courses?.title ?? '',
    courseThumbnail: e.courses?.thumbnail ?? undefined,
    enrolledAt: e.enrolled_at,
    progress: e.progress,
    status: e.status,
    pricePaid: Number(e.price_paid)
  }))
  return json({ enrollments })
}

async function handleAdminListCertificates(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('certificates')
    .select('*, courses(id, title, thumbnail), profiles!certificates_user_id_fkey(id, name)')
    .order('issued_at', { ascending: false })
    .limit(100)
  if (error) return errorResponse(500, 'Failed to load certificates: ' + error.message)

  const certificates = (data ?? []).map((c) => ({
    id: c.id,
    userId: c.user_id,
    studentName: c.profiles?.name ?? 'Student',
    courseId: c.course_id,
    courseTitle: c.courses?.title ?? '',
    courseThumbnail: c.courses?.thumbnail ?? undefined,
    issuedAt: c.issued_at,
    completionDate: c.completion_date,
    verificationCode: c.verification_code
  }))
  return json({ certificates })
}

async function handleAdminListOrders(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), profiles!orders_user_id_fkey(id, name)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return errorResponse(500, 'Failed to load orders: ' + error.message)

  const orders = (data ?? []).map((o) => ({
    id: o.id,
    userId: o.user_id,
    customerName: o.profiles?.name ?? 'Customer',
    total: Number(o.total),
    status: o.status,
    paymentMethod: o.payment_method,
    reference: o.payment_reference ?? undefined,
    createdAt: o.created_at,
    items: (o.order_items ?? []).map((it: { course_id: string; title: string; price: number }) => ({
      courseId: it.course_id,
      title: it.title,
      price: Number(it.price)
    }))
  }))
  return json({ orders })
}

async function handleAdminRefundOrder(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const orderId = url.pathname.split('/').filter(Boolean).at(-2) ?? ''
  if (!orderId) return errorResponse(422, 'Order id is required.')

  const { data: order, error: loadError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()
  if (loadError || !order) return errorResponse(404, 'Order not found.')
  if (order.status === 'refunded') return errorResponse(409, 'This order has already been refunded.')

  if (order.payment_reference && PAYSTACK_SECRET_KEY) {
    try {
      const res = await fetch(`${PAYSTACK_API}/transaction/refund`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: order.payment_reference })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.status) {
        return errorResponse(502, data?.message ?? 'Paystack could not process the refund.')
      }
    } catch {
      return errorResponse(502, 'Could not reach Paystack to process the refund.')
    }
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'refunded' })
    .eq('id', order.id)
  if (updateError) return errorResponse(500, 'Failed to refund order: ' + updateError.message)

  return json({
    order: {
      id: order.id,
      userId: order.user_id,
      total: Number(order.total),
      status: 'refunded',
      paymentMethod: order.payment_method,
      reference: order.payment_reference ?? undefined,
      createdAt: order.created_at
    }
  })
}

// ---------------------------------------------------------------------------
// Payments dashboard
// ---------------------------------------------------------------------------

const INSTRUCTOR_SHARE = 0.7

async function handleAdminPayments(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('orders')
    .select('id, total, status, payment_method, created_at')
    .order('created_at', { ascending: false })
  if (error) return errorResponse(500, 'Failed to load payment data: ' + error.message)

  const orders = (data ?? []) as {
    id: string
    total: number
    status: string
    payment_method: string | null
    created_at: string
  }[]

  let gross = 0
  let refunds = 0
  let completed = 0
  let refundedCount = 0
  const byMethod: Record<string, { count: number; revenue: number }> = {}
  const monthStart = new Date()
  monthStart.setMonth(monthStart.getMonth() - 5)
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthly: { m: string; revenue: number }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(monthStart.getFullYear(), monthStart.getMonth() + i, 1)
    monthly.push({ m: d.toLocaleString('en-US', { month: 'short' }), revenue: 0 })
  }

  for (const o of orders) {
    const total = Number(o.total) || 0
    if (o.status === 'completed') {
      gross += total
      completed++
      const method = o.payment_method || 'other'
      byMethod[method] = byMethod[method] ?? { count: 0, revenue: 0 }
      byMethod[method].count++
      byMethod[method].revenue += total
      const d = new Date(o.created_at)
      if (d >= monthStart) {
        const idx = (d.getFullYear() - monthStart.getFullYear()) * 12 + (d.getMonth() - monthStart.getMonth())
        if (idx >= 0 && idx < 6) monthly[idx].revenue += total
      }
    } else if (o.status === 'refunded') {
      refunds += total
      refundedCount++
    }
  }

  const net = gross - refunds
  const recent = orders.slice(0, 5).map((o) => ({
    id: o.id,
    total: Number(o.total) || 0,
    status: o.status,
    paymentMethod: o.payment_method ?? 'other',
    createdAt: o.created_at
  }))

  return json({
    grossRevenue: gross,
    netRevenue: net,
    refunds,
    instructorPayouts: Math.round(gross * INSTRUCTOR_SHARE),
    orderCount: orders.length,
    completedCount: completed,
    refundedCount,
    monthly,
    byMethod,
    recent
  })
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

async function handleAdminListAnnouncements(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('announcements')
    .select('*, profiles!announcements_author_id_fkey(id, name), courses(id, title)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return errorResponse(500, 'Failed to load announcements: ' + error.message)

  const announcements = (data ?? []).map((a) => ({
    id: a.id,
    authorId: a.author_id,
    authorName: a.profiles?.name ?? 'Admin',
    courseId: a.course_id ?? undefined,
    courseTitle: a.courses?.title ?? undefined,
    title: a.title,
    body: a.body,
    createdAt: a.created_at
  }))
  return json({ announcements })
}

async function handleAdminCreateAnnouncement(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  let body: { title?: string; message?: string; courseId?: string | null }
  try {
    body = await req.json()
  } catch {
    return errorResponse(400, 'Invalid JSON body.')
  }
  const title = (body.title ?? '').trim()
  const message = (body.message ?? '').trim()
  if (!title) return errorResponse(422, 'Announcement title is required.')

  const { data: announcement, error: insertError } = await supabase
    .from('announcements')
    .insert({
      author_id: guard.profile.id,
      course_id: body.courseId || null,
      title,
      body: message
    })
    .select('*')
    .single()
  if (insertError || !announcement) {
    return errorResponse(500, 'Failed to create announcement: ' + (insertError?.message ?? 'unknown error'))
  }

  const { data: users } = await supabase.from('profiles').select('id')
  const userIds = (users ?? []).map((u: { id: string }) => u.id)
  if (userIds.length > 0) {
    const rows = userIds.map((uid: string) => ({
      user_id: uid,
      type: 'announcement',
      title,
      message,
      link: '/notifications'
    }))
    for (let i = 0; i < rows.length; i += 500) {
      await supabase.from('notifications').insert(rows.slice(i, i + 500))
    }
  }

  return json({ announcement: { id: announcement.id, title, body: message, createdAt: announcement.created_at } })
}

async function handleAdminDeleteAnnouncement(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const url = new URL(req.url)
  const id = url.pathname.split('/').filter(Boolean).at(-1) ?? ''
  if (!id) return errorResponse(422, 'Announcement id is required.')

  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) return errorResponse(500, 'Failed to delete announcement: ' + error.message)
  return json({ ok: true })
}

async function handleMyAnnouncements(req: Request): Promise<Response> {
  const guard = await requireUser(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('announcements')
    .select('*, profiles!announcements_author_id_fkey(id, name), courses(id, title)')
    .is('course_id', null)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return errorResponse(500, 'Failed to load announcements: ' + error.message)

  const announcements = (data ?? []).map((a) => ({
    id: a.id,
    authorName: a.profiles?.name ?? 'HamaAcademy',
    title: a.title,
    body: a.body,
    createdAt: a.created_at
  }))
  return json({ announcements })
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

async function handleMyNotifications(req: Request): Promise<Response> {
  const guard = await requireUser(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', guard.profile.id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return errorResponse(500, 'Failed to load notifications: ' + error.message)

  const notifications = (data ?? []).map((n) => ({
    id: n.id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.is_read,
    link: n.link ?? undefined,
    createdAt: n.created_at
  }))
  return json({ notifications })
}

async function handleMarkNotificationsRead(req: Request): Promise<Response> {
  const guard = await requireUser(req)
  if (guard instanceof Response) return guard

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', guard.profile.id)
    .eq('is_read', false)
  if (error) return errorResponse(500, 'Failed to update notifications: ' + error.message)
  return json({ ok: true })
}

// ---------------------------------------------------------------------------
// Admin: reports
// ---------------------------------------------------------------------------

function monthlyBuckets(months: number): { m: string; start: Date; key: number; count?: number; revenue?: number }[] {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  start.setMonth(start.getMonth() - (months - 1))
  const buckets: { m: string; start: Date; key: number; count?: number; revenue?: number }[] = []
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
    buckets.push({ m: d.toLocaleString('en-US', { month: 'short' }), start: d, key: d.getFullYear() * 12 + d.getMonth() })
  }
  return buckets
}

function bucketIndex(d: Date, buckets: { m: string; start: Date; key: number; count?: number; revenue?: number }[]): number {
  const key = d.getFullYear() * 12 + d.getMonth()
  return buckets.findIndex((b) => b.key === key)
}

async function handleAdminReports(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const [profilesRes, coursesRes, ordersRes, certsRes, assessmentsRes, attemptsRes] = await Promise.all([
    supabase.from('profiles').select('id, role, is_active, joined_at'),
    supabase.from('courses').select('id, title, status, rating, review_count, student_count'),
    supabase.from('orders').select('id, total, status, created_at'),
    supabase.from('certificates').select('id, issued_at'),
    supabase.from('assessments').select('id'),
    supabase.from('assessment_attempts').select('score, passed, attempted_at')
  ])
  if (profilesRes.error) return errorResponse(500, 'Failed to load reports: ' + profilesRes.error.message)
  if (coursesRes.error) return errorResponse(500, 'Failed to load reports: ' + coursesRes.error.message)
  if (ordersRes.error) return errorResponse(500, 'Failed to load reports: ' + ordersRes.error.message)
  if (certsRes.error) return errorResponse(500, 'Failed to load reports: ' + certsRes.error.message)
  if (assessmentsRes.error) return errorResponse(500, 'Failed to load reports: ' + assessmentsRes.error.message)
  if (attemptsRes.error) return errorResponse(500, 'Failed to load reports: ' + attemptsRes.error.message)

  const profiles = (profilesRes.data ?? []) as { id: string; role: string; is_active: boolean; joined_at: string }[]
  const courses = (coursesRes.data ?? []) as { id: string; title: string; status: string; rating: number; review_count: number; student_count: number }[]
  const orders = (ordersRes.data ?? []) as { id: string; total: number; status: string; created_at: string }[]
  const certificates = (certsRes.data ?? []) as { id: string; issued_at: string }[]
  const attempts = (attemptsRes.data ?? []) as { score: number; passed: boolean; attempted_at: string }[]

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const userBuckets = monthlyBuckets(6)
  const total = profiles.length
  const students = profiles.filter((p) => p.role === 'student').length
  const instructors = profiles.filter((p) => p.role === 'instructor').length
  const admins = profiles.filter((p) => p.role === 'admin').length
  const newThisMonth = profiles.filter((p) => new Date(p.joined_at) >= monthStart).length
  for (const p of profiles) {
    const i = bucketIndex(new Date(p.joined_at), userBuckets)
    if (i >= 0) userBuckets[i].count = (userBuckets[i].count ?? 0) + 1
  }

  const published = courses.filter((c) => c.status === 'published').length
  const pending = courses.filter((c) => c.status === 'pending').length
  const drafts = courses.filter((c) => c.status === 'draft').length
  const archived = courses.filter((c) => c.status === 'archived').length
  const avgRating = courses.length ? courses.reduce((a, c) => a + Number(c.rating), 0) / courses.length : 0
  const totalReviews = courses.reduce((a, c) => a + c.review_count, 0)
  const topCourses = [...courses].sort((a, b) => b.student_count - a.student_count).slice(0, 5).map((c) => ({
    id: c.id, title: c.title, studentCount: c.student_count, rating: Number(c.rating)
  }))

  let gross = 0
  let refunds = 0
  let completed = 0
  let refunded = 0
  for (const o of orders) {
    const t = Number(o.total) || 0
    if (o.status === 'completed') { gross += t; completed++ }
    else if (o.status === 'refunded') { refunds += t; refunded++ }
  }
  const avgOrderValue = completed ? Math.round((gross / completed) * 100) / 100 : 0

  const certBuckets = monthlyBuckets(6)
  const certThisMonth = certificates.filter((c) => new Date(c.issued_at) >= monthStart).length
  for (const c of certificates) {
    const i = bucketIndex(new Date(c.issued_at), certBuckets)
    if (i >= 0) certBuckets[i].count = (certBuckets[i].count ?? 0) + 1
  }

  const passedAttempts = attempts.filter((a) => a.passed).length
  const passRate = attempts.length ? Math.round((passedAttempts / attempts.length) * 100) : 0

  const settings = await loadSettings()
  const instructorShare = settings?.instructor_share ?? 70

  return json({
    users: {
      total, students, instructors, admins, newThisMonth,
      monthly: userBuckets.map((b) => ({ m: b.m, count: b.count ?? 0 }))
    },
    courses: { total: courses.length, published, pending, drafts, archived, avgRating: Math.round(avgRating * 10) / 10, totalReviews, top: topCourses },
    revenue: { gross, net: gross - refunds, refunds, payouts: Math.round((gross - refunds) * instructorShare / 100), orderCount: orders.length, completed, refunded, avgOrderValue },
    certificates: { total: certificates.length, thisMonth: certThisMonth, monthly: certBuckets.map((b) => ({ m: b.m, count: b.count ?? 0 })) },
    assessments: { totalAssessments: (assessmentsRes.data ?? []).length, attempts: attempts.length, passed: passedAttempts, passRate }
  })
}

async function handleAdminAssessmentAttempts(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const { data, error } = await supabase
    .from('assessment_attempts')
    .select('id, score, passed, attempted_at, user_id, assessment_id, assessments!assessment_attempts_assessment_id_fkey(id, title, course_id, courses(id, title)), profiles!assessment_attempts_user_id_fkey(id, name)')
    .order('attempted_at', { ascending: false })
    .limit(500)
  if (error) return errorResponse(500, 'Failed to load assessment attempts: ' + error.message)

  const attempts = (data ?? []).map((a) => ({
    id: a.id,
    studentName: a.profiles?.name ?? 'Unknown',
    assessmentTitle: a.assessments?.title ?? 'Assessment',
    courseId: a.assessments?.course_id ?? null,
    courseTitle: a.assessments?.courses?.title ?? null,
    score: a.score,
    passed: a.passed,
    attemptedAt: a.attempted_at
  }))
  return json({ attempts })
}

// ---------------------------------------------------------------------------
// Admin: analytics
// ---------------------------------------------------------------------------

async function handleAdminAnalytics(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const [usersRes, enrRes, ordersRes, coursesRes, certsRes] = await Promise.all([
    supabase.from('profiles').select('id, joined_at'),
    supabase.from('enrollments').select('id, status, enrolled_at'),
    supabase.from('orders').select('id, total, status, created_at'),
    supabase.from('courses').select('id, status, category_id, student_count, categories!courses_category_id_fkey(id, name)'),
    supabase.from('certificates').select('id, issued_at')
  ])
  if (usersRes.error) return errorResponse(500, 'Failed to load analytics: ' + usersRes.error.message)
  if (enrRes.error) return errorResponse(500, 'Failed to load analytics: ' + enrRes.error.message)
  if (ordersRes.error) return errorResponse(500, 'Failed to load analytics: ' + ordersRes.error.message)
  if (coursesRes.error) return errorResponse(500, 'Failed to load analytics: ' + coursesRes.error.message)
  if (certsRes.error) return errorResponse(500, 'Failed to load analytics: ' + certsRes.error.message)

  const users = (usersRes.data ?? []) as { id: string; joined_at: string }[]
  const enrollments = (enrRes.data ?? []) as { id: string; status: string; enrolled_at: string }[]
  const orders = (ordersRes.data ?? []) as { id: string; total: number; status: string; created_at: string }[]
  const courses = (coursesRes.data ?? []) as { id: string; status: string; category_id: string; student_count: number; categories?: { id: string; name: string } | null }[]

  const userBuckets = monthlyBuckets(6)
  for (const u of users) {
    const i = bucketIndex(new Date(u.joined_at), userBuckets)
    if (i >= 0) userBuckets[i].count = (userBuckets[i].count ?? 0) + 1
  }

  const enrBuckets = monthlyBuckets(6)
  const active = enrollments.filter((e) => e.status === 'active').length
  const completed = enrollments.filter((e) => e.status === 'completed').length
  for (const e of enrollments) {
    const i = bucketIndex(new Date(e.enrolled_at), enrBuckets)
    if (i >= 0) enrBuckets[i].count = (enrBuckets[i].count ?? 0) + 1
  }

  const revBuckets = monthlyBuckets(6)
  let gross = 0
  let refunds = 0
  for (const o of orders) {
    const t = Number(o.total) || 0
    if (o.status === 'completed') {
      gross += t
      const i = bucketIndex(new Date(o.created_at), revBuckets)
      if (i >= 0) revBuckets[i].revenue = (revBuckets[i].revenue ?? 0) + t
    } else if (o.status === 'refunded') refunds += t
  }

  const certBuckets = monthlyBuckets(6)
  for (const c of certsRes.data ?? []) {
    const i = bucketIndex(new Date((c as { issued_at: string }).issued_at), certBuckets)
    if (i >= 0) certBuckets[i].count = (certBuckets[i].count ?? 0) + 1
  }

  const byCategory: { id: string; name: string; count: number; students: number }[] = []
  const catMap = new Map<string, { id: string; name: string; count: number; students: number }>()
  for (const c of courses) {
    const key = c.category_id
    if (!catMap.has(key)) {
      catMap.set(key, { id: key, name: c.categories?.name ?? 'Uncategorized', count: 0, students: 0 })
      byCategory.push(catMap.get(key)!)
    }
    const cat = catMap.get(key)!
    cat.count++
    cat.students += c.student_count
  }

  return json({
    users: { total: users.length, monthly: userBuckets.map((b) => ({ m: b.m, count: b.count ?? 0 })) },
    enrollments: { total: enrollments.length, active, completed, monthly: enrBuckets.map((b) => ({ m: b.m, count: b.count ?? 0 })) },
    revenue: { gross, net: gross - refunds, refunds, monthly: revBuckets.map((b) => ({ m: b.m, revenue: Math.round(b.revenue ?? 0) })) },
    courses: { total: courses.length, published: courses.filter((c) => c.status === 'published').length, byCategory },
    certificates: { total: (certsRes.data ?? []).length, monthly: certBuckets.map((b) => ({ m: b.m, count: b.count ?? 0 })) }
  })
}

// ---------------------------------------------------------------------------
// Admin: settings
// ---------------------------------------------------------------------------

interface SettingsRow {
  platform_name: string
  support_email: string
  default_currency: string
  instructor_share: number
  primary_color: string
  tagline: string
  refund_window_days: number
  passing_score: number
  welcome_email: boolean
  completion_email: boolean
  assignment_reminders: boolean
  weekly_digest: boolean
  updated_at: string
}

function mapSettings(s: SettingsRow) {
  return {
    platformName: s.platform_name,
    supportEmail: s.support_email,
    defaultCurrency: s.default_currency,
    instructorShare: s.instructor_share,
    primaryColor: s.primary_color,
    tagline: s.tagline,
    refundWindowDays: s.refund_window_days,
    passingScore: s.passing_score,
    welcomeEmail: s.welcome_email,
    completionEmail: s.completion_email,
    assignmentReminders: s.assignment_reminders,
    weeklyDigest: s.weekly_digest,
    paymentProvider: 'paystack',
    updatedAt: s.updated_at
  }
}

async function loadSettings(): Promise<SettingsRow | null> {
  const { data, error } = await supabase.from('platform_settings').select('*').eq('id', true).maybeSingle()
  if (error || !data) return null
  return data as SettingsRow
}

async function handleAdminGetSettings(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard
  const settings = await loadSettings()
  if (!settings) return errorResponse(500, 'Platform settings are not configured.')
  return json({ settings: { ...mapSettings(settings), paystackPublicKey: PAYSTACK_PUBLIC_KEY } })
}

async function handleAdminUpdateSettings(req: Request): Promise<Response> {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  const body = await readBody(req)
  const patch: Record<string, unknown> = {}
  if (typeof body.platformName === 'string' && body.platformName.trim()) patch.platform_name = body.platformName.trim()
  if (typeof body.supportEmail === 'string') patch.support_email = body.supportEmail.trim()
  if (typeof body.defaultCurrency === 'string' && body.defaultCurrency.trim()) patch.default_currency = body.defaultCurrency.trim()
  if (body.instructorShare !== undefined && typeof body.instructorShare === 'number') patch.instructor_share = Math.min(100, Math.max(0, Math.round(body.instructorShare)))
  if (typeof body.primaryColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.primaryColor)) patch.primary_color = body.primaryColor
  if (typeof body.tagline === 'string') patch.tagline = body.tagline.trim()
  if (body.refundWindowDays !== undefined && typeof body.refundWindowDays === 'number') patch.refund_window_days = Math.max(0, Math.round(body.refundWindowDays))
  if (body.passingScore !== undefined && typeof body.passingScore === 'number') patch.passing_score = Math.min(100, Math.max(0, Math.round(body.passingScore)))
  if (typeof body.welcomeEmail === 'boolean') patch.welcome_email = body.welcomeEmail
  if (typeof body.completionEmail === 'boolean') patch.completion_email = body.completionEmail
  if (typeof body.assignmentReminders === 'boolean') patch.assignment_reminders = body.assignmentReminders
  if (typeof body.weeklyDigest === 'boolean') patch.weekly_digest = body.weeklyDigest
  patch.updated_at = new Date().toISOString()

  if (Object.keys(patch).length <= 1) return json({ settings: mapSettings((await loadSettings()) as SettingsRow) })

  const { data, error } = await supabase
    .from('platform_settings')
    .update(patch)
    .eq('id', true)
    .select('*')
    .single()
  if (error) return errorResponse(500, 'Failed to save settings: ' + error.message)
  return json({ settings: mapSettings(data as SettingsRow) })
}

async function handlePublicSettings(req: Request): Promise<Response> {
  const { data, error } = await supabase.from('platform_settings').select('*').eq('id', true).maybeSingle()
  if (error) return errorResponse(500, 'Failed to load settings: ' + error.message)
  if (!data) return errorResponse(500, 'Platform settings are not configured.')
  const settings = data as SettingsRow
  return json({
    settings: {
      platformName: settings.platform_name,
      tagline: settings.tagline,
      primaryColor: settings.primary_color,
      supportEmail: settings.support_email,
      defaultCurrency: settings.default_currency,
      paystackPublicKey: PAYSTACK_PUBLIC_KEY
    }
  })
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const url = new URL(req.url)
  // Extract the route segment after the function name, regardless of prefix.
  // Accepts /functions/v1/auth/register, /auth/register, or /register.
  const pathname = url.pathname.replace(/\/+$/, '')
  const idx = pathname.lastIndexOf('/auth')
  const path = (idx >= 0 ? pathname.slice(idx + '/auth'.length) : pathname) || '/'
  const method = req.method.toUpperCase()

  let response: Response
  switch (`${method} ${path}`) {
    case 'POST /register':
      response = await handleRegister(req)
      break
    case 'POST /login':
      response = await handleLogin(req)
      break
    case 'GET /me':
      response = await handleMe(req)
      break
    case 'POST /logout':
      response = await handleLogout(req)
      break
    case 'PATCH /profile':
      response = await handleProfile(req)
      break
    case 'POST /change-password':
      response = await handleChangePassword(req)
      break
    case 'GET /me/preferences':
      response = await handleMyPreferences(req)
      break
    case 'PUT /me/preferences':
      response = await handleUpdateMyPreferences(req)
      break
    case 'POST /me/email':
      response = await handleChangeEmail(req)
      break
    case 'POST /me/avatar':
      response = await handleUploadAvatar(req)
      break
    case 'GET /me/sessions':
      response = await handleMySessions(req)
      break
    case 'POST /me/sessions/revoke':
      response = await handleRevokeSessions(req)
      break
    case 'DELETE /account':
      response = await handleDeleteAccount(req)
      break
    case 'POST /forgot-password':
      response = await handleForgotPassword(req)
      break
    case 'POST /reset-password':
      response = await handleResetPassword(req)
      break
    case 'POST /verify-email':
      response = await handleVerifyEmail(req)
      break
    case 'GET /admin/users':
      response = await handleAdminListUsers(req)
      break
    case 'POST /admin/users':
      response = await handleAdminCreateUser(req)
      break
    case 'PATCH /admin/users':
    case 'PATCH /admin/users/remove':
      response = await handleAdminUpdateUser(req)
      break
    case 'DELETE /admin/users':
    case 'DELETE /admin/users/remove':
      response = await handleAdminDeleteUser(req)
      break
    case 'GET /admin/courses':
      response = await handleAdminListCourses(req)
      break
    case 'POST /admin/courses':
      response = await handleAdminCreateCourse(req)
      break
    case 'PATCH /admin/courses':
    case 'PATCH /admin/courses/remove':
      response = await handleAdminUpdateCourse(req)
      break
    case 'DELETE /admin/courses':
    case 'DELETE /admin/courses/remove':
      response = await handleAdminDeleteCourse(req)
      break
    case 'GET /admin/categories':
      response = await handleAdminListCategories(req)
      break
    case 'POST /admin/categories':
      response = await handleAdminCreateCategory(req)
      break
    case 'GET /admin/instructors':
      response = await handleAdminListInstructors(req)
      break
    case 'GET /me/enrollments':
      response = await handleMyEnrollments(req)
      break
    case 'POST /me/enrollments':
      response = await handleEnroll(req)
      break
    case 'GET /me/orders':
      response = await handleMyOrders(req)
      break
    case 'GET /me/certificates':
      response = await handleMyCertificates(req)
      break
    case 'POST /checkout':
      response = await handleCheckout(req)
      break
    case 'POST /checkout/verify':
      response = await handleCheckoutVerify(req)
      break
    case 'POST /webhook/paystack':
      response = await handlePaystackWebhook(req)
      break
    case 'GET /admin/enrollments':
      response = await handleAdminListEnrollments(req)
      break
    case 'GET /admin/certificates':
      response = await handleAdminListCertificates(req)
      break
    case 'GET /admin/orders':
      response = await handleAdminListOrders(req)
      break
    case 'GET /admin/payments':
      response = await handleAdminPayments(req)
      break
    case 'GET /admin/announcements':
      response = await handleAdminListAnnouncements(req)
      break
    case 'POST /admin/announcements':
      response = await handleAdminCreateAnnouncement(req)
      break
    case 'GET /me/announcements':
      response = await handleMyAnnouncements(req)
      break
    case 'GET /me/notifications':
      response = await handleMyNotifications(req)
      break
    case 'POST /me/notifications/read':
      response = await handleMarkNotificationsRead(req)
      break
    case 'GET /courses':
    case 'GET /courses/list':
      response = await handleListCourses(req)
      break
    case 'GET /me/courses':
      response = await handleMyCourses(req)
      break
    case 'GET /categories':
      response = await handleListCategories(req)
      break
    case 'GET /settings':
      response = await handlePublicSettings(req)
      break
    case 'GET /admin/reports':
      response = await handleAdminReports(req)
      break
    case 'GET /admin/analytics':
      response = await handleAdminAnalytics(req)
      break
    case 'GET /admin/assessment-attempts':
      response = await handleAdminAssessmentAttempts(req)
      break
    case 'GET /admin/settings':
      response = await handleAdminGetSettings(req)
      break
    case 'PUT /admin/settings':
      response = await handleAdminUpdateSettings(req)
      break
    default:
      if (/^\/admin\/users\/[^/]+$/.test(path)) {
        if (method === 'PATCH') response = await handleAdminUpdateUser(req)
        else if (method === 'DELETE') response = await handleAdminDeleteUser(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else if (/^\/admin\/courses\/[^/]+\/full$/.test(path)) {
        if (method === 'GET') response = await handleAdminGetCourseFull(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else if (/^\/admin\/courses\/[^/]+\/content$/.test(path)) {
        if (method === 'PUT') response = await handleAdminSaveCourseContent(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else if (/^\/admin\/courses\/[^/]+$/.test(path)) {
        if (method === 'PATCH') response = await handleAdminUpdateCourse(req)
        else if (method === 'DELETE') response = await handleAdminDeleteCourse(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else if (/^\/courses\/[^/]+\/full$/.test(path)) {
        if (method === 'GET') response = await handleGetCourseFull(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else if (/^\/me\/enrollments\/[^/]+$/.test(path)) {
        if (method === 'PATCH') response = await handleUpdateEnrollment(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else if (/^\/admin\/categories\/[^/]+$/.test(path)) {
        if (method === 'PATCH') response = await handleAdminUpdateCategory(req)
        else if (method === 'DELETE') response = await handleAdminDeleteCategory(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else if (/^\/admin\/orders\/[^/]+\/refund$/.test(path)) {
        if (method === 'POST') response = await handleAdminRefundOrder(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else if (/^\/admin\/announcements\/[^/]+$/.test(path)) {
        if (method === 'DELETE') response = await handleAdminDeleteAnnouncement(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else if (/^\/verify-certificate\/[^/]+$/.test(path)) {
        if (method === 'GET') response = await handleVerifyCertificate(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else {
        response = errorResponse(404, 'API endpoint not found.')
      }
  }

  return response
})