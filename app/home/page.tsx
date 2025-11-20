"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import {
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Clock,
  User,
  TrendingUp,
  Award,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Report {
  id: string;
  kategori: "hafalan" | "akademik" | "perilaku";
  santriId: string;
  santriName: string;
  ustadzName: string;
  ustadId: string;
  tanggal: string;
  isi: any;
  createdAt?: string;
}

interface Santri {
  id: string;
  name: string;
  nis: string;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "orangtua") {
      toast.error("Halaman ini hanya untuk orang tua");
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Get parent data to find student IDs
      const parentRef = ref(database, `users/${session.user.id}`);
      const parentSnapshot = await get(parentRef);

      if (!parentSnapshot.exists()) {
        toast.error("Data orang tua tidak ditemukan");
        return;
      }

      const parentData = parentSnapshot.val();
      let studentIds: string[] = [];

      // Get student IDs
      if (parentData.studentIds && Array.isArray(parentData.studentIds)) {
        studentIds = parentData.studentIds;
      }

      if (studentIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch santri details
      const usersRef = ref(database, "users");
      const usersSnapshot = await get(usersRef);
      const santriData: Santri[] = [];

      if (usersSnapshot.exists()) {
        const users = usersSnapshot.val();
        studentIds.forEach((studentId) => {
          if (users[studentId]) {
            santriData.push({
              id: studentId,
              name: users[studentId].name || "Tidak ada nama",
              nis: users[studentId].nis || "",
            });
          }
        });
      }

      setSantriList(santriData);

      // Fetch reports from Firestore
      const allReports: Report[] = [];

      // Fetch Quran reports
      const quranReportsRef = ref(database, "quranReports");
      const quranSnapshot = await get(quranReportsRef);
      if (quranSnapshot.exists()) {
        const quranReports = quranSnapshot.val();
        Object.keys(quranReports).forEach((reportId) => {
          const report = quranReports[reportId];
          if (studentIds.includes(report.studentId)) {
            allReports.push({
              id: reportId,
              kategori: "hafalan",
              santriId: report.studentId,
              santriName: report.studentName || "Unknown",
              ustadzName: report.ustadName || "Unknown",
              ustadId: report.ustadId || "",
              tanggal: report.testDate || report.createdAt,
              isi: {
                surat: report.surah,
                ayat: `${report.ayatStart}-${report.ayatEnd}`,
                predikat: report.fluencyLevel,
              },
              createdAt: report.createdAt,
            });
          }
        });
      }

      // Fetch Academic reports
      const academicReportsRef = ref(database, "academicReports");
      const academicSnapshot = await get(academicReportsRef);
      if (academicSnapshot.exists()) {
        const academicReports = academicSnapshot.val();
        Object.keys(academicReports).forEach((reportId) => {
          const report = academicReports[reportId];
          if (studentIds.includes(report.studentId)) {
            allReports.push({
              id: reportId,
              kategori: "akademik",
              santriId: report.studentId,
              santriName: report.studentName || "Unknown",
              ustadzName: report.ustadName || "Unknown",
              ustadId: report.ustadId || "",
              tanggal: report.createdAt,
              isi: {
                mapel: report.subject,
                nilai: report.gradeNumber,
              },
              createdAt: report.createdAt,
            });
          }
        });
      }

      // Fetch Behavior reports
      const behaviorReportsRef = ref(database, "behaviorReports");
      const behaviorSnapshot = await get(behaviorReportsRef);
      if (behaviorSnapshot.exists()) {
        const behaviorReports = behaviorSnapshot.val();
        Object.keys(behaviorReports).forEach((reportId) => {
          const report = behaviorReports[reportId];
          if (studentIds.includes(report.studentId)) {
            allReports.push({
              id: reportId,
              kategori: "perilaku",
              santriId: report.studentId,
              santriName: report.studentName || "Unknown",
              ustadzName: report.ustadName || "Unknown",
              ustadId: report.ustadId || "",
              tanggal: report.incidentDate || report.createdAt,
              isi: {
                catatan: report.description,
                jenis: report.priority === "low" ? "Prestasi" : "Pelanggaran",
              },
              createdAt: report.createdAt,
            });
          }
        });
      }

      // Sort by date (newest first)
      allReports.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.tanggal).getTime();
        const dateB = new Date(b.createdAt || b.tanggal).getTime();
        return dateB - dateA;
      });

      setReports(allReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Laporan Perkembangan Santri
              </h1>
              <p className="text-gray-600">
                Pantau perkembangan putra-putri Anda di pesantren
              </p>
            </div>
            <Link href="/chat">
              <Button size="lg" className="gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat Ustadz
              </Button>
            </Link>
          </div>

          {/* Student Info Cards */}
          {santriList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {santriList.map((santri) => (
                <Card
                  key={santri.id}
                  className="bg-gradient-to-br from-primary/5 to-secondary/5"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {santri.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          NIS: {santri.nis || "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reports Feed */}
        {reports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Laporan
              </h3>
              <p className="text-gray-600">
                Laporan perkembangan santri akan muncul di sini
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="hafalan">Hafalan</TabsTrigger>
              <TabsTrigger value="akademik">Akademik</TabsTrigger>
              <TabsTrigger value="perilaku">Perilaku</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </TabsContent>

            <TabsContent value="hafalan" className="space-y-4">
              {reports
                .filter((r) => r.kategori === "hafalan")
                .map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              {reports.filter((r) => r.kategori === "hafalan").length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Belum Ada Laporan Hafalan
                    </h3>
                    <p className="text-gray-600">
                      Laporan hafalan santri akan muncul di sini
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="akademik" className="space-y-4">
              {reports
                .filter((r) => r.kategori === "akademik")
                .map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              {reports.filter((r) => r.kategori === "akademik").length ===
                0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Belum Ada Laporan Akademik
                    </h3>
                    <p className="text-gray-600">
                      Laporan akademik santri akan muncul di sini
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="perilaku" className="space-y-4">
              {reports
                .filter((r) => r.kategori === "perilaku")
                .map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              {reports.filter((r) => r.kategori === "perilaku").length ===
                0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Belum Ada Laporan Perilaku
                    </h3>
                    <p className="text-gray-600">
                      Laporan perilaku santri akan muncul di sini
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// Extract Report Card component for reusability
function ReportCard({ report }: { report: Report }) {
  const getReportIcon = (kategori: string) => {
    switch (kategori) {
      case "hafalan":
        return <BookOpen className="w-5 h-5 text-primary" />;
      case "akademik":
        return <GraduationCap className="w-5 h-5 text-secondary" />;
      case "perilaku":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getReportBadge = (kategori: string) => {
    switch (kategori) {
      case "hafalan":
        return (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            Hafalan
          </Badge>
        );
      case "akademik":
        return (
          <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/10">
            Akademik
          </Badge>
        );
      case "perilaku":
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            Perilaku
          </Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      // Parse date and adjust for timezone
      const date = new Date(dateStr);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateStr;
      }

      const now = new Date();

      // Calculate difference in local time
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays < 7) return `${diffDays} hari yang lalu`;

      // Format with time for full date
      return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-white">
                {getUserInitials(report.santriName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{report.santriName}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>oleh {report.ustadzName}</span>
                <span>•</span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(report.createdAt || report.tanggal)}
                </span>
              </div>
            </div>
          </div>
          {getReportBadge(report.kategori)}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-start space-x-3">
          <div className="mt-1">{getReportIcon(report.kategori)}</div>
          <div className="flex-1">
            {/* Hafalan Report */}
            {report.kategori === "hafalan" && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <p className="font-medium">Hafalan: {report.isi.surat}</p>
                </div>
                <p className="text-sm text-gray-600">Ayat {report.isi.ayat}</p>
                <div className="flex items-center space-x-2 pt-2">
                  {report.isi.predikat === "excellent" && (
                    <Badge className="bg-green-100 text-green-700">
                      <Award className="w-3 h-3 mr-1" />
                      Lancar
                    </Badge>
                  )}
                  {report.isi.predikat === "good" && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Baik
                    </Badge>
                  )}
                  {report.isi.predikat === "fair" && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      Mengulang
                    </Badge>
                  )}
                  {report.isi.predikat === "poor" && (
                    <Badge className="bg-red-100 text-red-700">Kurang</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Academic Report */}
            {report.kategori === "akademik" && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-gray-500" />
                  <p className="font-medium">
                    Mata Pelajaran: {report.isi.mapel}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {report.isi.nilai}
                  </span>
                  <span className="text-gray-600">/ 100</span>
                </div>
              </div>
            )}

            {/* Behavior Report */}
            {report.kategori === "perilaku" && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-gray-500" />
                  <p className="font-medium">{report.isi.jenis}</p>
                </div>
                <p className="text-sm text-gray-700">{report.isi.catatan}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Button at the bottom of each card */}
        <div className="mt-4 pt-4 border-t">
          <Link
            href={`/chat?userId=${report.ustadId}&userName=${encodeURIComponent(
              report.ustadzName
            )}`}
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 hover:bg-primary hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Tanyakan ke {report.ustadzName}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
