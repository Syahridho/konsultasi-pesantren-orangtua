import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, update } from "firebase/database";
import { database } from "@/lib/firebase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, adminNote } = await request.json();

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { id: requestId } = await params;
    const requestRef = ref(database, `roleRequests/${requestId}`);
    const snapshot = await get(requestRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Role request not found" },
        { status: 404 }
      );
    }

    const roleRequest = snapshot.val();

    if (roleRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Role request already processed" },
        { status: 400 }
      );
    }

    // Update role request status
    const updateData = {
      status: action === "approve" ? "approved" : "rejected",
      processedBy: session.user.id,
      processedAt: new Date().toISOString(),
      adminNote: adminNote || "",
    };

    await update(requestRef, updateData);

    // If approved, update user role
    if (action === "approve") {
      const userRef = ref(database, `users/${roleRequest.userId}`);
      const userSnapshot = await get(userRef);

      if (userSnapshot.exists()) {
        await update(userRef, {
          role: roleRequest.requestedRole,
          roleUpdatedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      message: `Role request ${action}d successfully`,
      request: {
        ...roleRequest,
        ...updateData,
      },
    });
  } catch (error) {
    console.error("Error processing role request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
