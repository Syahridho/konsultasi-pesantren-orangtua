"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Droplets,
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
  Truck,
  CheckCheck,
  Calendar,
  Waves,
  ShieldAlert,
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
interface TagihanLaundry {
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
  paketLaundry?: string;
  kuotaKg?: number;
  status: "belum_bayar" | "menunggu_verifikasi" | "lunas" | "ditolak";
  statusLayanan: "aktif" | "nonaktif" | "ditangguhkan";
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

interface LaundrySettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  defaultNominal: number;
  defaultPaket: string;
  kuotaKg: number;
  keterangan?: string;
}

interface SantriOption {
  id: string;
  name: string;
  nis: string;
  gender: string;
  parentId?: string;
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

const TAHUN_OPTIONS = [2024, 2025, 2026, 2027, 2028];

export default function PetugasLaundryPage() {
  const { data: session, status: authStatus } = useSession();

  // ─── States ──────────────────────────────────────────────────
  const [tagihanList, setTagihanList] = useState<TagihanLaundry[]>([]);
  const [settings, setSettings] = useState<LaundrySettings>({
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7123456789",
    accountHolder: "Pondok Pesantren Baiturrahman",
    defaultNominal: 100000,
    defaultPaket: "Paket Cuci & Setrika Reguler (Max 20 Kg/Bulan)",
    kuotaKg: 20,
  });
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedRekening, setCopiedRekening] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [bulanFilter, setBulanFilter] = useState("all");
  const [tahunFilter, setTahunFilter] = useState(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusLayananFilter, setStatusLayananFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState<"semua" | "L" | "P">("semua");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [layananModalOpen, setLayananModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected item
  const [selectedTagihan, setSelectedTagihan] = useState<TagihanLaundry | null>(null);

  // Form states for add
  const [selectedSantriId, setSelectedSantriId] = useState("");
  const [formBulan, setFormBulan] = useState(BULAN_OPTIONS[new Date().getMonth()]);
  const [formTahun, setFormTahun] = useState(new Date().getFullYear().toString());
  const [formNominal, setFormNominal] = useState(100000);
  const [formPaket, setFormPaket] = useState("Paket Cuci & Setrika Reguler (Max 20 Kg/Bulan)");
  const [formKuotaKg, setFormKuotaKg] = useState(20);
  const [formKeterangan, setFormKeterangan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification form
  const [verifStatus, setVerifStatus] = useState<"lunas" | "ditolak">("lunas");
  const [verifCatatan, setVerifCatatan] = useState("");

  // Layanan form
  const [formStatusLayanan, setFormStatusLayanan] = useState<TagihanLaundry["statusLayanan"]>("aktif");

  // Edit form
  const [editNominal, setEditNominal] = useState(0);
  const [editBulan, setEditBulan] = useState("");
  const [editTahun, setEditTahun] = useState(2026);
  const [editPaket, setEditPaket] = useState("");
  const [editKuotaKg, setEditKuotaKg] = useState(20);
  const [editStatus, setEditStatus] = useState<TagihanLaundry["status"]>("belum_bayar");
  const [editStatusLayanan, setEditStatusLayanan] = useState<TagihanLaundry["statusLayanan"]>("aktif");
  const [editKeterangan, setEditKeterangan] = useState("");

  // Settings form
  const [tempBankName, setTempBankName] = useState("");
  const [tempAccountNumber, setTempAccountNumber] = useState("");
  const [tempAccountHolder, setTempAccountHolder] = useState("");
  const [tempDefaultNominal, setTempDefaultNominal] = useState(100000);
  const [tempDefaultPaket, setTempDefaultPaket] = useState("");
  const [tempKuotaKg, setTempKuotaKg] = useState(20);
  const [tempKeterangan, setTempKeterangan] = useState("");

  // ─── Fetch Data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/laundry");
      if (res.status === 200) {
        setTagihanList(res.data.tagihanList || []);
        if (res.data.settings) {
          setSettings(res.data.settings);
          setFormNominal(res.data.settings.defaultNominal || 100000);
          setFormPaket(res.data.settings.defaultPaket || "Paket Cuci & Setrika Reguler (Max 20 Kg/Bulan)");
          setFormKuotaKg(res.data.settings.kuotaKg || 20);
        }
      }
    } catch (err) {
      console.error("Error fetching laundry:", err);
      toast.error("Gagal memuat data tagihan laundry");
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

  // ─── Filtered Data ───────────────────────────────────────────
  const filteredList = useMemo(() => {
    return tagihanList.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.santriName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.santriNis && item.santriNis.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.parentName && item.parentName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchBulan = bulanFilter === "all" || item.bulan === bulanFilter;
      const matchTahun = tahunFilter === "all" || String(item.tahun) === tahunFilter;
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchLayanan = statusLayananFilter === "all" || item.statusLayanan === statusLayananFilter;
      const matchGender = genderFilter === "semua" || item.santriGender === genderFilter;

      return matchSearch && matchBulan && matchTahun && matchStatus && matchLayanan && matchGender;
    });
  }, [tagihanList, searchQuery, bulanFilter, tahunFilter, statusFilter, statusLayananFilter, genderFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = tagihanList.length;
    const lunasList = tagihanList.filter((t) => t.status === "lunas");
    const lunas = lunasList.length;
    const menunggu = tagihanList.filter((t) => t.status === "menunggu_verifikasi").length;
    const aktifLayanan = tagihanList.filter((t) => t.statusLayanan === "aktif").length;
    const totalUangTerkumpul = lunasList.reduce((acc, t) => acc + (t.nominal || 0), 0);

    return { total, lunas, menunggu, aktifLayanan, totalUangTerkumpul };
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
      const res = await api.post("/api/laundry", {
        santriId: selectedSantriId,
        bulan: formBulan,
        tahun: formTahun,
        nominal: formNominal,
        paketLaundry: formPaket,
        kuotaKg: formKuotaKg,
        keterangan: formKeterangan,
      });

      if (res.status === 200) {
        toast.success("Tagihan laundry bulanan berhasil dibuat");
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
      const res = await api.post("/api/laundry", {
        action: "bulk_generate",
        bulan: formBulan,
        tahun: formTahun,
        nominal: formNominal,
        paketLaundry: formPaket,
        kuotaKg: formKuotaKg,
      });

      if (res.status === 200) {
        toast.success(res.data.message || "Berhasil generate tagihan laundry massal");
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
      const res = await api.put("/api/laundry", {
        id: selectedTagihan.id,
        action: "verifikasi",
        status: verifStatus,
        catatanPetugas: verifCatatan,
      });

      if (res.status === 200) {
        toast.success(res.data.message || "Status verifikasi diperbarui");
        setVerifyModalOpen(false);
        setSelectedTagihan(null);
        fetchData();
      } else {
        toast.error(res.data.error || "Gagal verifikasi");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLayanan = async () => {
    if (!selectedTagihan) return;
    try {
      setIsSubmitting(true);
      const res = await api.put("/api/laundry", {
        id: selectedTagihan.id,
        action: "update_status_layanan",
        statusLayanan: formStatusLayanan,
      });

      if (res.status === 200) {
        toast.success("Status layanan laundry berhasil diperbarui");
        setLayananModalOpen(false);
        setSelectedTagihan(null);
        fetchData();
      } else {
        toast.error(res.data.error || "Gagal update status layanan");
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
      const res = await api.put("/api/laundry", {
        id: selectedTagihan.id,
        nominal: editNominal,
        bulan: editBulan,
        tahun: editTahun,
        paketLaundry: editPaket,
        kuotaKg: editKuotaKg,
        status: editStatus,
        statusLayanan: editStatusLayanan,
        keterangan: editKeterangan,
      });

      if (res.status === 200) {
        toast.success("Data tagihan laundry berhasil diperbarui");
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
      const res = await api.delete(`/api/laundry?id=${selectedTagihan.id}`);
      if (res.status === 200) {
        toast.success("Tagihan laundry berhasil dihapus");
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
      const res = await api.put("/api/laundry/settings", {
        bankName: tempBankName,
        accountNumber: tempAccountNumber,
        accountHolder: tempAccountHolder,
        defaultNominal: tempDefaultNominal,
        defaultPaket: tempDefaultPaket,
        kuotaKg: tempKuotaKg,
        keterangan: tempKeterangan,
      });

      if (res.status === 200) {
        toast.success("Pengaturan laundry bulanan berhasil disimpan");
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

  const openVerifyModal = (tagihan: TagihanLaundry) => {
    setSelectedTagihan(tagihan);
    setVerifStatus("lunas");
    setVerifCatatan(tagihan.catatanPetugas || "");
    setVerifyModalOpen(true);
  };

  const openLayananModal = (tagihan: TagihanLaundry) => {
    setSelectedTagihan(tagihan);
    setFormStatusLayanan(tagihan.statusLayanan || "aktif");
    setLayananModalOpen(true);
  };

  const openEditModal = (tagihan: TagihanLaundry) => {
    setSelectedTagihan(tagihan);
    setEditNominal(tagihan.nominal);
    setEditBulan(tagihan.bulan);
    setEditTahun(tagihan.tahun);
    setEditPaket(tagihan.paketLaundry || settings.defaultPaket);
    setEditKuotaKg(tagihan.kuotaKg || 20);
    setEditStatus(tagihan.status);
    setEditStatusLayanan(tagihan.statusLayanan || "aktif");
    setEditKeterangan(tagihan.keterangan || "");
    setEditModalOpen(true);
  };

  const openSettingsModal = () => {
    setTempBankName(settings.bankName);
    setTempAccountNumber(settings.accountNumber);
    setTempAccountHolder(settings.accountHolder);
    setTempDefaultNominal(settings.defaultNominal);
    setTempDefaultPaket(settings.defaultPaket || "Paket Cuci & Setrika Reguler (Max 20 Kg/Bulan)");
    setTempKuotaKg(settings.kuotaKg || 20);
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
            <Droplets className="h-7 w-7 text-cyan-600" />
            Manajemen Laundry Santri (Bulanan)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola tagihan rutin laundry santri per bulan, paket kuota cuci setrika, dan status layanan aktif
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={openSettingsModal}>
            <Settings className="w-4 h-4 mr-2" />
            Pengaturan Tarif & Rekening
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
            Generate Massal Bulanan
          </Button>

          <Button
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
            onClick={() => {
              setSelectedSantriId("");
              setFormNominal(settings.defaultNominal);
              setAddModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Tagihan Laundry
          </Button>
        </div>
      </div>

      {/* Info Rekening Card */}
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-600 text-white rounded-xl shadow-sm">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-cyan-800 uppercase tracking-wider">
                Rekening Pembayaran Iuran Laundry Bulanan
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-gray-900 text-base">
                  {settings.bankName} - {settings.accountNumber}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-cyan-700 hover:bg-cyan-100"
                  onClick={() => copyToClipboard(settings.accountNumber)}
                >
                  {copiedRekening ? (
                    <Check className="h-3.5 w-3.5 text-cyan-600" />
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
              <span className="text-gray-500">Tarif Default: </span>
              <span className="font-bold text-cyan-800">
                {formatRupiah(settings.defaultNominal)} / bulan
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
              Total Tagihan Laundry
            </CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total} Tagihan</div>
            <p className="text-xs text-muted-foreground mt-1">
              Santri terdaftar laundry
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
              {stats.lunas} tagihan telah dibayar
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
              Perlu dicek bukti transfernya
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-cyan-700">
              Status Layanan Aktif
            </CardTitle>
            <Waves className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {stats.aktifLayanan} Santri
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Layanan laundry berjalan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Droplets className="h-5 w-5 text-cyan-600" />
              Daftar Tagihan Laundry Bulanan ({filteredList.length})
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 mt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari santri, NIS, wali..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>

            <Select value={bulanFilter} onValueChange={setBulanFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {TAHUN_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t.toString()}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Bayar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status Bayar</SelectItem>
                <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                <SelectItem value="menunggu_verifikasi">Menunggu Verifikasi</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusLayananFilter} onValueChange={setStatusLayananFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Layanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Layanan</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
                <SelectItem value="ditangguhkan">Ditangguhkan</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={genderFilter}
              onValueChange={(val: any) => setGenderFilter(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Gender</SelectItem>
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
              <p className="text-sm text-muted-foreground">Memuat data tagihan laundry...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center">
              <Droplets className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-base font-medium text-gray-700">Tidak ada tagihan laundry</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || bulanFilter !== "all"
                  ? "Coba sesuaikan filter atau kata kunci pencarian."
                  : "Belum ada tagihan laundry. Klik 'Tambah Tagihan' atau 'Generate Massal Bulanan'."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Santri & Gender</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Paket & Kuota</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Status Pembayaran</TableHead>
                    <TableHead>Status Layanan</TableHead>
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
                        <Badge variant="outline" className="font-semibold bg-gray-50">
                          {tagihan.bulan} {tagihan.tahun}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-medium text-gray-800 line-clamp-1">
                          {tagihan.paketLaundry || "Cuci & Setrika"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Kuota: {tagihan.kuotaKg || 20} Kg/Bulan
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-bold text-gray-900">
                          {formatRupiah(tagihan.nominal)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">/ 1 Bulan</div>
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

                      <TableCell>
                        {tagihan.statusLayanan === "aktif" ? (
                          <Badge className="bg-cyan-100 text-cyan-800 border-cyan-300">
                            <CheckCheck className="w-3 h-3 mr-1" /> Aktif
                          </Badge>
                        ) : tagihan.statusLayanan === "ditangguhkan" ? (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                            <ShieldAlert className="w-3 h-3 mr-1" /> Ditangguhkan
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 bg-gray-50">
                            Nonaktif
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Update status layanan */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-cyan-700 border-cyan-200 hover:bg-cyan-50 h-8 px-2 text-xs"
                            onClick={() => openLayananModal(tagihan)}
                            title="Update Status Layanan Laundry"
                          >
                            Layanan
                          </Button>

                          {/* Verifikasi button if waiting */}
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
                            title="Lihat Detail & Kuitansi"
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

      {/* ─── Modal 1: Tambah Tagihan Laundry ──────────────────────── */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Tagihan Laundry Bulanan</DialogTitle>
            <DialogDescription>
              Buat tagihan iuran laundry santri untuk 1 bulan tertentu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSingleCreate} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Pilih Santri *</Label>
              <Select value={selectedSantriId} onValueChange={setSelectedSantriId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih santri..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {santriList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} (NIS: {s.nis || "-"} • {s.gender === "L" ? "L" : "P"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bulan Tagihan *</Label>
                <Select value={formBulan} onValueChange={setFormBulan}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Tahun *</Label>
                <Select value={formTahun} onValueChange={setFormTahun}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAHUN_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t.toString()}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nominal Iuran (Rp) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="10000"
                  value={formNominal}
                  onChange={(e) => setFormNominal(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Kuota Cuci (Kg/Bulan)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formKuotaKg}
                  onChange={(e) => setFormKuotaKg(parseInt(e.target.value) || 20)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Paket Laundry</Label>
              <Input
                value={formPaket}
                onChange={(e) => setFormPaket(e.target.value)}
                placeholder="Contoh: Paket Cuci & Setrika Reguler"
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan Tambahan (Opsional)</Label>
              <Input
                placeholder="Catatan..."
                value={formKeterangan}
                onChange={(e) => setFormKeterangan(e.target.value)}
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
              <Button type="submit" disabled={isSubmitting || !selectedSantriId} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                {isSubmitting ? "Menyimpan..." : "Buat Tagihan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 2: Bulk Generate Bulanan ─────────────────────────── */}
      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Generate Massal Tagihan Laundry Bulanan
            </DialogTitle>
            <DialogDescription>
              Buat tagihan laundry 1 bulan secara massal untuk seluruh santri aktif. Santri yang sudah memiliki tagihan pada bulan & tahun ini otomatis dilewati.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bulan</Label>
                <Select value={formBulan} onValueChange={setFormBulan}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Tahun</Label>
                <Select value={formTahun} onValueChange={setFormTahun}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAHUN_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t.toString()}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nominal Iuran Laundry (Rp)</Label>
              <Input
                type="number"
                value={formNominal}
                onChange={(e) => setFormNominal(parseInt(e.target.value) || 0)}
              />
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
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isSubmitting ? "Memproses..." : "Generate Tagihan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 3: Update Status Layanan Laundry ────────────────── */}
      <Dialog open={layananModalOpen} onOpenChange={setLayananModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-cyan-600" />
              Update Status Layanan Laundry
            </DialogTitle>
            <DialogDescription>
              Atur keaktifan fasilitas laundry bagi santri bersangkutan.
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
                  <span className="text-gray-500">Periode:</span>
                  <span className="font-bold text-cyan-700">{selectedTagihan.bulan} {selectedTagihan.tahun}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status Bayar:</span>
                  <span className="font-semibold capitalize text-emerald-700">
                    {selectedTagihan.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status Layanan Laundry *</Label>
                <Select
                  value={formStatusLayanan}
                  onValueChange={(val: any) => setFormStatusLayanan(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">✅ Aktif (Layanan Berjalan)</SelectItem>
                    <SelectItem value="ditangguhkan">⚠️ Ditangguhkan (Belum Lunas)</SelectItem>
                    <SelectItem value="nonaktif">❌ Nonaktif (Santri Berhenti/Izin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLayananModalOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateLayanan} disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {isSubmitting ? "Menyimpan..." : "Simpan Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 4: Verifikasi Pembayaran Laundry ────────────────── */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Verifikasi Pembayaran Laundry</DialogTitle>
            <DialogDescription>
              Periksa bukti transfer dan tentukan status tagihan laundry santri.
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
                  <span className="text-gray-500">Periode Tagihan:</span>
                  <span className="font-bold text-cyan-700">
                    {selectedTagihan.bulan} {selectedTagihan.tahun}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nominal:</span>
                  <span className="font-bold text-emerald-700">
                    {formatRupiah(selectedTagihan.nominal)}
                  </span>
                </div>
                {selectedTagihan.tanggalBayar && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal Bayar:</span>
                    <span>{new Date(selectedTagihan.tanggalBayar).toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>

              {selectedTagihan.buktiPembayaran ? (
                <div className="space-y-2">
                  <Label>Foto Bukti Pembayaran</Label>
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
                  placeholder="Misal: Pembayaran iuran laundry telah diterima"
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
            <Button onClick={handleVerify} disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              {isSubmitting ? "Menyimpan..." : "Simpan Keputusan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 5: Detail & Kuitansi Pembayaran Laundry ─────────── */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Kuitansi Iuran Laundry Santri
            </DialogTitle>
          </DialogHeader>

          {selectedTagihan && (
            <div className="space-y-4 py-2">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 bg-gradient-to-b from-white to-gray-50 space-y-4">
                <div className="text-center pb-3 border-b">
                  <h3 className="font-bold text-base text-gray-900">
                    PONDOK PESANTREN BAITURRAHMAN
                  </h3>
                  <p className="text-xs text-gray-500">
                    Kuitansi Pembayaran Iuran Layanan Laundry Santri
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    No. Ref: LND-{selectedTagihan.id.slice(-8).toUpperCase()}
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
                    <span className="text-gray-500 block">Periode Tagihan</span>
                    <span className="font-bold text-cyan-800 text-sm">
                      {selectedTagihan.bulan} {selectedTagihan.tahun}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Paket Laundry</span>
                    <span className="font-medium text-gray-800">
                      {selectedTagihan.paketLaundry || "Cuci & Setrika Reguler"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Wali Santri</span>
                    <span className="font-medium text-gray-800">
                      {selectedTagihan.parentName || "-"}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3 flex justify-between font-bold text-sm text-gray-900">
                  <span>Total Biaya Laundry</span>
                  <span className="text-emerald-700">
                    {formatRupiah(selectedTagihan.nominal)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                  <div>
                    <span className="text-gray-500 block">Status Pembayaran:</span>
                    <span className="font-semibold capitalize text-emerald-700">
                      {selectedTagihan.status.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Status Layanan:</span>
                    <span className="font-semibold capitalize text-cyan-700">
                      {selectedTagihan.statusLayanan}
                    </span>
                  </div>
                </div>
              </div>
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
              <Printer className="h-4 w-4" /> Cetak Kuitansi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 6: Edit Tagihan Laundry ─────────────────────────── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Tagihan Laundry</DialogTitle>
            <DialogDescription>
              Ubah data periode, nominal, status pembayaran, atau status layanan.
            </DialogDescription>
          </DialogHeader>

          {selectedTagihan && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="text-sm font-semibold bg-gray-50 p-2.5 rounded border">
                Santri: {selectedTagihan.santriName}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bulan</Label>
                  <Select value={editBulan} onValueChange={setEditBulan}>
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label>Tahun</Label>
                  <Select
                    value={editTahun.toString()}
                    onValueChange={(val) => setEditTahun(parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAHUN_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t.toString()}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nominal (Rp)</Label>
                  <Input
                    type="number"
                    value={editNominal}
                    onChange={(e) => setEditNominal(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kuota Cuci (Kg)</Label>
                  <Input
                    type="number"
                    value={editKuotaKg}
                    onChange={(e) => setEditKuotaKg(parseInt(e.target.value) || 20)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status Bayar</Label>
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
                  <Label>Status Layanan</Label>
                  <Select
                    value={editStatusLayanan}
                    onValueChange={(val: any) => setEditStatusLayanan(val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="ditangguhkan">Ditangguhkan</SelectItem>
                      <SelectItem value="nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
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
                <Button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Modal 7: Pengaturan Rekening & Biaya Laundry ──────────── */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pengaturan Iuran Laundry & Rekening</DialogTitle>
            <DialogDescription>
              Atur nomor rekening tujuan dan nominal default iuran laundry santri per 1 bulan.
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarif Default per Bulan (Rp) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="10000"
                  value={tempDefaultNominal}
                  onChange={(e) => setTempDefaultNominal(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Kuota Cuci Default (Kg)</Label>
                <Input
                  type="number"
                  min="1"
                  value={tempKuotaKg}
                  onChange={(e) => setTempKuotaKg(parseInt(e.target.value) || 20)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Paket Default</Label>
              <Input
                value={tempDefaultPaket}
                onChange={(e) => setTempDefaultPaket(e.target.value)}
                placeholder="Contoh: Paket Cuci & Setrika Reguler"
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan / Instruksi Layanan</Label>
              <Textarea
                placeholder="Instruksi batas pengumpulan baju kotor dan jadwal pengambilan..."
                value={tempKeterangan}
                onChange={(e) => setTempKeterangan(e.target.value)}
                rows={2}
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
              <Button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── AlertDialog: Hapus Tagihan Laundry ────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tagihan Laundry?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus tagihan laundry bulan{" "}
              <strong>
                {selectedTagihan?.bulan} {selectedTagihan?.tahun}
              </strong>{" "}
              untuk santri <strong className="text-gray-900">{selectedTagihan?.santriName}</strong>?
              Data yang dihapus tidak dapat dikembalikan.
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
