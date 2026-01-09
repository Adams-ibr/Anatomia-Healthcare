import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquarePlus, ChevronLeft, Pin, Lock, Eye, 
  MessageCircle, Heart, Loader2, Send, Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Discussion {
  id: string;
  title: string;
  content: string;
  courseId: string | null;
  lessonId: string | null;
  memberId: string;
  isPinned: boolean | null;
  isLocked: boolean | null;
  viewCount: string | null;
  createdAt: string;
  memberFirstName: string | null;
  memberLastName: string | null;
  replyCount?: number;
  lastActivityAt?: string;
}

interface DiscussionReply {
  id: string;
  discussionId: string;
  memberId: string;
  content: string;
  parentId: string | null;
  isEdited: boolean;
  createdAt: string;
  memberFirstName: string | null;
  memberLastName: string | null;
  likesCount?: number;
  isLikedByCurrentUser?: boolean;
}

interface DiscussionBoardProps {
  courseId: string;
  currentMemberId?: string;
}

export function DiscussionBoard({ courseId, currentMemberId }: DiscussionBoardProps) {
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [newDiscussionOpen, setNewDiscussionOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: discussions = [], isLoading: loadingDiscussions } = useQuery<Discussion[]>({
    queryKey: ["/api/interactions/discussions", { courseId }],
  });

  const { data: replies = [], isLoading: loadingReplies } = useQuery<DiscussionReply[]>({
    queryKey: ["/api/interactions/discussions", selectedDiscussion?.id, "replies"],
    enabled: !!selectedDiscussion,
  });

  const createDiscussionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/interactions/discussions", {
        title: newTitle,
        content: newContent,
        courseId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interactions/discussions", { courseId }] });
      setNewDiscussionOpen(false);
      setNewTitle("");
      setNewContent("");
      toast({ title: "Discussion created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create discussion", variant: "destructive" });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/interactions/discussions/${selectedDiscussion?.id}/replies`, {
        content: replyContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/interactions/discussions", selectedDiscussion?.id, "replies"] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interactions/discussions", { courseId }] });
      setReplyContent("");
      toast({ title: "Reply posted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to post reply", variant: "destructive" });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (replyId: string) => {
      return apiRequest("POST", `/api/interactions/likes/discussion_reply/${replyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/interactions/discussions", selectedDiscussion?.id, "replies"] 
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

  const handleCreateDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newContent.trim()) {
      createDiscussionMutation.mutate();
    }
  };

  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim() && selectedDiscussion && !selectedDiscussion.isLocked) {
      createReplyMutation.mutate();
    }
  };

  if (selectedDiscussion) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDiscussion(null)}
              data-testid="button-back-to-discussions"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{selectedDiscussion.title}</CardTitle>
                {selectedDiscussion.isPinned && (
                  <Badge variant="secondary">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
                {selectedDiscussion.isLocked && (
                  <Badge variant="outline">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>
                  By {getMemberName(selectedDiscussion.memberFirstName, selectedDiscussion.memberLastName)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(selectedDiscussion.createdAt), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {selectedDiscussion.viewCount || 0} views
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{selectedDiscussion.content}</p>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Replies ({replies.length})
            </h4>

            {loadingReplies ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : replies.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                No replies yet. Be the first to respond!
              </p>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <div key={reply.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(reply.memberFirstName, reply.memberLastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {getMemberName(reply.memberFirstName, reply.memberLastName)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                        </span>
                        {reply.isEdited && (
                          <span className="text-xs text-muted-foreground">(edited)</span>
                        )}
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
                      {currentMemberId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 mt-2"
                          onClick={() => likeMutation.mutate(reply.id)}
                          data-testid={`button-like-reply-${reply.id}`}
                        >
                          <Heart
                            className={`h-3.5 w-3.5 mr-1 ${
                              reply.isLikedByCurrentUser ? "fill-red-500 text-red-500" : ""
                            }`}
                          />
                          <span className="text-xs">{reply.likesCount || 0}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentMemberId && !selectedDiscussion.isLocked && (
              <form onSubmit={handlePostReply} className="mt-6 space-y-3">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="textarea-reply"
                />
                <Button
                  type="submit"
                  disabled={!replyContent.trim() || createReplyMutation.isPending}
                  data-testid="button-submit-reply"
                >
                  {createReplyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Post Reply
                </Button>
              </form>
            )}

            {selectedDiscussion.isLocked && (
              <div className="mt-6 p-4 bg-muted rounded-lg text-center">
                <Lock className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  This discussion has been locked and no new replies can be added.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Course Discussions
        </CardTitle>
        {currentMemberId && (
          <Dialog open={newDiscussionOpen} onOpenChange={setNewDiscussionOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-new-discussion">
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a New Discussion</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDiscussion} className="space-y-4">
                <div>
                  <Input
                    placeholder="Discussion title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    data-testid="input-discussion-title"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="What would you like to discuss?"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="min-h-[120px]"
                    data-testid="textarea-discussion-content"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNewDiscussionOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!newTitle.trim() || !newContent.trim() || createDiscussionMutation.isPending}
                    data-testid="button-create-discussion"
                  >
                    {createDiscussionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Create Discussion
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {loadingDiscussions ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No discussions yet for this course.
            </p>
            {currentMemberId && (
              <Button size="sm" onClick={() => setNewDiscussionOpen(true)}>
                Start the first discussion
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {discussions.map((discussion) => (
              <button
                key={discussion.id}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover-elevate text-left"
                onClick={() => setSelectedDiscussion(discussion)}
                data-testid={`button-discussion-${discussion.id}`}
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(discussion.memberFirstName, discussion.memberLastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{discussion.title}</span>
                    {discussion.isPinned && (
                      <Pin className="h-3 w-3 text-primary flex-shrink-0" />
                    )}
                    {discussion.isLocked && (
                      <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {discussion.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>
                      {getMemberName(discussion.memberFirstName, discussion.memberLastName)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {discussion.replyCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {discussion.viewCount || 0}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(discussion.lastActivityAt || discussion.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
