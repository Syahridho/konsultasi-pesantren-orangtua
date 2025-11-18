import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { z } from "zod";

// Input validation schema
const updateStatusSchema = z.object({
  status: z.enum(["delivered", "read"]),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, messageId } = await params;
    const userId = session.user.id;

    // Add diagnostic logging
    console.log(`[DEBUG API] Status update request:`, {
      chatId,
      messageId,
      userId,
      hasSession: !!session,
    });

    // Verify user is participant in this chat
    const chatRef = ref(database, `chats/${chatId}`);
    const chatSnapshot = await get(chatRef);

    if (!chatSnapshot.exists()) {
      console.log(`[DEBUG API] Chat not found: ${chatId}`);
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const chatData = chatSnapshot.val();
    if (
      chatData.participant1Id !== userId &&
      chatData.participant2Id !== userId
    ) {
      console.log(
        `[DEBUG API] Access denied for user ${userId}. Participants:`,
        {
          participant1Id: chatData.participant1Id,
          participant2Id: chatData.participant2Id,
        }
      );
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get the message to verify it exists and get current status
    const messageRef = ref(database, `chats/${chatId}/messages/${messageId}`);
    const messageSnapshot = await get(messageRef);

    if (!messageSnapshot.exists()) {
      console.log(
        `[DEBUG API] Message not found: ${messageId} in chat ${chatId}`
      );

      // Log all message IDs in this chat for debugging
      const allMessagesRef = ref(database, `chats/${chatId}/messages`);
      const allMessagesSnapshot = await get(allMessagesRef);
      if (allMessagesSnapshot.exists()) {
        const allMessageIds = Object.keys(allMessagesSnapshot.val());
        console.log(
          `[DEBUG API] All message IDs in chat ${chatId}:`,
          allMessageIds
        );
      } else {
        console.log(`[DEBUG API] No messages found in chat ${chatId}`);
      }

      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const messageData = messageSnapshot.val();

    // Only recipient can update status (not the sender)
    if (messageData.senderId === userId) {
      return NextResponse.json(
        { error: "Cannot update status for own message" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);

    // Prepare status update
    const statusUpdate: any = {
      status,
    };

    // Initialize statusTimestamp if it doesn't exist
    const currentStatusTimestamp = messageData.statusTimestamp || {};

    // Add timestamp for the specific status
    statusUpdate.statusTimestamp = {
      ...currentStatusTimestamp,
      [status]: new Date().toISOString(),
    };

    // Update message status
    await update(messageRef, statusUpdate);

    return NextResponse.json({
      message: "Message status updated successfully",
      status,
      timestamp: statusUpdate.statusTimestamp[status],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating message status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
