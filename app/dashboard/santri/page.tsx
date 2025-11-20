"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Plus,
  Users,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  FileText,
  Settings,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Save,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";

interface Santri {
  id: string;
  name: string;
  nis: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  tahunDaftar: string;
  createdAt: string;
  orangTuaId: string;
  orangTuaName: string;
  orangTuaEmail: string;
  orangTuaPhone: string;
  dataSource: string;
}

interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface NewSantri {
  name: string;
  nis: string;
  gender: "L" | "P";
  tempatLahir: string;
  tanggalLahir: string;
  tahunDaftar: string;
  orangTuaId: string;
}

export default function SantriPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [filteredSantriList, setFilteredSantriList] = useState<Santri[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [reportType, setReportType] = useState<"hafalan" | "akademik" | "perilaku">("hafalan");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    nama: true,
    nis: true,
    jenisKelamin: true,
    orangTua: true,
    kontak: true,
    tahunDaftar: true,
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [formData, setFormData] = useState<NewSantri>({
    name: "",
    nis: "",
    gender: "L",
    tempatLahir: "",
    tanggalLahir: "",
    tahunDaftar: new Date().getFullYear().toString(),
    orangTuaId: "",
  });
  const [reportForm, setReportForm] = useState({
    hafalan: {
      surat: "",
      ayat: "",
      predikat: "Lancar",
    },
    akademik: {
      mapel: "",
      nilai: 0,
    },
    perilaku: {
      catatan: "",
      jenis: "Prestasi",
    },
  });

  useEffect(() => {
    if (status === "loading") return;

    console.log("[SANTRI PAGE] Session status:", status);
    console.log("[SANTRI PAGE] Session data:", session);

    if (!session) {
      console.log("[SANTRI PAGE] No session, redirecting to login");
      router.push("/login");
      return;
    }

    console.log("[SANTRI PAGE] User role:", session.user.role);

    if (
      session.user.role === "admin" ||
      session.user.role === "ustad" ||
      session.user.role === "orangtua"
    ) {
      console.log(
        "[SANTRI PAGE] Fetching enhanced santri data for role:",
        session.user.role
      );
      fetchEnhancedSantriData();
    } else {
      console.log("[SANTRI PAGE] Unauthorized role:", session.user.role);
      toast.error("Anda tidak memiliki akses ke halaman ini");
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const filtered = santriList.filter(
      (santri) =>
        santri.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        santri.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        santri.orangTuaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        santri.orangTuaEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSantriList(filtered);
  }, [santriList, searchTerm]);

  const fetchEnhancedSantriData = async () => {
    try {
      console.log("[SANTRI PAGE] Fetching enhanced santri data...");

      const response = await api.get("/api/santri/enhanced");

      console.log("[SANTRI PAGE] API response status:", response.status);
      console.log("[SANTRI PAGE] API response data:", response.data);

      if (response.status === 200) {
        const santriData = response.data.santriList || [];
        const parentsData = response.data.parents || [];
        console.log(
          "[SANTRI PAGE] Setting santri list with",
          santriData.length,
          "items"
        );
        console.log(
          "[SANTRI PAGE] Setting parents list with",
          parentsData.length,
          "items"
        );

        setSantriList(santriData);
        setParents(parentsData);

        // Log debug info if available
        if (response.data.debug) {
          console.log("[SANTRI PAGE] Debug info:", response.data.debug);
        }
      } else {
        console.error("[SANTRI PAGE] API error response:", response.data);
        toast.error("Gagal memuat data santri: " + response.data.error);
      }
    } catch (error: any) {
      console.error("[SANTRI PAGE] Error fetching santri:", error);
      console.error("[SANTRI PAGE] Error response:", error.response?.data);
      toast.error(
        "Terjadi kesalahan saat memuat data santri: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddSantri = async () => {
    // Validation
    if (!formData.orangTuaId) {
      toast.error("Pilih orang tua terlebih dahulu!");
      return;
    }

    if (!formData.name || formData.name.length < 3) {
      toast.error("Nama santri minimal 3 karakter!");
      return;
    }

    if (!formData.tanggalLahir) {
      toast.error("Tanggal lahir wajib diisi!");
      return;
    }

    try {
      console.log("[SANTRI PAGE] Adding new santri:", formData);

      const response = await api.post("/api/santri/enhanced", formData);

      if (response.status === 200) {
        toast.success("Santri berhasil ditambahkan");
        setShowAddModal(false);
        resetForm();
        fetchEnhancedSantriData();
      } else {
        toast.error("Gagal menambahkan santri: " + response.data.error);
      }
    } catch (error: any) {
      console.error("[SANTRI PAGE] Error adding santri:", error);
      toast.error(
        "Terjadi kesalahan saat menambahkan santri: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleUpdateSantri = async () => {
    if (!selectedSantri) return;

    try {
      console.log(
        "[SANTRI PAGE] Updating santri:",
        selectedSantri.id,
        formData
      );

      const response = await api.put(
        `/api/santri/enhanced?id=${selectedSantri.id}&orangTuaId=${selectedSantri.orangTuaId}`,
        formData
      );

      if (response.status === 200) {
        toast.success("Data santri berhasil diperbarui");
        setShowEditModal(false);
        setSelectedSantri(null);
        resetForm();
        fetchEnhancedSantriData();
      } else {
        toast.error("Gagal memperbarui santri: " + response.data.error);
      }
    } catch (error: any) {
      console.error("[SANTRI PAGE] Error updating santri:", error);
      toast.error(
        "Terjadi kesalahan saat memperbarui santri: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleDeleteSantri = async (santri: Santri) => {
    if (
      !confirm(`Apakah Anda yakin ingin menghapus santri "${santri.name}"?`)
    ) {
      return;
    }

    try {
      console.log("[SANTRI PAGE] Deleting santri:", santri.id);

      const response = await api.delete(
        `/api/santri/enhanced?id=${santri.id}&orangTuaId=${santri.orangTuaId}`
      );

      if (response.status === 200) {
        toast.success("Santri berhasil dihapus");
        fetchEnhancedSantriData();
      } else {
        toast.error("Gagal menghapus santri: " + response.data.error);
      }
    } catch (error: any) {
      console.error("[SANTRI PAGE] Error deleting santri:", error);
      toast.error(
        "Terjadi kesalahan saat menghapus santri: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const openEditModal = (santri: Santri) => {
    setSelectedSantri(santri);
    setFormData({
      name: santri.name,
      nis: santri.nis,
      gender: santri.jenisKelamin as "L" | "P",
      tempatLahir: santri.tempatLahir,
      tanggalLahir: santri.tanggalLahir,
      tahunDaftar: santri.tahunDaftar,
      orangTuaId: santri.orangTuaId,
    });
    setShowEditModal(true);
  };

  const openViewModal = (santri: Santri) => {
    setSelectedSantri(santri);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nis: "",
      gender: "L",
      tempatLahir: "",
      tanggalLahir: "",
      tahunDaftar: new Date().getFullYear().toString(),
      orangTuaId: "",
    });
  };

  const openReportModal = (santri: Santri) => {
    setSelectedSantri(santri);
    setReportType("hafalan");
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedSantri) return;

    // Check if user has permission to create reports
    if (session?.user.role !== "admin" && session?.user.role !== "ustad") {
      toast.error("Anda tidak memiliki akses untuk membuat laporan");
      setShowReportModal(false);
      return;
    }

    setSubmittingReport(true);
    try {
      if (reportType === "hafalan") {
        if (!reportForm.hafalan.surat || !reportForm.hafalan.ayat) {
          toast.error("Nama surat dan ayat wajib diisi");
          return;
        }

        // Map to API format
        const fluencyMap: any = {
          Lancar: "excellent",
          Mengulang: "fair",
          Kurang: "poor",
        };

        const response = await api.post("/api/reports/quran", {
          studentId: selectedSantri.id,
          surah: reportForm.hafalan.surat,
          ayatStart: parseInt(reportForm.hafalan.ayat.split("-")[0]) || 1,
          ayatEnd: parseInt(reportForm.hafalan.ayat.split("-")[1] || reportForm.hafalan.ayat) || 1,
          fluencyLevel: fluencyMap[reportForm.hafalan.predikat] || "good",
          testDate: new Date().toISOString().split("T")[0],
        });

        if (response.status === 200) {
          toast.success("Laporan hafalan berhasil disimpan");
          setReportForm({
            ...reportForm,
            hafalan: { surat: "", ayat: "", predikat: "Lancar" },
          });
          setShowReportModal(false);
        }
      } else if (reportType === "akademik") {
        if (!reportForm.akademik.mapel) {
          toast.error("Mata pelajaran wajib diisi");
          return;
        }

        const response = await api.post("/api/reports/academic", {
          studentId: selectedSantri.id,
          subject: reportForm.akademik.mapel,
          gradeType: "number",
          gradeNumber: reportForm.akademik.nilai,
          semester: "1",
          academicYear: new Date().getFullYear().toString(),
        });

        if (response.status === 200) {
          toast.success("Laporan akademik berhasil disimpan");
          setReportForm({
            ...reportForm,
            akademik: { mapel: "", nilai: 0 },
          });
          setShowReportModal(false);
        }
      } else if (reportType === "perilaku") {
        if (!reportForm.perilaku.catatan) {
          toast.error("Catatan wajib diisi");
          return;
        }

        if (reportForm.perilaku.catatan.length < 10) {
          toast.error("Catatan minimal 10 karakter");
          return;
        }

        const response = await api.post("/api/reports/behavior", {
          studentId: selectedSantri.id,
          category: "behavior",
          priority: reportForm.perilaku.jenis === "Prestasi" ? "low" : "medium",
          title: `Laporan ${reportForm.perilaku.jenis}: ${selectedSantri.name}`,
          description: reportForm.perilaku.catatan,
          incidentDate: new Date().toISOString().split("T")[0],
          status: "open",
          followUpRequired: false,
        });

        if (response.status === 200) {
          toast.success("Laporan perilaku berhasil disimpan");
          setReportForm({
            ...reportForm,
            perilaku: { catatan: "", jenis: "Prestasi" },
          });
          setShowReportModal(false);
        }
      }
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error("Gagal menyimpan laporan: " + (error.response?.data?.error || error.message));
    } finally {
      setSubmittingReport(false);
    }
  };



  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Santri</h1>
          <p className="text-muted-foreground">
            Kelola semua data santri dengan hubungan orang tua yang terintegrasi
          </p>
        </div>

        {session?.user.role === "admin" ? (
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Santri
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Tambah Santri Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nis">NIS</Label>
                    <Input
                      id="nis"
                      value={formData.nis}
                      onChange={(e) =>
                        setFormData({ ...formData, nis: e.target.value })
                      }
                      placeholder="Masukkan NIS"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Jenis Kelamin</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: "L" | "P") =>
                        setFormData({ ...formData, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tahunDaftar">Tahun Daftar</Label>
                    <Input
                      id="tahunDaftar"
                      value={formData.tahunDaftar}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tahunDaftar: e.target.value,
                        })
                      }
                      placeholder="Masukkan tahun daftar"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                    <Input
                      id="tempatLahir"
                      value={formData.tempatLahir}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tempatLahir: e.target.value,
                        })
                      }
                      placeholder="Masukkan tempat lahir"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                    <Input
                      id="tanggalLahir"
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tanggalLahir: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orangTuaId">Orang Tua <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.orangTuaId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, orangTuaId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih orang tua (WAJIB)" />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Tidak ada data orang tua
                        </div>
                      ) : (
                        parents.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.name} ({parent.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!formData.orangTuaId && (
                    <p className="text-sm text-red-500">* Santri harus memiliki orang tua</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleAddSantri}
                    disabled={!formData.orangTuaId || !formData.name}
                  >
                    Simpan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Semua Santri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari santri berdasarkan nama, NIS, atau orang tua..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Popover open={showColumnSettings} onOpenChange={setShowColumnSettings}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Pengaturan Kolom</h4>
                  <div className="space-y-2">
                    {Object.entries(visibleColumns).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) =>
                            setVisibleColumns({
                              ...visibleColumns,
                              [key]: checked as boolean,
                            })
                          }
                        />
                        <label
                          htmlFor={key}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {key === "nama" && "Nama"}
                          {key === "nis" && "NIS"}
                          {key === "jenisKelamin" && "Jenis Kelamin"}
                          {key === "orangTua" && "Orang Tua"}
                          {key === "kontak" && "Kontak"}
                          {key === "tahunDaftar" && "Tahun Daftar"}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {filteredSantriList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Tidak ada santri yang cocok dengan pencarian"
                  : "Belum ada data santri"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.nama && <TableHead>Nama</TableHead>}
                  {visibleColumns.nis && <TableHead>NIS</TableHead>}
                  {visibleColumns.jenisKelamin && <TableHead>Jenis Kelamin</TableHead>}
                  {visibleColumns.orangTua && <TableHead>Orang Tua</TableHead>}
                  {visibleColumns.kontak && <TableHead>Kontak</TableHead>}
                  {visibleColumns.tahunDaftar && <TableHead>Tahun Daftar</TableHead>}
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSantriList.map((santri) => (
                  <TableRow key={santri.id}>
                    {visibleColumns.nama && (
                      <TableCell className="font-medium">{santri.name}</TableCell>
                    )}
                    {visibleColumns.nis && (
                      <TableCell>{santri.nis || "-"}</TableCell>
                    )}
                    {visibleColumns.jenisKelamin && (
                      <TableCell>
                        {santri.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                      </TableCell>
                    )}
                    {visibleColumns.orangTua && (
                      <TableCell>
                        <div>
                          <div className="font-medium">{santri.orangTuaName}</div>
                          <div className="text-sm text-muted-foreground">
                            {santri.orangTuaEmail}
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.kontak && (
                      <TableCell>{santri.orangTuaPhone || "-"}</TableCell>
                    )}
                    {visibleColumns.tahunDaftar && (
                      <TableCell>{santri.tahunDaftar || "-"}</TableCell>
                    )}
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openViewModal(santri)}
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {(session?.user.role === "admin" || session?.user.role === "ustad") && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReportModal(santri)}
                              title="Buat Laporan"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(santri)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {session?.user.role === "admin" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSantri(santri)}
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detail Santri</DialogTitle>
          </DialogHeader>
          {selectedSantri && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nama Lengkap</Label>
                  <p className="font-medium">{selectedSantri.name}</p>
                </div>
                <div>
                  <Label>NIS</Label>
                  <p className="font-medium">{selectedSantri.nis}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jenis Kelamin</Label>
                  <p className="font-medium">
                    {selectedSantri.jenisKelamin === "L"
                      ? "Laki-laki"
                      : "Perempuan"}
                  </p>
                </div>
                <div>
                  <Label>Tahun Daftar</Label>
                  <p className="font-medium">{selectedSantri.tahunDaftar}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tempat Lahir</Label>
                  <p className="font-medium">{selectedSantri.tempatLahir}</p>
                </div>
                <div>
                  <Label>Tanggal Lahir</Label>
                  <p className="font-medium">{selectedSantri.tanggalLahir}</p>
                </div>
              </div>

              <div>
                <Label>Data Orang Tua</Label>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <p className="font-medium">{selectedSantri.orangTuaName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSantri.orangTuaEmail}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSantri.orangTuaPhone || "Tidak ada nomor telepon"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowViewModal(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Data Santri</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Lengkap</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nis">NIS</Label>
                <Input
                  id="edit-nis"
                  value={formData.nis}
                  onChange={(e) =>
                    setFormData({ ...formData, nis: e.target.value })
                  }
                  placeholder="Masukkan NIS"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-gender">Jenis Kelamin</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: "L" | "P") =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tahunDaftar">Tahun Daftar</Label>
                <Input
                  id="edit-tahunDaftar"
                  value={formData.tahunDaftar}
                  onChange={(e) =>
                    setFormData({ ...formData, tahunDaftar: e.target.value })
                  }
                  placeholder="Masukkan tahun daftar"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tempatLahir">Tempat Lahir</Label>
                <Input
                  id="edit-tempatLahir"
                  value={formData.tempatLahir}
                  onChange={(e) =>
                    setFormData({ ...formData, tempatLahir: e.target.value })
                  }
                  placeholder="Masukkan tempat lahir"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tanggalLahir">Tanggal Lahir</Label>
                <Input
                  id="edit-tanggalLahir"
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggalLahir: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Batal
              </Button>
              <Button onClick={handleUpdateSantri}>Simpan Perubahan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Buat Laporan untuk {selectedSantri?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tab Buttons */}
            <div className="border-b border-border">
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setReportType("hafalan")}
                  className={`flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    reportType === "hafalan"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Hafalan
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("akademik")}
                  className={`flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    reportType === "akademik"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Akademik
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("perilaku")}
                  className={`flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    reportType === "perilaku"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Perilaku
                </button>
              </div>
            </div>

            {/* Hafalan Form */}
            {reportType === "hafalan" && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="surat">Nama Surat/Juz</Label>
                    <Input
                      id="surat"
                      placeholder="Contoh: Al-Baqarah"
                      value={reportForm.hafalan.surat}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          hafalan: { ...reportForm.hafalan, surat: e.target.value },
                        })
                      }
                      disabled={submittingReport}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ayat">Ayat</Label>
                    <Input
                      id="ayat"
                      placeholder="Contoh: 1-5"
                      value={reportForm.hafalan.ayat}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          hafalan: { ...reportForm.hafalan, ayat: e.target.value },
                        })
                      }
                      disabled={submittingReport}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="predikat">Predikat</Label>
                  <Select
                    value={reportForm.hafalan.predikat}
                    onValueChange={(value) =>
                      setReportForm({
                        ...reportForm,
                        hafalan: { ...reportForm.hafalan, predikat: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih predikat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lancar">Lancar</SelectItem>
                      <SelectItem value="Mengulang">Mengulang</SelectItem>
                      <SelectItem value="Kurang">Kurang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Akademik Form */}
            {reportType === "akademik" && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="mapel">Mata Pelajaran</Label>
                  <Select
                    value={reportForm.akademik.mapel}
                    onValueChange={(value) =>
                      setReportForm({
                        ...reportForm,
                        akademik: { ...reportForm.akademik, mapel: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mata pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Matematika">Matematika</SelectItem>
                      <SelectItem value="Fiqih">Fiqih</SelectItem>
                      <SelectItem value="Aqidah">Aqidah</SelectItem>
                      <SelectItem value="Bahasa Arab">Bahasa Arab</SelectItem>
                      <SelectItem value="Bahasa Indonesia">Bahasa Indonesia</SelectItem>
                      <SelectItem value="IPA">IPA</SelectItem>
                      <SelectItem value="IPS">IPS</SelectItem>
                      <SelectItem value="Al-Quran">Al-Quran</SelectItem>
                      <SelectItem value="Hadis">Hadis</SelectItem>
                      <SelectItem value="Tarikh">Tarikh</SelectItem>
                      <SelectItem value="Bahasa Inggris">Bahasa Inggris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nilai">Nilai (0-100)</Label>
                  <Input
                    id="nilai"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Masukkan nilai"
                    value={reportForm.akademik.nilai}
                    onChange={(e) =>
                      setReportForm({
                        ...reportForm,
                        akademik: {
                          ...reportForm.akademik,
                          nilai: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    disabled={submittingReport}
                  />
                </div>
              </div>
            )}

            {/* Perilaku Form */}
            {reportType === "perilaku" && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="jenis">Jenis</Label>
                  <Select
                    value={reportForm.perilaku.jenis}
                    onValueChange={(value) =>
                      setReportForm({
                        ...reportForm,
                        perilaku: { ...reportForm.perilaku, jenis: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prestasi">Prestasi</SelectItem>
                      <SelectItem value="Pelanggaran">Pelanggaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catatan">Catatan Kejadian</Label>
                  <Textarea
                    id="catatan"
                    placeholder="Jelaskan prestasi atau pelanggaran yang terjadi..."
                    rows={4}
                    value={reportForm.perilaku.catatan}
                    onChange={(e) =>
                      setReportForm({
                        ...reportForm,
                        perilaku: { ...reportForm.perilaku, catatan: e.target.value },
                      })
                    }
                    disabled={submittingReport}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowReportModal(false)}
                disabled={submittingReport}
              >
                Batal
              </Button>
              <Button onClick={handleSubmitReport} disabled={submittingReport}>
                {submittingReport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Laporan
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
