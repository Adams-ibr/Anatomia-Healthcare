import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const FRONTEND_URL = (Deno.env.get('FRONTEND_URL') ?? 'https://www.hamaacademy.com').replace(/\/+$/, '')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// ---------------------------------------------------------------------------
// CORS / helpers
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') ?? '')
  return match ? match[1] : null
}

async function authUser(req: Request): Promise<{ id: string; email?: string } | null> {
  const token = bearerToken(req)
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email }
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
// Handlers
// ---------------------------------------------------------------------------

async function handleRegister(req: Request): Promise<Response> {
  const { name, email, password, role } = await readBody(req)

  if (typeof name !== 'string' || !name.trim()) return errorResponse(422, 'Name is required.')
  if (!isEmail(email)) return errorResponse(422, 'A valid email is required.')
  if (typeof password !== 'string' || password.length < 8) return errorResponse(422, 'Password must be at least 8 characters.')
  if (role !== undefined && role !== 'student' && role !== 'instructor') return errorResponse(422, 'Role must be "student" or "instructor".')

  const chosenRole: 'student' | 'instructor' = role === 'instructor' ? 'instructor' : 'student'

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), role: chosenRole }
  })
  if (error) {
    if (/already registered/i.test(error.message)) return errorResponse(409, 'An account with this email already exists.')
    return errorResponse(400, error.message)
  }

  if (chosenRole === 'instructor') {
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'instructor' })
      .eq('id', data.user!.id)
    if (roleError) return errorResponse(500, 'Failed to assign role.')
  }

  const session = await supabase.auth.signInWithPassword({ email, password })
  if (session.error) return errorResponse(500, 'Account created but login failed. Please sign in.')

  const profile = await getProfile(data.user!.id)
  if (!profile) return errorResponse(500, 'Account created but profile could not be loaded.')

  return json({ user: mapProfile(profile), token: session.data.session!.access_token }, 201)
}

async function handleLogin(req: Request): Promise<Response> {
  const { email, password } = await readBody(req)
  if (!isEmail(email) || typeof password !== 'string' || !password) return errorResponse(422, 'Email and password are required.')

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (/not confirmed/i.test(error.message)) return errorResponse(403, 'Please confirm your email address before signing in.')
    return errorResponse(401, 'Invalid email or password.')
  }

  const profile = await getProfile(data.user.id)
  if (!profile) return errorResponse(401, 'No profile found for this account.')
  if (!profile.is_active) return errorResponse(403, 'This account has been disabled.')

  return json({ user: mapProfile(profile), token: data.session.access_token })
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
    try {
      await supabase.auth.admin.signOut(token)
    } catch {
      /* best effort */
    }
  }
  return new Response(null, { status: 204, headers: corsHeaders })
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
  if (!user || !user.email) return errorResponse(401, 'Not authenticated.')

  const { currentPassword, newPassword } = await readBody(req)
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return errorResponse(422, 'Current and new passwords are required.')
  }
  if (newPassword.length < 8) return errorResponse(422, 'New password must be at least 8 characters.')

  const check = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
  if (check.error) return errorResponse(400, 'Current password is incorrect.')

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
  if (error) return errorResponse(400, error.message)

  return json({ message: 'Password updated.' })
}

async function handleDeleteAccount(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')

  const { error } = await supabase.auth.admin.deleteUser(user.id)
  if (error) return errorResponse(400, error.message)

  return new Response(null, { status: 204, headers: corsHeaders })
}

async function handleForgotPassword(req: Request): Promise<Response> {
  const { email } = await readBody(req)
  if (!isEmail(email)) return errorResponse(422, 'A valid email is required.')

  // Do not leak whether the account exists — same response either way.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${FRONTEND_URL}/reset-password`
  })

  return json({ message: 'If that email exists, a reset link has been sent.' })
}

async function handleResetPassword(req: Request): Promise<Response> {
  const { token, password } = await readBody(req)
  if (typeof token !== 'string' || !token) return errorResponse(400, 'Invalid or expired reset token.')
  if (typeof password !== 'string' || password.length < 8) return errorResponse(422, 'Password must be at least 8 characters.')

  const { data, error } = await supabase.auth.verifyOtp({ token_hash: token, type: 'recovery' })
  if (error || !data.user) return errorResponse(400, 'Invalid or expired reset token.')

  const { error: pwError } = await supabase.auth.admin.updateUserById(data.user.id, { password })
  if (pwError) return errorResponse(400, pwError.message)

  return json({ message: 'Password updated.' })
}

async function handleVerifyEmail(req: Request): Promise<Response> {
  const { token } = await readBody(req)
  if (typeof token !== 'string' || !token) return errorResponse(400, 'Invalid or expired verification token.')

  const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: 'email' })
  if (error) return errorResponse(400, 'Invalid or expired verification token.')

  return json({ message: 'Email verified.' })
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
    default:
      response = errorResponse(404, 'API endpoint not found.')
  }

  return response
})