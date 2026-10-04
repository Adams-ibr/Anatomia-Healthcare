import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { AppProvider, useApp } from '../lib/store'
import { homePath } from '../lib/utils'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ToastHost } from '../components/toast'
import { PortalLayout } from '../layouts/PortalLayout'
import type { NavItem } from '../layouts/PortalLayout'
import Landing from './Landing'
import Courses from './Courses'
import CourseDetails from './CourseDetails'
import Login from './Login'
import Register from './Register'
import ForgotPassword, { ResetPassword } from './Auth'
import VerifyEmail from './VerifyEmail'
import StudentDashboard from './StudentDashboard'
import MyLearning, { Wishlist, Certificates, Orders } from './Student'
import { CertificateDetail, VerifyCertificate } from './Certificates'
import { Assignments, Assessments, AssessmentPlayer } from './Assessments'
import LearningPlayer from './LearningPlayer'
import CourseStudy from './CourseStudy'
import Calendar from './Calendar'
import Messages from './Messages'
import NotificationsPage from './Notifications'
import ProfilePage from './Profile'
import SettingsPage from './Settings'
import Community from './Community'
import Checkout from './Checkout'
import Search from './Search'
import { About, Blog, BlogPost, InstructorProfile, Instructors, Pricing, Support } from './Marketing'
import { InstructorDashboard, InstructorStudents, InstructorAnalytics, InstructorEarnings } from './Instructor'
import { InstructorCourses } from './InstructorCourses'
import CourseStudio from './CourseStudio'
import { AdminDashboard, AdminEnrollments } from './Admin'
import AdminUsers from './AdminUsers'
import AdminInstructors from './AdminInstructors'
import AdminCourses from './AdminCourses'
import AdminCategories from './AdminCategories'
import { AdminCertificates, AdminOrders, AdminPayments, AdminAnnouncements, AdminReports, AdminAnalytics, AdminSettings } from './Admin2'
import AdminAnatomyModels from './AdminAnatomyModels'
import AdminFlashcards from './AdminFlashcards'
import AdminLessons from './AdminLessons'
import AdminModules from './AdminModules'
import AdminQuestionBank from './AdminQuestionBank'
import AdminArticles from './AdminArticles'
import AdminContacts from './AdminContacts'
import AdminDepartments from './AdminDepartments'
import AdminFaq from './AdminFaq'
import AdminMembers from './AdminMembers'
import AdminProducts from './AdminProducts'
import AdminTeam from './AdminTeam'
import AdminCareers from './AdminCareers'
import AdminGallery from './AdminGallery'
import AdminPartners from './AdminPartners'
import AdminNewsletter from './AdminNewsletter'
import AdminApplications from './AdminApplications'

function AuthLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-500" />
    </div>
  )
}

function RequireAuth() {
  const { currentUser, authStatus } = useApp()
  if (authStatus === 'loading') return <AuthLoader />
  if (!currentUser) return <Navigate to={`/login?next=${encodeURIComponent(window.location.pathname)}`} replace />
  return <Outlet />
}

function RequireRole({ role }: { role: string }) {
  const { currentUser, authStatus } = useApp()
  if (authStatus === 'loading') return <AuthLoader />
  if (!currentUser) return <Navigate to={`/login?next=${encodeURIComponent(window.location.pathname)}`} replace />
  if (currentUser.role !== role && currentUser.role !== 'admin') return <Navigate to={homePath(currentUser.role)} replace />
  return <Outlet />
}

function PublicOnly() {
  const { currentUser, authStatus } = useApp()
  const location = useLocation()
  if (authStatus === 'loading') return <AuthLoader />
  if (currentUser) {
    const next = new URLSearchParams(location.search).get('next')
    const target = next && next.startsWith('/') ? next : homePath(currentUser.role)
    return <Navigate to={target} replace />
  }
  return <Outlet />
}

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  )
}

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname, search])
  return null
}

function NotFound() {
  const nav = useNavigate()
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-6xl font-bold text-brand-700">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-muted">The page you're looking for doesn't exist or has moved.</p>
      <button onClick={() => nav('/')} className="btn-primary mt-6">Back to home</button>
    </div>
  )
}

const I = (p: string, opts = ''): React.ReactNode => <svg className={`h-4 w-4 ${opts}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={p} /></svg>

const NAV_ICONS = {
  dash: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5V6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  heart: 'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z',
  cert: 'M12 2a6 6 0 0 0-4 10.47V22l4-2 4 2v-9.53A6 6 0 0 0 12 2z',
  assign: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1M9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1m-6 9 2 2 4-4',
  assess: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  cal: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  msg: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  plus: 'M12 5v14M5 12h14',
  chart: 'M3 3v18h18M7 12h3v6H7zM13 8h3v10h-3zM18 5h3v13h-3z',
  wallet: 'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  tag: 'M20.59 13.41 11 3H3v8l10.41 10.41a2 2 0 0 0 2.83 0l4.17-4.17a2 2 0 0 0 0-2.83zM7 7h.01',
  cart: 'M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM20 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6',
  card: 'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20',
  megaphone: 'M3 11v2a1 1 0 0 0 1 1h3l4 4V6l-4 4H4a1 1 0 0 0-1 1zM14 10a4 4 0 0 1 0 6M18 8a8 8 0 0 1 0 8',
  report: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
}

const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: I(NAV_ICONS.dash), end: true },
  {
    label: 'Learning',
    icon: I(NAV_ICONS.book),
    children: [
      { label: 'My Learning', to: '/my-learning', icon: I(NAV_ICONS.book) },
      { label: 'Discover', to: '/courses', icon: I(NAV_ICONS.search) },
      { label: 'Wishlist', to: '/wishlist', icon: I(NAV_ICONS.heart) }
    ]
  },
  {
    label: 'Academics',
    icon: I(NAV_ICONS.assign),
    children: [
      { label: 'Assignments', to: '/assignments', icon: I(NAV_ICONS.assign) },
      { label: 'Assessments', to: '/assessments', icon: I(NAV_ICONS.assess) },
      { label: 'Calendar', to: '/calendar', icon: I(NAV_ICONS.cal) }
    ]
  },
  {
    label: 'Account',
    icon: I(NAV_ICONS.user),
    children: [
      { label: 'Certificates', to: '/certificates', icon: I(NAV_ICONS.cert) },
      { label: 'My Orders', to: '/orders', icon: I(NAV_ICONS.cart) }
    ]
  },
  { label: 'Messages', to: '/messages', icon: I(NAV_ICONS.msg) },
  { label: 'Community', to: '/community', icon: I(NAV_ICONS.users) }
]

const INSTRUCTOR_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/instructor', icon: I(NAV_ICONS.dash), end: true },
  {
    label: 'Courses',
    icon: I(NAV_ICONS.book),
    children: [
      { label: 'My Courses', to: '/instructor/courses', icon: I(NAV_ICONS.book) },
      { label: 'Create Course', to: '/instructor/courses/new', icon: I(NAV_ICONS.plus) }
    ]
  },
  {
    label: 'Insights',
    icon: I(NAV_ICONS.chart),
    children: [
      { label: 'Students', to: '/instructor/students', icon: I(NAV_ICONS.users) },
      { label: 'Analytics', to: '/instructor/analytics', icon: I(NAV_ICONS.chart) },
      { label: 'Earnings', to: '/instructor/earnings', icon: I(NAV_ICONS.wallet) }
    ]
  },
  { label: 'Messages', to: '/messages', icon: I(NAV_ICONS.msg) }
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: I(NAV_ICONS.dash), end: true },
  
  // User Management Group
  { 
    label: 'User Management', 
    icon: I(NAV_ICONS.users),
    children: [
      { label: 'Users', to: '/admin/users', icon: I(NAV_ICONS.user) },
      { label: 'Instructors', to: '/admin/instructors', icon: I(NAV_ICONS.users) },
      { label: 'Members', to: '/admin/members', icon: I(NAV_ICONS.users) },
    ]
  },
  
  // Learning Content Group
  {
    label: 'Learning Content',
    icon: I(NAV_ICONS.book),
    children: [
      { label: 'Courses', to: '/admin/courses', icon: I(NAV_ICONS.book) },
      { label: 'Categories', to: '/admin/categories', icon: I(NAV_ICONS.tag) },
      { label: 'Modules', to: '/admin/modules', icon: I(NAV_ICONS.book) },
      { label: 'Lessons', to: '/admin/lessons', icon: I(NAV_ICONS.book) },
      { label: '3D Models', to: '/admin/anatomy-models', icon: I(NAV_ICONS.tag) },
      { label: 'Flashcards', to: '/admin/flashcards', icon: I(NAV_ICONS.tag) },
      { label: 'Question Bank', to: '/admin/question-bank', icon: I(NAV_ICONS.assess) },
    ]
  },
  
  // Enrollments & Certifications
  {
    label: 'Enrollments',
    icon: I(NAV_ICONS.cert),
    children: [
      { label: 'Enrollments', to: '/admin/enrollments', icon: I(NAV_ICONS.users) },
      { label: 'Certificates', to: '/admin/certificates', icon: I(NAV_ICONS.cert) },
    ]
  },
  
  // E-commerce Group
  {
    label: 'E-commerce',
    icon: I(NAV_ICONS.cart),
    children: [
      { label: 'Orders', to: '/admin/orders', icon: I(NAV_ICONS.cart) },
      { label: 'Payments', to: '/admin/payments', icon: I(NAV_ICONS.card) },
      { label: 'Products', to: '/admin/products', icon: I(NAV_ICONS.cart) },
    ]
  },
  
  // Content Management Group
  {
    label: 'Content',
    icon: I(NAV_ICONS.report),
    children: [
      { label: 'Articles', to: '/admin/articles', icon: I(NAV_ICONS.report) },
      { label: 'FAQ', to: '/admin/faq', icon: I(NAV_ICONS.report) },
      { label: 'Gallery', to: '/admin/gallery', icon: I(NAV_ICONS.tag) },
    ]
  },
  
  // Organization Group
  {
    label: 'Organization',
    icon: I(NAV_ICONS.users),
    children: [
      { label: 'Team', to: '/admin/team', icon: I(NAV_ICONS.users) },
      { label: 'Departments', to: '/admin/departments', icon: I(NAV_ICONS.tag) },
      { label: 'Partners', to: '/admin/partners', icon: I(NAV_ICONS.users) },
    ]
  },
  
  // Careers Group
  {
    label: 'Careers',
    icon: I(NAV_ICONS.report),
    children: [
      { label: 'Job Postings', to: '/admin/careers', icon: I(NAV_ICONS.report) },
      { label: 'Applications', to: '/admin/applications', icon: I(NAV_ICONS.report) },
    ]
  },
  
  // Communications Group
  {
    label: 'Communications',
    icon: I(NAV_ICONS.msg),
    children: [
      { label: 'Contacts', to: '/admin/contacts', icon: I(NAV_ICONS.msg) },
      { label: 'Newsletter', to: '/admin/newsletter', icon: I(NAV_ICONS.msg) },
      { label: 'Announcements', to: '/admin/announcements', icon: I(NAV_ICONS.megaphone) },
    ]
  },
  
  // Analytics & Reports
  { label: 'Reports', to: '/admin/reports', icon: I(NAV_ICONS.report) },
  { label: 'Analytics', to: '/admin/analytics', icon: I(NAV_ICONS.chart) },
  { label: 'Settings', to: '/admin/settings', icon: I(NAV_ICONS.settings) },
]

export default function App() {
  return (
    <AppProvider>
      <MotionConfig reducedMotion="user">
        <ScrollToTop />
        <Routes>
          <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetails />} />
          <Route path="/categories" element={<Courses />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/instructors/:id" element={<InstructorProfile />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/support" element={<Support />} />
          <Route path="/verify-certificate" element={<VerifyCertificate />} />
          <Route path="/verify-certificate/:id" element={<VerifyCertificate />} />
          <Route path="/community" element={<Community />} />
          <Route path="/search" element={<Search />} />
        </Route>

        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<PortalLayout nav={STUDENT_NAV} role="student" />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/my-learning" element={<MyLearning />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/certificates/:id" element={<CertificateDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/assessments/:id" element={<AssessmentPlayer />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/learning/:courseId" element={<CourseStudy />} />
            <Route path="/learning/:courseId/:lessonId" element={<LearningPlayer />} />
          </Route>
        </Route>

        <Route element={<RequireRole role="instructor" />}>
          <Route element={<PortalLayout nav={INSTRUCTOR_NAV} role="instructor" />}>
            <Route path="/instructor" element={<InstructorDashboard />} />
            <Route path="/instructor/courses" element={<InstructorCourses />} />
            <Route path="/instructor/courses/new" element={<CourseStudio />} />
            <Route path="/instructor/courses/:id/edit" element={<CourseStudio />} />
            <Route path="/instructor/students" element={<InstructorStudents />} />
            <Route path="/instructor/analytics" element={<InstructorAnalytics />} />
            <Route path="/instructor/earnings" element={<InstructorEarnings />} />
          </Route>
        </Route>

        <Route element={<RequireRole role="admin" />}>
          <Route element={<PortalLayout nav={ADMIN_NAV} role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/instructors" element={<AdminInstructors />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/modules" element={<AdminModules />} />
            <Route path="/admin/lessons" element={<AdminLessons />} />
            <Route path="/admin/anatomy-models" element={<AdminAnatomyModels />} />
            <Route path="/admin/flashcards" element={<AdminFlashcards />} />
            <Route path="/admin/question-bank" element={<AdminQuestionBank />} />
            <Route path="/admin/enrollments" element={<AdminEnrollments />} />
            <Route path="/admin/certificates" element={<AdminCertificates />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/articles" element={<AdminArticles />} />
            <Route path="/admin/contacts" element={<AdminContacts />} />
            <Route path="/admin/departments" element={<AdminDepartments />} />
            <Route path="/admin/faq" element={<AdminFaq />} />
            <Route path="/admin/members" element={<AdminMembers />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/team" element={<AdminTeam />} />
            <Route path="/admin/careers" element={<AdminCareers />} />
            <Route path="/admin/gallery" element={<AdminGallery />} />
            <Route path="/admin/partners" element={<AdminPartners />} />
            <Route path="/admin/newsletter" element={<AdminNewsletter />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastHost />
      </MotionConfig>
    </AppProvider>
  )
}