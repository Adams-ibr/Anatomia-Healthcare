import { Router, Request, Response } from "express";
import { 
  getDocuments, 
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  serverTimestamp,
  collections,
} from "./lib/firebase";
import { isAuthenticated, isMemberAuthenticated, requireActiveMembership, isContentAdmin, isSuperAdmin } from "./auth";
import { sendErrorResponse } from "./errorHandler";

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
    const { category, level, search } = req.query;
    
    let filters: any[] = [{ field: "isPublished", operator: "==", value: true }];

    if (category && typeof category === "string") {
      filters.push({ field: "category", operator: "==", value: category });
    }

    if (level && typeof level === "string") {
      filters.push({ field: "level", operator: "==", value: level });
    }

    let courses = await getDocuments(collections.courses, {
      filters,
      orderBy: [{ field: "createdAt", direction: "desc" }],
    });

    // Client-side search if needed
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      courses = courses.filter((c: any) =>
        c.title?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower) ||
        c.shortDescription?.toLowerCase().includes(searchLower)
      );
    }

    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    sendErrorResponse(res, 500, "Failed to fetch courses", error);
  }
});

// Get single course
publicRouter.get("/courses/:id", async (req: Request, res: Response) => {
  try {
    const course = await getDocumentById(collections.courses, req.params.id);
    
    if (!course || !(course as any).isPublished) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    sendErrorResponse(res, 500, "Failed to fetch course", error);
  }
});

// Get course categories
publicRouter.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await getDocuments(collections.courseCategories, {
      orderBy: [{ field: "order", direction: "asc" }],
    });

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    sendErrorResponse(res, 500, "Failed to fetch categories", error);
  }
});

// ============ MEMBER ROUTES ============

// Get member's enrollments
memberRouter.get("/enrollments", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const enrollments = await getDocuments(collections.enrollments, {
      filters: [{ field: "memberId", operator: "==", value: req.user.id }],
      orderBy: [{ field: "enrolledAt", direction: "desc" }],
    });

    res.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    sendErrorResponse(res, 500, "Failed to fetch enrollments", error);
  }
});

// Enroll in course
memberRouter.post("/courses/:courseId/enroll", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const { courseId } = req.params;

    // Check if already enrolled
    const existing = await getDocuments(collections.enrollments, {
      filters: [
        { field: "memberId", operator: "==", value: req.user.id },
        { field: "courseId", operator: "==", value: courseId },
      ],
      limit: 1,
    });

    if (existing.length > 0) {
      return res.status(409).json({ error: "Already enrolled in this course" });
    }

    const enrollmentData = {
      memberId: req.user.id,
      courseId,
      status: "active",
      progress: 0,
      enrolledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const enrollmentId = await createDocument(collections.enrollments, enrollmentData as any);

    res.status(201).json({
      success: true,
      message: "Enrolled successfully",
      enrollmentId,
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    sendErrorResponse(res, 500, "Failed to enroll in course", error);
  }
});

// Get course modules
memberRouter.get("/courses/:courseId/modules", async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const modules = await getDocuments(collections.courseModules, {
      filters: [{ field: "courseId", operator: "==", value: courseId }],
      orderBy: [{ field: "order", direction: "asc" }],
    });

    res.json(modules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    sendErrorResponse(res, 500, "Failed to fetch modules", error);
  }
});

// Get lessons in module
memberRouter.get("/modules/:moduleId/lessons", async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    const lessons = await getDocuments(collections.lessons, {
      filters: [{ field: "moduleId", operator: "==", value: moduleId }],
      orderBy: [{ field: "order", direction: "asc" }],
    });

    res.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    sendErrorResponse(res, 500, "Failed to fetch lessons", error);
  }
});

// Get single lesson
memberRouter.get("/lessons/:lessonId", async (req: Request, res: Response) => {
  try {
    const lesson = await getDocumentById(collections.lessons, req.params.lessonId);
    
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.json(lesson);
  } catch (error) {
    console.error("Error fetching lesson:", error);
    sendErrorResponse(res, 500, "Failed to fetch lesson", error);
  }
});

// Update lesson progress
memberRouter.post("/lessons/:lessonId/progress", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const { lessonId } = req.params;
    const { progressPercent, timeSpentSeconds, isCompleted } = req.body;

    const progressKey = `${req.user.id}:${lessonId}`;
    const progressDocs = await getDocuments(collections.lessonProgress, {
      filters: [
        { field: "memberId", operator: "==", value: req.user.id },
        { field: "lessonId", operator: "==", value: lessonId },
      ],
      limit: 1,
    });

    let progressData = {
      memberId: req.user.id,
      lessonId,
      progressPercent: progressPercent || 0,
      timeSpentSeconds: (progressDocs[0]?.timeSpentSeconds || 0) + (timeSpentSeconds || 0),
      isCompleted: isCompleted || false,
      lastAccessedAt: serverTimestamp(),
      completedAt: isCompleted ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    };

    if (progressDocs.length > 0) {
      await updateDocument(collections.lessonProgress.doc(progressDocs[0].id), progressData);
    } else {
      await createDocument(collections.lessonProgress, {
        ...progressData,
        createdAt: serverTimestamp(),
      } as any);
    }

    res.json({
      success: true,
      message: "Progress updated",
      progress: progressData,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    sendErrorResponse(res, 500, "Failed to update progress", error);
  }
});

// ============ ADMIN ROUTES ============

// Create course (admin only)
adminRouter.post("/courses", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const courseData = {
      ...req.body,
      createdBy: req.user?.id,
      isPublished: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const courseId = await createDocument(collections.courses, courseData as any);

    res.status(201).json({
      success: true,
      message: "Course created",
      courseId,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    sendErrorResponse(res, 500, "Failed to create course", error);
  }
});

// Update course (admin only)
adminRouter.put("/courses/:courseId", isContentAdmin, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    await updateDocument(collections.courses.doc(courseId), {
      ...req.body,
      updatedAt: serverTimestamp(),
    });

    res.json({ success: true, message: "Course updated" });
  } catch (error) {
    console.error("Error updating course:", error);
    sendErrorResponse(res, 500, "Failed to update course", error);
  }
});

// Delete course (super admin only)
adminRouter.delete("/courses/:courseId", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    await deleteDocument(collections.courses.doc(courseId));

    res.json({ success: true, message: "Course deleted" });
  } catch (error) {
    console.error("Error deleting course:", error);
    sendErrorResponse(res, 500, "Failed to delete course", error);
  }
});

// Health check
router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Mount sub-routers
router.use(publicRouter);
router.use(memberRouter);
router.use(adminRouter);

export default router;
