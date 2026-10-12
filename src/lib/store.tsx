import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, AuthUser, Enrollment, Notification, Conversation, Message, Submission, Order, Certificate } from './types'
import { uid } from './utils'
import * as auth from './auth'
import type { AuthSession } from './auth'

interface Toast {
  id: string
  title: string
  message?: string
  kind: 'success' | 'error' | 'info'
}

export interface CartCourse {
  id: string
  title: string
  thumbnail?: string
  price: number
  discountPrice?: number
  instructorName?: string
  level?: string
}

interface AppState {
  authStatus: 'loading' | 'authenticated' | 'unauthenticated'
  currentUser: AuthUser | null
  users: User[]
  enrollments: Enrollment[]
  wishlist: string[]
  cart: string[]
  cartCourses: Record<string, CartCourse>
  notifications: Notification[]
  conversations: Conversation[]
  messages: Message[]
  submissions: Submission[]
  orders: Order[]
  certificates: Certificate[]
  toasts: Toast[]
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: AuthUser }>
  register: (name: string, email: string, password: string, role: 'student' | 'instructor') => Promise<{ ok: boolean; error?: string; user?: AuthUser; pendingConfirmation?: boolean }>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ ok: boolean; error?: string }>
  resetPassword: (token: string, password: string) => Promise<{ ok: boolean; error?: string }>
  verifyEmail: (token: string) => Promise<{ ok: boolean; error?: string }>
  enroll: (courseId: string) => void
  completeLesson: (courseId: string, lessonId: string) => void
  setCurrentLesson: (courseId: string, lessonId: string) => void
  toggleWishlist: (courseId: string) => void
  addToCart: (courseId: string, course?: CartCourse) => void
  removeFromCart: (courseId: string) => void
  clearCart: () => void
  checkout: (method: string) => Promise<'completed' | 'redirected'>
  verifyCheckout: (reference: string) => Promise<{ ok: boolean; error?: string; enrollments?: Enrollment[]; order?: Order }>
  markNotificationsRead: () => void
  sendMessage: (conversationId: string, toId: string, text: string) => void
  submitAssignment: (assignmentId: string, text: string, link?: string) => void
  toast: (title: string, message?: string, kind?: Toast['kind']) => void
  dismissToast: (id: string) => void
  updateProfile: (patch: Partial<AuthUser>) => Promise<{ ok: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>
  updatePreferences: (patch: any) => Promise<{ ok: boolean; error?: string }>
  changeEmail: (newEmail: string, password: string) => Promise<{ ok: boolean; error?: string }>
  uploadAvatar: (dataUrl: string) => Promise<{ ok: boolean; error?: string; avatar?: string }>
  revokeSessions: () => Promise<{ ok: boolean; error?: string }>
  issueCertificate: (courseId: string) => void
  resetAll: () => void
}

const Ctx = createContext<AppState | null>(null)

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`dha:${key}`)
    if (raw) return JSON.parse(raw) as T
  } catch {
    /* ignore */
  }
  return fallback
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(`dha:${key}`, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

function normalizeUser(user: auth.AuthUser): AuthUser {
  return {
    ...user,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    avatar: user.avatar ?? '',
    title: (user.role === 'instructor' ? 'Instructor' : 'Learner'),
    bio: '',
    skills: [],
    isActive: true,
    joinedAt: new Date().toISOString()
  } as AuthUser
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [wishlist, setWishlist] = useState<string[]>(() => load('wishlist', []))
  const [cart, setCart] = useState<string[]>(() => load('cart', []))
  const [cartCourses, setCartCourses] = useState<Record<string, CartCourse>>(() => load('cartCourses', {}))
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, number>>({})

  useEffect(() => save('users', users), [users])
  // Enrollments are now fetched from Supabase, no need to persist locally
  // useEffect(() => save('enrollments', enrollments), [enrollments])
  useEffect(() => save('wishlist', wishlist), [wishlist])
  useEffect(() => save('cart', cart), [cart])
  useEffect(() => save('cartCourses', cartCourses), [cartCourses])
  useEffect(() => save('notifications', notifications), [notifications])
  useEffect(() => save('conversations', conversations), [conversations])
  useEffect(() => save('messages', messages), [messages])
  useEffect(() => save('submissions', submissions), [submissions])
  useEffect(() => save('orders', orders), [orders])
  useEffect(() => save('certificates', certificates), [certificates])

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback((title: string, message?: string, kind: Toast['kind'] = 'success') => {
    const id = uid('toast')
    setToasts((t) => [...t, { id, title, message, kind }])
    timers.current[id] = window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
      delete timers.current[id]
    }, 4500)
  }, [])

  useEffect(() => () => Object.values(timers.current).forEach((t) => clearTimeout(t)), [])

  const hydrateStudentData = useCallback(async (userId: string) => {
    try {
      // Import enrollmentsApi
      const { enrollmentsApi } = await import('./supabase')
      
      // Fetch enrollments from Supabase
      const enrollmentsData = await enrollmentsApi.list({ member_id: userId })
      
      // Transform to match the Enrollment type
      const transformedEnrollments: Enrollment[] = (enrollmentsData || []).map((e: any) => ({
        id: e.id,
        userId: e.member_id,
        courseId: e.course_id,
        enrolledAt: e.enrolled_at,
        progress: e.progress || 0,
        status: e.status || 'active',
        completedLessons: [],
        pricePaid: 0,
        course: e.courses ? {
          id: e.courses.id,
          title: e.courses.title,
          slug: e.courses.slug,
          thumbnail: e.courses.thumbnail_url || '',
          price: e.courses.price || 0,
          description: e.courses.description || '',
          rating: 0,
          reviewCount: 0,
          studentCount: 0,
          duration: e.courses.duration || 0,
          level: e.courses.level || 'Beginner',
          language: 'English',
          instructorName: '',
          categoryName: e.courses.category || '',
          hasCertificate: false,
          status: e.courses.is_published ? 'published' : 'draft'
        } : undefined
      }))
      
      setEnrollments(transformedEnrollments)
    } catch (error) {
      console.error('Failed to fetch enrollments:', error)
      /* keep local fallback data when offline */
    }
  }, [])

  useEffect(() => {
    // Check for existing session on mount
    auth.getCurrentSession()
      .then((session) => {
        if (session) {
          setCurrentUser(normalizeUser(session.user))
          setAuthStatus('authenticated')
          hydrateStudentData(session.user.id)
        } else {
          setAuthStatus('unauthenticated')
        }
      })
      .catch(() => {
        setAuthStatus('unauthenticated')
      })

    // Listen for auth state changes
    const subscription = auth.onAuthStateChange((session) => {
      if (session) {
        setCurrentUser(normalizeUser(session.user))
        setAuthStatus('authenticated')
        hydrateStudentData(session.user.id)
      } else {
        setCurrentUser(null)
        setAuthStatus('unauthenticated')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [hydrateStudentData])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const session = await auth.login(email, password)
      setCurrentUser(normalizeUser(session.user))
      setAuthStatus('authenticated')
      hydrateStudentData(session.user.id)
      return { ok: true, user: normalizeUser(session.user) }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [hydrateStudentData])

  const register = useCallback(async (name: string, email: string, password: string, role: 'student' | 'instructor') => {
    try {
      const [firstName, ...lastNameParts] = name.split(' ')
      const session = await auth.register(email, password, {
        firstName,
        lastName: lastNameParts.join(' '),
        role
      })
      
      // Registration successful - user may need to confirm email
      const user = normalizeUser(session.user)
      return { ok: true, user, pendingConfirmation: false }
    } catch (err) {
      const message = getErrorMessage(err)
      // Check if it's an email confirmation message
      if (message.includes('email') || message.includes('confirmation')) {
        return { ok: true, user: undefined, pendingConfirmation: true }
      }
      return { ok: false, error: message }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await auth.logout()
    } catch {
      /* ignore logout errors */
    }
    setCurrentUser(null)
    setAuthStatus('unauthenticated')
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await auth.requestPasswordReset(email)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      await auth.updatePassword(password)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [])

  const verifyEmail = useCallback(async (token: string) => {
    try {
      // Supabase handles email verification automatically
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [])

  const enroll = useCallback(async (courseId: string) => {
    const userId = currentUser?.id
    if (!userId) return
    
    try {
      // Import enrollmentsApi
      const { enrollmentsApi } = await import('./supabase')
      
      // Check if already enrolled
      const existing = await enrollmentsApi.list({ member_id: userId, course_id: courseId })
      if (existing && existing.length > 0) {
        console.log('Already enrolled in this course')
        return
      }
      
      // Create enrollment in Supabase
      const newEnrollment = await enrollmentsApi.create({
        id: uid('enr'),
        member_id: userId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        progress: 0,
        status: 'active'
      })
      
      // Update local state
      setEnrollments((e) => {
        const en: Enrollment = {
          id: newEnrollment.id,
          userId,
          courseId,
          enrolledAt: newEnrollment.enrolled_at,
          progress: newEnrollment.progress || 0,
          status: newEnrollment.status || 'active',
          completedLessons: [],
          pricePaid: 0
        }
        return [...e, en]
      })
      
      // Refresh enrollments from Supabase
      await hydrateStudentData(userId)
      
      toast('Enrolled Successfully', 'You have been enrolled in the course', 'success')
    } catch (error) {
      console.error('Failed to enroll:', error)
      toast('Enrollment Failed', 'Failed to enroll in the course', 'error')
    }
  }, [currentUser, hydrateStudentData, toast])

  const completeLesson = useCallback(async (courseId: string, lessonId: string) => {
    const userId = currentUser?.id
    if (!userId) return
    
    try {
      const { enrollmentsApi } = await import('./supabase')
      
      // Update local state first for instant feedback
      setEnrollments((e) => e.map((en) => {
        if (en.userId !== userId || en.courseId !== courseId) return en
        if (en.completedLessons.includes(lessonId)) return en
        const completedLessons = [...en.completedLessons, lessonId]
        const progress = Math.min(100, Math.round((completedLessons.length / 12) * 100))
        return { ...en, completedLessons, progress, status: progress >= 100 ? 'completed' : en.status }
      }))
      
      // Get updated enrollment for Supabase sync
      const enrollment = enrollments.find((e) => e.userId === userId && e.courseId === courseId)
      if (enrollment) {
        const completedLessons = enrollment.completedLessons.includes(lessonId) 
          ? enrollment.completedLessons 
          : [...enrollment.completedLessons, lessonId]
        const progress = Math.min(100, Math.round((completedLessons.length / 12) * 100))
        
        // Update progress in Supabase
        await enrollmentsApi.updateProgress(userId, courseId, progress)
      }
    } catch (error) {
      console.error('Failed to update lesson progress:', error)
    }
  }, [currentUser, enrollments])

  const setCurrentLesson = useCallback(async (courseId: string, lessonId: string) => {
    const userId = currentUser?.id
    if (!userId) return
    setEnrollments((e) => e.map((en) =>
      en.userId === userId && en.courseId === courseId ? { ...en, currentLessonId: lessonId } : en
    ))
    // TODO: Sync with Supabase
  }, [currentUser])

  const toggleWishlist = useCallback((courseId: string) => {
    setWishlist((w) => w.includes(courseId) ? w.filter((c) => c !== courseId) : [...w, courseId])
  }, [])

  const addToCart = useCallback((courseId: string, course?: CartCourse) => {
    setCart((c) => (c.includes(courseId) ? c : [...c, courseId]))
    if (course) {
      setCartCourses((m) => ({ ...m, [courseId]: course }))
      // Also write to localStorage immediately so the value is available
      // after synchronous navigation before the useEffect fires
      try {
        const existing = load<Record<string, CartCourse>>('cartCourses', {})
        save('cartCourses', { ...existing, [courseId]: course })
        const existingCart = load<string[]>('cart', [])
        if (!existingCart.includes(courseId)) save('cart', [...existingCart, courseId])
      } catch { /* ignore */ }
    }
  }, [])

  const removeFromCart = useCallback((courseId: string) => {
    setCart((c) => c.filter((x) => x !== courseId))
    setCartCourses((m) => { const next = { ...m }; delete next[courseId]; return next })
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setCartCourses({})
  }, [])

  const checkout = useCallback(async (method: string): Promise<'completed' | 'redirected'> => {
    if (!currentUser) return 'completed'
    const courseIds = [...cart]
    
    // Local checkout only for now
    setEnrollments((e) => {
      const next = [...e]
      cart.forEach((courseId) => {
        if (!next.some((x) => x.userId === currentUser.id && x.courseId === courseId)) {
          next.push({ id: uid('en'), userId: currentUser.id, courseId, enrolledAt: new Date().toISOString(), progress: 0, status: 'active', completedLessons: [], pricePaid: 0 })
        }
      })
      return next
    })
    setOrders((o) => [...o, {
      id: `ORD-${Math.floor(10000 + Math.random() * 89999)}`, userId: currentUser.id,
      items: cart.map((id) => ({ courseId: id, title: id, price: 0 })), total: 0, status: 'completed',
      date: new Date().toISOString(), paymentMethod: method
    }])
    setCart([])
    setCartCourses({})
    return 'completed'
  }, [cart, currentUser])

  const verifyCheckout = useCallback(async (reference: string) => {
    if (!currentUser) return { ok: false, error: 'Not authenticated.' }
    // TODO: Implement with Supabase
    return { ok: true }
  }, [currentUser])

  const markNotificationsRead = useCallback(() => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })))
    // TODO: Sync with Supabase
  }, [])

  const sendMessage = useCallback((conversationId: string, toId: string, text: string) => {
    if (!currentUser) return
    const id = conversationId || uid('cv')
    if (!conversationId) {
      setConversations((c) => [...c, { id, participants: [currentUser.id, toId], lastMessageAt: new Date().toISOString() }])
    } else {
      setConversations((c) => c.map((x) => x.id === id ? { ...x, lastMessageAt: new Date().toISOString() } : x))
    }
    setMessages((m) => [...m, { id: uid('ms'), conversationId: id, fromId: currentUser.id, toId, text, read: false, createdAt: new Date().toISOString() }])
  }, [currentUser])

  const submitAssignment = useCallback((assignmentId: string, text: string, link?: string) => {
    if (!currentUser) return
    setSubmissions((s) => [...s, {
      id: uid('sub'), assignmentId, userId: currentUser.id, text, link,
      submittedAt: new Date().toISOString(), returned: false
    }])
  }, [currentUser])

  const updateProfile = useCallback(async (patch: Partial<AuthUser>) => {
    if (!currentUser) return { ok: false, error: 'You must be logged in.' }
    try {
      const user = await auth.updateProfile({
        firstName: patch.name?.split(' ')[0],
        lastName: patch.name?.split(' ').slice(1).join(' '),
        avatar: patch.avatar
      })
      setCurrentUser(normalizeUser(user))
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [currentUser])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!currentUser) return { ok: false, error: 'You must be logged in.' }
    try {
      await auth.updatePassword(newPassword)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [currentUser])

  const deleteAccount = useCallback(async () => {
    if (!currentUser) return { ok: false, error: 'You must be logged in.' }
    try {
      await auth.logout()
      setCurrentUser(null)
      setAuthStatus('unauthenticated')
      // TODO: Implement actual account deletion in Supabase
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [currentUser])

  const updatePreferences = useCallback(async (patch: any) => {
    if (!currentUser) return { ok: false, error: 'You must be logged in.' }
    try {
      // TODO: Store preferences in Supabase when needed
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [currentUser])

  const changeEmail = useCallback(async (newEmail: string, password: string) => {
    if (!currentUser) return { ok: false, error: 'You must be logged in.' }
    try {
      await auth.updateProfile({ })
      setCurrentUser((u) => (u ? { ...u, email: newEmail } : u))
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [currentUser])

  const uploadAvatar = useCallback(async (dataUrl: string) => {
    if (!currentUser) return { ok: false, error: 'You must be logged in.' }
    try {
      // TODO: Upload to Supabase storage
      await auth.updateProfile({ avatar: dataUrl })
      setCurrentUser((u) => (u ? { ...u, avatar: dataUrl } : u))
      return { ok: true, avatar: dataUrl }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [currentUser])

  const revokeSessions = useCallback(async () => {
    if (!currentUser) return { ok: false, error: 'You must be logged in.' }
    try {
      await auth.logout()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [currentUser])

  const issueCertificate = useCallback((courseId: string) => {
    if (!currentUser) return
    setCertificates((c) => {
      if (c.some((x) => x.userId === currentUser.id && x.courseId === courseId)) return c
      return [...c, {
        id: `CERT-DHA-${new Date().getFullYear()}-${String(c.length + 1).padStart(4, '0')}`,
        userId: currentUser.id, courseId, instructorId: '', issuedAt: new Date().toISOString(),
        completionDate: new Date().toISOString(), verificationCode: `DHA${Math.random().toString(36).slice(2, 10).toUpperCase()}`
      }]
    })
    setEnrollments((e) => e.map((x) =>
      x.userId === currentUser.id && x.courseId === courseId ? { ...x, certificateIssued: true, certificateId: `CERT-${x.courseId}` } : x
    ))
  }, [currentUser])

  const resetAll = useCallback(() => {
    localStorage.clear()
    window.location.reload()
  }, [])

  const value: AppState = {
    authStatus, currentUser, users, enrollments, wishlist, cart, cartCourses, notifications, conversations, messages,
    submissions, orders, certificates, toasts,
    login, register, logout, forgotPassword, resetPassword, verifyEmail, enroll, completeLesson,
    setCurrentLesson, toggleWishlist, addToCart, removeFromCart, clearCart, checkout, verifyCheckout, markNotificationsRead,
    sendMessage, submitAssignment, toast, dismissToast, updateProfile, changePassword, deleteAccount,
    updatePreferences, changeEmail, uploadAvatar, revokeSessions,
    issueCertificate, resetAll
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
