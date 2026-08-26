import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { secondaryAuth } from "@/lib/firebase-secondary";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { handleCorsPreflight, addCorsHeaders } from "@/lib/cors";

// GET all petugas
export async function GET(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionRole = (session.user?.role || "").toLowerCase().trim();
    if (sessionRole !== "admin") {
      return NextResponse.json({ error: "Forbidden - Hanya Admin" }, { status: 403 });
    }

    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);

    const petugasList: any[] = [];
    const foundPetugasIds = new Set<string>();

    if (snapshot.exists()) {
      const allUsers = snapshot.val();

      Object.keys(allUsers).forEach((userId) => {
        const user = allUsers[userId];
        if (!user) return;

        const role = (user.role || "").toLowerCase().trim();
        const name = (user.name || "").toLowerCase().trim();
        const email = (user.email || "").toLowerCase().trim();

        // Check if user is a petugas (by role, name, email or known petugas UID)
        const isPetugas =
          role === "petugas" ||
          role === "staff" ||
          role === "keuangan" ||
          role === "kasir" ||
          name === "petugas" ||
          email.startsWith("petugas") ||
          userId === "tDKuOMFzFXdTAgqJqIPvKZtrYed2";

        if (isPetugas) {
          foundPetugasIds.add(userId);
          petugasList.push({
            id: userId,
            name: user.name || "Petugas Keuangan",
            email: user.email || (user.name ? `${user.name}@pesantren.com` : "petugas@pesantren.com"),
            phone: user.phone || "",
            gender: user.gender || "L",
            position: user.position || user.jabatan || "Petugas Administrasi & Keuangan",
            role: "petugas",
            createdAt: user.createdAt || "",
          });
        }
      });
    }

    // Fallback: If known petugas in mutasi/tagihan (e.g. tDKuOMFzFXdTAgqJqIPvKZtrYed2) not yet in users table
    if (!foundPetugasIds.has("tDKuOMFzFXdTAgqJqIPvKZtrYed2")) {
      // Check mutasi_saldo or tagihan_iuran for petugas
      try {
        const iuranRef = ref(database, "tagihan_iuran");
        const iuranSnap = await get(iuranRef);
        if (iuranSnap.exists()) {
          const iurans = iuranSnap.val();
          Object.values(iurans).forEach((item: any) => {
            if (item && item.createdBy && !foundPetugasIds.has(item.createdBy)) {
              foundPetugasIds.add(item.createdBy);
              petugasList.push({
                id: item.createdBy,
                name: item.createdByName || "Petugas Keuangan",
                email: `${(item.createdByName || "petugas").toLowerCase().replace(/\s+/g, "")}@pesantren.com`,
                phone: "",
                gender: "L",
                position: "Petugas Administrasi & Keuangan",
                role: "petugas",
                createdAt: item.createdAt || new Date().toISOString(),
              });
            }
          });
        }
      } catch (e) {}
    }

    // Sort by name ascending
    petugasList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return addCorsHeaders(NextResponse.json({ petugasList }));
  } catch (error) {
    console.error("[PETUGAS GET API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// POST create new petugas
export async function POST(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionRole = (session.user?.role || "").toLowerCase().trim();
    if (sessionRole !== "admin") {
      return NextResponse.json({ error: "Forbidden - Hanya Admin" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, phone, gender, position } = body;

    // Validation
    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Nama petugas minimal 3 karakter" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Create Firebase Auth user using secondaryAuth to avoid logging out admin
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim().toLowerCase(),
      password
    );

    const user = userCredential.user;
    if (!user) {
      return NextResponse.json(
        { error: "Gagal membuat akun petugas di sistem otentikasi" },
        { status: 500 }
      );
    }

    // Save to Firebase Realtime Database
    const userRef = ref(database, `users/${user.uid}`);
    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : "",
      gender: gender || "L",
      position: position || "Petugas Administrasi & Keuangan",
      role: "petugas",
      createdAt: new Date().toISOString(),
      createdBy: (session.user as any)?.id || "",
      createdByName: session.user?.name || "Admin",
    };

    await set(userRef, userData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Petugas berhasil ditambahkan",
        petugas: {
          id: user.uid,
          ...userData,
        },
      })
    );
  } catch (error: any) {
    console.error("[PETUGAS POST API] Error:", error);

    if (error.code === "auth/email-already-in-use") {
      return addCorsHeaders(
        NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })
      );
    }

    if (error.code === "auth/weak-password") {
      return addCorsHeaders(
        NextResponse.json({ error: "Password terlalu lemah (minimal 6 karakter)" }, { status: 400 })
      );
    }

    return addCorsHeaders(
      NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      )
    );
  }
}
