"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAcademicReports } from "@/lib/hooks/useAcademicReports";
import { useQuranReports } from "@/lib/hooks/useQuranReports";
import { useBehaviorReports } from "@/lib/hooks/useBehaviorReports";
import { ReportsCharts } from "@/components/dashboard/reports/charts";
import { exportToPDF, exportToExcel } from "@/lib/export/reports";

export default function ReportsDashboard() {
  const { data: session } = useSession();

  // State for filters
  const [activeTab, setActiveTab] = useState("academic");
  const [filters, setFilters] = useState({
    studentId: "",
    ustadId: "",
    dateFrom: "",
    dateTo: "",
    subject: "",
    category: "all",
    priority: "all",
    status: "all",
    academicYear: "",
    semester: "all",
    surah: "",
    fluencyLevel: "all",
    page: 1,
    limit: 50,
  });

  // Hooks for different report types
  const {
    reports: academicReports,
    loading: academicLoading,
    error: academicError,
    total: academicTotal,
    fetchReports: fetchAcademicReports,
  } = useAcademicReports({
    studentId: filters.studentId || undefined,
    ustadId: filters.ustadId || undefined,
    academicYear: filters.academicYear || undefined,
    semester: filters.semester === "all" ? undefined : filters.semester,
    subject: filters.subject || undefined,
    page: filters.page,
    limit: filters.limit,
  });

  const {
    reports: quranReports,
    loading: quranLoading,
    error: quranError,
    total: quranTotal,
    fetchReports: fetchQuranReports,
  } = useQuranReports({
    studentId: filters.studentId || undefined,
    ustadId: filters.ustadId || undefined,
    surah: filters.surah || undefined,
    fluencyLevel:
      filters.fluencyLevel === "all" ? undefined : filters.fluencyLevel,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page: filters.page,
    limit: filters.limit,
  });

  const {
    reports: behaviorReports,
    loading: behaviorLoading,
    error: behaviorError,
    total: behaviorTotal,
    fetchReports: fetchBehaviorReports,
  } = useBehaviorReports({
    studentId: filters.studentId || undefined,
    ustadId: filters.ustadId || undefined,
    category: filters.category === "all" ? undefined : filters.category,
    priority: filters.priority === "all" ? undefined : filters.priority,
    status: filters.status === "all" ? undefined : filters.status,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page: filters.page,
    limit: filters.limit,
  });

  // Check if user is admin
  if (session?.user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-2">
                Akses Ditolak
              </h1>
              <p className="text-gray-600">
                Halaman ini hanya dapat diakses oleh administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const resetFilters = () => {
    setFilters({
      studentId: "",
      ustadId: "",
      dateFrom: "",
      dateTo: "",
      subject: "",
      category: "all",
      priority: "all",
      status: "all",
      academicYear: "",
      semester: "all",
      surah: "",
      fluencyLevel: "all",
      page: 1,
      limit: 50,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFluencyColor = (level: string) => {
    switch (level) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-green-100 text-green-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getGradeDisplay = (report: any) => {
    if (report.gradeType === "number") return `${report.gradeNumber}/100`;
    if (report.gradeType === "letter") return report.gradeLetter;
    if (report.gradeType === "description") return "Deskripsi";
    return "-";
  };

  const handleExportPDF = async () => {
    try {
      const data =
        activeTab === "academic"
          ? academicReports
          : activeTab === "quran"
          ? quranReports
          : behaviorReports;

      await exportToPDF(data, activeTab, filters);
      toast.success("Laporan berhasil diekspor ke PDF");
    } catch (error) {
      toast.error("Gagal mengekspor laporan ke PDF");
      console.error("Export PDF error:", error);
    }
  };

  const handleExportExcel = async () => {
    try {
      const data =
        activeTab === "academic"
          ? academicReports
          : activeTab === "quran"
          ? quranReports
          : behaviorReports;

      await exportToExcel(data, activeTab, filters);
      toast.success("Laporan berhasil diekspor ke Excel");
    } catch (error) {
      toast.error("Gagal mengekspor laporan ke Excel");
      console.error("Export Excel error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Laporan</h1>
          <p className="text-gray-600">
            Monitoring dan analisis laporan santri
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportPDF}>
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>
            Filter laporan berdasarkan berbagai kriteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Santri</Label>
              <Input
                id="studentId"
                value={filters.studentId}
                onChange={(e) =>
                  handleFilterChange("studentId", e.target.value)
                }
                placeholder="Cari nama santri"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ustadId">Ustad</Label>
              <Input
                id="ustadId"
                value={filters.ustadId}
                onChange={(e) => handleFilterChange("ustadId", e.target.value)}
                placeholder="Cari nama ustad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Tanggal Dari</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Tanggal Sampai</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>

            {/* Dynamic filters based on active tab */}
            {activeTab === "academic" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subject">Mata Pelajaran</Label>
                  <Input
                    id="subject"
                    value={filters.subject}
                    onChange={(e) =>
                      handleFilterChange("subject", e.target.value)
                    }
                    placeholder="Cari mata pelajaran"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">Tahun Akademik</Label>
                  <Input
                    id="academicYear"
                    value={filters.academicYear}
                    onChange={(e) =>
                      handleFilterChange("academicYear", e.target.value)
                    }
                    placeholder="Contoh: 2023/2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select
                    value={filters.semester}
                    onValueChange={(value) =>
                      handleFilterChange("semester", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {activeTab === "quran" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="surah">Surah</Label>
                  <Input
                    id="surah"
                    value={filters.surah}
                    onChange={(e) =>
                      handleFilterChange("surah", e.target.value)
                    }
                    placeholder="Cari nama surah"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fluencyLevel">Tingkat Kelancaran</Label>
                  <Select
                    value={filters.fluencyLevel}
                    onValueChange={(value) =>
                      handleFilterChange("fluencyLevel", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tingkat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {activeTab === "behavior" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) =>
                      handleFilterChange("category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="academic">Akademik</SelectItem>
                      <SelectItem value="behavior">Perilaku</SelectItem>
                      <SelectItem value="discipline">Disiplin</SelectItem>
                      <SelectItem value="health">Kesehatan</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioritas</Label>
                  <Select
                    value={filters.priority}
                    onValueChange={(value) =>
                      handleFilterChange("priority", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih prioritas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="critical">Kritis</SelectItem>
                      <SelectItem value="high">Tinggi</SelectItem>
                      <SelectItem value="medium">Sedang</SelectItem>
                      <SelectItem value="low">Rendah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      handleFilterChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="open">Terbuka</SelectItem>
                      <SelectItem value="in_progress">Dalam Proses</SelectItem>
                      <SelectItem value="resolved">Selesai</SelectItem>
                      <SelectItem value="closed">Ditutup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Analisis Data</CardTitle>
          <CardDescription>
            Visualisasi data laporan untuk analisis yang lebih mendalam
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsCharts
            academicReports={academicReports}
            quranReports={quranReports}
            behaviorReports={behaviorReports}
            activeTab={activeTab}
          />
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="academic" className="flex items-center gap-2">
            Laporan Akademik
            <Badge variant="secondary">{academicTotal}</Badge>
          </TabsTrigger>
          <TabsTrigger value="quran" className="flex items-center gap-2">
            Laporan Hafalan
            <Badge variant="secondary">{quranTotal}</Badge>
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            Laporan Perilaku
            <Badge variant="secondary">{behaviorTotal}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Academic Reports Tab */}
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Akademik</CardTitle>
              <CardDescription>
                Menampilkan {academicReports.length} dari {academicTotal}{" "}
                laporan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {academicLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : academicError ? (
                <div className="text-center py-8 text-red-600">
                  <p>{academicError}</p>
                </div>
              ) : academicReports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Tidak ada laporan akademik yang ditemukan
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Santri</TableHead>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead>Nilai</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Tahun</TableHead>
                      <TableHead>Ustad</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {report.studentName}
                        </TableCell>
                        <TableCell>{report.subject}</TableCell>
                        <TableCell>{getGradeDisplay(report)}</TableCell>
                        <TableCell>{report.semester}</TableCell>
                        <TableCell>{report.academicYear}</TableCell>
                        <TableCell>{report.ustadName}</TableCell>
                        <TableCell>
                          {new Date(report.createdAt).toLocaleDateString(
                            "id-ID"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quran Reports Tab */}
        <TabsContent value="quran" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Hafalan Quran</CardTitle>
              <CardDescription>
                Menampilkan {quranReports.length} dari {quranTotal} laporan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quranLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : quranError ? (
                <div className="text-center py-8 text-red-600">
                  <p>{quranError}</p>
                </div>
              ) : quranReports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Tidak ada laporan hafalan yang ditemukan
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Santri</TableHead>
                      <TableHead>Surah</TableHead>
                      <TableHead>Ayat</TableHead>
                      <TableHead>Kelancaran</TableHead>
                      <TableHead>Ustad</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quranReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {report.studentName}
                        </TableCell>
                        <TableCell>{report.surah}</TableCell>
                        <TableCell>
                          {report.ayatStart}-{report.ayatEnd}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getFluencyColor(report.fluencyLevel)}
                          >
                            {report.fluencyLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.ustadName}</TableCell>
                        <TableCell>
                          {new Date(report.testDate).toLocaleDateString(
                            "id-ID"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Reports Tab */}
        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Perilaku</CardTitle>
              <CardDescription>
                Menampilkan {behaviorReports.length} dari {behaviorTotal}{" "}
                laporan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {behaviorLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : behaviorError ? (
                <div className="text-center py-8 text-red-600">
                  <p>{behaviorError}</p>
                </div>
              ) : behaviorReports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Tidak ada laporan perilaku yang ditemukan
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Santri</TableHead>
                      <TableHead>Judul</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Prioritas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ustad</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {behaviorReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {report.studentName}
                        </TableCell>
                        <TableCell>{report.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(report.priority)}>
                            {report.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.ustadName}</TableCell>
                        <TableCell>
                          {new Date(report.incidentDate).toLocaleDateString(
                            "id-ID"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
