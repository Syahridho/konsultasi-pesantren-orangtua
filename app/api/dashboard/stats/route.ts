import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

// Helper function to get date range
function getDateRange(days: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return { startDate, endDate };
}

// Get admin dashboard statistics
async function getAdminStats() {
  try {
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);

    const classesRef = ref(database, "classes");
    const classesSnapshot = await get(classesRef);

    const chatsRef = ref(database, "chats");
    const chatsSnapshot = await get(chatsRef);

    let totalUsers = 0;
    let totalSantri = 0;
    let santriLaki = 0;
    let santriPerempuan = 0;
    let totalUstad = 0;
    let totalOrangtua = 0;
    let totalPetugas = 0;
    let newUsersThisMonth = 0;
    let ustadOnline = 0;

    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      Object.values(users).forEach((user: any) => {
        if (!user) return;
        totalUsers++;

        const userRole = (user.role || "").toLowerCase().trim();

        // Count by role
        if (userRole === "santri") {
          totalSantri++;
          const gender = (user.gender || user.jenisKelamin || "").toUpperCase();
          if (gender === "L") santriLaki++;
          else if (gender === "P") santriPerempuan++;
        } else if (userRole === "ustad" || userRole === "guru") {
          totalUstad++;
        } else if (userRole === "orangtua" || userRole === "wali") {
          totalOrangtua++;
        } else if (userRole === "petugas" || userRole === "staff" || userRole === "keuangan") {
          totalPetugas++;
        }

        // Count new users this month
        if (user.createdAt) {
          try {
            const createdDate = new Date(user.createdAt);
            if (createdDate >= firstDayOfMonth) {
              newUsersThisMonth++;
            }
          } catch (e) {}
        }

        // Count online ustad (last active within 30 minutes)
        if ((userRole === "ustad" || userRole === "guru") && user.lastActive) {
          try {
            const lastActive = new Date(user.lastActive);
            const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
            if (lastActive >= thirtyMinutesAgo) {
              ustadOnline++;
            }
          } catch (e) {}
        }
      });
    }

    // Count total classes
    let totalClasses = 0;
    let activeClasses = 0;
    if (classesSnapshot.exists()) {
      const classes = classesSnapshot.val();
      Object.values(classes).forEach((classData: any) => {
        if (!classData) return;
        totalClasses++;
        if (classData.status === "active") {
          activeClasses++;
        }
      });
    }

    // Count total chats
    let totalChats = 0;
    let activeChats = 0;
    if (chatsSnapshot.exists()) {
      const chats = chatsSnapshot.val();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      Object.values(chats).forEach((chat: any) => {
        if (!chat) return;
        totalChats++;
        if (chat.lastMessageTime) {
          try {
            const lastMessageDate = new Date(chat.lastMessageTime);
            if (lastMessageDate >= oneDayAgo) {
              activeChats++;
            }
          } catch (e) {}
        }
      });
    }

    // Get laporan count from Realtime Database (quranReports, academicReports, behaviorReports)
    let totalLaporan = 0;
    let laporanThisMonth = 0;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const reportKeys = ["quranReports", "academicReports", "behaviorReports", "laporan"];
    for (const key of reportKeys) {
      try {
        const repRef = ref(database, key);
        const repSnap = await get(repRef);
        if (repSnap.exists()) {
          Object.values(repSnap.val()).forEach((rep: any) => {
            if (!rep) return;
            totalLaporan++;
            const dateField = rep.testDate || rep.tanggal || rep.createdAt || rep.updatedAt;
            if (dateField) {
              try {
                const repDate = new Date(dateField);
                if (repDate >= firstDayOfMonth) {
                  laporanThisMonth++;
                }
              } catch (e) {}
            }
          });
        }
      } catch (e) {
        console.error(`Error reading ${key} in stats:`, e);
      }
    }

    // Get total saldo santri
    let totalSaldo = 0;
    try {
      const saldoRef = ref(database, "saldo");
      const saldoSnapshot = await get(saldoRef);
      if (saldoSnapshot.exists()) {
        const saldoData = saldoSnapshot.val();
        Object.values(saldoData).forEach((s: any) => {
          if (!s) return;
          totalSaldo += typeof s.amount === "number" ? s.amount : Number(s.amount) || 0;
        });
      }
    } catch (err) {
      console.error("Error fetching saldo for admin stats:", err);
    }

    // Comprehensive Financial Modules Breakdown & Transactions
    const finance = {
      spp: { totalLunas: 0, pendingCount: 0, totalBills: 0 },
      uangMasuk: { totalLunas: 0, pendingCount: 0, totalBills: 0 },
      seragam: { totalLunas: 0, pendingCount: 0, totalBills: 0 },
      bukuPaket: { totalLunas: 0, pendingCount: 0, totalBills: 0 },
      laundry: { totalLunas: 0, pendingCount: 0, totalBills: 0 },
    };

    const allRecentTransactions: any[] = [];

    // 1. Tagihan SPP / Iuran
    try {
      const iuranRef = ref(database, "tagihan_iuran");
      const iuranSnap = await get(iuranRef);
      if (iuranSnap.exists()) {
        Object.entries(iuranSnap.val()).forEach(([key, item]: [string, any]) => {
          if (!item) return;
          finance.spp.totalBills++;
          const nominal = Number(item.nominal || item.amount || 0);
          if (item.status === "lunas") {
            finance.spp.totalLunas += nominal;
          } else if (item.status === "menunggu_verifikasi") {
            finance.spp.pendingCount++;
          }
          if (item.tanggalBayar || item.createdAt) {
            allRecentTransactions.push({
              id: item.id || key,
              santriName: item.santriName || "Santri",
              jenis: "SPP Bulanan",
              keterangan: `${item.bulan || ""} ${item.tahun || ""}`.trim() || "Iuran Bulanan",
              nominal,
              status: item.status || "belum_bayar",
              date: item.tanggalBayar || item.createdAt,
              href: "/dashboard/iuran",
            });
          }
        });
      }
    } catch (e) {
      console.error("Error iuran stats:", e);
    }

    // 2. Tagihan Uang Masuk
    try {
      const umRef = ref(database, "tagihan_uang_masuk");
      const umSnap = await get(umRef);
      if (umSnap.exists()) {
        Object.entries(umSnap.val()).forEach(([key, item]: [string, any]) => {
          if (!item) return;
          finance.uangMasuk.totalBills++;
          const nominal = Number(item.nominal || 0);
          if (item.status === "lunas") {
            finance.uangMasuk.totalLunas += nominal;
          } else if (item.status === "menunggu_verifikasi") {
            finance.uangMasuk.pendingCount++;
          }
          if (item.tanggalBayar || item.createdAt) {
            allRecentTransactions.push({
              id: item.id || key,
              santriName: item.santriName || "Santri Baru",
              jenis: "Uang Masuk",
              keterangan: `Gelombang ${item.gelombang || "1"}`,
              nominal,
              status: item.status || "belum_bayar",
              date: item.tanggalBayar || item.createdAt,
              href: "/dashboard/uang-masuk",
            });
          }
        });
      }
    } catch (e) {
      console.error("Error uang masuk stats:", e);
    }

    // 3. Tagihan Seragam
    try {
      const srgRef = ref(database, "tagihan_seragam");
      const srgSnap = await get(srgRef);
      if (srgSnap.exists()) {
        Object.entries(srgSnap.val()).forEach(([key, item]: [string, any]) => {
          if (!item) return;
          finance.seragam.totalBills++;
          const nominal = Number(item.nominal || 0);
          if (item.status === "lunas") {
            finance.seragam.totalLunas += nominal;
          } else if (item.status === "menunggu_verifikasi") {
            finance.seragam.pendingCount++;
          }
          if (item.tanggalBayar || item.createdAt) {
            allRecentTransactions.push({
              id: item.id || key,
              santriName: item.santriName || "Santri",
              jenis: "Paket Seragam",
              keterangan: `Ukuran ${item.ukuran || "L"}`,
              nominal,
              status: item.status || "belum_bayar",
              date: item.tanggalBayar || item.createdAt,
              href: "/dashboard/seragam",
            });
          }
        });
      }
    } catch (e) {
      console.error("Error seragam stats:", e);
    }

    // 4. Tagihan Buku Paket / Kitab
    try {
      const bkRef = ref(database, "tagihan_buku_paket");
      const bkSnap = await get(bkRef);
      if (bkSnap.exists()) {
        Object.entries(bkSnap.val()).forEach(([key, item]: [string, any]) => {
          if (!item) return;
          finance.bukuPaket.totalBills++;
          const nominal = Number(item.nominal || 0);
          if (item.status === "lunas") {
            finance.bukuPaket.totalLunas += nominal;
          } else if (item.status === "menunggu_verifikasi") {
            finance.bukuPaket.pendingCount++;
          }
          if (item.tanggalBayar || item.createdAt) {
            allRecentTransactions.push({
              id: item.id || key,
              santriName: item.santriName || "Santri",
              jenis: "Buku Paket / Kitab",
              keterangan: item.tingkatKelas || "Kenaikan Kelas",
              nominal,
              status: item.status || "belum_bayar",
              date: item.tanggalBayar || item.createdAt,
              href: "/dashboard/buku-paket",
            });
          }
        });
      }
    } catch (e) {
      console.error("Error buku paket stats:", e);
    }

    // 5. Tagihan Laundry
    try {
      const lndRef = ref(database, "tagihan_laundry");
      const lndSnap = await get(lndRef);
      if (lndSnap.exists()) {
        Object.entries(lndSnap.val()).forEach(([key, item]: [string, any]) => {
          if (!item) return;
          finance.laundry.totalBills++;
          const nominal = Number(item.nominal || 0);
          if (item.status === "lunas") {
            finance.laundry.totalLunas += nominal;
          } else if (item.status === "menunggu_verifikasi") {
            finance.laundry.pendingCount++;
          }
          if (item.tanggalBayar || item.createdAt) {
            allRecentTransactions.push({
              id: item.id || key,
              santriName: item.santriName || "Santri",
              jenis: "Laundry Bulanan",
              keterangan: `${item.bulan || ""} ${item.tahun || ""}`.trim() || "Iuran Laundry",
              nominal,
              status: item.status || "belum_bayar",
              date: item.tanggalBayar || item.createdAt,
              href: "/dashboard/laundry",
            });
          }
        });
      }
    } catch (e) {
      console.error("Error laundry stats:", e);
    }

    // 6. Surat Peringatan Aktif
    let totalPeringatanAktif = 0;
    try {
      const spRef = ref(database, "peringatan_tagihan");
      const spSnap = await get(spRef);
      if (spSnap.exists()) {
        Object.values(spSnap.val()).forEach((item: any) => {
          if (item && item.status === "aktif") {
            totalPeringatanAktif++;
          }
        });
      }
    } catch (e) {
      console.error("Error peringatan stats:", e);
    }

    // Sort recent transactions by date descending and take top 6
    allRecentTransactions.sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
    const recentTransactions = allRecentTransactions.slice(0, 6);

    const totalPendingVerifikasi =
      finance.spp.pendingCount +
      finance.uangMasuk.pendingCount +
      finance.seragam.pendingCount +
      finance.bukuPaket.pendingCount +
      finance.laundry.pendingCount;

    const totalPemasukanLunas =
      finance.spp.totalLunas +
      finance.uangMasuk.totalLunas +
      finance.seragam.totalLunas +
      finance.bukuPaket.totalLunas +
      finance.laundry.totalLunas;

    return {
      totalUsers,
      totalSantri,
      santriLaki,
      santriPerempuan,
      totalUstad,
      totalOrangtua,
      totalPetugas,
      totalClasses,
      activeClasses,
      totalChats,
      activeChats,
      newUsersThisMonth,
      ustadOnline,
      totalLaporan,
      laporanThisMonth,
      totalSaldo,
      tagihanIuranPending: finance.spp.pendingCount,
      totalPendingVerifikasi,
      totalPemasukanLunas,
      totalPeringatanAktif,
      finance,
      recentTransactions,
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    throw error;
  }
}

// Get ustad dashboard statistics
async function getUstadStats(ustadId: string) {
  try {
    const classesRef = ref(database, "classes");
    const classesSnapshot = await get(classesRef);

    let totalClasses = 0;
    let totalStudents = 0;
    const studentIds = new Set<string>();

    if (classesSnapshot.exists()) {
      const classes = classesSnapshot.val();
      Object.values(classes).forEach((classData: any) => {
        if (!classData) return;
        if (classData.ustadId === ustadId) {
          totalClasses++;
          if (classData.studentIds) {
            Object.keys(classData.studentIds).forEach((studentId) => {
              studentIds.add(studentId);
            });
          }
        }
      });
    }
    totalStudents = studentIds.size;

    // Get reports created by this ustad from Realtime Database
    let totalLaporan = 0;
    let laporanThisMonth = 0;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const reportKeys = ["quranReports", "academicReports", "behaviorReports", "laporan"];
    for (const key of reportKeys) {
      try {
        const repRef = ref(database, key);
        const repSnap = await get(repRef);
        if (repSnap.exists()) {
          Object.values(repSnap.val()).forEach((rep: any) => {
            if (rep && rep.ustadId === ustadId) {
              totalLaporan++;
              const dateField = rep.testDate || rep.tanggal || rep.createdAt || rep.updatedAt;
              if (dateField) {
                try {
                  const repDate = new Date(dateField);
                  if (repDate >= firstDayOfMonth) {
                    laporanThisMonth++;
                  }
                } catch (e) {}
              }
            }
          });
        }
      } catch (e) {}
    }

    return {
      totalClasses,
      totalStudents,
      totalLaporan,
      laporanThisMonth,
    };
  } catch (error) {
    console.error("Error getting ustad stats:", error);
    throw error;
  }
}

// Get orangtua dashboard statistics
async function getOrangtuaStats(parentId: string) {
  try {
    const userRef = ref(database, `users/${parentId}`);
    const userSnapshot = await get(userRef);

    let totalChildren = 0;
    const studentIds: string[] = [];

    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      if (userData.santri) {
        totalChildren = Object.keys(userData.santri).length;
        studentIds.push(...Object.keys(userData.santri));
      }
    }

    let totalReports = 0;
    let recentReports = 0;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (studentIds.length > 0) {
      const reportKeys = ["quranReports", "academicReports", "behaviorReports", "laporan"];
      for (const key of reportKeys) {
        try {
          const repRef = ref(database, key);
          const repSnap = await get(repRef);
          if (repSnap.exists()) {
            Object.values(repSnap.val()).forEach((rep: any) => {
              if (rep && (studentIds.includes(rep.studentId) || studentIds.includes(rep.santriId))) {
                totalReports++;
                const dateField = rep.testDate || rep.tanggal || rep.createdAt || rep.updatedAt;
                if (dateField) {
                  try {
                    const repDate = new Date(dateField);
                    if (repDate >= oneWeekAgo) {
                      recentReports++;
                    }
                  } catch (e) {}
                }
              }
            });
          }
        } catch (e) {}
      }
    }

    return {
      totalChildren,
      totalReports,
      recentReports,
    };
  } catch (error) {
    console.error("Error getting orangtua stats:", error);
    throw error;
  }
}

// GET dashboard statistics based on user role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user.role || "").toLowerCase().trim();
    const userId = session.user.id;

    let statsData;

    if (role === "admin") {
      statsData = await getAdminStats();
    } else if (role === "ustad" || role === "guru") {
      statsData = await getUstadStats(userId);
    } else if (role === "orangtua" || role === "wali") {
      statsData = await getOrangtuaStats(userId);
    } else {
      // Petugas or other roles
      statsData = await getAdminStats();
    }

    return NextResponse.json({
      role: session.user.role,
      stats: statsData,
    });
  } catch (error: any) {
    console.error("Error in dashboard stats API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
