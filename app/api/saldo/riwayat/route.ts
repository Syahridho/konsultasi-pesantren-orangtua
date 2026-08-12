import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { addCorsHeaders, handleCorsPreflight } from "@/lib/cors";

export async function GET(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const santriId = searchParams.get("santriId");

    if (!santriId) {
      return NextResponse.json({ error: "santriId is required" }, { status: 400 });
    }

    // Check if the current user has access to this student's data
    const userRole = session.user.role;
    if (userRole === "orangtua") {
      const parentRef = ref(database, `users/${session.user.id}`);
      const parentSnapshot = await get(parentRef);
      const parentData = parentSnapshot.val();

      if (!parentData || !parentData.studentIds || !parentData.studentIds.includes(santriId)) {
        return NextResponse.json({ error: "Forbidden access to this student" }, { status: 403 });
      }
    }

    const mutasiRef = ref(database, `mutasi_saldo/${santriId}`);
    const mutasiSnapshot = await get(mutasiRef);

    if (!mutasiSnapshot.exists()) {
      return addCorsHeaders(NextResponse.json({ riwayat: [] }));
    }

    const mutasiData = mutasiSnapshot.val();
    
    // Transform object into array and sort by createdAt descending
    const riwayatArray = Object.keys(mutasiData).map(key => ({
      id: key,
      ...mutasiData[key]
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return addCorsHeaders(NextResponse.json({ riwayat: riwayatArray }));
  } catch (error) {
    console.error("[SALDO RIWAYAT GET API] Error:", error);
    return addCorsHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and petugas can delete
    if (session.user.role !== "admin" && session.user.role !== "petugas") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const santriId = searchParams.get("santriId");
    const mutasiId = searchParams.get("mutasiId");

    if (!santriId || !mutasiId) {
      return NextResponse.json(
        { error: "santriId and mutasiId are required" },
        { status: 400 }
      );
    }

    const mutasiEntryRef = ref(database, `mutasi_saldo/${santriId}/${mutasiId}`);
    const snapshot = await get(mutasiEntryRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Riwayat not found" }, { status: 404 });
    }

    await remove(mutasiEntryRef);

    return addCorsHeaders(
      NextResponse.json({ message: "Riwayat deleted successfully" })
    );
  } catch (error) {
    console.error("[SALDO RIWAYAT DELETE API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
