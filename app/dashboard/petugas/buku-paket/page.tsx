"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  BookOpen,
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
  GraduationCap,
  Layers,
  BookMarked,
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
interface BukuPerTingkat {
  tingkat: string;
  nominal: number;
  buku: string[];
}

interface TagihanBukuPaket {
  id: string;
  santriId: string;
  santriName: string;
  santriGender: string;
  santriNis?: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  tingkatKelas: string;
  tahunAjaran: string;
  semester: string;
  nominal: number;
  daftarBuku?: string[];
  status: "belum_bayar" | "menunggu_verifikasi" | "lunas" | "ditolak";
  statusPengambilan: "belum_diambil" | "sudah_diambil" | "sebagian";
  tanggalPengambilan?: string;
  penerimaBuku?: string;
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

interface BukuPaketSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  defaultNominal: number;
  defaultTahunAjaran: string;
  daftarBukuPerTingkat?: BukuPerTingkat[];
  keterangan?: string;
}

interface SantriOption {
  id: string;
  name: string;
  nis: string;
  gender: string;
  parentId?: string;
}

const TINGKAT_KELAS_OPTIONS = [
  "Kelas 7 / 1 MTs",
  "Kelas 8 / 2 MTs",
  "Kelas 9 / 3 MTs",
  "Kelas 10 / 1 MA",
  "Kelas 11 / 2 MA",
  "Kelas 12 / 3 MA",
  "Tingkat Ula",
  "Tingkat Wustho",
  "Tingkat Ulya",
];

const TAHUN_AJARAN_OPTIONS = ["2026/2027", "2025/2026", "2024/2025"];

export default function PetugasBukuPaketPage() {
  const { data: session, status: authStatus } = useSession();

  // ─── States ──────────────────────────────────────────────────
  const [tagihanList, setTagihanList] = useState<TagihanBukuPaket[]>([]);
  const [settings, setSettings] = useState<BukuPaketSettings>({
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7123456789",
    accountHolder: "Pondok Pesantren Baiturrahman",
    defaultNominal: 450000,
    defaultTahunAjaran: "2026/2027",
  });
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedRekening, setCopiedRekening] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tingkatFilter, setTingkatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pengambilanFilter, setPengambilanFilter] = useState("all");
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState<"semua" | "L" | "P">("semua");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [pengambilanModalOpen, setPengambilanModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected item
  const [selectedTagihan, setSelectedTagihan] = useState<TagihanBukuPaket | null>(null);

  // Form states for add
  const [selectedSantriId, setSelectedSantriId] = useState("");
  const [formTingkatKelas, setFormTingkatKelas] = useState("Kelas 7 / 1 MTs");
  const [formTahunAjaran, setFormTahunAjaran] = useState("2026/2027");
  const [formSemester, setFormSemester] = useState("Tahunan");
  const [formNominal, setFormNominal] = useState(450000);
  const [formDaftarBukuText, setFormDaftarBukuText] = useState("");
  const [formKeterangan, setFormKeterangan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification form
  const [verifStatus, setVerifStatus] = useState<"lunas" | "ditolak">("lunas");
  const [verifCatatan, setVerifCatatan] = useState("");

  // Pengambilan form
  const [pengambilanStatus, setPengambilanStatus] = useState<TagihanBukuPaket["statusPengambilan"]>("sudah_diambil");
  const [pengambilanTanggal, setPengambilanTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [pengambilanPenerima, setPengambilanPenerima] = useState("");

  // Edit form
  const [editNominal, setEditNominal] = useState(0);
  const [editTingkatKelas, setEditTingkatKelas] = useState("");
  const [editTahunAjaran, setEditTahunAjaran] = useState("");
  const [editSemester, setEditSemester] = useState("Tahunan");
  const [editDaftarBukuText, setEditDaftarBukuText] = useState("");
  const [editStatus, setEditStatus] = useState<TagihanBukuPaket["status"]>("belum_bayar");
  const [editStatusPengambilan, setEditStatusPengambilan] = useState<TagihanBukuPaket["statusPengambilan"]>("belum_diambil");
  const [editKeterangan, setEditKeterangan] = useState("");

  // Settings form
  const [tempBankName, setTempBankName] = useState("");
  const [tempAccountNumber, setTempAccountNumber] = useState("");
  const [tempAccountHolder, setTempAccountHolder] = useState("");
  const [tempDefaultNominal, setTempDefaultNominal] = useState(450000);
  const [tempTahunAjaran, setTempTahunAjaran] = useState("2026/2027");
  const [tempKeterangan, setTempKeterangan] = useState("");

  // ─── Fetch Data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/buku-paket");
      if (res.status === 200) {
        setTagihanList(res.data.tagihanList || []);
        if (res.data.settings) {
          setSettings(res.data.settings);
          setFormNominal(res.data.settings.defaultNominal || 450000);
          setFormTahunAjaran(res.data.settings.defaultTahunAjaran || "2026/2027");
        }
      }
    } catch (err) {
      console.error("Error fetching buku paket:", err);
      toast.error("Gagal memuat data tagihan buku paket/kitab kuning");
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

  // When tingkat class changes in add modal, auto-update books list & nominal
  const handleTingkatClassChange = (tingkat: string) => {
    setFormTingkatKelas(tingkat);
    if (settings.daftarBukuPerTingkat) {
      const matched = settings.daftarBukuPerTingkat.find((d) => d.tingkat === tingkat);
      if (matched) {
        setFormNominal(matched.nominal);
        setFormDaftarBukuText(matched.buku.join("\n"));
      }
    }
  };

  // ─── Filtered Data ───────────────────────────────────────────
  const filteredList = useMemo(() => {
    return tagihanList.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.santriName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.santriNis && item.santriNis.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.parentName && item.parentName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTingkat = tingkatFilter === "all" || item.tingkatKelas === tingkatFilter;
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchPengambilan =
        pengambilanFilter === "all" || item.statusPengambilan === pengambilanFilter;
      const matchTahun =
        tahunAjaranFilter === "all" || item.tahunAjaran === tahunAjaranFilter;
      const matchGender = genderFilter === "semua" || item.santriGender === genderFilter;

      return (
        matchSearch &&
        matchTingkat &&
        matchStatus &&
        matchPengambilan &&
        matchTahun &&
        matchGender
      );
    });
  }, [
    tagihanList,
    searchQuery,
    tingkatFilter,
    statusFilter,
    pengambilanFilter,
    tahunAjaranFilter,
    genderFilter,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const total = tagihanList.length;
    const lunasList = tagihanList.filter((t) => t.status === "lunas");
    const lunas = lunasList.length;
    const menunggu = tagihanList.filter((t) => t.status === "menunggu_verifikasi").length;
    const sudahDiambil = tagihanList.filter((t) => t.statusPengambilan === "sudah_diambil").length;
    const belumDiambil = tagihanList.filter((t) => t.statusPengambilan === "belum_diambil").length;
    const totalUangTerkumpul = lunasList.reduce((acc, t) => acc + (t.nominal || 0), 0);

    return { total, lunas, menunggu, sudahDiambil, belumDiambil, totalUangTerkumpul };
  }, [tagihanList]);

  // ─── Handlers ────────────────────────────────────────────────
  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriId) {
      toast.error("Pilih santri terlebih dahulu");
      return;
    }

    const daftarBuku = formDaftarBukuText
      ? formDaftarBukuText.split("\n").map((b) => b.trim()).filter(Boolean)
      : undefined;

    try {
      setIsSubmitting(true);
      const res = await api.post("/api/buku-paket", {
        santriId: selectedSantriId,
        tingkatKelas: formTingkatKelas,
        tahunAjaran: formTahunAjaran,
        semester: formSemester,
        nominal: formNominal,
        daftarBuku,
        keterangan: formKeterangan,
      });

      if (res.status === 200) {
        toast.success("Tagihan buku paket/kitab kuning berhasil dibuat");
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
      const res = await api.post("/api/buku-paket", {
        action: "bulk_generate",
        tingkatKelas: formTingkatKelas,
        tahunAjaran: formTahunAjaran,
        semester: formSemester,
        nominal: formNominal,
      });

      if (res.status === 200) {
        toast.success(res.data.message || "Berhasil membuat tagihan kenaikan kelas massal");
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
      const res = await api.put("/api/buku-paket", {
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

  const handleUpdatePengambilan = async () => {
    if (!selectedTagihan) return;
    try {
      setIsSubmitting(true);
      const res = await api.put("/api/buku-paket", {
        id: selectedTagihan.id,
        action: "update_pengambilan",
        statusPengambilan: pengambilanStatus,
        tanggalPengambilan: pengambilanTanggal,
        penerimaBuku: pengambilanPenerima,
      });

      if (res.status === 200) {
        toast.success("Status serah terima buku paket/kitab kuning berhasil diperbarui");
        setPengambilanModalOpen(false);
        setSelectedTagihan(null);
        fetchData();
      } else {
        toast.error(res.data.error || "Gagal update status");
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

    const daftarBuku = editDaftarBukuText
      ? editDaftarBukuText.split("\n").map((b) => b.trim()).filter(Boolean)
      : undefined;

    try {
      setIsSubmitting(true);
      const res = await api.put("/api/buku-paket", {
        id: selectedTagihan.id,
        nominal: editNominal,
        tingkatKelas: editTingkatKelas,
        tahunAjaran: editTahunAjaran,
        semester: editSemester,
        daftarBuku,
        status: editStatus,
        statusPengambilan: editStatusPengambilan,
        keterangan: editKeterangan,
      });

      if (res.status === 200) {
        toast.success("Data tagihan buku paket/kitab kuning berhasil diperbarui");
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
      const res = await api.delete(`/api/buku-paket?id=${selectedTagihan.id}`);
      if (res.status === 200) {
        toast.success("Tagihan buku paket/kitab kuning berhasil dihapus");
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
      const res = await api.put("/api/buku-paket/settings", {
        bankName: tempBankName,
        accountNumber: tempAccountNumber,
        accountHolder: tempAccountHolder,
        defaultNominal: tempDefaultNominal,
        defaultTahunAjaran: tempTahunAjaran,
        keterangan: tempKeterangan,
      });

      if (res.status === 200) {
        toast.success("Pengaturan buku paket/kitab kuning berhasil disimpan");
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

  const openVerifyModal = (tagihan: TagihanBukuPaket) => {
    setSelectedTagihan(tagihan);
    setVerifStatus("lunas");
    setVerifCatatan(tagihan.catatanPetugas || "");
    setVerifyModalOpen(true);
  };

  const openPengambilanModal = (tagihan: TagihanBukuPaket) => {
    setSelectedTagihan(tagihan);
    setPengambilanStatus(tagihan.statusPengambilan || "sudah_diambil");
    setPengambilanTanggal(
      tagihan.tanggalPengambilan
        ? tagihan.tanggalPengambilan.split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setPengambilanPenerima(tagihan.penerimaBuku || tagihan.santriName);
    setPengambilanModalOpen(true);
  };

  const openEditModal = (tagihan: TagihanBukuPaket) => {
    setSelectedTagihan(tagihan);
    setEditNominal(tagihan.nominal);
    setEditTingkatKelas(tagihan.tingkatKelas);
    setEditTahunAjaran(tagihan.tahunAjaran);
    setEditSemester(tagihan.semester || "Tahunan");
    setEditDaftarBukuText((tagihan.daftarBuku || []).join("\n"));
    setEditStatus(tagihan.status);
    setEditStatusPengambilan(tagihan.statusPengambilan || "belum_diambil");
    setEditKeterangan(tagihan.keterangan || "");
    setEditModalOpen(true);
  };

  const openSettingsModal = () => {
    setTempBankName(settings.bankName);
    setTempAccountNumber(settings.accountNumber);
    setTempAccountHolder(settings.accountHolder);
    setTempDefaultNominal(settings.defaultNominal);
    setTempTahunAjaran(settings.defaultTahunAjaran || "2026/2027");
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
            <BookOpen className="h-7 w-7 text-primary" />
            Buku Paket / Kitab Kuning
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola tagihan buku pelajaran & kitab kuning santri setiap kenaikan kelas / tahun ajaran baru
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={openSettingsModal}>
            <Settings className="w-4 h-4 mr-2" />
            Pengaturan Bank & Kitab
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
            Generate Kenaikan Kelas
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSelectedSantriId("");
              handleTingkatClassChange("Kelas 7 / 1 MTs");
              setAddModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Tagihan Buku & Kitab
          </Button>
        </div>
      </div>

      {/* Info Rekening Card */}
      <Card className="bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600 text-white rounded-xl shadow-sm">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                Rekening Pembayaran Buku Paket & Kitab Kuning
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-gray-900 text-base">
                  {settings.bankName} - {settings.accountNumber}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-teal-700 hover:bg-teal-100"
                  onClick={() => copyToClipboard(settings.accountNumber)}
                >
                  {copiedRekening ? (
                    <Check className="h-3.5 w-3.5 text-teal-600" />
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
              <span className="text-gray-500">Tahun Ajaran Aktif: </span>
              <span className="font-bold text-teal-800">
                {settings.defaultTahunAjaran || "2026/2027"}
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
              Total Tagihan Buku
            </CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total} Santri</div>
            <p className="text-xs text-muted-foreground mt-1">
              Santri terdaftar paket buku
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
              Perlu dicek bukti transfernya
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">
              Penyerahan Buku
            </CardTitle>
            <Truck className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {stats.sudahDiambil} Diserahkan
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.belumDiambil} santri belum menerima buku
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Daftar Tagihan Buku Paket / Kitab Kuning ({filteredList.length})
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari santri, NIS, wali..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>

            <Select value={tingkatFilter} onValueChange={setTingkatFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tingkat Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tingkat Kelas</SelectItem>
                {TINGKAT_KELAS_OPTIONS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
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

            <Select value={pengambilanFilter} onValueChange={setPengambilanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Serah Terima" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status Serah</SelectItem>
                <SelectItem value="belum_diambil">Belum Diterima</SelectItem>
                <SelectItem value="sudah_diambil">Sudah Diserahkan</SelectItem>
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
              <p className="text-sm text-muted-foreground">Memuat data buku paket/kitab kuning...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-base font-medium text-gray-700">Tidak ada tagihan buku paket / kitab kuning</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Coba sesuaikan filter atau kata kunci pencarian."
                  : "Belum ada tagihan buku paket / kitab kuning. Klik 'Tambah Tagihan' atau 'Generate Kenaikan Kelas'."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Santri & Gender</TableHead>
                    <TableHead>Tingkat Kelas</TableHead>
                    <TableHead>Tahun Ajaran</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Status Pembayaran</TableHead>
                    <TableHead>Serah Terima Buku</TableHead>
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
                        <Badge variant="outline" className="font-medium bg-gray-50">
                          {tagihan.tingkatKelas}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold text-gray-800">
                          {tagihan.tahunAjaran}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {tagihan.semester || "Tahunan"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-bold text-gray-900">
                          {formatRupiah(tagihan.nominal)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {tagihan.daftarBuku ? `${tagihan.daftarBuku.length} Kitab/Buku` : "-"}
                        </div>
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
                        {tagihan.statusPengambilan === "sudah_diambil" ? (
                          <Badge className="bg-teal-100 text-teal-800 border-teal-300">
                            <CheckCheck className="w-3 h-3 mr-1" /> Sudah Diserahkan
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 bg-gray-50">
                            Belum Diterima
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Serah terima buku */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-teal-700 border-teal-200 hover:bg-teal-50 h-8 px-2.5 text-xs gap-1"
                            onClick={() => openPengambilanModal(tagihan)}
                            title="Update Status Serah Terima Buku"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Serahkan
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
                            title="Lihat Detail & Tanda Terima"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Edit */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(tagihan)}
                            title="Edit Tagihan Buku"
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

      {/* ─── Modal 1: Tambah Tagihan Buku Paket / Kitab Kuning ──── */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Tagihan Buku Paket / Kitab Kuning</DialogTitle>
            <DialogDescription>
              Buat tagihan paket buku pelajaran & kitab kuning untuk santri kenaikan kelas.
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
                <Label>Tingkat Kelas *</Label>
                <Select
                  value={formTingkatKelas}
                  onValueChange={handleTingkatClassChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TINGKAT_KELAS_OPTIONS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tahun Ajaran *</Label>
                <Input
                  value={formTahunAjaran}
                  onChange={(e) => setFormTahunAjaran(e.target.value)}
                  placeholder="2026/2027"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={formSemester} onValueChange={setFormSemester}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tahunan">1 Tahun (Tahunan)</SelectItem>
                    <SelectItem value="Ganjil">Semester Ganjil</SelectItem>
                    <SelectItem value="Genap">Semester Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nominal Paket (Rp) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="25000"
                  value={formNominal}
                  onChange={(e) => setFormNominal(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Daftar Judul Buku / Kitab (Pisahkan dengan baris baru)</Label>
              <Textarea
                placeholder="Kitab Fiqih Fathul Qorib&#10;Kitab Nahwu Jurumiyah&#10;Buku Bahasa Arab"
                value={formDaftarBukuText}
                onChange={(e) => setFormDaftarBukuText(e.target.value)}
                rows={4}
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
              <Button type="submit" disabled={isSubmitting || !selectedSantriId}>
                {isSubmitting ? "Menyimpan..." : "Buat Tagihan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 2: Bulk Generate Kenaikan Kelas ─────────────────── */}
      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Generate Massal Tagihan Kenaikan Kelas
            </DialogTitle>
            <DialogDescription>
              Buat tagihan buku paket & kitab kuning untuk seluruh santri aktif pada tahun ajaran baru.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tingkat Kelas</Label>
                <Select
                  value={formTingkatKelas}
                  onValueChange={handleTingkatClassChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TINGKAT_KELAS_OPTIONS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tahun Ajaran</Label>
                <Input
                  value={formTahunAjaran}
                  onChange={(e) => setFormTahunAjaran(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nominal Tagihan (Rp)</Label>
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? "Memproses..." : "Generate Tagihan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 3: Update Status Serah Terima Buku ──────────────── */}
      <Dialog open={pengambilanModalOpen} onOpenChange={setPengambilanModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-teal-600" />
              Serah Terima Buku Paket / Kitab Kuning
            </DialogTitle>
            <DialogDescription>
              Catat penyerahan fisik paket buku pelajaran & kitab kuning kepada santri atau wali santri.
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
                  <span className="text-gray-500">Tingkat Kelas:</span>
                  <span className="font-bold text-teal-700">{selectedTagihan.tingkatKelas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status Pembayaran:</span>
                  <span className="font-semibold capitalize text-emerald-700">
                    {selectedTagihan.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status Serah Terima *</Label>
                <Select
                  value={pengambilanStatus}
                  onValueChange={(val: any) => setPengambilanStatus(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belum_diambil">Belum Diterima</SelectItem>
                    <SelectItem value="sudah_diambil">Sudah Diserahkan (Lengkap)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pengambilanStatus === "sudah_diambil" && (
                <>
                  <div className="space-y-2">
                    <Label>Tanggal Penyerahan</Label>
                    <Input
                      type="date"
                      value={pengambilanTanggal}
                      onChange={(e) => setPengambilanTanggal(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nama Penerima (Santri / Wali)</Label>
                    <Input
                      placeholder="Misal: Ananda santri atau nama wali..."
                      value={pengambilanPenerima}
                      onChange={(e) => setPengambilanPenerima(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPengambilanModalOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleUpdatePengambilan} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 4: Verifikasi Pembayaran Buku Paket ─────────────── */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Verifikasi Pembayaran Buku Paket / Kitab Kuning</DialogTitle>
            <DialogDescription>
              Periksa bukti transfer dan tentukan status tagihan buku & kitab santri.
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
                  placeholder="Misal: Pembayaran telah diterima"
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

      {/* ─── Modal 5: Detail & Tanda Terima Buku Paket ──────────────── */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detail & Bukti Tanda Terima Buku Paket / Kitab Kuning
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
                    Kuitansi & Surat Tanda Terima Buku Paket / Kitab Kuning Santri
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    No. Ref: BUKU-{selectedTagihan.id.slice(-8).toUpperCase()}
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
                    <span className="text-gray-500 block">Tingkat Kelas</span>
                    <span className="font-bold text-teal-800 text-sm">
                      {selectedTagihan.tingkatKelas}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Tahun Ajaran & Semester</span>
                    <span className="font-medium text-gray-800">
                      {selectedTagihan.tahunAjaran} ({selectedTagihan.semester || "Tahunan"})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Wali Santri</span>
                    <span className="font-medium text-gray-800">
                      {selectedTagihan.parentName || "-"}
                    </span>
                  </div>
                </div>

                {/* Daftar Buku */}
                <div className="border rounded-lg p-3 bg-white space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Daftar Kitab Kuning & Buku Pelajaran:</p>
                  <div className="space-y-1 text-xs">
                    {(selectedTagihan.daftarBuku || []).map((buku, idx) => (
                      <div key={idx} className="flex justify-between text-gray-600">
                        <span>{idx + 1}. {buku}</span>
                        <span className="text-emerald-700 font-medium">1 Jilid</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-sm text-gray-900">
                    <span>Total Biaya Paket Buku & Kitab</span>
                    <span className="text-emerald-700">
                      {formatRupiah(selectedTagihan.nominal)}
                    </span>
                  </div>
                </div>

                {/* Status Pengambilan & Penyerahan */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                  <div>
                    <span className="text-gray-500 block">Status Pembayaran:</span>
                    <span className="font-semibold capitalize text-emerald-700">
                      {selectedTagihan.status.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Status Serah Terima:</span>
                    <span className="font-semibold capitalize text-teal-700">
                      {selectedTagihan.statusPengambilan.replace("_", " ")}
                    </span>
                  </div>
                  {selectedTagihan.penerimaBuku && (
                    <div className="col-span-2 text-xs text-gray-600">
                      Diserahkan kepada: <span className="font-semibold">{selectedTagihan.penerimaBuku}</span> pada {selectedTagihan.tanggalPengambilan ? new Date(selectedTagihan.tanggalPengambilan).toLocaleDateString("id-ID") : "-"}
                    </div>
                  )}
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
              <Printer className="h-4 w-4" /> Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 6: Edit Tagihan Buku ────────────────────────────── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tagihan Buku Paket / Kitab Kuning</DialogTitle>
            <DialogDescription>
              Ubah data tingkat kelas, nominal, status bayar, atau daftar kitab & buku.
            </DialogDescription>
          </DialogHeader>

          {selectedTagihan && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="text-sm font-semibold bg-gray-50 p-2.5 rounded border">
                Santri: {selectedTagihan.santriName}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tingkat Kelas</Label>
                  <Select value={editTingkatKelas} onValueChange={setEditTingkatKelas}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TINGKAT_KELAS_OPTIONS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tahun Ajaran</Label>
                  <Input
                    value={editTahunAjaran}
                    onChange={(e) => setEditTahunAjaran(e.target.value)}
                  />
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
                  <Label>Semester</Label>
                  <Select value={editSemester} onValueChange={setEditSemester}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tahunan">Tahunan</SelectItem>
                      <SelectItem value="Ganjil">Semester Ganjil</SelectItem>
                      <SelectItem value="Genap">Semester Genap</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label>Status Serah Terima</Label>
                  <Select
                    value={editStatusPengambilan}
                    onValueChange={(val: any) => setEditStatusPengambilan(val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="belum_diambil">Belum Diambil</SelectItem>
                      <SelectItem value="sudah_diambil">Sudah Diserahkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Daftar Judul Buku (1 baris per buku)</Label>
                <Textarea
                  value={editDaftarBukuText}
                  onChange={(e) => setEditDaftarBukuText(e.target.value)}
                  rows={3}
                />
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Modal 7: Pengaturan Rekening & Biaya Buku Paket ───────── */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pengaturan Rekening & Buku Paket / Kitab Kuning</DialogTitle>
            <DialogDescription>
              Atur nomor rekening tujuan dan nominal default untuk paket buku pelajaran & kitab kuning santri.
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
                <Label>Nominal Default (Rp) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="25000"
                  value={tempDefaultNominal}
                  onChange={(e) => setTempDefaultNominal(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tahun Ajaran Aktif</Label>
                <Input
                  value={tempTahunAjaran}
                  onChange={(e) => setTempTahunAjaran(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan / Instruksi</Label>
              <Textarea
                placeholder="Instruksi pengambilan kitab atau jadwal kenaikan kelas..."
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── AlertDialog: Hapus Tagihan Buku ──────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tagihan Buku Paket / Kitab Kuning?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus tagihan buku paket / kitab kuning untuk santri{" "}
              <strong className="text-gray-900">{selectedTagihan?.santriName}</strong>?
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
