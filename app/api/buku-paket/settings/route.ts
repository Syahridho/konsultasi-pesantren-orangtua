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
  defaultNominal: 450000,
  defaultTahunAjaran: "2026/2027",
  daftarBukuPerTingkat: [
    {
      tingkat: "Kelas 7 / 1 MTs",
      nominal: 450000,
      buku: [
        "Kitab Jurumiyah (Nahwu Dasar)",
        "Kitab Matan Bina (Sharaf Dasar)",
        "Kitab Safinatun Najah (Fiqih)",
        "Kitab Aqidatul Awam (Tauhid)",
        "Buku Bahasa Arab & Tajwid",
        "Buku Modul Pelajaran Umum",
      ],
    },
    {
      tingkat: "Kelas 8 / 2 MTs",
      nominal: 480000,
      buku: [
        "Kitab Imrithi (Nahwu Lanjutan)",
        "Kitab Kailani (Sharaf Lanjutan)",
        "Kitab Fathul Qorib Juz 1 (Fiqih)",
        "Kitab Taisirul Kholaq (Akhlaq)",
        "Buku Bahasa Arab & Hadits Arba'in",
        "Buku Modul Pelajaran Umum",
      ],
    },
    {
      tingkat: "Kelas 9 / 3 MTs",
      nominal: 500000,
      buku: [
        "Kitab Alfiyah Ibnu Malik Juz 1",
        "Kitab Fathul Qorib Juz 2 (Fiqih)",
        "Kitab Ta'limul Muta'allim",
        "Kitab Tafsir Jalalain Juz 1",
        "Buku Pendalaman Materi Ujian",
      ],
    },
    {
      tingkat: "Kelas 10 / 1 MA",
      nominal: 550000,
      buku: [
        "Kitab Alfiyah Ibnu Malik Juz 2",
        "Kitab Fathul Mu'in Juz 1",
        "Kitab Bulughul Maram",
        "Kitab Ushul Fiqih (Waraqat)",
        "Buku Modul Aliyah Terpadu",
      ],
    },
    {
      tingkat: "Kelas 11 / 2 MA",
      nominal: 580000,
      buku: [
        "Kitab Fathul Mu'in Juz 2",
        "Kitab Riyadush Shalihin",
        "Kitab Qawaidul Fiqhiyyah",
        "Kitab Balaghah (Jauharul Maknun)",
      ],
    },
    {
      tingkat: "Kelas 12 / 3 MA",
      nominal: 600000,
      buku: [
        "Kitab Fathul Mu'in Juz 3",
        "Kitab Ihya Ulumuddin Mukhtashar",
        "Kitab Ulumul Quran & Hadits",
        "Buku Pembekalan Kelulusan & Pengabdian",
      ],
    },
  ],
  keterangan: "Pembayaran Paket Buku Pelajaran & Kitab Kuning Santri untuk Kenaikan Kelas / Tahun Ajaran Baru.",
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

    const settingsRef = ref(database, "settings/buku_paket");
    const snapshot = await get(settingsRef);

    const settings = snapshot.exists()
      ? { ...DEFAULT_SETTINGS, ...snapshot.val() }
      : DEFAULT_SETTINGS;

    return addCorsHeaders(NextResponse.json({ settings }));
  } catch (error) {
    console.error("[BUKU PAKET SETTINGS GET] Error:", error);
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
    const settingsRef = ref(database, "settings/buku_paket");

    const updateData = {
      bankName: body.bankName || DEFAULT_SETTINGS.bankName,
      accountNumber: body.accountNumber || DEFAULT_SETTINGS.accountNumber,
      accountHolder: body.accountHolder || DEFAULT_SETTINGS.accountHolder,
      defaultNominal: parseInt(body.defaultNominal) || DEFAULT_SETTINGS.defaultNominal,
      defaultTahunAjaran: body.defaultTahunAjaran || DEFAULT_SETTINGS.defaultTahunAjaran,
      daftarBukuPerTingkat: Array.isArray(body.daftarBukuPerTingkat) ? body.daftarBukuPerTingkat : DEFAULT_SETTINGS.daftarBukuPerTingkat,
      keterangan: body.keterangan || DEFAULT_SETTINGS.keterangan,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.name || "Petugas",
    };

    await set(settingsRef, updateData);

    return addCorsHeaders(
      NextResponse.json({
        message: "Pengaturan buku paket / kitab kuning berhasil disimpan",
        settings: updateData,
      })
    );
  } catch (error) {
    console.error("[BUKU PAKET SETTINGS PUT] Error:", error);
    return addCorsHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}
