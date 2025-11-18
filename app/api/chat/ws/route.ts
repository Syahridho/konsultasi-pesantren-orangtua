import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, push, onValue } from "firebase/database";
import { database } from "@/lib/firebase";

// WebSocket connection handler for Next.js API route
export async function GET(request: NextRequest) {
  // This is a placeholder for WebSocket implementation
  // In a production environment, you would use a proper WebSocket server
  // For now, we'll use Server-Sent Events (SSE) as a fallback

  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const chatId = url.searchParams.get("chatId");

  if (!userId || !chatId) {
    return new Response("Missing required parameters", { status: 400 });
  }

  // Verify user is participant in this chat
  const chatRef = ref(database, `chats/${chatId}`);
  const chatSnapshot = await get(chatRef);

  if (!chatSnapshot.exists()) {
    return new Response("Chat not found", { status: 404 });
  }

  const chatData = chatSnapshot.val();
  if (
    chatData.participant1Id !== userId &&
    chatData.participant2Id !== userId
  ) {
    return new Response("Access denied", { status: 403 });
  }

  // Set up Server-Sent Events stream
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Listen for new messages in this chat
      const messagesRef = ref(database, `chats/${chatId}/messages`);

      const unsubscribe = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const messages = snapshot.val();
          const messageKeys = Object.keys(messages);

          // Get the latest message
          if (messageKeys.length > 0) {
            const latestMessageKey = messageKeys[messageKeys.length - 1];
            const latestMessage = messages[latestMessageKey];

            // Send the new message to the client
            const data = `data: ${JSON.stringify(latestMessage)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }
      });

      // Clean up when the connection is closed
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}

// WebSocket upgrade handler (for future implementation)
export async function UPGRADEREQUEST(request: NextRequest) {
  // This would be used for actual WebSocket implementation
  // For now, we'll return a method not allowed response
  return new Response("Use SSE endpoint for real-time updates", {
    status: 405,
  });
}
