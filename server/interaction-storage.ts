import { supabase } from "./db";
import {
  Conversation,
  InsertConversation,
  ConversationParticipant,
  InsertConversationParticipant,
  Message,
  InsertMessage,
  Comment,
  InsertComment,
  Discussion,
  InsertDiscussion,
  DiscussionReply,
  InsertDiscussionReply,
} from "../shared/schema";

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
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert(data)
      .select("id, type, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) throw error;
    return conversation;
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, type, createdAt:created_at, updatedAt:updated_at")
      .eq("id", id)
      .single();

    if (error) return undefined;
    return data;
  }

  async isMemberInConversation(conversationId: string, memberId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("member_id", memberId)
      .single();

    return !!data;
  }

  async addParticipant(data: InsertConversationParticipant): Promise<ConversationParticipant> {
    const { data: participant, error } = await supabase
      .from("conversation_participants")
      .insert({
        conversation_id: data.conversationId,
        member_id: data.memberId,
        last_read_at: data.lastReadAt,
        joined_at: data.joinedAt
      })
      .select("id, conversationId:conversation_id, memberId:member_id, lastReadAt:last_read_at, joinedAt:joined_at")
      .single();

    if (error) throw error;
    return participant;
  }

  async getConversationsByMemberId(memberId: string): Promise<ConversationWithDetails[]> {
    // 1. Get all conversations for member
    const { data: participantRows, error } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("member_id", memberId);

    if (error || !participantRows || participantRows.length === 0) return [];

    const result: ConversationWithDetails[] = [];

    for (const p of participantRows) {
      const convId = p.conversation_id;

      // Get conversation details
      const { data: conv } = await supabase
        .from("conversations")
        .select("id, type, createdAt:created_at, updatedAt:updated_at")
        .eq("id", convId)
        .single();

      if (!conv) continue;

      // Get all participants
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select(`
          id, memberId:member_id
        `)
        .eq("conversation_id", convId);

      // Manual Join: Fetch Member Details
      const participantMemberIds = (participants || []).map((p: any) => p.memberId);
      let membersMap = new Map();

      if (participantMemberIds.length > 0) {
        const { data: members } = await supabase
          .from("members")
          .select("id, first_name, last_name")
          .in("id", participantMemberIds);

        if (members) {
          members.forEach((m: any) => membersMap.set(m.id, m));
        }
      }

      const formattedParticipants = (participants || []).map((p: any) => ({
        id: p.id,
        memberId: p.memberId,
        firstName: membersMap.get(p.memberId)?.first_name || null,
        lastName: membersMap.get(p.memberId)?.last_name || null
      }));

      // Get last message
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("id, conversationId:conversation_id, senderId:sender_id, content, isEdited:is_edited, isDeleted:is_deleted, createdAt:created_at, updatedAt:updated_at")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Count unread messages
      let unreadCount = 0;
      if (p.last_read_at) {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", convId)
          .gt("created_at", p.last_read_at);

        unreadCount = count || 0;
      }

      result.push({
        ...conv,
        participants: formattedParticipants,
        lastMessage: lastMessage || undefined,
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
    // 1. Get all conversations for member1
    const { data: member1Convs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("member_id", member1Id);

    if (member1Convs) {
      for (const p1 of member1Convs) {
        // Check if this convo is 'direct'
        const { data: conv } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", p1.conversation_id)
          .eq("type", "direct")
          .single();

        if (conv) {
          // Check if member2 is also a participant
          const { data: participants } = await supabase
            .from("conversation_participants")
            .select("member_id")
            .eq("conversation_id", conv.id);

          if (participants && participants.length === 2 && participants.some((p: any) => p.member_id === member2Id)) {
            // Found existing direct conversation
            return {
              id: conv.id,
              type: conv.type,
              createdAt: conv.created_at,
              updatedAt: conv.updated_at
            };
          }
        }
      }
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({ type: "direct" })
      .select("id, type, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) throw error;

    // Add participants
    await supabase.from("conversation_participants").insert([
      { conversation_id: newConv.id, member_id: member1Id },
      { conversation_id: newConv.id, member_id: member2Id },
    ]);

    return newConv;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversationId,
        sender_id: data.senderId,
        content: data.content,
        is_edited: false,
        is_deleted: false
      })
      .select("id, conversationId:conversation_id, senderId:sender_id, content, isEdited:is_edited, isDeleted:is_deleted, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) throw error;

    // Update conversation updatedAt
    await supabase
      .from("conversations")
      .update({ updated_at: new Date() })
      .eq("id", data.conversationId);

    return message;
  }

  async getMessagesByConversationId(conversationId: string, limit = 50, offset = 0): Promise<MessageWithSender[]> {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        id, conversationId:conversation_id, senderId:sender_id, content,
        isEdited:is_edited, isDeleted:is_deleted, createdAt:created_at, updatedAt:updated_at
      `)
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Manual Join: Fetch Senders
    const senderIds = [...new Set(data.map((m: any) => m.senderId))];
    let sendersMap = new Map();

    if (senderIds.length > 0) {
      const { data: senders } = await supabase
        .from("members")
        .select("id, first_name, last_name")
        .in("id", senderIds);

      if (senders) {
        senders.forEach((s: any) => sendersMap.set(s.id, s));
      }
    }

    const messages = data.map((m: any) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      isEdited: m.isEdited,
      isDeleted: m.isDeleted,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      senderFirstName: sendersMap.get(m.senderId)?.first_name || null,
      senderLastName: sendersMap.get(m.senderId)?.last_name || null
    }));

    return messages.reverse();
  }

  async markConversationAsRead(conversationId: string, memberId: string): Promise<void> {
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date() })
      .eq("conversation_id", conversationId)
      .eq("member_id", memberId);
  }

  async createComment(data: InsertComment): Promise<Comment> {
    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        commentable_type: data.commentableType,
        commentable_id: data.commentableId,
        member_id: data.memberId,
        content: data.content,
        parent_id: data.parentId,
        is_edited: false,
        is_deleted: false
      })
      .select("id, commentableType:commentable_type, commentableId:commentable_id, memberId:member_id, content, parentId:parent_id, isEdited:is_edited, isDeleted:is_deleted, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) throw error;
    return comment;
  }

  async getCommentsByTarget(
    commentableType: string,
    commentableId: string,
    currentMemberId?: string
  ): Promise<CommentWithMember[]> {
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select(`
        id, commentableType:commentable_type, commentableId:commentable_id, 
        memberId:member_id, content, parentId:parent_id, 
        isEdited:is_edited, isDeleted:is_deleted, 
        createdAt:created_at, updatedAt:updated_at
      `)
      .eq("commentable_type", commentableType)
      .eq("commentable_id", commentableId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Manual Join for Members
    const memberIds = [...new Set((commentsData || []).map((c: any) => c.memberId))];
    let membersMap = new Map();
    if (memberIds.length > 0) {
      const { data: members } = await supabase
        .from("members")
        .select("id, first_name, last_name")
        .in("id", memberIds);
      if (members) {
        members.forEach((m: any) => membersMap.set(m.id, m));
      }
    }

    const result = (commentsData || []).map((c: any) => ({
      id: c.id,
      commentableType: c.commentableType,
      commentableId: c.commentableId,
      memberId: c.memberId,
      content: c.content,
      parentId: c.parentId,
      isEdited: c.isEdited,
      isDeleted: c.isDeleted,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      memberFirstName: membersMap.get(c.memberId)?.first_name || null,
      memberLastName: membersMap.get(c.memberId)?.last_name || null
    }));

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
    const { data, error } = await supabase
      .from("comments")
      .update({ content, is_edited: true, updated_at: new Date() })
      .eq("id", id)
      .select("id, commentableType:commentable_type, commentableId:commentable_id, memberId:member_id, content, parentId:parent_id, isEdited:is_edited, isDeleted:is_deleted, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteComment(id: string): Promise<void> {
    await supabase.from("comments").update({ is_deleted: true }).eq("id", id);
  }

  async createDiscussion(data: InsertDiscussion): Promise<Discussion> {
    const { data: discussion, error } = await supabase
      .from("discussions")
      .insert({
        title: data.title,
        content: data.content,
        course_id: data.courseId,
        lesson_id: data.lessonId,
        member_id: data.memberId,
        is_pinned: data.isPinned || false,
        is_locked: data.isLocked || false,
        view_count: "0"
      })
      .select("id, title, content, courseId:course_id, lessonId:lesson_id, memberId:member_id, isPinned:is_pinned, isLocked:is_locked, viewCount:view_count, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) throw error;
    return discussion;
  }

  async getDiscussionById(id: string): Promise<DiscussionWithDetails | undefined> {
    // 1. Get discussion
    const { data, error } = await supabase
      .from("discussions")
      .select(`
        id, title, content, courseId:course_id, lessonId:lesson_id, 
        memberId:member_id, isPinned:is_pinned, isLocked:is_locked, 
        viewCount:view_count, createdAt:created_at, updatedAt:updated_at
      `)
      .eq("id", id)
      .single();

    if (error || !data) return undefined;

    // Manual Join for Member
    let memberFirstName = null;
    let memberLastName = null;
    if (data.memberId) {
      const { data: member } = await supabase
        .from("members")
        .select("first_name, last_name")
        .eq("id", data.memberId)
        .single();
      if (member) {
        memberFirstName = member.first_name;
        memberLastName = member.last_name;
      }
    }

    if (error || !data) return undefined;

    // 2. Get reply count
    const { count } = await supabase
      .from("discussion_replies")
      .select("*", { count: "exact", head: true })
      .eq("discussion_id", id);

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      courseId: data.courseId,
      lessonId: data.lessonId,
      memberId: data.memberId,
      isPinned: data.isPinned,
      isLocked: data.isLocked,
      viewCount: data.viewCount,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      memberFirstName: memberFirstName,
      memberLastName: memberLastName,
      replyCount: count || 0,
    };
  }

  async getDiscussionsByCourse(courseId: string): Promise<DiscussionWithDetails[]> {
    const { data, error } = await supabase
      .from("discussions")
      .select(`
        id, title, content, courseId:course_id, lessonId:lesson_id, 
        memberId:member_id, isPinned:is_pinned, isLocked:is_locked, 
        viewCount:view_count, createdAt:created_at, updatedAt:updated_at
      `)
      .eq("course_id", courseId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Manual Join Logic for Discussions List
    // We need members for each discussion
    const memberIds = [...new Set((data || []).map((d: any) => d.memberId))];
    let membersMap = new Map();
    if (memberIds.length > 0) {
      const { data: members } = await supabase
        .from("members")
        .select("id, first_name, last_name")
        .in("id", memberIds);
      if (members) members.forEach((m: any) => membersMap.set(m.id, m));
    }

    return Promise.all(
      (data || []).map(async (d: any) => {
        // Get reply count and last activity
        const { count } = await supabase
          .from("discussion_replies")
          .select("*", { count: "exact", head: true })
          .eq("discussion_id", d.id);

        const { data: lastReply } = await supabase
          .from("discussion_replies")
          .select("created_at")
          .eq("discussion_id", d.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          id: d.id,
          title: d.title,
          content: d.content,
          courseId: d.courseId,
          lessonId: d.lessonId,
          memberId: d.memberId,
          isPinned: d.isPinned,
          isLocked: d.isLocked,
          viewCount: d.viewCount,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          memberFirstName: membersMap.get(d.memberId)?.first_name || null,
          memberLastName: membersMap.get(d.memberId)?.last_name || null,
          replyCount: count || 0,
          lastActivityAt: lastReply?.created_at || d.createdAt,
        };
      })
    );
  }

  async incrementDiscussionViews(id: string): Promise<void> {
    const { data } = await supabase
      .from("discussions")
      .select("view_count")
      .eq("id", id)
      .single();

    if (data) {
      const currentViews = parseInt(data.view_count || "0", 10);
      await supabase
        .from("discussions")
        .update({ view_count: String(currentViews + 1) })
        .eq("id", id);
    }
  }

  async createDiscussionReply(data: InsertDiscussionReply): Promise<DiscussionReply> {
    const { data: reply, error } = await supabase
      .from("discussion_replies")
      .insert({
        discussion_id: data.discussionId,
        member_id: data.memberId,
        content: data.content,
        parent_id: data.parentId,
        is_edited: false,
        is_deleted: false
      })
      .select("id, discussionId:discussion_id, memberId:member_id, content, parentId:parent_id, isEdited:is_edited, isDeleted:is_deleted, createdAt:created_at, updatedAt:updated_at")
      .single();

    if (error) throw error;

    // Update discussion updatedAt
    await supabase
      .from("discussions")
      .update({ updated_at: new Date() })
      .eq("id", data.discussionId);

    return reply;
  }

  async getDiscussionReplies(discussionId: string, currentMemberId?: string): Promise<DiscussionReplyWithMember[]> {
    const { data: replies, error } = await supabase
      .from("discussion_replies")
      .select(`
        id, discussionId:discussion_id, memberId:member_id, 
        content, parentId:parent_id, isEdited:is_edited, 
        isDeleted:is_deleted, createdAt:created_at, updatedAt:updated_at
      `)
      .eq("discussion_id", discussionId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Manual Join for Members
    const memberIds = [...new Set((replies || []).map((r: any) => r.memberId))];
    let membersMap = new Map();
    if (memberIds.length > 0) {
      const { data: members } = await supabase.from("members").select("id, first_name, last_name").in("id", memberIds);
      if (members) members.forEach((m: any) => membersMap.set(m.id, m));
    }

    return Promise.all(
      (replies || []).map(async (reply: any) => {
        const likesCount = await this.getLikesCount("discussion_reply", reply.id);
        const isLiked = currentMemberId
          ? await this.hasLiked("discussion_reply", reply.id, currentMemberId)
          : false;

        return {
          id: reply.id,
          discussionId: reply.discussionId,
          memberId: reply.memberId,
          content: reply.content,
          parentId: reply.parentId,
          isEdited: reply.isEdited,
          isDeleted: reply.isDeleted,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
          memberFirstName: membersMap.get(reply.memberId)?.first_name || null,
          memberLastName: membersMap.get(reply.memberId)?.last_name || null,
          likesCount,
          isLikedByCurrentUser: isLiked
        };
      })
    );
  }

  async toggleLike(likeableType: string, likeableId: string, memberId: string): Promise<boolean> {
    // Check if exists
    const { data: existing } = await supabase
      .from("likes")
      .select("id")
      .eq("likeable_type", likeableType)
      .eq("likeable_id", likeableId)
      .eq("member_id", memberId)
      .single();

    if (existing) {
      await supabase.from("likes").delete().eq("id", existing.id);
      return false;
    } else {
      await supabase
        .from("likes")
        .insert({
          likeable_type: likeableType,
          likeable_id: likeableId,
          member_id: memberId
        });
      return true;
    }
  }

  async getLikesCount(likeableType: string, likeableId: string): Promise<number> {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("likeable_type", likeableType)
      .eq("likeable_id", likeableId);
    return count || 0;
  }

  async hasLiked(likeableType: string, likeableId: string, memberId: string): Promise<boolean> {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("likeable_type", likeableType)
      .eq("likeable_id", likeableId)
      .eq("member_id", memberId);
    return (count || 0) > 0;
  }

  async searchMembers(query: string, excludeMemberId?: string): Promise<Array<{ id: string; firstName: string | null; lastName: string | null; email: string }>> {
    let sqlQuery = supabase
      .from("members")
      .select("id, first_name, last_name, email");

    // Use ilike for case insensitive search on email and names
    // Note: Supabase/PostgREST uses simpler operator chaining.
    // 'or' filter: "column.op.val,column2.op.val"
    const searchPattern = query;
    // We cannot use params inside the string easily like that with Supabase JS client 'or()' method directly if it expects properly formatted string.
    // .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)

    sqlQuery = sqlQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);

    if (excludeMemberId) {
      sqlQuery = sqlQuery.neq("id", excludeMemberId);
    }

    const { data, error } = await sqlQuery.limit(10);

    if (error) throw error;

    return (data || []).map((m: any) => ({
      id: m.id,
      firstName: m.first_name,
      lastName: m.last_name,
      email: m.email,
    }));
  }
}

export const interactionStorage = new InteractionStorage();
