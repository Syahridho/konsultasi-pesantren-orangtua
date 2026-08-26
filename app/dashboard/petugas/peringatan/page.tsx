"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  AlertCircle,
  Search,
  Plus,
  Filter,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  Send,
  Printer,
  FileWarning,
  MessageCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Sparkles,
  FileText,
  AlertTriangle,
  Flame,
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
import { Checkbox } from "@/components/ui/checkbox";
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
interface Peringatan {
  id: string;
  santriId: string;
  santriName: string;
  santriGender: string;
  santriNis?: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  judul: string;
  tingkatPeringatan: "pemberitahuan" | "sp1" | "sp2" | "sp3";
  jenisTagihan: "uang_masuk" | "iuran_spp" | "seragam" | "buku_paket" | "laundry" | "umum" | "lainnya";
  nominalTunggakan: number;
  pesan: string;
  batasWaktu?: string;
  status: "aktif" | "selesai" | "dibatalkan";
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
}

interface SantriOption {
  id: string;
  name: string;
  nis: string;
  gender: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
}

export default function PetugasPeringatanPage() {
  const { data: session, status: authStatus } = useSession();

  // ─── States ──────────────────────────────────────────────────
  const [peringatanList, setPeringatanList] = useState<Peringatan[]>([]);
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tingkatFilter, setTingkatFilter] = useState("all");
  const [jenisFilter, setJenisFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected item
  const [selectedPeringatan, setSelectedPeringatan] = useState<Peringatan | null>(null);

  // Form states for create
  const [formSantriId, setFormSantriId] = useState("");
  const [formJudul, setFormJudul] = useState("");
  const [formTingkat, setFormTingkat] = useState<Peringatan["tingkatPeringatan"]>("pemberitahuan");
  const [formJenisTagihan, setFormJenisTagihan] = useState<Peringatan["jenisTagihan"]>("uang_masuk");
  const [formNominal, setFormNominal] = useState<number>(0);
  const [formPesan, setFormPesan] = useState("");
  const [formBatasWaktu, setFormBatasWaktu] = useState("");
  const [formKirimNotif, setFormKirimNotif] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for edit
  const [editJudul, setEditJudul] = useState("");
  const [editTingkat, setEditTingkat] = useState<Peringatan["tingkatPeringatan"]>("pemberitahuan");
  const [editJenisTagihan, setEditJenisTagihan] = useState<Peringatan["jenisTagihan"]>("uang_masuk");
  const [editNominal, setEditNominal] = useState<number>(0);
  const [editPesan, setEditPesan] = useState("");
  const [editBatasWaktu, setEditBatasWaktu] = useState("");
  const [editStatus, setEditStatus] = useState<Peringatan["status"]>("aktif");

  // ─── Fetch Data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/peringatan");
      if (res.status === 200) {
        setPeringatanList(res.data.peringatanList || []);
      }
    } catch (err) {
      console.error("Error fetching peringatan:", err);
      toast.error("Gagal memuat daftar peringatan");
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
            parentName: s.parentName || "",
            parentPhone: s.parentPhone || "",
          })
        );
        setSantriList(list);
      }
    } catch (err) {
      console.error("Error fetching santri:", err);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchData();
      fetchSantriList();
    }
  }, [authStatus, fetchData, fetchSantriList]);

  // ─── Helper: Generate Letter Template ────────────────────────
  const generateTemplateMessage = (
    santriName: string,
    tingkat: Peringatan["tingkatPeringatan"],
    jenis: Peringatan["jenisTagihan"],
    nominal: number,
    deadline: string
  ) => {
    const formattedNom = formatRupiah(nominal);
    const tagihanLabel =
      jenis === "uang_masuk"
        ? "Uang Masuk (1x Bayar Santri Baru)"
        : jenis === "seragam"
        ? "Paket Seragam & Perlengkapan Santri"
        : jenis === "buku_paket"
        ? "Buku Paket / Kitab Kuning Kenaikan Kelas"
        : jenis === "laundry"
        ? "Iuran Layanan Laundry Bulanan"
        : jenis === "iuran_spp"
        ? "Iuran SPP Bulanan"
        : "Kewajiban Administrasi Keuangan";

    const formattedDeadline = deadline
      ? new Date(deadline).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "segera";

    if (tingkat === "pemberitahuan") {
      return (
        `Assalamu'alaikum Wr. Wb.\n\n` +
        `Yth. Bapak/Ibu Wali Santri dari ananda *${santriName || "Santri"}*,\n\n` +
        `Kami dari Bagian Keuangan Pondok Pesantren Baiturrahman ingin menyampaikan pengingat mengenai tagihan ${tagihanLabel} sebesar *${formattedNom}* yang saat ini belum terselesaikan.\n\n` +
        `Mohon untuk dapat melakukan penyelesaian pembayaran paling lambat tanggal *${formattedDeadline}* melalui transfer rekening resmi pesantren atau langsung ke kantor bendahara.\n\n` +
        `Atas perhatian dan kerjasamanya kami ucapkan terima kasih.\nWassalamu'alaikum Wr. Wb.`
      );
    }

    if (tingkat === "sp1") {
      return (
        `SURAT PERINGATAN I (SP 1)\n` +
        `Nomor: SP1/KEU/PPB/${new Date().getFullYear()}\n\n` +
        `Assalamu'alaikum Wr. Wb.\n\n` +
        `Diberitahukan kepada Yth. Wali Santri dari ananda *${santriName || "Santri"}*,\n\n` +
        `Berdasarkan catatan administrasi keuangan kami, terdapat tunggakan ${tagihanLabel} sebesar *${formattedNom}* yang telah melewati batas waktu yang ditentukan.\n\n` +
        `Kami mohon kehadiran/konfirmasi Bapak/Ibu untuk melunasi kewajiban tersebut selambat-lambatnya pada tanggal *${formattedDeadline}*.\n\n` +
        `Demikian surat peringatan pertama ini kami sampaikan untuk menjadi perhatian.\nWassalamu'alaikum Wr. Wb.`
      );
    }

    if (tingkat === "sp2") {
      return (
        `SURAT PERINGATAN II (SP 2)\n` +
        `Nomor: SP2/KEU/PPB/${new Date().getFullYear()}\n\n` +
        `Assalamu'alaikum Wr. Wb.\n\n` +
        `Menindaklanjuti Surat Peringatan I sebelumnya, kami memberitahukan kepada Wali Santri dari ananda *${santriName || "Santri"}* bahwa kewajiban ${tagihanLabel} sebesar *${formattedNom}* sampai saat ini belum diselesaikan.\n\n` +
        `Bapak/Ibu diharapkan segera menyelesaikan pembayaran sebelum tanggal *${formattedDeadline}* atau menghadap ke bagian keuangan pesantren.\n\n` +
        `Keterlambatan lebih lanjut dapat mempengaruhi keikutsertaan ananda dalam kegiatan akademik.\nWassalamu'alaikum Wr. Wb.`
      );
    }

    // SP 3
    return (
      `SURAT PERINGATAN TERAKHIR (SP 3)\n` +
      `Nomor: SP3/KEU/PPB/${new Date().getFullYear()}\n\n` +
      `Assalamu'alaikum Wr. Wb.\n\n` +
      `Dengan ini kami sampaikan SURAT PERINGATAN TERAKHIR kepada Wali Santri dari ananda *${santriName || "Santri"}* atas tunggakan ${tagihanLabel} sebesar *${formattedNom}*.\n\n` +
      `Bapak/Ibu DIHARUSKAN hadir ke kantor pengurus pondok pesantren paling lambat tanggal *${formattedDeadline}* untuk menyelesaikan kewajiban tersebut.\n\n` +
      `Apabila tidak ada konfirmasi sampai batas waktu yang ditentukan, pengurus akan mengambil tindakan administratif sesuai peraturan pesantren.\nWassalamu'alaikum Wr. Wb.`
    );
  };

  // When santri / tingkat changes in create modal, auto-update template
  const handleSantriChange = (santriId: string) => {
    setFormSantriId(santriId);
    const target = santriList.find((s) => s.id === santriId);
    const santriName = target?.name || "";

    const defaultTitle =
      formTingkat === "pemberitahuan"
        ? `Pengingat Tagihan ${formJenisTagihan === "uang_masuk" ? "Uang Masuk" : "SPP"} - ${santriName}`
        : `${formTingkat.toUpperCase()} - Tunggakan ${formJenisTagihan === "uang_masuk" ? "Uang Masuk" : "SPP"} (${santriName})`;

    setFormJudul(defaultTitle);
    setFormPesan(
      generateTemplateMessage(
        santriName,
        formTingkat,
        formJenisTagihan,
        formNominal,
        formBatasWaktu
      )
    );
  };

  const handleTingkatChange = (tingkat: Peringatan["tingkatPeringatan"]) => {
    setFormTingkat(tingkat);
    const target = santriList.find((s) => s.id === formSantriId);
    const santriName = target?.name || "";

    const defaultTitle =
      tingkat === "pemberitahuan"
        ? `Pengingat Tagihan ${formJenisTagihan === "uang_masuk" ? "Uang Masuk" : "SPP"} - ${santriName}`
        : `${tingkat.toUpperCase()} - Tunggakan ${formJenisTagihan === "uang_masuk" ? "Uang Masuk" : "SPP"} (${santriName})`;

    setFormJudul(defaultTitle);
    setFormPesan(
      generateTemplateMessage(
        santriName,
        tingkat,
        formJenisTagihan,
        formNominal,
        formBatasWaktu
      )
    );
  };

  // ─── Filtered Data ───────────────────────────────────────────
  const filteredList = useMemo(() => {
    return peringatanList.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.santriName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.parentName && item.parentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.santriNis && item.santriNis.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTingkat = tingkatFilter === "all" || item.tingkatPeringatan === tingkatFilter;
      const matchJenis = jenisFilter === "all" || item.jenisTagihan === jenisFilter;
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      return matchSearch && matchTingkat && matchJenis && matchStatus;
    });
  }, [peringatanList, searchQuery, tingkatFilter, jenisFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = peringatanList.length;
    const pemberitahuan = peringatanList.filter((p) => p.tingkatPeringatan === "pemberitahuan").length;
    const sp1 = peringatanList.filter((p) => p.tingkatPeringatan === "sp1").length;
    const sp2sp3 = peringatanList.filter((p) => p.tingkatPeringatan === "sp2" || p.tingkatPeringatan === "sp3").length;
    const aktif = peringatanList.filter((p) => p.status === "aktif").length;

    return { total, pemberitahuan, sp1, sp2sp3, aktif };
  }, [peringatanList]);

  // ─── Handlers ────────────────────────────────────────────────
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSantriId || !formJudul || !formPesan) {
      toast.error("Semua field wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/api/peringatan", {
        santriId: formSantriId,
        judul: formJudul,
        tingkatPeringatan: formTingkat,
        jenisTagihan: formJenisTagihan,
        nominalTunggakan: formNominal,
        pesan: formPesan,
        batasWaktu: formBatasWaktu,
        kirimNotifikasi: formKirimNotif,
      });

      if (res.status === 200) {
        toast.success("Surat peringatan berhasil dibuat");
        setCreateModalOpen(false);
        // Reset
        setFormSantriId("");
        setFormJudul("");
        setFormNominal(0);
        setFormPesan("");
        setFormBatasWaktu("");
        fetchData();
      } else {
        toast.error(res.data.error || "Gagal membuat peringatan");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeringatan) return;

    try {
      setIsSubmitting(true);
      const res = await api.put("/api/peringatan", {
        id: selectedPeringatan.id,
        judul: editJudul,
        tingkatPeringatan: editTingkat,
        jenisTagihan: editJenisTagihan,
        nominalTunggakan: editNominal,
        pesan: editPesan,
        batasWaktu: editBatasWaktu,
        status: editStatus,
      });

      if (res.status === 200) {
        toast.success("Data peringatan berhasil diperbarui");
        setEditModalOpen(false);
        setSelectedPeringatan(null);
        fetchData();
      } else {
        toast.error(res.data.error || "Gagal memperbarui peringatan");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPeringatan) return;
    try {
      setIsSubmitting(true);
      const res = await api.delete(`/api/peringatan?id=${selectedPeringatan.id}`);
      if (res.status === 200) {
        toast.success("Surat peringatan berhasil dihapus");
        setDeleteDialogOpen(false);
        setSelectedPeringatan(null);
        fetchData();
      } else {
        toast.error(res.data.error || "Gagal menghapus peringatan");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: Peringatan, newStatus: Peringatan["status"]) => {
    try {
      const res = await api.put("/api/peringatan", {
        id: item.id,
        status: newStatus,
      });
      if (res.status === 200) {
        toast.success(`Status diubah menjadi ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error("Gagal mengubah status");
    }
  };

  const sendWhatsApp = (item: Peringatan) => {
    if (!item.parentPhone) {
      toast.error("Nomor WhatsApp orang tua tidak tersedia");
      return;
    }
    const cleanPhone = item.parentPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0")
      ? "62" + cleanPhone.slice(1)
      : cleanPhone;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(item.pesan)}`;
    window.open(url, "_blank");
  };

  const openEditModal = (item: Peringatan) => {
    setSelectedPeringatan(item);
    setEditJudul(item.judul);
    setEditTingkat(item.tingkatPeringatan);
    setEditJenisTagihan(item.jenisTagihan);
    setEditNominal(item.nominalTunggakan);
    setEditPesan(item.pesan);
    setEditBatasWaktu(item.batasWaktu || "");
    setEditStatus(item.status);
    setEditModalOpen(true);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getTingkatBadge = (tingkat: Peringatan["tingkatPeringatan"]) => {
    switch (tingkat) {
      case "pemberitahuan":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <MessageCircle className="w-3 h-3 mr-1" /> Pemberitahuan
          </Badge>
        );
      case "sp1":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold">
            <AlertTriangle className="w-3 h-3 mr-1" /> SP 1
          </Badge>
        );
      case "sp2":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-300 font-bold">
            <Flame className="w-3 h-3 mr-1" /> SP 2
          </Badge>
        );
      case "sp3":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse">
            <AlertCircle className="w-3 h-3 mr-1" /> SP 3 (Terakhir)
          </Badge>
        );
      default:
        return <Badge variant="outline">{tingkat}</Badge>;
    }
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <FileWarning className="h-7 w-7 text-primary" />
            Peringatan & Reminder Tagihan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola Surat Peringatan (SP 1, SP 2, SP 3), reminder tunggakan, dan kirim via WhatsApp
          </p>
        </div>

        <Button
          onClick={() => {
            setFormSantriId("");
            setFormJudul("");
            setFormNominal(0);
            setFormPesan("");
            setFormBatasWaktu("");
            setCreateModalOpen(true);
          }}
          className="gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Buat Surat Peringatan
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Peringatan
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total} Surat</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.aktif} peringatan berstatus aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Pemberitahuan / Pengingat
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pemberitahuan}</div>
            <p className="text-xs text-muted-foreground mt-1">Pengingat sopan tahap awal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">
              Surat Peringatan 1 (SP 1)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.sp1}</div>
            <p className="text-xs text-muted-foreground mt-1">Peringatan resmi tahap pertama</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-700">
              SP 2 & SP 3 (Lanjutan)
            </CardTitle>
            <Flame className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{stats.sp2sp3}</div>
            <p className="text-xs text-muted-foreground mt-1">Peringatan keras / batas akhir</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-primary" />
              Daftar Surat Peringatan ({filteredList.length})
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
                placeholder="Cari santri, wali, judul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>

            <Select value={tingkatFilter} onValueChange={setTingkatFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tingkat Peringatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tingkat</SelectItem>
                <SelectItem value="pemberitahuan">Pemberitahuan</SelectItem>
                <SelectItem value="sp1">Surat Peringatan 1 (SP1)</SelectItem>
                <SelectItem value="sp2">Surat Peringatan 2 (SP2)</SelectItem>
                <SelectItem value="sp3">Surat Peringatan 3 (SP3)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={jenisFilter} onValueChange={setJenisFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Jenis Tagihan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="uang_masuk">Uang Masuk (1x Bayar)</SelectItem>
                <SelectItem value="seragam">Paket Seragam</SelectItem>
                <SelectItem value="buku_paket">Buku Paket / Kitab Kuning</SelectItem>
                <SelectItem value="laundry">Iuran Laundry Bulanan</SelectItem>
                <SelectItem value="iuran_spp">Iuran SPP Bulanan</SelectItem>
                <SelectItem value="umum">Umum / Lainnya</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Peringatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="selesai">Selesai / Lunas</SelectItem>
                <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Memuat data surat peringatan...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center">
              <FileWarning className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-base font-medium text-gray-700">Tidak ada surat peringatan</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || tingkatFilter !== "all"
                  ? "Coba sesuaikan filter atau kata kunci pencarian."
                  : "Belum ada surat peringatan yang dibuat. Klik 'Buat Surat Peringatan'."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Santri & Wali</TableHead>
                    <TableHead>Tingkat & Judul</TableHead>
                    <TableHead>Jenis & Tunggakan</TableHead>
                    <TableHead>Batas Waktu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="font-semibold text-gray-900">{item.santriName}</div>
                        <div className="text-xs text-muted-foreground">
                          Wali: {item.parentName || "-"} ({item.parentPhone || "-"})
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="mb-1">{getTingkatBadge(item.tingkatPeringatan)}</div>
                        <div className="text-xs font-medium text-gray-800 line-clamp-1">
                          {item.judul}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-xs mb-0.5">
                          {item.jenisTagihan === "uang_masuk"
                            ? "Uang Masuk"
                            : item.jenisTagihan === "seragam"
                            ? "Seragam"
                            : item.jenisTagihan === "buku_paket"
                            ? "Buku Paket / Kitab Kuning"
                            : item.jenisTagihan === "laundry"
                            ? "Laundry"
                            : item.jenisTagihan === "iuran_spp"
                            ? "SPP Bulanan"
                            : "Lainnya"}
                        </Badge>
                        <div className="font-bold text-rose-600 text-sm">
                          {formatRupiah(item.nominalTunggakan)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-medium flex items-center gap-1 text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {item.batasWaktu
                            ? new Date(item.batasWaktu).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Dibuat: {new Date(item.createdAt).toLocaleDateString("id-ID")}
                        </div>
                      </TableCell>

                      <TableCell>
                        {item.status === "aktif" && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300">
                            Aktif
                          </Badge>
                        )}
                        {item.status === "selesai" && (
                          <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                            Selesai
                          </Badge>
                        )}
                        {item.status === "dibatalkan" && (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                            Dibatalkan
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send WhatsApp */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-8 px-2.5 text-xs gap-1"
                            onClick={() => sendWhatsApp(item)}
                            title="Kirim ke WhatsApp Wali Santri"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Kirim WA
                          </Button>

                          {/* Preview Letter */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedPeringatan(item);
                              setPreviewModalOpen(true);
                            }}
                            title="Preview & Cetak Surat Resmi"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Edit */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(item)}
                            title="Edit Peringatan"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              setSelectedPeringatan(item);
                              setDeleteDialogOpen(true);
                            }}
                            title="Hapus Peringatan"
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

      {/* ─── Modal 1: Buat Surat Peringatan ───────────────────────── */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-primary" />
              Buat Surat Peringatan / Reminder
            </DialogTitle>
            <DialogDescription>
              Terbitkan surat peringatan resmi dan siapkan pesan notifikasi/WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pilih Santri *</Label>
                <Select value={formSantriId} onValueChange={handleSantriChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih santri..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {santriList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} (NIS: {s.nis || "-"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tingkat Peringatan *</Label>
                <Select
                  value={formTingkat}
                  onValueChange={(val: any) => handleTingkatChange(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pemberitahuan">Pemberitahuan Awal</SelectItem>
                    <SelectItem value="sp1">Surat Peringatan 1 (SP1)</SelectItem>
                    <SelectItem value="sp2">Surat Peringatan 2 (SP2)</SelectItem>
                    <SelectItem value="sp3">Surat Peringatan 3 (SP3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Jenis Tagihan *</Label>
                <Select
                  value={formJenisTagihan}
                  onValueChange={(val: any) => {
                    setFormJenisTagihan(val);
                    const target = santriList.find((s) => s.id === formSantriId);
                    setFormPesan(
                      generateTemplateMessage(
                        target?.name || "",
                        formTingkat,
                        val,
                        formNominal,
                        formBatasWaktu
                      )
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uang_masuk">Uang Masuk (1x Bayar)</SelectItem>
                    <SelectItem value="seragam">Paket Seragam</SelectItem>
                    <SelectItem value="buku_paket">Buku Paket / Kitab Kuning</SelectItem>
                    <SelectItem value="laundry">Iuran Laundry Bulanan</SelectItem>
                    <SelectItem value="iuran_spp">Iuran SPP Bulanan</SelectItem>
                    <SelectItem value="umum">Umum / Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nominal Tunggakan (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  step="50000"
                  value={formNominal}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setFormNominal(val);
                    const target = santriList.find((s) => s.id === formSantriId);
                    setFormPesan(
                      generateTemplateMessage(
                        target?.name || "",
                        formTingkat,
                        formJenisTagihan,
                        val,
                        formBatasWaktu
                      )
                    );
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Batas Waktu (Deadline)</Label>
                <Input
                  type="date"
                  value={formBatasWaktu}
                  onChange={(e) => {
                    setFormBatasWaktu(e.target.value);
                    const target = santriList.find((s) => s.id === formSantriId);
                    setFormPesan(
                      generateTemplateMessage(
                        target?.name || "",
                        formTingkat,
                        formJenisTagihan,
                        formNominal,
                        e.target.value
                      )
                    );
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Judul Surat Peringatan *</Label>
              <Input
                value={formJudul}
                onChange={(e) => setFormJudul(e.target.value)}
                placeholder="Misal: SP1 - Tunggakan Uang Masuk Santri"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Isi Surat & Pesan WhatsApp *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-primary gap-1"
                  onClick={() => {
                    const target = santriList.find((s) => s.id === formSantriId);
                    setFormPesan(
                      generateTemplateMessage(
                        target?.name || "",
                        formTingkat,
                        formJenisTagihan,
                        formNominal,
                        formBatasWaktu
                      )
                    );
                  }}
                >
                  <Sparkles className="w-3 h-3" /> Reset Template Otomatis
                </Button>
              </div>
              <Textarea
                rows={6}
                value={formPesan}
                onChange={(e) => setFormPesan(e.target.value)}
                placeholder="Tuliskan isi surat peringatan secara jelas dan sopan..."
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="notif-check"
                checked={formKirimNotif}
                onCheckedChange={(checked) => setFormKirimNotif(!!checked)}
              />
              <label
                htmlFor="notif-check"
                className="text-xs font-medium text-gray-700 cursor-pointer"
              >
                Kirimkan juga notifikasi ke dashboard akun Orang Tua secara instan
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !formSantriId}>
                {isSubmitting ? "Menerbitkan..." : "Terbitkan Peringatan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 2: Preview & Cetak Surat Peringatan ─────────────── */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              Surat Peringatan Resmi Pesantren
            </DialogTitle>
          </DialogHeader>

          {selectedPeringatan && (
            <div className="space-y-4 py-2">
              {/* Formal Letter Layout */}
              <div className="border rounded-xl p-6 bg-white text-gray-900 space-y-4 shadow-sm font-serif">
                {/* Kop Surat */}
                <div className="text-center pb-3 border-b-2 border-gray-800">
                  <h2 className="text-lg font-bold tracking-wide">
                    PONDOK PESANTREN BAITURRAHMAN
                  </h2>
                  <p className="text-xs font-sans text-gray-600">
                    Sekretariat: Jl. Raya Pesantren No. 123 • Telp: (021) 87654321
                  </p>
                  <p className="text-xs font-sans text-gray-500">
                    Email: keuangan@baiturrahman.sch.id
                  </p>
                </div>

                <div className="flex justify-between text-xs font-sans text-gray-600">
                  <div>
                    <p>No: REF-SP/{selectedPeringatan.id.slice(-6).toUpperCase()}/{new Date(selectedPeringatan.createdAt).getFullYear()}</p>
                    <p>Hal: {selectedPeringatan.judul}</p>
                  </div>
                  <div>
                    <p>Tanggal: {new Date(selectedPeringatan.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-2 text-sm font-sans text-gray-800 whitespace-pre-line leading-relaxed">
                  {selectedPeringatan.pesan}
                </div>

                {/* Signature Box */}
                <div className="pt-8 flex justify-end font-sans">
                  <div className="text-center text-xs">
                    <p>Bagian Keuangan & Administrasi,</p>
                    <div className="h-16 flex items-center justify-center text-gray-400 italic">
                      [Tanda Tangan & Cap Resmi]
                    </div>
                    <p className="font-bold underline">{selectedPeringatan.createdByName || "Petugas Keuangan"}</p>
                    <p className="text-gray-500">Pondok Pesantren Baiturrahman</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewModalOpen(false)}
            >
              Tutup
            </Button>
            {selectedPeringatan && (
              <Button
                type="button"
                variant="outline"
                className="text-emerald-700 border-emerald-300"
                onClick={() => sendWhatsApp(selectedPeringatan)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Kirim WA
              </Button>
            )}
            <Button onClick={() => window.print()} className="gap-2">
              <Printer className="w-4 h-4" /> Cetak Surat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 3: Edit Peringatan ──────────────────────────────── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Surat Peringatan</DialogTitle>
            <DialogDescription>
              Perbarui judul, tingkat peringatan, batas waktu, atau status.
            </DialogDescription>
          </DialogHeader>

          {selectedPeringatan && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="text-sm font-semibold bg-gray-50 p-2.5 rounded border">
                Santri: {selectedPeringatan.santriName} (Wali: {selectedPeringatan.parentName || "-"})
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tingkat Peringatan</Label>
                  <Select
                    value={editTingkat}
                    onValueChange={(val: any) => setEditTingkat(val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pemberitahuan">Pemberitahuan</SelectItem>
                      <SelectItem value="sp1">Surat Peringatan 1 (SP1)</SelectItem>
                      <SelectItem value="sp2">Surat Peringatan 2 (SP2)</SelectItem>
                      <SelectItem value="sp3">Surat Peringatan 3 (SP3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status Peringatan</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(val: any) => setEditStatus(val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="selesai">Selesai / Lunas</SelectItem>
                      <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nominal Tunggakan (Rp)</Label>
                  <Input
                    type="number"
                    value={editNominal}
                    onChange={(e) => setEditNominal(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Batas Waktu (Deadline)</Label>
                  <Input
                    type="date"
                    value={editBatasWaktu}
                    onChange={(e) => setEditBatasWaktu(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Judul Peringatan</Label>
                <Input
                  value={editJudul}
                  onChange={(e) => setEditJudul(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Isi Surat & Pesan</Label>
                <Textarea
                  rows={5}
                  value={editPesan}
                  onChange={(e) => setEditPesan(e.target.value)}
                  required
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

      {/* ─── AlertDialog: Hapus Peringatan ────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Surat Peringatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus surat peringatan untuk santri{" "}
              <strong className="text-gray-900">{selectedPeringatan?.santriName}</strong>?
              Data yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting ? "Menghapus..." : "Hapus Peringatan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
