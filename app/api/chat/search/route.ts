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

// GET: Search chats by parent or student name
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

    if (!validatedQuery.trim()) {
      return NextResponse.json({ chats: [], query: validatedQuery });
    }

    const chatsRef = ref(database, "chats");
    const usersRef = ref(database, "users");

    // Get all chats and users
    const [chatsSnapshot, usersSnapshot] = await Promise.all([
      get(chatsRef),
      get(usersRef),
    ]);

    if (!chatsSnapshot.exists()) {
      return NextResponse.json({ chats: [], query: validatedQuery });
    }

    const allChats = chatsSnapshot.val();
    const allUsers = usersSnapshot.val();
    const searchResults: any[] = [];
    const searchQuery = validatedQuery.toLowerCase();

    // Helper function to check if user has matching student
    const hasMatchingStudent = (user: any, query: string): boolean => {
      if (user.students && Array.isArray(user.students)) {
        return user.students.some(
          (student: any) =>
            student.name && student.name.toLowerCase().includes(query)
        );
      }
      if (user.santri && typeof user.santri === "object") {
        return Object.values(user.santri).some(
          (student: any) =>
            student.name && student.name.toLowerCase().includes(query)
        );
      }
      return false;
    };

    // Helper function to get student info for display
    const getStudentInfo = (
      user: any,
      query: string
    ): { matched: boolean; students: any[] } => {
      const matchedStudents: any[] = [];

      if (user.students && Array.isArray(user.students)) {
        user.students.forEach((student: any) => {
          if (student.name && student.name.toLowerCase().includes(query)) {
            matchedStudents.push(student);
          }
        });
      } else if (user.santri && typeof user.santri === "object") {
        Object.values(user.santri).forEach((student: any) => {
          if (student.name && student.name.toLowerCase().includes(query)) {
            matchedStudents.push(student);
          }
        });
      }

      return {
        matched: matchedStudents.length > 0,
        students: matchedStudents,
      };
    };

    // Search through chats
    Object.keys(allChats).forEach((chatId) => {
      const chat = allChats[chatId];

      // Only include chats where the current user is a participant
      if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
        return;
      }

      // Get other participant info
      const otherParticipantId =
        chat.participant1Id === userId
          ? chat.participant2Id
          : chat.participant1Id;

      const otherParticipant = allUsers[otherParticipantId];

      if (!otherParticipant) {
        return;
      }

      // Check if other participant name matches
      const nameMatches =
        otherParticipant.name &&
        otherParticipant.name.toLowerCase().includes(searchQuery);

      // Check if other participant has matching students
      const studentInfo = getStudentInfo(otherParticipant, searchQuery);
      const studentMatches = studentInfo.matched;

      if (nameMatches || studentMatches) {
        // Handle case where participant name is missing or "Unknownfix"
        let displayName = otherParticipant.name;
        if (!displayName || displayName === "Unknownfix") {
          displayName = "Unknown User";
        }

        // Convert to secure-chat format with enhanced info
        searchResults.push({
          id: chatId,
          otherParticipantId,
          otherParticipantName: displayName,
          otherParticipantRole: otherParticipant.role,
          matchedStudents: studentInfo.students,
          lastMessage: chat.lastMessage || "",
          lastMessageTime: chat.lastMessageTime || chat.createdAt,
          createdAt: chat.createdAt,
          lastMessageStatus: chat.lastMessageStatus || null,
        });
      }
    });

    // Sort by last message time (most recent first)
    searchResults.sort(
      (a, b) =>
        new Date(b.lastMessageTime).getTime() -
        new Date(a.lastMessageTime).getTime()
    );

    return NextResponse.json({
      chats: searchResults,
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
