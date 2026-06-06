"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import Link from "next/link";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { toast } from "sonner";
import "@/styles/chat.css";

function ChatPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);


  // Mobile: 'list' shows sidebar, 'chat' shows chat window
  // Desktop: both panels are always visible
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push("/login?message=Please login to access chat");
      return;
    }
  }, [status, router]);

  // Auto-select chat when userId is provided in URL
  useEffect(() => {
    const userId = searchParams.get("userId");
    const userName = searchParams.get("userName");

    if (userId && userName && session?.user?.id) {
      // Find or create chat with this user
      const findOrCreateChat = async () => {
        try {
          // Import the functions we need
          const { ref, get } = await import("firebase/database");
          const { database } = await import("@/lib/firebase");
          const { createChat } = await import("@/lib/secure-chat");

          // Check if chat already exists
          const chatsRef = ref(database, "chats");
          const snapshot = await get(chatsRef);

          let foundChatId: string | null = null;

          if (snapshot.exists()) {
            const allChats = snapshot.val();

            // Find existing chat with this user
            for (const chatId in allChats) {
              const chat = allChats[chatId];
              if (
                (chat.participant1Id === session.user.id &&
                  chat.participant2Id === userId) ||
                (chat.participant2Id === session.user.id &&
                  chat.participant1Id === userId)
              ) {
                foundChatId = chatId;
                break;
              }
            }
          }

          // If chat doesn't exist, create it
          if (!foundChatId) {
            const result = await createChat(
              userId,
              decodeURIComponent(userName)
            );
            foundChatId = result.chatId;
          }

          // Select the chat
          if (foundChatId) {
            setSelectedChatId(foundChatId);
            // On mobile: switch to chat view
            setMobileView("chat");

            // Show notification
            toast.success(
              `Membuka chat dengan ${decodeURIComponent(userName)}`
            );
          }
        } catch (error) {
          console.error("Error finding/creating chat:", error);
          toast.error("Gagal membuka chat");
        }
      };

      findOrCreateChat();
    }
  }, [searchParams, session?.user?.id]);

  // Memoize the chat selection handler
  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    // On mobile: switch to chat window view
    setMobileView("chat");
  }, []);

  // Back button handler: return to list on mobile
  const handleBackToList = useCallback(() => {
    setMobileView("list");
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please log in to access the chat feature.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Navigation Bar */}
      <div className="border-b bg-white px-4 py-3 flex items-center gap-3 shrink-0">
        {/* Mobile: back to list when in chat view; otherwise back to home/dashboard */}
        <div className="md:hidden">
          {mobileView === "chat" ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleBackToList}
            >
              <ChevronLeft className="w-4 h-4" />
              Pesan
            </Button>
          ) : (
            <Link
              href={session?.user?.role === "orangtua" ? "/home" : "/dashboard"}
            >
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
            </Link>
          )}
        </div>

        {/* Desktop back button */}
        <div className="hidden md:block">
          <Link
            href={session?.user?.role === "orangtua" ? "/home" : "/dashboard"}
          >
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </Link>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">
            {mobileView === "chat" && selectedChatId ? "Percakapan" : "Chat"}
          </h1>
        </div>
        <div className="w-20"></div>
      </div>

      {/* Mobile: single-panel view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - List Chat */}
        {/* Mobile: full screen list panel, hidden when chat is selected */}
        {/* Desktop: always visible fixed-width panel */}
        <div
          className={`
            bg-white border-r flex flex-col
            md:w-80 lg:w-80 md:flex-shrink-0 md:block
            ${
              mobileView === "list"
                ? "w-full flex-1"
                : "hidden"
            }
          `}
        >
          <ChatSidebar
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            currentUserId={session.user.id || ""}
            currentUserName={session.user.name || ""}
            currentUserRole={session.user.role || "orangtua"}
          />
        </div>

        {/* Chat Window */}
        {/* Mobile: full screen, shown only when chat is selected */}
        {/* Desktop: always visible flex-1 */}
        <div
          className={`
            flex-1 flex flex-col overflow-hidden
            md:flex
            ${
              mobileView === "chat"
                ? "flex w-full"
                : "hidden"
            }
          `}
        >
          <ChatWindow
            chatId={selectedChatId}
            currentUserId={session.user.id || ""}
            currentUserName={session.user.name || ""}
          />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
