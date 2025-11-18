import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { ref, onValue, query, orderByChild, get } from "firebase/database";
import { database } from "@/lib/firebase";
import {
  checkUserOnlineStatus,
  batchUpdateMessageStatus,
  getMessagesNeedingStatusUpdate,
} from "@/lib/message-status-utils";

console.log(
  "[DEBUG] use-realtime-chat is using direct Firebase Realtime Database access for consistency"
);

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
  statusTimestamp?: {
    sent?: string;
    delivered?: string;
    read?: string;
  };
}

export function useRealtimeChat(chatId: string | null) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastSeenMessagesRef = useRef<Set<string>>(new Set());

  // Load initial messages and set up real-time listener
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setIsConnected(false);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    const loadInitialMessages = async () => {
      try {
        console.log(`[DEBUG] Loading initial messages for chatId: ${chatId}`);

        // Use direct Firebase access for consistency with real-time listener
        const messagesRef = query(
          ref(database, `chats/${chatId}/messages`),
          orderByChild("createdAt")
        );

        const snapshot = await get(messagesRef);

        if (snapshot.exists()) {
          const messagesData = snapshot.val();
          const initialMessages: Message[] = [];

          Object.keys(messagesData).forEach((messageId) => {
            const message = messagesData[messageId];
            initialMessages.push({
              id: messageId,
              ...message,
            });
          });

          console.log(
            `[DEBUG] Loaded ${initialMessages.length} initial messages`
          );
          console.log(
            `[DEBUG] Initial message IDs:`,
            initialMessages.map((m: Message) => m.id)
          );
          setMessages(initialMessages);
        } else {
          console.log(`[DEBUG] No messages found for chat ${chatId}`);
          setMessages([]);
        }
      } catch (error) {
        console.error("[DEBUG] Error loading initial messages:", error);
      }
    };

    // Set up real-time listener using Firebase
    const setupRealtimeListener = () => {
      console.log(
        `[DEBUG] Setting up real-time listener for chatId: ${chatId}`
      );
      console.log(`[DEBUG] Firebase path: chats/${chatId}/messages`);

      const messagesRef = query(
        ref(database, `chats/${chatId}/messages`),
        orderByChild("createdAt")
      );

      const unsubscribe = onValue(
        messagesRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const messagesData = snapshot.val();
            const messagesArray: Message[] = [];

            Object.keys(messagesData).forEach((messageId) => {
              const message = messagesData[messageId];
              messagesArray.push({
                id: messageId,
                ...message,
              });
            });

            console.log(
              `[DEBUG] Loaded ${messagesArray.length} messages for chat ${chatId}`
            );
            console.log(
              `[DEBUG] Message IDs:`,
              messagesArray.map((m) => m.id)
            );

            setMessages(messagesArray);
            setIsConnected(true);

            // Mark messages as delivered when they are received
            if (session?.user?.id) {
              const newMessages = messagesArray.filter(
                (msg) =>
                  msg.senderId !== session.user.id &&
                  msg.status !== "delivered" &&
                  msg.status !== "read" &&
                  !lastSeenMessagesRef.current.has(msg.id)
              );

              console.log("New messages to mark as delivered:", newMessages);

              if (newMessages.length > 0) {
                // Mark new messages as delivered using batch update with error handling
                const messageIds = newMessages.map((msg) => msg.id);
                console.log(
                  "Attempting to mark messages as delivered:",
                  messageIds
                );

                batchUpdateMessageStatus(
                  chatId,
                  messageIds,
                  "delivered",
                  session.user.id
                )
                  .then((results) => {
                    console.log("Batch update results:", results);
                    if (results.failed.length > 0) {
                      console.error(
                        `Failed to mark ${results.failed.length} messages as delivered:`,
                        results.failed
                      );
                    }
                  })
                  .catch((error) =>
                    console.error("Error marking messages as delivered:", error)
                  );

                // Update last seen messages
                newMessages.forEach((msg) =>
                  lastSeenMessagesRef.current.add(msg.id)
                );
              }
            }
          } else {
            setMessages([]);
          }
        },
        (error) => {
          console.error("Firebase listener error:", error);
          setIsConnected(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    };

    loadInitialMessages();
    setupRealtimeListener();

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [chatId]);

  // Function to send messages
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !chatId || !session?.user?.id) return;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId,
            text: text.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const result = await response.json();
        return result.messageId;
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    },
    [chatId, session?.user?.id]
  );

  // Function to mark messages as read
  const markAsRead = useCallback(async () => {
    if (!chatId || !session?.user?.id) {
      console.log("[DEBUG] markAsRead: Missing chatId or session", {
        chatId,
        hasSession: !!session?.user?.id,
      });
      return;
    }

    // Use utility function to get messages needing read status
    const unreadMessageIds = getMessagesNeedingStatusUpdate(
      messages,
      session.user.id,
      "read"
    );

    console.log("[DEBUG] Messages to mark as read:", {
      chatId,
      userId: session.user.id,
      unreadMessageIds,
      totalMessages: messages.length,
    });

    if (unreadMessageIds.length > 0) {
      try {
        console.log(
          "[DEBUG] Attempting to mark messages as read:",
          unreadMessageIds
        );
        const results = await batchUpdateMessageStatus(
          chatId,
          unreadMessageIds,
          "read",
          session.user.id
        );
        console.log("[DEBUG] Mark as read results:", results);
        if (results.failed.length > 0) {
          console.error(
            `[DEBUG] Failed to mark ${results.failed.length} messages as read:`,
            results.failed
          );
        }
      } catch (error) {
        console.error("[DEBUG] Error marking messages as read:", error);
      }
    }
  }, [chatId, messages, session?.user?.id]);

  // Function to check if recipient is online
  const checkRecipientOnlineStatus = useCallback(
    async (recipientId: string) => {
      try {
        return await checkUserOnlineStatus(recipientId);
      } catch (error) {
        console.error("Error checking recipient online status:", error);
        return false;
      }
    },
    []
  );

  return {
    messages,
    isConnected,
    sendMessage,
    markAsRead,
    checkRecipientOnlineStatus,
  };
}

// Helper function to format timestamps
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  }
}

// Helper function to group messages by date
export function groupMessagesByDate(messages: Message[]): {
  [date: string]: Message[];
} {
  const groups: { [date: string]: Message[] } = {};

  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    const dateString = date.toDateString();

    if (!groups[dateString]) {
      groups[dateString] = [];
    }

    groups[dateString].push(message);
  });

  return groups;
}

// Helper function to format date for message groups
export function formatDateForGroup(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hari ini";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Kemarin";
  } else {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }
}
