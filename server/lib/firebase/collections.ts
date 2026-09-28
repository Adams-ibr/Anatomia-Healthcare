import { getFirebaseAdminFirestore } from "./admin";
import type { CollectionReference, Firestore, Timestamp } from "firebase-admin/firestore";

const db = getFirebaseAdminFirestore();

export const collections = {
  users: db.collection("users") as CollectionReference<UserDoc>,
  members: db.collection("members") as CollectionReference<MemberDoc>,
  articles: db.collection("articles") as CollectionReference<ArticleDoc>,
  galleryItems: db.collection("gallery_items") as CollectionReference<GalleryItemDoc>,
  partners: db.collection("partners") as CollectionReference<PartnerDoc>,
  teamMembers: db.collection("team_members") as CollectionReference<TeamMemberDoc>,
  products: db.collection("products") as CollectionReference<ProductDoc>,
  faqItems: db.collection("faq_items") as CollectionReference<FaqItemDoc>,
  careers: db.collection("careers") as CollectionReference<CareerDoc>,
  departments: db.collection("departments") as CollectionReference<DepartmentDoc>,
  contactMessages: db.collection("contact_messages") as CollectionReference<ContactMessageDoc>,
  newsletterSubscriptions: db.collection("newsletter_subscriptions") as CollectionReference<NewsletterSubscriptionDoc>,
  waitlist: db.collection("waitlist") as CollectionReference<WaitlistDoc>,
  jobApplications: db.collection("job_applications") as CollectionReference<JobApplicationDoc>,
  conversations: db.collection("conversations") as CollectionReference<ConversationDoc>,
  messages: db.collection("messages") as CollectionReference<MessageDoc>,
  conversationParticipants: db.collection("conversation_participants") as CollectionReference<ConversationParticipantDoc>,
  comments: db.collection("comments") as CollectionReference<CommentDoc>,
  likes: db.collection("likes") as CollectionReference<LikeDoc>,
  membershipPlans: db.collection("membership_plans") as CollectionReference<MembershipPlanDoc>,
  planPricing: db.collection("plan_pricing") as CollectionReference<PlanPricingDoc>,
  featureAccess: db.collection("feature_access") as CollectionReference<FeatureAccessDoc>,
  userSubscriptions: db.collection("user_subscriptions") as CollectionReference<UserSubscriptionDoc>,
  payments: db.collection("payments") as CollectionReference<PaymentDoc>,
  invoices: db.collection("invoices") as CollectionReference<InvoiceDoc>,
  courses: db.collection("courses") as CollectionReference<CourseDoc>,
  lessons: db.collection("lessons") as CollectionReference<LessonDoc>,
  enrollments: db.collection("enrollments") as CollectionReference<EnrollmentDoc>,
  quizzes: db.collection("quizzes") as CollectionReference<QuizDoc>,
  quizAttempts: db.collection("quiz_attempts") as CollectionReference<QuizAttemptDoc>,
  certificates: db.collection("certificates") as CollectionReference<CertificateDoc>,
  quizQuestions: db.collection("quiz_questions") as CollectionReference<QuizQuestionDoc>,
  lessonProgress: db.collection("lesson_progress") as CollectionReference<LessonProgressDoc>,
  analyticsEvents: db.collection("analytics_events") as CollectionReference<AnalyticsEventDoc>,
  emailTemplates: db.collection("email_templates") as CollectionReference<EmailTemplateDoc>,
  activityLogs: db.collection("activity_logs") as CollectionReference<ActivityLogDoc>,
};

export function getCollection<T>(name: keyof typeof collections): CollectionReference<T> {
  return collections[name] as CollectionReference<T>;
}

export interface UserDoc {
  id: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MemberDoc {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  membershipTier: string;
  membershipExpiresAt?: Timestamp;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  profileImageUrl?: string;
  bio?: string;
  specialties?: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ArticleDoc {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  imageUrl?: string;
  readTime: number;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GalleryItemDoc {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PartnerDoc {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TeamMemberDoc {
  id: string;
  name: string;
  role: string;
  bio?: string;
  imageUrl?: string;
  socialLinks?: Record<string, string>;
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductDoc {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  category: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FaqItemDoc {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CareerDoc {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  benefits: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DepartmentDoc {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ContactMessageDoc {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewsletterSubscriptionDoc {
  id: string;
  email: string;
  isActive: boolean;
  subscribedAt: Timestamp;
  unsubscribedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WaitlistDoc {
  id: string;
  email: string;
  name?: string;
  source?: string;
  isNotified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface JobApplicationDoc {
  id: string;
  careerId: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl: string;
  coverLetter?: string;
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ConversationDoc {
  id: string;
  type: string;
  title?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageDoc {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  metadata?: Record<string, unknown>;
  isDeleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ConversationParticipantDoc {
  id: string;
  conversationId: string;
  memberId: string;
  joinedAt: Timestamp;
  leftAt?: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CommentDoc {
  id: string;
  entityType: string;
  entityId: string;
  authorId: string;
  content: string;
  parentId?: string;
  isDeleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LikeDoc {
  id: string;
  entityType: string;
  entityId: string;
  memberId: string;
  createdAt: Timestamp;
}

export interface MembershipPlanDoc {
  id: string;
  name: string;
  description?: string;
  tier: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlanPricingDoc {
  id: string;
  planId: string;
  interval: string;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FeatureAccessDoc {
  id: string;
  planId: string;
  featureKey: string;
  isEnabled: boolean;
  limit?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserSubscriptionDoc {
  id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentDoc {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerPaymentId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InvoiceDoc {
  id: string;
  userId: string;
  subscriptionId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: string;
  invoiceNumber: string;
  invoiceUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CourseDoc {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  category: string;
  level: string;
  duration: number;
  isPublished: boolean;
  isFree: boolean;
  price: number;
  currency: string;
  instructorId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LessonDoc {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isPublished: boolean;
  isFree: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EnrollmentDoc {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  progress: number;
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuizDoc {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuizAttemptDoc {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  answers: Record<string, unknown>;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CertificateDoc {
  id: string;
  userId: string;
  courseId: string;
  certificateNumber: string;
  issuedAt: Timestamp;
  expiresAt?: Timestamp;
  pdfUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuizQuestionDoc {
  id: string;
  quizId: string;
  question: string;
  type: string;
  options: string[];
  correctAnswer: string | string[];
  explanation?: string;
  order: number;
  points: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LessonProgressDoc {
  id: string;
  enrollmentId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: Timestamp;
  watchTime: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AnalyticsEventDoc {
  id: string;
  eventName: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, unknown>;
  timestamp: Timestamp;
  createdAt: Timestamp;
}

export interface EmailTemplateDoc {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActivityLogDoc {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Timestamp;
}