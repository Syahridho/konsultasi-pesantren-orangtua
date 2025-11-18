import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, update, remove, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { z } from "zod";

// Validation schemas
const academicReportSchema = z.object({
  studentId: z.string().min(1, "ID Santri wajib diisi"),
  subject: z.string().min(1, "Mata pelajaran wajib diisi"),
  gradeType: z.enum(["number", "letter", "description"]),
  gradeNumber: z.number().min(0).max(100).optional(),
  gradeLetter: z.enum(["A", "B", "C", "D", "E"]).optional(),
  gradeDescription: z.string().optional(),
  semester: z.string().min(1, "Semester wajib diisi"),
  academicYear: z.string().min(4, "Tahun akademik tidak valid"),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

const updateAcademicReportSchema = academicReportSchema.partial();

// Helper function to check if ustad has access to student
async function canAccessStudent(ustadId: string, studentId: string) {
  // Check if ustad is assigned to a class that contains the student
  const classesRef = ref(database, "classes");
  const classesSnapshot = await get(classesRef);

  if (!classesSnapshot.exists()) {
    return false;
  }

  const classes = classesSnapshot.val();

  for (const classId of Object.keys(classes)) {
    const classData = classes[classId];

    // Check if ustad is assigned to this class
    if (classData.ustadId === ustadId) {
      // Check if student is enrolled in this class
      if (classData.studentIds && classData.studentIds[studentId]) {
        return true;
      }
    }
  }

  return false;
}

// GET: Fetch academic reports with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const subject = searchParams.get("subject");
    const semester = searchParams.get("semester");
    const academicYear = searchParams.get("academicYear");
    const ustadId = searchParams.get("ustadId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get current user's data
    const userRef = ref(database, `users/${session.user.id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.val();

    // Check authorization
    if (userData.role !== "admin" && userData.role !== "ustad") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get academic reports from Firebase
    const reportsRef = ref(database, "academicReports");
    const reportsSnapshot = await get(reportsRef);

    if (!reportsSnapshot.exists()) {
      return NextResponse.json({ reports: [], total: 0 });
    }

    const reports = reportsSnapshot.val();
    let reportList: any[] = [];

    for (const reportId of Object.keys(reports)) {
      const reportData = reports[reportId];

      // Apply filters
      if (studentId && reportData.studentId !== studentId) continue;
      if (subject && reportData.subject !== subject) continue;
      if (semester && reportData.semester !== semester) continue;
      if (academicYear && reportData.academicYear !== academicYear) continue;
      if (ustadId && reportData.ustadId !== ustadId) continue;

      // If user is ustad, only show their reports
      if (userData.role === "ustad" && reportData.ustadId !== session.user.id) {
        continue;
      }

      reportList.push({
        id: reportId,
        ...reportData,
      });
    }

    // Sort by creation date (newest first)
    reportList.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReports = reportList.slice(startIndex, endIndex);

    return NextResponse.json({
      reports: paginatedReports,
      total: reportList.length,
      page,
      limit,
      totalPages: Math.ceil(reportList.length / limit),
    });
  } catch (error) {
    console.error("[ACADEMIC REPORTS API] Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new academic report
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

    // Only ustad can create academic reports
    if (userData.role !== "ustad" && userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[ACADEMIC REPORTS API] Creating report with data:", body);

    // Validate input
    const validatedData = academicReportSchema.parse(body);

    // Check if ustad has access to this student
    if (userData.role === "ustad") {
      const canAccess = await canAccessStudent(
        session.user.id,
        validatedData.studentId
      );
      if (!canAccess) {
        return NextResponse.json(
          { error: "Anda tidak memiliki akses ke santri ini" },
          { status: 403 }
        );
      }
    }

    // Verify student exists
    const studentRef = ref(database, `users/${validatedData.studentId}`);
    const studentSnapshot = await get(studentRef);

    if (!studentSnapshot.exists()) {
      return NextResponse.json(
        { error: "Santri tidak ditemukan" },
        { status: 404 }
      );
    }

    const studentData = studentSnapshot.val();
    if (studentData.role !== "santri") {
      return NextResponse.json(
        { error: "User yang dipilih bukan santri" },
        { status: 400 }
      );
    }

    // Create new academic report
    const newReportRef = push(ref(database, "academicReports"));
    const reportId = newReportRef.key;

    const reportData = {
      ...validatedData,
      ustadId: session.user.id,
      ustadName: userData.name,
      studentName: studentData.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await set(newReportRef, reportData);

    console.log(
      "[ACADEMIC REPORTS API] Successfully created report:",
      reportId
    );

    return NextResponse.json({
      message: "Laporan akademik berhasil dibuat",
      reportId,
      reportData: {
        id: reportId,
        ...reportData,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("[ACADEMIC REPORTS API] Validation error:", error.issues);
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[ACADEMIC REPORTS API] Error creating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update academic report
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json(
        { error: "ID laporan wajib diisi" },
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

    // Only ustad and admin can update reports
    if (userData.role !== "ustad" && userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateAcademicReportSchema.parse(body);

    // Verify report exists
    const reportRef = ref(database, `academicReports/${reportId}`);
    const reportSnapshot = await get(reportRef);

    if (!reportSnapshot.exists()) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan" },
        { status: 404 }
      );
    }

    const reportData = reportSnapshot.val();

    // Check permissions: ustad can only update their own reports, admin can update any
    if (userData.role === "ustad" && reportData.ustadId !== session.user.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat mengedit laporan ini" },
        { status: 403 }
      );
    }

    // Create audit trail entry
    const auditRef = push(
      ref(database, `academicReports/${reportId}/auditTrail`)
    );
    await set(auditRef, {
      action: "update",
      previousData: reportData,
      updatedBy: session.user.id,
      updatedByName: userData.name || "",
      updatedAt: new Date().toISOString(),
    });

    // Update report data
    const updateData = {
      ...validatedData,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.id,
      updatedByName: userData.name || "",
    };

    await update(reportRef, updateData);

    return NextResponse.json({
      message: "Laporan akademik berhasil diperbarui",
      reportId,
      updateData,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[ACADEMIC REPORTS API] Error updating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete academic report
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json(
        { error: "ID laporan wajib diisi" },
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

    // Only ustad and admin can delete reports
    if (userData.role !== "ustad" && userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify report exists
    const reportRef = ref(database, `academicReports/${reportId}`);
    const reportSnapshot = await get(reportRef);

    if (!reportSnapshot.exists()) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan" },
        { status: 404 }
      );
    }

    const reportData = reportSnapshot.val();

    // Check permissions: ustad can only delete their own reports, admin can delete any
    if (userData.role === "ustad" && reportData.ustadId !== session.user.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus laporan ini" },
        { status: 403 }
      );
    }

    // Create audit trail entry before deletion
    const auditRef = push(ref(database, `deletedReports/academic`));
    await set(auditRef, {
      originalReportId: reportId,
      reportData: reportData,
      deletedBy: session.user.id,
      deletedByName: userData.name || "",
      deletedAt: new Date().toISOString(),
    });

    // Delete report
    await remove(reportRef);

    console.log(
      "[ACADEMIC REPORTS API] Successfully deleted report:",
      reportId
    );

    return NextResponse.json({
      message: "Laporan akademik berhasil dihapus",
      reportId,
    });
  } catch (error) {
    console.error("[ACADEMIC REPORTS API] Error deleting report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
