import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, push, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { z } from "zod";

// Input validation schemas
const sendMessageSchema = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
  text: z
    .string()
    .min(1, "Message text is required")
    .max(1000, "Message too long"),
});

const createChatSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  participantName: z.string().min(1, "Participant name is required"),
});

// GET: Fetch user's chat list
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all chats and users data
    const chatsRef = ref(database, "chats");
    const usersRef = ref(database, "users");

    const [chatsSnapshot, usersSnapshot] = await Promise.all([
      get(chatsRef),
      get(usersRef),
    ]);

    if (!chatsSnapshot.exists()) {
      return NextResponse.json({ chats: [] });
    }

    const allChats = chatsSnapshot.val();
    const allUsers = usersSnapshot.exists() ? usersSnapshot.val() : {};
    const userChats: any[] = [];

    Object.keys(allChats).forEach((chatId) => {
      const chat = allChats[chatId];
      if (chat.participant1Id === userId || chat.participant2Id === userId) {
        // Get the other participant's info
        const otherParticipantId =
          chat.participant1Id === userId
            ? chat.participant2Id
            : chat.participant1Id;

        // Try to get other participant name from chat data first
        let otherParticipantName =
          chat.participant1Id === userId
            ? chat.participant2Name
            : chat.participant1Name;

        // If name is not available or is "Unknownfix", try to get from users data
        if (!otherParticipantName || otherParticipantName === "Unknownfix") {
          const otherUser = allUsers[otherParticipantId];
          if (otherUser && otherUser.name) {
            otherParticipantName = otherUser.name;
          } else {
            otherParticipantName = "Unknown User";
          }
        }

        userChats.push({
          id: chatId,
          otherParticipantId,
          otherParticipantName: otherParticipantName || "Unknown User",
          lastMessage: chat.lastMessage || "",
          lastMessageTime: chat.lastMessageTime || chat.createdAt,
          createdAt: chat.createdAt,
        });
      }
    });

    // Sort by last message time (most recent first)
    userChats.sort(
      (a, b) =>
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime()
    );

    return NextResponse.json({ chats: userChats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new chat or send message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = session.user.id;
    const userName = session.user.name;

    // Check if this is a message sending or chat creation request
    if (body.chatId && body.text) {
      // Send message
      const { chatId, text } = sendMessageSchema.parse(body);

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

      // Add message to chat
      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const newMessageRef = push(messagesRef);

      const messageData = {
        text,
        senderId: userId,
        senderName: userName,
        createdAt: new Date().toISOString(),
        status: "sent",
        statusTimestamp: {
          sent: new Date().toISOString(),
        },
      };

      await set(newMessageRef, messageData);

      // Update chat's last message info
      await update(chatRef, {
        lastMessage: text,
        lastMessageTime: new Date().toISOString(),
      });

      return NextResponse.json({
        message: "Message sent successfully",
        messageId: newMessageRef.key,
      });
    } else if (body.participantId && body.participantName) {
      // Create new chat
      const { participantId, participantName } = createChatSchema.parse(body);

      // Check if chat already exists
      const chatsRef = ref(database, "chats");
      const chatsSnapshot = await get(chatsRef);

      if (chatsSnapshot.exists()) {
        const allChats = chatsSnapshot.val();

        // Look for existing chat between these users
        for (const chatId of Object.keys(allChats)) {
          const chat = allChats[chatId];
          if (
            (chat.participant1Id === userId &&
              chat.participant2Id === participantId) ||
            (chat.participant1Id === participantId &&
              chat.participant2Id === userId)
          ) {
            return NextResponse.json({
              message: "Chat already exists",
              chatId,
            });
          }
        }
      }

      // Create new chat
      const newChatRef = push(chatsRef);
      const chatId = newChatRef.key;

      const chatData = {
        participant1Id: userId,
        participant2Id: participantId,
        participant1Name: userName,
        participant2Name: participantName,
        createdAt: new Date().toISOString(),
      };

      await set(newChatRef, chatData);

      return NextResponse.json({
        message: "Chat created successfully",
        chatId,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
