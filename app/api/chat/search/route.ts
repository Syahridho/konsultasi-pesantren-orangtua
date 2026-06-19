import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { z } from "zod";

// Input validation schema
const searchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Query too long"),
});

// Role-based contact visibility (same logic as /api/chat/users)
function canChatWith(currentRole: string, targetRole: string): boolean {
  if (currentRole === "ustad") return targetRole === "orangtua";
  if (currentRole === "orangtua")
    return targetRole === "ustad" || targetRole === "admin";
  if (currentRole === "admin")
    return targetRole === "ustad" || targetRole === "orangtua";
  return false;
}

// GET: Search chats by participant name/role, plus new contacts by name/role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Validate input
    const { query: validatedQuery } = searchSchema.parse({ query });

    const userId = session.user.id;
    const userRole = session.user.role;

    if (!validatedQuery.trim()) {
      return NextResponse.json({
        chats: [],
        contacts: [],
        query: validatedQuery,
      });
    }

    const chatsRef = ref(database, "chats");
    const usersRef = ref(database, "users");

    // Get all chats and users in parallel
    const [chatsSnapshot, usersSnapshot] = await Promise.all([
      get(chatsRef),
      get(usersRef),
    ]);

    const allUsers = usersSnapshot.exists() ? usersSnapshot.val() : {};
    const searchQuery = validatedQuery.toLowerCase();

    // ── Helpers for matching student names ──
    const getStudentInfo = (user: any, query: string): any[] => {
      const matched: any[] = [];
      if (user.students && Array.isArray(user.students)) {
        user.students.forEach((s: any) => {
          if (s.name?.toLowerCase().includes(query)) matched.push(s);
        });
      }
      if (user.santri && typeof user.santri === "object") {
        Object.values(user.santri).forEach((s: any) => {
          if (s.name?.toLowerCase().includes(query)) matched.push(s);
        });
      }
      if (user.studentIds && Array.isArray(user.studentIds)) {
        user.studentIds.forEach((id: string) => {
          const santri = allUsers[id];
          if (santri?.name?.toLowerCase().includes(query)) {
            matched.push({ name: santri.name, id });
          }
        });
      }
      return matched;
    };

    // ── PART 1: Search existing chats ──
    const chatResults: any[] = [];
    const chattedUserIds = new Set<string>(); // track users already in a chat

    if (chatsSnapshot.exists()) {
      const allChats = chatsSnapshot.val();

      Object.keys(allChats).forEach((chatId) => {
        const chat = allChats[chatId];

        // Only chats where current user is a participant
        if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
          return;
        }

        const otherParticipantId =
          chat.participant1Id === userId
            ? chat.participant2Id
            : chat.participant1Id;

        const otherParticipant = allUsers[otherParticipantId];

        const otherParticipantNameFromChat =
          chat.participant1Id === userId
            ? chat.participant2Name
            : chat.participant1Name;

        const effectiveName =
          otherParticipant?.name ||
          otherParticipantNameFromChat ||
          "Unknown User";

        const effectiveRole = otherParticipant?.role || null;

        chattedUserIds.add(otherParticipantId);

        // Match by name OR role keyword
        const nameMatches = effectiveName.toLowerCase().includes(searchQuery);
        const roleMatches =
          effectiveRole && effectiveRole.toLowerCase().includes(searchQuery);
        const studentInfo = otherParticipant
          ? getStudentInfo(otherParticipant, searchQuery)
          : [];
        const studentMatches = studentInfo.length > 0;

        if (nameMatches || roleMatches || studentMatches) {
          // Resolve all student names for orangtua (not just matched ones)
          let allStudentNames: string[] = [];
          if (otherParticipant?.role === "orangtua") {
            if (
              otherParticipant.studentIds &&
              Array.isArray(otherParticipant.studentIds)
            ) {
              allStudentNames = otherParticipant.studentIds
                .map((id: string) => allUsers[id]?.name)
                .filter(Boolean);
            } else if (
              otherParticipant.students &&
              Array.isArray(otherParticipant.students)
            ) {
              allStudentNames = otherParticipant.students
                .map((s: any) => s.name)
                .filter(Boolean);
            } else if (
              otherParticipant.santri &&
              typeof otherParticipant.santri === "object"
            ) {
              allStudentNames = Object.values(otherParticipant.santri)
                .map((s: any) => s.name)
                .filter(Boolean);
            }
          }

          chatResults.push({
            id: chatId,
            otherParticipantId,
            otherParticipantName: effectiveName,
            otherParticipantRole: effectiveRole,
            matchedStudents: studentInfo,
            allStudentNames,
            lastMessage: chat.lastMessage || "",
            lastMessageTime: chat.lastMessageTime || chat.createdAt,
            createdAt: chat.createdAt,
            lastMessageStatus: chat.lastMessageStatus || null,
            isExistingChat: true,
          });
        }
      });
    }

    // Sort existing chat results by last message time
    chatResults.sort(
      (a, b) =>
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime()
    );

    // ── PART 2: Search new contacts (users NOT yet chatted with) ──
    const newContactResults: any[] = [];

    Object.keys(allUsers).forEach((uid) => {
      // Skip self and users already chatted with
      if (uid === userId || chattedUserIds.has(uid)) return;

      const user = allUsers[uid];

      // Only show contacts this role is allowed to chat with
      if (!canChatWith(userRole ?? "", user.role)) return;

      const nameMatches = user.name?.toLowerCase().includes(searchQuery);
      const roleMatches = user.role?.toLowerCase().includes(searchQuery);

      if (nameMatches || roleMatches) {
        // Resolve student names for orangtua contacts
        let studentNames: string[] = [];
        if (user.role === "orangtua") {
          if (user.studentIds && Array.isArray(user.studentIds)) {
            studentNames = user.studentIds
              .map((id: string) => allUsers[id]?.name)
              .filter(Boolean);
          } else if (user.students && Array.isArray(user.students)) {
            studentNames = user.students
              .map((s: any) => s.name)
              .filter(Boolean);
          } else if (user.santri && typeof user.santri === "object") {
            studentNames = Object.values(user.santri)
              .map((s: any) => s.name)
              .filter(Boolean);
          }
        }

        newContactResults.push({
          uid,
          name: user.name || "Unknown",
          email: user.email || "",
          role: user.role,
          studentNames,
          isNewContact: true,
        });
      }
    });

    return NextResponse.json({
      chats: chatResults,
      contacts: newContactResults,
      query: validatedQuery,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error searching chats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
