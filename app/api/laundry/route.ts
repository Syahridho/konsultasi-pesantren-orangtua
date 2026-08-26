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
  defaultNominal: 100000,
  defaultPaket: "Paket Cuci & Setrika Reguler (Max 20 Kg/Bulan)",
  kuotaKg: 20,
  keterangan: "Pembayaran Iuran Layanan Laundry Santri Bulanan.",
};

const BULAN_LIST = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// GET: Fetch list of Laundry bills
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
    const statusLayanan = searchParams.get("statusLayanan");
    const gender = searchParams.get("gender");

    // Fetch settings
    const settingsRef = ref(database, "settings/laundry");
    const settingsSnapshot = await get(settingsRef);
    const settings = settingsSnapshot.exists()
      ? { ...DEFAULT_SETTINGS, ...settingsSnapshot.val() }
      : DEFAULT_SETTINGS;

    // Fetch all users to enrich details
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);
    const users = usersSnapshot.exists() ? usersSnapshot.val() : {};

    // Fetch all tagihan laundry
    const laundryRef = ref(database, "tagihan_laundry");
    const snapshot = await get(laundryRef);

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
    if (bulan && bulan !== "all") {
      list = list.filter((item) => item.bulan === bulan);
    }
    if (tahun && tahun !== "all") {
      list = list.filter((item) => String(item.tahun) === String(tahun));
    }
    if (status && status !== "all") {
      list = list.filter((item) => item.status === status);
    }
    if (statusLayanan && statusLayanan !== "all") {
      list = list.filter((item) => item.statusLayanan === statusLayanan);
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
        settings,
      })
    );
  } catch (error) {
    console.error("[LAUNDRY GET API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// POST: Create single or bulk tagihan laundry bulanan
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
      action,
      nominal,
      santriId,
      bulan,
      tahun,
      paketLaundry,
      kuotaKg,
      keterangan,
    } = body;

    // Fetch settings for defaults
    const settingsRef = ref(database, "settings/laundry");
    const settingsSnapshot = await get(settingsRef);
    const settings = settingsSnapshot.exists()
      ? { ...DEFAULT_SETTINGS, ...settingsSnapshot.val() }
      : DEFAULT_SETTINGS;

    const currentMonth = bulan || BULAN_LIST[new Date().getMonth()];
    const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
    const defaultNom = nominal ? parseInt(nominal) : settings.defaultNominal;
    const defaultPaketName = paketLaundry || settings.defaultPaket;
    const defaultKuota = kuotaKg ? parseInt(kuotaKg) : settings.kuotaKg;

    // 1. Bulk generate for all active santri in this month & year
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

      // Check existing laundry bills for this month and year
      const laundryRef = ref(database, "tagihan_laundry");
      const snapshot = await get(laundryRef);
      const existingBills = snapshot.exists() ? snapshot.val() : {};

      const createdList: any[] = [];
      let skippedCount = 0;

      for (const santri of santriList) {
        const alreadyExists = Object.values(existingBills).some(
          (item: any) =>
            item.santriId === santri.id &&
            item.bulan === currentMonth &&
            item.tahun === currentYear
        );

        if (alreadyExists) {
          skippedCount++;
          continue;
        }

        const newBillRef = push(laundryRef);
        const billId = newBillRef.key!;
        const billData = {
          id: billId,
          santriId: santri.id,
          santriName: santri.name,
          santriGender: santri.gender || "",
          santriNis: santri.nis || "",
          parentId: santri.parentId || "",
          bulan: currentMonth,
          tahun: currentYear,
          nominal: defaultNom,
          paketLaundry: defaultPaketName,
          kuotaKg: defaultKuota,
          status: "belum_bayar",
          statusLayanan: "aktif",
          keterangan:
            keterangan ||
            `Tagihan Layanan Laundry Bulan ${currentMonth} ${currentYear}: ${santri.name}`,
          createdAt: new Date().toISOString(),
          createdBy: (session.user as any)?.id || "",
          createdByName: session.user?.name || "Petugas",
        };

        await set(newBillRef, billData);
        createdList.push(billData);
      }

      return addCorsHeaders(
        NextResponse.json({
          message: `Berhasil membuat ${createdList.length} tagihan laundry bulan ${currentMonth} ${currentYear} (${skippedCount} sudah ada)`,
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
    const laundryRef = ref(database, "tagihan_laundry");

    // Check duplicate for this month and year
    const snapshot = await get(laundryRef);
    if (snapshot.exists()) {
      const existing = snapshot.val();
      const duplicate = Object.values(existing).find(
        (b: any) =>
          b.santriId === santriId &&
          b.bulan === currentMonth &&
          b.tahun === currentYear
      );
      if (duplicate) {
        return NextResponse.json(
          {
            error: `Santri ${santri.name} sudah memiliki tagihan laundry untuk bulan ${currentMonth} ${currentYear}.`,
          },
          { status: 400 }
        );
      }
    }

    const newBillRef = push(laundryRef);
    const billId = newBillRef.key!;

    const billData = {
      id: billId,
      santriId: santri.id || santriId,
      santriName: santri.name,
      santriGender: santri.gender || "",
      santriNis: santri.nis || "",
      parentId: santri.parentId || "",
      bulan: currentMonth,
      tahun: currentYear,
      nominal: defaultNom,
      paketLaundry: defaultPaketName,
      kuotaKg: defaultKuota,
      status: "belum_bayar",
      statusLayanan: "aktif",
      keterangan:
        keterangan ||
        `Tagihan Layanan Laundry Bulan ${currentMonth} ${currentYear}: ${santri.name}`,
      createdAt: new Date().toISOString(),
      createdBy: (session.user as any)?.id || "",
      createdByName: session.user?.name || "Petugas",
    };

    await set(newBillRef, billData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Tagihan laundry berhasil dibuat",
        tagihan: billData,
      })
    );
  } catch (error) {
    console.error("[LAUNDRY POST API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// PUT: Update tagihan laundry (submit payment, verify, update layanan, edit)
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

    const billRef = ref(database, `tagihan_laundry/${id}`);
    const billSnapshot = await get(billRef);

    if (!billSnapshot.exists()) {
      return NextResponse.json(
        { error: "Tagihan laundry tidak ditemukan" },
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
        buktiFileName: buktiFileName || "bukti_laundry.jpg",
        catatanOrangTua: catatanOrangTua || "",
        status: "menunggu_verifikasi",
        tanggalBayar: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await update(billRef, updateData);

      return addCorsHeaders(
        NextResponse.json({
          message:
            "Bukti pembayaran laundry berhasil diunggah. Menunggu verifikasi petugas.",
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

      const updateData: any = {
        status: newStatus,
        catatanPetugas: catatanPetugas || "",
        verifiedAt: new Date().toISOString(),
        verifiedBy: (session.user as any)?.id || "",
        verifiedByName: session.user?.name || "Petugas",
        updatedAt: new Date().toISOString(),
      };

      if (newStatus === "lunas") {
        updateData.statusLayanan = "aktif";
      }

      await update(billRef, updateData);

      return addCorsHeaders(
        NextResponse.json({
          message:
            newStatus === "lunas"
              ? "Pembayaran laundry berhasil disetujui (Lunas)"
              : "Pembayaran laundry telah ditolak",
          tagihan: { ...existingBill, ...updateData },
        })
      );
    }

    // 3. Petugas update status layanan laundry (aktif, nonaktif, ditangguhkan)
    if (action === "update_status_layanan") {
      if (
        session.user.role !== "admin" &&
        session.user.role !== "petugas"
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const { statusLayanan } = body;

      const updateData = {
        statusLayanan: statusLayanan || "aktif",
        updatedAt: new Date().toISOString(),
      };

      await update(billRef, updateData);

      return addCorsHeaders(
        NextResponse.json({
          message: "Status layanan laundry berhasil diperbarui",
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
      bulan: editBulan,
      tahun: editTahun,
      paketLaundry: editPaketLaundry,
      kuotaKg: editKuotaKg,
      keterangan: editKeterangan,
      status: manualStatus,
      statusLayanan: manualStatusLayanan,
    } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (nominal !== undefined) updateData.nominal = parseInt(nominal);
    if (editBulan !== undefined) updateData.bulan = editBulan;
    if (editTahun !== undefined) updateData.tahun = parseInt(editTahun);
    if (editPaketLaundry !== undefined) updateData.paketLaundry = editPaketLaundry;
    if (editKuotaKg !== undefined) updateData.kuotaKg = parseInt(editKuotaKg);
    if (editKeterangan !== undefined) updateData.keterangan = editKeterangan;
    if (manualStatus !== undefined) updateData.status = manualStatus;
    if (manualStatusLayanan !== undefined)
      updateData.statusLayanan = manualStatusLayanan;

    await update(billRef, updateData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Data tagihan laundry berhasil diperbarui",
        tagihan: { ...existingBill, ...updateData },
      })
    );
  } catch (error) {
    console.error("[LAUNDRY PUT API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// DELETE: Remove a tagihan laundry
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

    const billRef = ref(database, `tagihan_laundry/${id}`);
    const snapshot = await get(billRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Tagihan tidak ditemukan" },
        { status: 404 }
      );
    }

    await remove(billRef);

    return addCorsHeaders(
      NextResponse.json({ message: "Tagihan laundry berhasil dihapus" })
    );
  } catch (error) {
    console.error("[LAUNDRY DELETE API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
