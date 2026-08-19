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

// Creates the profile row on demand if it's missing (e.g. signup trigger absent
// or accounts created before grants were in place). Self-healing for login/me.
async function ensureProfile(user: { id: string; email?: string }): Promise<{ profile: ProfileRow | null; error?: string }> {
  const existing = await getProfile(user.id)
  if (existing) return { profile: existing }
  const { error } = await supabase.from('profiles').upsert(
    { id: user.id, name: (user.email?.split('@')[0] ?? 'User') || 'User', email: user.email ?? '', role: 'student' },
    { onConflict: 'id' }
  )
  if (error) return { profile: null, error: error.message }
  return { profile: await getProfile(user.id) }
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

  // Ensure the profile row exists even if the signup trigger isn't installed.
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: data.user!.id, name: name.trim(), email, role: chosenRole }, { onConflict: 'id' })
  if (profileError) return errorResponse(500, 'Failed to create profile: ' + profileError.message)

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

  const { profile, error: profileErr } = await ensureProfile({ id: data.user.id, email: data.user.email })
  if (!profile) return errorResponse(401, profileErr ?? 'No profile found for this account.')
  if (!profile.is_active) return errorResponse(403, 'This account has been disabled.')

  return json({ user: mapProfile(profile), token: data.session.access_token })
}

async function handleMe(req: Request): Promise<Response> {
  const user = await authUser(req)
  if (!user) return errorResponse(401, 'Not authenticated.')

  const { profile, error: profileErr } = await ensureProfile(user)
  if (!profile) return errorResponse(401, profileErr ?? 'No profile found for this account.')

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
  const users = await Promise.all(rows.map(async (r) => {
    const { data: au } = await supabase.auth.admin.getUserById(r.id)
    return {
      ...mapProfile(r),
      lastSignInAt: au?.user?.last_sign_in_at ?? undefined
    }
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

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), role }
  })
  if (error) {
    if (/already registered/i.test(error.message)) return errorResponse(409, 'An account with this email already exists.')
    return errorResponse(400, error.message)
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    { id: data.user!.id, name: name.trim(), email, role },
    { onConflict: 'id' }
  )
  if (profileError) return errorResponse(500, 'Failed to create profile: ' + profileError.message)

  const profile = await getProfile(data.user!.id)
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

  if (patch.is_active !== undefined) {
    // Keep GoTrue ban state in sync so suspended users cannot sign in.
    const { error: banError } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: patch.is_active ? 'none' : '87600h'
    })
    if (banError) return errorResponse(500, 'Failed to update account status: ' + banError.message)
  }

  if (patch.name !== undefined) {
    const metadata = { name: patch.name, role: patch.role ?? target.role }
    await supabase.auth.admin.updateUserById(id, { user_metadata: metadata })
  }

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

  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return errorResponse(500, 'Failed to delete user: ' + error.message)

  return new Response(null, { status: 204, headers: corsHeaders })
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
    default:
      if (/^\/admin\/users\/[^/]+$/.test(path)) {
        if (method === 'PATCH') response = await handleAdminUpdateUser(req)
        else if (method === 'DELETE') response = await handleAdminDeleteUser(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else {
        response = errorResponse(404, 'API endpoint not found.')
      }
  }

  return response
})