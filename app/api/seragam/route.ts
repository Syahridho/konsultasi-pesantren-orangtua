import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set, update, remove, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { handleCorsPreflight, addCorsHeaders } from "@/lib/cors";

const DEFAULT_SETTINGS = {
  bankName: "Bank Syariah Indonesia (BSI)",
  accountNumber: "7123456789",
  accountHolder: "Pondok Pesantren Baiturrahman",
  defaultNominal: 650000,
  rincianPaket: [
    { nama: "Seragam Batik Khas Pesantren", jumlah: 1 },
    { nama: "Seragam Koko / Gamis Santri", jumlah: 2 },
    { nama: "Seragam Olahraga (Kaos & Celana)", jumlah: 1 },
    { nama: "Seragam Pramuka Lengkap", jumlah: 1 },
    { nama: "Peci / Jilbab Bordir", jumlah: 2 },
  ],
  keterangan: "Pembayaran Paket Seragam Santri Baru (1 Set Lengkap).",
};

// GET: Fetch list of Seragam bills
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
    const status = searchParams.get("status");
    const statusPengambilan = searchParams.get("statusPengambilan");
    const ukuran = searchParams.get("ukuran");
    const gender = searchParams.get("gender");
    const tahun = searchParams.get("tahun");

    // Fetch settings
    const settingsRef = ref(database, "settings/seragam");
    const settingsSnapshot = await get(settingsRef);
    const settings = settingsSnapshot.exists()
      ? { ...DEFAULT_SETTINGS, ...settingsSnapshot.val() }
      : DEFAULT_SETTINGS;

    // Fetch all users to enrich details
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);
    const users = usersSnapshot.exists() ? usersSnapshot.val() : {};

    // Fetch all tagihan seragam
    const seragamRef = ref(database, "tagihan_seragam");
    const snapshot = await get(seragamRef);

    if (!snapshot.exists()) {
      return addCorsHeaders(
        NextResponse.json({
          tagihanList: [],
          settings,
        })
      );
    }

    const allBills = snapshot.val();
    let list: any[] = [];

    Object.keys(allBills).forEach((key) => {
      const item = { id: key, ...allBills[key] };

      // Fill in details if missing from users table
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

    // If user is orangtua, filter to their children
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
    if (status && status !== "all") {
      list = list.filter((item) => item.status === status);
    }
    if (statusPengambilan && statusPengambilan !== "all") {
      list = list.filter((item) => item.statusPengambilan === statusPengambilan);
    }
    if (ukuran && ukuran !== "all") {
      list = list.filter((item) => item.ukuran === ukuran);
    }
    if (gender && gender !== "semua") {
      list = list.filter((item) => item.santriGender === gender);
    }
    if (tahun && tahun !== "all") {
      list = list.filter((item) => String(item.tahun) === String(tahun));
    }

    // Sort by createdAt descending
    list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return addCorsHeaders(
      NextResponse.json({
        tagihanList: list,
        settings,
      })
    );
  } catch (error) {
    console.error("[SERAGAM GET API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// POST: Create single or bulk tagihan seragam
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
    const { action, nominal, santriId, ukuran, tahun, keterangan, rincianPaket } = body;

    // Fetch settings for defaults
    const settingsRef = ref(database, "settings/seragam");
    const settingsSnapshot = await get(settingsRef);
    const settings = settingsSnapshot.exists()
      ? { ...DEFAULT_SETTINGS, ...settingsSnapshot.val() }
      : DEFAULT_SETTINGS;

    const defaultNom = nominal ? parseInt(nominal) : settings.defaultNominal;
    const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();

    // 1. Bulk generate
    if (action === "bulk_generate") {
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

      // Check existing seragam bills
      const seragamRef = ref(database, "tagihan_seragam");
      const snapshot = await get(seragamRef);
      const existingBills = snapshot.exists() ? snapshot.val() : {};

      const createdList: any[] = [];
      let skippedCount = 0;

      for (const santri of santriList) {
        const alreadyExists = Object.values(existingBills).some(
          (item: any) => item.santriId === santri.id
        );

        if (alreadyExists) {
          skippedCount++;
          continue;
        }

        const newBillRef = push(seragamRef);
        const billId = newBillRef.key!;
        const billData = {
          id: billId,
          santriId: santri.id,
          santriName: santri.name,
          santriGender: santri.gender || "",
          santriNis: santri.nis || "",
          parentId: santri.parentId || "",
          ukuran: ukuran || "M",
          tahun: currentYear,
          nominal: defaultNom,
          rincianPaket: rincianPaket || settings.rincianPaket,
          status: "belum_bayar",
          statusPengambilan: "belum_diambil",
          keterangan:
            keterangan || `Tagihan Paket Seragam Lengkap Santri: ${santri.name}`,
          createdAt: new Date().toISOString(),
          createdBy: (session.user as any)?.id || "",
          createdByName: session.user?.name || "Petugas",
        };

        await set(newBillRef, billData);
        createdList.push(billData);
      }

      return addCorsHeaders(
        NextResponse.json({
          message: `Berhasil membuat ${createdList.length} tagihan seragam (${skippedCount} sudah ada)`,
          createdCount: createdList.length,
          skippedCount,
        })
      );
    }

    // 2. Single bill creation
    if (!santriId) {
      return NextResponse.json(
        { error: "Santri wajib dipilih" },
        { status: 400 }
      );
    }

    const santriRef = ref(database, `users/${santriId}`);
    const santriSnapshot = await get(santriRef);
    if (!santriSnapshot.exists()) {
      return NextResponse.json(
        { error: "Data santri tidak ditemukan" },
        { status: 404 }
      );
    }

    const santri = santriSnapshot.val();
    const seragamRef = ref(database, "tagihan_seragam");

    // Check duplicate
    const snapshot = await get(seragamRef);
    if (snapshot.exists()) {
      const existing = snapshot.val();
      const duplicate = Object.values(existing).find(
        (b: any) => b.santriId === santriId
      );
      if (duplicate) {
        return NextResponse.json(
          {
            error: `Santri ${santri.name} sudah memiliki tagihan seragam.`,
          },
          { status: 400 }
        );
      }
    }

    const newBillRef = push(seragamRef);
    const billId = newBillRef.key!;

    const billData = {
      id: billId,
      santriId: santri.id || santriId,
      santriName: santri.name,
      santriGender: santri.gender || "",
      santriNis: santri.nis || "",
      parentId: santri.parentId || "",
      ukuran: ukuran || "M",
      tahun: currentYear,
      nominal: defaultNom,
      rincianPaket: rincianPaket || settings.rincianPaket,
      status: "belum_bayar",
      statusPengambilan: "belum_diambil",
      keterangan:
        keterangan || `Tagihan Paket Seragam Lengkap Santri: ${santri.name}`,
      createdAt: new Date().toISOString(),
      createdBy: (session.user as any)?.id || "",
      createdByName: session.user?.name || "Petugas",
    };

    await set(newBillRef, billData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Tagihan seragam berhasil dibuat",
        tagihan: billData,
      })
    );
  } catch (error) {
    console.error("[SERAGAM POST API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// PUT: Update tagihan seragam (submit payment, verify, update pengambilan, edit)
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

    const billRef = ref(database, `tagihan_seragam/${id}`);
    const billSnapshot = await get(billRef);

    if (!billSnapshot.exists()) {
      return NextResponse.json(
        { error: "Tagihan seragam tidak ditemukan" },
        { status: 404 }
      );
    }

    const existingBill = billSnapshot.val();

    // 1. Orang tua submit payment
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
        buktiFileName: buktiFileName || "bukti_seragam.jpg",
        catatanOrangTua: catatanOrangTua || "",
        status: "menunggu_verifikasi",
        tanggalBayar: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await update(billRef, updateData);

      return addCorsHeaders(
        NextResponse.json({
          message:
            "Bukti pembayaran seragam berhasil diunggah. Menunggu verifikasi petugas.",
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
              ? "Pembayaran seragam berhasil disetujui (Lunas)"
              : "Pembayaran seragam telah ditolak",
          tagihan: { ...existingBill, ...updateData },
        })
      );
    }

    // 3. Petugas update status pengambilan fisik
    if (action === "update_pengambilan") {
      if (
        session.user.role !== "admin" &&
        session.user.role !== "petugas"
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const { statusPengambilan, tanggalPengambilan, penerimaSeragam } = body;

      const updateData: any = {
        statusPengambilan: statusPengambilan || "sudah_diambil",
        tanggalPengambilan:
          statusPengambilan === "sudah_diambil"
            ? tanggalPengambilan || new Date().toISOString()
            : null,
        penerimaSeragam: penerimaSeragam || null,
        updatedAt: new Date().toISOString(),
      };

      await update(billRef, updateData);

      return addCorsHeaders(
        NextResponse.json({
          message: "Status pengambilan seragam berhasil diperbarui",
          tagihan: { ...existingBill, ...updateData },
        })
      );
    }

    // 4. Petugas edit basic details
    if (session.user.role !== "admin" && session.user.role !== "petugas") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      nominal,
      ukuran,
      tahun,
      keterangan,
      rincianPaket,
      status: manualStatus,
      statusPengambilan: manualStatusPengambilan,
    } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (nominal !== undefined) updateData.nominal = parseInt(nominal);
    if (ukuran !== undefined) updateData.ukuran = ukuran;
    if (tahun !== undefined) updateData.tahun = parseInt(tahun);
    if (keterangan !== undefined) updateData.keterangan = keterangan;
    if (rincianPaket !== undefined) updateData.rincianPaket = rincianPaket;
    if (manualStatus !== undefined) updateData.status = manualStatus;
    if (manualStatusPengambilan !== undefined)
      updateData.statusPengambilan = manualStatusPengambilan;

    await update(billRef, updateData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Data tagihan seragam berhasil diperbarui",
        tagihan: { ...existingBill, ...updateData },
      })
    );
  } catch (error) {
    console.error("[SERAGAM PUT API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// DELETE: Remove a tagihan seragam
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
        { error: "ID tagihan wajib diisi" },
        { status: 400 }
      );
    }

    const billRef = ref(database, `tagihan_seragam/${id}`);
    const snapshot = await get(billRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan" },
        { status: 404 }
      );
    }

    await remove(billRef);

    return addCorsHeaders(
      NextResponse.json({ message: "Tagihan seragam berhasil dihapus" })
    );
  } catch (error) {
    console.error("[SERAGAM DELETE API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
