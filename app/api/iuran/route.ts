import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, update, remove, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { handleCorsPreflight, addCorsHeaders } from "@/lib/cors";

// GET: Fetch list of iuran bills with filtering
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
    const bulan = searchParams.get("bulan");
    const tahun = searchParams.get("tahun");
    const status = searchParams.get("status");
    const gender = searchParams.get("gender");

    // Fetch bank settings
    const bankRef = ref(database, "settings/bank");
    const bankSnapshot = await get(bankRef);
    const bankSettings = bankSnapshot.exists()
      ? bankSnapshot.val()
      : {
          bankName: "Bank Syariah Indonesia (BSI)",
          accountNumber: "7123456789",
          accountHolder: "Pondok Pesantren Baiturrahman",
          defaultNominal: 350000,
          keterangan: "Pembayaran SPP paling lambat tanggal 10 setiap bulan",
        };

    // Fetch all users to map names & gender
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);
    const users = usersSnapshot.exists() ? usersSnapshot.val() : {};

    // Fetch all iuran
    const iuranRef = ref(database, "tagihan_iuran");
    const iuranSnapshot = await get(iuranRef);

    if (!iuranSnapshot.exists()) {
      return addCorsHeaders(
        NextResponse.json({
          tagihanList: [],
          bankSettings,
        })
      );
    }

    const allIuran = iuranSnapshot.val();
    let list: any[] = [];

    Object.keys(allIuran).forEach((key) => {
      const item = { id: key, ...allIuran[key] };

      // Fill in santri and parent details if missing
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

    // If user is orangtua, only return their children's bills
    const currentUserId = (session.user as any)?.id || "";
    if (session.user.role === "orangtua") {
      const currentUser = currentUserId ? users[currentUserId] : null;
      const childIds: string[] = currentUser?.studentIds || [];
      list = list.filter(
        (item) =>
          item.parentId === currentUserId || childIds.includes(item.santriId)
      );
    }

    // Apply filters
    if (santriId) {
      list = list.filter((item) => item.santriId === santriId);
    }
    if (parentId) {
      list = list.filter((item) => item.parentId === parentId);
    }
    if (bulan && bulan !== "all") {
      list = list.filter((item) => item.bulan?.toLowerCase() === bulan.toLowerCase());
    }
    if (tahun && tahun !== "all") {
      list = list.filter((item) => String(item.tahun) === String(tahun));
    }
    if (status && status !== "all") {
      list = list.filter((item) => item.status === status);
    }
    if (gender && gender !== "semua") {
      list = list.filter((item) => item.santriGender === gender);
    }

    // Sort by createdAt descending
    list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return addCorsHeaders(
      NextResponse.json({
        tagihanList: list,
        bankSettings,
      })
    );
  } catch (error) {
    console.error("[IURAN GET API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// POST: Create single tagihan or bulk generate for all active santri
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
    const { action, bulan, tahun, nominal, santriId, keterangan } = body;

    // Action 1: Bulk generate tagihan for all active santri for a month/year
    if (action === "bulk_generate") {
      if (!bulan || !tahun) {
        return NextResponse.json(
          { error: "Bulan dan tahun wajib diisi" },
          { status: 400 }
        );
      }

      const usersRef = ref(database, "users");
      const usersSnapshot = await get(usersRef);
      if (!usersSnapshot.exists()) {
        return NextResponse.json(
          { error: "Data pengguna tidak ditemukan" },
          { status: 404 }
        );
      }

      const allUsers = usersSnapshot.val();
      const santriList: any[] = [];

      Object.keys(allUsers).forEach((uid) => {
        const u = allUsers[uid];
        if (u.role === "santri" && u.status !== "inactive") {
          santriList.push({ id: uid, ...u });
        }
      });

      if (santriList.length === 0) {
        return NextResponse.json(
          { error: "Tidak ada santri aktif" },
          { status: 400 }
        );
      }

      // Check existing bills for this bulan & tahun
      const iuranRef = ref(database, "tagihan_iuran");
      const iuranSnapshot = await get(iuranRef);
      const existingIuran = iuranSnapshot.exists() ? iuranSnapshot.val() : {};

      const createdList: any[] = [];
      let skippedCount = 0;

      for (const santri of santriList) {
        // Check if bill already exists for this santri in this month/year
        const alreadyExists = Object.values(existingIuran).some(
          (item: any) =>
            item.santriId === santri.id &&
            item.bulan?.toLowerCase() === bulan.toLowerCase() &&
            String(item.tahun) === String(tahun)
        );

        if (alreadyExists) {
          skippedCount++;
          continue;
        }

        const newBillRef = push(iuranRef);
        const billId = newBillRef.key!;
        const billData = {
          id: billId,
          santriId: santri.id,
          santriName: santri.name,
          santriGender: santri.gender || "",
          santriNis: santri.nis || "",
          parentId: santri.parentId || "",
          bulan,
          tahun: parseInt(tahun),
          nominal: parseInt(nominal) || 350000,
          status: "belum_bayar",
          keterangan:
            keterangan ||
            `Tagihan SPP ${bulan} ${tahun} santri ${santri.name}`,
          createdAt: new Date().toISOString(),
          createdBy: (session.user as any)?.id || "",
          createdByName: session.user?.name || "Petugas",
        };

        await set(newBillRef, billData);
        createdList.push(billData);
      }

      return addCorsHeaders(
        NextResponse.json({
          message: `Berhasil membuat ${createdList.length} tagihan (${skippedCount} sudah ada)`,
          createdCount: createdList.length,
          skippedCount,
        })
      );
    }

    // Action 2: Single bill creation
    if (!santriId || !bulan || !tahun || !nominal) {
      return NextResponse.json(
        { error: "Data santri, bulan, tahun, dan nominal wajib diisi" },
        { status: 400 }
      );
    }

    const santriRef = ref(database, `users/${santriId}`);
    const santriSnapshot = await get(santriRef);
    if (!santriSnapshot.exists()) {
      return NextResponse.json(
        { error: "Santri tidak ditemukan" },
        { status: 404 }
      );
    }

    const santri = santriSnapshot.val();
    const iuranRef = ref(database, "tagihan_iuran");
    const newBillRef = push(iuranRef);
    const billId = newBillRef.key!;

    const billData = {
      id: billId,
      santriId: santri.id || santriId,
      santriName: santri.name,
      santriGender: santri.gender || "",
      santriNis: santri.nis || "",
      parentId: santri.parentId || "",
      bulan,
      tahun: parseInt(tahun),
      nominal: parseInt(nominal),
      status: "belum_bayar",
      keterangan:
        keterangan || `Tagihan SPP ${bulan} ${tahun} an ${santri.name}`,
      createdAt: new Date().toISOString(),
      createdBy: (session.user as any)?.id || "",
      createdByName: session.user?.name || "Petugas",
    };

    await set(newBillRef, billData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Tagihan iuran berhasil dibuat",
        tagihan: billData,
      })
    );
  } catch (error) {
    console.error("[IURAN POST API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// PUT: Update tagihan (edit details, parent submit payment, or petugas verify)
export async function PUT(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID tagihan wajib diisi" },
        { status: 400 }
      );
    }

    const billRef = ref(database, `tagihan_iuran/${id}`);
    const billSnapshot = await get(billRef);

    if (!billSnapshot.exists()) {
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan" },
        { status: 404 }
      );
    }

    const existingBill = billSnapshot.val();

    // 1. Orang tua submit payment & proof of transfer
    if (action === "submit_pembayaran") {
      const { buktiPembayaran, buktiFileName, catatanOrangTua } = body;

      if (!buktiPembayaran) {
        return NextResponse.json(
          { error: "Bukti pembayaran wajib diunggah" },
          { status: 400 }
        );
      }

      const updateData = {
        buktiPembayaran,
        buktiFileName: buktiFileName || "bukti_transfer.jpg",
        catatanOrangTua: catatanOrangTua || "",
        status: "menunggu_verifikasi",
        tanggalBayar: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await update(billRef, updateData);

      return addCorsHeaders(
        NextResponse.json({
          message:
            "Bukti pembayaran berhasil diunggah. Menunggu verifikasi petugas.",
          tagihan: { ...existingBill, ...updateData },
        })
      );
    }

    // 2. Petugas verify payment (approve / reject)
    if (action === "verifikasi") {
      if (
        session.user.role !== "admin" &&
        session.user.role !== "petugas"
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const { status: newStatus, catatanPetugas } = body;

      if (newStatus !== "lunas" && newStatus !== "ditolak") {
        return NextResponse.json(
          { error: "Status verifikasi harus 'lunas' atau 'ditolak'" },
          { status: 400 }
        );
      }

      const updateData = {
        status: newStatus,
        catatanPetugas: catatanPetugas || "",
        verifiedAt: new Date().toISOString(),
        verifiedBy: (session.user as any)?.id || "",
        verifiedByName: session.user?.name || "Petugas",
        updatedAt: new Date().toISOString(),
      };

      await update(billRef, updateData);

      return addCorsHeaders(
        NextResponse.json({
          message:
            newStatus === "lunas"
              ? "Pembayaran berhasil disetujui (Lunas)"
              : "Pembayaran telah ditolak",
          tagihan: { ...existingBill, ...updateData },
        })
      );
    }

    // 3. Petugas edit basic details
    if (session.user.role !== "admin" && session.user.role !== "petugas") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { nominal, bulan, tahun, keterangan, status: manualStatus } = body;
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (nominal !== undefined) updateData.nominal = parseInt(nominal);
    if (bulan !== undefined) updateData.bulan = bulan;
    if (tahun !== undefined) updateData.tahun = parseInt(tahun);
    if (keterangan !== undefined) updateData.keterangan = keterangan;
    if (manualStatus !== undefined) updateData.status = manualStatus;

    await update(billRef, updateData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Data tagihan berhasil diperbarui",
        tagihan: { ...existingBill, ...updateData },
      })
    );
  } catch (error) {
    console.error("[IURAN PUT API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// DELETE: Remove a tagihan
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
      return NextResponse.json({ error: "ID tagihan wajib diisi" }, { status: 400 });
    }

    const billRef = ref(database, `tagihan_iuran/${id}`);
    const snapshot = await get(billRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan" },
        { status: 404 }
      );
    }

    await remove(billRef);

    return addCorsHeaders(
      NextResponse.json({ message: "Tagihan berhasil dihapus" })
    );
  } catch (error) {
    console.error("[IURAN DELETE API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
