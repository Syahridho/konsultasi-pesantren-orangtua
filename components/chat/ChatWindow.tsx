"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  useRealtimeChat,
  formatMessageTime,
  formatDateForGroup,
} from "@/hooks/use-realtime-chat";
import MessageStatusIndicator from "./MessageStatusIndicator";

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

interface ChatWindowProps {
  chatId: string | null;
  currentUserId: string;
  currentUserName: string;
}

export default function ChatWindow({
  chatId,
  currentUserId,
  currentUserName,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Use the real-time chat hook
  const {
    messages,
    isConnected,
    sendMessage: sendRealtimeMessage,
    markAsRead,
  } = useRealtimeChat(chatId);

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollElement) {
          // Use smooth scrolling for better UX
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Also scroll when a new chat is selected
  useEffect(() => {
    if (chatId && messages.length > 0) {
      const scrollToBottom = () => {
        if (scrollAreaRef.current) {
          const scrollElement = scrollAreaRef.current.querySelector(
            "[data-radix-scroll-area-viewport]"
          );
          if (scrollElement) {
            scrollElement.scrollTo({
              top: scrollElement.scrollHeight,
              behavior: "smooth",
            });
          }
        }
      };

      const timeoutId = setTimeout(scrollToBottom, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [chatId]);

  // Set chat info when messages are loaded
  const [otherParticipantName, setOtherParticipantName] = useState<
    string | null
  >(null);
  const [loadingChatInfo, setLoadingChatInfo] = useState(true);

  // Fetch chat info to get participant name
  useEffect(() => {
    const fetchChatInfo = async () => {
      if (!chatId) {
        setOtherParticipantName(null);
        setLoadingChatInfo(false);
        return;
      }

      try {
        // Get chat info directly from Firebase Realtime Database
        const { ref, get } = await import("firebase/database");
        const { database } = await import("@/lib/firebase");

        const chatRef = ref(database, `chats/${chatId}`);
        const snapshot = await get(chatRef);

        if (snapshot.exists()) {
          const chatData = snapshot.val();
          // Determine other participant based on current user
          const otherParticipantName =
            chatData.participant1Id === currentUserId
              ? chatData.participant2Name
              : chatData.participant1Name;

          setOtherParticipantName(otherParticipantName);
        } else {
          // Fallback: try to get from messages
          if (messages.length > 0) {
            const otherMsg = messages.find(
              (msg) => msg.senderId !== currentUserId
            );
            if (otherMsg) {
              setOtherParticipantName(otherMsg.senderName);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching chat info:", error);
      } finally {
        setLoadingChatInfo(false);
      }
    };

    fetchChatInfo();
  }, [chatId, currentUserId]);

  // Mark messages as read when chat is opened or when user interacts with messages
  useEffect(() => {
    if (chatId && messages.length > 0) {
      // Mark messages as read when chat is opened
      const timer = setTimeout(() => {
        markAsRead();
      }, 1000); // Small delay to ensure messages are loaded

      return () => clearTimeout(timer);
    }
  }, [chatId, messages, markAsRead]);

  // Mark messages as read when user clicks on the chat window
  const handleChatInteraction = useCallback(() => {
    markAsRead();
  }, [markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || sending) return;

    setSending(true);
    try {
      await sendRealtimeMessage(newMessage.trim());
      setNewMessage("");
      toast.success("Message sent");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.response?.data?.error || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const messageGroups =
    messages.length > 0
      ? Object.entries(
          messages.reduce((groups: { [date: string]: any[] }, message: any) => {
            const date = new Date(message.createdAt).toDateString();
            if (!groups[date]) {
              groups[date] = [];
            }
            groups[date].push(message);
            return groups;
          }, {})
        )
      : [];

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Selamat datang di Chat
          </h3>
          <p className="text-sm text-gray-500">
            Pilih percakapan dari daftar di sebelah kiri untuk memulai mengobrol
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                {loadingChatInfo
                  ? "?"
                  : otherParticipantName?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {loadingChatInfo
                  ? "Loading..."
                  : otherParticipantName || "Unknown"}
              </h3>
            </div>
          </div>

          {/* Current user info */}
          <div className="text-right">
            <p className="text-xs text-gray-500">You</p>
            <p className="text-sm font-medium text-gray-700">
              {currentUserName}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 p-4 bg-gray-50 chat-scrollbar"
        onClick={handleChatInteraction}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Belum ada pesan</p>
              <p className="text-xs text-gray-400">
                Kirim pesan untuk memulai percakapan
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messageGroups.map(([date, dateMessages]: [string, Message[]]) => (
              <div key={date}>
                <div className="flex items-center justify-center mb-3">
                  <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                    {formatDateForGroup(dateMessages[0].createdAt)}
                  </span>
                </div>
                <div className="space-y-2">
                  {dateMessages.map((message: any) => {
                    const isOwnMessage = message.senderId === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] xs:max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-3 py-2 rounded-lg message-bubble chat-message ${
                            isOwnMessage
                              ? "bg-green-600 text-white"
                              : "bg-white text-gray-900 border"
                          }`}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs font-medium mb-1 opacity-75">
                              {message.senderName}
                            </p>
                          )}
                          <div className="flex items-end justify-between">
                            <p className="text-sm break-words pr-2">
                              {message.text}
                            </p>
                            <div className="flex items-center space-x-1">
                              <p
                                className={`text-xs ${
                                  isOwnMessage
                                    ? "text-green-100"
                                    : "text-gray-500"
                                }`}
                              >
                                {formatMessageTime(message.createdAt)}
                              </p>
                              {isOwnMessage && (
                                <MessageStatusIndicator
                                  status={message.status}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ketik pesan..."
            disabled={sending}
            className="flex-1 chat-input"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
