import { apiFetch } from './client'
import type { AuthUser, Role } from '../types'

export interface AuthSession {
  user: AuthUser
  token: string
}

export interface RegisterResponse {
  user: AuthUser
  pendingConfirmation?: boolean
}

const TOKEN_KEY = 'dha:token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export type RegisterRole = Extract<Role, 'student' | 'instructor'>

export type AdminRole = 'student' | 'instructor' | 'admin' | 'support'

export interface AdminUser extends AuthUser {
  lastSignInAt?: string
}

export interface AdminUserListResult {
  users: AdminUser[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}

export interface AdminListParams {
  search?: string
  role?: AdminRole | 'all'
  status?: 'all' | 'active' | 'suspended'
  page?: number
  perPage?: number
}

export interface PublicInstructor {
  id: string
  name: string
  title: string
  bio: string
  headline: string
  skills: string[]
  studentCount: number
  courseCount: number
  rating: number
  avatar: string
}

export interface AdminInstructor {
  id: string
  name: string
  email: string
  role: AdminRole
  title: string
  headline: string
  bio: string
  avatar: string
  skills: string[]
  website?: string
  isActive: boolean
  joinedAt: string
  courseCount: number
  publishedCourseCount: number
  studentCount: number
  rating: number
  courses?: { id: string; title: string; status: string; studentCount: number; rating: number }[]
}

export const publicApi = {
  listCourses(params: { category?: string; search?: string; featured?: boolean; trending?: boolean; limit?: number } = {}): Promise<AdminCourseListResult> {
    const qs = new URLSearchParams()
    if (params.category) qs.set('category', params.category)
    if (params.search) qs.set('search', params.search)
    if (params.featured) qs.set('featured', 'true')
    if (params.trending) qs.set('trending', 'true')
    if (params.limit) qs.set('limit', String(params.limit))
    const query = qs.toString()
    return apiFetch<AdminCourseListResult>(`/api/auth/courses${query ? `?${query}` : ''}`)
  },

  listCategories(): Promise<{ categories: AdminCategory[] }> {
    return apiFetch<{ categories: AdminCategory[] }>('/api/auth/categories')
  },

  listInstructors(): Promise<{ instructors: PublicInstructor[] }> {
    return apiFetch<{ instructors: PublicInstructor[] }>('/api/auth/instructors')
  },

  getCourseFull(slug: string): Promise<{ course: AdminCourse }> {
    return apiFetch<{ course: AdminCourse }>(`/api/auth/courses?slug=${slug}`)
  },

  getSettings(): Promise<{
    settings: { platformName: string; tagline: string; primaryColor: string; supportEmail: string; defaultCurrency: string; paystackPublicKey?: string }
  }> {
    return apiFetch<{ settings: unknown }>('/api/auth/settings') as unknown as Promise<{
      settings: { platformName: string; tagline: string; primaryColor: string; supportEmail: string; defaultCurrency: string; paystackPublicKey?: string }
    }>
  }
}

export const adminApi = {
  listUsers(token: string, params: AdminListParams = {}): Promise<AdminUserListResult> {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.role && params.role !== 'all') qs.set('role', params.role)
    if (params.status && params.status !== 'all') qs.set('status', params.status)
    qs.set('page', String(params.page ?? 1))
    qs.set('perPage', String(params.perPage ?? 25))
    const query = qs.toString()
    return apiFetch<AdminUserListResult>(`/api/auth/admin/users${query ? `?${query}` : ''}`, { token })
  },

  createUser(token: string, input: { name: string; email: string; password: string; role: AdminRole }): Promise<{ user: AdminUser }> {
    return apiFetch<{ user: AdminUser }>('/api/auth/admin/users', { method: 'POST', body: input, token })
  },

  updateUser(token: string, id: string, patch: Partial<{ name: string; role: AdminRole; is_active: boolean; title: string; bio: string }>): Promise<{ user: AdminUser }> {
    return apiFetch<{ user: AdminUser }>(`/api/auth/admin/users/${id}`, { method: 'PATCH', body: patch, token })
  },

  deleteUser(token: string, id: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/auth/admin/users/${id}`, { method: 'DELETE', token })
  },

  listInstructorsDetailed(token: string, params: { search?: string; status?: 'all' | 'active' | 'suspended' } = {}): Promise<{ instructors: AdminInstructor[]; total: number }> {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.status && params.status !== 'all') qs.set('status', params.status)
    const query = qs.toString()
    return apiFetch<{ instructors: AdminInstructor[]; total: number }>(`/api/auth/admin/instructors/detailed${query ? `?${query}` : ''}`, { token })
  },

  createInstructor(token: string, input: { name: string; email: string; password?: string; title?: string; headline?: string; bio?: string; skills?: string[] }): Promise<{ instructor: AdminInstructor }> {
    return apiFetch<{ instructor: AdminInstructor }>('/api/auth/admin/instructors', { method: 'POST', body: input, token })
  },

  updateInstructor(token: string, id: string, patch: Partial<{ name: string; title: string; headline: string; bio: string; isActive: boolean; skills: string[] }>): Promise<{ instructor: AdminInstructor }> {
    return apiFetch<{ instructor: AdminInstructor }>(`/api/auth/admin/instructors/${id}`, { method: 'PATCH', body: patch, token })
  },

  deleteInstructor(token: string, id: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/api/auth/admin/instructors/${id}`, { method: 'DELETE', token })
  },

  listCertificates(token: string): Promise<{
    certificates: {
      id: string
      userId: string
      studentName: string
      courseId: string
      courseTitle: string
      courseThumbnail?: string
      issuedAt: string
      completionDate: string
      verificationCode: string
    }[]
  }> {
    return apiFetch<{ certificates: unknown[] }>('/api/auth/admin/certificates', { token }) as Promise<{
      certificates: {
        id: string
        userId: string
        studentName: string
        courseId: string
        courseTitle: string
        courseThumbnail?: string
        issuedAt: string
        completionDate: string
        verificationCode: string
      }[]
    }>
  },

  listOrders(token: string): Promise<{
    orders: {
      id: string
      userId: string
      customerName: string
      total: number
      status: string
      paymentMethod: string
      reference?: string
      createdAt: string
      items: { courseId: string; title: string; price: number }[]
    }[]
  }> {
    return apiFetch<{ orders: unknown[] }>('/api/auth/admin/orders', { token }) as Promise<{
      orders: {
        id: string
        userId: string
        customerName: string
        total: number
        status: string
        paymentMethod: string
        reference?: string
        createdAt: string
        items: { courseId: string; title: string; price: number }[]
      }[]
    }>
  },

  refundOrder(token: string, id: string): Promise<{ order: { id: string; status: string } }> {
    return apiFetch<{ order: { id: string; status: string } }>(`/api/auth/admin/orders/${id}/refund`, { method: 'POST', token })
  },

  getPayments(token: string): Promise<{
    grossRevenue: number
    netRevenue: number
    refunds: number
    instructorPayouts: number
    orderCount: number
    completedCount: number
    refundedCount: number
    monthly: { m: string; revenue: number }[]
    byMethod: Record<string, { count: number; revenue: number }>
    recent: { id: string; total: number; status: string; paymentMethod: string; createdAt: string }[]
  }> {
    return apiFetch<Record<string, unknown>>('/api/auth/admin/payments', { token }) as unknown as Promise<{
      grossRevenue: number
      netRevenue: number
      refunds: number
      instructorPayouts: number
      orderCount: number
      completedCount: number
      refundedCount: number
      monthly: { m: string; revenue: number }[]
      byMethod: Record<string, { count: number; revenue: number }>
      recent: { id: string; total: number; status: string; paymentMethod: string; createdAt: string }[]
    }>
  },

  listAnnouncements(token: string): Promise<{
    announcements: {
      id: string
      authorId: string
      authorName: string
      courseId?: string
      courseTitle?: string
      title: string
      body: string
      createdAt: string
    }[]
  }> {
    return apiFetch<{ announcements: unknown[] }>('/api/auth/admin/announcements', { token }) as Promise<{
      announcements: {
        id: string
        authorId: string
        authorName: string
        courseId?: string
        courseTitle?: string
        title: string
        body: string
        createdAt: string
      }[]
    }>
  },

  createAnnouncement(token: string, input: { title: string; message?: string; courseId?: string }): Promise<{
    announcement: { id: string; title: string; body: string; createdAt: string }
  }> {
    return apiFetch<{ announcement: { id: string; title: string; body: string; createdAt: string } }>(
      '/api/auth/admin/announcements', { method: 'POST', body: input, token })
  },

  deleteAnnouncement(token: string, id: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/api/auth/admin/announcements/${id}`, { method: 'DELETE', token })
  },

  getReports(token: string): Promise<{
    users: { total: number; students: number; instructors: number; admins: number; newThisMonth: number; monthly: { m: string; count: number }[] }
    courses: { total: number; published: number; pending: number; drafts: number; archived: number; avgRating: number; totalReviews: number; top: { id: string; title: string; studentCount: number; rating: number }[] }
    revenue: { gross: number; net: number; refunds: number; payouts: number; orderCount: number; completed: number; refunded: number; avgOrderValue: number }
    certificates: { total: number; thisMonth: number; monthly: { m: string; count: number }[] }
    assessments: { totalAssessments: number; attempts: number; passed: number; passRate: number }
  }> {
    return apiFetch<{ users: unknown; courses: unknown; revenue: unknown; certificates: unknown; assessments: unknown }>('/api/auth/admin/reports', { token }) as unknown as ReturnType<typeof adminApi.getReports>
  },

  getAnalytics(token: string): Promise<{
    users: { total: number; monthly: { m: string; count: number }[] }
    enrollments: { total: number; active: number; completed: number; monthly: { m: string; count: number }[] }
    revenue: { gross: number; net: number; refunds: number; monthly: { m: string; revenue: number }[] }
    courses: { total: number; published: number; byCategory: { id: string; name: string; count: number; students: number }[] }
    certificates: { total: number; monthly: { m: string; count: number }[] }
  }> {
    return apiFetch<{ users: unknown; enrollments: unknown; revenue: unknown; courses: unknown; certificates: unknown }>('/api/auth/admin/analytics', { token }) as unknown as Promise<{
      users: { total: number; monthly: { m: string; count: number }[] }
      enrollments: { total: number; active: number; completed: number; monthly: { m: string; count: number }[] }
      revenue: { gross: number; net: number; refunds: number; monthly: { m: string; revenue: number }[] }
      courses: { total: number; published: number; byCategory: { id: string; name: string; count: number; students: number }[] }
      certificates: { total: number; monthly: { m: string; count: number }[] }
    }>
  },

  listAssessmentAttempts(token: string): Promise<{
    attempts: { id: string; studentName: string; assessmentTitle: string; courseTitle?: string; score: number; passed: boolean; attemptedAt: string }[]
  }> {
    return apiFetch<{ attempts: unknown[] }>('/api/auth/admin/assessment-attempts', { token }) as Promise<{
      attempts: { id: string; studentName: string; assessmentTitle: string; courseTitle?: string; score: number; passed: boolean; attemptedAt: string }[]
    }>
  },

  getSettings(token: string): Promise<{ settings: PlatformSettings }> {
    return apiFetch<{ settings: PlatformSettings }>('/api/auth/admin/settings', { token })
  },

  updateSettings(token: string, input: Partial<PlatformSettings>): Promise<{ settings: PlatformSettings }> {
    return apiFetch<{ settings: PlatformSettings }>('/api/auth/admin/settings', { method: 'PUT', body: input, token })
  }
}

export interface PlatformSettings {
  platformName: string
  supportEmail: string
  defaultCurrency: string
  instructorShare: number
  primaryColor: string
  tagline: string
  refundWindowDays: number
  passingScore: number
  welcomeEmail: boolean
  completionEmail: boolean
  assignmentReminders: boolean
  weeklyDigest: boolean
  paymentProvider: string
  paystackPublicKey?: string
  updatedAt?: string
}

export type CourseStatus = 'published' | 'draft' | 'pending' | 'approved' | 'archived'
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export interface AdminCourse {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  longDescription: string
  categoryId: string
  categoryName?: string
  instructorId: string
  instructorName?: string
  thumbnail?: string
  price: number
  discountPrice?: number
  rating: number
  reviewCount: number
  studentCount: number
  duration: number
  level: CourseLevel
  language: string
  lastUpdated: string
  hasCertificate: boolean
  isFeatured: boolean
  isTrending: boolean
  isNew: boolean
  status: CourseStatus
  createdAt: string
}

export interface AdminCourseListResult {
  courses: AdminCourse[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}

export interface AdminCourseInput {
  title: string
  slug?: string
  subtitle?: string
  description?: string
  longDescription?: string
  categoryId: string
  instructorId: string
  thumbnail?: string
  price?: number
  discountPrice?: number | null
  level?: CourseLevel
  language?: string
  duration?: number
  hasCertificate?: boolean
  isFeatured?: boolean
  status?: CourseStatus
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  description: string
  icon?: string
  color?: string
  courseCount: number
}

export interface AdminCategoryInput {
  name: string
  slug?: string
  description?: string
  icon?: string
  color?: string
}

export interface AdminLessonInput {
  id: string
  title: string
  type: string
  duration: number
  content: string
  videoUrl?: string
  resourceUrl?: string
}

export interface AdminSectionInput {
  title: string
  lessons: AdminLessonInput[]
}

export interface AdminQuestionInput {
  id: string
  type: string
  question: string
  options?: string[]
  answer?: string
  explanation?: string
}

export interface AdminAssessmentInput {
  title: string
  description?: string
  timeLimit?: number
  passingScore?: number
  retakeLimit?: number
  questions: AdminQuestionInput[]
}

export interface AdminCourseFull extends AdminCourse {
  objectives: string[]
  requirements: string[]
  sections: (AdminSectionInput & { id: string })[]
  assessments: (AdminAssessmentInput & { id: string })[]
  faqs: { q: string; a: string }[]
}

export interface AdminCourseContentInput {
  title?: string
  subtitle?: string
  description?: string
  longDescription?: string
  categoryId?: string
  level?: CourseLevel
  language?: string
  thumbnail?: string
  price?: number
  discountPrice?: number | null
  hasCertificate?: boolean
  status?: CourseStatus
  objectives?: string[]
  requirements?: string[]
  sections?: AdminSectionInput[]
  assessments?: AdminAssessmentInput[]
  faqs?: { q: string; a: string }[]
}

export const courseApi = {
  listCourses(token: string, params: {
    search?: string
    status?: 'all' | CourseStatus
    category?: string
    page?: number
    perPage?: number
  } = {}): Promise<AdminCourseListResult> {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.status && params.status !== 'all') qs.set('status', params.status)
    if (params.category) qs.set('category', params.category)
    qs.set('page', String(params.page ?? 1))
    qs.set('perPage', String(params.perPage ?? 25))
    const query = qs.toString()
    return apiFetch<AdminCourseListResult>(`/api/auth/admin/courses${query ? `?${query}` : ''}`, { token })
  },

  createCourse(token: string, input: AdminCourseInput): Promise<{ course: AdminCourse }> {
    return apiFetch<{ course: AdminCourse }>('/api/auth/admin/courses', { method: 'POST', body: input, token })
  },

  updateCourse(token: string, id: string, patch: Partial<AdminCourseInput>): Promise<{ course: AdminCourse }> {
    return apiFetch<{ course: AdminCourse }>(`/api/auth/admin/courses/${id}`, { method: 'PATCH', body: patch, token })
  },

  deleteCourse(token: string, id: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/auth/admin/courses/${id}`, { method: 'DELETE', token })
  },

  getCourseFull(token: string, id: string): Promise<{ course: AdminCourseFull }> {
    return apiFetch<{ course: AdminCourseFull }>(`/api/auth/admin/courses/${id}/full`, { token })
  },

  saveCourseContent(token: string, id: string, content: AdminCourseContentInput): Promise<{ course: AdminCourseFull }> {
    return apiFetch<{ course: AdminCourseFull }>(`/api/auth/admin/courses/${id}/content`, { method: 'PUT', body: content, token })
  },

  listCategories(token: string): Promise<{ categories: AdminCategory[] }> {
    return apiFetch<{ categories: AdminCategory[] }>('/api/auth/admin/categories', { token })
  },

  createCategory(token: string, input: AdminCategoryInput): Promise<{ category: AdminCategory }> {
    return apiFetch<{ category: AdminCategory }>('/api/auth/admin/categories', { method: 'POST', body: input, token })
  },

  updateCategory(token: string, id: string, patch: Partial<AdminCategoryInput>): Promise<{ category: AdminCategory }> {
    return apiFetch<{ category: AdminCategory }>(`/api/auth/admin/categories/${id}`, { method: 'PATCH', body: patch, token })
  },

  deleteCategory(token: string, id: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/auth/admin/categories/${id}`, { method: 'DELETE', token })
  },

  listInstructors(token: string): Promise<{ instructors: { id: string; name: string }[] }> {
    return apiFetch<{ instructors: { id: string; name: string }[] }>('/api/auth/admin/instructors', { token })
  },

  // Instructor-scoped endpoints — use /me/courses/:id/* so the backend
  // checks ownership instead of requiring admin role
  instructorCreateCourse(token: string, input: Omit<AdminCourseInput, 'instructorId'>): Promise<{ course: AdminCourse }> {
    return apiFetch<{ course: AdminCourse }>('/api/auth/me/courses', { method: 'POST', body: input, token })
  },

  instructorGetCourseFull(token: string, id: string): Promise<{ course: AdminCourseFull }> {
    return apiFetch<{ course: AdminCourseFull }>(`/api/auth/me/courses/${id}/full`, { token })
  },

  instructorSaveCourseContent(token: string, id: string, content: AdminCourseContentInput): Promise<{ course: AdminCourseFull }> {
    return apiFetch<{ course: AdminCourseFull }>(`/api/auth/me/courses/${id}/content`, { method: 'PUT', body: content, token })
  }
}

export interface StudentEnrollment {
  id: string
  userId: string
  courseId: string
  enrolledAt: string
  progress: number
  status: 'active' | 'completed'
  completedLessons: string[]
  currentLessonId?: string
  certificateIssued?: boolean
  certificateId?: string
  pricePaid: number
  course?: {
    id: string
    slug: string
    title: string
    subtitle?: string
    description?: string
    thumbnail?: string
    price: number
    discountPrice?: number
    rating: number
    reviewCount: number
    studentCount: number
    duration: number
    level: string
    language?: string
    instructorName?: string
    categoryName?: string
    hasCertificate?: boolean
    status?: string
  }
}

export interface StudentOrder {
  id: string
  userId: string
  total: number
  status: string
  paymentMethod: string
  createdAt: string
  items: { courseId: string; title: string; price: number }[]
}

export interface StudentAssessment {
  id: string
  courseId: string
  courseTitle: string
  courseSlug: string
  courseThumbnail?: string
  title: string
  description: string
  timeLimit: number
  passingScore: number
  retakeLimit: number
  attemptCount: number
  bestScore: number | null
  passed: boolean
  lastAttemptAt: string | null
}

export interface StudentAssessmentQuestion {
  id: string
  type: 'mc' | 'multi' | 'truefalse' | 'short' | 'essay' | 'fill'
  question: string
  options: string[]
  explanation: string | null
}

export interface StudentAssessmentFull extends StudentAssessment {
  questions: StudentAssessmentQuestion[]
}

export interface AssessmentResult {
  attemptId: string
  score: number
  passed: boolean
  correct: number
  total: number
  passingScore: number
  attemptedAt: string
  certificateIssued?: boolean
  certificateId?: string
  gradedAnswers: Record<string, {
    given: string | string[]
    correct: string | string[] | null
    isCorrect: boolean
    explanation: string | null
  }>
}

export interface StudentCertificate {
  id: string
  userId: string
  courseId: string
  instructorId: string
  issuedAt: string
  completionDate: string
  verificationCode: string
  course?: {
    id: string
    title: string
    slug: string
    thumbnail?: string
    subtitle?: string
  }
}

export interface PublicCertificate {
  certificate: {
    id: string
    userId: string
    courseId: string
    issuedAt: string
    completionDate: string
    verificationCode: string
  }
  course: { id: string; title: string; slug: string; subtitle?: string } | null
  student: { id: string; name: string } | null
}

export const studentApi = {
  listEnrollments(token: string): Promise<{ enrollments: StudentEnrollment[] }> {
    return apiFetch<{ enrollments: StudentEnrollment[] }>('/api/auth/me/enrollments', { token })
  },

  getCourseFull(token: string | null, id: string): Promise<{ course: AdminCourseFull }> {
    return apiFetch<{ course: AdminCourseFull }>(`/api/auth/courses/${id}/full`, { token })
  },

  listMyCourses(token: string): Promise<{ courses: AdminCourse[] }> {
    return apiFetch<{ courses: AdminCourse[] }>('/api/auth/me/courses', { token })
  },

  enroll(token: string, input: { courseId: string; paymentMethod?: string }): Promise<{ enrollment: StudentEnrollment }> {
    return apiFetch<{ enrollment: StudentEnrollment }>('/api/auth/me/enrollments', { method: 'POST', body: input, token })
  },

  updateEnrollment(token: string, courseId: string, patch: {
    completedLessons?: string[]
    currentLessonId?: string
  }): Promise<{ enrollment: StudentEnrollment }> {
    return apiFetch<{ enrollment: StudentEnrollment }>(`/api/auth/me/enrollments/${courseId}`, { method: 'PATCH', body: patch, token })
  },

  checkout(token: string, input: { courseIds: string[]; paymentMethod?: string; callbackUrl?: string }): Promise<{
    order: StudentOrder
    enrollments: StudentEnrollment[]
    authorizationUrl?: string
    reference?: string
    publicKey?: string
  }> {
    return apiFetch<{ order: StudentOrder; enrollments: StudentEnrollment[]; authorizationUrl?: string; reference?: string; publicKey?: string }>('/api/auth/checkout', { method: 'POST', body: input, token })
  },

  verifyCheckout(token: string, reference: string): Promise<{
    order: StudentOrder
    enrollments: StudentEnrollment[]
  }> {
    return apiFetch<{ order: StudentOrder; enrollments: StudentEnrollment[] }>('/api/auth/checkout/verify', { method: 'POST', body: { reference }, token })
  },

  listOrders(token: string): Promise<{ orders: StudentOrder[] }> {
    return apiFetch<{ orders: StudentOrder[] }>('/api/auth/me/orders', { token })
  },

  listCertificates(token: string): Promise<{ certificates: StudentCertificate[] }> {
    return apiFetch<{ certificates: StudentCertificate[] }>('/api/auth/me/certificates', { token })
  },

  listAdminEnrollments(token: string): Promise<{
    enrollments: {
      id: string
      userId: string
      studentName: string
      courseId: string
      courseTitle: string
      courseThumbnail?: string
      enrolledAt: string
      progress: number
      status: string
      pricePaid: number
    }[]
  }> {
    return apiFetch<{ enrollments: unknown[] }>('/api/auth/admin/enrollments', { token }) as Promise<{
      enrollments: {
        id: string
        userId: string
        studentName: string
        courseId: string
        courseTitle: string
        courseThumbnail?: string
        enrolledAt: string
        progress: number
        status: string
        pricePaid: number
      }[]
    }>
  },

  listAnnouncements(token: string): Promise<{
    announcements: {
      id: string
      authorName: string
      title: string
      body: string
      createdAt: string
    }[]
  }> {
    return apiFetch<{ announcements: unknown[] }>('/api/auth/me/announcements', { token }) as Promise<{
      announcements: {
        id: string
        authorName: string
        title: string
        body: string
        createdAt: string
      }[]
    }>
  },

  listNotifications(token: string): Promise<{
    notifications: {
      id: string
      userId: string
      type: string
      title: string
      message: string
      read: boolean
      link?: string
      createdAt: string
    }[]
  }> {
    return apiFetch<{ notifications: unknown[] }>('/api/auth/me/notifications', { token }) as Promise<{
      notifications: {
        id: string
        userId: string
        type: string
        title: string
        message: string
        read: boolean
        link?: string
        createdAt: string
      }[]
    }>
  },

  markNotificationsRead(token: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>('/api/auth/me/notifications/read', { method: 'POST', token })
  },

  listAssessments(token: string): Promise<{ assessments: StudentAssessment[] }> {
    return apiFetch<{ assessments: StudentAssessment[] }>('/api/auth/me/assessments', { token })
  },

  getAssessment(token: string, id: string): Promise<{ assessment: StudentAssessmentFull }> {
    return apiFetch<{ assessment: StudentAssessmentFull }>(`/api/auth/me/assessments/${id}`, { token })
  },

  submitAssessment(token: string, id: string, answers: Record<string, string | string[]>): Promise<{ result: AssessmentResult }> {
    return apiFetch<{ result: AssessmentResult }>(`/api/auth/me/assessments/${id}/attempt`, { method: 'POST', body: { answers }, token })
  }
}

export const authApi = {
  register(input: { name: string; email: string; password: string; role: RegisterRole }): Promise<RegisterResponse> {
    return apiFetch<RegisterResponse>('/api/auth/register', { method: 'POST', body: input })
  },

  login(input: { email: string; password: string }): Promise<AuthSession> {
    return apiFetch<AuthSession>('/api/auth/login', { method: 'POST', body: input })
  },

  logout(token: string | null): Promise<unknown> {
    return apiFetch<unknown>('/api/auth/logout', { method: 'POST', token })
  },

  forgotPassword(email: string): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>('/api/auth/forgot-password', { method: 'POST', body: { email } })
  },

  resetPassword(input: { token: string; password: string }): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>('/api/auth/reset-password', { method: 'POST', body: input })
  },

  verifyEmail(token: string): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>('/api/auth/verify-email', { method: 'POST', body: { token } })
  },

  verifyCertificate(idOrCode: string): Promise<PublicCertificate> {
    return apiFetch<PublicCertificate>(`/api/auth/verify-certificate/${encodeURIComponent(idOrCode)}`)
  },

  me(token: string): Promise<{ user: AuthUser }> {
    return apiFetch<{ user: AuthUser }>('/api/auth/me', { token })
  },

  updateProfile(token: string, patch: Partial<AuthUser>): Promise<{ user: AuthUser }> {
    return apiFetch<{ user: AuthUser }>('/api/auth/profile', { method: 'PATCH', body: patch, token })
  },

  changePassword(token: string, input: { currentPassword: string; newPassword: string }): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>('/api/auth/change-password', { method: 'POST', body: input, token })
  },

  deleteAccount(token: string): Promise<unknown> {
    return apiFetch<unknown>('/api/auth/account', { method: 'DELETE', token })
  },

  getPreferences(token: string): Promise<{ preferences: UserPreferences }> {
    return apiFetch<{ preferences: UserPreferences }>('/api/auth/me/preferences', { token })
  },

  updatePreferences(token: string, input: Partial<UserPreferences>): Promise<{ preferences: UserPreferences }> {
    return apiFetch<{ preferences: UserPreferences }>('/api/auth/me/preferences', { method: 'PUT', body: input, token })
  },

  changeEmail(token: string, input: { newEmail: string; password: string }): Promise<{ message?: string; email: string }> {
    return apiFetch<{ message?: string; email: string }>('/api/auth/me/email', { method: 'POST', body: input, token })
  },

  uploadAvatar(token: string, dataUrl: string): Promise<{ avatar: string }> {
    return apiFetch<{ avatar: string }>('/api/auth/me/avatar', { method: 'POST', body: { dataUrl }, token })
  },

  listSessions(token: string): Promise<{
    sessions: { id: string; userAgent: string; ip: string; createdAt: string; lastSeenAt: string; current: boolean; revoked?: boolean }[]
  }> {
    return apiFetch<{ sessions: unknown[] }>('/api/auth/me/sessions', { token }) as Promise<{
      sessions: { id: string; userAgent: string; ip: string; createdAt: string; lastSeenAt: string; current: boolean; revoked?: boolean }[]
    }>
  },

  revokeSessions(token: string): Promise<{ message?: string }> {
    return apiFetch<{ message?: string }>('/api/auth/me/sessions/revoke', { method: 'POST', token })
  }
}

export interface UserPreferences {
  emailNotifications: boolean
  courseNotifications: boolean
  assignmentNotifications: boolean
  marketingNotifications: boolean
  publicProfile: boolean
  showLearning: boolean
  showSkills: boolean
  language: string
  updatedAt?: string | null
}