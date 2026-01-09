import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversationTypes = ["direct", "group"] as const;
export type ConversationType = typeof conversationTypes[number];

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull().default("direct"),
  name: varchar("name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    conversationId: varchar("conversation_id").notNull(),
    memberId: varchar("member_id").notNull(),
    joinedAt: timestamp("joined_at").defaultNow(),
    lastReadAt: timestamp("last_read_at"),
  },
  (table) => [
    index("idx_conversation_participants_conversation").on(table.conversationId),
    index("idx_conversation_participants_member").on(table.memberId),
  ]
);

export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({
  id: true,
  joinedAt: true,
});

export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;

export const messages = pgTable(
  "messages",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    conversationId: varchar("conversation_id").notNull(),
    senderId: varchar("sender_id").notNull(),
    content: text("content").notNull(),
    isEdited: boolean("is_edited").default(false),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_messages_conversation").on(table.conversationId),
    index("idx_messages_sender").on(table.senderId),
    index("idx_messages_created").on(table.createdAt),
  ]
);

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isEdited: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const commentableTypes = ["article", "course", "lesson", "discussion"] as const;
export type CommentableType = typeof commentableTypes[number];

export const comments = pgTable(
  "comments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    commentableType: varchar("commentable_type").notNull(),
    commentableId: varchar("commentable_id").notNull(),
    memberId: varchar("member_id").notNull(),
    content: text("content").notNull(),
    parentId: varchar("parent_id"),
    isEdited: boolean("is_edited").default(false),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_comments_commentable").on(table.commentableType, table.commentableId),
    index("idx_comments_member").on(table.memberId),
    index("idx_comments_parent").on(table.parentId),
  ]
);

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  isEdited: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export const discussions = pgTable(
  "discussions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title").notNull(),
    content: text("content").notNull(),
    courseId: varchar("course_id"),
    lessonId: varchar("lesson_id"),
    memberId: varchar("member_id").notNull(),
    isPinned: boolean("is_pinned").default(false),
    isLocked: boolean("is_locked").default(false),
    viewCount: varchar("view_count").default("0"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_discussions_course").on(table.courseId),
    index("idx_discussions_lesson").on(table.lessonId),
    index("idx_discussions_member").on(table.memberId),
  ]
);

export const insertDiscussionSchema = createInsertSchema(discussions).omit({
  id: true,
  isPinned: true,
  isLocked: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
export type Discussion = typeof discussions.$inferSelect;

export const discussionReplies = pgTable(
  "discussion_replies",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    discussionId: varchar("discussion_id").notNull(),
    memberId: varchar("member_id").notNull(),
    content: text("content").notNull(),
    parentId: varchar("parent_id"),
    isEdited: boolean("is_edited").default(false),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_discussion_replies_discussion").on(table.discussionId),
    index("idx_discussion_replies_member").on(table.memberId),
    index("idx_discussion_replies_parent").on(table.parentId),
  ]
);

export const insertDiscussionReplySchema = createInsertSchema(discussionReplies).omit({
  id: true,
  isEdited: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDiscussionReply = z.infer<typeof insertDiscussionReplySchema>;
export type DiscussionReply = typeof discussionReplies.$inferSelect;

export const likes = pgTable(
  "likes",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    likeableType: varchar("likeable_type").notNull(),
    likeableId: varchar("likeable_id").notNull(),
    memberId: varchar("member_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_likes_likeable").on(table.likeableType, table.likeableId),
    index("idx_likes_member").on(table.memberId),
  ]
);

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;
