import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

// GET: Fetch messages for a specific chat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const userId = session.user.id;

    // Verify user is participant in this chat
    const chatRef = ref(database, `chats/${chatId}`);
    const chatSnapshot = await get(chatRef);

    if (!chatSnapshot.exists()) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const chatData = chatSnapshot.val();
    if (
      chatData.participant1Id !== userId &&
      chatData.participant2Id !== userId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get messages for this chat
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const messagesSnapshot = await get(messagesRef);

    if (!messagesSnapshot.exists()) {
      return NextResponse.json({ messages: [] });
    }

    const allMessages = messagesSnapshot.val();
    const messages = Object.keys(allMessages).map((messageId) => ({
      id: messageId,
      ...allMessages[messageId],
    }));

    // Sort by creation time (oldest first)
    messages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
