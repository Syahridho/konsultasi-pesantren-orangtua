"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Landmark,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Users,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Settings,
  Printer,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from "@/components/ui/textarea";
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

// ─── Interfaces ────────────────────────────────────────────────
interface RincianBiayaItem {
  nama: string;
  nominal: number;
}

interface TagihanUangMasuk {
  id: string;
  santriId: string;
  santriName: string;
  santriGender: string;
  santriNis?: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  tahun: number;
  nominal: number;
  rincianBiaya?: RincianBiayaItem[];
  status: "belum_bayar" | "menunggu_verifikasi" | "lunas" | "ditolak";
  keterangan?: string;
  tanggalBayar?: string;
  buktiPembayaran?: string;
  buktiFileName?: string;
  catatanOrangTua?: string;
  verifiedAt?: string;
  verifiedByName?: string;
  catatanPetugas?: string;
  createdAt: string;
}

interface UangMasukSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  defaultNominal: number;
  rincianBiaya?: RincianBiayaItem[];
  keterangan?: string;
}

interface SantriOption {
  id: string;
  name: string;
  nis: string;
  gender: string;
  parentId?: string;
}

export default function PetugasUangMasukPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // ─── States ──────────────────────────────────────────────────
  const [tagihanList, setTagihanList] = useState<TagihanUangMasuk[]>([]);
  const [settings, setSettings] = useState<UangMasukSettings>({
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7123456789",
    accountHolder: "Pondok Pesantren Baiturrahman",
    defaultNominal: 2500000,
  });
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedRekening, setCopiedRekening] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState<"semua" | "L" | "P">("semua");
  const [tahunFilter, setTahunFilter] = useState("all");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected item
  const [selectedTagihan, setSelectedTagihan] = useState<TagihanUangMasuk | null>(null);

  // Form states
  const [selectedSantriId, setSelectedSantriId] = useState("");
  const [formNominal, setFormNominal] = useState(2500000);
  const [formTahun, setFormTahun] = useState(new Date().getFullYear().toString());
  const [formKeterangan, setFormKeterangan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification form
  const [verifStatus, setVerifStatus] = useState<"lunas" | "ditolak">("lunas");
  const [verifCatatan, setVerifCatatan] = useState("");

  // Edit form
  const [editNominal, setEditNominal] = useState(0);
  const [editStatus, setEditStatus] = useState<TagihanUangMasuk["status"]>("belum_bayar");
  const [editKeterangan, setEditKeterangan] = useState("");

  // Settings form
  const [tempBankName, setTempBankName] = useState("");
  const [tempAccountNumber, setTempAccountNumber] = useState("");
  const [tempAccountHolder, setTempAccountHolder] = useState("");
  const [tempDefaultNominal, setTempDefaultNominal] = useState(2500000);
  const [tempKeterangan, setTempKeterangan] = useState("");

  // ─── Fetch Data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/uang-masuk");
      if (res.status === 200) {
        setTagihanList(res.data.tagihanList || []);
        if (res.data.settings) {
          setSettings(res.data.settings);
          setFormNominal(res.data.settings.defaultNominal || 2500000);
        }
      }
    } catch (err: any) {
      console.error("Error fetching uang masuk:", err);
      toast.error("Gagal memuat data tagihan uang masuk");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSantriList = useCallback(async () => {
    try {
      const res = await api.get("/api/santri");
      if (res.status === 200) {
        const list: SantriOption[] = (res.data.students || res.data.santriList || []).map(
          (s: any) => ({
            id: s.id,
            name: s.name,
            nis: s.nis || "",
            gender: s.gender || s.jenisKelamin || "",
            parentId: s.parentId,
          })
        );
        setSantriList(list);
      }
    } catch (err) {
      console.error("Error fetching santri list:", err);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchData();
      fetchSantriList();
    }
  }, [authStatus, fetchData, fetchSantriList]);

  // Available santri without uang masuk bill
  const availableSantri = useMemo(() => {
    const existingSantriIds = new Set(tagihanList.map((t) => t.santriId));
    return santriList.filter((s) => !existingSantriIds.has(s.id));
  }, [santriList, tagihanList]);

  // ─── Filtered Data ───────────────────────────────────────────
  const filteredList = useMemo(() => {
    return tagihanList.filter((item) => {
      // Search
      const matchSearch =
        searchQuery === "" ||
        item.santriName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.santriNis && item.santriNis.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.parentName && item.parentName.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      // Gender
      const matchGender = genderFilter === "semua" || item.santriGender === genderFilter;

      // Tahun
      const matchTahun = tahunFilter === "all" || String(item.tahun) === tahunFilter;

      return matchSearch && matchStatus && matchGender && matchTahun;
    });
  }, [tagihanList, searchQuery, statusFilter, genderFilter, tahunFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = tagihanList.length;
    const lunasList = tagihanList.filter((t) => t.status === "lunas");
    const lunas = lunasList.length;
    const menunggu = tagihanList.filter((t) => t.status === "menunggu_verifikasi").length;
    const belum = tagihanList.filter((t) => t.status === "belum_bayar").length;
    const totalUangTerkumpul = lunasList.reduce((acc, t) => acc + (t.nominal || 0), 0);
    const totalTagihanNominal = tagihanList.reduce((acc, t) => acc + (t.nominal || 0), 0);

    return { total, lunas, menunggu, belum, totalUangTerkumpul, totalTagihanNominal };
  }, [tagihanList]);

  // ─── Handlers ────────────────────────────────────────────────
  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriId) {
      toast.error("Pilih santri terlebih dahulu");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/api/uang-masuk", {
        santriId: selectedSantriId,
        nominal: formNominal,
        tahun: formTahun,
        keterangan: formKeterangan,
      });

      if (res.status === 200) {
        toast.success("Tagihan uang masuk berhasil dibuat");
        setAddModalOpen(false);
        setSelectedSantriId("");
        setFormKeterangan("");
        fetchData();
      } else {
        toast.error(res.data.error || "Gagal membuat tagihan");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkGenerate = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.post("/api/uang-masuk", {
        action: "bulk_generate",
        nominal: formNominal,
        tahun: formTahun,
      });

      if (res.status === 200) {
        toast.success(res.data.message || "Berhasil membuat tagihan massal");
        setBulkModalOpen(false);
        fetchData();
      } else {
        toast.error(res.data.error || "Gagal generate tagihan");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedTagihan) return;
    try {
      setIsSubmitting(true);
      const res = await api.put("/api/uang-masuk", {
        id: selectedTagihan.id,
        action: "verifikasi",
        status: verifStatus,
        catatanPetugas: verifCatatan,
      });

      if (res.status === 200) {
        toast.success(res.data.message || "Status pembayaran diperbarui");
        setVerifyModalOpen(false);
        setSelectedTagihan(null);
        fetchData();
      } else {
        toast.error(res.data.error || "Gagal memperbarui verifikasi");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTagihan) return;

    try {
      setIsSubmitting(true);
      const res = await api.put("/api/uang-masuk", {
        id: selectedTagihan.id,
        nominal: editNominal,
        status: editStatus,
        keterangan: editKeterangan,
      });

      if (res.status === 200) {
        toast.success("Tagihan berhasil diperbarui");
        setEditModalOpen(false);
        setSelectedTagihan(null);
        fetchData();
      } else {
        toast.error(res.data.error || "Gagal mengedit tagihan");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTagihan) return;
    try {
      setIsSubmitting(true);
      const res = await api.delete(`/api/uang-masuk?id=${selectedTagihan.id}`);
      if (res.status === 200) {
        toast.success("Tagihan uang masuk berhasil dihapus");
        setDeleteDialogOpen(false);
        setSelectedTagihan(null);
        fetchData();
      } else {
        toast.error(res.data.error || "Gagal menghapus tagihan");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.put("/api/uang-masuk/settings", {
        bankName: tempBankName,
        accountNumber: tempAccountNumber,
        accountHolder: tempAccountHolder,
        defaultNominal: tempDefaultNominal,
        keterangan: tempKeterangan,
      });

      if (res.status === 200) {
        toast.success("Pengaturan uang masuk berhasil disimpan");
        setSettingsModalOpen(false);
        setSettings(res.data.settings);
        setFormNominal(res.data.settings.defaultNominal);
      } else {
        toast.error(res.data.error || "Gagal menyimpan pengaturan");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRekening(true);
    toast.success("Nomor rekening disalin!");
    setTimeout(() => setCopiedRekening(false), 2000);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const openVerifyModal = (tagihan: TagihanUangMasuk) => {
    setSelectedTagihan(tagihan);
    setVerifStatus("lunas");
    setVerifCatatan(tagihan.catatanPetugas || "");
    setVerifyModalOpen(true);
  };

  const openEditModal = (tagihan: TagihanUangMasuk) => {
    setSelectedTagihan(tagihan);
    setEditNominal(tagihan.nominal);
    setEditStatus(tagihan.status);
    setEditKeterangan(tagihan.keterangan || "");
    setEditModalOpen(true);
  };

  const openSettingsModal = () => {
    setTempBankName(settings.bankName);
    setTempAccountNumber(settings.accountNumber);
    setTempAccountHolder(settings.accountHolder);
    setTempDefaultNominal(settings.defaultNominal);
    setTempKeterangan(settings.keterangan || "");
    setSettingsModalOpen(true);
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Landmark className="h-7 w-7 text-primary" />
            Manajemen Uang Masuk
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola tagihan uang masuk (1x bayar) santri baru & verifikasi pembayaran
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={openSettingsModal}>
            <Settings className="w-4 h-4 mr-2" />
            Pengaturan Bank & Biaya
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFormNominal(settings.defaultNominal);
              setBulkModalOpen(true);
            }}
          >
            <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
            Generate Massal
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSelectedSantriId("");
              setFormNominal(settings.defaultNominal);
              setAddModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Tagihan
          </Button>
        </div>
      </div>

      {/* Info Rekening Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Rekening Resmi Uang Masuk Pesantren
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-gray-900 text-base">
                  {settings.bankName} - {settings.accountNumber}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => copyToClipboard(settings.accountNumber)}
                >
                  {copiedRekening ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-600">A.n. {settings.accountHolder}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-600 border-t md:border-t-0 pt-2 md:pt-0">
            <div>
              <span className="text-gray-500">Biaya Default: </span>
              <span className="font-bold text-emerald-700">
                {formatRupiah(settings.defaultNominal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tagihan
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total} Santri</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total Nilai: {formatRupiah(stats.totalTagihanNominal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">
              Lunas / Terkumpul
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatRupiah(stats.totalUangTerkumpul)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.lunas} santri telah lunas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">
              Menunggu Verifikasi
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.menunggu} Tagihan</div>
            <p className="text-xs text-muted-foreground mt-1">
              Perlu diperiksa bukti transfernya
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-700">
              Belum Membayar
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{stats.belum} Santri</div>
            <p className="text-xs text-muted-foreground mt-1">
              Menunggu pembayaran wali santri
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              Daftar Tagihan Uang Masuk ({filteredList.length})
            </CardTitle>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="w-full md:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari santri, NIS, wali..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                <SelectItem value="menunggu_verifikasi">Menunggu Verifikasi</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={genderFilter}
              onValueChange={(val: any) => setGenderFilter(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Jenis Kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Gender</SelectItem>
                <SelectItem value="L">Laki-laki (Santriwan)</SelectItem>
                <SelectItem value="P">Perempuan (Santriwati)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tahunFilter} onValueChange={setTahunFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tahun Masuk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Memuat data tagihan uang masuk...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center">
              <Landmark className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-base font-medium text-gray-700">Tidak ada data tagihan</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Coba sesuaikan filter atau kata kunci pencarian."
                  : "Belum ada tagihan uang masuk. Klik 'Tambah Tagihan' atau 'Generate Massal'."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Santri</TableHead>
                    <TableHead>Wali Santri</TableHead>
                    <TableHead>Tahun Masuk</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((tagihan) => (
                    <TableRow key={tagihan.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="font-semibold text-gray-900">{tagihan.santriName}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <span>NIS: {tagihan.santriNis || "-"}</span>
                          <span>•</span>
                          <span
                            className={`font-medium ${
                              tagihan.santriGender === "L" ? "text-blue-600" : "text-pink-600"
                            }`}
                          >
                            {tagihan.santriGender === "L" ? "♂ Laki-laki" : tagihan.santriGender === "P" ? "♀ Perempuan" : "-"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm font-medium">{tagihan.parentName || "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {tagihan.parentPhone || "-"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {tagihan.tahun}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="font-bold text-gray-900">
                          {formatRupiah(tagihan.nominal)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">1x Bayar</div>
                      </TableCell>

                      <TableCell>
                        {tagihan.status === "lunas" && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Lunas
                          </Badge>
                        )}
                        {tagihan.status === "menunggu_verifikasi" && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 mr-1" /> Menunggu Verifikasi
                          </Badge>
                        )}
                        {tagihan.status === "belum_bayar" && (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-300">
                            <XCircle className="w-3 h-3 mr-1" /> Belum Bayar
                          </Badge>
                        )}
                        {tagihan.status === "ditolak" && (
                          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                            Ditolak
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Verifikasi button if waiting or has proof */}
                          {tagihan.status === "menunggu_verifikasi" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-2.5 text-xs"
                              onClick={() => openVerifyModal(tagihan)}
                            >
                              Verifikasi
                            </Button>
                          )}



                          {/* Detail / Kwitansi */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedTagihan(tagihan);
                              setDetailModalOpen(true);
                            }}
                            title="Lihat Detail & Kwitansi"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Edit */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(tagihan)}
                            title="Edit Tagihan"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              setSelectedTagihan(tagihan);
                              setDeleteDialogOpen(true);
                            }}
                            title="Hapus Tagihan"
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

      {/* ─── Modal 1: Tambah Tagihan Uang Masuk ────────────────────── */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Tagihan Uang Masuk</DialogTitle>
            <DialogDescription>
              Buat tagihan biaya masuk (1x bayar) untuk santri baru.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSingleCreate} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Pilih Santri *</Label>
              <Select value={selectedSantriId} onValueChange={setSelectedSantriId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih santri yang belum ditagih..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableSantri.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      Semua santri sudah memiliki tagihan uang masuk.
                    </div>
                  ) : (
                    availableSantri.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} (NIS: {s.nis || "-"} • {s.gender === "L" ? "L" : "P"})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nominal Uang Masuk (Rp) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="50000"
                  value={formNominal}
                  onChange={(e) => setFormNominal(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tahun Masuk *</Label>
                <Input
                  type="number"
                  value={formTahun}
                  onChange={(e) => setFormTahun(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Keterangan Tambahan</Label>
              <Textarea
                placeholder="Misal: Termasuk uang gedung, seragam, dan kitab santri baru"
                value={formKeterangan}
                onChange={(e) => setFormKeterangan(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedSantriId}>
                {isSubmitting ? "Menyimpan..." : "Buat Tagihan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 2: Bulk Generate Santri Baru ───────────────────── */}
      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Generate Massal Tagihan Uang Masuk
            </DialogTitle>
            <DialogDescription>
              Otomatis membuat tagihan uang masuk (1x bayar) untuk semua santri aktif yang belum memiliki tagihan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              Sistem akan memeriksa semua data santri dan hanya membuat tagihan baru bagi santri yang belum pernah ditagih uang masuk.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nominal Tagihan (Rp)</Label>
                <Input
                  type="number"
                  value={formNominal}
                  onChange={(e) => setFormNominal(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tahun Masuk</Label>
                <Input
                  type="number"
                  value={formTahun}
                  onChange={(e) => setFormTahun(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleBulkGenerate}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? "Memproses..." : "Generate Tagihan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 3: Verifikasi Pembayaran ───────────────────────── */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Verifikasi Pembayaran Uang Masuk</DialogTitle>
            <DialogDescription>
              Periksa bukti transfer dan tentukan status tagihan.
            </DialogDescription>
          </DialogHeader>

          {selectedTagihan && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 p-3 rounded-lg border text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Santri:</span>
                  <span className="font-semibold">{selectedTagihan.santriName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nominal:</span>
                  <span className="font-bold text-emerald-700">
                    {formatRupiah(selectedTagihan.nominal)}
                  </span>
                </div>
                {selectedTagihan.tanggalBayar && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal Upload:</span>
                    <span>{new Date(selectedTagihan.tanggalBayar).toLocaleString("id-ID")}</span>
                  </div>
                )}
                {selectedTagihan.catatanOrangTua && (
                  <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                    <span className="font-medium text-gray-700">Catatan Orang Tua: </span>
                    {selectedTagihan.catatanOrangTua}
                  </div>
                )}
              </div>

              {/* Bukti Preview */}
              {selectedTagihan.buktiPembayaran ? (
                <div className="space-y-2">
                  <Label>Bukti Transfer / Pembayaran</Label>
                  <div className="border rounded-lg p-2 bg-black/5 max-h-60 overflow-y-auto flex items-center justify-center">
                    <img
                      src={selectedTagihan.buktiPembayaran}
                      alt="Bukti Transfer"
                      className="max-h-56 object-contain rounded"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center border rounded-lg bg-amber-50 text-amber-800 text-xs">
                  Belum ada foto bukti transfer yang diunggah.
                </div>
              )}

              <div className="space-y-2">
                <Label>Keputusan Verifikasi *</Label>
                <Select
                  value={verifStatus}
                  onValueChange={(val: any) => setVerifStatus(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lunas">✅ Setujui & Nyatakan Lunas</SelectItem>
                    <SelectItem value="ditolak">❌ Tolak Bukti Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Catatan Petugas (Opsional)</Label>
                <Textarea
                  placeholder="Misal: Pembayaran telah diterima via transfer BSI"
                  value={verifCatatan}
                  onChange={(e) => setVerifCatatan(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setVerifyModalOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleVerify} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Keputusan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 4: Detail & Kwitansi Uang Masuk ─────────────────── */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detail & Bukti Tagihan Uang Masuk
            </DialogTitle>
          </DialogHeader>

          {selectedTagihan && (
            <div className="space-y-4 py-2">
              {/* Receipt Box */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 bg-gradient-to-b from-white to-gray-50 space-y-4">
                <div className="text-center pb-3 border-b">
                  <h3 className="font-bold text-base text-gray-900">
                    PONDOK PESANTREN BAITURRAHMAN
                  </h3>
                  <p className="text-xs text-gray-500">
                    Kuitansi Pembayaran Uang Masuk Santri Baru
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    No. Ref: UM-{selectedTagihan.id.slice(-8).toUpperCase()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">Nama Santri</span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {selectedTagihan.santriName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">NIS & Gender</span>
                    <span className="font-medium text-gray-800">
                      {selectedTagihan.santriNis || "-"} ({selectedTagihan.santriGender === "L" ? "Laki-laki" : "Perempuan"})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Nama Orang Tua / Wali</span>
                    <span className="font-medium text-gray-800">
                      {selectedTagihan.parentName || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Tahun Angkatan</span>
                    <span className="font-medium text-gray-800">
                      {selectedTagihan.tahun}
                    </span>
                  </div>
                </div>

                {/* Rincian Biaya */}
                <div className="border rounded-lg p-3 bg-white space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Rincian Komponen Biaya:</p>
                  <div className="space-y-1 text-xs">
                    {(selectedTagihan.rincianBiaya || settings.rincianBiaya || []).map(
                      (item, idx) => (
                        <div key={idx} className="flex justify-between text-gray-600">
                          <span>• {item.nama}</span>
                          <span>{formatRupiah(item.nominal)}</span>
                        </div>
                      )
                    )}
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-sm text-gray-900">
                    <span>Total Uang Masuk</span>
                    <span className="text-emerald-700">
                      {formatRupiah(selectedTagihan.nominal)}
                    </span>
                  </div>
                </div>

                {/* Status & Verification info */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-gray-500 block">Status Pembayaran:</span>
                    <span className="font-semibold capitalize">
                      {selectedTagihan.status.replace("_", " ")}
                    </span>
                  </div>
                  {selectedTagihan.verifiedByName && (
                    <div className="text-right">
                      <span className="text-gray-500 block">Diverifikasi Oleh:</span>
                      <span className="font-medium">{selectedTagihan.verifiedByName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bukti Transfer */}
              {selectedTagihan.buktiPembayaran && (
                <div className="space-y-2">
                  <Label>Foto Bukti Pembayaran</Label>
                  <div className="border rounded-lg p-2 bg-black/5 flex items-center justify-center">
                    <img
                      src={selectedTagihan.buktiPembayaran}
                      alt="Bukti Transfer"
                      className="max-h-64 object-contain rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDetailModalOpen(false)}
            >
              Tutup
            </Button>
            <Button
              onClick={() => window.print()}
              variant="secondary"
              className="gap-2"
            >
              <Printer className="h-4 w-4" /> Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 5: Edit Tagihan ─────────────────────────────────── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Tagihan Uang Masuk</DialogTitle>
            <DialogDescription>
              Ubah data nominal, status, atau keterangan tagihan santri.
            </DialogDescription>
          </DialogHeader>

          {selectedTagihan && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="text-sm font-semibold bg-gray-50 p-2.5 rounded border">
                Santri: {selectedTagihan.santriName} (NIS: {selectedTagihan.santriNis || "-"})
              </div>

              <div className="space-y-2">
                <Label>Nominal Tagihan (Rp) *</Label>
                <Input
                  type="number"
                  value={editNominal}
                  onChange={(e) => setEditNominal(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Status Tagihan *</Label>
                <Select
                  value={editStatus}
                  onValueChange={(val: any) => setEditStatus(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                    <SelectItem value="menunggu_verifikasi">Menunggu Verifikasi</SelectItem>
                    <SelectItem value="lunas">Lunas</SelectItem>
                    <SelectItem value="ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Textarea
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter>
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

      {/* ─── Modal 6: Pengaturan Rekening & Nominal Default ───────── */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pengaturan Uang Masuk & Rekening</DialogTitle>
            <DialogDescription>
              Atur nomor rekening tujuan pembayaran serta nominal default untuk santri baru.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Bank *</Label>
              <Input
                placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                value={tempBankName}
                onChange={(e) => setTempBankName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Nomor Rekening *</Label>
              <Input
                placeholder="Contoh: 7123456789"
                value={tempAccountNumber}
                onChange={(e) => setTempAccountNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Nama Pemilik Rekening (A.n) *</Label>
              <Input
                placeholder="Contoh: Pondok Pesantren Baiturrahman"
                value={tempAccountHolder}
                onChange={(e) => setTempAccountHolder(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Nominal Default Uang Masuk (Rp) *</Label>
              <Input
                type="number"
                min="0"
                step="50000"
                value={tempDefaultNominal}
                onChange={(e) => setTempDefaultNominal(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan / Instruksi Pembayaran</Label>
              <Textarea
                placeholder="Instruksi bagi orang tua saat melakukan transfer..."
                value={tempKeterangan}
                onChange={(e) => setTempKeterangan(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSettingsModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── AlertDialog: Hapus Tagihan ───────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tagihan Uang Masuk?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus tagihan uang masuk untuk santri{" "}
              <strong className="text-gray-900">{selectedTagihan?.santriName}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting ? "Menghapus..." : "Hapus Tagihan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
