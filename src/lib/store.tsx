import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, AuthUser, Enrollment, Notification, Conversation, Message, Submission, Order, Certificate } from './types'
import { uid } from './utils'
import { ApiError } from './api/client'
import { authApi, getStoredToken, storeToken, clearStoredToken, studentApi } from './api/auth'
import type { StudentEnrollment, StudentOrder } from './api/auth'

interface Toast {
  id: string
  title: string
  message?: string
  kind: 'success' | 'error' | 'info'
}

interface AppState {
  authStatus: 'loading' | 'authenticated' | 'unauthenticated'
  currentUser: AuthUser | null
  users: User[]
  enrollments: Enrollment[]
  wishlist: string[]
  cart: string[]
  notifications: Notification[]
  conversations: Conversation[]
  messages: Message[]
  submissions: Submission[]
  orders: Order[]
  certificates: Certificate[]
  toasts: Toast[]
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: AuthUser }>
  register: (name: string, email: string, password: string, role: 'student' | 'instructor') => Promise<{ ok: boolean; error?: string; user?: AuthUser }>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ ok: boolean; error?: string }>
  resetPassword: (token: string, password: string) => Promise<{ ok: boolean; error?: string }>
  verifyEmail: (token: string) => Promise<{ ok: boolean; error?: string }>
  enroll: (courseId: string) => void
  completeLesson: (courseId: string, lessonId: string) => void
  setCurrentLesson: (courseId: string, lessonId: string) => void
  toggleWishlist: (courseId: string) => void
  addToCart: (courseId: string) => void
  removeFromCart: (courseId: string) => void
  clearCart: () => void
  checkout: (method: string) => Promise<'completed' | 'redirected'>
  verifyCheckout: (reference: string) => Promise<{ ok: boolean; error?: string; enrollments?: StudentEnrollment[]; order?: StudentOrder }>
  markNotificationsRead: () => void
  sendMessage: (conversationId: string, toId: string, text: string) => void
  submitAssignment: (assignmentId: string, text: string, link?: string) => void
  toast: (title: string, message?: string, kind?: Toast['kind']) => void
  dismissToast: (id: string) => void
  updateProfile: (patch: Partial<AuthUser>) => Promise<{ ok: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>
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
  if (err instanceof ApiError) return err.message
  return 'Something went wrong. Please try again.'
}

function normalizeUser(user: AuthUser): AuthUser {
  return {
    ...user,
    avatar: user.avatar ?? '',
    title: user.title ?? (user.role === 'instructor' ? 'Instructor' : 'Learner'),
    bio: user.bio ?? '',
    skills: user.skills ?? [],
    isActive: user.isActive ?? true,
    joinedAt: user.joinedAt ?? new Date().toISOString()
  }
}

function toEnrollment(e: StudentEnrollment): Enrollment {
  return {
    id: e.id,
    userId: e.userId,
    courseId: e.courseId,
    enrolledAt: e.enrolledAt,
    progress: e.progress,
    status: e.status,
    completedLessons: e.completedLessons,
    currentLessonId: e.currentLessonId,
    certificateIssued: e.certificateIssued,
    certificateId: e.certificateId,
    pricePaid: e.pricePaid,
    course: e.course
  }
}

function toOrder(o: { id: string; userId: string; total: number; status: string; paymentMethod: string; createdAt: string; items: { courseId: string; title: string; price: number }[] }): Order {
  return {
    id: o.id,
    userId: o.userId,
    items: o.items,
    total: o.total,
    status: (o.status === 'completed' || o.status === 'pending' || o.status === 'refunded' || o.status === 'failed') ? o.status : 'completed',
    date: o.createdAt,
    paymentMethod: o.paymentMethod
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [wishlist, setWishlist] = useState<string[]>(() => load('wishlist', []))
  const [cart, setCart] = useState<string[]>(() => load('cart', []))
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, number>>({})

  useEffect(() => save('users', users), [users])
  useEffect(() => save('enrollments', enrollments), [enrollments])
  useEffect(() => save('wishlist', wishlist), [wishlist])
  useEffect(() => save('cart', cart), [cart])
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

  const hydrateStudentData = useCallback(async (token: string) => {
    try {
      const [enRes, ordersRes, certsRes, notifRes] = await Promise.all([
        studentApi.listEnrollments(token),
        studentApi.listOrders(token),
        studentApi.listCertificates(token),
        studentApi.listNotifications(token)
      ])
      setEnrollments(enRes.enrollments.map(toEnrollment))
      setOrders(ordersRes.orders.map(toOrder))
      setCertificates(certsRes.certificates.map((c) => ({
        id: c.id,
        userId: c.userId,
        courseId: c.courseId,
        instructorId: c.instructorId,
        issuedAt: c.issuedAt,
        completionDate: c.completionDate,
        verificationCode: c.verificationCode,
        course: c.course
      })))
      setNotifications(notifRes.notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt,
        link: n.link
      })))
    } catch {
      /* keep local fallback data when offline */
    }
  }, [])

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setAuthStatus('unauthenticated')
      return
    }
    let cancelled = false
    authApi.me(token)
      .then(({ user }) => {
        if (cancelled) return
        setCurrentUser(normalizeUser(user))
        setAuthStatus('authenticated')
        hydrateStudentData(token)
      })
      .catch(() => {
        if (cancelled) return
        clearStoredToken()
        setCurrentUser(null)
        setAuthStatus('unauthenticated')
      })
    return () => {
      cancelled = true
    }
  }, [hydrateStudentData])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { user, token } = await authApi.login({ email, password })
      storeToken(token)
      setCurrentUser(normalizeUser(user))
      setAuthStatus('authenticated')
      hydrateStudentData(token)
      return { ok: true, user: normalizeUser(user) }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [hydrateStudentData])

  const register = useCallback(async (name: string, email: string, password: string, role: 'student' | 'instructor') => {
    try {
      const { user, token } = await authApi.register({ name, email, password, role })
      storeToken(token)
      setCurrentUser(normalizeUser(user))
      setAuthStatus('authenticated')
      hydrateStudentData(token)
      return { ok: true, user: normalizeUser(user) }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [hydrateStudentData])

  const logout = useCallback(async () => {
    const token = getStoredToken()
    clearStoredToken()
    setCurrentUser(null)
    setAuthStatus('unauthenticated')
    if (token) {
      try {
        await authApi.logout(token)
      } catch {
        /* ignore */
      }
    }
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await authApi.forgotPassword(email)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      await authApi.resetPassword({ token, password })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [])

  const verifyEmail = useCallback(async (token: string) => {
    try {
      await authApi.verifyEmail(token)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [])

  const enroll = useCallback(async (courseId: string) => {
    const userId = currentUser?.id
    const token = getStoredToken()
    if (!userId) return
    if (token) {
      try {
        const { enrollment } = await studentApi.enroll(token, { courseId })
        setEnrollments((e) => e.some((x) => x.userId === userId && x.courseId === courseId) ? e : [...e, toEnrollment(enrollment)])
        return
      } catch {
        /* fall through to local */
      }
    }
    setEnrollments((e) => {
      if (e.some((x) => x.userId === userId && x.courseId === courseId)) return e
      const en: Enrollment = {
        id: uid('en'), userId, courseId, enrolledAt: new Date().toISOString(),
        progress: 0, status: 'active', completedLessons: [], pricePaid: 0
      }
      return [...e, en]
    })
  }, [currentUser])

  const completeLesson = useCallback(async (courseId: string, lessonId: string) => {
    const userId = currentUser?.id
    const token = getStoredToken()
    if (!userId) return
    setEnrollments((e) => e.map((en) => {
      if (en.userId !== userId || en.courseId !== courseId) return en
      if (en.completedLessons.includes(lessonId)) return en
      const completedLessons = [...en.completedLessons, lessonId]
      const progress = Math.min(100, Math.round((completedLessons.length / 12) * 100) + Math.round((completedLessons.length * 100) / 120))
      return { ...en, completedLessons, progress, status: progress >= 100 ? 'completed' : en.status }
    }))
    if (token) {
      try {
        const current = enrollments.find((x) => x.userId === userId && x.courseId === courseId)
        const completedLessons = [...(current?.completedLessons ?? []), lessonId]
        const { enrollment } = await studentApi.updateEnrollment(token, courseId, { completedLessons })
        setEnrollments((e) => e.map((en) => en.courseId === courseId && en.userId === userId ? toEnrollment(enrollment) : en))
        if (enrollment.status === 'completed') {
          const certsRes = await studentApi.listCertificates(token)
          setCertificates(certsRes.certificates.map((c) => ({
            id: c.id, userId: c.userId, courseId: c.courseId, instructorId: c.instructorId,
            issuedAt: c.issuedAt, completionDate: c.completionDate, verificationCode: c.verificationCode
          })))
        }
      } catch {
        /* keep local state */
      }
    }
  }, [currentUser, enrollments])

  const setCurrentLesson = useCallback(async (courseId: string, lessonId: string) => {
    const userId = currentUser?.id
    const token = getStoredToken()
    if (!userId) return
    setEnrollments((e) => e.map((en) =>
      en.userId === userId && en.courseId === courseId ? { ...en, currentLessonId: lessonId } : en
    ))
    if (token) {
      try {
        await studentApi.updateEnrollment(token, courseId, { currentLessonId: lessonId })
      } catch {
        /* keep local state */
      }
    }
  }, [currentUser])

  const toggleWishlist = useCallback((courseId: string) => {
    setWishlist((w) => w.includes(courseId) ? w.filter((c) => c !== courseId) : [...w, courseId])
  }, [])

  const addToCart = useCallback((courseId: string) => {
    setCart((c) => (c.includes(courseId) ? c : [...c, courseId]))
  }, [])

  const removeFromCart = useCallback((courseId: string) => {
    setCart((c) => c.filter((x) => x !== courseId))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const checkout = useCallback(async (method: string): Promise<'completed' | 'redirected'> => {
    if (!currentUser) return 'completed'
    const token = getStoredToken()
    const courseIds = [...cart]
    if (token && courseIds.length > 0) {
      try {
        const result = await studentApi.checkout(token, {
          courseIds,
          paymentMethod: method,
          callbackUrl: `${window.location.origin}/checkout`
        })
        if (result.authorizationUrl) {
          window.location.assign(result.authorizationUrl)
          return 'redirected'
        }
        const { enrollments: newEnrollments, order } = result
        setEnrollments((e) => {
          const next = [...e]
          newEnrollments.forEach((en) => {
            if (!next.some((x) => x.userId === currentUser.id && x.courseId === en.courseId)) next.push(toEnrollment(en))
          })
          return next
        })
        setOrders((o) => [...o, toOrder({ ...order, userId: currentUser.id, items: order.items, createdAt: order.createdAt })])
        setCart([])
        return 'completed'
      } catch {
        /* fall through to local */
      }
    }
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
    return 'completed'
  }, [cart, currentUser])

  const verifyCheckout = useCallback(async (reference: string) => {
    const token = getStoredToken()
    if (!currentUser || !token) return { ok: false, error: 'Not authenticated.' }
    try {
      const { order, enrollments: newEnrollments } = await studentApi.verifyCheckout(token, reference)
      setEnrollments((e) => {
        const next = [...e]
        newEnrollments.forEach((en) => {
          if (!next.some((x) => x.userId === currentUser.id && x.courseId === en.courseId)) next.push(toEnrollment(en))
        })
        return next
      })
      setOrders((o) => o.some((x) => x.id === order.id) ? o : [...o, toOrder({ ...order, userId: currentUser.id, items: order.items, createdAt: order.createdAt })])
      setCart([])
      return { ok: true, enrollments: newEnrollments, order }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [currentUser])

  const markNotificationsRead = useCallback(() => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })))
    const token = getStoredToken()
    if (token) studentApi.markNotificationsRead(token).catch(() => {})
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
    const token = getStoredToken()
    if (!currentUser || !token) return { ok: false, error: 'You must be logged in.' }
    try {
      const { user } = await authApi.updateProfile(token, patch)
      setCurrentUser(normalizeUser(user))
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [currentUser])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const token = getStoredToken()
    if (!currentUser || !token) return { ok: false, error: 'You must be logged in.' }
    try {
      await authApi.changePassword(token, { currentPassword, newPassword })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) }
    }
  }, [currentUser])

  const deleteAccount = useCallback(async () => {
    const token = getStoredToken()
    if (!currentUser || !token) return { ok: false, error: 'You must be logged in.' }
    try {
      await authApi.deleteAccount(token)
      clearStoredToken()
      setCurrentUser(null)
      setAuthStatus('unauthenticated')
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
    authStatus, currentUser, users, enrollments, wishlist, cart, notifications, conversations, messages,
    submissions, orders, certificates, toasts,
    login, register, logout, forgotPassword, resetPassword, verifyEmail, enroll, completeLesson,
    setCurrentLesson, toggleWishlist, addToCart, removeFromCart, clearCart, checkout, verifyCheckout, markNotificationsRead,
    sendMessage, submitAssignment, toast, dismissToast, updateProfile, changePassword, deleteAccount,
    issueCertificate, resetAll
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
