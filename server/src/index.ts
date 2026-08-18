import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

const app = express()
const PORT = Number(process.env.PORT ?? 8787)
const FRONTEND_URL = (process.env.FRONTEND_URL ?? 'http://localhost:5174').replace(/\/+$/, '')
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? FRONTEND_URL)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(express.json())

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  const header = req.headers.authorization ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1] : null
}

async function authUser(req: Request): Promise<User | null> {
  const token = bearerToken(req)
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

function handle(
  fn: (req: Request, res: Response) => Promise<unknown>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    fn(req, res).catch(next)
  }
}

const err = (res: Response, status: number, message: string) =>
  res.status(status).json({ error: message })

function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

app.post('/api/auth/register', handle(async (req, res) => {
  const { name, email, password, role } = req.body as Record<string, unknown>

  if (typeof name !== 'string' || !name.trim()) return err(res, 422, 'Name is required.')
  if (!isEmail(email)) return err(res, 422, 'A valid email is required.')
  if (typeof password !== 'string' || password.length < 8) return err(res, 422, 'Password must be at least 8 characters.')
  if (role !== undefined && role !== 'student' && role !== 'instructor') return err(res, 422, 'Role must be "student" or "instructor".')

  const chosenRole: 'student' | 'instructor' = role === 'instructor' ? 'instructor' : 'student'

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), role: chosenRole }
  })
  if (error) {
    if (/already registered/i.test(error.message)) return err(res, 409, 'An account with this email already exists.')
    return err(res, 400, error.message)
  }

  if (chosenRole === 'instructor') {
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'instructor' })
      .eq('id', data.user!.id)
    if (roleError) return err(res, 500, 'Failed to assign role.')
  }

  const session = await supabase.auth.signInWithPassword({ email, password })
  if (session.error) return err(res, 500, 'Account created but login failed. Please sign in.')

  const profile = await getProfile(data.user!.id)
  if (!profile) return err(res, 500, 'Account created but profile could not be loaded.')

  res.status(201).json({ user: mapProfile(profile), token: session.data.session!.access_token })
}))

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

app.post('/api/auth/login', handle(async (req, res) => {
  const { email, password } = req.body as Record<string, unknown>
  if (!isEmail(email) || typeof password !== 'string' || !password) return err(res, 422, 'Email and password are required.')

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (/not confirmed/i.test(error.message)) return err(res, 403, 'Please confirm your email address before signing in.')
    return err(res, 401, 'Invalid email or password.')
  }

  const profile = await getProfile(data.user.id)
  if (!profile) return err(res, 401, 'No profile found for this account.')
  if (!profile.is_active) return err(res, 403, 'This account has been disabled.')

  res.json({ user: mapProfile(profile), token: data.session.access_token })
}))

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

app.get('/api/auth/me', handle(async (req, res) => {
  const user = await authUser(req)
  if (!user) return err(res, 401, 'Not authenticated.')

  const profile = await getProfile(user.id)
  if (!profile) return err(res, 401, 'No profile found for this account.')

  res.json({ user: mapProfile(profile) })
}))

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

app.post('/api/auth/logout', handle(async (req, res) => {
  const token = bearerToken(req)
  if (token) {
    try {
      await supabase.auth.admin.signOut(token)
    } catch {
      /* best effort — client clears its token regardless */
    }
  }
  res.status(204).end()
}))

// ---------------------------------------------------------------------------
// PATCH /api/auth/profile
// ---------------------------------------------------------------------------

const PROFILE_FIELDS = ['name', 'avatar', 'title', 'bio', 'skills', 'headline', 'website'] as const

app.patch('/api/auth/profile', handle(async (req, res) => {
  const user = await authUser(req)
  if (!user) return err(res, 401, 'Not authenticated.')

  const patch: Record<string, unknown> = {}
  for (const field of PROFILE_FIELDS) {
    if (req.body[field] !== undefined) patch[field] = req.body[field]
  }
  if (patch.name !== undefined && (typeof patch.name !== 'string' || !patch.name.trim())) {
    return err(res, 422, 'Name must be a non-empty string.')
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
    if (error) return err(res, 400, error.message)
  }

  const profile = await getProfile(user.id)
  if (!profile) return err(res, 500, 'Profile could not be loaded.')

  res.json({ user: mapProfile(profile) })
}))

// ---------------------------------------------------------------------------
// POST /api/auth/change-password
// ---------------------------------------------------------------------------

app.post('/api/auth/change-password', handle(async (req, res) => {
  const user = await authUser(req)
  if (!user) return err(res, 401, 'Not authenticated.')

  const { currentPassword, newPassword } = req.body as Record<string, unknown>
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return err(res, 422, 'Current and new passwords are required.')
  }
  if (newPassword.length < 8) return err(res, 422, 'New password must be at least 8 characters.')

  const check = await supabase.auth.signInWithPassword({ email: user.email!, password: currentPassword })
  if (check.error) return err(res, 400, 'Current password is incorrect.')

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
  if (error) return err(res, 400, error.message)

  res.json({ message: 'Password updated.' })
}))

// ---------------------------------------------------------------------------
// DELETE /api/auth/account
// ---------------------------------------------------------------------------

app.delete('/api/auth/account', handle(async (req, res) => {
  const user = await authUser(req)
  if (!user) return err(res, 401, 'Not authenticated.')

  const { error } = await supabase.auth.admin.deleteUser(user.id)
  if (error) return err(res, 400, error.message)

  res.status(204).end()
}))

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------------

app.post('/api/auth/forgot-password', handle(async (req, res) => {
  const { email } = req.body as Record<string, unknown>
  if (!isEmail(email)) return err(res, 422, 'A valid email is required.')

  // Do not leak whether the account exists — same response either way.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${FRONTEND_URL}/reset-password`
  })

  res.json({ message: 'If that email exists, a reset link has been sent.' })
}))

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------------

app.post('/api/auth/reset-password', handle(async (req, res) => {
  const { token, password } = req.body as Record<string, unknown>
  if (typeof token !== 'string' || !token) return err(res, 400, 'Invalid or expired reset token.')
  if (typeof password !== 'string' || password.length < 8) return err(res, 422, 'Password must be at least 8 characters.')

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'recovery'
  })
  if (error || !data.user) return err(res, 400, 'Invalid or expired reset token.')

  const { error: pwError } = await supabase.auth.admin.updateUserById(data.user.id, { password })
  if (pwError) return err(res, 400, pwError.message)

  res.json({ message: 'Password updated.' })
}))

// ---------------------------------------------------------------------------
// POST /api/auth/verify-email
// ---------------------------------------------------------------------------

app.post('/api/auth/verify-email', handle(async (req, res) => {
  const { token } = req.body as Record<string, unknown>
  if (typeof token !== 'string' || !token) return err(res, 400, 'Invalid or expired verification token.')

  const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: 'email' })
  if (error) return err(res, 400, 'Invalid or expired verification token.')

  res.json({ message: 'Email verified.' })
}))

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

app.use('/api', (_req, res) => err(res, 404, 'API endpoint not found.'))
app.use((error: unknown, _req: Request, res: Response) => {
  console.error(error)
  err(res, 500, 'Something went wrong. Please try again.')
})

app.listen(PORT, () => {
  console.log(`HamaAcademy API listening on http://localhost:${PORT}`)
  console.log(`Frontend origin: ${FRONTEND_URL}`)
})