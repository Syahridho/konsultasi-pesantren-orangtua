import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, update, remove } from "firebase/database";
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
    console.log("Session data:", session); // Debug log
    const currentUserId = session.user?.id;
    if (!currentUserId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }

    const userRef = ref(database, `users/${currentUserId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();
    console.log("User data:", userData); // Debug log

    // Only allow admin and ustad to access santri data
    if (userData.role !== "admin" && userData.role !== "ustad") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users to find santri
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    const allUsers = usersSnapshot.val();
    let santriData: any = null;
    let orangtuaData: any = null;
    let userId: string | null = null;

    // Find the santri across all orangtua accounts
    Object.keys(allUsers).forEach((uid) => {
      const user = allUsers[uid];
      if (user.role === "orangtua" && user.santri && user.santri[santriId]) {
        santriData = user.santri[santriId];
        orangtuaData = {
          id: uid,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
        };
        userId = uid;
      }
    });

    if (!santriData) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    return NextResponse.json({
      santri: {
        id: santriId,
        userId,
        name: santriData.name,
        nis: santriData.nis || "",
        gender: santriData.gender || "",
        tempatLahir: santriData.tempatLahir || "",
        tanggalLahir: santriData.tanggalLahir || "",
        tahunDaftar: santriData.tahunDaftar || "",
        createdAt: santriData.createdAt || "",
        orangtua: orangtuaData,
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
    const body = await request.json();
    const santriData = body.santriData || body;

    // Get current user's data from Firebase
    const currentUserId = session.user?.id;
    if (!currentUserId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }

    const userRef = ref(database, `users/${currentUserId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow admin and ustad to update santri data
    if (userData.role !== "admin" && userData.role !== "ustad") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!santriData.name || !santriData.tanggalLahir) {
      return NextResponse.json(
        { error: "Santri name and birth date are required" },
        { status: 400 }
      );
    }

    // Get all users to find the santri
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    const allUsers = usersSnapshot.val();
    let targetUserId: string | null = null;

    // Find the santri across all orangtua accounts
    Object.keys(allUsers).forEach((uid) => {
      const user = allUsers[uid];
      if (user.role === "orangtua" && user.santri && user.santri[santriId]) {
        targetUserId = uid;
      }
    });

    if (!targetUserId) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    // Update santri data in Firebase
    const santriRef = ref(database, `users/${targetUserId}/santri/${santriId}`);
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
        userId: targetUserId,
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
    const currentUserId = session.user?.id;
    if (!currentUserId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }

    const userRef = ref(database, `users/${currentUserId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow admin and ustad to delete santri data
    if (userData.role !== "admin" && userData.role !== "ustad") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users to find the santri
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    const allUsers = usersSnapshot.val();
    let targetUserId: string | null = null;

    // Find the santri across all orangtua accounts
    Object.keys(allUsers).forEach((uid) => {
      const user = allUsers[uid];
      if (user.role === "orangtua" && user.santri && user.santri[santriId]) {
        targetUserId = uid;
      }
    });

    if (!targetUserId) {
      return NextResponse.json({ error: "Santri not found" }, { status: 404 });
    }

    // Delete santri from Firebase
    const santriRef = ref(database, `users/${targetUserId}/santri/${santriId}`);
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
