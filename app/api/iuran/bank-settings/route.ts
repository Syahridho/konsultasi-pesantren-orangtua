import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { handleCorsPreflight, addCorsHeaders } from "@/lib/cors";

export async function GET(request: NextRequest) {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  try {
    const bankRef = ref(database, "settings/bank");
    const snapshot = await get(bankRef);

    const bankSettings = snapshot.exists()
      ? snapshot.val()
      : {
          bankName: "Bank Syariah Indonesia (BSI)",
          accountNumber: "7123456789",
          accountHolder: "Pondok Pesantren Baiturrahman",
          defaultNominal: 350000,
          keterangan: "Pembayaran SPP paling lambat tanggal 10 setiap bulan",
        };

    return addCorsHeaders(NextResponse.json({ bankSettings }));
  } catch (error) {
    console.error("[BANK SETTINGS GET API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

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
      bankName,
      accountNumber,
      accountHolder,
      defaultNominal,
      keterangan,
    } = body;

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { error: "Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi" },
        { status: 400 }
      );
    }

    const bankData = {
      bankName,
      accountNumber,
      accountHolder,
      defaultNominal: parseInt(defaultNominal) || 350000,
      keterangan: keterangan || "",
      updatedAt: new Date().toISOString(),
      updatedBy: (session.user as any)?.id || "",
      updatedByName: session.user?.name || "Petugas",
    };

    const bankRef = ref(database, "settings/bank");
    await set(bankRef, bankData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Pengaturan rekening bank pesantren berhasil disimpan",
        bankSettings: bankData,
      })
    );
  } catch (error) {
    console.error("[BANK SETTINGS POST API] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
