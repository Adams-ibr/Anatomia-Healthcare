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
// GET /api/auth/admin/payments
// Get payment statistics and revenue data
// ---------------------------------------------------------------------------

router.get('/payments', handle(async (req, res) => {
  if (!(await requireAdmin(req, res))) return

  // Get all orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, total, created_at, status')
    .order('created_at', { ascending: false })

  if (ordersError) {
    return err(res, 400, ordersError.message)
  }

  // Calculate stats
  const completedOrders = (orders || []).filter((o: any) => o.status === 'completed')
  const grossRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
  const orderCount = completedOrders.length

  // Calculate monthly revenue for the last 6 months
  const now = new Date()
  const monthly: { m: string; revenue: number }[] = []
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
    const monthName = date.toLocaleDateString('en-US', { month: 'short' })
    
    const monthRevenue = completedOrders
      .filter((o: any) => o.created_at.startsWith(monthKey))
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0)
    
    monthly.push({ m: monthName, revenue: monthRevenue })
  }

  res.json({
    grossRevenue,
    orderCount,
    monthly
  })
}))

// ---------------------------------------------------------------------------
// GET /api/auth/admin/certificates
// List all issued certificates
// ---------------------------------------------------------------------------

router.get('/certificates', handle(async (req, res) => {
  if (!(await requireAdmin(req, res))) return

  const { data: certificates, error } = await supabase
    .from('certificates')
    .select(`
      id,
      student_id,
      course_id,
      issued_at,
      certificate_number,
      profiles!student_id (name, email),
      courses (title)
    `)
    .order('issued_at', { ascending: false })

  if (error) {
    return err(res, 400, error.message)
  }

  const formattedCertificates = (certificates || []).map((cert: any) => ({
    id: cert.id,
    studentId: cert.student_id,
    studentName: cert.profiles?.name || 'Unknown',
    studentEmail: cert.profiles?.email || '',
    courseId: cert.course_id,
    courseTitle: cert.courses?.title || 'Unknown Course',
    issuedAt: cert.issued_at,
    certificateNumber: cert.certificate_number
  }))

  res.json({
    certificates: formattedCertificates
  })
}))

// ---------------------------------------------------------------------------
// GET /api/auth/admin/enrollments
// List all enrollments with student and course details
// ---------------------------------------------------------------------------

router.get('/enrollments', handle(async (req, res) => {
  if (!(await requireAdmin(req, res))) return

  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      user_id,
      course_id,
      enrolled_at,
      status,
      price_paid,
      progress,
      profiles!user_id (name),
      courses (title, thumbnail)
    `)
    .order('enrolled_at', { ascending: false })

  if (error) {
    return err(res, 400, error.message)
  }

  const formattedEnrollments = (enrollments || []).map((enr: any) => ({
    id: enr.id,
    userId: enr.user_id,
    studentName: enr.profiles?.name || 'Unknown',
    courseId: enr.course_id,
    courseTitle: enr.courses?.title || 'Unknown Course',
    courseThumbnail: enr.courses?.thumbnail || undefined,
    enrolledAt: enr.enrolled_at,
    progress: enr.progress || 0,
    status: enr.status || 'active',
    pricePaid: enr.price_paid || 0
  }))

  res.json({
    enrollments: formattedEnrollments
  })
}))

export default router
