import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { z } from "zod";

const promoteSchema = z.object({
  fromClassId: z.string().min(1, "Kelas asal wajib diisi"),
  toClassId: z.string().min(1, "Kelas tujuan wajib diisi"),
  // studentIds yang AKAN dipromosikan (tidak termasuk yang tinggal kelas)
  studentIds: z.array(z.string()).min(1, "Minimal 1 santri harus dipromosikan"),
  archiveFromClass: z.boolean().default(false),
});

// POST: Proses naik kelas massal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hanya admin yang bisa melakukan promosi kelas
    const userRef = ref(database, `users/${session.user.id}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.val();
    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = promoteSchema.parse(body);

    const { fromClassId, toClassId, studentIds, archiveFromClass } = validated;

    // Validasi: kelas asal dan tujuan tidak boleh sama
    if (fromClassId === toClassId) {
      return NextResponse.json(
        { error: "Kelas asal dan kelas tujuan tidak boleh sama" },
        { status: 400 }
      );
    }

    // Ambil data kelas asal
    const fromClassRef = ref(database, `classes/${fromClassId}`);
    const fromClassSnapshot = await get(fromClassRef);

    if (!fromClassSnapshot.exists()) {
      return NextResponse.json(
        { error: "Kelas asal tidak ditemukan" },
        { status: 404 }
      );
    }

    const fromClassData = fromClassSnapshot.val();

    // Ambil data kelas tujuan
    const toClassRef = ref(database, `classes/${toClassId}`);
    const toClassSnapshot = await get(toClassRef);

    if (!toClassSnapshot.exists()) {
      return NextResponse.json(
        { error: "Kelas tujuan tidak ditemukan" },
        { status: 404 }
      );
    }

    const toClassData = toClassSnapshot.val();
    const promotedAt = new Date().toISOString();
    const promotedBy = session.user.id;
    const promotedByName = userData.name;

    // Siapkan update massal menggunakan Firebase multi-path update
    const updates: Record<string, any> = {};

    // 1. Hapus santri yang dipromosikan dari kelas asal
    for (const studentId of studentIds) {
      updates[`classes/${fromClassId}/studentIds/${studentId}`] = null;
    }

    // 2. Tambahkan santri ke kelas tujuan
    for (const studentId of studentIds) {
      updates[`classes/${toClassId}/studentIds/${studentId}`] = {
        enrolledAt: promotedAt,
        status: "active",
        promotedFrom: fromClassId,
        promotedFromName: fromClassData.name,
      };
    }

    // 3. Simpan riwayat promosi di setiap santri + update currentClass
    for (const studentId of studentIds) {
      // Buat key unik untuk history entry berdasarkan timestamp
      const historyKey = `prom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      updates[`users/${studentId}/promotionHistory/${historyKey}`] = {
        fromClassId,
        fromClassName: fromClassData.name,
        toClassId,
        toClassName: toClassData.name,
        academicYearFrom: fromClassData.academicYear,
        academicYearTo: toClassData.academicYear,
        promotedAt,
        promotedBy,
        promotedByName,
      };
      // Update tingkatan kelas aktif santri (ditampilkan di /home untuk orang tua)
      updates[`users/${studentId}/currentClass`] = toClassData.name;
    }

    // 4. Arsipkan kelas asal jika diminta
    if (archiveFromClass) {
      updates[`classes/${fromClassId}/status`] = "archived";
      updates[`classes/${fromClassId}/archivedAt`] = promotedAt;
      updates[`classes/${fromClassId}/archivedBy`] = promotedBy;
    }

    // 5. Update timestamp kelas tujuan
    updates[`classes/${toClassId}/updatedAt`] = promotedAt;
    updates[`classes/${toClassId}/updatedBy`] = promotedBy;

    // Eksekusi semua update sekaligus (atomic)
    const rootRef = ref(database);
    await update(rootRef, updates);

    console.log(
      `[PROMOTE API] Successfully promoted ${studentIds.length} students from ${fromClassData.name} to ${toClassData.name}`
    );

    return NextResponse.json({
      message: `${studentIds.length} santri berhasil dipromosikan ke ${toClassData.name}`,
      promotedCount: studentIds.length,
      fromClass: { id: fromClassId, name: fromClassData.name },
      toClass: { id: toClassId, name: toClassData.name },
      archived: archiveFromClass,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[PROMOTE API] Error promoting students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
