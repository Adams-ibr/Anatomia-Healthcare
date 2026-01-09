import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare, Heart, Reply, MoreHorizontal, 
  Edit2, Trash2, Loader2, Send
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  commentableType: string;
  commentableId: string;
  memberId: string;
  content: string;
  parentId: string | null;
  isEdited: boolean;
  createdAt: string;
  memberFirstName: string | null;
  memberLastName: string | null;
  likesCount?: number;
  isLikedByCurrentUser?: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  commentableType: "article" | "course" | "lesson" | "discussion";
  commentableId: string;
  currentMemberId?: string;
  title?: string;
}

export function CommentSection({ 
  commentableType, 
  commentableId, 
  currentMemberId,
  title = "Comments" 
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/interactions/comments", commentableType, commentableId],
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      return apiRequest("POST", `/api/interactions/comments/${commentableType}/${commentableId}`, {
        content,
        parentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/interactions/comments", commentableType, commentableId] 
      });
      setNewComment("");
      setReplyingTo(null);
      setReplyContent("");
      toast({ title: "Comment posted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to post comment", variant: "destructive" });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      return apiRequest("PATCH", `/api/interactions/comments/${commentId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/interactions/comments", commentableType, commentableId] 
      });
      setEditingComment(null);
      setEditContent("");
      toast({ title: "Comment updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update comment", variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("DELETE", `/api/interactions/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/interactions/comments", commentableType, commentableId] 
      });
      toast({ title: "Comment deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("POST", `/api/interactions/likes/comment/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/interactions/comments", commentableType, commentableId] 
      });
    },
  });

  const getMemberName = (firstName: string | null, lastName: string | null) => {
    if (firstName || lastName) {
      return `${firstName || ""} ${lastName || ""}`.trim();
    }
    return "Anonymous User";
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const name = getMemberName(firstName, lastName);
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createCommentMutation.mutate({ content: newComment.trim() });
    }
  };

  const handleSubmitReply = (parentId: string) => {
    if (replyContent.trim()) {
      createCommentMutation.mutate({ content: replyContent.trim(), parentId });
    }
  };

  const handleUpdateComment = (commentId: string) => {
    if (editContent.trim()) {
      updateCommentMutation.mutate({ commentId, content: editContent.trim() });
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwn = comment.memberId === currentMemberId;
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;

    return (
      <div key={comment.id} className={`${isReply ? "ml-8" : ""}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {getInitials(comment.memberFirstName, comment.memberLastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {getMemberName(comment.memberFirstName, comment.memberLastName)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px]"
                  data-testid={`textarea-edit-comment-${comment.id}`}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateComment(comment.id)}
                    disabled={updateCommentMutation.isPending}
                    data-testid={`button-save-edit-${comment.id}`}
                  >
                    {updateCommentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent("");
                    }}
                    data-testid={`button-cancel-edit-${comment.id}`}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm mt-1 break-words">{comment.content}</p>
            )}

            <div className="flex items-center gap-3 mt-2">
              {currentMemberId && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => likeMutation.mutate(comment.id)}
                    data-testid={`button-like-${comment.id}`}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 mr-1 ${
                        comment.isLikedByCurrentUser ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    <span className="text-xs">{comment.likesCount || 0}</span>
                  </Button>

                  {!isReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setReplyingTo(isReplying ? null : comment.id);
                        setReplyContent("");
                      }}
                      data-testid={`button-reply-${comment.id}`}
                    >
                      <Reply className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs">Reply</span>
                    </Button>
                  )}

                  {isOwn && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          data-testid={`button-comment-menu-${comment.id}`}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditContent(comment.content);
                          }}
                          data-testid={`button-edit-${comment.id}`}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          data-testid={`button-delete-${comment.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
            </div>

            {isReplying && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px]"
                  data-testid={`textarea-reply-${comment.id}`}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={createCommentMutation.isPending}
                    data-testid={`button-submit-reply-${comment.id}`}
                  >
                    {createCommentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        Reply
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                    data-testid={`button-cancel-reply-${comment.id}`}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="text-sm text-muted-foreground">({comments.length})</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentMemberId ? (
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
              data-testid="textarea-new-comment"
            />
            <Button
              type="submit"
              disabled={!newComment.trim() || createCommentMutation.isPending}
              data-testid="button-submit-comment"
            >
              {createCommentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post Comment
            </Button>
          </form>
        ) : (
          <div className="text-center py-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Please log in to post comments
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
