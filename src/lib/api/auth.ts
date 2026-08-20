import { apiFetch } from './client'
import type { AuthUser, Role } from '../types'

export interface AuthSession {
  user: AuthUser
  token: string
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
  }
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
  }
}

export const authApi = {
  register(input: { name: string; email: string; password: string; role: RegisterRole }): Promise<AuthSession> {
    return apiFetch<AuthSession>('/api/auth/register', { method: 'POST', body: input })
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
  }
}