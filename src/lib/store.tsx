import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, AuthUser, Enrollment, Notification, Conversation, Message, Submission, Order, Certificate } from './types'
import { uid } from './utils'
import * as auth from './auth'
import type { AuthSession } from './auth'
import { supabase } from './supabase'
import { authApi, getStoredToken, studentApi } from './api/auth'
import { clearStoredToken, storeToken } from './api/auth'

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
  completeLesson: (courseId: string, lessonId: string) => Promise<boolean>
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

async function getFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const functionError = error as { message?: string; context?: Response } | null
  const context = functionError?.context
  if (context && typeof context.clone === 'function') {
    try {
      const body = await context.clone().json() as { error?: string; message?: string }
      if (body.error || body.message) return body.error ?? body.message!
    } catch { /* use the SDK error below */ }
  }
  return functionError?.message || fallback
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

  const hydrateStudentData = useCallback(async (userId: string, token?: string) => {
    try {
      const session = token ? { token } : await auth.getCurrentSession()
      if (!session?.token) return
      const [enrollmentResult, certificateResult] = await Promise.allSettled([
        studentApi.listEnrollments(session.token),
        studentApi.listCertificates(session.token)
      ])
      if (enrollmentResult.status === 'rejected') throw enrollmentResult.reason
      const { enrollments: data } = enrollmentResult.value
      // These endpoints are scoped to the authenticated user on the server.
      // Use their profile IDs as returned: older Auth accounts may have a
      // different UUID from the corresponding application profile.
      setEnrollments(data)
      if (certificateResult.status === 'fulfilled') {
        setCertificates(certificateResult.value.certificates)
      } else {
        console.error('Failed to fetch certificates:', certificateResult.reason)
      }
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
          storeToken(session.token)
          setCurrentUser(normalizeUser(session.user))
          setAuthStatus('authenticated')
          hydrateStudentData(session.user.id, session.token)
        } else {
          clearStoredToken()
          setAuthStatus('unauthenticated')
        }
      })
      .catch(() => {
        setAuthStatus('unauthenticated')
      })

    // Listen for auth state changes
    const subscription = auth.onAuthStateChange((session) => {
      if (session) {
        storeToken(session.token)
        setCurrentUser(normalizeUser(session.user))
        setAuthStatus('authenticated')
        hydrateStudentData(session.user.id, session.token)
      } else {
        clearStoredToken()
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
      storeToken(session.token)
      setCurrentUser(normalizeUser(session.user))
      setAuthStatus('authenticated')
      hydrateStudentData(session.user.id, session.token)
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
      clearStoredToken()
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
      const session = await auth.getCurrentSession()
      if (!session?.token) throw new Error('Your session has expired. Please sign in again.')
      const { enrollment } = await studentApi.enroll(session.token, { courseId })
      setEnrollments((current) => current.some((e) => e.courseId === courseId && e.userId === userId)
        ? current.map((e) => e.courseId === courseId && e.userId === userId ? enrollment : e)
        : [...current, enrollment])
      
      toast('Enrolled Successfully', 'You have been enrolled in the course', 'success')
    } catch (error) {
      console.error('Failed to enroll:', error)
      toast('Enrollment Failed', error instanceof Error ? error.message : 'Failed to enroll in the course', 'error')
    }
  }, [currentUser, hydrateStudentData, toast])

  const completeLesson = useCallback(async (courseId: string, lessonId: string): Promise<boolean> => {
    const userId = currentUser?.id
    if (!userId) return false
    
    try {
      const enrollment = enrollments.find((e) => e.courseId === courseId)
      if (enrollment) {
        const completedLessons = enrollment.completedLessons.includes(lessonId)
          ? enrollment.completedLessons 
          : [...enrollment.completedLessons, lessonId]
        setEnrollments((current) => current.map((en) => en.id === enrollment.id
          ? { ...en, completedLessons }
          : en))
        const session = await auth.getCurrentSession()
        if (!session?.token) throw new Error('Your session has expired. Please sign in again.')
        const { enrollment: updated } = await studentApi.updateEnrollment(session.token, courseId, { completedLessons })
        setEnrollments((current) => current.map((en) => en.id === updated.id ? updated : en))
        if (updated.certificateIssued) {
          const { certificates: userCertificates } = await studentApi.listCertificates(session.token)
          setCertificates(userCertificates)
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update lesson progress:', error)
      toast('Progress not saved', error instanceof Error ? error.message : 'Please try again.', 'error')
      return false
    }
  }, [currentUser, enrollments, toast])

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
    if (!currentUser) throw new Error('Please sign in before checking out.')
    if (cart.length === 0) throw new Error('Your cart is empty.')
    const { data, error } = await supabase.functions.invoke('auth/checkout', {
      body: {
        courseIds: [...new Set(cart)],
        paymentMethod: method,
        callbackUrl: `${window.location.origin}/checkout`
      }
    })
    if (error) throw new Error(await getFunctionErrorMessage(error, 'Could not start your Paystack checkout.'))
    if (data?.authorizationUrl) {
      window.location.assign(data.authorizationUrl)
      return 'redirected'
    }
    if (data?.order?.status !== 'completed') throw new Error('The checkout service did not confirm your order.')

    const now = new Date().toISOString()
    const newEnrollments = (data.enrollments ?? []).map((enrollment: any) => ({
      id: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      enrolledAt: enrollment.enrolledAt ?? now,
      progress: enrollment.progress ?? 0,
      status: enrollment.status === 'completed' ? 'completed' as const : 'active' as const,
      completedLessons: enrollment.completedLessons ?? [],
      currentLessonId: enrollment.currentLessonId,
      certificateIssued: enrollment.certificateIssued,
      certificateId: enrollment.certificateId,
      pricePaid: Number(enrollment.pricePaid ?? 0),
      course: enrollment.course
    }))
    setEnrollments((existing) => [...existing.filter((row) => !newEnrollments.some((next: Enrollment) => next.courseId === row.courseId && next.userId === row.userId)), ...newEnrollments])
    setOrders((existing) => [...existing, {
      id: data.order.id,
      userId: currentUser.id,
      items: cart.map((id) => ({ courseId: id, title: cartCourses[id]?.title ?? id, price: cartCourses[id]?.discountPrice ?? cartCourses[id]?.price ?? 0 })),
      total: Number(data.order.total ?? 0),
      status: 'completed',
      date: data.order.createdAt ?? now,
      paymentMethod: data.order.paymentMethod ?? method
    }])
    setCart([])
    setCartCourses({})
    return 'completed'
  }, [cart, cartCourses, currentUser])

  const verifyCheckout = useCallback(async (reference: string) => {
    if (!currentUser) return { ok: false, error: 'Not authenticated.' }
    try {
      const { data, error } = await supabase.functions.invoke('auth/checkout/verify', { body: { reference } })
      if (error) throw new Error(await getFunctionErrorMessage(error, 'Could not verify this payment.'))
      if (data?.order?.status !== 'completed') return { ok: false, error: 'Payment is not complete yet.' }
      const now = new Date().toISOString()
      const verifiedEnrollments = (data.enrollments ?? []).map((enrollment: any) => ({
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        enrolledAt: enrollment.enrolledAt ?? now,
        progress: enrollment.progress ?? 0,
        status: enrollment.status === 'completed' ? 'completed' as const : 'active' as const,
        completedLessons: enrollment.completedLessons ?? [],
        currentLessonId: enrollment.currentLessonId,
        certificateIssued: enrollment.certificateIssued,
        certificateId: enrollment.certificateId,
        pricePaid: Number(enrollment.pricePaid ?? 0),
        course: enrollment.course
      }))
      setEnrollments((existing) => [...existing.filter((row) => !verifiedEnrollments.some((next: Enrollment) => next.courseId === row.courseId && next.userId === row.userId)), ...verifiedEnrollments])
      setOrders((existing) => {
        if (existing.some((order) => order.id === data.order.id)) return existing
        return [...existing, {
          id: data.order.id,
          userId: currentUser.id,
          items: verifiedEnrollments.map((enrollment: Enrollment) => ({ courseId: enrollment.courseId, title: enrollment.course?.title ?? enrollment.courseId, price: enrollment.pricePaid })),
          total: Number(data.order.total ?? 0),
          status: 'completed',
          date: data.order.createdAt ?? now,
          paymentMethod: data.order.paymentMethod ?? 'paystack'
        }]
      })
      setCart([])
      setCartCourses({})
      return { ok: true, enrollments: verifiedEnrollments, order: data.order }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Payment verification failed.' }
    }
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
      const token = getStoredToken()
      if (!token) return { ok: false, error: 'Your session has expired. Please sign in again.' }
      const { user } = await authApi.updateProfile(token, {
        name: patch.name,
        title: patch.title,
        bio: patch.bio,
        skills: patch.skills,
        headline: patch.headline,
        website: patch.website
      })
      setCurrentUser((existing) => existing ? { ...existing, ...user } : { ...currentUser, ...user })
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
      const token = getStoredToken()
      if (!token) return { ok: false, error: 'Your session has expired. Please sign in again.' }
      const { avatar } = await authApi.uploadAvatar(token, dataUrl)
      setCurrentUser((u) => (u ? { ...u, avatar } : u))
      return { ok: true, avatar }
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
