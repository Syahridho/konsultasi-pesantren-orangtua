import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, update, remove, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { z } from "zod";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";

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

// GET: Fetch all santri with enhanced data structure (NEW FORMAT + backward compatibility)
export async function GET(request: NextRequest) {
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
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("[ENHANCED SANTRI API] No session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
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
      return NextResponse.json(
        { santriList: [], parents: [] },
        { headers: corsHeaders }
      );
    }

    const allUsers = usersSnapshot.val();
    const santriList: any[] = [];
    const parents = await getAllParents();
    let totalSantriCount = 0;
    let newFormatCount = 0;
    let oldFormatCount = 0;

    console.log(
      "[ENHANCED SANTRI API] Processing users to find santri data..."
    );

    // Role-based data access
    if (userData.role === "admin" || userData.role === "ustad") {
      // Admin and Ustad can see all students

      // PRIORITY 1: NEW FORMAT - users with role="santri"
      Object.keys(allUsers).forEach((userId) => {
        const user = allUsers[userId];

        if (user.role === "santri") {
          newFormatCount++;

          // Get parent info
          let parentData = null;
          if (user.parentId && allUsers[user.parentId]) {
            parentData = allUsers[user.parentId];
          }

          santriList.push({
            id: userId,
            name: user.name,
            nis: user.nis || "",
            jenisKelamin: user.gender || "",
            tempatLahir: user.tempatLahir || "",
            tanggalLahir: user.tanggalLahir || "",
            tahunDaftar: user.entryYear || "",
            createdAt: user.createdAt || "",
            orangTuaId: user.parentId || "",
            orangTuaName: parentData ? parentData.name : "Tidak ada",
            orangTuaEmail: parentData ? parentData.email : "",
            orangTuaPhone: parentData ? parentData.phone || "" : "",
            dataSource: "new_format",
          });
          totalSantriCount++;
        }
      });

      // FALLBACK: OLD FORMAT - embedded santri data
      Object.keys(allUsers).forEach((userId) => {
        const user = allUsers[userId];

        if (user.role === "orangtua") {
          const students = normalizeStudentData(user, userId);

          students.forEach((student) => {
            oldFormatCount++;

            santriList.push({
              id: student.id,
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
            totalSantriCount++;
          });
        }
      });
    } else if (userData.role === "orangtua") {
      // Orangtua can only see their own students

      // NEW FORMAT: Check studentIds array
      if (userData.studentIds && Array.isArray(userData.studentIds)) {
        userData.studentIds.forEach((studentId: string) => {
          if (allUsers[studentId] && allUsers[studentId].role === "santri") {
            const student = allUsers[studentId];
            newFormatCount++;

            santriList.push({
              id: studentId,
              name: student.name,
              nis: student.nis || "",
              jenisKelamin: student.gender || "",
              tempatLahir: student.tempatLahir || "",
              tanggalLahir: student.tanggalLahir || "",
              tahunDaftar: student.entryYear || "",
              createdAt: student.createdAt || "",
              orangTuaId: session.user.id,
              orangTuaName: userData.name,
              orangTuaEmail: userData.email,
              orangTuaPhone: userData.phone || "",
              dataSource: "new_format",
            });
            totalSantriCount++;
          }
        });
      }

      // OLD FORMAT: Check embedded students/santri
      const students = normalizeStudentData(userData, session.user.id);
      students.forEach((student) => {
        oldFormatCount++;

        santriList.push({
          id: student.id,
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
        totalSantriCount++;
      });
    }

    console.log(
      `[ENHANCED SANTRI API] Summary: Found ${totalSantriCount} total santri (${newFormatCount} new format, ${oldFormatCount} old format)`
    );

    return NextResponse.json(
      {
        santriList,
        parents,
        debug: {
          totalUsers: Object.keys(allUsers).length,
          totalSantriCount,
          newFormatCount,
          oldFormatCount,
          returnedSantriCount: santriList.length,
          currentUserRole: userData.role,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[ENHANCED SANTRI API] Error fetching santri data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Create new santri with parent validation (NEW FORMAT)
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

    // NEW FORMAT: Create santri as separate user in root users/
    const usersRef = ref(database, `users`);
    const newSantriRef = push(usersRef);
    const santriId = newSantriRef.key!;

    const santriData = {
      id: santriId,
      name: validatedData.name,
      email: `santri_${santriId}@pesantren.local`, // Dummy email for display
      role: "santri",
      nis: validatedData.nis,
      entryYear: validatedData.tahunDaftar,
      status: "active",
      phone: "",
      gender: validatedData.gender,
      tempatLahir: validatedData.tempatLahir,
      tanggalLahir: validatedData.tanggalLahir,
      parentId: validatedData.orangTuaId, // Link to parent
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: session.user.id,
      createdByName: currentUser.name,
    };

    // Save santri to database as separate user
    await set(newSantriRef, santriData);

    // Update parent's studentIds array
    const currentStudentIds = parentData.studentIds || [];
    const updatedStudentIds = [...currentStudentIds, santriId];

    await update(parentRef, {
      studentIds: updatedStudentIds,
      updatedAt: new Date().toISOString(),
    });

    console.log("[ENHANCED SANTRI API] Successfully created santri:", santriId);

    return NextResponse.json({
      message: "Santri berhasil ditambahkan",
      santriId,
      santriData: {
        ...santriData,
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

// PUT: Update santri (NEW FORMAT + backward compatibility)
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

    // Get current user name for update tracking
    const currentUserName = (
      await get(ref(database, `users/${session.user.id}`))
    ).val().name;

    // Try NEW FORMAT first: santri as separate user
    const santriUserRef = ref(database, `users/${santriId}`);
    const santriUserSnapshot = await get(santriUserRef);

    if (santriUserSnapshot.exists()) {
      const santriData = santriUserSnapshot.val();

      // Verify this santri belongs to current parent
      if (santriData.role === "santri" && santriData.parentId === orangTuaId) {
        const updateData = {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.nis && { nis: validatedData.nis }),
          ...(validatedData.gender && { gender: validatedData.gender }),
          ...(validatedData.tempatLahir && {
            tempatLahir: validatedData.tempatLahir,
          }),
          ...(validatedData.tanggalLahir && {
            tanggalLahir: validatedData.tanggalLahir,
          }),
          ...(validatedData.tahunDaftar && {
            entryYear: validatedData.tahunDaftar,
          }),
          updatedAt: new Date().toISOString(),
          updatedBy: session.user.id,
          updatedByName: currentUserName,
        };

        await update(santriUserRef, updateData);

        return NextResponse.json({
          message: "Data santri berhasil diperbarui",
          santriId,
          updateData,
        });
      }
    }

    // Fallback to OLD FORMAT: embedded santri data
    const santriEmbeddedRef = ref(
      database,
      `users/${orangTuaId}/santri/${santriId}`
    );
    const santriEmbeddedSnapshot = await get(santriEmbeddedRef);

    if (santriEmbeddedSnapshot.exists()) {
      const updateData = {
        ...validatedData,
        updatedAt: new Date().toISOString(),
        updatedBy: session.user.id,
        updatedByName: currentUserName,
      };

      await update(santriEmbeddedRef, updateData);

      return NextResponse.json({
        message: "Data santri berhasil diperbarui",
        santriId,
        updateData,
      });
    }

    return NextResponse.json(
      { error: "Santri tidak ditemukan" },
      { status: 404 }
    );
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

// DELETE: Delete santri (NEW FORMAT + backward compatibility)
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

    // Try NEW FORMAT first: santri as separate user
    const santriUserRef = ref(database, `users/${santriId}`);
    const santriUserSnapshot = await get(santriUserRef);

    if (santriUserSnapshot.exists()) {
      const santriData = santriUserSnapshot.val();

      // Verify this santri belongs to current parent
      if (santriData.role === "santri" && santriData.parentId === orangTuaId) {
        // Delete santri user
        await remove(santriUserRef);

        // Remove from parent's studentIds
        const parentRef = ref(database, `users/${orangTuaId}`);
        const parentSnapshot = await get(parentRef);

        if (parentSnapshot.exists()) {
          const parentData = parentSnapshot.val();
          const currentStudentIds = parentData.studentIds || [];
          const updatedStudentIds = currentStudentIds.filter(
            (id: string) => id !== santriId
          );

          await update(parentRef, {
            studentIds: updatedStudentIds,
            updatedAt: new Date().toISOString(),
          });
        }

        console.log(
          "[ENHANCED SANTRI API] Successfully deleted santri:",
          santriId
        );

        return NextResponse.json({
          message: "Santri berhasil dihapus",
          santriId,
        });
      }
    }

    // Fallback to OLD FORMAT: embedded santri data
    const santriEmbeddedRef = ref(
      database,
      `users/${orangTuaId}/santri/${santriId}`
    );
    const santriEmbeddedSnapshot = await get(santriEmbeddedRef);

    if (santriEmbeddedSnapshot.exists()) {
      // Delete santri
      await remove(santriEmbeddedRef);

      console.log(
        "[ENHANCED SANTRI API] Successfully deleted santri (old format):",
        santriId
      );

      return NextResponse.json({
        message: "Santri berhasil dihapus",
        santriId,
      });
    }

    return NextResponse.json(
      { error: "Santri tidak ditemukan" },
      { status: 404 }
    );
  } catch (error) {
    console.error("[ENHANCED SANTRI API] Error deleting santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
