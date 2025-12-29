import { Router, Request, Response } from "express";
import { lmsStorage } from "./lms-storage";
import { isAuthenticated, isMemberAuthenticated } from "./auth";
import { 
  insertCourseSchema, 
  insertCourseModuleSchema,
  insertLessonSchema,
  insertLessonAssetSchema,
  insertEnrollmentSchema,
  insertQuizSchema,
  insertQuizQuestionSchema,
  insertQuizOptionSchema,
} from "@shared/schema";

const router = Router();

// Create sub-routers for different access levels
const publicRouter = Router();
const memberRouter = Router();
const adminRouter = Router();

// Apply authentication middleware to protected routers
memberRouter.use(isMemberAuthenticated);
adminRouter.use(isAuthenticated);

// ============ PUBLIC ROUTES ============

// Get all published courses
publicRouter.get("/courses", async (req: Request, res: Response) => {
  try {
    const courses = await lmsStorage.getPublishedCourses();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses" });
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

// ============ MEMBER ROUTES (requires member auth - middleware applied above) ============

// Enroll in a course
memberRouter.post("/enrollments", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const { courseId } = req.body;
    
    // Check if already enrolled
    const existing = await lmsStorage.getEnrollment(member.id, courseId);
    if (existing) {
      return res.status(400).json({ message: "Already enrolled in this course" });
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

// Get member's enrollments
memberRouter.get("/enrollments/me", async (req: Request, res: Response) => {
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
memberRouter.post("/lessons/:lessonId/progress", async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    const { lessonId } = req.params;
    const { isCompleted, progressPercent } = req.body;

    const progress = await lmsStorage.upsertLessonProgress({
      memberId: member.id,
      lessonId,
      isCompleted: isCompleted || false,
      progressPercent: progressPercent || 0,
    });
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: "Failed to update progress" });
  }
});

// Get member's progress for a course
memberRouter.get("/courses/:courseId/progress", async (req: Request, res: Response) => {
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
memberRouter.post("/quizzes/:quizId/attempt", async (req: Request, res: Response) => {
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
memberRouter.post("/quizzes/attempts/:attemptId/submit", async (req: Request, res: Response) => {
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
memberRouter.get("/certificates/me", async (req: Request, res: Response) => {
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

// Mount sub-routers on main router
router.use("/", publicRouter);
router.use("/", memberRouter);
router.use("/admin", adminRouter);

export default router;
