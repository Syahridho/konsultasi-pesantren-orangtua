"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import Link from "next/link";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { toast } from "sonner";
import "@/styles/chat.css";

export default function PetugasChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?message=Please login to access chat");
      return;
    }

    if (
      session?.user?.role &&
      session.user.role !== "admin" &&
      session.user.role !== "ustad" &&
      session.user.role !== "petugas"
    ) {
      toast.error("Anda tidak memiliki akses ke fitur chat");
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    setMobileView("chat");
  }, []);

  const handleBackToList = useCallback(() => {
    setMobileView("list");
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
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
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col
      -m-4 sm:-m-6 lg:-m-8
      h-[calc(100vh-4rem)] lg:h-screen"
    >
      {/* Navigation Bar */}
      <div className="border-b bg-white px-4 py-3 flex items-center gap-3 shrink-0">
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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          )}
        </div>

        <div className="hidden md:block">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">
            {mobileView === "chat" && selectedChatId ? "Percakapan" : "Chat"}
          </h1>
        </div>
        <div className="w-24"></div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`
            bg-white border-r flex flex-col
            md:w-80 lg:w-96 md:flex-shrink-0 md:block
            ${mobileView === "list" ? "w-full flex-1" : "hidden"}
          `}
        >
          <ChatSidebar
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            currentUserId={session.user.id || ""}
            currentUserName={session.user.name || ""}
            currentUserRole={session.user.role || "petugas"}
          />
        </div>

        {/* Chat Window */}
        <div
          className={`
            flex-1 flex flex-col overflow-hidden
            md:flex
            ${mobileView === "chat" ? "flex w-full" : "hidden"}
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
