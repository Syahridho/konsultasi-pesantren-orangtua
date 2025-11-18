import axios from "axios";

// Create a secure axios instance for chat API
const chatApi = axios.create({
  baseURL: "/api/chat",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add response interceptor for error handling
chatApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href =
        "/login?message=Session expired, please login again";
      return Promise.reject(error);
    }

    // Handle forbidden access
    if (error.response?.status === 403) {
      console.error("Access denied to chat resource");
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  otherParticipantId: string;
  otherParticipantName: string;
  otherParticipantRole?: string;
  lastMessage: string;
  lastMessageTime: string;
  createdAt: string;
  lastMessageStatus?: string;
  matchedStudents?: any[];
}

export interface ChatUser {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "ustad" | "orangtua";
}

// Fetch user's chat list
export async function getUserChats(): Promise<Chat[]> {
  try {
    const response = await chatApi.get("/");
    return response.data.chats || [];
  } catch (error) {
    console.error("Error fetching user chats:", error);
    throw error;
  }
}

// Create new chat
export async function createChat(
  participantId: string,
  participantName: string
): Promise<{ chatId: string }> {
  try {
    const response = await chatApi.post("/", {
      participantId,
      participantName,
    });
    return { chatId: response.data.chatId };
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
}

// Send message to chat
export async function sendMessage(
  chatId: string,
  text: string
): Promise<{ messageId: string }> {
  try {
    const response = await chatApi.post("/", {
      chatId,
      text,
    });
    return { messageId: response.data.messageId };
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

// Fetch messages for a specific chat
export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  try {
    const response = await chatApi.get(`/${chatId}/messages`);
    return response.data.messages || [];
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    throw error;
  }
}

// Fetch available users to chat with
export async function getAvailableUsers(): Promise<ChatUser[]> {
  try {
    const response = await chatApi.get("/users");
    return response.data.users || [];
  } catch (error) {
    console.error("Error fetching available users:", error);
    throw error;
  }
}

// WebSocket connection for real-time updates
export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: ((message: any) => void)[] = [];

  constructor(private chatId: string) {}

  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/api/chat/ws?userId=${userId}&chatId=${this.chatId}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onclose = () => {
          console.log("WebSocket disconnected");
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        // Reconnect would need user ID, which should be stored
        // This is a simplified implementation
        console.log("Reconnection attempt");
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  onMessage(handler: (message: any) => void): void {
    this.messageHandlers.push(handler);
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
