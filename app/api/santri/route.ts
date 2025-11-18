import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

// GET: Fetch students with filters for class enrollment
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryYear = searchParams.get("entryYear");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");

    // Get current user's data
    const userRef = ref(database, `users/${session.user.id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.val();

    // Only admin can access all student data for class creation
    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users from Firebase
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      return NextResponse.json({
        students: [],
        total: 0,
        pagination: { total: 0, page, limit },
      });
    }

    const allUsers = usersSnapshot.val();
    let students: any[] = [];

    // Collect students from different data structures
    Object.keys(allUsers).forEach((userId) => {
      const user = allUsers[userId];

      if (user.role === "santri") {
        students.push({
          id: userId,
          name: user.name,
          email: user.email,
          entryYear: user.entryYear || "",
          status: user.status || "active",
          orangTuaId: user.orangTuaId || "",
          createdAt: user.createdAt,
        });
      }
    });

    // Apply filters
    if (entryYear && entryYear !== "all") {
      students = students.filter((student) => student.entryYear === entryYear);
    }

    if (status && status !== "all") {
      students = students.filter((student) => student.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower)
      );
    }

    const total = students.length;

    // Apply pagination
    const start = (page - 1) * limit;
    const paginatedStudents = students.slice(start, start + limit);

    // Get available entry years for filter dropdown
    const entryYears = [
      ...new Set(students.map((s) => s.entryYear).filter(Boolean)),
    ].sort();

    return NextResponse.json({
      students: paginatedStudents,
      total,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filters: {
        entryYears,
        availableStatuses: ["active", "inactive", "graduated"],
      },
    });
  } catch (error) {
    console.error("[SANTRI API] Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
