"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CreditCard,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Landmark,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  FileCheck,
  Calendar,
  Sparkles,
  Users,
  ExternalLink,
  Copy,
  Check,
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

interface TagihanIuran {
  id: string;
  santriId: string;
  santriName: string;
  santriGender: string;
  santriNis?: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  bulan: string;
  tahun: number;
  nominal: number;
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

interface BankSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  defaultNominal: number;
  keterangan?: string;
}

interface SantriOption {
  id: string;
  name: string;
  nis: string;
  gender: string;
}

const BULAN_OPTIONS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function PetugasIuranPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Data states
  const [tagihanList, setTagihanList] = useState<TagihanIuran[]>([]);
  const [santriOptions, setSantriOptions] = useState<SantriOption[]>([]);
  const [bankSettings, setBankSettings] = useState<BankSettings>({
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7123456789",
    accountHolder: "Pondok Pesantren Baiturrahman",
    defaultNominal: 350000,
    keterangan: "Pembayaran SPP paling lambat tanggal 10 setiap bulan",
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"semua" | "L" | "P">("semua");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bulanFilter, setBulanFilter] = useState<string>("all");
  const [tahunFilter, setTahunFilter] = useState<string>(
    new Date().getFullYear().toString()
  );

  // Verification modal
  const [selectedForVerification, setSelectedForVerification] =
    useState<TagihanIuran | null>(null);
  const [catatanPetugas, setCatatanPetugas] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Bank Settings modal
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState<BankSettings>(bankSettings);
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Bulk generate modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkBulan, setBulkBulan] = useState(
    BULAN_OPTIONS[new Date().getMonth()]
  );
  const [bulkTahun, setBulkTahun] = useState(
    new Date().getFullYear().toString()
  );
  const [bulkNominal, setBulkNominal] = useState("350000");
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual create/edit modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    santriId: "",
    bulan: BULAN_OPTIONS[new Date().getMonth()],
    tahun: new Date().getFullYear().toString(),
    nominal: "350000",
    keterangan: "",
    status: "belum_bayar",
  });
  const [isSavingForm, setIsSavingForm] = useState(false);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<TagihanIuran | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Format helpers
  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  const formatNumberInput = (value: string) => {
    const number = value.replace(/\D/g, "");
    if (!number) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(number));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Auth check
  useEffect(() => {
    if (status === "loading") return;
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "petugas")
    ) {
      router.push("/dashboard");
      toast.error("Anda tidak memiliki akses ke halaman ini");
    }
  }, [session, status, router]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [iuranRes, santriRes] = await Promise.all([
        fetch("/api/iuran"),
        fetch("/api/santri/enhanced"),
      ]);

      const iuranData = await iuranRes.json();
      const santriData = await santriRes.json();

      if (iuranRes.ok) {
        setTagihanList(iuranData.tagihanList || []);
        if (iuranData.bankSettings) {
          setBankSettings(iuranData.bankSettings);
          setBankForm(iuranData.bankSettings);
          setBulkNominal(String(iuranData.bankSettings.defaultNominal || 350000));
        }
      }

      if (santriRes.ok) {
        const list: SantriOption[] = (santriData.santriList || []).map(
          (s: any) => ({
            id: s.id,
            name: s.name,
            nis: s.nis || "",
            gender: s.jenisKelamin || "",
          })
        );
        setSantriOptions(list);
      }
    } catch (error) {
      console.error("Error fetching iuran data:", error);
      toast.error("Gagal memuat data iuran");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === "admin" || session?.user?.role === "petugas") {
      fetchData();
    }
  }, [session, fetchData]);

  // Filtered List
  const filteredTagihan = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tagihanList.filter((item) => {
      // Search
      const matchesSearch =
        !q ||
        item.santriName.toLowerCase().includes(q) ||
        (item.santriNis && item.santriNis.toLowerCase().includes(q)) ||
        (item.parentName && item.parentName.toLowerCase().includes(q)) ||
        item.bulan.toLowerCase().includes(q);

      // Gender
      const matchesGender =
        genderFilter === "semua" || item.santriGender === genderFilter;

      // Status
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      // Bulan
      const matchesBulan =
        bulanFilter === "all" ||
        item.bulan.toLowerCase() === bulanFilter.toLowerCase();

      // Tahun
      const matchesTahun =
        tahunFilter === "all" || String(item.tahun) === String(tahunFilter);

      return (
        matchesSearch &&
        matchesGender &&
        matchesStatus &&
        matchesBulan &&
        matchesTahun
      );
    });
  }, [
    tagihanList,
    searchQuery,
    genderFilter,
    statusFilter,
    bulanFilter,
    tahunFilter,
  ]);

  // Stats Calculations
  const stats = useMemo(() => {
    let totalNominal = 0;
    let totalNominalLunas = 0;
    let countBelumBayar = 0;
    let countMenunggu = 0;
    let countLunas = 0;
    let countDitolak = 0;

    filteredTagihan.forEach((item) => {
      totalNominal += item.nominal;
      if (item.status === "lunas") {
        totalNominalLunas += item.nominal;
        countLunas++;
      } else if (item.status === "menunggu_verifikasi") {
        countMenunggu++;
      } else if (item.status === "belum_bayar") {
        countBelumBayar++;
      } else if (item.status === "ditolak") {
        countDitolak++;
      }
    });

    return {
      totalCount: filteredTagihan.length,
      totalNominal,
      totalNominalLunas,
      countBelumBayar,
      countMenunggu,
      countLunas,
      countDitolak,
    };
  }, [filteredTagihan]);

  // Handle Verify (Approve / Reject)
  const handleVerify = async (newStatus: "lunas" | "ditolak") => {
    if (!selectedForVerification) return;

    setIsVerifying(true);
    try {
      const res = await fetch("/api/iuran", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedForVerification.id,
          action: "verifikasi",
          status: newStatus,
          catatanPetugas,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Status berhasil diperbarui");
        setSelectedForVerification(null);
        setCatatanPetugas("");
        fetchData();
      } else {
        toast.error(data.error || "Gagal memverifikasi pembayaran");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses verifikasi");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Save Bank Settings
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);
    try {
      const res = await fetch("/api/iuran/bank-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Pengaturan rekening berhasil disimpan");
        setBankSettings(data.bankSettings);
        setIsBankModalOpen(false);
      } else {
        toast.error(data.error || "Gagal menyimpan pengaturan rekening");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSavingBank(false);
    }
  };

  // Handle Bulk Generate
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch("/api/iuran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_generate",
          bulan: bulkBulan,
          tahun: parseInt(bulkTahun),
          nominal: parseInt(bulkNominal.replace(/\D/g, "") || "350000"),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setIsBulkModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "Gagal membuat tagihan masal");
      }
    } catch {
      toast.error("Terjadi kesalahan saat generate tagihan");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Single Form Submit (Create / Edit)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.santriId && !editingId) {
      toast.error("Pilih santri terlebih dahulu");
      return;
    }

    setIsSavingForm(true);
    try {
      const nominalNum = parseInt(formData.nominal.replace(/\D/g, "") || "0");
      if (nominalNum <= 0) {
        toast.error("Nominal tidak valid");
        return;
      }

      let res;
      if (editingId) {
        // Edit
        res = await fetch("/api/iuran", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            bulan: formData.bulan,
            tahun: parseInt(formData.tahun),
            nominal: nominalNum,
            keterangan: formData.keterangan,
            status: formData.status,
          }),
        });
      } else {
        // Create
        res = await fetch("/api/iuran", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            santriId: formData.santriId,
            bulan: formData.bulan,
            tahun: parseInt(formData.tahun),
            nominal: nominalNum,
            keterangan: formData.keterangan,
          }),
        });
      }

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Berhasil menyimpan tagihan");
        setIsFormModalOpen(false);
        setEditingId(null);
        fetchData();
      } else {
        toast.error(data.error || "Gagal menyimpan tagihan");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan tagihan");
    } finally {
      setIsSavingForm(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/iuran?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Tagihan berhasil dihapus");
        setDeleteTarget(null);
        fetchData();
      } else {
        toast.error(data.error || "Gagal menghapus tagihan");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus tagihan");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case "lunas":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Lunas
          </Badge>
        );
      case "menunggu_verifikasi":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 gap-1 animate-pulse">
            <Clock className="h-3 w-3" />
            Menunggu Verifikasi
          </Badge>
        );
      case "ditolak":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100 gap-1">
            <XCircle className="h-3 w-3" />
            Ditolak
          </Badge>
        );
      case "belum_bayar":
      default:
        return (
          <Badge variant="outline" className="text-gray-600 bg-gray-50 gap-1">
            <AlertCircle className="h-3 w-3" />
            Belum Bayar
          </Badge>
        );
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground text-sm">
            Memuat data iuran SPP...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary" />
            Iuran & SPP Santri
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola tagihan SPP bulanan santri, verifikasi bukti transfer, dan
            pengaturan rekening bank.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bank Settings button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBankForm(bankSettings);
              setIsBankModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Landmark className="h-4 w-4 text-primary" />
            Rekening Bank
          </Button>

          {/* Bulk generate button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBulkNominal(String(bankSettings.defaultNominal || 350000));
              setIsBulkModalOpen(true);
            }}
            className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
          >
            <Sparkles className="h-4 w-4" />
            Generate Masal
          </Button>

          {/* Create single button */}
          <Button
            size="sm"
            onClick={() => {
              setEditingId(null);
              setFormData({
                santriId: "",
                bulan: BULAN_OPTIONS[new Date().getMonth()],
                tahun: new Date().getFullYear().toString(),
                nominal: String(bankSettings.defaultNominal || 350000),
                keterangan: "",
                status: "belum_bayar",
              });
              setIsFormModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Buat Tagihan
          </Button>
        </div>
      </div>

      {/* ========== Bank Info Card (Mini Banner) ========== */}
      <Card className="bg-gradient-to-r from-emerald-500/10 via-primary/5 to-blue-500/10 border-primary/20">
        <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {bankSettings.bankName} — {bankSettings.accountNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                a.n. {bankSettings.accountHolder} • SPP Standar:{" "}
                <span className="font-medium text-foreground">
                  {formatRupiah(bankSettings.defaultNominal)}
                </span>
                /bulan
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBankForm(bankSettings);
              setIsBankModalOpen(true);
            }}
            className="text-xs self-end sm:self-center"
          >
            Ubah Rekening
          </Button>
        </CardContent>
      </Card>

      {/* ========== Stats Cards ========== */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Tagihan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tagihan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nominal: {formatRupiah(stats.totalNominal)}
            </p>
          </CardContent>
        </Card>

        {/* Belum Bayar */}
        <Card className="border-l-4 border-l-amber-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum Bayar</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.countBelumBayar}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Menunggu pembayaran orang tua
            </p>
          </CardContent>
        </Card>

        {/* Menunggu Verifikasi */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Perlu Verifikasi
            </CardTitle>
            <FileCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.countMenunggu}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bukti transfer sudah diunggah
            </p>
          </CardContent>
        </Card>

        {/* Lunas */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sudah Lunas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.countLunas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Terkumpul: {formatRupiah(stats.totalNominalLunas)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========== Filters Toolbar ========== */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari santri, NIS, atau wali..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Gender Filter */}
            <div>
              <Select
                value={genderFilter}
                onValueChange={(v) => setGenderFilter(v as "semua" | "L" | "P")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Gender</SelectItem>
                  <SelectItem value="L">
                    <span className="flex items-center gap-1.5">
                      <span className="text-blue-500 font-bold text-xs">♂</span>
                      Laki-laki
                    </span>
                  </SelectItem>
                  <SelectItem value="P">
                    <span className="flex items-center gap-1.5">
                      <span className="text-pink-500 font-bold text-xs">♀</span>
                      Perempuan
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="menunggu_verifikasi">
                    Menunggu Verifikasi
                  </SelectItem>
                  <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                  <SelectItem value="lunas">Lunas</SelectItem>
                  <SelectItem value="ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulan & Tahun Filter */}
            <div className="flex gap-2">
              <Select value={bulanFilter} onValueChange={setBulanFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  {BULAN_OPTIONS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tahunFilter} onValueChange={setTahunFilter}>
                <SelectTrigger className="w-[90px]">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== Table / List Card ========== */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Tagihan SPP</CardTitle>
              <CardDescription>
                {filteredTagihan.length} data tagihan ditemukan
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Santri</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Bukti</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTagihan.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      Belum ada data tagihan yang sesuai filter
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTagihan.map((item) => (
                    <TableRow key={item.id}>
                      {/* Santri info */}
                      <TableCell>
                        <div className="font-medium flex items-center gap-1.5">
                          {item.santriName}
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1 py-0 ${
                              item.santriGender === "L"
                                ? "border-blue-200 text-blue-700 bg-blue-50"
                                : "border-pink-200 text-pink-700 bg-pink-50"
                            }`}
                          >
                            {item.santriGender === "L" ? "♂ L" : "♀ P"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          NIS: {item.santriNis || "-"}
                          {item.parentName && ` • Wali: ${item.parentName}`}
                        </p>
                      </TableCell>

                      {/* Periode */}
                      <TableCell>
                        <p className="font-medium text-sm">
                          {item.bulan} {item.tahun}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt).split(",")[0]}
                        </p>
                      </TableCell>

                      {/* Nominal */}
                      <TableCell className="text-right font-semibold">
                        {formatRupiah(item.nominal)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {getStatusBadge(item.status)}
                      </TableCell>

                      {/* Bukti */}
                      <TableCell className="text-center">
                        {item.buktiPembayaran ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1 text-xs text-primary"
                            onClick={() =>
                              setPreviewImage(item.buktiPembayaran || null)
                            }
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Lihat
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Verification action if pending */}
                          {item.status === "menunggu_verifikasi" && (
                            <Button
                              size="sm"
                              className="h-8 gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              onClick={() => {
                                setSelectedForVerification(item);
                                setCatatanPetugas(item.catatanPetugas || "");
                              }}
                            >
                              <FileCheck className="h-3.5 w-3.5" />
                              Verifikasi
                            </Button>
                          )}

                          {item.status !== "menunggu_verifikasi" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() => {
                                setSelectedForVerification(item);
                                setCatatanPetugas(item.catatanPetugas || "");
                              }}
                              title="Detail / Ubah Status"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Edit button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingId(item.id);
                              setFormData({
                                santriId: item.santriId,
                                bulan: item.bulan,
                                tahun: String(item.tahun),
                                nominal: String(item.nominal),
                                keterangan: item.keterangan || "",
                                status: item.status,
                              });
                              setIsFormModalOpen(true);
                            }}
                            title="Edit Tagihan"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          {/* Delete button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(item)}
                            title="Hapus Tagihan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ========== Verification Modal ========== */}
      <Dialog
        open={!!selectedForVerification}
        onOpenChange={(open) => !open && setSelectedForVerification(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Verifikasi Pembayaran SPP
            </DialogTitle>
            <DialogDescription>
              Periksa kesesuaian bukti transfer dengan mutasi rekening bank
              pesantren.
            </DialogDescription>
          </DialogHeader>

          {selectedForVerification && (
            <div className="space-y-5 pt-2">
              {/* Santri & Bill summary */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Santri</p>
                  <p className="font-semibold">
                    {selectedForVerification.santriName} (
                    {selectedForVerification.santriGender === "L"
                      ? "Laki-laki"
                      : "Perempuan"}
                    )
                  </p>
                  <p className="text-xs text-muted-foreground">
                    NIS: {selectedForVerification.santriNis || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Periode</p>
                  <p className="font-semibold">
                    {selectedForVerification.bulan}{" "}
                    {selectedForVerification.tahun}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tagihan: {formatRupiah(selectedForVerification.nominal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Wali Santri</p>
                  <p className="font-medium">
                    {selectedForVerification.parentName || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedForVerification.parentPhone || ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Waktu Pembayaran
                  </p>
                  <p className="font-medium">
                    {formatDate(selectedForVerification.tanggalBayar)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: {getStatusBadge(selectedForVerification.status)}
                  </p>
                </div>
              </div>

              {/* Note from parent */}
              {selectedForVerification.catatanOrangTua && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                  <p className="text-xs font-semibold text-blue-800 mb-0.5">
                    Catatan dari Orang Tua / Pengirim:
                  </p>
                  <p className="text-blue-900">
                    &ldquo;{selectedForVerification.catatanOrangTua}&rdquo;
                  </p>
                </div>
              )}

              {/* Proof of Transfer Image */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Bukti Transfer / Pembayaran:
                </Label>
                {selectedForVerification.buktiPembayaran ? (
                  <div className="border rounded-xl p-2 bg-muted/20 flex flex-col items-center gap-2">
                    <img
                      src={selectedForVerification.buktiPembayaran}
                      alt="Bukti Transfer"
                      className="max-h-72 w-auto object-contain rounded-lg shadow-sm cursor-pointer hover:opacity-95"
                      onClick={() =>
                        setPreviewImage(
                          selectedForVerification.buktiPembayaran || null
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary gap-1"
                      onClick={() =>
                        setPreviewImage(
                          selectedForVerification.buktiPembayaran || null
                        )
                      }
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Buka Gambar Penuh
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                    Belum ada bukti pembayaran yang diunggah
                  </div>
                )}
              </div>

              {/* Petugas verification notes */}
              <div className="space-y-2">
                <Label htmlFor="catatan-petugas">
                  Catatan Petugas (Opsional / Alasan jika ditolak)
                </Label>
                <Textarea
                  id="catatan-petugas"
                  placeholder="Contoh: Dana sudah masuk di rekening BSI / Nominal tidak sesuai..."
                  value={catatanPetugas}
                  onChange={(e) => setCatatanPetugas(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Action buttons */}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedForVerification(null)}
                  disabled={isVerifying}
                >
                  Tutup
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleVerify("ditolak")}
                    disabled={isVerifying}
                    className="gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    Tolak Pembayaran
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleVerify("lunas")}
                    disabled={isVerifying}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isVerifying ? "Memproses..." : "Setujui (Lunas)"}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== Bank Settings Modal ========== */}
      <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              Pengaturan Rekening Bank Pesantren
            </DialogTitle>
            <DialogDescription>
              Rekening ini akan ditampilkan kepada orang tua saat melakukan
              pembayaran SPP.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBank} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nama Bank</Label>
              <Input
                id="bankName"
                placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                value={bankForm.bankName}
                onChange={(e) =>
                  setBankForm({ ...bankForm, bankName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Nomor Rekening</Label>
              <Input
                id="accountNumber"
                placeholder="Contoh: 7123456789"
                value={bankForm.accountNumber}
                onChange={(e) =>
                  setBankForm({ ...bankForm, accountNumber: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolder">Atas Nama (Pemilik Rekening)</Label>
              <Input
                id="accountHolder"
                placeholder="Contoh: Pondok Pesantren Baiturrahman"
                value={bankForm.accountHolder}
                onChange={(e) =>
                  setBankForm({ ...bankForm, accountHolder: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultNominal">Nominal SPP Standar (Rp)</Label>
              <Input
                id="defaultNominal"
                placeholder="Contoh: 350000"
                value={formatNumberInput(String(bankForm.defaultNominal || ""))}
                onChange={(e) =>
                  setBankForm({
                    ...bankForm,
                    defaultNominal: parseInt(
                      e.target.value.replace(/\D/g, "") || "0"
                    ),
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Petunjuk / Keterangan Pembayaran</Label>
              <Textarea
                id="keterangan"
                placeholder="Contoh: Pembayaran paling lambat tanggal 10 setiap bulan..."
                value={bankForm.keterangan || ""}
                onChange={(e) =>
                  setBankForm({ ...bankForm, keterangan: e.target.value })
                }
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBankModalOpen(false)}
                disabled={isSavingBank}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSavingBank}>
                {isSavingBank ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========== Bulk Generate Modal ========== */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Tagihan SPP Masal
            </DialogTitle>
            <DialogDescription>
              Otomatis buat tagihan SPP untuk seluruh santri aktif pada bulan &
              tahun yang dipilih.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBulkGenerate} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="bulkBulan">Bulan</Label>
                <Select value={bulkBulan} onValueChange={setBulkBulan}>
                  <SelectTrigger id="bulkBulan">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {BULAN_OPTIONS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulkTahun">Tahun</Label>
                <Select value={bulkTahun} onValueChange={setBulkTahun}>
                  <SelectTrigger id="bulkTahun">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulkNominal">Nominal per Santri (Rp)</Label>
              <Input
                id="bulkNominal"
                value={formatNumberInput(bulkNominal)}
                onChange={(e) => setBulkNominal(e.target.value)}
                placeholder="Contoh: 350.000"
                required
              />
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border text-xs text-muted-foreground">
              Tagihan yang sudah dibuat sebelumnya untuk santri pada bulan &
              tahun tersebut tidak akan diduplikasi.
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkModalOpen(false)}
                disabled={isGenerating}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? "Memproses..." : "Generate Tagihan Sekarang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========== Create/Edit Single Form Modal ========== */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Tagihan SPP" : "Buat Tagihan SPP Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Perbarui detail tagihan santri."
                : "Pilih santri dan masukkan nominal tagihan bulanan."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4 pt-2">
            {!editingId && (
              <div className="space-y-2">
                <Label htmlFor="santriSelect">Pilih Santri</Label>
                <Select
                  value={formData.santriId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, santriId: v })
                  }
                >
                  <SelectTrigger id="santriSelect">
                    <SelectValue placeholder="Pilih Santri..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {santriOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.gender === "L" ? "♂ L" : "♀ P"}) — NIS:{" "}
                        {s.nis || "-"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="formBulan">Bulan</Label>
                <Select
                  value={formData.bulan}
                  onValueChange={(v) => setFormData({ ...formData, bulan: v })}
                >
                  <SelectTrigger id="formBulan">
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {BULAN_OPTIONS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formTahun">Tahun</Label>
                <Select
                  value={formData.tahun}
                  onValueChange={(v) => setFormData({ ...formData, tahun: v })}
                >
                  <SelectTrigger id="formTahun">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formNominal">Nominal (Rp)</Label>
              <Input
                id="formNominal"
                value={formatNumberInput(formData.nominal)}
                onChange={(e) =>
                  setFormData({ ...formData, nominal: e.target.value })
                }
                placeholder="350.000"
                required
              />
            </div>

            {editingId && (
              <div className="space-y-2">
                <Label htmlFor="formStatus">Status Pembayaran</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger id="formStatus">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                    <SelectItem value="menunggu_verifikasi">
                      Menunggu Verifikasi
                    </SelectItem>
                    <SelectItem value="lunas">Lunas</SelectItem>
                    <SelectItem value="ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="formKeterangan">Keterangan (Opsional)</Label>
              <Textarea
                id="formKeterangan"
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
                placeholder="Catatan tambahan..."
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormModalOpen(false)}
                disabled={isSavingForm}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSavingForm}>
                {isSavingForm ? "Menyimpan..." : "Simpan Tagihan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========== Delete Alert Dialog ========== */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tagihan SPP?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus tagihan SPP {deleteTarget?.bulan}{" "}
              {deleteTarget?.tahun} untuk santri{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.santriName}
              </span>{" "}
              sebesar {formatRupiah(deleteTarget?.nominal || 0)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== Full Image Preview Modal ========== */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-3xl p-4">
          <DialogHeader>
            <DialogTitle>Bukti Pembayaran</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex items-center justify-center p-2 bg-black/5 rounded-lg max-h-[80vh] overflow-auto">
              <img
                src={previewImage}
                alt="Bukti Transfer Penuh"
                className="max-h-[75vh] w-auto object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
