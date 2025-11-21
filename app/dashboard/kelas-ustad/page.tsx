"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Users,
  Calendar,
  Clock,
  BookOpen,
} from "lucide-react";
import { useClasses } from "@/lib/hooks/useClasses";
import ViewKelasModal from "@/components/dashboard/kelas/view-kelas-modal";

export default function KelasUstadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { classes, loading, error, total } = useClasses({
    ustadId: session?.user?.id,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Check authentication and authorization
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  if (session.user.role !== "ustad") {
    toast.error("Anda tidak memiliki akses ke halaman ini");
    router.push("/dashboard");
    return null;
  }

  const handleViewKelas = (kelas: any) => {
    setSelectedKelas(kelas);
    setViewModalOpen(true);
  };

  const handleViewClose = () => {
    setViewModalOpen(false);
    setSelectedKelas(null);
  };

  const handleViewDetail = (kelas: any) => {
    setSelectedKelas(kelas);
    setShowDetailModal(true);
  };

  const handleDetailClose = () => {
    setShowDetailModal(false);
    setSelectedKelas(null);
  };

  const filteredClasses = classes.filter((kelas) => {
    const matchesSearch =
      kelas.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kelas.ustadName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear =
      filterYear === "all" || !filterYear || kelas.academicYear === filterYear;

    return matchesSearch && matchesYear;
  });

  const uniqueYears = [...new Set(classes.map((c) => c.academicYear))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kelas Saya</h1>
          <p className="text-gray-600">Daftar kelas yang Anda ajar</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              Semua tahun akademik
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Aktif</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.filter((c) => c.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Sedang berjalan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Santri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.reduce((total, c) => total + (c.studentCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Terdaftar dalam kelas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rata-rata/Kelas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.length > 0
                ? Math.round(
                    classes.reduce(
                      (total, c) => total + (c.studentCount || 0),
                      0
                    ) / classes.length
                  )
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Santri per kelas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Cari dan filter data kelas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              {/* <Label htmlFor="year-filter">Tahun Akademik</Label> */}
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua tahun</SelectItem>
                  {uniqueYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterYear("");
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas Saya</CardTitle>
          <CardDescription>
            Menampilkan {filteredClasses.length} dari {total} kelas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Tidak ada data kelas yang ditemukan
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Tahun Akademik</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead>Santri</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((kelas) => (
                  <TableRow key={kelas.id}>
                    <TableCell className="font-medium">{kelas.name}</TableCell>
                    <TableCell>{kelas.academicYear}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{kelas.schedule.days.join(", ")}</div>
                        <div className="text-gray-500">
                          {kelas.schedule.startTime} - {kelas.schedule.endTime}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{kelas.studentCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          kelas.status === "active" ? "default" : "secondary"
                        }
                      >
                        {kelas.status === "active" ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewKelas(kelas)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewDetail(kelas)}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Lihat Data Lengkap
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Kelas Modal */}
      <ViewKelasModal
        isOpen={viewModalOpen}
        onClose={handleViewClose}
        kelas={selectedKelas}
      />

      {/* Detail Modal with Student Data */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Lengkap Kelas</DialogTitle>
            <DialogDescription>
              Informasi lengkap mengenai kelas {selectedKelas?.name} beserta
              data santri
            </DialogDescription>
          </DialogHeader>

          {selectedKelas && (
            <div className="space-y-6">
              {/* Header Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        {selectedKelas.name}
                      </CardTitle>
                      <CardDescription className="text-lg">
                        Tahun Akademik {selectedKelas.academicYear}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        selectedKelas.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedKelas.status === "active"
                        ? "Aktif"
                        : "Tidak Aktif"}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Class Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Informasi Dasar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Nama Kelas
                      </label>
                      <p className="text-lg">{selectedKelas.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Tahun Akademik
                      </label>
                      <p className="text-lg">{selectedKelas.academicYear}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Status
                      </label>
                      <div className="mt-1">
                        <Badge
                          variant={
                            selectedKelas.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {selectedKelas.status === "active"
                            ? "Aktif"
                            : "Tidak Aktif"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Jadwal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Hari
                      </label>
                      <p className="text-lg">
                        {selectedKelas.schedule?.days?.join(", ") || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Waktu
                      </label>
                      <div className="flex items-center gap-2 text-lg">
                        <Clock className="h-4 w-4" />
                        <span>
                          {selectedKelas.schedule?.startTime} -{" "}
                          {selectedKelas.schedule?.endTime}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Teacher Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Informasi Pengajar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Nama Pengajar
                      </label>
                      <p className="text-lg">{selectedKelas.ustadName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        ID Pengajar
                      </label>
                      <p className="text-lg font-mono">
                        {selectedKelas.ustadId}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Students Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Data Santri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedKelas.studentCount || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Santri</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {
                          Object.values(selectedKelas.studentIds || {}).filter(
                            (s: any) => s.status === "active"
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-600">Santri Aktif</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {
                          Object.values(selectedKelas.studentIds || {}).filter(
                            (s: any) => s.status !== "active"
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        Santri Tidak Aktif
                      </div>
                    </div>
                  </div>

                  {selectedKelas.studentIds &&
                    Object.keys(selectedKelas.studentIds).length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-2 block">
                          Daftar Santri
                        </label>
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>NIS</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tanggal Daftar</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(selectedKelas.studentIds).map(
                                ([studentId, studentInfo]: [string, any]) => (
                                  <TableRow key={studentId}>
                                    <TableCell className="font-medium">
                                      {studentId}
                                    </TableCell>
                                    <TableCell>
                                      {studentInfo.nis || "-"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          studentInfo.status === "active"
                                            ? "default"
                                            : "secondary"
                                        }
                                      >
                                        {studentInfo.status === "active"
                                          ? "Aktif"
                                          : "Tidak Aktif"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {new Date(
                                        studentInfo.enrolledAt
                                      ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                      })}
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
