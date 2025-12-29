import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import {
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
} from "@shared/schema";

export interface ILmsStorage {
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
  upsertLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress>;

  // Quizzes
  getQuizzesByCourseId(courseId: string): Promise<Quiz[]>;
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
}

export class LmsStorage implements ILmsStorage {
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

  async upsertLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress> {
    const existing = await this.getLessonProgress(progress.memberId, progress.lessonId);
    
    if (existing) {
      const [updated] = await db.update(lessonProgress)
        .set({ 
          ...progress, 
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
}

export const lmsStorage = new LmsStorage();
