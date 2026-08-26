"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserCheck,
  Search,
  Plus,
  Users,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  Phone,
  Mail,
  Briefcase,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";

interface Petugas {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  position?: string;
  role: string;
  createdAt?: string;
}

export default function DataPetugasPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // ─── States ──────────────────────────────────────────────────
  const [petugasList, setPetugasList] = useState<Petugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "L" | "P">("all");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected Petugas
  const [selectedPetugas, setSelectedPetugas] = useState<Petugas | null>(null);

  // Add Form states
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addGender, setAddGender] = useState("L");
  const [addPosition, setAddPosition] = useState("Petugas Keuangan & Administrasi");

  // Edit Form states
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGender, setEditGender] = useState("L");
  const [editPosition, setEditPosition] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Fetch Data ──────────────────────────────────────────────
  const fetchPetugas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/petugas");
      if (res.status === 200) {
        setPetugasList(res.data.petugasList || []);
      } else {
        toast.error("Gagal memuat data petugas");
      }
    } catch (err) {
      console.error("Error fetching petugas:", err);
      toast.error("Terjadi kesalahan saat memuat data petugas");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Auth Guard ──────────────────────────────────────────────
  useEffect(() => {
    if (authStatus === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "admin") {
      toast.error("Hanya administrator yang dapat mengakses halaman ini");
      router.push("/dashboard");
      return;
    }

    fetchPetugas();
  }, [session, authStatus, router, fetchPetugas]);

  // ─── Filtered Data ───────────────────────────────────────────
  const filteredPetugasList = useMemo(() => {
    return petugasList.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.phone && item.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.position && item.position.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGender =
        genderFilter === "all" || item.gender === genderFilter;

      return matchSearch && matchGender;
    });
  }, [petugasList, searchQuery, genderFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = petugasList.length;
    const laki = petugasList.filter((p) => p.gender === "L").length;
    const perempuan = petugasList.filter((p) => p.gender === "P").length;
    return { total, laki, perempuan };
  }, [petugasList]);

  // ─── Handlers ────────────────────────────────────────────────
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addName.trim() || addName.trim().length < 3) {
      toast.error("Nama petugas minimal 3 karakter");
      return;
    }

    if (!addEmail.trim() || !addEmail.includes("@")) {
      toast.error("Email tidak valid");
      return;
    }

    if (!addPassword || addPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/api/petugas", {
        name: addName,
        email: addEmail,
        password: addPassword,
        phone: addPhone,
        gender: addGender,
        position: addPosition,
      });

      if (res.status === 200) {
        toast.success("Petugas baru berhasil ditambahkan!");
        setAddModalOpen(false);
        // Reset form
        setAddName("");
        setAddEmail("");
        setAddPassword("");
        setAddPhone("");
        setAddGender("L");
        setAddPosition("Petugas Keuangan & Administrasi");
        fetchPetugas();
      } else {
        toast.error(res.data.error || "Gagal menambahkan petugas");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan saat menambahkan petugas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetugas) return;

    if (!editName.trim() || editName.trim().length < 3) {
      toast.error("Nama petugas minimal 3 karakter");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.put(`/api/petugas/${selectedPetugas.id}`, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        gender: editGender,
        position: editPosition,
      });

      if (res.status === 200) {
        toast.success("Data petugas berhasil diperbarui");
        setEditModalOpen(false);
        setSelectedPetugas(null);
        fetchPetugas();
      } else {
        toast.error(res.data.error || "Gagal memperbarui data petugas");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan saat update data petugas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedPetugas) return;

    try {
      setIsSubmitting(true);
      const res = await api.delete(`/api/petugas/${selectedPetugas.id}`);

      if (res.status === 200) {
        toast.success("Petugas berhasil dihapus dari sistem");
        setDeleteDialogOpen(false);
        setSelectedPetugas(null);
        fetchPetugas();
      } else {
        toast.error(res.data.error || "Gagal menghapus petugas");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan saat menghapus petugas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openViewModal = (petugas: Petugas) => {
    setSelectedPetugas(petugas);
    setViewModalOpen(true);
  };

  const openEditModal = (petugas: Petugas) => {
    setSelectedPetugas(petugas);
    setEditName(petugas.name);
    setEditEmail(petugas.email);
    setEditPhone(petugas.phone || "");
    setEditGender(petugas.gender || "L");
    setEditPosition(petugas.position || "Petugas Keuangan & Administrasi");
    setEditModalOpen(true);
  };

  const openDeleteDialog = (petugas: Petugas) => {
    setSelectedPetugas(petugas);
    setDeleteDialogOpen(true);
  };

  const sendWhatsApp = (phone?: string) => {
    if (!phone) {
      toast.error("Nomor telepon tidak tersedia");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0")
      ? "62" + cleanPhone.slice(1)
      : cleanPhone;

    window.open(`https://wa.me/${formattedPhone}`, "_blank");
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <UserCheck className="h-7 w-7 text-primary" />
            Data Petugas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola akun dan hak akses petugas administrasi & keuangan pesantren
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Petugas Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Petugas Aktif
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total} Orang</div>
            <p className="text-xs text-muted-foreground mt-1">
              Petugas pengelola sistem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Petugas Laki-laki
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.laki} Orang</div>
            <p className="text-xs text-muted-foreground mt-1">
              Akun petugas ikhwan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-pink-700">
              Petugas Perempuan
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{stats.perempuan} Orang</div>
            <p className="text-xs text-muted-foreground mt-1">
              Akun petugas akhwat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Daftar Petugas ({filteredPetugasList.length})
            </CardTitle>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchPetugas}
              disabled={loading}
              className="w-full md:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="relative md:col-span-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama petugas, email, no HP, atau jabatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>

            <Select
              value={genderFilter}
              onValueChange={(val: any) => setGenderFilter(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Gender</SelectItem>
                <SelectItem value="L">♂ Laki-laki</SelectItem>
                <SelectItem value="P">♀ Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Memuat data petugas...</p>
            </div>
          ) : filteredPetugasList.length === 0 ? (
            <div className="py-12 text-center">
              <UserCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-base font-medium text-gray-700">Tidak ada data petugas</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || genderFilter !== "all"
                  ? "Coba sesuaikan kata kunci pencarian atau filter."
                  : "Belum ada petugas yang terdaftar. Klik 'Tambah Petugas Baru'."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Petugas & Gender</TableHead>
                    <TableHead>Jabatan / Bagian</TableHead>
                    <TableHead>Email Login</TableHead>
                    <TableHead>No. HP / WA</TableHead>
                    <TableHead>Terdaftar</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPetugasList.map((petugas) => (
                    <TableRow key={petugas.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="font-semibold text-gray-900">{petugas.name}</div>
                        <div className="text-xs mt-0.5">
                          {petugas.gender === "L" ? (
                            <span className="text-blue-600 font-medium">♂ Laki-laki</span>
                          ) : petugas.gender === "P" ? (
                            <span className="text-pink-600 font-medium">♀ Perempuan</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-medium bg-gray-50">
                          {petugas.position || "Petugas Administrasi"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-gray-700 font-mono">{petugas.email}</div>
                      </TableCell>

                      <TableCell>
                        {petugas.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-800">{petugas.phone}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-[11px]"
                              onClick={() => sendWhatsApp(petugas.phone)}
                              title="Chat WhatsApp"
                            >
                              WA
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {petugas.createdAt
                            ? new Date(petugas.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openViewModal(petugas)}
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(petugas)}
                            title="Edit Data Petugas"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => openDeleteDialog(petugas)}
                            title="Hapus Petugas"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* ─── Modal 1: Tambah Petugas Baru ──────────────────────────── */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Tambah Petugas Baru
            </DialogTitle>
            <DialogDescription>
              Buat akun login baru untuk staf administrasi atau keuangan pesantren.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Lengkap Petugas *</Label>
              <Input
                placeholder="Contoh: Ahmad Fauzi, S.E."
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={addGender} onValueChange={setAddGender}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">♂ Laki-laki</SelectItem>
                    <SelectItem value="P">♀ Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>No. HP / WhatsApp</Label>
                <Input
                  placeholder="08123456789"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jabatan / Posisi Petugas</Label>
              <Select value={addPosition} onValueChange={setAddPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petugas Keuangan & Administrasi">
                    Petugas Keuangan & Administrasi
                  </SelectItem>
                  <SelectItem value="Petugas Kasir & Pembayaran">
                    Petugas Kasir & Pembayaran
                  </SelectItem>
                  <SelectItem value="Petugas Perlengkapan & Seragam">
                    Petugas Perlengkapan & Seragam
                  </SelectItem>
                  <SelectItem value="Petugas Perpustakaan & Kitab">
                    Petugas Perpustakaan & Kitab
                  </SelectItem>
                  <SelectItem value="Petugas Layanan Laundry">
                    Petugas Layanan Laundry
                  </SelectItem>
                  <SelectItem value="Staf Tata Usaha">Staf Tata Usaha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Login *</Label>
                <Input
                  type="email"
                  placeholder="petugas@pesantren.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Password Awal *</Label>
                <Input
                  type="password"
                  placeholder="Min. 6 karakter"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Petugas"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 2: View Detail Petugas ──────────────────────────── */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Detail Akun Petugas
            </DialogTitle>
          </DialogHeader>

          {selectedPetugas && (
            <div className="space-y-4 py-2">
              <div className="border rounded-xl p-4 bg-gradient-to-b from-white to-gray-50 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    {selectedPetugas.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{selectedPetugas.name}</h3>
                    <Badge variant="outline" className="text-xs mt-0.5">
                      {selectedPetugas.position || "Petugas Administrasi"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedPetugas.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedPetugas.phone || "Tidak ada nomor HP"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      Gender: {selectedPetugas.gender === "L" ? "Laki-laki" : selectedPetugas.gender === "P" ? "Perempuan" : "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Dibuat pada:{" "}
                      {selectedPetugas.createdAt
                        ? new Date(selectedPetugas.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedPetugas?.phone && (
              <Button
                type="button"
                variant="outline"
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 mr-auto"
                onClick={() => sendWhatsApp(selectedPetugas.phone)}
              >
                Chat WhatsApp
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewModalOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 3: Edit Petugas ─────────────────────────────────── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Data Petugas</DialogTitle>
            <DialogDescription>
              Ubah informasi profil atau posisi jabatan petugas.
            </DialogDescription>
          </DialogHeader>

          {selectedPetugas && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nama Lengkap Petugas *</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={editGender} onValueChange={setEditGender}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">♂ Laki-laki</SelectItem>
                      <SelectItem value="P">♀ Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>No. HP / WhatsApp</Label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jabatan / Posisi</Label>
                <Select value={editPosition} onValueChange={setEditPosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petugas Keuangan & Administrasi">
                      Petugas Keuangan & Administrasi
                    </SelectItem>
                    <SelectItem value="Petugas Kasir & Pembayaran">
                      Petugas Kasir & Pembayaran
                    </SelectItem>
                    <SelectItem value="Petugas Perlengkapan & Seragam">
                      Petugas Perlengkapan & Seragam
                    </SelectItem>
                    <SelectItem value="Petugas Perpustakaan & Kitab">
                      Petugas Perpustakaan & Kitab
                    </SelectItem>
                    <SelectItem value="Petugas Layanan Laundry">
                      Petugas Layanan Laundry
                    </SelectItem>
                    <SelectItem value="Staf Tata Usaha">Staf Tata Usaha</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── AlertDialog: Hapus Petugas ────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Petugas?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus petugas{" "}
              <strong className="text-gray-900">{selectedPetugas?.name}</strong> ({selectedPetugas?.email})?
              Akun ini tidak akan dapat login lagi ke sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubmit}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting ? "Menghapus..." : "Hapus Petugas"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
