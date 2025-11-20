import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow admin to access all ustad data
    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users from Firebase
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      return NextResponse.json({ ustadList: [] });
    }

    const allUsers = usersSnapshot.val();
    const ustadList: any[] = [];

    // Iterate through all users to find ustad
    Object.keys(allUsers).forEach((userId) => {
      const user = allUsers[userId];

      if (user.role === "ustad") {
        ustadList.push({
          id: userId,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          createdAt: user.createdAt,
        });
      }
    });

    return NextResponse.json({
      ustadList,
    });
  } catch (error) {
    console.error("Error fetching ustad data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new ustad
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { ustadData } = await request.json();

    if (!ustadData) {
      return NextResponse.json(
        { error: "Ustad data is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!ustadData.name || ustadData.name.length < 3) {
      return NextResponse.json(
        { error: "Name must be at least 3 characters long" },
        { status: 400 }
      );
    }

    if (!ustadData.email || !ustadData.email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!ustadData.password || ustadData.password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ustadData.email,
      ustadData.password
    );
    const user = userCredential.user;

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Save user data to Firebase Realtime Database
    const userRef = ref(database, `users/${user.uid}`);
    const userData = {
      name: ustadData.name,
      email: ustadData.email,
      phone: ustadData.phone || null,
      specialization: ustadData.specialization || null,
      role: ustadData.role || "ustad",
      createdAt: new Date().toISOString(),
    };

    await set(userRef, userData);

    return NextResponse.json({
      message: "Ustad created successfully",
      ustad: {
        id: user.uid,
        ...userData,
      },
    });
  } catch (error: any) {
    console.error("Error creating ustad:", error);

    // Handle Firebase auth errors
    if (error.code === "auth/email-already-in-use") {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    if (error.code === "auth/weak-password") {
      return NextResponse.json(
        { error: "Password is too weak" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
