import { db } from "./db";
import { eq, and, desc, or, sql } from "drizzle-orm";
import {
  conversations,
  conversationParticipants,
  messages,
  comments,
  discussions,
  discussionReplies,
  likes,
  members,
  type Conversation,
  type InsertConversation,
  type ConversationParticipant,
  type InsertConversationParticipant,
  type Message,
  type InsertMessage,
  type Comment,
  type InsertComment,
  type Discussion,
  type InsertDiscussion,
  type DiscussionReply,
  type InsertDiscussionReply,
  type Like,
  type InsertLike,
} from "@shared/schema";

export interface ConversationWithDetails extends Conversation {
  participants: Array<{
    id: string;
    memberId: string;
    firstName: string | null;
    lastName: string | null;
  }>;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface MessageWithSender extends Message {
  senderFirstName: string | null;
  senderLastName: string | null;
}

export interface CommentWithMember extends Comment {
  memberFirstName: string | null;
  memberLastName: string | null;
  replies?: CommentWithMember[];
  likesCount?: number;
  isLikedByCurrentUser?: boolean;
}

export interface DiscussionWithDetails extends Discussion {
  memberFirstName: string | null;
  memberLastName: string | null;
  replyCount?: number;
  lastActivityAt?: Date | null;
}

export interface DiscussionReplyWithMember extends DiscussionReply {
  memberFirstName: string | null;
  memberLastName: string | null;
  likesCount?: number;
  isLikedByCurrentUser?: boolean;
}

class InteractionStorage {
  async createConversation(data: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(data).returning();
    return conversation;
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async isMemberInConversation(conversationId: string, memberId: string): Promise<boolean> {
    const [participant] = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.memberId, memberId)
        )
      );
    return !!participant;
  }

  async addParticipant(data: InsertConversationParticipant): Promise<ConversationParticipant> {
    const [participant] = await db.insert(conversationParticipants).values(data).returning();
    return participant;
  }

  async getConversationsByMemberId(memberId: string): Promise<ConversationWithDetails[]> {
    const participantRows = await db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.memberId, memberId));

    const conversationIds = participantRows.map((p) => p.conversationId);
    if (conversationIds.length === 0) return [];

    const result: ConversationWithDetails[] = [];

    for (const convId of conversationIds) {
      const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId));
      if (!conv) continue;

      const allParticipants = await db
        .select({
          id: conversationParticipants.id,
          memberId: conversationParticipants.memberId,
          firstName: members.firstName,
          lastName: members.lastName,
        })
        .from(conversationParticipants)
        .innerJoin(members, eq(conversationParticipants.memberId, members.id))
        .where(eq(conversationParticipants.conversationId, convId));

      const [lastMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convId))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const currentParticipant = participantRows.find((p) => p.conversationId === convId);
      let unreadCount = 0;
      if (currentParticipant?.lastReadAt) {
        const unreadMessages = await db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, convId),
              sql`${messages.createdAt} > ${currentParticipant.lastReadAt}`
            )
          );
        unreadCount = unreadMessages.length;
      }

      result.push({
        ...conv,
        participants: allParticipants,
        lastMessage,
        unreadCount,
      });
    }

    return result.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return new Date(bTime || 0).getTime() - new Date(aTime || 0).getTime();
    });
  }

  async getOrCreateDirectConversation(member1Id: string, member2Id: string): Promise<Conversation> {
    const member1Convs = await db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.memberId, member1Id));

    for (const p1 of member1Convs) {
      const [conv] = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, p1.conversationId), eq(conversations.type, "direct")));

      if (conv) {
        const participants = await db
          .select()
          .from(conversationParticipants)
          .where(eq(conversationParticipants.conversationId, conv.id));

        if (participants.length === 2 && participants.some((p) => p.memberId === member2Id)) {
          return conv;
        }
      }
    }

    const [newConv] = await db.insert(conversations).values({ type: "direct" }).returning();

    await db.insert(conversationParticipants).values([
      { conversationId: newConv.id, memberId: member1Id },
      { conversationId: newConv.id, memberId: member2Id },
    ]);

    return newConv;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, data.conversationId));
    return message;
  }

  async getMessagesByConversationId(conversationId: string, limit = 50, offset = 0): Promise<MessageWithSender[]> {
    const result = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        isEdited: messages.isEdited,
        isDeleted: messages.isDeleted,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        senderFirstName: members.firstName,
        senderLastName: members.lastName,
      })
      .from(messages)
      .innerJoin(members, eq(messages.senderId, members.id))
      .where(and(eq(messages.conversationId, conversationId), eq(messages.isDeleted, false)))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return result.reverse();
  }

  async markConversationAsRead(conversationId: string, memberId: string): Promise<void> {
    await db
      .update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.memberId, memberId)
        )
      );
  }

  async createComment(data: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(data).returning();
    return comment;
  }

  async getCommentsByTarget(
    commentableType: string,
    commentableId: string,
    currentMemberId?: string
  ): Promise<CommentWithMember[]> {
    const result = await db
      .select({
        id: comments.id,
        commentableType: comments.commentableType,
        commentableId: comments.commentableId,
        memberId: comments.memberId,
        content: comments.content,
        parentId: comments.parentId,
        isEdited: comments.isEdited,
        isDeleted: comments.isDeleted,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
      })
      .from(comments)
      .innerJoin(members, eq(comments.memberId, members.id))
      .where(
        and(
          eq(comments.commentableType, commentableType),
          eq(comments.commentableId, commentableId),
          eq(comments.isDeleted, false)
        )
      )
      .orderBy(comments.createdAt);

    const topLevel = result.filter((c) => !c.parentId);
    const replies = result.filter((c) => c.parentId);

    const enriched: CommentWithMember[] = await Promise.all(
      topLevel.map(async (comment) => {
        const likesCount = await this.getLikesCount("comment", comment.id);
        const isLiked = currentMemberId
          ? await this.hasLiked("comment", comment.id, currentMemberId)
          : false;

        const commentReplies = await Promise.all(
          replies
            .filter((r) => r.parentId === comment.id)
            .map(async (reply) => {
              const replyLikes = await this.getLikesCount("comment", reply.id);
              const replyIsLiked = currentMemberId
                ? await this.hasLiked("comment", reply.id, currentMemberId)
                : false;
              return { ...reply, likesCount: replyLikes, isLikedByCurrentUser: replyIsLiked, replies: [] };
            })
        );

        return {
          ...comment,
          likesCount,
          isLikedByCurrentUser: isLiked,
          replies: commentReplies,
        };
      })
    );

    return enriched;
  }

  async updateComment(id: string, content: string): Promise<Comment | undefined> {
    const [updated] = await db
      .update(comments)
      .set({ content, isEdited: true, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return updated;
  }

  async deleteComment(id: string): Promise<void> {
    await db.update(comments).set({ isDeleted: true }).where(eq(comments.id, id));
  }

  async createDiscussion(data: InsertDiscussion): Promise<Discussion> {
    const [discussion] = await db.insert(discussions).values(data).returning();
    return discussion;
  }

  async getDiscussionById(id: string): Promise<DiscussionWithDetails | undefined> {
    const [result] = await db
      .select({
        id: discussions.id,
        title: discussions.title,
        content: discussions.content,
        courseId: discussions.courseId,
        lessonId: discussions.lessonId,
        memberId: discussions.memberId,
        isPinned: discussions.isPinned,
        isLocked: discussions.isLocked,
        viewCount: discussions.viewCount,
        createdAt: discussions.createdAt,
        updatedAt: discussions.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
      })
      .from(discussions)
      .innerJoin(members, eq(discussions.memberId, members.id))
      .where(eq(discussions.id, id));

    if (!result) return undefined;

    const replies = await db
      .select()
      .from(discussionReplies)
      .where(eq(discussionReplies.discussionId, id));

    return {
      ...result,
      replyCount: replies.length,
    };
  }

  async getDiscussionsByCourse(courseId: string): Promise<DiscussionWithDetails[]> {
    const result = await db
      .select({
        id: discussions.id,
        title: discussions.title,
        content: discussions.content,
        courseId: discussions.courseId,
        lessonId: discussions.lessonId,
        memberId: discussions.memberId,
        isPinned: discussions.isPinned,
        isLocked: discussions.isLocked,
        viewCount: discussions.viewCount,
        createdAt: discussions.createdAt,
        updatedAt: discussions.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
      })
      .from(discussions)
      .innerJoin(members, eq(discussions.memberId, members.id))
      .where(eq(discussions.courseId, courseId))
      .orderBy(desc(discussions.isPinned), desc(discussions.createdAt));

    return Promise.all(
      result.map(async (d) => {
        const replies = await db
          .select()
          .from(discussionReplies)
          .where(eq(discussionReplies.discussionId, d.id));

        const [lastReply] = await db
          .select()
          .from(discussionReplies)
          .where(eq(discussionReplies.discussionId, d.id))
          .orderBy(desc(discussionReplies.createdAt))
          .limit(1);

        return {
          ...d,
          replyCount: replies.length,
          lastActivityAt: lastReply?.createdAt || d.createdAt,
        };
      })
    );
  }

  async incrementDiscussionViews(id: string): Promise<void> {
    const [disc] = await db.select().from(discussions).where(eq(discussions.id, id));
    if (disc) {
      const currentViews = parseInt(disc.viewCount || "0", 10);
      await db
        .update(discussions)
        .set({ viewCount: String(currentViews + 1) })
        .where(eq(discussions.id, id));
    }
  }

  async createDiscussionReply(data: InsertDiscussionReply): Promise<DiscussionReply> {
    const [reply] = await db.insert(discussionReplies).values(data).returning();
    await db.update(discussions).set({ updatedAt: new Date() }).where(eq(discussions.id, data.discussionId));
    return reply;
  }

  async getDiscussionReplies(discussionId: string, currentMemberId?: string): Promise<DiscussionReplyWithMember[]> {
    const result = await db
      .select({
        id: discussionReplies.id,
        discussionId: discussionReplies.discussionId,
        memberId: discussionReplies.memberId,
        content: discussionReplies.content,
        parentId: discussionReplies.parentId,
        isEdited: discussionReplies.isEdited,
        isDeleted: discussionReplies.isDeleted,
        createdAt: discussionReplies.createdAt,
        updatedAt: discussionReplies.updatedAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
      })
      .from(discussionReplies)
      .innerJoin(members, eq(discussionReplies.memberId, members.id))
      .where(and(eq(discussionReplies.discussionId, discussionId), eq(discussionReplies.isDeleted, false)))
      .orderBy(discussionReplies.createdAt);

    return Promise.all(
      result.map(async (reply) => {
        const likesCount = await this.getLikesCount("discussion_reply", reply.id);
        const isLiked = currentMemberId
          ? await this.hasLiked("discussion_reply", reply.id, currentMemberId)
          : false;
        return { ...reply, likesCount, isLikedByCurrentUser: isLiked };
      })
    );
  }

  async toggleLike(likeableType: string, likeableId: string, memberId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.likeableType, likeableType),
          eq(likes.likeableId, likeableId),
          eq(likes.memberId, memberId)
        )
      );

    if (existing.length > 0) {
      await db.delete(likes).where(eq(likes.id, existing[0].id));
      return false;
    } else {
      await db.insert(likes).values({ likeableType, likeableId, memberId });
      return true;
    }
  }

  async getLikesCount(likeableType: string, likeableId: string): Promise<number> {
    const result = await db
      .select()
      .from(likes)
      .where(and(eq(likes.likeableType, likeableType), eq(likes.likeableId, likeableId)));
    return result.length;
  }

  async hasLiked(likeableType: string, likeableId: string, memberId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.likeableType, likeableType),
          eq(likes.likeableId, likeableId),
          eq(likes.memberId, memberId)
        )
      );
    return result.length > 0;
  }

  async searchMembers(query: string, excludeMemberId?: string): Promise<Array<{ id: string; firstName: string | null; lastName: string | null; email: string }>> {
    const allMembers = await db.select().from(members);
    const searchLower = query.toLowerCase();

    return allMembers
      .filter((m) => {
        if (excludeMemberId && m.id === excludeMemberId) return false;
        const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
        return fullName.includes(searchLower) || m.email.toLowerCase().includes(searchLower);
      })
      .slice(0, 10)
      .map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
      }));
  }
}

export const interactionStorage = new InteractionStorage();
