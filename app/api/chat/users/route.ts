import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

// GET: Fetch users available for chat based on current user's role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const currentUserRole = session.user.role;

    // Get all users from database
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ users: [] });
    }

    const allUsers = snapshot.val();
    const availableUsers: any[] = [];

    // Filter users based on role
    Object.keys(allUsers).forEach((userId) => {
      const user = allUsers[userId];

      // Skip current user
      if (userId === currentUserId) return;

      // If current user is ustad, show orangtua users
      // If current user is orangtua, show ustad users
      // Admin can chat with both ustad and orangtua
      if (
        (currentUserRole === "ustad" && user.role === "orangtua") ||
        (currentUserRole === "orangtua" && user.role === "ustad") ||
        (currentUserRole === "admin" &&
          (user.role === "ustad" || user.role === "orangtua"))
      ) {
        availableUsers.push({
          uid: userId,
          name: user.name,
          email: user.email,
          role: user.role,
        });
      }
    });

    return NextResponse.json({ users: availableUsers });
  } catch (error) {
    console.error("Error fetching chat users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
