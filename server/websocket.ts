import { WebSocketServer, WebSocket } from "ws";
import { Server, IncomingMessage } from "http";
import { parse as parseCookie } from "cookie";
import { sessionStore, getSessionAsync } from "./session";
import { interactionStorage } from "./interaction-storage";

interface ConnectedClient {
  ws: WebSocket;
  memberId: string;
  conversationIds: Set<string>;
}

interface ChatMessage {
  type: "message" | "typing" | "read" | "join" | "leave";
  conversationId: string;
  senderId?: string;
  content?: string;
  messageId?: string;
  timestamp?: string;
}

class ChatWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: "/ws/chat" 
    });

    this.wss.on("connection", async (ws, req) => {
      const authenticatedMember = await this.authenticateWebSocket(req);
      
      if (!authenticatedMember) {
        ws.close(4001, "Authentication required");
        return;
      }

      const memberId = authenticatedMember.id;
      const clientId = `${memberId}-${Date.now()}`;
      const client: ConnectedClient = {
        ws,
        memberId,
        conversationIds: new Set(),
      };

      this.clients.set(clientId, client);
      console.log(`WebSocket client connected: ${memberId}`);

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString()) as ChatMessage;
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        this.clients.delete(clientId);
        console.log(`WebSocket client disconnected: ${memberId}`);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket error for ${memberId}:`, error);
        this.clients.delete(clientId);
      });
    });

    console.log("WebSocket server initialized on /ws/chat");
  }

  private async handleMessage(clientId: string, message: ChatMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case "join":
        if (message.conversationId) {
          const isParticipant = await interactionStorage.isMemberInConversation(
            message.conversationId,
            client.memberId
          );
          if (isParticipant) {
            client.conversationIds.add(message.conversationId);
          }
        }
        break;

      case "leave":
        if (message.conversationId) {
          client.conversationIds.delete(message.conversationId);
        }
        break;

      case "typing":
        if (client.conversationIds.has(message.conversationId)) {
          this.broadcastToConversation(message.conversationId, {
            type: "typing",
            conversationId: message.conversationId,
            senderId: client.memberId,
          }, client.memberId);
        }
        break;

      case "message":
        break;

      case "read":
        if (client.conversationIds.has(message.conversationId)) {
          this.broadcastToConversation(message.conversationId, {
            type: "read",
            conversationId: message.conversationId,
            senderId: client.memberId,
          }, client.memberId);
        }
        break;
    }
  }

  broadcastToConversation(conversationId: string, message: ChatMessage, excludeMemberId?: string) {
    const messageStr = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (
        client.conversationIds.has(conversationId) &&
        client.memberId !== excludeMemberId &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(messageStr);
      }
    });
  }

  notifyNewMessage(conversationId: string, message: {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    senderFirstName?: string | null;
    senderLastName?: string | null;
  }) {
    const chatMessage: ChatMessage & { senderFirstName?: string | null; senderLastName?: string | null; id?: string } = {
      type: "message",
      conversationId,
      senderId: message.senderId,
      content: message.content,
      messageId: message.id,
      timestamp: message.createdAt,
      senderFirstName: message.senderFirstName,
      senderLastName: message.senderLastName,
    };

    const messageStr = JSON.stringify(chatMessage);

    this.clients.forEach((client) => {
      if (
        client.ws.readyState === WebSocket.OPEN &&
        client.conversationIds.has(conversationId) &&
        client.memberId !== message.senderId
      ) {
        client.ws.send(messageStr);
      }
    });
  }

  getConnectedMemberIds(): string[] {
    const memberIds = new Set<string>();
    this.clients.forEach((client) => {
      memberIds.add(client.memberId);
    });
    return Array.from(memberIds);
  }

  private async authenticateWebSocket(req: IncomingMessage): Promise<{ id: string } | null> {
    try {
      const cookies = req.headers.cookie;
      if (!cookies) return null;

      const parsedCookies = parseCookie(cookies);
      const sessionId = parsedCookies["connect.sid"];
      
      if (!sessionId) return null;

      const sid = sessionId.startsWith("s:") 
        ? sessionId.slice(2).split(".")[0] 
        : sessionId.split(".")[0];

      const session = await getSessionAsync(sid);
      if (!session || !session.memberId) return null;

      return { id: session.memberId };
    } catch (error) {
      console.error("WebSocket authentication error:", error);
      return null;
    }
  }
}

export const chatWebSocket = new ChatWebSocketServer();
