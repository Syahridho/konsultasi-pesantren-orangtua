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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Users,
  Edit,
  Trash2,
  Eye,
  UserCheck,
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
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [formData, setFormData] = useState<NewSantri>({
    name: "",
    nis: "",
    gender: "L",
    tempatLahir: "",
    tanggalLahir: "",
    tahunDaftar: new Date().getFullYear().toString(),
    orangTuaId: "",
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

  const generateCertificate = (santri: Santri) => {
    const certificateContent = `
      <html>
        <head>
          <title>Sertifikat Santri</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .certificate { border: 5px solid #gold; padding: 40px; max-width: 800px; margin: 0 auto; }
            .title { font-size: 36px; font-weight: bold; margin-bottom: 20px; }
            .student-name { font-size: 24px; margin: 30px 0; }
            .details { font-size: 18px; margin: 10px 0; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="title">SERTIFIKAT SANTRI</div>
            <p>Menyatakan bahwa:</p>
            <div class="student-name">${santri.name}</div>
            <div class="details">NIS: ${santri.nis}</div>
            <div class="details">Jenis Kelamin: ${
              santri.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"
            }</div>
            <div class="details">Tempat Lahir: ${santri.tempatLahir}</div>
            <div class="details">Tanggal Lahir: ${santri.tanggalLahir}</div>
            <div class="details">Orang Tua: ${santri.orangTuaName}</div>
            <div class="details">Tahun Daftar: ${santri.tahunDaftar}</div>
            <p>telah terdaftar sebagai santri di lembaga kami</p>
            <div class="signature">
              <div>
                <p>_________________________</p>
                <p>Pengurus Lembaga</p>
              </div>
              <div>
                <p>_________________________</p>
                <p>Tanggal: ${new Date().toLocaleDateString("id-ID")}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([certificateContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sertifikat-${santri.name
      .replace(/\s+/g, "-")
      .toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Sertifikat berhasil diunduh");
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

        {session?.user.role === "admin" || session?.user.role === "ustad" ? (
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
                  <Label htmlFor="orangTuaId">Orang Tua</Label>
                  <Select
                    value={formData.orangTuaId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, orangTuaId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih orang tua" />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name} ({parent.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <TableHead>Nama</TableHead>
                  <TableHead>NIS</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Orang Tua</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Tahun Daftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSantriList.map((santri) => (
                  <TableRow key={santri.id}>
                    <TableCell className="font-medium">{santri.name}</TableCell>
                    <TableCell>{santri.nis}</TableCell>
                    <TableCell>
                      {santri.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{santri.orangTuaName}</div>
                        <div className="text-sm text-muted-foreground">
                          {santri.orangTuaEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{santri.orangTuaPhone || "-"}</TableCell>
                    <TableCell>{santri.tahunDaftar || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openViewModal(santri)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {session?.user.role === "admin" ||
                        session?.user.role === "ustad" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(santri)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSantri(santri)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : null}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateCertificate(santri)}
                        >
                          Sertifikat
                        </Button>
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
    </div>
  );
}
