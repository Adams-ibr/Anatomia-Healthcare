import { supabase, toSnakeCase } from "./db";

import bcrypt from "bcryptjs";
import {
  CourseCategory, InsertCourseCategory,
  Course, InsertCourse,
  CourseModule, InsertCourseModule,
  Lesson, InsertLesson,
  LessonAsset, InsertLessonAsset,
  Enrollment, InsertEnrollment,
  LessonProgress, InsertLessonProgress,
  Quiz, InsertQuiz,
  QuizQuestion, InsertQuizQuestion,
  QuizOption, InsertQuizOption,
  QuizAttempt, InsertQuizAttempt,
  Certificate, InsertCertificate,
  CoursePrerequisite, InsertCoursePrerequisite,
  AuditLog, InsertAuditLog,
  Notification, InsertNotification,
  QuestionTopic, InsertQuestionTopic,
  QuestionBankItem, InsertQuestionBank,
  QuestionBankOption, InsertQuestionBankOption,
  FlashcardDeck, InsertFlashcardDeck,
  Flashcard, InsertFlashcard,
  FlashcardProgress, InsertFlashcardProgress,
  AnatomyModel, InsertAnatomyModel,
  Member,
} from "../shared/schema";
import { User } from "../shared/models/auth";

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
  getAllMembersForAdmin(): Promise<Omit<Member, "password">[]>;
  updateMemberMembership(id: string, tier: string, expiresAt?: Date | null): Promise<Omit<Member, "password"> | undefined>;
  updateMemberStatus(id: string, isActive: boolean): Promise<Omit<Member, "password"> | undefined>;
  deleteMember(id: string): Promise<boolean>;

  // Admin Users (Super Admin only)
  getAllAdminUsers(): Promise<Omit<User, "password">[]>;
  getAdminUserById(id: string): Promise<Omit<User, "password"> | undefined>;
  updateAdminUserRole(id: string, role: string): Promise<Omit<User, "password"> | undefined>;
  updateAdminUserStatus(id: string, isActive: boolean): Promise<Omit<User, "password"> | undefined>;
  deleteAdminUser(id: string): Promise<boolean>;
  createAdminUser(email: string, password: string, role: string, firstName?: string, lastName?: string): Promise<Omit<User, "password">>;
}

export class LmsStorage implements ILmsStorage {
  // Course Categories
  async getCourseCategories(): Promise<CourseCategory[]> {
    const { data, error } = await supabase
      .from("course_categories")
      .select("id, name, slug, description, iconName:icon_name, order, isActive:is_active, createdAt:created_at, updatedAt:updated_at")
      .order("order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getCourseCategoryById(id: string): Promise<CourseCategory | undefined> {
    const { data, error } = await supabase
      .from("course_categories")
      .select("id, name, slug, description, iconName:icon_name, order, isActive:is_active, createdAt:created_at, updatedAt:updated_at")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async createCourseCategory(category: InsertCourseCategory): Promise<CourseCategory> {
    const { data, error } = await supabase
      .from("course_categories")
      .insert(toSnakeCase(category))
      .select("id, name, slug, description, iconName:icon_name, order, isActive:is_active, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) throw error;
    return data;
  }

  async updateCourseCategory(id: string, category: Partial<InsertCourseCategory>): Promise<CourseCategory | undefined> {
    const { data, error } = await supabase
      .from("course_categories")
      .update({ ...toSnakeCase(category), updated_at: new Date() })
      .eq("id", id)
      .select("id, name, slug, description, iconName:icon_name, order, isActive:is_active, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteCourseCategory(id: string): Promise<boolean> {
    const { error } = await supabase.from("course_categories").delete().eq("id", id);
    return !error;
  }

  // Courses
  async getCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id, title, slug, shortDescription:short_description, description,
        thumbnailUrl:thumbnail_url, level, duration, price, category,
        isPublished:is_published, isFeatured:is_featured,
        requiredMembershipTier:required_membership_tier,
        isFree:is_free, createdBy:created_by,
        createdAt:created_at, updatedAt:updated_at
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPublishedCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id, title, slug, shortDescription:short_description, description,
        thumbnailUrl:thumbnail_url, level, duration, price, category,
        isPublished:is_published, isFeatured:is_featured,
        requiredMembershipTier:required_membership_tier,
        isFree:is_free, createdBy:created_by,
        createdAt:created_at, updatedAt:updated_at
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id, title, slug, shortDescription:short_description, description,
        thumbnailUrl:thumbnail_url, level, duration, price, category,
        isPublished:is_published, isFeatured:is_featured,
        requiredMembershipTier:required_membership_tier,
        isFree:is_free, createdBy:created_by,
        createdAt:created_at, updatedAt:updated_at
      `)
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id, title, slug, shortDescription:short_description, description,
        thumbnailUrl:thumbnail_url, level, duration, price, category,
        isPublished:is_published, isFeatured:is_featured,
        requiredMembershipTier:required_membership_tier,
        isFree:is_free, createdBy:created_by,
        createdAt:created_at, updatedAt:updated_at
      `)
      .eq("slug", slug)
      .single();

    if (error) return undefined;
    return data;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const { data, error } = await supabase
      .from("courses")
      .insert(toSnakeCase(course))
      .select(`
        id, title, slug, shortDescription:short_description, description,
        thumbnailUrl:thumbnail_url, level, duration, price, category,
        isPublished:is_published, isFeatured:is_featured,
        requiredMembershipTier:required_membership_tier,
        isFree:is_free, createdBy:created_by,
        createdAt:created_at, updatedAt:updated_at
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const { data, error } = await supabase
      .from("courses")
      .update({ ...toSnakeCase(course), updated_at: new Date() })
      .eq("id", id)
      .select(`
        id, title, slug, shortDescription:short_description, description,
        thumbnailUrl:thumbnail_url, level, duration, price, category,
        isPublished:is_published, isFeatured:is_featured,
        requiredMembershipTier:required_membership_tier,
        isFree:is_free, createdBy:created_by,
        createdAt:created_at, updatedAt:updated_at
      `)
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    return !error;
  }

  // Course Modules
  async getModulesByCourseId(courseId: string): Promise<CourseModule[]> {
    const { data, error } = await supabase
      .from("course_modules")
      .select("id, courseId:course_id, title, description, order, isPublished:is_published, createdAt:created_at")
      .eq("course_id", courseId)
      .order("order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getModuleById(id: string): Promise<CourseModule | undefined> {
    const { data, error } = await supabase
      .from("course_modules")
      .select("id, courseId:course_id, title, description, order, isPublished:is_published, createdAt:created_at")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async createModule(module: InsertCourseModule): Promise<CourseModule> {
    const { data, error } = await supabase
      .from("course_modules")
      .insert(toSnakeCase(module))
      .select("id, courseId:course_id, title, description, order, isPublished:is_published, createdAt:created_at")
      .single();

    if (error) throw error;
    return data;
  }

  async updateModule(id: string, module: Partial<InsertCourseModule>): Promise<CourseModule | undefined> {
    const { data, error } = await supabase
      .from("course_modules")
      .update(module)
      .eq("id", id)
      .select("id, courseId:course_id, title, description, order, isPublished:is_published, createdAt:created_at")
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteModule(id: string): Promise<boolean> {
    const { error } = await supabase.from("course_modules").delete().eq("id", id);
    return !error;
  }

  // Lessons
  async getLessonsByModuleId(moduleId: string): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from("lessons")
      .select(`
        id, moduleId:module_id, title, description,
        content, contentType:content_type, videoUrl:video_url, duration,
        order, isFree:is_free, isPublished:is_published,
        createdAt:created_at, updatedAt:updated_at
      `)
      .eq("module_id", moduleId)
      .order("order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getLessonById(id: string): Promise<Lesson | undefined> {
    const { data, error } = await supabase
      .from("lessons")
      .select(`
        id, moduleId:module_id, title, description,
        content, contentType:content_type, videoUrl:video_url, duration,
        order, isFree:is_free, isPublished:is_published,
        createdAt:created_at, updatedAt:updated_at
      `)
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const { data, error } = await supabase
      .from("lessons")
      .insert(toSnakeCase(lesson))
      .select(`
        id, moduleId:module_id, title, description,
        content, contentType:content_type, videoUrl:video_url, duration,
        order, isFree:is_free, isPublished:is_published,
        createdAt:created_at, updatedAt:updated_at
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const { data, error } = await supabase
      .from("lessons")
      .update({ ...toSnakeCase(lesson), updated_at: new Date() })
      .eq("id", id)
      .select(`
        id, moduleId:module_id, title, description,
        content, contentType:content_type, videoUrl:video_url, duration,
        order, isFree:is_free, isPublished:is_published,
        createdAt:created_at, updatedAt:updated_at
      `)
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteLesson(id: string): Promise<boolean> {
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    return !error;
  }

  // Lesson Assets
  async getAssetsByLessonId(lessonId: string): Promise<LessonAsset[]> {
    const { data, error } = await supabase
      .from("lesson_assets")
      .select("id, lessonId:lesson_id, title, assetType:asset_type, assetUrl:asset_url, order, createdAt:created_at")
      .eq("lesson_id", lessonId)
      .order("order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createAsset(asset: InsertLessonAsset): Promise<LessonAsset> {
    const { data, error } = await supabase
      .from("lesson_assets")
      .insert(toSnakeCase(asset))
      .select("id, lessonId:lesson_id, title, assetType:asset_type, assetUrl:asset_url, order, createdAt:created_at")
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const { error } = await supabase.from("lesson_assets").delete().eq("id", id);
    return !error;
  }

  // Enrollments
  async getEnrollmentsByMemberId(memberId: string): Promise<Enrollment[]> {
    const { data, error } = await supabase
      .from("enrollments")
      .select("id, memberId:member_id, courseId:course_id, enrolledAt:enrolled_at, completedAt:completed_at, progress, status")
      .eq("member_id", memberId);

    if (error) throw error;
    return data || [];
  }

  async getEnrollmentsByCourseId(courseId: string): Promise<Enrollment[]> {
    const { data, error } = await supabase
      .from("enrollments")
      .select("id, memberId:member_id, courseId:course_id, enrolledAt:enrolled_at, completedAt:completed_at, progress, status")
      .eq("course_id", courseId);

    if (error) throw error;
    return data || [];
  }

  async getEnrollment(memberId: string, courseId: string): Promise<Enrollment | undefined> {
    const { data, error } = await supabase
      .from("enrollments")
      .select("id, memberId:member_id, courseId:course_id, enrolledAt:enrolled_at, completedAt:completed_at, progress, status")
      .eq("member_id", memberId)
      .eq("course_id", courseId)
      .single();

    if (error) return undefined;
    return data;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const { data, error } = await supabase
      .from("enrollments")
      .insert(toSnakeCase(enrollment))
      .select("id, memberId:member_id, courseId:course_id, enrolledAt:enrolled_at, completedAt:completed_at, progress, status")
      .single();

    if (error) throw error;
    return data;
  }

  async updateEnrollment(id: string, enrollment: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const { data, error } = await supabase
      .from("enrollments")
      .update(enrollment)
      .eq("id", id)
      .select("id, memberId:member_id, courseId:course_id, enrolledAt:enrolled_at, completedAt:completed_at, progress, status")
      .single();

    if (error) return undefined;
    return data;
  }

  // Lesson Progress
  async getLessonProgress(memberId: string, lessonId: string): Promise<LessonProgress | undefined> {
    const { data, error } = await supabase
      .from("lesson_progress")
      .select(`
        id, memberId:member_id, lessonId:lesson_id,
        isCompleted:is_completed, progressPercent:progress_percent,
        timeSpentSeconds:time_spent_seconds, resumePositionSeconds:resume_position_seconds,
        lastAccessedAt:last_accessed_at, completedAt:completed_at
      `)
      .eq("member_id", memberId)
      .eq("lesson_id", lessonId)
      .single();

    if (error) return undefined;
    return data;
  }

  async getMemberProgressByCourse(memberId: string, courseId: string): Promise<LessonProgress[]> {
    // 1. Get modules
    const { data: modules } = await supabase
      .from("course_modules")
      .select("id")
      .eq("course_id", courseId);

    if (!modules || modules.length === 0) return [];

    const moduleIds = modules.map(m => m.id);

    // 2. Get lessons
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id")
      .in("module_id", moduleIds);

    if (!lessons || lessons.length === 0) return [];

    const lessonIds = lessons.map(l => l.id);

    // 3. Get progress
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select(`
        id, memberId:member_id, lessonId:lesson_id,
        isCompleted:is_completed, progressPercent:progress_percent,
        timeSpentSeconds:time_spent_seconds, resumePositionSeconds:resume_position_seconds,
        lastAccessedAt:last_accessed_at, completedAt:completed_at
      `)
      .eq("member_id", memberId)
      .in("lesson_id", lessonIds);

    return progress || [];
  }

  async getRecentLessonProgress(memberId: string, limit: number): Promise<LessonProgress[]> {
    const { data, error } = await supabase
      .from("lesson_progress")
      .select(`
        id, memberId:member_id, lessonId:lesson_id,
        isCompleted:is_completed, progressPercent:progress_percent,
        timeSpentSeconds:time_spent_seconds, resumePositionSeconds:resume_position_seconds,
        lastAccessedAt:last_accessed_at, completedAt:completed_at
      `)
      .eq("member_id", memberId)
      .order("last_accessed_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async upsertLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress> {
    const existing = await this.getLessonProgress(progress.memberId, progress.lessonId);

    if (existing) {
      const accumulatedTime = (existing.timeSpentSeconds || 0) + (progress.timeSpentSeconds || 0);
      const { data, error } = await supabase
        .from("lesson_progress")
        .update({
          ...progress,
          time_spent_seconds: accumulatedTime,
          last_accessed_at: new Date(),
          completed_at: progress.isCompleted ? new Date() : existing.completedAt
        })
        .eq("id", existing.id)
        .select(`
          id, memberId:member_id, lessonId:lesson_id,
          isCompleted:is_completed, progressPercent:progress_percent,
          timeSpentSeconds:time_spent_seconds, resumePositionSeconds:resume_position_seconds,
          lastAccessedAt:last_accessed_at, completedAt:completed_at
        `)
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("lesson_progress")
        .insert(toSnakeCase(progress))
        .select(`
          id, memberId:member_id, lessonId:lesson_id,
          isCompleted:is_completed, progressPercent:progress_percent,
          timeSpentSeconds:time_spent_seconds, resumePositionSeconds:resume_position_seconds,
          lastAccessedAt:last_accessed_at, completedAt:completed_at
        `)
        .single();

      if (error) throw error;
      return data;
    }
  }

  // Quizzes
  async getQuizzesByCourseId(courseId: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from("quizzes")
      .select("id, courseId:course_id, lessonId:lesson_id, title, description, timeLimit:time_limit, passingScore:passing_score, maxAttempts:max_attempts, isPublished:is_published, createdAt:created_at")
      .eq("course_id", courseId);

    if (error) throw error;
    return data || [];
  }

  async getQuizzesByLessonId(lessonId: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from("quizzes")
      .select("id, courseId:course_id, lessonId:lesson_id, title, description, timeLimit:time_limit, passingScore:passing_score, maxAttempts:max_attempts, isPublished:is_published, createdAt:created_at")
      .eq("lesson_id", lessonId);

    if (error) throw error;
    return data || [];
  }

  async getQuizById(id: string): Promise<Quiz | undefined> {
    const { data, error } = await supabase
      .from("quizzes")
      .select("id, courseId:course_id, lessonId:lesson_id, title, description, timeLimit:time_limit, passingScore:passing_score, maxAttempts:max_attempts, isPublished:is_published, createdAt:created_at")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const { data, error } = await supabase
      .from("quizzes")
      .insert(toSnakeCase(quiz))
      .select("id, courseId:course_id, lessonId:lesson_id, title, description, timeLimit:time_limit, passingScore:passing_score, maxAttempts:max_attempts, isPublished:is_published, createdAt:created_at")
      .single();

    if (error) throw error;
    return data;
  }

  async updateQuiz(id: string, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const { data, error } = await supabase
      .from("quizzes")
      .update(quiz)
      .eq("id", id)
      .select("id, courseId:course_id, lessonId:lesson_id, title, description, timeLimit:time_limit, passingScore:passing_score, maxAttempts:max_attempts, isPublished:is_published, createdAt:created_at")
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteQuiz(id: string): Promise<boolean> {
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    return !error;
  }

  // Quiz Questions
  async getQuestionsByQuizId(quizId: string): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("id, quizId:quiz_id, question, questionType:question_type, explanation, points, order")
      .eq("quiz_id", quizId)
      .order("order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const { data, error } = await supabase
      .from("quiz_questions")
      .insert(toSnakeCase(question))
      .select("id, quizId:quiz_id, question, questionType:question_type, explanation, points, order")
      .single();

    if (error) throw error;
    return data;
  }

  async updateQuestion(id: string, question: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const { data, error } = await supabase
      .from("quiz_questions")
      .update(question)
      .eq("id", id)
      .select("id, quizId:quiz_id, question, questionType:question_type, explanation, points, order")
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    return !error;
  }

  // Quiz Options
  async getOptionsByQuestionId(questionId: string): Promise<QuizOption[]> {
    const { data, error } = await supabase
      .from("quiz_options")
      .select("id, questionId:question_id, optionText:option_text, isCorrect:is_correct, order")
      .eq("question_id", questionId)
      .order("order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createOption(option: InsertQuizOption): Promise<QuizOption> {
    const { data, error } = await supabase
      .from("quiz_options")
      .insert(toSnakeCase(option))
      .select("id, questionId:question_id, optionText:option_text, isCorrect:is_correct, order")
      .single();

    if (error) throw error;
    return data;
  }

  async deleteOption(id: string): Promise<boolean> {
    const { error } = await supabase.from("quiz_options").delete().eq("id", id);
    return !error;
  }

  // Quiz Attempts
  async getAttemptsByMemberId(memberId: string): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("id, memberId:member_id, quizId:quiz_id, score, maxScore:max_score, isPassed:is_passed, answers, startedAt:started_at, completedAt:completed_at")
      .eq("member_id", memberId)
      .order("started_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAttemptsByQuizId(quizId: string): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("id, memberId:member_id, quizId:quiz_id, score, maxScore:max_score, isPassed:is_passed, answers, startedAt:started_at, completedAt:completed_at")
      .eq("quiz_id", quizId);

    if (error) throw error;
    return data || [];
  }

  async createAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert(toSnakeCase(attempt))
      .select("id, memberId:member_id, quizId:quiz_id, score, maxScore:max_score, isPassed:is_passed, answers, startedAt:started_at, completedAt:completed_at")
      .single();

    if (error) throw error;
    return data;
  }

  async updateAttempt(id: string, attempt: Partial<InsertQuizAttempt>): Promise<QuizAttempt | undefined> {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .update({ ...attempt, completed_at: new Date() })
      .eq("id", id)
      .select("id, memberId:member_id, quizId:quiz_id, score, maxScore:max_score, isPassed:is_passed, answers, startedAt:started_at, completedAt:completed_at")
      .single();

    if (error) return undefined;
    return data;
  }

  // Certificates
  async getCertificatesByMemberId(memberId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from("certificates")
      .select("id, memberId:member_id, courseId:course_id, certificateNumber:certificate_number, issuedAt:issued_at, expiresAt:expires_at")
      .eq("member_id", memberId);

    if (error) throw error;
    return data || [];
  }

  async getCertificateByNumber(certificateNumber: string): Promise<Certificate | undefined> {
    const { data, error } = await supabase
      .from("certificates")
      .select("id, memberId:member_id, courseId:course_id, certificateNumber:certificate_number, issuedAt:issued_at, expiresAt:expires_at")
      .eq("certificate_number", certificateNumber)
      .single();

    if (error) return undefined;
    return data;
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const { data, error } = await supabase
      .from("certificates")
      .insert(toSnakeCase(certificate))
      .select("id, memberId:member_id, courseId:course_id, certificateNumber:certificate_number, issuedAt:issued_at, expiresAt:expires_at")
      .single();

    if (error) throw error;
    return data;
  }

  // Course Prerequisites
  async getPrerequisitesByCourseId(courseId: string): Promise<CoursePrerequisite[]> {
    const { data, error } = await supabase
      .from("course_prerequisites")
      .select("id, courseId:course_id, prerequisiteId:prerequisite_id, createdAt:created_at")
      .eq("course_id", courseId);

    if (error) throw error;
    return data || [];
  }

  async addPrerequisite(prerequisite: InsertCoursePrerequisite): Promise<CoursePrerequisite> {
    const { data, error } = await supabase
      .from("course_prerequisites")
      .insert(toSnakeCase(prerequisite))
      .select("id, courseId:course_id, prerequisiteId:prerequisite_id, createdAt:created_at")
      .single();

    if (error) throw error;
    return data;
  }

  async removePrerequisite(courseId: string, prerequisiteId: string): Promise<boolean> {
    const { error } = await supabase
      .from("course_prerequisites")
      .delete()
      .match({ course_id: courseId, prerequisite_id: prerequisiteId });

    return !error;
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
    const { data, error } = await supabase
      .from("audit_logs")
      .insert(toSnakeCase(log))
      .select("id, userId:user_id, action, entityType:entity_type, entityId:entity_id, oldData:old_data, newData:new_data, ipAddress:ip_address, userAgent:user_agent, createdAt:created_at")
      .single();

    if (error) throw error;
    return data;
  }

  async getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, userId:user_id, action, entityType:entity_type, entityId:entity_id, oldData:old_data, newData:new_data, ipAddress:ip_address, userAgent:user_agent, createdAt:created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Notifications
  async getNotificationsByMemberId(memberId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, memberId:member_id, userId:user_id, type, title, message, link, isRead:is_read, createdAt:created_at")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, memberId:member_id, userId:user_id, type, title, message, link, isRead:is_read, createdAt:created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const { data, error } = await supabase
      .from("notifications")
      .insert(toSnakeCase(notification))
      .select("id, memberId:member_id, userId:user_id, type, title, message, link, isRead:is_read, createdAt:created_at")
      .single();

    if (error) throw error;
    return data;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    return !error;
  }

  async markAllNotificationsRead(memberId?: string, userId?: string): Promise<boolean> {
    let query = supabase.from("notifications").update({ is_read: true });

    if (memberId) {
      query = query.eq("member_id", memberId);
    } else if (userId) {
      query = query.eq("user_id", userId);
    } else {
      return false;
    }

    const { error } = await query;
    return !error;
  }

  // Question Bank Topics
  async getQuestionTopics(): Promise<QuestionTopic[]> {
    const { data, error } = await supabase
      .from("question_topics")
      .select("id, name, slug, description, parentId:parent_id, order, createdAt:created_at")
      .order("order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getQuestionTopicById(id: string): Promise<QuestionTopic | undefined> {
    const { data, error } = await supabase
      .from("question_topics")
      .select("id, name, slug, description, parentId:parent_id, order, createdAt:created_at")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async createQuestionTopic(topic: InsertQuestionTopic): Promise<QuestionTopic> {
    const { data, error } = await supabase
      .from("question_topics")
      .insert(toSnakeCase(topic))
      .select("id, name, slug, description, parentId:parent_id, order, createdAt:created_at")
      .single();

    if (error) throw error;
    return data;
  }

  async updateQuestionTopic(id: string, topic: Partial<InsertQuestionTopic>): Promise<QuestionTopic | undefined> {
    const { data, error } = await supabase
      .from("question_topics")
      .update(topic)
      .eq("id", id)
      .select("id, name, slug, description, parentId:parent_id, order, createdAt:created_at")
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteQuestionTopic(id: string): Promise<boolean> {
    const { error } = await supabase.from("question_topics").delete().eq("id", id);
    return !error;
  }

  // Question Bank
  async getQuestionBankItems(filters?: { topicId?: string; difficulty?: string }): Promise<QuestionBankItem[]> {
    let query = supabase
      .from("question_bank")
      .select(`
        id, question, questionType:question_type, difficulty, topicId:topic_id,
        explanation, points, tags, isActive:is_active, createdBy:created_by,
        createdAt:created_at, updatedAt:updated_at
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (filters?.topicId) {
      query = query.eq("topic_id", filters.topicId);
    }
    if (filters?.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getQuestionBankItemById(id: string): Promise<QuestionBankItem | undefined> {
    const { data, error } = await supabase
      .from("question_bank")
      .select(`
        id, question, questionType:question_type, difficulty, topicId:topic_id,
        explanation, points, tags, isActive:is_active, createdBy:created_by,
        createdAt:created_at, updatedAt:updated_at
      `)
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async createQuestionBankItem(item: InsertQuestionBank): Promise<QuestionBankItem> {
    const { data, error } = await supabase
      .from("question_bank")
      .insert(toSnakeCase(item))
      .select(`
        id, question, questionType:question_type, difficulty, topicId:topic_id,
        explanation, points, tags, isActive:is_active, createdBy:created_by,
        createdAt:created_at, updatedAt:updated_at
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateQuestionBankItem(id: string, item: Partial<InsertQuestionBank>): Promise<QuestionBankItem | undefined> {
    const { data, error } = await supabase
      .from("question_bank")
      .update({ ...toSnakeCase(item), updated_at: new Date() })
      .eq("id", id)
      .select(`
        id, question, questionType:question_type, difficulty, topicId:topic_id,
        explanation, points, tags, isActive:is_active, createdBy:created_by,
        createdAt:created_at, updatedAt:updated_at
      `)
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteQuestionBankItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("question_bank")
      .update({ is_active: false })
      .eq("id", id);

    return !error;
  }

  // Question Bank Options
  async getQuestionBankOptionsByQuestionId(questionId: string): Promise<QuestionBankOption[]> {
    const { data, error } = await supabase
      .from("question_bank_options")
      .select("id, questionId:question_id, optionText:option_text, isCorrect:is_correct, explanation, order")
      .eq("question_id", questionId)
      .order("order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createQuestionBankOption(option: InsertQuestionBankOption): Promise<QuestionBankOption> {
    const { data, error } = await supabase
      .from("question_bank_options")
      .insert(toSnakeCase(option))
      .select("id, questionId:question_id, optionText:option_text, isCorrect:is_correct, explanation, order")
      .single();

    if (error) throw error;
    return data;
  }

  async deleteQuestionBankOption(id: string): Promise<boolean> {
    const { error } = await supabase.from("question_bank_options").delete().eq("id", id);
    return !error;
  }

  // Flashcard Decks
  async getFlashcardDecks(courseId?: string): Promise<FlashcardDeck[]> {
    let query = supabase
      .from("flashcard_decks")
      .select("id, courseId:course_id, moduleId:module_id, title, description, category, isPublished:is_published, createdAt:created_at")
      .order("created_at", { ascending: false });

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getFlashcardDeckById(id: string): Promise<FlashcardDeck | undefined> {
    const { data, error } = await supabase
      .from("flashcard_decks")
      .select("id, courseId:course_id, moduleId:module_id, title, description, category, isPublished:is_published, createdAt:created_at")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async createFlashcardDeck(deck: InsertFlashcardDeck): Promise<FlashcardDeck> {
    const { data, error } = await supabase
      .from("flashcard_decks")
      .insert(toSnakeCase(deck))
      .select("id, courseId:course_id, moduleId:module_id, title, description, category, isPublished:is_published, createdAt:created_at")
      .single();

    if (error) throw error;
    return data;
  }

  async updateFlashcardDeck(id: string, deck: Partial<InsertFlashcardDeck>): Promise<FlashcardDeck | undefined> {
    const { data, error } = await supabase
      .from("flashcard_decks")
      .update(deck)
      .eq("id", id)
      .select("id, courseId:course_id, moduleId:module_id, title, description, category, isPublished:is_published, createdAt:created_at")
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteFlashcardDeck(id: string): Promise<boolean> {
    const { error } = await supabase.from("flashcard_decks").delete().eq("id", id);
    return !error;
  }

  // Flashcards
  async getFlashcardsByDeckId(deckId: string): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from("flashcards")
      .select(`
        id, deckId:deck_id, cardType:card_type, front, back, options,
        correctAnswer:correct_answer, explanation, imageUrl:image_url,
        audioUrl:audio_url, order, createdAt:created_at
      `)
      .eq("deck_id", deckId)
      .order("order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getFlashcardById(id: string): Promise<Flashcard | undefined> {
    const { data, error } = await supabase
      .from("flashcards")
      .select(`
        id, deckId:deck_id, cardType:card_type, front, back, options,
        correctAnswer:correct_answer, explanation, imageUrl:image_url,
        audioUrl:audio_url, order, createdAt:created_at
      `)
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    const { data, error } = await supabase
      .from("flashcards")
      .insert(toSnakeCase(flashcard))
      .select(`
        id, deckId:deck_id, cardType:card_type, front, back, options,
        correctAnswer:correct_answer, explanation, imageUrl:image_url,
        audioUrl:audio_url, order, createdAt:created_at
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateFlashcard(id: string, flashcard: Partial<InsertFlashcard>): Promise<Flashcard | undefined> {
    const { data, error } = await supabase
      .from("flashcards")
      .update(flashcard)
      .eq("id", id)
      .select(`
        id, deckId:deck_id, cardType:card_type, front, back, options,
        correctAnswer:correct_answer, explanation, imageUrl:image_url,
        audioUrl:audio_url, order, createdAt:created_at
      `)
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    const { error } = await supabase.from("flashcards").delete().eq("id", id);
    return !error;
  }

  // Flashcard Progress
  async getFlashcardProgress(memberId: string, flashcardId: string): Promise<FlashcardProgress | undefined> {
    const { data, error } = await supabase
      .from("flashcard_progress")
      .select(`
        id, memberId:member_id, flashcardId:flashcard_id, masteryLevel:mastery_level,
        interval, easeFactor:ease_factor, nextReviewAt:next_review_at,
        reviewCount:review_count, lastReviewedAt:last_reviewed_at
      `)
      .eq("member_id", memberId)
      .eq("flashcard_id", flashcardId)
      .single();

    if (error) return undefined;
    return data;
  }

  async getDueFlashcards(memberId: string, deckId: string): Promise<FlashcardProgress[]> {
    // 1. Get cards in deck
    const deckCards = await this.getFlashcardsByDeckId(deckId);
    const cardIds = deckCards.map(c => c.id);
    if (cardIds.length === 0) return [];

    const now = new Date();
    const progressRecords: FlashcardProgress[] = [];

    // 2. Get existing progress
    const { data: existingProgress } = await supabase
      .from("flashcard_progress")
      .select(`
        id, memberId:member_id, flashcardId:flashcard_id, masteryLevel:mastery_level,
        interval, easeFactor:ease_factor, nextReviewAt:next_review_at,
        reviewCount:review_count, lastReviewedAt:last_reviewed_at
      `)
      .eq("member_id", memberId)
      .in("flashcard_id", cardIds);

    const progressMap = new Map(existingProgress?.map(p => [p.flashcardId, p]) || []);

    for (const cardId of cardIds) {
      const progress = progressMap.get(cardId);

      if (progress && progress.nextReviewAt && new Date(progress.nextReviewAt) <= now) {
        progressRecords.push(progress);
      } else if (!progress) {
        // Create a temporary object matching FlashcardProgress interface
        // Note: This matches the previous logic of constructing a default progress object
        progressRecords.push({
          id: "", // Placeholder, not in DB yet
          memberId,
          flashcardId: cardId,
          masteryLevel: 0,
          interval: 1,
          easeFactor: 250,
          nextReviewAt: now,
          reviewCount: 0,
          lastReviewedAt: null,
        } as FlashcardProgress);
      }
    }

    return progressRecords;
  }

  async upsertFlashcardProgress(progress: InsertFlashcardProgress): Promise<FlashcardProgress> {
    const existing = await this.getFlashcardProgress(progress.memberId, progress.flashcardId);

    if (existing) {
      const { data, error } = await supabase
        .from("flashcard_progress")
        .update({
          ...progress,
          last_reviewed_at: new Date(),
          review_count: (existing.reviewCount || 0) + 1
        })
        .eq("id", existing.id)
        .select(`
          id, memberId:member_id, flashcardId:flashcard_id, masteryLevel:mastery_level,
          interval, easeFactor:ease_factor, nextReviewAt:next_review_at,
          reviewCount:review_count, lastReviewedAt:last_reviewed_at
        `)
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("flashcard_progress")
        .insert(toSnakeCase(progress))
        .select(`
          id, memberId:member_id, flashcardId:flashcard_id, masteryLevel:mastery_level,
          interval, easeFactor:ease_factor, nextReviewAt:next_review_at,
          reviewCount:review_count, lastReviewedAt:last_reviewed_at
        `)
        .single();

      if (error) throw error;
      return data;
    }
  }

  // Anatomy Models
  async getAnatomyModels(filters?: { category?: string; bodySystem?: string }): Promise<AnatomyModel[]> {
    let query = supabase
      .from("anatomy_models")
      .select("id, title, description, modelUrl:model_url, thumbnailUrl:thumbnail_url, category, tags, bodySystem:body_system, annotations, isPublished:is_published, createdBy:created_by, createdAt:created_at, updatedAt:updated_at")
      .order("created_at", { ascending: false });

    // Filter by published status (assuming we only want published models by default, or if there is a filter)
    // The previous code had `eq(anatomyModels.isPublished, true)` but didn't use it.
    // If we want to enforce published only:
    query = query.eq("is_published", true);

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.bodySystem) {
      query = query.eq("body_system", filters.bodySystem);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAnatomyModelById(id: string): Promise<AnatomyModel | undefined> {
    const { data, error } = await supabase
      .from("anatomy_models")
      .select("id, title, description, modelUrl:model_url, thumbnailUrl:thumbnail_url, category, tags, bodySystem:body_system, annotations, isPublished:is_published, createdBy:created_by, createdAt:created_at, updatedAt:updated_at")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async createAnatomyModel(model: InsertAnatomyModel): Promise<AnatomyModel> {
    const { data, error } = await supabase
      .from("anatomy_models")
      .insert(toSnakeCase(model))
      .select("id, title, description, modelUrl:model_url, thumbnailUrl:thumbnail_url, category, tags, bodySystem:body_system, annotations, isPublished:is_published, createdBy:created_by, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) throw error;
    return data;
  }

  async updateAnatomyModel(id: string, model: Partial<InsertAnatomyModel>): Promise<AnatomyModel | undefined> {
    const { data, error } = await supabase
      .from("anatomy_models")
      .update(model)
      .eq("id", id)
      .select("id, title, description, modelUrl:model_url, thumbnailUrl:thumbnail_url, category, tags, bodySystem:body_system, annotations, isPublished:is_published, createdBy:created_by, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteAnatomyModel(id: string): Promise<boolean> {
    const { error } = await supabase.from("anatomy_models").delete().eq("id", id);
    return !error;
  }

  // Members
  async getAllMembersForAdmin(): Promise<Omit<Member, "password">[]> {
    const { data, error } = await supabase
      .from("members")
      .select("id, email, firstName:first_name, lastName:last_name, membershipTier:membership_tier, membershipExpiresAt:membership_expires_at, isActive:is_active, createdAt:created_at, updatedAt:updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Omit<Member, "password">[];
  }

  async updateMemberStatus(memberId: string, isActive: boolean): Promise<Member | undefined> {
    const { data, error } = await supabase
      .from("members")
      .update({ is_active: isActive, updated_at: new Date() })
      .eq("id", memberId)
      .select("id, email, password, firstName:first_name, lastName:last_name, membershipTier:membership_tier, membershipExpiresAt:membership_expires_at, isActive:is_active, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) return undefined;
    return data as unknown as Member;
  }

  async deleteMember(id: string): Promise<boolean> {
    const { error } = await supabase.from("members").delete().eq("id", id);
    return !error;
  }

  // Admin Users (Super Admin only)
  async getAllAdminUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, password, firstName:first_name, lastName:last_name, role, profileImageUrl:profile_image_url, isActive:is_active, createdAt:created_at, updatedAt:updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    // Cast to User[] (assuming safe return)
    return (data || []) as unknown as User[];
  }

  async getAdminUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, password, firstName:first_name, lastName:last_name, role, profileImageUrl:profile_image_url, isActive:is_active, createdAt:created_at, updatedAt:updated_at")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data as unknown as User;
  }

  async updateAdminUserRole(id: string, role: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .update({ role, updated_at: new Date() })
      .eq("id", id)
      .select("id, email, password, firstName:first_name, lastName:last_name, role, profileImageUrl:profile_image_url, isActive:is_active, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) return undefined;
    return data as unknown as User;
  }

  async updateAdminUserStatus(id: string, isActive: boolean): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .update({ is_active: isActive, updated_at: new Date() })
      .eq("id", id)
      .select("id, email, password, firstName:first_name, lastName:last_name, role, profileImageUrl:profile_image_url, isActive:is_active, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) return undefined;
    return data as unknown as User;
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    const { error } = await supabase.from("users").delete().eq("id", id);
    return !error;
  }

  async createAdminUser(email: string, password: string, role: string, firstName?: string, lastName?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        password: hashedPassword,
        role,
        first_name: firstName || email.split('@')[0],
        last_name: lastName || null,
        is_active: true,
      })
      .select("id, email, password, firstName:first_name, lastName:last_name, role, profileImageUrl:profile_image_url, isActive:is_active, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) throw error;
    return data as unknown as User;
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
