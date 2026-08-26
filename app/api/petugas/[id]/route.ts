import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, update, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { handleCorsPreflight, addCorsHeaders } from "@/lib/cors";

// GET individual petugas by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: petugasId } = await params;

    const userRef = ref(database, `users/${petugasId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Petugas tidak ditemukan" }, { status: 404 });
    }

    const userData = snapshot.val();

    return addCorsHeaders(
      NextResponse.json({
        petugas: {
          id: petugasId,
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          gender: userData.gender || "L",
          position: userData.position || userData.jabatan || "Petugas Administrasi & Keuangan",
          role: userData.role || "petugas",
          createdAt: userData.createdAt || "",
        },
      })
    );
  } catch (error) {
    console.error("[PETUGAS GET BY ID] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// PUT update petugas by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: petugasId } = await params;
    const body = await request.json();
    const { name, email, phone, gender, position } = body;

    const userRef = ref(database, `users/${petugasId}`);
    const snapshot = await get(userRef);

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (gender !== undefined) updateData.gender = gender;
    if (position !== undefined) updateData.position = position.trim();
    updateData.role = "petugas";

    if (!snapshot.exists()) {
      // Create if it doesn't exist yet
      await update(userRef, {
        ...updateData,
        createdAt: new Date().toISOString(),
      });
    } else {
      await update(userRef, updateData);
    }

    const updatedSnapshot = await get(userRef);
    const updatedData = updatedSnapshot.val();

    return addCorsHeaders(
      NextResponse.json({
        message: "Data petugas berhasil diperbarui",
        petugas: {
          id: petugasId,
          ...updatedData,
        },
      })
    );
  } catch (error) {
    console.error("[PETUGAS PUT BY ID] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// DELETE petugas by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: petugasId } = await params;

    const userRef = ref(database, `users/${petugasId}`);
    await remove(userRef);

    return addCorsHeaders(
      NextResponse.json({
        message: "Petugas berhasil dihapus dari sistem",
        petugasId,
      })
    );
  } catch (error) {
    console.error("[PETUGAS DELETE BY ID] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
