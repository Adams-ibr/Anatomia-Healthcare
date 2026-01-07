import { Router, Request, Response } from "express";
import { lmsStorage, logAuditAction } from "./lms-storage";
import { generateCertificatePDF, generateCertificateNumber } from "./certificate-generator";
import { isAuthenticated, isMemberAuthenticated, requireActiveMembership, isContentAdmin, isSuperAdmin } from "./auth";
import { 
  insertCourseSchema, 
  insertCourseModuleSchema,
  insertLessonSchema,
  insertLessonAssetSchema,
  insertEnrollmentSchema,
  insertQuizSchema,
  insertQuizQuestionSchema,
  insertQuizOptionSchema,
  insertCoursePrerequisiteSchema,
} from "@shared/schema";

const router = Router();

// Create sub-routers for different access levels
const publicRouter = Router();
const memberRouter = Router();
const subscriberRouter = Router(); // For routes that require active subscription
const adminRouter = Router();

// Apply authentication middleware to protected routers
memberRouter.use(isMemberAuthenticated);
subscriberRouter.use(isMemberAuthenticated, requireActiveMembership); // Requires auth + active subscription
adminRouter.use(isAuthenticated);

// ============ PUBLIC ROUTES ============

// Get all published courses with optional filters
publicRouter.get("/courses", async (req: Request, res: Response) => {
  try {
    const { category, level, search, sort } = req.query;
    let courses = await lmsStorage.getPublishedCourses();
    
    // Filter by category
    if (category && typeof category === "string") {
      courses = courses.filter(c => c.category?.toLowerCase() === category.toLowerCase());
    }
    
    // Filter by level
    if (level && typeof level === "string") {
      courses = courses.filter(c => c.level?.toLowerCase() === level.toLowerCase());
    }
    
    // Search by title and description
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      courses = courses.filter(c => 
        c.title.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower) ||
        c.shortDescription?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort options
    if (sort && typeof sort === "string") {
      switch (sort) {
        case "newest":
          courses.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          break;
        case "oldest":
          courses.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
          break;
        case "title_asc":
          courses.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "title_desc":
          courses.sort((a, b) => b.title.localeCompare(a.title));
          break;
      }
    }
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// Get course categories
publicRouter.get("/courses/categories", async (req: Request, res: Response) => {
  try {
    const courses = await lmsStorage.getPublishedCourses();
    const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// Get course by slug (public)
publicRouter.get("/courses/:slug", async (req: Request, res: Response) => {
  try {
    const course = await lmsStorage.getCourseBySlug(req.params.slug);
    if (!course || !course.isPublished) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Get modules and lessons for this course
    const modules = await lmsStorage.getModulesByCourseId(course.id);
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await lmsStorage.getLessonsByModuleId(module.id);
        return { ...module, lessons };
      })
    );
    
    res.json({ ...course, modules: modulesWithLessons });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch course" });
  }
});

// Verify certificate (public)
publicRouter.get("/certificates/verify/:number", async (req: Request, res: Response) => {
  try {
    const certificate = await lmsStorage.getCertificateByNumber(req.params.number);
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found", valid: false });
    }
    
    const course = await lmsStorage.getCourseById(certificate.courseId);
    
    res.json({ 
      valid: true, 
      certificate: {
        certificateNumber: certificate.certificateNumber,
        issuedAt: certificate.issuedAt,
        courseName: course?.title,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to verify certificate" });
  }
});

// Download certificate PDF (public with certificate number)
publicRouter.get("/certificates/download/:number", async (req: Request, res: Response) => {
  try {
    const certificate = await lmsStorage.getCertificateByNumber(req.params.number);
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    const course = await lmsStorage.getCourseById(certificate.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    const member = await lmsStorage.getMemberById(certificate.memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    
    const doc = generateCertificatePDF({ certificate, course, member });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=certificate-${certificate.certificateNumber}.pdf`);
    
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Certificate PDF generation error:", error);
    res.status(500).json({ message: "Failed to generate certificate PDF" });
  }
});

// ============ MEMBER ROUTES (requires member auth - middleware applied above) ============

// Enroll in a course (requires active subscription)
subscriberRouter.post("/enrollments", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const { courseId } = req.body;
    
    // Check if already enrolled
    const existing = await lmsStorage.getEnrollment(member.id, courseId);
    if (existing) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    // Get course to check membership requirement
    const course = await lmsStorage.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if membership has expired (check first before tier comparison)
    if (member.membershipExpiresAt) {
      if (new Date(member.membershipExpiresAt) < new Date()) {
        return res.status(403).json({ 
          message: "Membership has expired",
          expiredAt: member.membershipExpiresAt
        });
      }
    }

    // Check membership tier requirement
    const { membershipTierHierarchy } = await import("@shared/models/auth");
    const memberTier = member.membershipTier || "bronze";
    const requiredTier = course.requiredMembershipTier || "bronze";
    const memberTierLevel = membershipTierHierarchy[memberTier as keyof typeof membershipTierHierarchy] ?? 0;
    const requiredTierLevel = membershipTierHierarchy[requiredTier as keyof typeof membershipTierHierarchy] ?? 0;
    
    if (memberTierLevel < requiredTierLevel) {
      return res.status(403).json({ 
        message: "Membership tier not sufficient",
        requiredTier: requiredTier,
        currentTier: memberTier
      });
    }

    // Check prerequisites
    const prerequisitesMet = await lmsStorage.checkPrerequisitesMet(member.id, courseId);
    if (!prerequisitesMet) {
      const prereqs = await lmsStorage.getPrerequisitesByCourseId(courseId);
      const prereqCourses = await Promise.all(
        prereqs.map(p => lmsStorage.getCourseById(p.prerequisiteId))
      );
      return res.status(400).json({ 
        message: "Prerequisites not met", 
        prerequisites: prereqCourses.filter(Boolean).map(c => ({ id: c!.id, title: c!.title }))
      });
    }

    const enrollment = await lmsStorage.createEnrollment({
      memberId: member.id,
      courseId,
      progress: 0,
      status: "active",
    });
    
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ message: "Failed to enroll in course" });
  }
});

// Get notifications for member
memberRouter.get("/notifications", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const notifications = await lmsStorage.getNotificationsByMemberId(member.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Mark notification as read
memberRouter.patch("/notifications/:id/read", async (req: Request, res: Response) => {
  try {
    await lmsStorage.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
memberRouter.post("/notifications/read-all", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    await lmsStorage.markAllNotificationsRead(member.id, undefined);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});

// Get lesson content for enrolled member (requires active subscription)
subscriberRouter.get("/lessons/:lessonId", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const { lessonId } = req.params;
    
    const lesson = await lmsStorage.getLessonById(lessonId);
    if (!lesson || !lesson.isPublished) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    
    // Get module and course to verify enrollment
    const module = await lmsStorage.getModuleById(lesson.moduleId);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    
    const enrollment = await lmsStorage.getEnrollment(member.id, module.courseId);
    if (!enrollment && !lesson.isFree) {
      return res.status(403).json({ message: "Enrollment required" });
    }
    
    // Get progress for this lesson
    const progress = await lmsStorage.getLessonProgress(member.id, lessonId);
    
    // Get assets for this lesson
    const assets = await lmsStorage.getAssetsByLessonId(lessonId);
    
    // Get quiz for this lesson if exists
    const quizzes = await lmsStorage.getQuizzesByLessonId(lessonId);
    
    res.json({ ...lesson, progress, assets, quizzes, moduleTitle: module.title, courseId: module.courseId });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch lesson" });
  }
});

// Get course with modules, lessons, and progress for enrolled member (requires active subscription)
subscriberRouter.get("/courses/:courseId/content", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const { courseId } = req.params;
    
    const course = await lmsStorage.getCourseById(courseId);
    if (!course || !course.isPublished) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    const enrollment = await lmsStorage.getEnrollment(member.id, courseId);
    if (!enrollment) {
      return res.status(403).json({ message: "Enrollment required" });
    }
    
    // Get modules and lessons
    const modules = await lmsStorage.getModulesByCourseId(courseId);
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await lmsStorage.getLessonsByModuleId(module.id);
        // Get progress for each lesson
        const lessonsWithProgress = await Promise.all(
          lessons.map(async (lesson) => {
            const progress = await lmsStorage.getLessonProgress(member.id, lesson.id);
            return { ...lesson, progress };
          })
        );
        return { ...module, lessons: lessonsWithProgress };
      })
    );
    
    res.json({ ...course, enrollment, modules: modulesWithLessons });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch course content" });
  }
});

// Get member's recent activity (requires active subscription)
subscriberRouter.get("/activity/recent", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const recentProgress = await lmsStorage.getRecentLessonProgress(member.id, 10);
    
    // Enrich with lesson and course details
    const activityWithLessons = await Promise.all(
      recentProgress.map(async (progress) => {
        const lesson = await lmsStorage.getLessonById(progress.lessonId);
        let courseId: string | null = null;
        if (lesson) {
          const module = await lmsStorage.getModuleById(lesson.moduleId);
          if (module) {
            courseId = module.courseId;
          }
        }
        return { ...progress, lesson, courseId };
      })
    );
    
    // Filter out entries without courseId and limit to 5
    const validActivity = activityWithLessons
      .filter(a => a.courseId !== null)
      .slice(0, 5);
    
    res.json(validActivity);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
});

// Get member's enrollments
subscriberRouter.get("/enrollments/me", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const enrollments = await lmsStorage.getEnrollmentsByMemberId(member.id);
    
    // Get course details for each enrollment
    const enrollmentsWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await lmsStorage.getCourseById(enrollment.courseId);
        return { ...enrollment, course };
      })
    );
    
    res.json(enrollmentsWithCourses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
});

// Update lesson progress
subscriberRouter.post("/lessons/:lessonId/progress", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const { lessonId } = req.params;
    const { isCompleted, progressPercent, timeSpentSeconds, resumePositionSeconds } = req.body;

    const progress = await lmsStorage.upsertLessonProgress({
      memberId: member.id,
      lessonId,
      isCompleted: isCompleted || false,
      progressPercent: progressPercent || 0,
      timeSpentSeconds: timeSpentSeconds || 0,
      resumePositionSeconds: resumePositionSeconds || 0,
    });
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: "Failed to update progress" });
  }
});

// Get member's progress for a course
subscriberRouter.get("/courses/:courseId/progress", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const { courseId } = req.params;
    const progress = await lmsStorage.getMemberProgressByCourse(member.id, courseId);
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch progress" });
  }
});

// Start quiz attempt
subscriberRouter.post("/quizzes/:quizId/attempt", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const { quizId } = req.params;
    const quiz = await lmsStorage.getQuizById(quizId);
    
    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const attempt = await lmsStorage.createAttempt({
      memberId: member.id,
      quizId,
      score: 0,
      maxScore: 0,
      isPassed: false,
      answers: null,
    });
    
    // Get questions for this quiz
    const questions = await lmsStorage.getQuestionsByQuizId(quizId);
    const questionsWithOptions = await Promise.all(
      questions.map(async (q) => {
        const options = await lmsStorage.getOptionsByQuestionId(q.id);
        // Don't send isCorrect to the client
        return { 
          ...q, 
          options: options.map(o => ({ id: o.id, optionText: o.optionText, order: o.order }))
        };
      })
    );
    
    res.status(201).json({ attempt, questions: questionsWithOptions });
  } catch (error) {
    res.status(500).json({ message: "Failed to start quiz" });
  }
});

// Submit quiz attempt
subscriberRouter.post("/quizzes/attempts/:attemptId/submit", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const { attemptId } = req.params;
    const { answers } = req.body; // { questionId: optionId }

    // Calculate score
    let score = 0;
    let maxScore = 0;
    
    for (const [questionId, selectedOptionId] of Object.entries(answers)) {
      const options = await lmsStorage.getOptionsByQuestionId(questionId);
      const question = (await lmsStorage.getQuestionsByQuizId(questionId))[0];
      const correctOption = options.find(o => o.isCorrect);
      
      if (question) {
        maxScore += question.points || 1;
        if (correctOption && correctOption.id === selectedOptionId) {
          score += question.points || 1;
        }
      }
    }

    // Get quiz to check passing score
    const attemptData = await lmsStorage.getAttemptsByMemberId(member.id);
    const currentAttempt = attemptData.find(a => a.id === attemptId);
    
    if (!currentAttempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    const quiz = await lmsStorage.getQuizById(currentAttempt.quizId);
    const passingScore = quiz?.passingScore || 70;
    const scorePercent = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const isPassed = scorePercent >= passingScore;

    const updatedAttempt = await lmsStorage.updateAttempt(attemptId, {
      score,
      maxScore,
      isPassed,
      answers,
    });
    
    res.json({ ...updatedAttempt, scorePercent, passingScore });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit quiz" });
  }
});

// Get member's certificates
subscriberRouter.get("/certificates/me", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const certificates = await lmsStorage.getCertificatesByMemberId(member.id);
    
    // Get course details for each certificate
    const certificatesWithCourses = await Promise.all(
      certificates.map(async (cert) => {
        const course = await lmsStorage.getCourseById(cert.courseId);
        return { ...cert, course };
      })
    );
    
    res.json(certificatesWithCourses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch certificates" });
  }
});

// ============ ADMIN ROUTES (requires admin auth - middleware applied above) ============

// Get all courses (including unpublished)
adminRouter.get("/courses", async (req: Request, res: Response) => {
  try {
    const courses = await lmsStorage.getCourses();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// Create course
adminRouter.post("/courses", async (req: Request, res: Response) => {
  try {
    const validated = insertCourseSchema.parse(req.body);
    const course = await lmsStorage.createCourse(validated);
    res.status(201).json(course);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create course" });
  }
});

// Update course
adminRouter.patch("/courses/:id", async (req: Request, res: Response) => {
  try {
    const course = await lmsStorage.updateCourse(req.params.id, req.body);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update course" });
  }
});

// Delete course
adminRouter.delete("/courses/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await lmsStorage.deleteCourse(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json({ message: "Course deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete course" });
  }
});

// Get course modules
adminRouter.get("/courses/:courseId/modules", async (req: Request, res: Response) => {
  try {
    const modules = await lmsStorage.getModulesByCourseId(req.params.courseId);
    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch modules" });
  }
});

// Create module
adminRouter.post("/modules", async (req: Request, res: Response) => {
  try {
    const validated = insertCourseModuleSchema.parse(req.body);
    const module = await lmsStorage.createModule(validated);
    res.status(201).json(module);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create module" });
  }
});

// Update module
adminRouter.patch("/modules/:id", async (req: Request, res: Response) => {
  try {
    const module = await lmsStorage.updateModule(req.params.id, req.body);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    res.json(module);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update module" });
  }
});

// Delete module
adminRouter.delete("/modules/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await lmsStorage.deleteModule(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Module not found" });
    }
    res.json({ message: "Module deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete module" });
  }
});

// Get module lessons
adminRouter.get("/modules/:moduleId/lessons", async (req: Request, res: Response) => {
  try {
    const lessons = await lmsStorage.getLessonsByModuleId(req.params.moduleId);
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch lessons" });
  }
});

// Create lesson
adminRouter.post("/lessons", async (req: Request, res: Response) => {
  try {
    const validated = insertLessonSchema.parse(req.body);
    const lesson = await lmsStorage.createLesson(validated);
    res.status(201).json(lesson);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create lesson" });
  }
});

// Update lesson
adminRouter.patch("/lessons/:id", async (req: Request, res: Response) => {
  try {
    const lesson = await lmsStorage.updateLesson(req.params.id, req.body);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    res.json(lesson);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update lesson" });
  }
});

// Delete lesson
adminRouter.delete("/lessons/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await lmsStorage.deleteLesson(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    res.json({ message: "Lesson deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete lesson" });
  }
});

// Lesson assets
adminRouter.get("/lessons/:lessonId/assets", async (req: Request, res: Response) => {
  try {
    const assets = await lmsStorage.getAssetsByLessonId(req.params.lessonId);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assets" });
  }
});

adminRouter.post("/assets", async (req: Request, res: Response) => {
  try {
    const validated = insertLessonAssetSchema.parse(req.body);
    const asset = await lmsStorage.createAsset(validated);
    res.status(201).json(asset);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create asset" });
  }
});

adminRouter.delete("/assets/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await lmsStorage.deleteAsset(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Asset not found" });
    }
    res.json({ message: "Asset deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete asset" });
  }
});

// Quizzes
adminRouter.get("/courses/:courseId/quizzes", async (req: Request, res: Response) => {
  try {
    const quizzes = await lmsStorage.getQuizzesByCourseId(req.params.courseId);
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch quizzes" });
  }
});

adminRouter.post("/quizzes", async (req: Request, res: Response) => {
  try {
    const validated = insertQuizSchema.parse(req.body);
    const quiz = await lmsStorage.createQuiz(validated);
    res.status(201).json(quiz);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create quiz" });
  }
});

adminRouter.patch("/quizzes/:id", async (req: Request, res: Response) => {
  try {
    const quiz = await lmsStorage.updateQuiz(req.params.id, req.body);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json(quiz);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update quiz" });
  }
});

adminRouter.delete("/quizzes/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await lmsStorage.deleteQuiz(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json({ message: "Quiz deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete quiz" });
  }
});

// Quiz questions
adminRouter.get("/quizzes/:quizId/questions", async (req: Request, res: Response) => {
  try {
    const questions = await lmsStorage.getQuestionsByQuizId(req.params.quizId);
    const questionsWithOptions = await Promise.all(
      questions.map(async (q) => {
        const options = await lmsStorage.getOptionsByQuestionId(q.id);
        return { ...q, options };
      })
    );
    res.json(questionsWithOptions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

adminRouter.post("/questions", async (req: Request, res: Response) => {
  try {
    const validated = insertQuizQuestionSchema.parse(req.body);
    const question = await lmsStorage.createQuestion(validated);
    res.status(201).json(question);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create question" });
  }
});

adminRouter.patch("/questions/:id", async (req: Request, res: Response) => {
  try {
    const question = await lmsStorage.updateQuestion(req.params.id, req.body);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(question);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update question" });
  }
});

adminRouter.delete("/questions/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await lmsStorage.deleteQuestion(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json({ message: "Question deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete question" });
  }
});

// Quiz options
adminRouter.post("/options", async (req: Request, res: Response) => {
  try {
    const validated = insertQuizOptionSchema.parse(req.body);
    const option = await lmsStorage.createOption(validated);
    res.status(201).json(option);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create option" });
  }
});

adminRouter.delete("/options/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await lmsStorage.deleteOption(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Option not found" });
    }
    res.json({ message: "Option deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete option" });
  }
});

// Course enrollments (admin view)
adminRouter.get("/courses/:courseId/enrollments", async (req: Request, res: Response) => {
  try {
    const enrollments = await lmsStorage.getEnrollmentsByCourseId(req.params.courseId);
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
});

// LMS stats
adminRouter.get("/lms/stats", async (req: Request, res: Response) => {
  try {
    const courses = await lmsStorage.getCourses();
    const publishedCourses = courses.filter(c => c.isPublished);
    
    res.json({
      totalCourses: courses.length,
      publishedCourses: publishedCourses.length,
      draftCourses: courses.length - publishedCourses.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// Course Prerequisites
adminRouter.get("/courses/:courseId/prerequisites", async (req: Request, res: Response) => {
  try {
    const prerequisites = await lmsStorage.getPrerequisitesByCourseId(req.params.courseId);
    const prereqWithDetails = await Promise.all(
      prerequisites.map(async (prereq) => {
        const course = await lmsStorage.getCourseById(prereq.prerequisiteId);
        return { ...prereq, prerequisiteCourse: course };
      })
    );
    res.json(prereqWithDetails);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch prerequisites" });
  }
});

adminRouter.post("/courses/:courseId/prerequisites", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { prerequisiteId } = req.body;
    
    if (req.params.courseId === prerequisiteId) {
      return res.status(400).json({ message: "Course cannot be its own prerequisite" });
    }
    
    const validated = insertCoursePrerequisiteSchema.parse({
      courseId: req.params.courseId,
      prerequisiteId,
    });
    
    const prerequisite = await lmsStorage.addPrerequisite(validated);
    
    // Audit log
    await logAuditAction(
      user?.id || null,
      "add_prerequisite",
      "course_prerequisite",
      prerequisite.id,
      null,
      prerequisite,
      req
    );
    
    res.status(201).json(prerequisite);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to add prerequisite" });
  }
});

adminRouter.delete("/courses/:courseId/prerequisites/:prerequisiteId", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { courseId, prerequisiteId } = req.params;
    
    const deleted = await lmsStorage.removePrerequisite(courseId, prerequisiteId);
    if (!deleted) {
      return res.status(404).json({ message: "Prerequisite not found" });
    }
    
    // Audit log
    await logAuditAction(
      user?.id || null,
      "remove_prerequisite",
      "course_prerequisite",
      null,
      { courseId, prerequisiteId },
      null,
      req
    );
    
    res.json({ message: "Prerequisite removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove prerequisite" });
  }
});

// ============ QUESTION BANK ROUTES ============

// Get all question topics
adminRouter.get("/question-topics", async (req: Request, res: Response) => {
  try {
    const topics = await lmsStorage.getQuestionTopics();
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch question topics" });
  }
});

// Create question topic
adminRouter.post("/question-topics", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const topic = await lmsStorage.createQuestionTopic(req.body);
    
    await logAuditAction(user?.id, "create_question_topic", "question_topic", topic.id, null, topic, req);
    res.status(201).json(topic);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create topic" });
  }
});

// Update question topic
adminRouter.put("/question-topics/:id", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oldTopic = await lmsStorage.getQuestionTopicById(req.params.id);
    const topic = await lmsStorage.updateQuestionTopic(req.params.id, req.body);
    
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    
    await logAuditAction(user?.id, "update_question_topic", "question_topic", topic.id, oldTopic, topic, req);
    res.json(topic);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update topic" });
  }
});

// Delete question topic
adminRouter.delete("/question-topics/:id", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oldTopic = await lmsStorage.getQuestionTopicById(req.params.id);
    const deleted = await lmsStorage.deleteQuestionTopic(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Topic not found" });
    }
    
    await logAuditAction(user?.id, "delete_question_topic", "question_topic", req.params.id, oldTopic, null, req);
    res.json({ message: "Topic deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete topic" });
  }
});

// Get all question bank items with optional filters
adminRouter.get("/question-bank", async (req: Request, res: Response) => {
  try {
    const { topicId, difficulty } = req.query;
    const items = await lmsStorage.getQuestionBankItems({
      topicId: topicId as string,
      difficulty: difficulty as string,
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

// Get question bank item by ID with options
adminRouter.get("/question-bank/:id", async (req: Request, res: Response) => {
  try {
    const item = await lmsStorage.getQuestionBankItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    const options = await lmsStorage.getQuestionBankOptionsByQuestionId(req.params.id);
    res.json({ ...item, options });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch question" });
  }
});

// Create question bank item
adminRouter.post("/question-bank", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { options, ...questionData } = req.body;
    
    const question = await lmsStorage.createQuestionBankItem({
      ...questionData,
      createdBy: user?.id || null,
    });
    
    // Create options if provided
    if (options && Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        await lmsStorage.createQuestionBankOption({
          questionId: question.id,
          optionText: options[i].optionText,
          isCorrect: options[i].isCorrect || false,
          explanation: options[i].explanation || null,
          order: i,
        });
      }
    }
    
    const fullQuestion = await lmsStorage.getQuestionBankItemById(question.id);
    const questionOptions = await lmsStorage.getQuestionBankOptionsByQuestionId(question.id);
    
    await logAuditAction(user?.id, "create_question", "question_bank", question.id, null, question, req);
    res.status(201).json({ ...fullQuestion, options: questionOptions });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create question" });
  }
});

// Update question bank item
adminRouter.put("/question-bank/:id", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { options, ...questionData } = req.body;
    
    const oldQuestion = await lmsStorage.getQuestionBankItemById(req.params.id);
    const question = await lmsStorage.updateQuestionBankItem(req.params.id, questionData);
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    // Update options if provided
    if (options && Array.isArray(options)) {
      // Delete existing options
      const existingOptions = await lmsStorage.getQuestionBankOptionsByQuestionId(req.params.id);
      for (const opt of existingOptions) {
        await lmsStorage.deleteQuestionBankOption(opt.id);
      }
      
      // Create new options
      for (let i = 0; i < options.length; i++) {
        await lmsStorage.createQuestionBankOption({
          questionId: question.id,
          optionText: options[i].optionText,
          isCorrect: options[i].isCorrect || false,
          explanation: options[i].explanation || null,
          order: i,
        });
      }
    }
    
    const questionOptions = await lmsStorage.getQuestionBankOptionsByQuestionId(question.id);
    
    await logAuditAction(user?.id, "update_question", "question_bank", question.id, oldQuestion, question, req);
    res.json({ ...question, options: questionOptions });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update question" });
  }
});

// Delete question bank item (soft delete)
adminRouter.delete("/question-bank/:id", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oldQuestion = await lmsStorage.getQuestionBankItemById(req.params.id);
    const deleted = await lmsStorage.deleteQuestionBankItem(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    await logAuditAction(user?.id, "delete_question", "question_bank", req.params.id, oldQuestion, null, req);
    res.json({ message: "Question deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete question" });
  }
});

// ============ FLASHCARD ROUTES ============

// Get all flashcard decks
adminRouter.get("/flashcard-decks", async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query;
    const decks = await lmsStorage.getFlashcardDecks(courseId as string);
    res.json(decks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch flashcard decks" });
  }
});

// Get flashcard deck by ID with flashcards
adminRouter.get("/flashcard-decks/:id", async (req: Request, res: Response) => {
  try {
    const deck = await lmsStorage.getFlashcardDeckById(req.params.id);
    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }
    
    const flashcards = await lmsStorage.getFlashcardsByDeckId(req.params.id);
    res.json({ ...deck, flashcards });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch deck" });
  }
});

// Create flashcard deck
adminRouter.post("/flashcard-decks", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const deck = await lmsStorage.createFlashcardDeck(req.body);
    
    await logAuditAction(user?.id, "create_flashcard_deck", "flashcard_deck", deck.id, null, deck, req);
    res.status(201).json(deck);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create deck" });
  }
});

// Update flashcard deck
adminRouter.put("/flashcard-decks/:id", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oldDeck = await lmsStorage.getFlashcardDeckById(req.params.id);
    const deck = await lmsStorage.updateFlashcardDeck(req.params.id, req.body);
    
    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }
    
    await logAuditAction(user?.id, "update_flashcard_deck", "flashcard_deck", deck.id, oldDeck, deck, req);
    res.json(deck);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update deck" });
  }
});

// Delete flashcard deck
adminRouter.delete("/flashcard-decks/:id", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oldDeck = await lmsStorage.getFlashcardDeckById(req.params.id);
    const deleted = await lmsStorage.deleteFlashcardDeck(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Deck not found" });
    }
    
    await logAuditAction(user?.id, "delete_flashcard_deck", "flashcard_deck", req.params.id, oldDeck, null, req);
    res.json({ message: "Deck deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete deck" });
  }
});

// Create flashcard in deck
adminRouter.post("/flashcard-decks/:deckId/flashcards", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const flashcard = await lmsStorage.createFlashcard({
      ...req.body,
      deckId: req.params.deckId,
    });
    
    await logAuditAction(user?.id, "create_flashcard", "flashcard", flashcard.id, null, flashcard, req);
    res.status(201).json(flashcard);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create flashcard" });
  }
});

// Update flashcard
adminRouter.put("/flashcards/:id", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oldFlashcard = await lmsStorage.getFlashcardById(req.params.id);
    const flashcard = await lmsStorage.updateFlashcard(req.params.id, req.body);
    
    if (!flashcard) {
      return res.status(404).json({ message: "Flashcard not found" });
    }
    
    await logAuditAction(user?.id, "update_flashcard", "flashcard", flashcard.id, oldFlashcard, flashcard, req);
    res.json(flashcard);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update flashcard" });
  }
});

// Delete flashcard
adminRouter.delete("/flashcards/:id", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oldFlashcard = await lmsStorage.getFlashcardById(req.params.id);
    const deleted = await lmsStorage.deleteFlashcard(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Flashcard not found" });
    }
    
    await logAuditAction(user?.id, "delete_flashcard", "flashcard", req.params.id, oldFlashcard, null, req);
    res.json({ message: "Flashcard deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete flashcard" });
  }
});

// ============ PUBLIC QUESTION BANK ROUTES (for practice mode) ============

// Get question topics (public read)
publicRouter.get("/question-topics", async (req: Request, res: Response) => {
  try {
    const topics = await lmsStorage.getQuestionTopics();
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch question topics" });
  }
});

// Get question bank items for practice (public read)
publicRouter.get("/question-bank", async (req: Request, res: Response) => {
  try {
    const { topicId, difficulty } = req.query;
    const items = await lmsStorage.getQuestionBankItems({
      topicId: topicId as string,
      difficulty: difficulty as string,
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

// Get question bank item by ID with options (public read)
publicRouter.get("/question-bank/:id", async (req: Request, res: Response) => {
  try {
    const item = await lmsStorage.getQuestionBankItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    const options = await lmsStorage.getQuestionBankOptionsByQuestionId(req.params.id);
    res.json({ ...item, options });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch question" });
  }
});

// ============ PUBLIC FLASHCARD ROUTES ============

// Get all flashcard decks (public read)
publicRouter.get("/flashcard-decks", async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query;
    const decks = await lmsStorage.getFlashcardDecks(courseId as string);
    res.json(decks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch flashcard decks" });
  }
});

// Get flashcard deck by ID with flashcards (public read)
publicRouter.get("/flashcard-decks/:id", async (req: Request, res: Response) => {
  try {
    const deck = await lmsStorage.getFlashcardDeckById(req.params.id);
    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }
    
    const flashcards = await lmsStorage.getFlashcardsByDeckId(req.params.id);
    res.json({ ...deck, flashcards });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch deck" });
  }
});

// ============ PUBLIC 3D ANATOMY MODELS ROUTES ============

// Get all 3D anatomy models (public read)
publicRouter.get("/anatomy-models", async (req: Request, res: Response) => {
  try {
    const { category, bodySystem } = req.query;
    const models = await lmsStorage.getAnatomyModels({
      category: category as string,
      bodySystem: bodySystem as string,
    });
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch anatomy models" });
  }
});

// Get anatomy model by ID (public read)
publicRouter.get("/anatomy-models/:id", async (req: Request, res: Response) => {
  try {
    const model = await lmsStorage.getAnatomyModelById(req.params.id);
    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }
    res.json(model);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch anatomy model" });
  }
});

// ============ ADMIN 3D ANATOMY MODELS ROUTES ============

// Get all anatomy models (admin)
adminRouter.get("/anatomy-models", async (req: Request, res: Response) => {
  try {
    const models = await lmsStorage.getAnatomyModels({});
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch anatomy models" });
  }
});

// Create anatomy model (admin only)
adminRouter.post("/anatomy-models", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const model = await lmsStorage.createAnatomyModel({
      ...req.body,
      createdBy: user.id,
    });
    
    await logAuditAction(user.id, "CREATE", "anatomy_model", model.id, null, model, req);
    res.status(201).json(model);
  } catch (error) {
    res.status(500).json({ message: "Failed to create anatomy model" });
  }
});

// Update anatomy model (admin only)
adminRouter.patch("/anatomy-models/:id", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oldModel = await lmsStorage.getAnatomyModelById(req.params.id);
    
    const model = await lmsStorage.updateAnatomyModel(req.params.id, req.body);
    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }
    
    await logAuditAction(user.id, "UPDATE", "anatomy_model", model.id, oldModel, model, req);
    res.json(model);
  } catch (error) {
    res.status(500).json({ message: "Failed to update anatomy model" });
  }
});

// Delete anatomy model (admin only)
adminRouter.delete("/anatomy-models/:id", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const oldModel = await lmsStorage.getAnatomyModelById(req.params.id);
    
    const success = await lmsStorage.deleteAnatomyModel(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Model not found" });
    }
    
    await logAuditAction(user.id, "DELETE", "anatomy_model", req.params.id, oldModel, null, req);
    res.json({ message: "Model deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete anatomy model" });
  }
});

// ============ MEMBER FLASHCARD STUDY ROUTES ============

// Get flashcard decks for members (public decks or course-related)
subscriberRouter.get("/flashcard-decks", async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query;
    const decks = await lmsStorage.getFlashcardDecks(courseId as string);
    res.json(decks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch flashcard decks" });
  }
});

// Get due flashcards for study
subscriberRouter.get("/flashcard-decks/:deckId/due", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const dueCards = await lmsStorage.getDueFlashcards(member.id, req.params.deckId);
    
    // Get flashcard details for each due card
    const cardsWithDetails = await Promise.all(
      dueCards.map(async (progress) => {
        const flashcard = await lmsStorage.getFlashcardById(progress.flashcardId);
        return { ...flashcard, progress };
      })
    );
    
    res.json(cardsWithDetails);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch due flashcards" });
  }
});

// Submit flashcard review (spaced repetition update)
subscriberRouter.post("/flashcards/:flashcardId/review", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const { quality } = req.body; // quality: 0-5 (0=complete fail, 5=perfect)
    
    const existing = await lmsStorage.getFlashcardProgress(member.id, req.params.flashcardId);
    
    // SM-2 algorithm for spaced repetition
    let easeFactor = existing?.easeFactor || 250;
    let interval = existing?.interval || 1;
    let masteryLevel = existing?.masteryLevel || 0;
    
    if (quality >= 3) {
      // Correct response
      if (interval === 1) {
        interval = 1;
      } else if (interval === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * (easeFactor / 100));
      }
      
      easeFactor = easeFactor + (80 - 5 * (5 - quality) - (5 - quality) * (5 - quality));
      if (easeFactor < 130) easeFactor = 130;
      
      masteryLevel = Math.min(5, masteryLevel + 1);
    } else {
      // Incorrect response - reset
      interval = 1;
      masteryLevel = Math.max(0, masteryLevel - 1);
    }
    
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);
    
    const progress = await lmsStorage.upsertFlashcardProgress({
      memberId: member.id,
      flashcardId: req.params.flashcardId,
      masteryLevel,
      interval,
      easeFactor,
      nextReviewAt,
    });
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: "Failed to update flashcard progress" });
  }
});

// ============ MEMBER MANAGEMENT (Admin) ============

// Get all members with their membership info
adminRouter.get("/members", async (req: Request, res: Response) => {
  try {
    const allMembers = await lmsStorage.getAllMembers();
    res.json(allMembers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

// Update member's membership tier
adminRouter.patch("/members/:id/membership", async (req: Request, res: Response) => {
  try {
    const { tier, expiresAt } = req.body;
    const admin = (req as any).user;
    
    // Validate tier
    const { membershipTiers } = await import("@shared/models/auth");
    if (!membershipTiers.includes(tier)) {
      return res.status(400).json({ message: "Invalid membership tier" });
    }
    
    const oldMember = await lmsStorage.getMemberById(req.params.id);
    if (!oldMember) {
      return res.status(404).json({ message: "Member not found" });
    }
    
    const updated = await lmsStorage.updateMemberMembership(
      req.params.id, 
      tier, 
      expiresAt ? new Date(expiresAt) : null
    );
    
    // Log the action
    await logAuditAction(
      admin.id,
      "update_membership",
      "member",
      req.params.id,
      { tier: oldMember.membershipTier, expiresAt: oldMember.membershipExpiresAt },
      { tier, expiresAt },
      req
    );
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update membership" });
  }
});

// Audit Logs (Super Admin only)
const superAdminRouter = Router();
superAdminRouter.use(isSuperAdmin);

superAdminRouter.get("/audit-logs", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const logs = await lmsStorage.getAuditLogs(limit, offset);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// Mount sub-routers on main router
router.use("/", publicRouter);
router.use("/", memberRouter);
router.use("/", subscriberRouter); // Routes requiring active subscription
router.use("/admin", adminRouter);
router.use("/admin", superAdminRouter);

export default router;
