import { Router } from 'express'
import { supabase } from '../supabase'
import { authUser, err, handle } from '../utils'

const router = Router()

// ---------------------------------------------------------------------------
// GET /api/courses
// List all courses with pagination and filtering
// ---------------------------------------------------------------------------

router.get('/', handle(async (req, res) => {
  const search = (req.query.search as string) || ''
  const status = (req.query.status as string) || 'published'
  const category = (req.query.category as string) || ''
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage as string) || 12))

  // Build query
  let query = supabase.from('courses').select('*', { count: 'exact' })

  // Filter by search
  if (search.trim()) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Filter by status
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Filter by category
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  // Pagination
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  query = query.range(from, to).order('created_at', { ascending: false })

  const { data: courses, error, count } = await query

  if (error) {
    return err(res, 400, error.message)
  }

  res.json({
    courses: courses || [],
    total: count || 0,
    page,
    perPage,
    hasMore: (count || 0) > page * perPage
  })
}))

// ---------------------------------------------------------------------------
// GET /api/courses/:id
// Get a single course by ID
// ---------------------------------------------------------------------------

router.get('/:id', handle(async (req, res) => {
  const { id } = req.params

  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      profiles:instructor_id (
        id,
        name,
        avatar,
        title,
        bio
      )
    `)
    .eq('id', id)
    .single()

  if (error || !course) {
    return err(res, 404, 'Course not found.')
  }

  // Get module count
  const { count: moduleCount } = await supabase
    .from('modules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id)

  // Get enrollment count
  const { count: enrollmentCount } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', id)

  res.json({
    course: {
      ...course,
      moduleCount: moduleCount || 0,
      enrollmentCount: enrollmentCount || 0,
      instructor: course.profiles || undefined
    }
  })
}))

export default router
