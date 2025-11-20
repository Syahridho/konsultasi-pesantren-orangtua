import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, update, remove, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { z } from "zod";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";

// Validation schemas
const createClassSchema = z.object({
  name: z
    .string()
    .min(3, "Nama kelas minimal 3 karakter")
    .max(50, "Nama kelas maksimal 50 karakter"),
  academicYear: z.string().min(4, "Tahun akademik tidak valid"),
  ustadId: z.string().min(1, "Pengajar wajib dipilih"),
  schedule: z.object({
    days: z.array(z.string()).min(1, "Pilih minimal 1 hari"),
    startTime: z.string().min(1, "Waktu mulai wajib diisi"),
    endTime: z.string().min(1, "Waktu selesai wajib diisi"),
  }),
  studentIds: z.array(z.string()).min(1, "Pilih minimal 1 santri"),
});

const updateClassSchema = z.object({
  name: z
    .string()
    .min(3, "Nama kelas minimal 3 karakter")
    .max(50, "Nama kelas maksimal 50 karakter")
    .optional(),
  academicYear: z.string().min(4, "Tahun akademik tidak valid").optional(),
  ustadId: z.string().min(1, "Pengajar wajib dipilih").optional(),
  schedule: z
    .object({
      days: z.array(z.string()).min(1, "Pilih minimal 1 hari"),
      startTime: z.string().min(1, "Waktu mulai wajib diisi"),
      endTime: z.string().min(1, "Waktu selesai wajib diisi"),
    })
    .optional(),
  studentIds: z.array(z.string()).optional(),
});

// Helper function to check schedule conflicts
async function checkScheduleConflict(
  ustadId: string,
  schedule: any,
  excludeClassId?: string
) {
  const classesRef = ref(database, "classes");
  const classesSnapshot = await get(classesRef);

  if (!classesSnapshot.exists()) {
    return false;
  }

  const classes = classesSnapshot.val();

  for (const classId of Object.keys(classes)) {
    if (excludeClassId && classId === excludeClassId) continue;

    const classData = classes[classId];
    if (classData.ustadId !== ustadId) continue;

    // Check if schedules overlap
    const hasDayOverlap = schedule.days.some((day: string) =>
      classData.schedule?.days?.includes(day)
    );

    if (hasDayOverlap) {
      // Check time overlap
      const newStart = schedule.startTime;
      const newEnd = schedule.endTime;
      const existingStart = classData.schedule?.startTime;
      const existingEnd = classData.schedule?.endTime;

      if (newStart < existingEnd && newEnd > existingStart) {
        return {
          conflict: true,
          className: classData.name,
          conflictSchedule: classData.schedule,
        };
      }
    }
  }

  return false;
}

// Helper function to get available teachers
async function getAvailableTeachers() {
  const usersRef = ref(database, "users");
  const usersSnapshot = await get(usersRef);

  if (!usersSnapshot.exists()) {
    return [];
  }

  const allUsers = usersSnapshot.val();
  const teachers: any[] = [];

  Object.keys(allUsers).forEach((userId) => {
    const user = allUsers[userId];
    if (user.role === "ustad") {
      teachers.push({
        id: userId,
        name: user.name,
        email: user.email,
        specialization: user.specialization || "",
        phone: user.phone || "",
      });
    }
  });

  return teachers;
}

// Helper function to get students with filters
async function getStudents(filters: {
  entryYear?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const usersRef = ref(database, "users");
  const usersSnapshot = await get(usersRef);

  if (!usersSnapshot.exists()) {
    return { students: [], total: 0 };
  }

  const allUsers = usersSnapshot.val();
  let students: any[] = [];

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
      });
    }
  });

  // Apply filters
  if (filters.entryYear && filters.entryYear !== "all") {
    students = students.filter(
      (student) => student.entryYear === filters.entryYear
    );
  }

  if (filters.status && filters.status !== "all") {
    students = students.filter((student) => student.status === filters.status);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    students = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower)
    );
  }

  const total = students.length;

  // Apply pagination
  if (filters.page && filters.limit) {
    const start = (filters.page - 1) * filters.limit;
    students = students.slice(start, start + filters.limit);
  }

  return { students, total };
}

// GET: Fetch classes with optional filters
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log("[CLASSES API] GET request started");

  // Add CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  // Handle preflight requests
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    const sessionStartTime = Date.now();
    const session = await getServerSession(authOptions);
    console.log(
      `[CLASSES API] Session check took ${Date.now() - sessionStartTime}ms`
    );

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear");
    const ustadId = searchParams.get("ustadId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    console.log(
      `[CLASSES API] Filters: academicYear=${academicYear}, ustadId=${ustadId}, page=${page}, limit=${limit}`
    );

    // Get current user's data
    const userStartTime = Date.now();
    const userRef = ref(database, `users/${session.user.id}`);
    const userSnapshot = await get(userRef);
    console.log(
      `[CLASSES API] User data fetch took ${Date.now() - userStartTime}ms`
    );

    if (!userSnapshot.exists()) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const userData = userSnapshot.val();

    // Check authorization
    // Admin can access all classes
    // Ustad can only access their own classes
    if (userData.role !== "admin" && userData.role !== "ustad") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get classes from Firebase
    const classesStartTime = Date.now();
    const classesRef = ref(database, "classes");
    const classesSnapshot = await get(classesRef);
    console.log(
      `[CLASSES API] Classes data fetch took ${Date.now() - classesStartTime}ms`
    );

    if (!classesSnapshot.exists()) {
      console.log(
        `[CLASSES API] Total request time: ${
          Date.now() - startTime
        }ms (no classes found)`
      );
      return NextResponse.json(
        { classes: [], total: 0 },
        { headers: corsHeaders }
      );
    }

    const classes = classesSnapshot.val();
    console.log(
      `[CLASSES API] Found ${Object.keys(classes).length} classes in database`
    );

    const processStartTime = Date.now();
    let classList: any[] = [];

    Object.keys(classes).forEach((classId) => {
      const classData = classes[classId];

      // If user is ustad, only show their classes
      if (userData.role === "ustad" && classData.ustadId !== session.user.id) {
        return;
      }

      // Apply filters
      if (academicYear && classData.academicYear !== academicYear) return;
      if (ustadId && classData.ustadId !== ustadId) return;

      classList.push({
        id: classId,
        ...classData,
        studentCount: classData.studentIds
          ? Object.keys(classData.studentIds).length
          : 0,
      });
    });

    console.log(
      `[CLASSES API] Data processing took ${Date.now() - processStartTime}ms`
    );
    console.log(`[CLASSES API] Returning ${classList.length} filtered classes`);
    console.log(
      `[CLASSES API] Total request time: ${Date.now() - startTime}ms`
    );

    // Apply pagination if requested
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedClasses = classList.slice(startIndex, endIndex);

    console.log(
      `[CLASSES API] Pagination: returning ${paginatedClasses.length} of ${
        classList.length
      } classes (page ${page} of ${Math.ceil(classList.length / limit)})`
    );

    return NextResponse.json(
      {
        classes: paginatedClasses,
        total: classList.length,
        page,
        limit,
        totalPages: Math.ceil(classList.length / limit),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[CLASSES API] Error fetching classes:", error);
    console.log(
      `[CLASSES API] Failed request time: ${Date.now() - startTime}ms`
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Create new class
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's data
    const userRef = ref(database, `users/${session.user.id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.val();

    // Only admin can create classes
    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[CLASSES API] Creating class with data:", body);

    // Validate input
    const validatedData = createClassSchema.parse(body);

    // Check if teacher exists and is valid
    const teacherRef = ref(database, `users/${validatedData.ustadId}`);
    const teacherSnapshot = await get(teacherRef);

    if (!teacherSnapshot.exists()) {
      return NextResponse.json(
        { error: "Pengajar tidak ditemukan" },
        { status: 404 }
      );
    }

    const teacherData = teacherSnapshot.val();
    if (teacherData.role !== "ustad") {
      return NextResponse.json(
        { error: "User yang dipilih bukan pengajar" },
        { status: 400 }
      );
    }

    // Check for schedule conflicts
    const scheduleConflict = await checkScheduleConflict(
      validatedData.ustadId,
      validatedData.schedule
    );

    if (scheduleConflict) {
      return NextResponse.json(
        {
          error: "Jadwal bertentangan dengan kelas lain",
          conflict: scheduleConflict,
        },
        { status: 409 }
      );
    }

    // Check for duplicate class (same name + year + teacher)
    const classesRef = ref(database, "classes");
    const classesSnapshot = await get(classesRef);

    if (classesSnapshot.exists()) {
      const classes = classesSnapshot.val();
      const duplicate = Object.values(classes).find(
        (classData: any) =>
          classData.name === validatedData.name &&
          classData.academicYear === validatedData.academicYear &&
          classData.ustadId === validatedData.ustadId
      );

      if (duplicate) {
        return NextResponse.json(
          {
            error:
              "Kelas dengan nama, tahun akademik, dan pengajar yang sama sudah ada",
          },
          { status: 409 }
        );
      }
    }

    // Create new class
    const newClassRef = push(ref(database, "classes"));
    const classId = newClassRef.key;

    const classData = {
      name: validatedData.name,
      academicYear: validatedData.academicYear,
      ustadId: validatedData.ustadId,
      ustadName: teacherData.name,
      schedule: validatedData.schedule,
      studentIds: validatedData.studentIds.reduce((acc, studentId) => {
        acc[studentId] = {
          enrolledAt: new Date().toISOString(),
          status: "active",
        };
        return acc;
      }, {} as Record<string, any>),
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
      createdByName: userData.name,
      status: "active",
    };

    await set(newClassRef, classData);

    console.log("[CLASSES API] Successfully created class:", classId);

    return NextResponse.json({
      message: "Kelas berhasil dibuat",
      classId,
      classData: {
        id: classId,
        ...classData,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("[CLASSES API] Validation error:", error.issues);
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[CLASSES API] Error creating class:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update class
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("id");

    if (!classId) {
      return NextResponse.json(
        { error: "ID kelas wajib diisi" },
        { status: 400 }
      );
    }

    // Get current user's data
    const userRef = ref(database, `users/${session.user.id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.val();

    // Only admin can update classes
    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateClassSchema.parse(body);

    // Verify class exists
    const classRef = ref(database, `classes/${classId}`);
    const classSnapshot = await get(classRef);

    if (!classSnapshot.exists()) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    const classData = classSnapshot.val();

    // Check schedule conflicts if schedule is being updated
    if (validatedData.schedule && validatedData.ustadId) {
      const scheduleConflict = await checkScheduleConflict(
        validatedData.ustadId,
        validatedData.schedule,
        classId
      );

      if (scheduleConflict) {
        return NextResponse.json(
          {
            error: "Jadwal bertentangan dengan kelas lain",
            conflict: scheduleConflict,
          },
          { status: 409 }
        );
      }
    }

    // Update class data
    const updateData = {
      ...validatedData,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.id,
      updatedByName: userData.name,
    };

    await update(classRef, updateData);

    return NextResponse.json({
      message: "Data kelas berhasil diperbarui",
      classId,
      updateData,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[CLASSES API] Error updating class:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete class
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("id");

    if (!classId) {
      return NextResponse.json(
        { error: "ID kelas wajib diisi" },
        { status: 400 }
      );
    }

    // Get current user's data
    const userRef = ref(database, `users/${session.user.id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.val();

    // Only admin can delete classes
    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify class exists
    const classRef = ref(database, `classes/${classId}`);
    const classSnapshot = await get(classRef);

    if (!classSnapshot.exists()) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete class
    await remove(classRef);

    console.log("[CLASSES API] Successfully deleted class:", classId);

    return NextResponse.json({
      message: "Kelas berhasil dihapus",
      classId,
    });
  } catch (error) {
    console.error("[CLASSES API] Error deleting class:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export helper functions for other endpoints
export { getAvailableTeachers, getStudents, checkScheduleConflict };
