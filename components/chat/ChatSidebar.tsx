"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  getUserChats,
  getAvailableUsers,
  createChat,
  Chat,
  ChatUser,
} from "@/lib/secure-chat";
import { ref, onValue, set } from "firebase/database";
import { database } from "@/lib/firebase";
import MessageStatusIndicator from "./MessageStatusIndicator";

interface ChatSidebarProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: "admin" | "ustad" | "orangtua";
}

export default function ChatSidebar({
  selectedChatId,
  onSelectChat,
  currentUserId,
  currentUserName,
  currentUserRole,
}: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Chat[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const clickDebounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { data: session } = useSession();

  useEffect(() => {
    // Set up real-time listener for user chats
    const setupChatsListener = () => {
      const chatsRef = ref(database, "chats");

      const unsubscribe = onValue(
        chatsRef,
        (snapshot) => {
          try {
            setError(null);

            if (!snapshot.exists()) {
              setChats([]);
              setLoading(false);
              return;
            }

            const allChats = snapshot.val();
            const userChats: Chat[] = [];

            Object.keys(allChats).forEach((chatId) => {
              const chat = allChats[chatId];
              if (
                chat.participant1Id === currentUserId ||
                chat.participant2Id === currentUserId
              ) {
                // Get the other participant's info
                const otherParticipantId =
                  chat.participant1Id === currentUserId
                    ? chat.participant2Id
                    : chat.participant1Id;
                const otherParticipantName =
                  chat.participant1Id === currentUserId
                    ? chat.participant2Name
                    : chat.participant1Name;

                userChats.push({
                  id: chatId,
                  otherParticipantId,
                  otherParticipantName,
                  lastMessage: chat.lastMessage || "",
                  lastMessageTime: chat.lastMessageTime || chat.createdAt,
                  createdAt: chat.createdAt,
                  lastMessageStatus: chat.lastMessageStatus || null,
                });
              }
            });

            // Sort by last message time (most recent first)
            userChats.sort(
              (a, b) =>
                new Date(b.lastMessageTime).getTime() -
                new Date(a.lastMessageTime).getTime()
            );

            setChats(userChats);
            setLoading(false);
          } catch (err) {
            console.error("Error processing chats:", err);
            setError("Failed to load chats");
            setLoading(false);
          }
        },
        (error) => {
          console.error("Chats listener error:", error);
          setError("Failed to load chats");
          setLoading(false);
        }
      );

      return unsubscribe;
    };

    const unsubscribe = setupChatsListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUserId]);

  // Real-time filter for chat status
  useEffect(() => {
    if (!currentUserId) return;

    const statusFilterRef = ref(
      database,
      `users/${currentUserId}/statusFilter`
    );

    const unsubscribe = onValue(statusFilterRef, (snapshot) => {
      if (snapshot.exists()) {
        const filter = snapshot.val();
        if (filter && filter !== "all") {
          // Apply filter to chats
          setChats((prevChats) => {
            if (filter === "unread") {
              // Show only chats with unread messages
              return prevChats.map((chat) => ({
                ...chat,
                hasUnread: true, // This would be determined by checking messages
              }));
            } else if (filter === "read") {
              // Show only chats with all messages read
              return prevChats.map((chat) => ({
                ...chat,
                hasUnread: false,
              }));
            }
            // Add more filter options as needed
            return prevChats;
          });
        }
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUserId]);

  useEffect(() => {
    // Fetch available users to chat with
    const fetchAvailableUsers = async () => {
      try {
        const users = await getAvailableUsers();
        setAvailableUsers(users);
      } catch (error) {
        console.error("Error fetching available users:", error);
      }
    };

    fetchAvailableUsers();
  }, [currentUserRole]);

  // Debounced search functionality
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `/api/chat/search?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const data = await response.json();
      setSearchResults(data.chats || []);

      if (data.chats && data.chats.length === 0) {
        setSearchError(`Tidak ada hasil untuk "${query}"`);
      }
    } catch (error) {
      console.error("Error searching chats:", error);
      setSearchError("Gagal melakukan pencarian. Silakan coba lagi.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Search functionality with debouncing
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, handleSearch]);

  const handleCreateNewChat = async (otherUser: ChatUser) => {
    try {
      // Check if chat already exists in the current chats list
      const existingChat = chats.find(
        (chat) => chat.otherParticipantId === otherUser.uid
      );

      if (existingChat) {
        // Chat already exists, just select it
        onSelectChat(existingChat.id);
        setShowNewChat(false);
        toast.info(`Chat with ${otherUser.name} is already open`);
      } else {
        // Create new chat
        const { chatId } = await createChat(otherUser.uid, otherUser.name);
        onSelectChat(chatId);
        setShowNewChat(false);
        toast.success(`Chat started with ${otherUser.name}`);
      }
    } catch (error: any) {
      console.error("Error creating new chat:", error);
      toast.error(error.response?.data?.error || "Failed to create chat");
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    // The Chat interface from secure-chat has different property names
    return {
      id: chat.otherParticipantId,
      name: chat.otherParticipantName,
    };
  };

  const formatTime = (timestamp: any) => {
    // Handle Firestore Timestamp
    const date =
      timestamp && timestamp.toDate ? timestamp.toDate() : new Date();
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
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Trigger the useEffect again by forcing a re-render
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Debounced click handler to prevent double-clicks
  const handleDebouncedClick = useCallback(
    (chatId: string, callback: () => void) => {
      // Clear any existing timeout for this chatId
      const existingTimeout = clickDebounceRef.current.get(chatId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set a new timeout
      const newTimeout = setTimeout(() => {
        callback();
        // Clean up the timeout reference
        clickDebounceRef.current.delete(chatId);
      }, 300); // 300ms debounce time

      clickDebounceRef.current.set(chatId, newTimeout);
    },
    []
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Chats
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {error || "Failed to load chats. Please try again."}
          </p>
          <Button onClick={handleRetry} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Pesan</h2>
            <p
              className="text-xs text-gray-500 font-medium truncate max-w-[150px]"
              title={currentUserName || "Unknown User"}
            >
              {currentUserName || "Unknown User"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewChat(!showNewChat)}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari berdasarkan nama orang tua atau santri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 focus:ring-2 focus:ring-green-500"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Filter Options */}
        {searchQuery && (
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border-b mt-2 rounded">
            <span className="text-xs text-gray-500">Filter:</span>
            <select
              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-white"
              onChange={(e) => {
                const filter = e.target.value;
                // Update filter in Firebase
                if (currentUserId) {
                  const statusFilterRef = ref(
                    database,
                    `users/${currentUserId}/statusFilter`
                  );
                  set(statusFilterRef, filter);
                }
              }}
              defaultValue="all"
            >
              <option value="all">Semua</option>
              <option value="unread">Belum Dibaca</option>
              <option value="read">Sudah Dibaca</option>
            </select>
          </div>
        )}
      </div>

      {showNewChat && (
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-medium mb-2">Pesan Baru</h3>
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {availableUsers.map((user) => (
                <Card
                  key={user.uid}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleCreateNewChat(user)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner mr-3"></div>
              <p className="text-sm text-gray-500">Mencari...</p>
            </div>
          ) : searchQuery ? (
            // Show search results
            searchError ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Search className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 mb-2">{searchError}</p>
                <p className="text-xs text-gray-400">
                  Coba dengan kata kunci yang berbeda
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Search className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  Tidak ada hasil untuk "{searchQuery}"
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Pastikan ejaan benar atau coba kata kunci lain
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 px-3 py-2 bg-gray-50 rounded-t">
                  {searchResults.length} hasil ditemukan untuk "{searchQuery}"
                </p>
                {searchResults.map((chat) => {
                  const otherParticipant = getOtherParticipant(chat);
                  const hasStudents =
                    chat.matchedStudents &&
                    Array.isArray(chat.matchedStudents) &&
                    chat.matchedStudents.length > 0;

                  // Check if this chat already exists in the user's chat list
                  const existingChat = chats.find(
                    (existingChat) =>
                      existingChat.otherParticipantId === otherParticipant.id
                  );

                  return (
                    <Card
                      key={chat.id}
                      className={`search-result-item p-3 cursor-pointer ${
                        selectedChatId === (existingChat?.id || chat.id)
                          ? "bg-green-50 border-green-200 shadow-sm"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        const chatIdToSelect = existingChat?.id || chat.id;
                        handleDebouncedClick(chatIdToSelect, () => {
                          onSelectChat(chatIdToSelect);
                        });
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-purple-600 text-white font-semibold">
                            {otherParticipant.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {otherParticipant.name}
                              </p>
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                {chat.otherParticipantRole || "orangtua"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {chat.lastMessageTime && (
                                <span className="text-xs text-gray-500">
                                  {formatTime(chat.lastMessageTime)}
                                </span>
                              )}
                              {chat.lastMessageStatus && (
                                <MessageStatusIndicator
                                  status={
                                    chat?.lastMessageStatus as
                                      | "sent"
                                      | "delivered"
                                      | "read"
                                  }
                                  size="sm"
                                />
                              )}
                            </div>
                          </div>

                          {chat.lastMessage && (
                            <p className="text-xs text-gray-600 truncate mb-2">
                              {chat.lastMessage}
                            </p>
                          )}

                          {hasStudents && (
                            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                              <p className="text-xs font-medium text-green-700 mb-1">
                                Murid yang cocok:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {chat.matchedStudents?.map(
                                  (student: any, index: number) => (
                                    <span
                                      key={index}
                                      className="text-xs px-2 py-1 bg-white text-green-600 rounded border border-green-300"
                                    >
                                      {student.name}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-500">Memuat pesan...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Belum ada pesan</p>
              <p className="text-xs text-gray-400 mt-1">
                Klik tombol pesan baru untuk memulai
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => {
                const otherParticipant = getOtherParticipant(chat);
                const displayName = otherParticipant.name || "Unknown User";
                return (
                  <Card
                    key={chat.id}
                    className={`p-3 cursor-pointer chat-transition chat-list-item hover:shadow-sm ${
                      selectedChatId === chat.id
                        ? "bg-green-50 border-green-200 shadow-sm active-chat-indicator"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      handleDebouncedClick(chat.id, () => {
                        onSelectChat(chat.id);
                      });
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10 avatar-hover">
                        <AvatarFallback>
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className="text-sm font-medium truncate"
                            title={displayName}
                          >
                            {displayName}
                          </p>
                          <div className="flex items-center space-x-1">
                            {chat.lastMessageTime && (
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {formatTime(chat.lastMessageTime)}
                              </span>
                            )}
                            {chat.lastMessageStatus && (
                              <MessageStatusIndicator
                                status={
                                  chat?.lastMessageStatus as
                                    | "sent"
                                    | "delivered"
                                    | "read"
                                }
                                size="sm"
                              />
                            )}
                          </div>
                        </div>
                        {chat.lastMessage && (
                          <p className="text-xs text-gray-600 truncate">
                            {chat.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
