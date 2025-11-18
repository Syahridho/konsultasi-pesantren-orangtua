import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firestore";

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
    let totalUstad = 0;
    let totalOrangtua = 0;
    let newUsersThisMonth = 0;
    let ustadOnline = 0;

    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      Object.values(users).forEach((user: any) => {
        totalUsers++;
        
        // Count by role
        if (user.role === "santri") totalSantri++;
        else if (user.role === "ustad") totalUstad++;
        else if (user.role === "orangtua") totalOrangtua++;

        // Count new users this month
        if (user.createdAt) {
          const createdDate = new Date(user.createdAt);
          if (createdDate >= firstDayOfMonth) {
            newUsersThisMonth++;
          }
        }

        // Count online ustad (last active within 30 minutes)
        if (user.role === "ustad" && user.lastActive) {
          const lastActive = new Date(user.lastActive);
          const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
          if (lastActive >= thirtyMinutesAgo) {
            ustadOnline++;
          }
        }
      });
    }

    // Count total classes
    let totalClasses = 0;
    let activeClasses = 0;
    if (classesSnapshot.exists()) {
      const classes = classesSnapshot.val();
      Object.values(classes).forEach((classData: any) => {
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
        totalChats++;
        if (chat.lastMessageTime) {
          const lastMessageDate = new Date(chat.lastMessageTime);
          if (lastMessageDate >= oneDayAgo) {
            activeChats++;
          }
        }
      });
    }

    // Get laporan count from Firestore
    let totalLaporan = 0;
    let laporanThisMonth = 0;
    try {
      const laporanSnapshot = await getDocs(collection(db, "laporan"));
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      laporanSnapshot.forEach((doc) => {
        totalLaporan++;
        const data = doc.data();
        if (data.tanggal) {
          const tanggalLaporan = data.tanggal.toDate();
          if (tanggalLaporan >= firstDayOfMonth) {
            laporanThisMonth++;
          }
        }
      });
    } catch (error) {
      console.error("Error fetching laporan:", error);
    }

    return {
      totalUsers,
      totalSantri,
      totalUstad,
      totalOrangtua,
      totalClasses,
      activeClasses,
      totalChats,
      activeChats,
      newUsersThisMonth,
      ustadOnline,
      totalLaporan,
      laporanThisMonth,
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    throw error;
  }
}

// Get ustad dashboard statistics
async function getUstadStats(ustadId: string) {
  try {
    // Get classes taught by this ustad
    const classesRef = ref(database, "classes");
    const classesSnapshot = await get(classesRef);
    
    let totalClasses = 0;
    let totalStudents = 0;
    const studentIds = new Set<string>();

    if (classesSnapshot.exists()) {
      const classes = classesSnapshot.val();
      Object.values(classes).forEach((classData: any) => {
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

    // Get chats for this ustad
    const chatsRef = ref(database, "chats");
    const chatsSnapshot = await get(chatsRef);
    
    let totalChats = 0;
    let activeChats = 0;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (chatsSnapshot.exists()) {
      const chats = chatsSnapshot.val();
      Object.values(chats).forEach((chat: any) => {
        if (chat.participant1Id === ustadId || chat.participant2Id === ustadId) {
          totalChats++;
          if (chat.lastMessageTime) {
            const lastMessageDate = new Date(chat.lastMessageTime);
            if (lastMessageDate >= oneDayAgo) {
              activeChats++;
            }
          }
        }
      });
    }

    // Get laporan created by this ustad from Firestore
    let totalLaporan = 0;
    let laporanThisWeek = 0;
    let laporanThisMonth = 0;
    let laporanByCategory = {
      hafalan: 0,
      akademik: 0,
      perilaku: 0,
    };

    try {
      const laporanQuery = query(
        collection(db, "laporan"),
        where("ustadzId", "==", ustadId)
      );
      const laporanSnapshot = await getDocs(laporanQuery);
      
      const now = new Date();
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - now.getDay());
      firstDayOfWeek.setHours(0, 0, 0, 0);
      
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      laporanSnapshot.forEach((doc) => {
        totalLaporan++;
        const data = doc.data();
        
        // Count by category
        if (data.kategori === "hafalan") laporanByCategory.hafalan++;
        else if (data.kategori === "akademik") laporanByCategory.akademik++;
        else if (data.kategori === "perilaku") laporanByCategory.perilaku++;
        
        // Count by time period
        if (data.tanggal) {
          const tanggalLaporan = data.tanggal.toDate();
          if (tanggalLaporan >= firstDayOfWeek) {
            laporanThisWeek++;
          }
          if (tanggalLaporan >= firstDayOfMonth) {
            laporanThisMonth++;
          }
        }
      });
    } catch (error) {
      console.error("Error fetching ustad laporan:", error);
    }

    return {
      totalClasses,
      totalStudents,
      totalChats,
      activeChats,
      totalLaporan,
      laporanThisWeek,
      laporanThisMonth,
      laporanByCategory,
    };
  } catch (error) {
    console.error("Error getting ustad stats:", error);
    throw error;
  }
}

// GET: Fetch dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userId = session.user.id;

    if (userRole === "admin") {
      const stats = await getAdminStats();
      return NextResponse.json({ role: "admin", stats });
    } else if (userRole === "ustad") {
      if (!userId) {
        return NextResponse.json({ error: "User ID not found" }, { status: 400 });
      }
      const stats = await getUstadStats(userId);
      return NextResponse.json({ role: "ustad", stats });
    } else {
      return NextResponse.json(
        { error: "Dashboard stats not available for this role" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("[DASHBOARD STATS API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
