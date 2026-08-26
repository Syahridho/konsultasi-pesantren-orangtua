import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { handleCorsPreflight, addCorsHeaders } from "@/lib/cors";

const DEFAULT_SETTINGS = {
  bankName: "Bank Syariah Indonesia (BSI)",
  accountNumber: "7123456789",
  accountHolder: "Pondok Pesantren Baiturrahman",
  defaultNominal: 100000,
  defaultPaket: "Paket Cuci & Setrika Reguler (Max 20 Kg/Bulan)",
  kuotaKg: 20,
  keterangan: "Pembayaran Iuran Layanan Laundry Santri Bulanan (Cuci + Kering + Setrika Rapi).",
};

// GET settings
export async function GET(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settingsRef = ref(database, "settings/laundry");
    const snapshot = await get(settingsRef);

    const settings = snapshot.exists()
      ? { ...DEFAULT_SETTINGS, ...snapshot.val() }
      : DEFAULT_SETTINGS;

    return addCorsHeaders(NextResponse.json({ settings }));
  } catch (error) {
    console.error("[LAUNDRY SETTINGS GET] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

// PUT settings
export async function PUT(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "petugas")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const settingsRef = ref(database, "settings/laundry");

    const updateData = {
      bankName: body.bankName || DEFAULT_SETTINGS.bankName,
      accountNumber: body.accountNumber || DEFAULT_SETTINGS.accountNumber,
      accountHolder: body.accountHolder || DEFAULT_SETTINGS.accountHolder,
      defaultNominal: parseInt(body.defaultNominal) || DEFAULT_SETTINGS.defaultNominal,
      defaultPaket: body.defaultPaket || DEFAULT_SETTINGS.defaultPaket,
      kuotaKg: parseInt(body.kuotaKg) || DEFAULT_SETTINGS.kuotaKg,
      keterangan: body.keterangan || DEFAULT_SETTINGS.keterangan,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.name || "Petugas",
    };

    await set(settingsRef, updateData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Pengaturan laundry berhasil disimpan",
        settings: updateData,
      })
    );
  } catch (error) {
    console.error("[LAUNDRY SETTINGS PUT] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
