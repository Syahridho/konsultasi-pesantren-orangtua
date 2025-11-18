import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, push } from "firebase/database";
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

    // If user is orangtua, return their students
    if (userData.role === "orangtua") {
      const santri = userData.santri || {};
      const santriList = Object.keys(santri).map((santriId) => ({
        id: santriId,
        ...santri[santriId],
      }));

      return NextResponse.json({
        user: {
          id: session.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || "",
          role: userData.role,
          santri: userData.santri, // Include santri data in user object for backward compatibility
        },
        santri: santriList,
      });
    } else {
      // If user is admin or ustad, return all orangtua data
      const usersRef = ref(database, "users");
      const usersSnapshot = await get(usersRef);

      if (!usersSnapshot.exists()) {
        return NextResponse.json({ orangtuaList: [] });
      }

      const allUsers = usersSnapshot.val();
      const orangtuaList = Object.keys(allUsers)
        .filter((userId) => allUsers[userId].role === "orangtua")
        .map((userId) => {
          const orangtuaData = allUsers[userId];
          const santriCount = orangtuaData.santri
            ? Object.keys(orangtuaData.santri).length
            : 0;

          return {
            id: userId,
            ...orangtuaData,
            santriCount,
          };
        });

      return NextResponse.json({
        user: {
          id: session.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || "",
          role: userData.role,
        },
        orangtuaList,
      });
    }
  } catch (error) {
    console.error("Error fetching orangtua data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new orangtua
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin" && session.user.role !== "ustad") {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { orangtuaData, santriList } = await request.json();

    if (!orangtuaData) {
      return NextResponse.json(
        { error: "Orangtua data is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!orangtuaData.name || orangtuaData.name.length < 3) {
      return NextResponse.json(
        { error: "Name must be at least 3 characters long" },
        { status: 400 }
      );
    }

    if (!orangtuaData.email || !orangtuaData.email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!orangtuaData.password || orangtuaData.password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      orangtuaData.email,
      orangtuaData.password
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
      name: orangtuaData.name,
      email: orangtuaData.email,
      phone: orangtuaData.phone || null,
      role: orangtuaData.role || "orangtua",
      createdAt: new Date().toISOString(),
    };

    // Add santri data if provided
    if (santriList && santriList.length > 0) {
      const santriData: Record<string, any> = {};
      santriList.forEach((santri: any) => {
        const santriId = push(ref(database, `users/${user.uid}/santri`)).key;
        if (santriId) {
          santriData[santriId] = {
            name: santri.name,
            nis: santri.nis || "",
            tahunDaftar:
              santri.tahunDaftar || new Date().getFullYear().toString(),
            gender: santri.gender || "",
            tempatLahir: santri.tempatLahir || "",
            tanggalLahir: santri.tanggalLahir,
            createdAt: new Date().toISOString(),
          };
        }
      });
      (userData as any).santri = santriData;
    }

    await set(userRef, userData);

    return NextResponse.json({
      message: "Orang tua created successfully",
      orangtua: {
        id: user.uid,
        ...userData,
      },
    });
  } catch (error: any) {
    console.error("Error creating orangtua:", error);

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
