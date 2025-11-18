import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, update, remove, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { z } from "zod";

// Validation schemas
const notificationSchema = z.object({
  type: z.enum([
    "behavior_report",
    "quran_report",
    "academic_report",
    "system",
  ]),
  title: z.string().min(1, "Judul notifikasi wajib diisi"),
  message: z.string().min(1, "Pesan notifikasi wajib diisi"),
  reportId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  targetRole: z.enum(["admin", "ustad", "orangtua"]).optional(),
  actionUrl: z.string().optional(),
});

// GET: Fetch notifications with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const read = searchParams.get("read");
    const targetRole = searchParams.get("targetRole");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get current user's data
    const userRef = ref(database, `users/${session.user.id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.val();

    // Get notifications from Firebase
    const notificationsRef = ref(database, "notifications");
    const notificationsSnapshot = await get(notificationsRef);

    if (!notificationsSnapshot.exists()) {
      return NextResponse.json({ notifications: [], total: 0 });
    }

    const notifications = notificationsSnapshot.val();
    let notificationList: any[] = [];

    for (const notificationId of Object.keys(notifications)) {
      const notificationData = notifications[notificationId];

      // Apply filters
      if (type && notificationData.type !== type) continue;
      if (priority && notificationData.priority !== priority) continue;
      if (read !== null && notificationData.read.toString() === read) continue;
      if (targetRole && notificationData.targetRole !== targetRole) continue;

      // Filter by user role
      if (
        userData.role === "ustad" &&
        notificationData.targetRole === "admin"
      ) {
        continue;
      }
      if (
        userData.role === "admin" &&
        notificationData.targetRole === "ustad"
      ) {
        continue;
      }

      notificationList.push({
        id: notificationId,
        ...notificationData,
      });
    }

    // Sort by creation date (newest first)
    notificationList.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = notificationList.slice(startIndex, endIndex);

    return NextResponse.json({
      notifications: paginatedNotifications,
      total: notificationList.length,
      page,
      limit,
      totalPages: Math.ceil(notificationList.length / limit),
    });
  } catch (error) {
    console.error("[NOTIFICATIONS API] Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can create notifications
    const userRef = ref(database, `users/${session.user.id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.val();

    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[NOTIFICATIONS API] Creating notification with data:", body);

    // Validate input
    const validatedData = notificationSchema.parse(body);

    // Create new notification
    const newNotificationRef = push(ref(database, "notifications"));
    const notificationId = newNotificationRef.key;

    const notificationData = {
      ...validatedData,
      createdBy: session.user.id,
      createdByName: userData.name || "",
      createdAt: new Date().toISOString(),
      read: false,
    };

    await set(newNotificationRef, notificationData);

    console.log(
      "[NOTIFICATIONS API] Successfully created notification:",
      notificationId
    );

    return NextResponse.json({
      message: "Notifikasi berhasil dibuat",
      notificationId,
      notificationData: {
        id: notificationId,
        ...notificationData,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("[NOTIFICATIONS API] Validation error:", error.issues);
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[NOTIFICATIONS API] Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json(
        { error: "ID notifikasi wajib diisi" },
        { status: 400 }
      );
    }

    // Verify notification exists
    const notificationRef = ref(database, `notifications/${notificationId}`);
    const notificationSnapshot = await get(notificationRef);

    if (!notificationSnapshot.exists()) {
      return NextResponse.json(
        { error: "Notifikasi tidak ditemukan" },
        { status: 404 }
      );
    }

    const notificationData = notificationSnapshot.val();

    // Update notification as read
    await update(notificationRef, {
      read: true,
      readAt: new Date().toISOString(),
      readBy: session.user.id,
    });

    console.log(
      "[NOTIFICATIONS API] Successfully marked notification as read:",
      notificationId
    );

    return NextResponse.json({
      message: "Notifikasi ditandai sebagai dibaca",
      notificationId,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS API] Error updating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can delete notifications
    const userRef = ref(database, `users/${session.user.id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.val();

    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json(
        { error: "ID notifikasi wajib diisi" },
        { status: 400 }
      );
    }

    // Verify notification exists
    const notificationRef = ref(database, `notifications/${notificationId}`);
    const notificationSnapshot = await get(notificationRef);

    if (!notificationSnapshot.exists()) {
      return NextResponse.json(
        { error: "Notifikasi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete notification
    await remove(notificationRef);

    console.log(
      "[NOTIFICATIONS API] Successfully deleted notification:",
      notificationId
    );

    return NextResponse.json({
      message: "Notifikasi berhasil dihapus",
      notificationId,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS API] Error deleting notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
