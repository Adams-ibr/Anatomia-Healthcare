export type Role = 'student' | 'instructor' | 'admin' | 'support'

export interface User {
  id: string
  name: string
  email: string
  password?: string
  role: Role
  avatar: string
  title?: string
  bio?: string
  skills?: string[]
  headline?: string
  isActive: boolean
  joinedAt: string
  studentCount?: number
  courseCount?: number
  rating?: number
  website?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  title?: string
  bio?: string
  skills?: string[]
  headline?: string
  website?: string
  studentCount?: number
  courseCount?: number
  rating?: number
  isActive: boolean
  joinedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  courseCount: number
  color: string
}

export type LessonType = 'video' | 'article' | 'pdf' | 'audio' | 'quiz' | 'assignment' | 'exam' | 'project'

export interface Lesson {
  id: string
  title: string
  type: LessonType
  duration: number
  content: string
  videoUrl?: string
  resourceUrl?: string
  completed?: boolean
}

export interface CourseSection {
  id: string
  title: string
  lessons: Lesson[]
}

export interface Objective {
  id: string
  text: string
}

export interface Requirement {
  id: string
  text: string
}

export interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  text: string
  date: string
}

export type CourseStatus = 'published' | 'draft' | 'pending' | 'approved' | 'archived'

export interface Course {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  longDescription: string
  categoryId: string
  instructorId: string
  thumbnail: string
  price: number
  discountPrice?: number
  rating: number
  reviewCount: number
  studentCount: number
  duration: number
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  language: string
  lastUpdated: string
  hasCertificate: boolean
  isFeatured: boolean
  isTrending: boolean
  isNew: boolean
  status: CourseStatus
  objectives: Objective[]
  requirements: Requirement[]
  sections: CourseSection[]
  reviews: Review[]
  faqs: { q: string; a: string }[]
}

export interface Enrollment {
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
}

export interface AssessmentQuestion {
  id: string
  type: 'mc' | 'multi' | 'truefalse' | 'short' | 'essay' | 'fill'
  question: string
  options?: string[]
  answer?: string | string[]
  explanation?: string
}

export interface Assessment {
  id: string
  courseId: string
  title: string
  description: string
  timeLimit: number
  passingScore: number
  questions: AssessmentQuestion[]
  retakeLimit: number
}

export interface Assignment {
  id: string
  courseId: string
  sectionId?: string
  title: string
  description: string
  deadline: string
  points: number
  resources?: { name: string; url: string }[]
  status: 'open' | 'graded' | 'closed'
}

export interface Submission {
  id: string
  assignmentId: string
  userId: string
  text: string
  link?: string
  files?: { name: string; url: string }[]
  submittedAt: string
  grade?: number
  feedback?: string
  returned?: boolean
}

export interface Certificate {
  id: string
  userId: string
  courseId: string
  instructorId: string
  issuedAt: string
  completionDate: string
  verificationCode: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

export interface Message {
  id: string
  conversationId: string
  fromId: string
  toId: string
  text: string
  attachment?: { name: string; url: string }
  read: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  participants: string[]
  lastMessageAt: string
}

export interface Discussion {
  id: string
  courseId: string
  authorId: string
  authorName: string
  title: string
  body: string
  likes: number
  answers: { id: string; authorId: string; authorName: string; text: string; date: string }[]
  createdAt: string
}

export interface Announcement {
  id: string
  courseId: string
  title: string
  body: string
  createdAt: string
  authorId: string
}

export interface LearningPath {
  id: string
  title: string
  description: string
  courses: string[]
  career: string
  icon: string
  level: string
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  authorTitle: string
  date: string
  readTime: number
  thumbnail: string
  content: string[]
}

export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  text: string
  rating: number
}

export interface FAQ {
  q: string
  a: string
}

export interface Plan {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  highlight?: boolean
}

export interface Order {
  id: string
  userId: string
  items: { courseId: string; title: string; price: number }[]
  total: number
  status: 'completed' | 'pending' | 'refunded'
  date: string
  paymentMethod: string
}
