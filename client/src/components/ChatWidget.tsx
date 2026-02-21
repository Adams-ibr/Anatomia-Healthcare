import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageCircle, X, Send, Search, ChevronLeft,
  Users, Loader2, Wifi, WifiOff
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Participant {
  id: string;
  memberId: string;
  firstName: string | null;
  lastName: string | null;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  senderFirstName: string | null;
  senderLastName: string | null;
}

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount?: number;
}

interface MemberSearchResult {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface ChatWidgetProps {
  currentMemberId: string;
}

export function ChatWidget({ currentMemberId }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const queryClient = useQueryClient();

  const connectSupabaseRealtime = useCallback(() => {
    // Prevent duplicate subscriptions
    if (channelRef.current) return;

    const channel = supabase.channel('chat-room');

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Invalidate messages if it matches the current active conversation
          if (activeConversation && payload.new.conversation_id === activeConversation.id) {
            queryClient.invalidateQueries({
              queryKey: ["/api/interactions/conversations", activeConversation.id, "messages"]
            });
          }
          // Always invalidate conversation list to update unseen counts/last message
          queryClient.invalidateQueries({
            queryKey: ["/api/interactions/conversations"]
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setWsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setWsConnected(false);
          // Optional: handle reconnection logic here if needed
        }
      });

    channelRef.current = channel;
  }, [activeConversation, queryClient]);

  useEffect(() => {
    if (isOpen) {
      connectSupabaseRealtime();
    }
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isOpen, connectSupabaseRealtime]);

  // Handle active conversation changes (Realtime doesn't technically "join" tables exactly, but we rebind the ref context above)
  useEffect(() => {
    // Optional: we can emit a presence "join" event if we implement presence later
  }, [activeConversation]);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/interactions/conversations"],
    enabled: isOpen,
    refetchInterval: 10000,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/interactions/conversations", activeConversation?.id, "messages"],
    enabled: !!activeConversation,
    refetchInterval: 5000,
  });

  const { data: searchResults = [], isLoading: loadingSearch } = useQuery<MemberSearchResult[]>({
    queryKey: ["/api/interactions/members/search", { q: searchQuery }],
    enabled: showNewChat && searchQuery.length >= 2,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/interactions/conversations/${activeConversation?.id}/messages`, {
        content,
      });
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/interactions/conversations", activeConversation?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interactions/conversations"] });
    },
  });

  const startConversationMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const res = await apiRequest("POST", "/api/interactions/conversations", { recipientId });
      return res.json();
    },
    onSuccess: (conversation: Conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/interactions/conversations"] });
      setActiveConversation(conversation);
      setShowNewChat(false);
      setSearchQuery("");
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const getParticipantName = (participant: Participant) => {
    if (participant.firstName || participant.lastName) {
      return `${participant.firstName || ""} ${participant.lastName || ""}`.trim();
    }
    return "Unknown User";
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    const otherParticipants = conversation.participants.filter(
      (p) => p.memberId !== currentMemberId
    );
    return otherParticipants.map(getParticipantName).join(", ") || "Unknown";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && activeConversation) {
      sendMessageMutation.mutate(messageInput.trim());
    }
  };

  const handleStartChat = (member: MemberSearchResult) => {
    startConversationMutation.mutate(member.id);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-[10000] !fixed"
        data-testid="button-open-chat"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center"
          >
            {totalUnread > 9 ? "9+" : totalUnread}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] shadow-2xl z-[10000] flex flex-col overflow-hidden !fixed">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          {(activeConversation || showNewChat) && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setActiveConversation(null);
                setShowNewChat(false);
              }}
              data-testid="button-back-to-conversations"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle className="text-base flex items-center gap-2">
            {showNewChat
              ? "New Message"
              : activeConversation
                ? getConversationName(activeConversation)
                : "Messages"}
            {activeConversation && (
              wsConnected ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-muted-foreground" />
              )
            )}
          </CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {!activeConversation && !showNewChat && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowNewChat(true)}
              data-testid="button-new-chat"
            >
              <Users className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsOpen(false);
              setActiveConversation(null);
              setShowNewChat(false);
            }}
            data-testid="button-close-chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
        {showNewChat ? (
          <div className="flex flex-col h-full">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-members"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loadingSearch ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="p-2 space-y-1">
                  {searchResults.map((member) => (
                    <button
                      key={member.id}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate"
                      onClick={() => handleStartChat(member)}
                      data-testid={`button-start-chat-${member.id}`}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {getInitials(`${member.firstName || ""} ${member.lastName || member.email}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {member.firstName || member.lastName
                            ? `${member.firstName || ""} ${member.lastName || ""}`.trim()
                            : member.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <p className="text-center text-sm text-muted-foreground p-4">No members found</p>
              ) : (
                <p className="text-center text-sm text-muted-foreground p-4">
                  Type at least 2 characters to search
                </p>
              )}
            </ScrollArea>
          </div>
        ) : activeConversation ? (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-3">
              {loadingMessages ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground p-4">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isOwn = message.senderId === currentMemberId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                            }`}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium mb-1">
                              {message.senderFirstName || message.senderLastName
                                ? `${message.senderFirstName || ""} ${message.senderLastName || ""}`.trim()
                                : "Unknown"}
                            </p>
                          )}
                          <p className="text-sm break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1"
                data-testid="input-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-6">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No conversations yet</p>
                <Button size="sm" onClick={() => setShowNewChat(true)} data-testid="button-start-first-chat">
                  Start a conversation
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className="w-full flex items-center gap-3 p-3 hover-elevate text-left"
                    onClick={() => setActiveConversation(conversation)}
                    data-testid={`button-conversation-${conversation.id}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(getConversationName(conversation))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {getConversationName(conversation)}
                        </p>
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.lastMessage.senderId === currentMemberId && (
                            <span className="mr-1">You:</span>
                          )}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {(conversation.unreadCount || 0) > 0 && (
                      <Badge variant="default" className="h-5 min-w-[20px] rounded-full p-0 flex items-center justify-center">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
