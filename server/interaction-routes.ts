import { Router, Request, Response } from "express";
import { isMemberAuthenticated } from "./auth";
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  serverTimestamp,
  collections,
} from "./lib/firebase";
import { sendErrorResponse } from "./errorHandler";

const router = Router();

const memberRouter = Router();
memberRouter.use(isMemberAuthenticated);

// ============ CONVERSATIONS ============

memberRouter.get("/conversations", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const conversations = await getDocuments(collections.conversations, {
      filters: [{ field: "participantIds", operator: "array-contains", value: req.user.id }],
      orderBy: [{ field: "updatedAt", direction: "desc" }],
    });

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    sendErrorResponse(res, 500, "Failed to fetch conversations", error);
  }
});

memberRouter.post("/conversations", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    // Check if conversation already exists
    const existing = await getDocuments(collections.conversations, {
      filters: [
        { field: "type", operator: "==", value: "direct" },
        { field: "participantIds", operator: "array-contains", value: req.user.id },
      ],
    });

    const existingConv = existing.find((c: any) => 
      c.participantIds?.includes(recipientId) && c.participantIds?.length === 2
    );

    if (existingConv) {
      res.json(existingConv);
      return;
    }

    // Create new conversation
    const conversationData = {
      type: "direct",
      participantIds: [req.user.id, recipientId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const conversationId = await createDocument(collections.conversations, conversationData as any);

    res.status(201).json({
      id: conversationId,
      ...conversationData,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    sendErrorResponse(res, 500, "Failed to create conversation", error);
  }
});

// ============ MESSAGES ============

memberRouter.get("/conversations/:conversationId/messages", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await getDocuments(collections.messages, {
      filters: [
        { field: "conversationId", operator: "==", value: conversationId },
        { field: "isDeleted", operator: "==", value: false },
      ],
      orderBy: [{ field: "createdAt", direction: "desc" }],
      limit: parseInt(limit as string),
    });

    res.json(messages.reverse()); // Reverse to get oldest first
  } catch (error) {
    console.error("Error fetching messages:", error);
    sendErrorResponse(res, 500, "Failed to fetch messages", error);
  }
});

memberRouter.post("/conversations/:conversationId/messages", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const messageData = {
      conversationId,
      senderId: req.user.id,
      content: content.trim(),
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const messageId = await createDocument(collections.messages, messageData as any);

    // Update conversation updatedAt
    await updateDocument(collections.conversations.doc(conversationId), {
      updatedAt: serverTimestamp(),
    });

    res.status(201).json({
      id: messageId,
      ...messageData,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    sendErrorResponse(res, 500, "Failed to create message", error);
  }
});

// ============ COMMENTS ============

memberRouter.get("/comments", async (req: Request, res: Response) => {
  try {
    const { commentableType, commentableId } = req.query;

    if (!commentableType || !commentableId) {
      return res.status(400).json({ error: "commentableType and commentableId are required" });
    }

    const comments = await getDocuments(collections.comments, {
      filters: [
        { field: "commentableType", operator: "==", value: commentableType },
        { field: "commentableId", operator: "==", value: commentableId },
        { field: "isDeleted", operator: "==", value: false },
      ],
      orderBy: [{ field: "createdAt", direction: "asc" }],
    });

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    sendErrorResponse(res, 500, "Failed to fetch comments", error);
  }
});

memberRouter.post("/comments", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const { commentableType, commentableId, content, parentId } = req.body;

    if (!commentableType || !commentableId || !content) {
      return res.status(400).json({ error: "commentableType, commentableId, and content are required" });
    }

    const commentData = {
      commentableType,
      commentableId,
      memberId: req.user.id,
      content: content.trim(),
      parentId: parentId || null,
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const commentId = await createDocument(collections.comments, commentData as any);

    res.status(201).json({
      id: commentId,
      ...commentData,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    sendErrorResponse(res, 500, "Failed to create comment", error);
  }
});

memberRouter.put("/comments/:commentId", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await getDocumentById(collections.comments, commentId);
    if (!comment || (comment as any).memberId !== req.user.id) {
      sendErrorResponse(res, 403, "Unauthorized");
      return;
    }

    await updateDocument(collections.comments.doc(commentId), {
      content: content.trim(),
      isEdited: true,
      updatedAt: serverTimestamp(),
    });

    res.json({ success: true, message: "Comment updated" });
  } catch (error) {
    console.error("Error updating comment:", error);
    sendErrorResponse(res, 500, "Failed to update comment", error);
  }
});

memberRouter.delete("/comments/:commentId", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const { commentId } = req.params;

    const comment = await getDocumentById(collections.comments, commentId);
    if (!comment || (comment as any).memberId !== req.user.id) {
      sendErrorResponse(res, 403, "Unauthorized");
      return;
    }

    await updateDocument(collections.comments.doc(commentId), {
      isDeleted: true,
      updatedAt: serverTimestamp(),
    });

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    sendErrorResponse(res, 500, "Failed to delete comment", error);
  }
});

// ============ DISCUSSIONS ============

memberRouter.get("/discussions", async (req: Request, res: Response) => {
  try {
    const { courseId, lessonId } = req.query;

    const filters: any[] = [];
    if (courseId) filters.push({ field: "courseId", operator: "==", value: courseId });
    if (lessonId) filters.push({ field: "lessonId", operator: "==", value: lessonId });

    const discussions = await getDocuments(collections.discussions, {
      filters: filters.length > 0 ? filters : undefined,
      orderBy: [{ field: "createdAt", direction: "desc" }],
    });

    res.json(discussions);
  } catch (error) {
    console.error("Error fetching discussions:", error);
    sendErrorResponse(res, 500, "Failed to fetch discussions", error);
  }
});

memberRouter.post("/discussions", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const { title, content, courseId, lessonId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "title and content are required" });
    }

    const discussionData = {
      title: title.trim(),
      content: content.trim(),
      courseId: courseId || null,
      lessonId: lessonId || null,
      memberId: req.user.id,
      isPinned: false,
      isLocked: false,
      viewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const discussionId = await createDocument(collections.discussions, discussionData as any);

    res.status(201).json({
      id: discussionId,
      ...discussionData,
    });
  } catch (error) {
    console.error("Error creating discussion:", error);
    sendErrorResponse(res, 500, "Failed to create discussion", error);
  }
});

// Health check
router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Mount member routes
router.use(memberRouter);

export default router;
