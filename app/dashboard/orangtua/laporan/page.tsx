"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Search,
  Calendar,
  User,
  FileText,
  Download,
} from "lucide-react";

interface Report {
  id: string;
  kategori: "hafalan" | "akademik" | "perilaku";
  santriId: string;
  santriName: string;
  ustadzName: string;
  ustadId: string;
  tanggal: string;
  isi: any;
  createdAt: string;
}

export default function LaporanOrangtuaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [filterSantri, setFilterSantri] = useState<string>("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [children, setChildren] = useState<any[]>([]);

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

    fetchReports();
  }, [session, status, router]);

  useEffect(() => {
    let filtered = reports;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.santriName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.ustadzName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by kategori
    if (filterKategori !== "all") {
      filtered = filtered.filter((report) => report.kategori === filterKategori);
    }

    // Filter by santri
    if (filterSantri !== "all") {
      filtered = filtered.filter((report) => report.santriId === filterSantri);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, filterKategori, filterSantri]);

  const fetchReports = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const allReports: Report[] = [];

      // Get parent's student IDs
      const parentRef = ref(database, `users/${session.user.id}`);
      const parentSnapshot = await get(parentRef);
      if (!parentSnapshot.exists()) {
        toast.error("Data orang tua tidak ditemukan");
        return;
      }

      const parentData = parentSnapshot.val();
      let studentIds: string[] = [];

      // Get student IDs from different possible formats
      if (parentData.studentIds && Array.isArray(parentData.studentIds)) {
        studentIds = parentData.studentIds;
      } else if (parentData.santri && typeof parentData.santri === "object") {
        studentIds = Object.keys(parentData.santri);
      } else if (parentData.students && Array.isArray(parentData.students)) {
        studentIds = parentData.students;
      }

      if (studentIds.length === 0) {
        toast.info("Anda belum memiliki santri yang terdaftar");
        setLoading(false);
        return;
      }

      // Get children data
      const childrenData: any[] = [];
      for (const studentId of studentIds) {
        const studentRef = ref(database, `users/${studentId}`);
        const studentSnapshot = await get(studentRef);
        if (studentSnapshot.exists()) {
          childrenData.push({
            id: studentId,
            ...studentSnapshot.val(),
          });
        }
      }
      setChildren(childrenData);

      // Fetch Quran reports
      const quranReportsRef = ref(database, "quranReports");
      const quranSnapshot = await get(quranReportsRef);
      if (quranSnapshot.exists()) {
        const quranReports = quranSnapshot.val();
        Object.keys(quranReports).forEach((reportId) => {
          const report = quranReports[reportId];
          // Only include reports for parent's children
          if (studentIds.includes(report.studentId)) {
            allReports.push({
              id: reportId,
              kategori: "hafalan",
              santriId: report.studentId,
              santriName: report.studentName || "Unknown",
              ustadzName: report.ustadName || "Unknown",
              ustadId: report.ustadId,
              tanggal: report.testDate || report.createdAt,
              isi: {
                surah: report.surah,
                ayatStart: report.ayatStart,
                ayatEnd: report.ayatEnd,
                fluencyLevel: report.fluencyLevel,
                notes: report.notes,
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
          // Only include reports for parent's children
          if (studentIds.includes(report.studentId)) {
            allReports.push({
              id: reportId,
              kategori: "akademik",
              santriId: report.studentId,
              santriName: report.studentName || "Unknown",
              ustadzName: report.ustadName || "Unknown",
              ustadId: report.ustadId,
              tanggal: report.createdAt,
              isi: {
                subject: report.subject,
                academicYear: report.academicYear,
                semester: report.semester,
                score: report.score,
                grade: report.grade,
                notes: report.notes,
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
          // Only include reports for parent's children
          if (studentIds.includes(report.studentId)) {
            allReports.push({
              id: reportId,
              kategori: "perilaku",
              santriId: report.studentId,
              santriName: report.studentName || "Unknown",
              ustadzName: report.ustadName || "Unknown",
              ustadId: report.ustadId,
              tanggal: report.incidentDate || report.createdAt,
              isi: {
                title: report.title,
                description: report.description,
                category: report.category,
                priority: report.priority,
                status: report.status,
              },
              createdAt: report.createdAt,
            });
          }
        });
      }

      // Sort by creation date (newest first)
      allReports.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setReports(allReports);
      console.log(`[LAPORAN ORANGTUA] Loaded ${allReports.length} reports`);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      toast.error("Terjadi kesalahan saat memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  const getKategoriIcon = (kategori: string) => {
    switch (kategori) {
      case "hafalan":
        return <BookOpen className="h-4 w-4" />;
      case "akademik":
        return <GraduationCap className="h-4 w-4" />;
      case "perilaku":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getKategoriBadge = (kategori: string) => {
    const colors = {
      hafalan: "bg-green-100 text-green-800",
      akademik: "bg-blue-100 text-blue-800",
      perilaku: "bg-orange-100 text-orange-800",
    };
    return colors[kategori as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const viewReportDetail = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const renderReportDetail = () => {
    if (!selectedReport) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Santri</p>
            <p className="font-medium">{selectedReport.santriName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ustadz</p>
            <p className="font-medium">{selectedReport.ustadzName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Kategori</p>
            <Badge className={getKategoriBadge(selectedReport.kategori)}>
              {selectedReport.kategori.charAt(0).toUpperCase() +
                selectedReport.kategori.slice(1)}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tanggal</p>
            <p className="font-medium">{formatDate(selectedReport.tanggal)}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Detail Laporan:</p>
          <div className="space-y-2">
            {selectedReport.kategori === "hafalan" && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Surah</p>
                  <p className="font-medium">{selectedReport.isi.surah}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ayat</p>
                  <p className="font-medium">
                    {selectedReport.isi.ayatStart} - {selectedReport.isi.ayatEnd}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kelancaran</p>
                  <Badge
                    variant={
                      selectedReport.isi.fluencyLevel === "excellent"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedReport.isi.fluencyLevel}
                  </Badge>
                </div>
                {selectedReport.isi.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Catatan</p>
                    <p className="text-sm">{selectedReport.isi.notes}</p>
                  </div>
                )}
              </>
            )}

            {selectedReport.kategori === "akademik" && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Mata Pelajaran</p>
                  <p className="font-medium">{selectedReport.isi.subject}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nilai</p>
                    <p className="font-medium text-lg">
                      {selectedReport.isi.score}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Grade</p>
                    <Badge variant="default">{selectedReport.isi.grade}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tahun Ajaran</p>
                    <p className="font-medium">{selectedReport.isi.academicYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Semester</p>
                    <p className="font-medium">{selectedReport.isi.semester}</p>
                  </div>
                </div>
                {selectedReport.isi.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Catatan</p>
                    <p className="text-sm">{selectedReport.isi.notes}</p>
                  </div>
                )}
              </>
            )}

            {selectedReport.kategori === "perilaku" && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Judul</p>
                  <p className="font-medium">{selectedReport.isi.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deskripsi</p>
                  <p className="text-sm">{selectedReport.isi.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Prioritas</p>
                    <Badge
                      variant={
                        selectedReport.isi.priority === "high" ||
                        selectedReport.isi.priority === "critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {selectedReport.isi.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline">{selectedReport.isi.status}</Badge>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getStats = () => {
    const hafalanCount = reports.filter((r) => r.kategori === "hafalan").length;
    const akademikCount = reports.filter((r) => r.kategori === "akademik").length;
    const perilakuCount = reports.filter((r) => r.kategori === "perilaku").length;

    return { hafalanCount, akademikCount, perilakuCount };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Laporan Santri
          </h1>
          <p className="text-muted-foreground mt-1">
            Lihat semua laporan perkembangan anak Anda
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.hafalanCount}</p>
                <p className="text-xs text-muted-foreground">Laporan Hafalan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.akademikCount}</p>
                <p className="text-xs text-muted-foreground">Laporan Akademik</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.perilakuCount}</p>
                <p className="text-xs text-muted-foreground">Laporan Perilaku</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daftar Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama santri atau ustadz..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={filterSantri} onValueChange={setFilterSantri}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Pilih Santri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Santri</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterKategori} onValueChange={setFilterKategori}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="hafalan">Hafalan</SelectItem>
                <SelectItem value="akademik">Akademik</SelectItem>
                <SelectItem value="perilaku">Perilaku</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchTerm || filterKategori !== "all" || filterSantri !== "all"
                  ? "Tidak ada laporan yang cocok dengan filter"
                  : "Belum ada laporan"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Santri</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Ustadz</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {formatDate(report.tanggal)}
                      </TableCell>
                      <TableCell>{report.santriName}</TableCell>
                      <TableCell>
                        <Badge className={getKategoriBadge(report.kategori)}>
                          <span className="flex items-center gap-1">
                            {getKategoriIcon(report.kategori)}
                            {report.kategori.charAt(0).toUpperCase() +
                              report.kategori.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{report.ustadzName}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewReportDetail(report)}
                        >
                          Lihat Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredReports.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Menampilkan {filteredReports.length} dari {reports.length} laporan
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detail Laporan</DialogTitle>
          </DialogHeader>
          {renderReportDetail()}
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDetailModal(false)}
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
