import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, update, remove, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { handleCorsPreflight, addCorsHeaders } from "@/lib/cors";

// GET: Fetch list of peringatan tagihan
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
    const parentId = searchParams.get("parentId");
    const tingkat = searchParams.get("tingkat");
    const status = searchParams.get("status");
    const jenisTagihan = searchParams.get("jenisTagihan");

    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);
    const users = usersSnapshot.exists() ? usersSnapshot.val() : {};

    const peringatanRef = ref(database, "peringatan_tagihan");
    const snapshot = await get(peringatanRef);

    if (!snapshot.exists()) {
      return addCorsHeaders(NextResponse.json({ peringatanList: [] }));
    }

    const allPeringatan = snapshot.val();
    let list: any[] = [];

    Object.keys(allPeringatan).forEach((key) => {
      const item = { id: key, ...allPeringatan[key] };

      // Enrich details from users table if needed
      if (users[item.santriId]) {
        const u = users[item.santriId];
        item.santriName = item.santriName || u.name;
        item.santriGender = item.santriGender || u.gender || "";
        item.santriNis = item.santriNis || u.nis || "";
        item.parentId = item.parentId || u.parentId || "";
      }

      if (item.parentId && users[item.parentId]) {
        item.parentName = item.parentName || users[item.parentId].name;
        item.parentPhone = item.parentPhone || users[item.parentId].phone || "";
      }

      list.push(item);
    });

    // If user is orangtua, only view their own warnings
    const currentUserId = (session.user as any)?.id || "";
    if (session.user.role === "orangtua") {
      const currentUser = currentUserId ? users[currentUserId] : null;
      const childIds: string[] = currentUser?.studentIds || [];
      list = list.filter(
        (item) =>
          item.parentId === currentUserId || childIds.includes(item.santriId)
      );
    }

    // Filters
    if (santriId) {
      list = list.filter((item) => item.santriId === santriId);
    }
    if (parentId) {
      list = list.filter((item) => item.parentId === parentId);
    }
    if (tingkat && tingkat !== "all") {
      list = list.filter((item) => item.tingkatPeringatan === tingkat);
    }
    if (status && status !== "all") {
      list = list.filter((item) => item.status === status);
    }
    if (jenisTagihan && jenisTagihan !== "all") {
      list = list.filter((item) => item.jenisTagihan === jenisTagihan);
    }

    // Sort by createdAt descending
    list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return addCorsHeaders(NextResponse.json({ peringatanList: list }));
  } catch (error) {
    console.error("[PERINGATAN GET API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// POST: Create a new peringatan
export async function POST(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "petugas")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      santriId,
      judul,
      tingkatPeringatan,
      jenisTagihan,
      nominalTunggakan,
      pesan,
      batasWaktu,
      kirimNotifikasi,
    } = body;

    if (!santriId || !judul || !pesan) {
      return NextResponse.json(
        { error: "Santri, judul peringatan, dan isi pesan wajib diisi" },
        { status: 400 }
      );
    }

    // Fetch santri and parent details
    const santriRef = ref(database, `users/${santriId}`);
    const santriSnapshot = await get(santriRef);

    if (!santriSnapshot.exists()) {
      return NextResponse.json(
        { error: "Data santri tidak ditemukan" },
        { status: 404 }
      );
    }

    const santri = santriSnapshot.val();
    let parentName = "";
    let parentPhone = "";

    if (santri.parentId) {
      const parentRef = ref(database, `users/${santri.parentId}`);
      const parentSnapshot = await get(parentRef);
      if (parentSnapshot.exists()) {
        const parentData = parentSnapshot.val();
        parentName = parentData.name || "";
        parentPhone = parentData.phone || "";
      }
    }

    const peringatanRef = ref(database, "peringatan_tagihan");
    const newPeringatanRef = push(peringatanRef);
    const peringatanId = newPeringatanRef.key!;

    const peringatanData = {
      id: peringatanId,
      santriId,
      santriName: santri.name || "",
      santriNis: santri.nis || "",
      santriGender: santri.gender || "",
      parentId: santri.parentId || "",
      parentName,
      parentPhone,
      judul,
      tingkatPeringatan: tingkatPeringatan || "pemberitahuan",
      jenisTagihan: jenisTagihan || "umum",
      nominalTunggakan: parseInt(nominalTunggakan) || 0,
      pesan,
      batasWaktu: batasWaktu || "",
      status: "aktif",
      createdAt: new Date().toISOString(),
      createdBy: (session.user as any)?.id || "",
      createdByName: session.user?.name || "Petugas",
    };

    await set(newPeringatanRef, peringatanData);

    // Optionally create in-app notification for Orang Tua
    if (kirimNotifikasi !== false) {
      try {
        const notifRef = push(ref(database, "notifications"));
        await set(notifRef, {
          id: notifRef.key,
          type: "system",
          title: `[${tingkatPeringatan ? tingkatPeringatan.toUpperCase() : "PERINGATAN"}] ${judul}`,
          message: pesan,
          targetRole: "orangtua",
          targetUserId: santri.parentId || null,
          priority: tingkatPeringatan === "sp3" ? "critical" : tingkatPeringatan === "sp2" ? "high" : "medium",
          read: false,
          createdAt: new Date().toISOString(),
          createdBy: session.user.id,
          createdByName: session.user.name || "Petugas",
        });
      } catch (notifErr) {
        console.error("Failed to create in-app notification:", notifErr);
      }
    }

    return addCorsHeaders(
      NextResponse.json({
        message: "Surat peringatan berhasil dibuat",
        peringatan: peringatanData,
      })
    );
  } catch (error) {
    console.error("[PERINGATAN POST API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// PUT: Update a peringatan
export async function PUT(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "petugas")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID peringatan wajib diisi" },
        { status: 400 }
      );
    }

    const pRef = ref(database, `peringatan_tagihan/${id}`);
    const snapshot = await get(pRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Data peringatan tidak ditemukan" },
        { status: 404 }
      );
    }

    const existing = snapshot.val();
    const updateData: any = {
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.name || "Petugas",
    };

    if (body.judul !== undefined) updateData.judul = body.judul;
    if (body.tingkatPeringatan !== undefined)
      updateData.tingkatPeringatan = body.tingkatPeringatan;
    if (body.jenisTagihan !== undefined) updateData.jenisTagihan = body.jenisTagihan;
    if (body.nominalTunggakan !== undefined)
      updateData.nominalTunggakan = parseInt(body.nominalTunggakan) || 0;
    if (body.pesan !== undefined) updateData.pesan = body.pesan;
    if (body.batasWaktu !== undefined) updateData.batasWaktu = body.batasWaktu;
    if (body.status !== undefined) updateData.status = body.status;

    await update(pRef, updateData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Data peringatan berhasil diperbarui",
        peringatan: { ...existing, ...updateData },
      })
    );
  } catch (error) {
    console.error("[PERINGATAN PUT API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// DELETE: Remove a peringatan
export async function DELETE(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "petugas")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID peringatan wajib diisi" },
        { status: 400 }
      );
    }

    const pRef = ref(database, `peringatan_tagihan/${id}`);
    const snapshot = await get(pRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Data peringatan tidak ditemukan" },
        { status: 404 }
      );
    }

    await remove(pRef);

    return addCorsHeaders(
      NextResponse.json({ message: "Peringatan berhasil dihapus" })
    );
  } catch (error) {
    console.error("[PERINGATAN DELETE API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
