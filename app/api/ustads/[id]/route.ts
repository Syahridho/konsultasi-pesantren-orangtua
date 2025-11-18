import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, update, remove } from "firebase/database";
import { database } from "@/lib/firebase";

// GET individual ustad by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ustadId } = await params;

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow admin to access ustad data
    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ustad data from Firebase
    const ustadRef = ref(database, `users/${ustadId}`);
    const ustadSnapshot = await get(ustadRef);

    if (!ustadSnapshot.exists()) {
      return NextResponse.json({ error: "Ustad not found" }, { status: 404 });
    }

    const ustadData = ustadSnapshot.val();

    return NextResponse.json({
      ustad: {
        id: ustadId,
        name: ustadData.name,
        email: ustadData.email,
        phone: ustadData.phone || "",
        role: ustadData.role,
        createdAt: ustadData.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching ustad details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update ustad by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ustadId } = await params;
    const { ustadData } = await request.json();

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow admin to update ustad data
    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!ustadData.name || !ustadData.email) {
      return NextResponse.json(
        { error: "Ustad name and email are required" },
        { status: 400 }
      );
    }

    // Update ustad data in Firebase
    const ustadRef = ref(database, `users/${ustadId}`);
    const updateData = {
      name: ustadData.name,
      email: ustadData.email,
      phone: ustadData.phone || "",
      updatedAt: new Date().toISOString(),
    };

    await update(ustadRef, updateData);

    return NextResponse.json({
      message: "Ustad updated successfully",
      ustad: {
        id: ustadId,
        ...updateData,
      },
    });
  } catch (error) {
    console.error("Error updating ustad:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE ustad by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ustadId } = await params;

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow admin to delete ustad data
    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete ustad from Firebase
    const ustadRef = ref(database, `users/${ustadId}`);
    await remove(ustadRef);

    return NextResponse.json({
      message: "Ustad deleted successfully",
      ustadId,
    });
  } catch (error) {
    console.error("Error deleting ustad:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
