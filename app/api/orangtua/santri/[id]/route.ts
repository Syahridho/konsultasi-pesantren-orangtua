import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, update, remove, push, set } from "firebase/database";
import { database } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: santriId } = await params;

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow orangtua to access their own santri data
    if (userData.role !== "orangtua") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get santri data
    const santriRef = ref(
      database,
      `users/${session.user.id}/santri/${santriId}`
    );
    const santriSnapshot = await get(santriRef);

    if (!santriSnapshot.exists()) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    const santriData = santriSnapshot.val();

    return NextResponse.json({
      santri: {
        id: santriId,
        ...santriData,
      },
    });
  } catch (error) {
    console.error("Error fetching santri details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: santriId } = await params;
    const { santriData } = await request.json();

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow orangtua to update their own santri data
    if (userData.role !== "orangtua") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!santriData.name || !santriData.tanggalLahir) {
      return NextResponse.json(
        { error: "Santri name and birth date are required" },
        { status: 400 }
      );
    }

    // Update santri data in Firebase
    const santriRef = ref(
      database,
      `users/${session.user.id}/santri/${santriId}`
    );
    const updateData = {
      name: santriData.name,
      nis: santriData.nis || "",
      tahunDaftar:
        santriData.tahunDaftar || new Date().getFullYear().toString(),
      gender: santriData.gender || "",
      tempatLahir: santriData.tempatLahir || "",
      tanggalLahir: santriData.tanggalLahir,
      updatedAt: new Date().toISOString(),
    };

    await update(santriRef, updateData);

    return NextResponse.json({
      message: "Santri updated successfully",
      santri: {
        id: santriId,
        ...updateData,
      },
    });
  } catch (error) {
    console.error("Error updating santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: santriId } = await params;

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow orangtua to delete their own santri data
    if (userData.role !== "orangtua") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete santri from Firebase
    const santriRef = ref(
      database,
      `users/${session.user.id}/santri/${santriId}`
    );
    await remove(santriRef);

    return NextResponse.json({
      message: "Santri deleted successfully",
      santriId,
    });
  } catch (error) {
    console.error("Error deleting santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { santriData } = await request.json();

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow orangtua to add their own santri data
    if (userData.role !== "orangtua") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!santriData.name || !santriData.tanggalLahir) {
      return NextResponse.json(
        { error: "Santri name and birth date are required" },
        { status: 400 }
      );
    }

    // Add new santri to Firebase
    const studentsRef = ref(database, `users/${session.user.id}/santri`);
    const newSantriRef = push(studentsRef);
    const newSantriId = newSantriRef.key;

    const newSantriData = {
      name: santriData.name,
      nis: santriData.nis || "",
      tahunDaftar:
        santriData.tahunDaftar || new Date().getFullYear().toString(),
      gender: santriData.gender || "",
      tempatLahir: santriData.tempatLahir || "",
      tanggalLahir: santriData.tanggalLahir,
      createdAt: new Date().toISOString(),
    };

    await set(newSantriRef, newSantriData);

    return NextResponse.json({
      message: "Santri added successfully",
      santri: {
        id: newSantriId,
        ...newSantriData,
      },
    });
  } catch (error) {
    console.error("Error adding santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
