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
    default:
      if (/^\/admin\/users\/[^/]+$/.test(path)) {
        if (method === 'PATCH') response = await handleAdminUpdateUser(req)
        else if (method === 'DELETE') response = await handleAdminDeleteUser(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else if (/^\/admin\/courses\/[^/]+$/.test(path)) {
        if (method === 'PATCH') response = await handleAdminUpdateCourse(req)
        else if (method === 'DELETE') response = await handleAdminDeleteCourse(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else if (/^\/admin\/categories\/[^/]+$/.test(path)) {
        if (method === 'PATCH') response = await handleAdminUpdateCategory(req)
        else if (method === 'DELETE') response = await handleAdminDeleteCategory(req)
        else response = errorResponse(404, 'API endpoint not found.')
      } else {
        response = errorResponse(404, 'API endpoint not found.')
      }
  }

  return response
})