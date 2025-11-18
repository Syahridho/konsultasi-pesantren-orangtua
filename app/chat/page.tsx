"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { toast } from "sonner";
import { useChatPreferences } from "@/hooks/use-local-storage";
import "@/styles/chat.css";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatPreferences, setChatPreferences] = useChatPreferences();

  // Memoize initial sidebar state to prevent dependency issues
  const initialSidebarOpen = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768 ? chatPreferences.sidebarOpen : false;
  }, [chatPreferences.sidebarOpen]);

  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push("/login?message=Please login to access chat");
      return;
    }
  }, [status, router]);

  // Memoize resize handler to prevent dependency issues
  const handleResize = useCallback(() => {
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [sidebarOpen]);

  // Save sidebar preference to local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [handleResize]);

  // Memoize chat preferences check to prevent unnecessary updates
  const shouldUpdatePreferences = useMemo(() => {
    return chatPreferences.sidebarOpen !== sidebarOpen;
  }, [chatPreferences.sidebarOpen, sidebarOpen]);

  useEffect(() => {
    // Only update preferences if sidebarOpen is different from stored value
    if (shouldUpdatePreferences) {
      setChatPreferences((prev) => ({ ...prev, sidebarOpen }));
    }
  }, [shouldUpdatePreferences, setChatPreferences]);

  // Memoize the chat selection handler to prevent hook order issues
  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    // Close sidebar on mobile after selecting a chat
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white">
      <div className="flex h-full relative">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden absolute top-4 left-4 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-white shadow-md"
          >
            {sidebarOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Sidebar - List Chat */}
        <div
          className={`w-full md:w-80 lg:w-80 border-r absolute md:relative h-full z-10 transition-all duration-300 ease-in-out transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
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
        <div className="flex-1 w-full md:w-auto chat-window">
          <ChatWindow
            chatId={selectedChatId}
            currentUserId={session.user.id || ""}
            currentUserName={session.user.name || ""}
          />
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-0 chat-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
