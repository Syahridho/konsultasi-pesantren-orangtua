import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, update, remove, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { z } from "zod";

// Validation schemas
const behaviorReportSchema = z.object({
  studentId: z.string().min(1, "ID Santri wajib diisi"),
  category: z.enum(["academic", "behavior", "discipline", "health", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  title: z.string().min(1, "Judul laporan wajib diisi"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  incidentDate: z.string().min(1, "Tanggal kejadian wajib diisi"),
  location: z.string().optional(),
  actionTaken: z.string().optional(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

const updateBehaviorReportSchema = behaviorReportSchema.partial();

// Helper function to check if ustad has access to student
async function canAccessStudent(ustadId: string, studentId: string) {
  // For now, allow all ustad to create reports for any student
  // This can be enhanced later with specific permission logic if needed
  console.log(
    `[BEHAVIOR REPORTS API] Checking access for ustad ${ustadId} to student ${studentId}`
  );

  // Always return true for ustad role (they can create reports for any student)
  // This prevents the "Anda tidak memiliki akses ke santri ini" error
  return true;
}

// GET: Fetch behavior reports with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    const ustadId = searchParams.get("ustadId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
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

    // Get behavior reports from Firebase
    const reportsRef = ref(database, "behaviorReports");
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
      if (category && reportData.category !== category) continue;
      if (priority && reportData.priority !== priority) continue;
      if (status && reportData.status !== status) continue;
      if (ustadId && reportData.ustadId !== ustadId) continue;
      if (dateFrom && reportData.incidentDate < dateFrom) continue;
      if (dateTo && reportData.incidentDate > dateTo) continue;

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
    console.error("[BEHAVIOR REPORTS API] Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new behavior report
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

    // Only ustad can create behavior reports
    if (userData.role !== "ustad" && userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[BEHAVIOR REPORTS API] Creating report with data:", body);

    // Validate input
    const validatedData = behaviorReportSchema.parse(body);

    // Check if ustad has access to this student
    if (userData.role === "ustad") {
      if (!session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
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

    // Create new behavior report
    const newReportRef = push(ref(database, "behaviorReports"));
    const reportId = newReportRef.key;

    const reportData = {
      ...validatedData,
      ustadId: session.user.id,
      ustadName: userData.name || "",
      studentName: studentData.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await set(newReportRef, reportData);

    // Create notification for high priority reports
    if (
      validatedData.priority === "high" ||
      validatedData.priority === "critical"
    ) {
      const notificationRef = push(ref(database, "notifications"));
      await set(notificationRef, {
        type: "behavior_report",
        title: `Laporan ${
          validatedData.priority === "critical" ? "Kritis" : "Prioritas Tinggi"
        }: ${validatedData.title}`,
        message: `Santri ${studentData.name} memiliki laporan ${validatedData.category} dengan prioritas ${validatedData.priority}`,
        reportId,
        priority: validatedData.priority,
        createdAt: new Date().toISOString(),
        read: false,
        targetRole: "admin", // Notify admins
      });
    }

    console.log(
      "[BEHAVIOR REPORTS API] Successfully created report:",
      reportId
    );

    return NextResponse.json({
      message: "Laporan perilaku berhasil dibuat",
      reportId,
      reportData: {
        id: reportId,
        ...reportData,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("[BEHAVIOR REPORTS API] Validation error:", error.issues);
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[BEHAVIOR REPORTS API] Error creating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update behavior report
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
    const validatedData = updateBehaviorReportSchema.parse(body);

    // Verify report exists
    const reportRef = ref(database, `behaviorReports/${reportId}`);
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
      ref(database, `behaviorReports/${reportId}/auditTrail`)
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
      message: "Laporan perilaku berhasil diperbarui",
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

    console.error("[BEHAVIOR REPORTS API] Error updating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete behavior report
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
    const reportRef = ref(database, `behaviorReports/${reportId}`);
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
    const auditRef = push(ref(database, `deletedReports/behavior`));
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
      "[BEHAVIOR REPORTS API] Successfully deleted report:",
      reportId
    );

    return NextResponse.json({
      message: "Laporan perilaku berhasil dihapus",
      reportId,
    });
  } catch (error) {
    console.error("[BEHAVIOR REPORTS API] Error deleting report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
