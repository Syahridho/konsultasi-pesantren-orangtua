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

    // Helper function to check if user has matching student (all 3 data shapes)
    const hasMatchingStudent = (
      user: any,
      query: string,
      allUsersMap: any
    ): boolean => {
      // Shape 1: embedded students array with name fields
      if (user.students && Array.isArray(user.students)) {
        if (
          user.students.some(
            (s: any) => s.name && s.name.toLowerCase().includes(query)
          )
        )
          return true;
      }

      // Shape 2: embedded santri object map
      if (user.santri && typeof user.santri === "object") {
        if (
          Object.values(user.santri).some(
            (s: any) => s.name && s.name.toLowerCase().includes(query)
          )
        )
          return true;
      }

      // Shape 3: studentIds array — join to allUsers to resolve names
      if (
        user.studentIds &&
        Array.isArray(user.studentIds) &&
        allUsersMap
      ) {
        if (
          user.studentIds.some((santriId: string) => {
            const santri = allUsersMap[santriId];
            return santri && santri.name && santri.name.toLowerCase().includes(query);
          })
        )
          return true;
      }

      return false;
    };

    // Helper function to get matched student info for display
    const getStudentInfo = (
      user: any,
      query: string,
      allUsersMap: any
    ): { matched: boolean; students: any[] } => {
      const matchedStudents: any[] = [];

      // Shape 1: embedded students array
      if (user.students && Array.isArray(user.students)) {
        user.students.forEach((s: any) => {
          if (s.name && s.name.toLowerCase().includes(query)) {
            matchedStudents.push(s);
          }
        });
      }

      // Shape 2: embedded santri object map
      if (user.santri && typeof user.santri === "object") {
        Object.values(user.santri).forEach((s: any) => {
          if (s.name && s.name.toLowerCase().includes(query)) {
            matchedStudents.push(s);
          }
        });
      }

      // Shape 3: studentIds — join to allUsers
      if (
        user.studentIds &&
        Array.isArray(user.studentIds) &&
        allUsersMap
      ) {
        user.studentIds.forEach((santriId: string) => {
          const santri = allUsersMap[santriId];
          if (santri && santri.name && santri.name.toLowerCase().includes(query)) {
            matchedStudents.push({ name: santri.name, id: santriId });
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

      const otherParticipant = allUsers ? allUsers[otherParticipantId] : null;

      // Fallback: use name stored in chat document if user not in users node
      const otherParticipantNameFromChat =
        chat.participant1Id === userId
          ? chat.participant2Name
          : chat.participant1Name;

      const effectiveName =
        otherParticipant?.name ||
        (otherParticipantNameFromChat !== "Unknownfix"
          ? otherParticipantNameFromChat
          : null) ||
        "Unknown User";

      const effectiveRole = otherParticipant?.role || null;

      // Check if other participant name matches query
      const nameMatches =
        effectiveName && effectiveName.toLowerCase().includes(searchQuery);

      // Check if other participant has matching students (only relevant for orangtua)
      const studentInfo = otherParticipant
        ? getStudentInfo(otherParticipant, searchQuery, allUsers)
        : { matched: false, students: [] };
      const studentMatches = studentInfo.matched;

      if (nameMatches || studentMatches) {
        searchResults.push({
          id: chatId,
          otherParticipantId,
          otherParticipantName: effectiveName,
          otherParticipantRole: effectiveRole,
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
