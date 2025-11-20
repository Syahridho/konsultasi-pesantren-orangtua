"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ref, get, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Edit,
  Trash2,
  Loader2,
  Search,
  Calendar,
  User,
} from "lucide-react";
import api from "@/lib/api";

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

export default function LaporanUstadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "ustad" && session.user.role !== "admin") {
      toast.error("Halaman ini hanya untuk Ustadz");
      router.push("/dashboard");
      return;
    }

    fetchReports();
  }, [session, status, router]);

  useEffect(() => {
    let filtered = reports;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((report) =>
        report.santriName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by kategori
    if (filterKategori !== "all") {
      filtered = filtered.filter((report) => report.kategori === filterKategori);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, filterKategori]);

  const fetchReports = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const allReports: Report[] = [];

      // Get user's student IDs if role is orangtua
      let userStudentIds: string[] = [];
      if (session.user.role === "orangtua") {
        const usersRef = ref(database, `users/${session.user.id}`);
        const userSnapshot = await get(usersRef);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          userStudentIds = userData.studentIds || [];
        }
      }

      // Fetch Quran reports
      const quranReportsRef = ref(database, "quranReports");
      const quranSnapshot = await get(quranReportsRef);
      if (quranSnapshot.exists()) {
        const quranReports = quranSnapshot.val();
        Object.keys(quranReports).forEach((reportId) => {
          const report = quranReports[reportId];
          // Filter based on role
          const shouldInclude =
            session.user.role === "admin"
              ? true // Admin lihat semua
              : session.user.role === "ustad"
              ? report.ustadId === session.user.id // Ustad hanya lihat miliknya
              : userStudentIds.includes(report.studentId); // Orangtua hanya lihat laporan anaknya

          if (shouldInclude) {
            allReports.push({
              id: reportId,
              kategori: "hafalan",
              santriId: report.studentId,
              santriName: report.studentName || "Unknown",
              ustadzName: report.ustadName || "Unknown",
              ustadId: report.ustadId,
              tanggal: report.testDate || report.createdAt,
              isi: {
                surat: report.surah,
                ayatStart: report.ayatStart,
                ayatEnd: report.ayatEnd,
                predikat: report.fluencyLevel,
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
          const shouldInclude =
            session.user.role === "admin"
              ? true
              : session.user.role === "ustad"
              ? report.ustadId === session.user.id
              : userStudentIds.includes(report.studentId);

          if (shouldInclude) {
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
                gradeNumber: report.gradeNumber,
                semester: report.semester,
                academicYear: report.academicYear,
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
          const shouldInclude =
            session.user.role === "admin"
              ? true
              : session.user.role === "ustad"
              ? report.ustadId === session.user.id
              : userStudentIds.includes(report.studentId);

          if (shouldInclude) {
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

      // Sort by date (newest first)
      allReports.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
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

  const openEditModal = (report: Report) => {
    setSelectedReport(report);
    setEditForm(report.isi);
    setShowEditModal(true);
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;

    setSubmitting(true);
    try {
      let reportRef;
      let updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (selectedReport.kategori === "hafalan") {
        reportRef = ref(database, `quranReports/${selectedReport.id}`);
        updateData = {
          ...updateData,
          surah: editForm.surat,
          ayatStart: editForm.ayatStart,
          ayatEnd: editForm.ayatEnd,
          fluencyLevel: editForm.predikat,
          notes: editForm.notes || "",
        };
      } else if (selectedReport.kategori === "akademik") {
        reportRef = ref(database, `academicReports/${selectedReport.id}`);
        updateData = {
          ...updateData,
          subject: editForm.subject,
          gradeNumber: editForm.gradeNumber,
          notes: editForm.notes || "",
        };
      } else if (selectedReport.kategori === "perilaku") {
        reportRef = ref(database, `behaviorReports/${selectedReport.id}`);
        updateData = {
          ...updateData,
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority,
          status: editForm.status,
        };
      }

      if (reportRef) {
        await update(reportRef, updateData);
        toast.success("Laporan berhasil diperbarui");
        setShowEditModal(false);
        setSelectedReport(null);
        fetchReports();
      }
    } catch (error: any) {
      console.error("Error updating report:", error);
      toast.error("Gagal memperbarui laporan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async (report: Report) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus laporan ini?`)) {
      return;
    }

    try {
      let reportRef;

      if (report.kategori === "hafalan") {
        reportRef = ref(database, `quranReports/${report.id}`);
      } else if (report.kategori === "akademik") {
        reportRef = ref(database, `academicReports/${report.id}`);
      } else if (report.kategori === "perilaku") {
        reportRef = ref(database, `behaviorReports/${report.id}`);
      }

      if (reportRef) {
        await remove(reportRef);
        toast.success("Laporan berhasil dihapus");
        fetchReports();
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Gagal menghapus laporan");
    }
  };

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case "hafalan":
        return (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            <BookOpen className="w-3 h-3 mr-1" />
            Hafalan
          </Badge>
        );
      case "akademik":
        return (
          <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/10">
            <GraduationCap className="w-3 h-3 mr-1" />
            Akademik
          </Badge>
        );
      case "perilaku":
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Perilaku
          </Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daftar Laporan</h1>
        <p className="text-muted-foreground">
          Kelola semua laporan yang telah Anda buat
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama santri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterKategori} onValueChange={setFilterKategori}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="hafalan">Hafalan</SelectItem>
                <SelectItem value="akademik">Akademik</SelectItem>
                <SelectItem value="perilaku">Perilaku</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Daftar Laporan ({filteredReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterKategori !== "all"
                  ? "Tidak ada laporan yang cocok dengan filter"
                  : "Belum ada laporan"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Santri</TableHead>
                    {session?.user.role === "admin" && <TableHead>Ustad</TableHead>}
                    <TableHead>Detail</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{getKategoriBadge(report.kategori)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{report.santriName}</span>
                        </div>
                      </TableCell>
                      {session?.user.role === "admin" && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{report.ustadzName}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="text-sm">
                          {report.kategori === "hafalan" && (
                            <span>
                              {report.isi.surat} ({report.isi.ayatStart}-
                              {report.isi.ayatEnd})
                            </span>
                          )}
                          {report.kategori === "akademik" && (
                            <span>
                              {report.isi.subject}: {report.isi.gradeNumber}
                            </span>
                          )}
                          {report.kategori === "perilaku" && (
                            <span>{report.isi.title}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(report.tanggal)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(report)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReport(report)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Laporan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReport?.kategori === "hafalan" && (
              <>
                <div className="space-y-2">
                  <Label>Nama Surat</Label>
                  <Input
                    value={editForm.surat || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, surat: e.target.value })
                    }
                    placeholder="Nama Surat"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ayat Awal</Label>
                    <Input
                      type="number"
                      value={editForm.ayatStart || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          ayatStart: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ayat Akhir</Label>
                    <Input
                      type="number"
                      value={editForm.ayatEnd || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          ayatEnd: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Predikat</Label>
                  <Select
                    value={editForm.predikat}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, predikat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Lancar</SelectItem>
                      <SelectItem value="good">Baik</SelectItem>
                      <SelectItem value="fair">Mengulang</SelectItem>
                      <SelectItem value="poor">Kurang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea
                    value={editForm.notes || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    placeholder="Catatan tambahan (opsional)"
                    rows={3}
                  />
                </div>
              </>
            )}

            {selectedReport?.kategori === "akademik" && (
              <>
                <div className="space-y-2">
                  <Label>Mata Pelajaran</Label>
                  <Input
                    value={editForm.subject || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, subject: e.target.value })
                    }
                    placeholder="Mata Pelajaran"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nilai</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.gradeNumber || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        gradeNumber: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea
                    value={editForm.notes || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    placeholder="Catatan tambahan (opsional)"
                    rows={3}
                  />
                </div>
              </>
            )}

            {selectedReport?.kategori === "perilaku" && (
              <>
                <div className="space-y-2">
                  <Label>Judul</Label>
                  <Input
                    value={editForm.title || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    placeholder="Judul Laporan"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    placeholder="Deskripsi detail"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prioritas</Label>
                    <Select
                      value={editForm.priority}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Rendah</SelectItem>
                        <SelectItem value="medium">Sedang</SelectItem>
                        <SelectItem value="high">Tinggi</SelectItem>
                        <SelectItem value="critical">Kritis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Terbuka</SelectItem>
                        <SelectItem value="in_progress">Proses</SelectItem>
                        <SelectItem value="resolved">Selesai</SelectItem>
                        <SelectItem value="closed">Ditutup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button onClick={handleUpdateReport} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
