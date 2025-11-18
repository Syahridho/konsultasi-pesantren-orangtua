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
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  Clock,
} from "lucide-react";
import { useClasses } from "@/lib/hooks/useClasses";
import CreateClassWizard from "@/components/dashboard/class-wizard";
import ViewKelasModal from "@/components/dashboard/kelas/view-kelas-modal";
import EditKelasModal from "@/components/dashboard/kelas/edit-kelas-modal";

export default function KelasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { classes, loading, error, total, deleteClass } = useClasses({
    limit: 50,
  });
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<any>(null);

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

  if (session.user.role !== "admin") {
    toast.error("Anda tidak memiliki akses ke halaman ini");
    router.push("/dashboard");
    return null;
  }

  const handleWizardSuccess = () => {
    toast.success("Kelas berhasil dibuat!");
    setIsWizardOpen(false);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      const success = await deleteClass(classId);
      if (success) {
        toast.success("Kelas berhasil dihapus");
        setDeleteDialogOpen(false);
        setClassToDelete(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus kelas");
    }
  };

  const confirmDelete = (classId: string) => {
    setClassToDelete(classId);
    setDeleteDialogOpen(true);
  };

  const handleViewKelas = (kelas: any) => {
    setSelectedKelas(kelas);
    setViewModalOpen(true);
  };

  const handleEditKelas = (kelas: any) => {
    setSelectedKelas(kelas);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedKelas(null);
  };

  const handleViewClose = () => {
    setViewModalOpen(false);
    setSelectedKelas(null);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setSelectedKelas(null);
  };

  const filteredClasses = classes.filter((kelas) => {
    const matchesSearch =
      kelas.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kelas.ustadName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear =
      filterYear === "all" || !filterYear || kelas.academicYear === filterYear;
    const matchesTeacher =
      filterTeacher === "all" ||
      !filterTeacher ||
      kelas.ustadId === filterTeacher;

    return matchesSearch && matchesYear && matchesTeacher;
  });

  const uniqueYears = [...new Set(classes.map((c) => c.academicYear))].sort();
  const uniqueTeachers = [
    ...new Map(classes.map((c) => [c.ustadId, c.ustadName])).entries(),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Kelas</h1>
          <p className="text-gray-600">
            Kelola data kelas dan jadwal pengajaran
          </p>
        </div>
        <Button
          onClick={() => setIsWizardOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Kelas
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama kelas atau pengajar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <Label htmlFor="year-filter">Tahun Akademik</Label>
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

            <div>
              <Label htmlFor="teacher-filter">Pengajar</Label>
              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pengajar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua pengajar</SelectItem>
                  {uniqueTeachers.map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
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
                  setFilterTeacher("");
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
          <CardTitle>Daftar Kelas</CardTitle>
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
              <Button onClick={() => setIsWizardOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kelas Baru
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Tahun Akademik</TableHead>
                  <TableHead>Pengajar</TableHead>
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
                    <TableCell>{kelas.ustadName}</TableCell>
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
                            onClick={() => handleEditKelas(kelas)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => confirmDelete(kelas.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
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

      {/* Class Creation Wizard */}
      <CreateClassWizard
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        onSuccess={handleWizardSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => classToDelete && handleDeleteClass(classToDelete)}
            >
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Kelas Modal */}
      <ViewKelasModal
        isOpen={viewModalOpen}
        onClose={handleViewClose}
        kelas={selectedKelas}
      />

      {/* Edit Kelas Modal */}
      <EditKelasModal
        isOpen={editModalOpen}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
        kelas={selectedKelas}
      />
    </div>
  );
}
