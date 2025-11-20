import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { addCorsHeaders, handleCorsPreflight } from "@/lib/cors";

// GET: Fetch teachers with optional filters
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const available = searchParams.get("available");
    const specialization = searchParams.get("specialization");

    // Get current user's data
    const userRef = ref(database, `users/${session.user.id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.val();

    // Only admin can access teacher data
    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users from Firebase
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      return NextResponse.json({ teachers: [] });
    }

    const allUsers = usersSnapshot.val();
    let teachers: any[] = [];

    Object.keys(allUsers).forEach((userId) => {
      const user = allUsers[userId];

      if (user.role === "ustad") {
        teachers.push({
          id: userId,
          name: user.name,
          email: user.email,
          specialization: user.specialization || "",
          phone: user.phone || "",
          createdAt: user.createdAt,
        });
      }
    });

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      teachers = teachers.filter(
        (teacher) =>
          teacher.name.toLowerCase().includes(searchLower) ||
          teacher.email.toLowerCase().includes(searchLower) ||
          teacher.specialization.toLowerCase().includes(searchLower)
      );
    }

    if (specialization) {
      teachers = teachers.filter((teacher) =>
        teacher.specialization
          .toLowerCase()
          .includes(specialization.toLowerCase())
      );
    }

    // If availability filter is requested, get current workload
    if (available === "true") {
      const classesRef = ref(database, "classes");
      const classesSnapshot = await get(classesRef);

      if (classesSnapshot.exists()) {
        const classes = classesSnapshot.val();
        const teacherWorkload: Record<string, number> = {};

        Object.values(classes).forEach((classData: any) => {
          if (classData.ustadId) {
            teacherWorkload[classData.ustadId] =
              (teacherWorkload[classData.ustadId] || 0) + 1;
          }
        });

        teachers = teachers.map((teacher) => ({
          ...teacher,
          currentClasses: teacherWorkload[teacher.id] || 0,
          available: (teacherWorkload[teacher.id] || 0) < 10, // Max 10 classes per teacher
        }));
      } else {
        teachers = teachers.map((teacher) => ({
          ...teacher,
          currentClasses: 0,
          available: true,
        }));
      }
    }

    const response = NextResponse.json({
      teachers,
      total: teachers.length,
    });

    return addCorsHeaders(response);
  } catch (error) {
    console.error("[USTAD API] Error fetching teachers:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );

    return addCorsHeaders(response);
  }
}
