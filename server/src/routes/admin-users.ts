import { Request, Response, Router } from 'express'
import { supabase } from '../supabase'
import { authUser, err, handle } from '../utils'

const router = Router()

// ---------------------------------------------------------------------------
// Middleware: require admin role
// ---------------------------------------------------------------------------

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const user = await authUser(req)
  if (!user) {
    err(res, 401, 'Not authenticated.')
    return false
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile) {
    err(res, 401, 'Profile not found.')
    return false
  }

  if (!profile.is_active) {
    err(res, 403, 'Your account has been disabled.')
    return false
  }

  if (profile.role !== 'admin') {
    err(res, 403, 'Admin access required.')
    return false
  }

  return true
}

// ---------------------------------------------------------------------------
// GET /api/auth/admin/users
// List all users with pagination and filtering
// ---------------------------------------------------------------------------

router.get('/users', handle(async (req, res) => {
  if (!(await requireAdmin(req, res))) return

  const search = (req.query.search as string) || ''
  const role = (req.query.role as string) || 'all'
  const status = (req.query.status as string) || 'all'
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage as string) || 25))

  // Build query
  let query = supabase.from('profiles').select('*', { count: 'exact' })

  // Filter by search (name or email)
  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  // Filter by role
  if (role && role !== 'all') {
    query = query.eq('role', role)
  }

  // Filter by status
  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'suspended') {
    query = query.eq('is_active', false)
  }

  // Pagination
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  query = query.range(from, to).order('joined_at', { ascending: false })

  const { data: profiles, error, count } = await query

  if (error) {
    return err(res, 400, error.message)
  }

  // Get auth metadata for last sign in times
  const userIds = profiles?.map((p: any) => p.id) || []
  const authUsers = await Promise.all(
    userIds.map(async (id) => {
      try {
        const { data } = await supabase.auth.admin.getUserById(id)
        return data.user
      } catch {
        return null
      }
    })
  )

  // Map profiles to response format
  const users = (profiles || []).map((profile: any, index: number) => {
    const authUser = authUsers[index]
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar || undefined,
      title: profile.title || undefined,
      bio: profile.bio || undefined,
      isActive: profile.is_active,
      joinedAt: profile.joined_at,
      lastSignInAt: authUser?.last_sign_in_at || undefined
    }
  })

  res.json({
    users,
    total: count || 0,
    page,
    perPage,
    hasMore: (count || 0) > page * perPage
  })
}))

// ---------------------------------------------------------------------------
// POST /api/auth/admin/users
// Create a new user
// ---------------------------------------------------------------------------

router.post('/users', handle(async (req, res) => {
  if (!(await requireAdmin(req, res))) return

  const { name, email, password, role } = req.body as Record<string, unknown>

  // Validation
  if (typeof name !== 'string' || !name.trim()) {
    return err(res, 422, 'Name is required.')
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return err(res, 422, 'A valid email is required.')
  }
  if (typeof password !== 'string' || password.length < 8) {
    return err(res, 422, 'Password must be at least 8 characters.')
  }
  if (
    role !== 'student' &&
    role !== 'instructor' &&
    role !== 'admin' &&
    role !== 'support'
  ) {
    return err(res, 422, 'Role must be one of: student, instructor, admin, support.')
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), role }
  })

  if (authError) {
    if (/already registered/i.test(authError.message)) {
      return err(res, 409, 'An account with this email already exists.')
    }
    return err(res, 400, authError.message)
  }

  // Update profile with correct role (in case it wasn't set by trigger)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', authData.user!.id)

  if (profileError) {
    // Rollback: delete the auth user
    await supabase.auth.admin.deleteUser(authData.user!.id)
    return err(res, 500, 'Failed to create profile.')
  }

  // Fetch the created profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user!.id)
    .single()

  if (!profile) {
    return err(res, 500, 'User created but profile could not be loaded.')
  }

  res.status(201).json({
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar || undefined,
      title: profile.title || undefined,
      bio: profile.bio || undefined,
      isActive: profile.is_active,
      joinedAt: profile.joined_at
    }
  })
}))

// ---------------------------------------------------------------------------
// PATCH /api/auth/admin/users/:id
// Update a user
// ---------------------------------------------------------------------------

router.patch('/users/:id', handle(async (req, res) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params
  const { name, role, is_active, title, bio } = req.body as Record<string, unknown>

  // Build update object
  const updates: Record<string, unknown> = {}
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return err(res, 422, 'Name must be a non-empty string.')
    }
    updates.name = name.trim()
  }
  if (role !== undefined) {
    if (
      role !== 'student' &&
      role !== 'instructor' &&
      role !== 'admin' &&
      role !== 'support'
    ) {
      return err(res, 422, 'Role must be one of: student, instructor, admin, support.')
    }
    updates.role = role
  }
  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      return err(res, 422, 'is_active must be a boolean.')
    }
    updates.is_active = is_active
  }
  if (title !== undefined) updates.title = title
  if (bio !== undefined) updates.bio = bio

  if (Object.keys(updates).length === 0) {
    return err(res, 422, 'No valid fields to update.')
  }

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)

  if (updateError) {
    return err(res, 400, updateError.message)
  }

  // Fetch updated profile
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !profile) {
    return err(res, 404, 'User not found.')
  }

  res.json({
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar || undefined,
      title: profile.title || undefined,
      bio: profile.bio || undefined,
      isActive: profile.is_active,
      joinedAt: profile.joined_at
    }
  })
}))

// ---------------------------------------------------------------------------
// DELETE /api/auth/admin/users/:id
// Delete a user
// ---------------------------------------------------------------------------

router.delete('/users/:id', handle(async (req, res) => {
  if (!(await requireAdmin(req, res))) return

  const { id } = req.params

  // Prevent self-deletion
  const currentUser = await authUser(req)
  if (currentUser?.id === id) {
    return err(res, 400, 'You cannot delete your own account.')
  }

  // Check if user exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', id)
    .single()

  if (!profile) {
    return err(res, 404, 'User not found.')
  }

  // Delete from Supabase Auth (cascade will handle profile deletion)
  const { error } = await supabase.auth.admin.deleteUser(id)

  if (error) {
    return err(res, 400, error.message)
  }

  res.status(204).end()
}))

export default router
