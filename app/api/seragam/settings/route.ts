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

// GET settings
export async function GET(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settingsRef = ref(database, "settings/seragam");
    const snapshot = await get(settingsRef);

    const settings = snapshot.exists()
      ? { ...DEFAULT_SETTINGS, ...snapshot.val() }
      : DEFAULT_SETTINGS;

    return addCorsHeaders(NextResponse.json({ settings }));
  } catch (error) {
    console.error("[SERAGAM SETTINGS GET] Error:", error);
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
    const settingsRef = ref(database, "settings/seragam");

    const updateData = {
      bankName: body.bankName || DEFAULT_SETTINGS.bankName,
      accountNumber: body.accountNumber || DEFAULT_SETTINGS.accountNumber,
      accountHolder: body.accountHolder || DEFAULT_SETTINGS.accountHolder,
      defaultNominal: parseInt(body.defaultNominal) || DEFAULT_SETTINGS.defaultNominal,
      rincianPaket: Array.isArray(body.rincianPaket) ? body.rincianPaket : DEFAULT_SETTINGS.rincianPaket,
      keterangan: body.keterangan || DEFAULT_SETTINGS.keterangan,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.name || "Petugas",
    };

    await set(settingsRef, updateData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Pengaturan seragam berhasil disimpan",
        settings: updateData,
      })
    );
  } catch (error) {
    console.error("[SERAGAM SETTINGS PUT] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
