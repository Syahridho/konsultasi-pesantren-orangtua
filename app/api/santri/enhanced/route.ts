import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, update, remove, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { z } from "zod";

// Validation schemas
const createSantriSchema = z.object({
  name: z.string().min(1, "Nama santri wajib diisi"),
  nis: z.string().min(1, "NIS wajib diisi"),
  gender: z.enum(["L", "P"], { message: "Jenis kelamin harus L atau P" }),
  tempatLahir: z.string().min(1, "Tempat lahir wajib diisi"),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  tahunDaftar: z.string().min(1, "Tahun daftar wajib diisi"),
  orangTuaId: z.string().min(1, "ID orang tua wajib dipilih"),
});

const updateSantriSchema = z.object({
  name: z.string().min(1, "Nama santri wajib diisi").optional(),
  nis: z.string().min(1, "NIS wajib diisi").optional(),
  gender: z
    .enum(["L", "P"], { message: "Jenis kelamin harus L atau P" })
    .optional(),
  tempatLahir: z.string().min(1, "Tempat lahir wajib diisi").optional(),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi").optional(),
  tahunDaftar: z.string().min(1, "Tahun daftar wajib diisi").optional(),
});

// Helper function to normalize student data from different formats
function normalizeStudentData(user: any, userId?: string) {
  const students: any[] = [];

  if (user.students && Array.isArray(user.students)) {
    // Handle array format
    user.students.forEach((student: any, index: number) => {
      students.push({
        id: `array-${userId || "unknown"}-${index}`,
        ...student,
        _source: "array",
      });
    });
  } else if (user.santri && typeof user.santri === "object") {
    // Handle object format
    Object.keys(user.santri).forEach((studentId) => {
      students.push({
        id: studentId,
        ...user.santri[studentId],
        _source: "object",
      });
    });
  }

  return students;
}

// Helper function to get all parents
async function getAllParents() {
  const usersRef = ref(database, "users");
  const usersSnapshot = await get(usersRef);

  if (!usersSnapshot.exists()) {
    return [];
  }

  const allUsers = usersSnapshot.val();
  const parents: any[] = [];

  Object.keys(allUsers).forEach((userId) => {
    const user = allUsers[userId];
    if (user.role === "orangtua") {
      parents.push({
        id: userId,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      });
    }
  });

  return parents;
}

// GET: Fetch all santri with enhanced data structure
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("[ENHANCED SANTRI API] No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[ENHANCED SANTRI API] Session found:", {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      console.log(
        "[ENHANCED SANTRI API] User not found in database:",
        session.user.id
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();
    console.log("[ENHANCED SANTRI API] User data from Firebase:", {
      role: userData.role,
      name: userData.name,
    });

    // Get all users from Firebase
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      console.log("[ENHANCED SANTRI API] No users found in database");
      return NextResponse.json({ santriList: [], parents: [] });
    }

    const allUsers = usersSnapshot.val();
    const santriList: any[] = [];
    const parents = await getAllParents();
    let userRoles: { [key: string]: string } = {};
    let orangtuaCount = 0;
    let totalSantriCount = 0;

    console.log(
      "[ENHANCED SANTRI API] Processing users to find santri data..."
    );

    // Role-based data access
    if (userData.role === "admin" || userData.role === "ustad") {
      // Admin and Ustad can see all students
      Object.keys(allUsers).forEach((userId) => {
        const user = allUsers[userId];
        userRoles[userId] = user.role;

        if (user.role === "orangtua") {
          orangtuaCount++;
          console.log(
            `[ENHANCED SANTRI API] Processing orangtua: ${user.name} (${userId})`
          );

          const students = normalizeStudentData(user, userId);
          console.log(
            `[ENHANCED SANTRI API] Found ${students.length} santri for ${user.name}`
          );

          students.forEach((student) => {
            totalSantriCount++;
            console.log(
              `[ENHANCED SANTRI API] Adding santri: ${student.name} (${student.id})`
            );

            santriList.push({
              id: student.id,
              userId: userId,
              name: student.name,
              nis: student.nis || "",
              jenisKelamin: student.gender || student.jenisKelamin || "",
              tempatLahir: student.tempatLahir || "",
              tanggalLahir: student.tanggalLahir || "",
              tahunDaftar: student.tahunDaftar || "",
              createdAt: student.createdAt || user.createdAt,
              orangTuaId: userId,
              orangTuaName: user.name,
              orangTuaEmail: user.email,
              orangTuaPhone: user.phone || "",
              dataSource: student._source,
            });
          });
        }
      });
    } else if (userData.role === "orangtua") {
      // Orangtua can only see their own students
      const students = normalizeStudentData(userData, session.user.id);
      students.forEach((student) => {
        totalSantriCount++;
        santriList.push({
          id: student.id,
          userId: session.user.id,
          name: student.name,
          nis: student.nis || "",
          jenisKelamin: student.gender || student.jenisKelamin || "",
          tempatLahir: student.tempatLahir || "",
          tanggalLahir: student.tanggalLahir || "",
          tahunDaftar: student.tahunDaftar || "",
          createdAt: student.createdAt || userData.createdAt,
          orangTuaId: session.user.id,
          orangTuaName: userData.name,
          orangTuaEmail: userData.email,
          orangTuaPhone: userData.phone || "",
          dataSource: student._source,
        });
      });
    }

    console.log(
      `[ENHANCED SANTRI API] Summary: Found ${orangtuaCount} orangtua with ${totalSantriCount} total santri`
    );
    console.log(
      `[ENHANCED SANTRI API] Returning ${santriList.length} santri records`
    );

    return NextResponse.json({
      santriList,
      parents,
      debug: {
        totalUsers: Object.keys(allUsers).length,
        userRoles,
        orangtuaCount,
        totalSantriCount,
        returnedSantriCount: santriList.length,
        currentUserRole: userData.role,
      },
    });
  } catch (error) {
    console.error("[ENHANCED SANTRI API] Error fetching santri data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new santri with parent validation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await get(ref(database, `users/${session.user.id}`));
    if (!userData.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUser = userData.val();

    // Only admin and ustad can create students for any parent
    // Orangtua can only create students for themselves
    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "ustad" &&
      currentUser.role !== "orangtua"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[ENHANCED SANTRI API] Creating santri with data:", body);

    // Validate input
    const validatedData = createSantriSchema.parse(body);

    // Verify parent exists
    const parentRef = ref(database, `users/${validatedData.orangTuaId}`);
    const parentSnapshot = await get(parentRef);

    if (!parentSnapshot.exists()) {
      return NextResponse.json(
        { error: "Orang tua tidak ditemukan" },
        { status: 404 }
      );
    }

    const parentData = parentSnapshot.val();
    if (parentData.role !== "orangtua") {
      return NextResponse.json(
        { error: "User yang dipilih bukan orang tua" },
        { status: 400 }
      );
    }

    // Check if orangtua can have more students (optional business logic)
    const currentStudents = normalizeStudentData(
      parentData,
      validatedData.orangTuaId
    );
    console.log(
      `[ENHANCED SANTRI API] Parent currently has ${currentStudents.length} students`
    );

    // Create new santri
    const newSantriRef = push(
      ref(database, `users/${validatedData.orangTuaId}/santri`)
    );
    const santriId = newSantriRef.key;

    const santriData = {
      name: validatedData.name,
      nis: validatedData.nis,
      gender: validatedData.gender,
      tempatLahir: validatedData.tempatLahir,
      tanggalLahir: validatedData.tanggalLahir,
      tahunDaftar: validatedData.tahunDaftar,
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
      createdByName: currentUser.name,
    };

    await set(newSantriRef, santriData);

    console.log("[ENHANCED SANTRI API] Successfully created santri:", santriId);

    return NextResponse.json({
      message: "Santri berhasil ditambahkan",
      santriId,
      santriData: {
        id: santriId,
        ...santriData,
        orangTuaId: validatedData.orangTuaId,
        orangTuaName: parentData.name,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("[ENHANCED SANTRI API] Validation error:", error.issues);
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[ENHANCED SANTRI API] Error creating santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update santri
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const santriId = searchParams.get("id");
    const orangTuaId = searchParams.get("orangTuaId");

    if (!santriId || !orangTuaId) {
      return NextResponse.json(
        { error: "ID santri dan ID orang tua wajib diisi" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateSantriSchema.parse(body);

    // Verify parent exists
    const parentRef = ref(database, `users/${orangTuaId}`);
    const parentSnapshot = await get(parentRef);

    if (!parentSnapshot.exists()) {
      return NextResponse.json(
        { error: "Orang tua tidak ditemukan" },
        { status: 404 }
      );
    }

    // Update santri
    const santriRef = ref(database, `users/${orangTuaId}/santri/${santriId}`);
    const santriSnapshot = await get(santriRef);

    if (!santriSnapshot.exists()) {
      return NextResponse.json(
        { error: "Santri tidak ditemukan" },
        { status: 404 }
      );
    }

    const updateData = {
      ...validatedData,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.id,
      updatedByName: (
        await get(ref(database, `users/${session.user.id}`))
      ).val().name,
    };

    await update(santriRef, updateData);

    return NextResponse.json({
      message: "Data santri berhasil diperbarui",
      santriId,
      updateData,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[ENHANCED SANTRI API] Error updating santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete santri
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const santriId = searchParams.get("id");
    const orangTuaId = searchParams.get("orangTuaId");

    if (!santriId || !orangTuaId) {
      return NextResponse.json(
        { error: "ID santri dan ID orang tua wajib diisi" },
        { status: 400 }
      );
    }

    // Verify santri exists
    const santriRef = ref(database, `users/${orangTuaId}/santri/${santriId}`);
    const santriSnapshot = await get(santriRef);

    if (!santriSnapshot.exists()) {
      return NextResponse.json(
        { error: "Santri tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete santri
    await remove(santriRef);

    console.log("[ENHANCED SANTRI API] Successfully deleted santri:", santriId);

    return NextResponse.json({
      message: "Santri berhasil dihapus",
      santriId,
    });
  } catch (error) {
    console.error("[ENHANCED SANTRI API] Error deleting santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
