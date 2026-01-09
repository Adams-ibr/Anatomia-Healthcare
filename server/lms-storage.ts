import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import {
  courseCategories, CourseCategory, InsertCourseCategory,
  courses, Course, InsertCourse,
  courseModules, CourseModule, InsertCourseModule,
  lessons, Lesson, InsertLesson,
  lessonAssets, LessonAsset, InsertLessonAsset,
  enrollments, Enrollment, InsertEnrollment,
  lessonProgress, LessonProgress, InsertLessonProgress,
  quizzes, Quiz, InsertQuiz,
  quizQuestions, QuizQuestion, InsertQuizQuestion,
  quizOptions, QuizOption, InsertQuizOption,
  quizAttempts, QuizAttempt, InsertQuizAttempt,
  certificates, Certificate, InsertCertificate,
  coursePrerequisites, CoursePrerequisite, InsertCoursePrerequisite,
  auditLogs, AuditLog, InsertAuditLog,
  notifications, Notification, InsertNotification,
  questionTopics, QuestionTopic, InsertQuestionTopic,
  questionBank, QuestionBankItem, InsertQuestionBank,
  questionBankOptions, QuestionBankOption, InsertQuestionBankOption,
  flashcardDecks, FlashcardDeck, InsertFlashcardDeck,
  flashcards, Flashcard, InsertFlashcard,
  flashcardProgress, FlashcardProgress, InsertFlashcardProgress,
  anatomyModels, AnatomyModel, InsertAnatomyModel,
  members, Member,
} from "@shared/schema";
import { users, User } from "@shared/models/auth";

export interface ILmsStorage {
  // Course Categories
  getCourseCategories(): Promise<CourseCategory[]>;
  getCourseCategoryById(id: string): Promise<CourseCategory | undefined>;
  createCourseCategory(category: InsertCourseCategory): Promise<CourseCategory>;
  updateCourseCategory(id: string, category: Partial<InsertCourseCategory>): Promise<CourseCategory | undefined>;
  deleteCourseCategory(id: string): Promise<boolean>;

  // Courses
  getCourses(): Promise<Course[]>;
  getPublishedCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  getCourseBySlug(slug: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;

  // Course Modules
  getModulesByCourseId(courseId: string): Promise<CourseModule[]>;
  getModuleById(id: string): Promise<CourseModule | undefined>;
  createModule(module: InsertCourseModule): Promise<CourseModule>;
  updateModule(id: string, module: Partial<InsertCourseModule>): Promise<CourseModule | undefined>;
  deleteModule(id: string): Promise<boolean>;

  // Lessons
  getLessonsByModuleId(moduleId: string): Promise<Lesson[]>;
  getLessonById(id: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<boolean>;

  // Lesson Assets
  getAssetsByLessonId(lessonId: string): Promise<LessonAsset[]>;
  createAsset(asset: InsertLessonAsset): Promise<LessonAsset>;
  deleteAsset(id: string): Promise<boolean>;

  // Enrollments
  getEnrollmentsByMemberId(memberId: string): Promise<Enrollment[]>;
  getEnrollmentsByCourseId(courseId: string): Promise<Enrollment[]>;
  getEnrollment(memberId: string, courseId: string): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, enrollment: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;

  // Lesson Progress
  getLessonProgress(memberId: string, lessonId: string): Promise<LessonProgress | undefined>;
  getMemberProgressByCourse(memberId: string, courseId: string): Promise<LessonProgress[]>;
  getRecentLessonProgress(memberId: string, limit: number): Promise<LessonProgress[]>;
  upsertLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress>;

  // Quizzes
  getQuizzesByCourseId(courseId: string): Promise<Quiz[]>;
  getQuizzesByLessonId(lessonId: string): Promise<Quiz[]>;
  getQuizById(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<boolean>;

  // Quiz Questions
  getQuestionsByQuizId(quizId: string): Promise<QuizQuestion[]>;
  createQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  updateQuestion(id: string, question: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined>;
  deleteQuestion(id: string): Promise<boolean>;

  // Quiz Options
  getOptionsByQuestionId(questionId: string): Promise<QuizOption[]>;
  createOption(option: InsertQuizOption): Promise<QuizOption>;
  deleteOption(id: string): Promise<boolean>;

  // Quiz Attempts
  getAttemptsByMemberId(memberId: string): Promise<QuizAttempt[]>;
  getAttemptsByQuizId(quizId: string): Promise<QuizAttempt[]>;
  createAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  updateAttempt(id: string, attempt: Partial<InsertQuizAttempt>): Promise<QuizAttempt | undefined>;

  // Certificates
  getCertificatesByMemberId(memberId: string): Promise<Certificate[]>;
  getCertificateByNumber(certificateNumber: string): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;

  // Course Prerequisites
  getPrerequisitesByCourseId(courseId: string): Promise<CoursePrerequisite[]>;
  addPrerequisite(prerequisite: InsertCoursePrerequisite): Promise<CoursePrerequisite>;
  removePrerequisite(courseId: string, prerequisiteId: string): Promise<boolean>;
  checkPrerequisitesMet(memberId: string, courseId: string): Promise<boolean>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]>;

  // Notifications
  getNotificationsByMemberId(memberId: string): Promise<Notification[]>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<boolean>;
  markAllNotificationsRead(memberId?: string, userId?: string): Promise<boolean>;

  // Question Bank Topics
  getQuestionTopics(): Promise<QuestionTopic[]>;
  getQuestionTopicById(id: string): Promise<QuestionTopic | undefined>;
  createQuestionTopic(topic: InsertQuestionTopic): Promise<QuestionTopic>;
  updateQuestionTopic(id: string, topic: Partial<InsertQuestionTopic>): Promise<QuestionTopic | undefined>;
  deleteQuestionTopic(id: string): Promise<boolean>;

  // Question Bank
  getQuestionBankItems(filters?: { topicId?: string; difficulty?: string }): Promise<QuestionBankItem[]>;
  getQuestionBankItemById(id: string): Promise<QuestionBankItem | undefined>;
  createQuestionBankItem(item: InsertQuestionBank): Promise<QuestionBankItem>;
  updateQuestionBankItem(id: string, item: Partial<InsertQuestionBank>): Promise<QuestionBankItem | undefined>;
  deleteQuestionBankItem(id: string): Promise<boolean>;

  // Question Bank Options
  getQuestionBankOptionsByQuestionId(questionId: string): Promise<QuestionBankOption[]>;
  createQuestionBankOption(option: InsertQuestionBankOption): Promise<QuestionBankOption>;
  deleteQuestionBankOption(id: string): Promise<boolean>;

  // Flashcard Decks
  getFlashcardDecks(courseId?: string): Promise<FlashcardDeck[]>;
  getFlashcardDeckById(id: string): Promise<FlashcardDeck | undefined>;
  createFlashcardDeck(deck: InsertFlashcardDeck): Promise<FlashcardDeck>;
  updateFlashcardDeck(id: string, deck: Partial<InsertFlashcardDeck>): Promise<FlashcardDeck | undefined>;
  deleteFlashcardDeck(id: string): Promise<boolean>;

  // Flashcards
  getFlashcardsByDeckId(deckId: string): Promise<Flashcard[]>;
  getFlashcardById(id: string): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, flashcard: Partial<InsertFlashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: string): Promise<boolean>;

  // Flashcard Progress
  getFlashcardProgress(memberId: string, flashcardId: string): Promise<FlashcardProgress | undefined>;
  getDueFlashcards(memberId: string, deckId: string): Promise<FlashcardProgress[]>;
  upsertFlashcardProgress(progress: InsertFlashcardProgress): Promise<FlashcardProgress>;

  // Anatomy Models
  getAnatomyModels(filters?: { category?: string; bodySystem?: string }): Promise<AnatomyModel[]>;
  getAnatomyModelById(id: string): Promise<AnatomyModel | undefined>;
  createAnatomyModel(model: InsertAnatomyModel): Promise<AnatomyModel>;
  updateAnatomyModel(id: string, model: Partial<InsertAnatomyModel>): Promise<AnatomyModel | undefined>;
  deleteAnatomyModel(id: string): Promise<boolean>;

  // Members (for certificate generation and admin management)
  getMemberById(id: string): Promise<Member | undefined>;
  getAllMembers(): Promise<Member[]>;
  updateMemberMembership(id: string, tier: string, expiresAt?: Date | null): Promise<Member | undefined>;

  // Admin Users (Super Admin only)
  getAllAdminUsers(): Promise<Omit<User, "password">[]>;
  getAdminUserById(id: string): Promise<Omit<User, "password"> | undefined>;
  updateAdminUserRole(id: string, role: string): Promise<Omit<User, "password"> | undefined>;
  updateAdminUserStatus(id: string, isActive: boolean): Promise<Omit<User, "password"> | undefined>;
  deleteAdminUser(id: string): Promise<Omit<User, "password"> | undefined>;
}

export class LmsStorage implements ILmsStorage {
  // Course Categories
  async getCourseCategories(): Promise<CourseCategory[]> {
    return db.select().from(courseCategories).orderBy(asc(courseCategories.order));
  }

  async getCourseCategoryById(id: string): Promise<CourseCategory | undefined> {
    const [category] = await db.select().from(courseCategories).where(eq(courseCategories.id, id));
    return category;
  }

  async createCourseCategory(category: InsertCourseCategory): Promise<CourseCategory> {
    const [newCategory] = await db.insert(courseCategories).values(category).returning();
    return newCategory;
  }

  async updateCourseCategory(id: string, category: Partial<InsertCourseCategory>): Promise<CourseCategory | undefined> {
    const [updated] = await db.update(courseCategories).set({ ...category, updatedAt: new Date() }).where(eq(courseCategories.id, id)).returning();
    return updated;
  }

  async deleteCourseCategory(id: string): Promise<boolean> {
    const result = await db.delete(courseCategories).where(eq(courseCategories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Courses
  async getCourses(): Promise<Course[]> {
    return db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getPublishedCourses(): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.isPublished, true)).orderBy(desc(courses.createdAt));
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db.update(courses).set({ ...course, updatedAt: new Date() }).where(eq(courses.id, id)).returning();
    return updated;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Course Modules
  async getModulesByCourseId(courseId: string): Promise<CourseModule[]> {
    return db.select().from(courseModules).where(eq(courseModules.courseId, courseId)).orderBy(asc(courseModules.order));
  }

  async getModuleById(id: string): Promise<CourseModule | undefined> {
    const [module] = await db.select().from(courseModules).where(eq(courseModules.id, id));
    return module;
  }

  async createModule(module: InsertCourseModule): Promise<CourseModule> {
    const [newModule] = await db.insert(courseModules).values(module).returning();
    return newModule;
  }

  async updateModule(id: string, module: Partial<InsertCourseModule>): Promise<CourseModule | undefined> {
    const [updated] = await db.update(courseModules).set(module).where(eq(courseModules.id, id)).returning();
    return updated;
  }

  async deleteModule(id: string): Promise<boolean> {
    const result = await db.delete(courseModules).where(eq(courseModules.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Lessons
  async getLessonsByModuleId(moduleId: string): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.moduleId, moduleId)).orderBy(asc(lessons.order));
  }

  async getLessonById(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updated] = await db.update(lessons).set({ ...lesson, updatedAt: new Date() }).where(eq(lessons.id, id)).returning();
    return updated;
  }

  async deleteLesson(id: string): Promise<boolean> {
    const result = await db.delete(lessons).where(eq(lessons.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Lesson Assets
  async getAssetsByLessonId(lessonId: string): Promise<LessonAsset[]> {
    return db.select().from(lessonAssets).where(eq(lessonAssets.lessonId, lessonId)).orderBy(asc(lessonAssets.order));
  }

  async createAsset(asset: InsertLessonAsset): Promise<LessonAsset> {
    const [newAsset] = await db.insert(lessonAssets).values(asset).returning();
    return newAsset;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const result = await db.delete(lessonAssets).where(eq(lessonAssets.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Enrollments
  async getEnrollmentsByMemberId(memberId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.memberId, memberId));
  }

  async getEnrollmentsByCourseId(courseId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async getEnrollment(memberId: string, courseId: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(
      and(eq(enrollments.memberId, memberId), eq(enrollments.courseId, courseId))
    );
    return enrollment;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateEnrollment(id: string, enrollment: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const [updated] = await db.update(enrollments).set(enrollment).where(eq(enrollments.id, id)).returning();
    return updated;
  }

  // Lesson Progress
  async getLessonProgress(memberId: string, lessonId: string): Promise<LessonProgress | undefined> {
    const [progress] = await db.select().from(lessonProgress).where(
      and(eq(lessonProgress.memberId, memberId), eq(lessonProgress.lessonId, lessonId))
    );
    return progress;
  }

  async getMemberProgressByCourse(memberId: string, courseId: string): Promise<LessonProgress[]> {
    const modulesInCourse = await db.select().from(courseModules).where(eq(courseModules.courseId, courseId));
    const moduleIds = modulesInCourse.map(m => m.id);
    
    if (moduleIds.length === 0) return [];
    
    const lessonsInCourse = await db.select().from(lessons).where(eq(lessons.moduleId, moduleIds[0]));
    for (let i = 1; i < moduleIds.length; i++) {
      const moreLessons = await db.select().from(lessons).where(eq(lessons.moduleId, moduleIds[i]));
      lessonsInCourse.push(...moreLessons);
    }
    
    const lessonIds = lessonsInCourse.map(l => l.id);
    if (lessonIds.length === 0) return [];
    
    const progressRecords: LessonProgress[] = [];
    for (const lessonId of lessonIds) {
      const [progress] = await db.select().from(lessonProgress).where(
        and(eq(lessonProgress.memberId, memberId), eq(lessonProgress.lessonId, lessonId))
      );
      if (progress) progressRecords.push(progress);
    }
    
    return progressRecords;
  }

  async getRecentLessonProgress(memberId: string, limit: number): Promise<LessonProgress[]> {
    return db.select().from(lessonProgress)
      .where(eq(lessonProgress.memberId, memberId))
      .orderBy(desc(lessonProgress.lastAccessedAt))
      .limit(limit);
  }

  async upsertLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress> {
    const existing = await this.getLessonProgress(progress.memberId, progress.lessonId);
    
    if (existing) {
      const accumulatedTime = (existing.timeSpentSeconds || 0) + (progress.timeSpentSeconds || 0);
      const [updated] = await db.update(lessonProgress)
        .set({ 
          ...progress,
          timeSpentSeconds: accumulatedTime,
          lastAccessedAt: new Date(),
          completedAt: progress.isCompleted ? new Date() : existing.completedAt 
        })
        .where(eq(lessonProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newProgress] = await db.insert(lessonProgress).values(progress).returning();
      return newProgress;
    }
  }

  // Quizzes
  async getQuizzesByCourseId(courseId: string): Promise<Quiz[]> {
    return db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
  }

  async getQuizzesByLessonId(lessonId: string): Promise<Quiz[]> {
    return db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
  }

  async getQuizById(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async updateQuiz(id: string, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [updated] = await db.update(quizzes).set(quiz).where(eq(quizzes.id, id)).returning();
    return updated;
  }

  async deleteQuiz(id: string): Promise<boolean> {
    const result = await db.delete(quizzes).where(eq(quizzes.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Quiz Questions
  async getQuestionsByQuizId(quizId: string): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId)).orderBy(asc(quizQuestions.order));
  }

  async createQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [newQuestion] = await db.insert(quizQuestions).values(question).returning();
    return newQuestion;
  }

  async updateQuestion(id: string, question: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const [updated] = await db.update(quizQuestions).set(question).where(eq(quizQuestions.id, id)).returning();
    return updated;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const result = await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Quiz Options
  async getOptionsByQuestionId(questionId: string): Promise<QuizOption[]> {
    return db.select().from(quizOptions).where(eq(quizOptions.questionId, questionId)).orderBy(asc(quizOptions.order));
  }

  async createOption(option: InsertQuizOption): Promise<QuizOption> {
    const [newOption] = await db.insert(quizOptions).values(option).returning();
    return newOption;
  }

  async deleteOption(id: string): Promise<boolean> {
    const result = await db.delete(quizOptions).where(eq(quizOptions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Quiz Attempts
  async getAttemptsByMemberId(memberId: string): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts).where(eq(quizAttempts.memberId, memberId)).orderBy(desc(quizAttempts.startedAt));
  }

  async getAttemptsByQuizId(quizId: string): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts).where(eq(quizAttempts.quizId, quizId));
  }

  async createAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  async updateAttempt(id: string, attempt: Partial<InsertQuizAttempt>): Promise<QuizAttempt | undefined> {
    const [updated] = await db.update(quizAttempts).set({ ...attempt, completedAt: new Date() }).where(eq(quizAttempts.id, id)).returning();
    return updated;
  }

  // Certificates
  async getCertificatesByMemberId(memberId: string): Promise<Certificate[]> {
    return db.select().from(certificates).where(eq(certificates.memberId, memberId));
  }

  async getCertificateByNumber(certificateNumber: string): Promise<Certificate | undefined> {
    const [cert] = await db.select().from(certificates).where(eq(certificates.certificateNumber, certificateNumber));
    return cert;
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [newCert] = await db.insert(certificates).values(certificate).returning();
    return newCert;
  }

  // Course Prerequisites
  async getPrerequisitesByCourseId(courseId: string): Promise<CoursePrerequisite[]> {
    return db.select().from(coursePrerequisites).where(eq(coursePrerequisites.courseId, courseId));
  }

  async addPrerequisite(prerequisite: InsertCoursePrerequisite): Promise<CoursePrerequisite> {
    const [newPrereq] = await db.insert(coursePrerequisites).values(prerequisite).returning();
    return newPrereq;
  }

  async removePrerequisite(courseId: string, prerequisiteId: string): Promise<boolean> {
    const result = await db.delete(coursePrerequisites)
      .where(and(
        eq(coursePrerequisites.courseId, courseId),
        eq(coursePrerequisites.prerequisiteId, prerequisiteId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async checkPrerequisitesMet(memberId: string, courseId: string): Promise<boolean> {
    const prereqs = await this.getPrerequisitesByCourseId(courseId);
    if (prereqs.length === 0) return true;

    for (const prereq of prereqs) {
      const enrollment = await this.getEnrollment(memberId, prereq.prerequisiteId);
      if (!enrollment || enrollment.status !== "completed") {
        return false;
      }
    }
    return true;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    return db.select().from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Notifications
  async getNotificationsByMemberId(memberId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.memberId, memberId))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async markAllNotificationsRead(memberId?: string, userId?: string): Promise<boolean> {
    if (memberId) {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.memberId, memberId));
      return true;
    }
    if (userId) {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
      return true;
    }
    return false;
  }

  // Question Bank Topics
  async getQuestionTopics(): Promise<QuestionTopic[]> {
    return db.select().from(questionTopics).orderBy(asc(questionTopics.order));
  }

  async getQuestionTopicById(id: string): Promise<QuestionTopic | undefined> {
    const [topic] = await db.select().from(questionTopics).where(eq(questionTopics.id, id));
    return topic;
  }

  async createQuestionTopic(topic: InsertQuestionTopic): Promise<QuestionTopic> {
    const [newTopic] = await db.insert(questionTopics).values(topic).returning();
    return newTopic;
  }

  async updateQuestionTopic(id: string, topic: Partial<InsertQuestionTopic>): Promise<QuestionTopic | undefined> {
    const [updated] = await db.update(questionTopics).set(topic).where(eq(questionTopics.id, id)).returning();
    return updated;
  }

  async deleteQuestionTopic(id: string): Promise<boolean> {
    const result = await db.delete(questionTopics).where(eq(questionTopics.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Question Bank
  async getQuestionBankItems(filters?: { topicId?: string; difficulty?: string }): Promise<QuestionBankItem[]> {
    let query = db.select().from(questionBank).where(eq(questionBank.isActive, true));
    const items = await query.orderBy(desc(questionBank.createdAt));
    
    let result = items;
    if (filters?.topicId) {
      result = result.filter(q => q.topicId === filters.topicId);
    }
    if (filters?.difficulty) {
      result = result.filter(q => q.difficulty === filters.difficulty);
    }
    return result;
  }

  async getQuestionBankItemById(id: string): Promise<QuestionBankItem | undefined> {
    const [item] = await db.select().from(questionBank).where(eq(questionBank.id, id));
    return item;
  }

  async createQuestionBankItem(item: InsertQuestionBank): Promise<QuestionBankItem> {
    const [newItem] = await db.insert(questionBank).values(item).returning();
    return newItem;
  }

  async updateQuestionBankItem(id: string, item: Partial<InsertQuestionBank>): Promise<QuestionBankItem | undefined> {
    const [updated] = await db.update(questionBank)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(questionBank.id, id))
      .returning();
    return updated;
  }

  async deleteQuestionBankItem(id: string): Promise<boolean> {
    const result = await db.update(questionBank).set({ isActive: false }).where(eq(questionBank.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Question Bank Options
  async getQuestionBankOptionsByQuestionId(questionId: string): Promise<QuestionBankOption[]> {
    return db.select().from(questionBankOptions)
      .where(eq(questionBankOptions.questionId, questionId))
      .orderBy(asc(questionBankOptions.order));
  }

  async createQuestionBankOption(option: InsertQuestionBankOption): Promise<QuestionBankOption> {
    const [newOption] = await db.insert(questionBankOptions).values(option).returning();
    return newOption;
  }

  async deleteQuestionBankOption(id: string): Promise<boolean> {
    const result = await db.delete(questionBankOptions).where(eq(questionBankOptions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Flashcard Decks
  async getFlashcardDecks(courseId?: string): Promise<FlashcardDeck[]> {
    if (courseId) {
      return db.select().from(flashcardDecks).where(eq(flashcardDecks.courseId, courseId));
    }
    return db.select().from(flashcardDecks).orderBy(desc(flashcardDecks.createdAt));
  }

  async getFlashcardDeckById(id: string): Promise<FlashcardDeck | undefined> {
    const [deck] = await db.select().from(flashcardDecks).where(eq(flashcardDecks.id, id));
    return deck;
  }

  async createFlashcardDeck(deck: InsertFlashcardDeck): Promise<FlashcardDeck> {
    const [newDeck] = await db.insert(flashcardDecks).values(deck).returning();
    return newDeck;
  }

  async updateFlashcardDeck(id: string, deck: Partial<InsertFlashcardDeck>): Promise<FlashcardDeck | undefined> {
    const [updated] = await db.update(flashcardDecks).set(deck).where(eq(flashcardDecks.id, id)).returning();
    return updated;
  }

  async deleteFlashcardDeck(id: string): Promise<boolean> {
    const result = await db.delete(flashcardDecks).where(eq(flashcardDecks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Flashcards
  async getFlashcardsByDeckId(deckId: string): Promise<Flashcard[]> {
    return db.select().from(flashcards)
      .where(eq(flashcards.deckId, deckId))
      .orderBy(asc(flashcards.order));
  }

  async getFlashcardById(id: string): Promise<Flashcard | undefined> {
    const [card] = await db.select().from(flashcards).where(eq(flashcards.id, id));
    return card;
  }

  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    const [newCard] = await db.insert(flashcards).values(flashcard).returning();
    return newCard;
  }

  async updateFlashcard(id: string, flashcard: Partial<InsertFlashcard>): Promise<Flashcard | undefined> {
    const [updated] = await db.update(flashcards).set(flashcard).where(eq(flashcards.id, id)).returning();
    return updated;
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    const result = await db.delete(flashcards).where(eq(flashcards.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Flashcard Progress
  async getFlashcardProgress(memberId: string, flashcardId: string): Promise<FlashcardProgress | undefined> {
    const [progress] = await db.select().from(flashcardProgress)
      .where(and(
        eq(flashcardProgress.memberId, memberId),
        eq(flashcardProgress.flashcardId, flashcardId)
      ));
    return progress;
  }

  async getDueFlashcards(memberId: string, deckId: string): Promise<FlashcardProgress[]> {
    const deckCards = await this.getFlashcardsByDeckId(deckId);
    const cardIds = deckCards.map(c => c.id);
    if (cardIds.length === 0) return [];

    const now = new Date();
    const progressRecords: FlashcardProgress[] = [];
    
    for (const cardId of cardIds) {
      const [progress] = await db.select().from(flashcardProgress)
        .where(and(
          eq(flashcardProgress.memberId, memberId),
          eq(flashcardProgress.flashcardId, cardId)
        ));
      if (progress && progress.nextReviewAt && new Date(progress.nextReviewAt) <= now) {
        progressRecords.push(progress);
      } else if (!progress) {
        progressRecords.push({
          id: "",
          memberId,
          flashcardId: cardId,
          masteryLevel: 0,
          interval: 1,
          easeFactor: 250,
          nextReviewAt: now,
          reviewCount: 0,
          lastReviewedAt: null,
        });
      }
    }
    
    return progressRecords;
  }

  async upsertFlashcardProgress(progress: InsertFlashcardProgress): Promise<FlashcardProgress> {
    const existing = await this.getFlashcardProgress(progress.memberId, progress.flashcardId);
    
    if (existing) {
      const [updated] = await db.update(flashcardProgress)
        .set({ 
          ...progress, 
          lastReviewedAt: new Date(),
          reviewCount: (existing.reviewCount || 0) + 1
        })
        .where(eq(flashcardProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newProgress] = await db.insert(flashcardProgress).values(progress).returning();
      return newProgress;
    }
  }

  // Anatomy Models
  async getAnatomyModels(filters?: { category?: string; bodySystem?: string }): Promise<AnatomyModel[]> {
    const conditions = [eq(anatomyModels.isPublished, true)];
    
    if (filters?.category) {
      conditions.push(eq(anatomyModels.category, filters.category));
    }
    if (filters?.bodySystem) {
      conditions.push(eq(anatomyModels.bodySystem, filters.bodySystem));
    }
    
    return db.select().from(anatomyModels)
      .where(and(...conditions))
      .orderBy(desc(anatomyModels.createdAt));
  }

  async getAnatomyModelById(id: string): Promise<AnatomyModel | undefined> {
    const [model] = await db.select().from(anatomyModels).where(eq(anatomyModels.id, id));
    return model;
  }

  async createAnatomyModel(model: InsertAnatomyModel): Promise<AnatomyModel> {
    const [newModel] = await db.insert(anatomyModels).values(model).returning();
    return newModel;
  }

  async updateAnatomyModel(id: string, model: Partial<InsertAnatomyModel>): Promise<AnatomyModel | undefined> {
    const [updated] = await db.update(anatomyModels)
      .set({ ...model, updatedAt: new Date() })
      .where(eq(anatomyModels.id, id))
      .returning();
    return updated;
  }

  async deleteAnatomyModel(id: string): Promise<boolean> {
    const result = await db.delete(anatomyModels).where(eq(anatomyModels.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Members
  async getMemberById(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async getAllMembers(): Promise<Member[]> {
    return db.select().from(members).orderBy(desc(members.createdAt));
  }

  async updateMemberMembership(id: string, tier: string, expiresAt?: Date | null): Promise<Member | undefined> {
    const [updated] = await db.update(members)
      .set({ 
        membershipTier: tier, 
        membershipExpiresAt: expiresAt,
        updatedAt: new Date() 
      })
      .where(eq(members.id, id))
      .returning();
    return updated;
  }

  // Admin Users (Super Admin only)
  async getAllAdminUsers(): Promise<Omit<User, "password">[]> {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      profileImageUrl: users.profileImageUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).orderBy(desc(users.createdAt));
    return allUsers;
  }

  async getAdminUserById(id: string): Promise<Omit<User, "password"> | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      profileImageUrl: users.profileImageUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, id));
    return user;
  }

  async updateAdminUserRole(id: string, role: string): Promise<Omit<User, "password"> | undefined> {
    const [updated] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        profileImageUrl: users.profileImageUrl,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return updated;
  }

  async updateAdminUserStatus(id: string, isActive: boolean): Promise<Omit<User, "password"> | undefined> {
    const [updated] = await db.update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        profileImageUrl: users.profileImageUrl,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return updated;
  }

  async deleteAdminUser(id: string): Promise<Omit<User, "password"> | undefined> {
    const [deleted] = await db.delete(users)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        profileImageUrl: users.profileImageUrl,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return deleted;
  }
}

export const lmsStorage = new LmsStorage();

// Audit log helper function
export async function logAuditAction(
  userId: string | null,
  action: string,
  entityType: string,
  entityId?: string,
  oldData?: any,
  newData?: any,
  req?: { ip?: string; headers?: { "user-agent"?: string } }
) {
  return lmsStorage.createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    oldData: oldData ?? null,
    newData: newData ?? null,
    ipAddress: req?.ip ?? null,
    userAgent: req?.headers?.["user-agent"] ?? null,
  });
}
