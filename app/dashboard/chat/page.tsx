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
import "@/styles/chat.css";

export default function DashboardChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push("/login?message=Please login to access chat");
      return;
    }

    // Check if user has permission (admin or ustad)
    if (session?.user?.role && session.user.role !== "admin" && session.user.role !== "ustad") {
      toast.error("Anda tidak memiliki akses ke fitur chat");
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Memoize resize handler
  const handleResize = useCallback(() => {
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop && sidebarOpen) {
      setSidebarOpen(false);
    } else if (isDesktop && !sidebarOpen) {
      setSidebarOpen(true);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Set initial sidebar state based on screen size
      setSidebarOpen(window.innerWidth >= 768);
      
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [handleResize]);

  // Memoize the chat selection handler
  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    // Close sidebar on mobile after selecting a chat
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please log in to access the chat feature.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm overflow-hidden">
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
          className={`w-full md:w-80 lg:w-96 border-r absolute md:relative h-full z-10 bg-white transition-all duration-300 ease-in-out transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <ChatSidebar
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            currentUserId={session.user.id || ""}
            currentUserName={session.user.name || ""}
            currentUserRole={session.user.role || "admin"}
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
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-0"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
