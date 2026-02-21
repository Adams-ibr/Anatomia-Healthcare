import { Router, Request, Response } from "express";
import { isMemberAuthenticated } from "./auth";
import { interactionStorage } from "./interaction-storage";
import {
  insertMessageSchema,
  insertCommentSchema,
  insertDiscussionSchema,
  insertDiscussionReplySchema,
} from "../shared/schema";
import { z } from "zod";

const router = Router();

const memberRouter = Router();
memberRouter.use(isMemberAuthenticated);

memberRouter.get("/conversations", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversations = await interactionStorage.getConversationsByMemberId(memberId);
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

memberRouter.post("/conversations", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }

    const conversation = await interactionStorage.getOrCreateDirectConversation(memberId, recipientId);
    res.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ message: "Failed to create conversation" });
  }
});

memberRouter.get("/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const isParticipant = await interactionStorage.isMemberInConversation(id, memberId);
    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    const { limit = "50", offset = "0" } = req.query;

    const messages = await interactionStorage.getMessagesByConversationId(
      id,
      parseInt(limit as string, 10),
      parseInt(offset as string, 10)
    );

    await interactionStorage.markConversationAsRead(id, memberId);

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

memberRouter.post("/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    const member = (req as any).member;
    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const isParticipant = await interactionStorage.isMemberInConversation(id, memberId);
    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    const validation = insertMessageSchema.safeParse({
      conversationId: id,
      senderId: memberId,
      content: req.body.content,
    });

    if (!validation.success) {
      return res.status(400).json({ message: "Invalid message data", errors: validation.error.errors });
    }

    const message = await interactionStorage.createMessage(validation.data);

    res.status(201).json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

memberRouter.post("/conversations/:id/read", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const isParticipant = await interactionStorage.isMemberInConversation(id, memberId);
    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    await interactionStorage.markConversationAsRead(id, memberId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

memberRouter.get("/members/search", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const members = await interactionStorage.searchMembers(q, memberId);
    res.json(members);
  } catch (error) {
    console.error("Error searching members:", error);
    res.status(500).json({ message: "Failed to search members" });
  }
});

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  parentId: z.string().optional(),
});

memberRouter.get("/comments/:type/:id", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    const { type, id } = req.params;

    const comments = await interactionStorage.getCommentsByTarget(type, id, memberId);
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

memberRouter.post("/comments/:type/:id", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { type, id } = req.params;
    const validation = commentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ message: "Invalid comment data", errors: validation.error.errors });
    }

    const comment = await interactionStorage.createComment({
      commentableType: type,
      commentableId: id,
      memberId,
      content: validation.data.content,
      parentId: validation.data.parentId || null,
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Failed to create comment" });
  }
});

memberRouter.patch("/comments/:commentId", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ message: "Content is required" });
    }

    const updated = await interactionStorage.updateComment(commentId, content);
    res.json(updated);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Failed to update comment" });
  }
});

memberRouter.delete("/comments/:commentId", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await interactionStorage.deleteComment(req.params.commentId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

memberRouter.get("/discussions", async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query;

    if (!courseId || typeof courseId !== "string") {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const discussions = await interactionStorage.getDiscussionsByCourse(courseId);
    res.json(discussions);
  } catch (error) {
    console.error("Error fetching discussions:", error);
    res.status(500).json({ message: "Failed to fetch discussions" });
  }
});

memberRouter.get("/discussions/:id", async (req: Request, res: Response) => {
  try {
    const discussion = await interactionStorage.getDiscussionById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    await interactionStorage.incrementDiscussionViews(req.params.id);
    res.json(discussion);
  } catch (error) {
    console.error("Error fetching discussion:", error);
    res.status(500).json({ message: "Failed to fetch discussion" });
  }
});

memberRouter.post("/discussions", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validation = insertDiscussionSchema.safeParse({
      ...req.body,
      memberId,
    });

    if (!validation.success) {
      return res.status(400).json({ message: "Invalid discussion data", errors: validation.error.errors });
    }

    const discussion = await interactionStorage.createDiscussion(validation.data);
    res.status(201).json(discussion);
  } catch (error) {
    console.error("Error creating discussion:", error);
    res.status(500).json({ message: "Failed to create discussion" });
  }
});

memberRouter.get("/discussions/:id/replies", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    const replies = await interactionStorage.getDiscussionReplies(req.params.id, memberId);
    res.json(replies);
  } catch (error) {
    console.error("Error fetching replies:", error);
    res.status(500).json({ message: "Failed to fetch replies" });
  }
});

memberRouter.post("/discussions/:id/replies", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const validation = insertDiscussionReplySchema.safeParse({
      discussionId: id,
      memberId,
      content: req.body.content,
      parentId: req.body.parentId || null,
    });

    if (!validation.success) {
      return res.status(400).json({ message: "Invalid reply data", errors: validation.error.errors });
    }

    const reply = await interactionStorage.createDiscussionReply(validation.data);
    res.status(201).json(reply);
  } catch (error) {
    console.error("Error creating reply:", error);
    res.status(500).json({ message: "Failed to create reply" });
  }
});

memberRouter.post("/likes/:type/:id", async (req: Request, res: Response) => {
  try {
    const memberId = (req as any).member?.id;
    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { type, id } = req.params;
    const isLiked = await interactionStorage.toggleLike(type, id, memberId);
    res.json({ liked: isLiked });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Failed to toggle like" });
  }
});

router.use("/", memberRouter);

export default router;
