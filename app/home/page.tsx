"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import {
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Clock,
  User,
  TrendingUp,
  Award,
  MessageCircle,
  Wallet,
  History,
  Plus,
  Minus,
  CreditCard,
  Landmark,
  Copy,
  Check,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileCheck,
  Receipt,
  ExternalLink,
  Shirt,
  Package,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Report {
  id: string;
  kategori: "hafalan" | "akademik" | "perilaku";
  santriId: string;
  santriName: string;
  ustadzName: string;
  ustadId: string;
  tanggal: string;
  isi: any;
  createdAt?: string;
}

interface Santri {
  id: string;
  name: string;
  nis: string;
  currentClass?: string; // tingkatan kelas santri, misal "Kelas 1", "Kelas 2", dst.
}

interface TagihanIuran {
  id: string;
  santriId: string;
  santriName: string;
  santriGender: string;
  santriNis?: string;
  parentId?: string;
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
  keterangan?: string;
}

interface RincianPaketSeragamItem {
  nama: string;
  jumlah: number;
}

interface TagihanSeragam {
  id: string;
  santriId: string;
  santriName: string;
  santriGender: string;
  santriNis?: string;
  parentId?: string;
  tahun: number;
  nominal: number;
  ukuran?: string;
  rincianPaket?: RincianPaketSeragamItem[];
  status: "belum_bayar" | "menunggu_verifikasi" | "lunas" | "ditolak";
  statusPengambilan?: "belum_diambil" | "siap_diambil" | "sudah_diambil";
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

interface SeragamSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  defaultNominal: number;
  keterangan?: string;
}

interface TagihanBukuPaket {
  id: string;
  santriId: string;
  santriName: string;
  santriGender: string;
  santriNis?: string;
  parentId?: string;
  tingkatKelas?: string;
  tahunAjaran?: string;
  nominal: number;
  daftarBuku?: string[];
  status: "belum_bayar" | "menunggu_verifikasi" | "lunas" | "ditolak";
  statusPengambilan?: "belum_diambil" | "siap_diambil" | "sudah_diambil";
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
  defaultTahunAjaran?: string;
  keterangan?: string;
}

interface TagihanLaundry {
  id: string;
  santriId: string;
  santriName: string;
  santriGender: string;
  santriNis?: string;
  parentId?: string;
  bulan: string;
  tahun: number;
  nominal: number;
  namaPaket?: string;
  kuotaKg?: number;
  terpakaiKg?: number;
  status: "belum_bayar" | "menunggu_verifikasi" | "lunas" | "ditolak";
  statusLayanan?: "aktif" | "nonaktif" | "selesai";
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
  defaultPaket?: string;
  kuotaKg?: number;
  keterangan?: string;
}

interface BankSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  defaultNominal: number;
  keterangan?: string;
}

interface PeringatanTagihan {
  id: string;
  santriId: string;
  santriName: string;
  santriNis?: string;
  santriGender?: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  judul: string;
  tingkatPeringatan?: "pemberitahuan" | "teguran" | "sp1" | "sp2" | "sp3";
  jenisTagihan?: string;
  nominalTunggakan?: number;
  pesan: string;
  batasWaktu?: string;
  status: "aktif" | "dibaca" | "diselesaikan";
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [santriList, setSantriList] = useState<Santri[]>([]);

  // Saldo state
  const [saldoMap, setSaldoMap] = useState<Record<string, number>>({});
  const [isRiwayatOpen, setIsRiwayatOpen] = useState(false);
  const [selectedRiwayatSantri, setSelectedRiwayatSantri] = useState<Santri | null>(null);
  const [riwayatMutasi, setRiwayatMutasi] = useState<any[]>([]);
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(false);

  // Iuran / SPP state
  const [tagihanList, setTagihanList] = useState<TagihanIuran[]>([]);
  const [bankSettings, setBankSettings] = useState<BankSettings>({
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7123456789",
    accountHolder: "Pondok Pesantren Baiturrahman",
    defaultNominal: 350000,
    keterangan: "Pembayaran SPP paling lambat tanggal 10 setiap bulan",
  });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState<TagihanIuran | null>(null);
  const [buktiBase64, setBuktiBase64] = useState<string>("");
  const [buktiFileName, setBuktiFileName] = useState<string>("");
  const [catatanOrangTua, setCatatanOrangTua] = useState<string>("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [previewBuktiModal, setPreviewBuktiModal] = useState<string | null>(null);

  // Uang Masuk state
  const [tagihanUangMasukList, setTagihanUangMasukList] = useState<TagihanUangMasuk[]>([]);
  const [uangMasukSettings, setUangMasukSettings] = useState<UangMasukSettings>({
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7123456789",
    accountHolder: "Pondok Pesantren Baiturrahman",
    defaultNominal: 2500000,
  });
  const [isUangMasukModalOpen, setIsUangMasukModalOpen] = useState(false);
  const [selectedUangMasukTagihan, setSelectedUangMasukTagihan] = useState<TagihanUangMasuk | null>(null);
  const [buktiUangMasukBase64, setBuktiUangMasukBase64] = useState<string>("");
  const [buktiUangMasukFileName, setBuktiUangMasukFileName] = useState<string>("");
  const [catatanUangMasuk, setCatatanUangMasuk] = useState<string>("");
  const [isSubmittingUangMasuk, setIsSubmittingUangMasuk] = useState(false);
  const [copiedUangMasukRekening, setCopiedUangMasukRekening] = useState(false);
  const [previewUangMasukModal, setPreviewUangMasukModal] = useState<string | null>(null);

  // Seragam state
  const [tagihanSeragamList, setTagihanSeragamList] = useState<TagihanSeragam[]>([]);
  const [seragamSettings, setSeragamSettings] = useState<SeragamSettings>({
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7123456789",
    accountHolder: "Pondok Pesantren Baiturrahman",
    defaultNominal: 650000,
  });
  const [isSeragamModalOpen, setIsSeragamModalOpen] = useState(false);
  const [selectedSeragamTagihan, setSelectedSeragamTagihan] = useState<TagihanSeragam | null>(null);
  const [buktiSeragamBase64, setBuktiSeragamBase64] = useState<string>("");
  const [buktiSeragamFileName, setBuktiSeragamFileName] = useState<string>("");
  const [catatanSeragam, setCatatanSeragam] = useState<string>("");
  const [isSubmittingSeragam, setIsSubmittingSeragam] = useState(false);
  const [copiedSeragamRekening, setCopiedSeragamRekening] = useState(false);
  const [previewSeragamModal, setPreviewSeragamModal] = useState<string | null>(null);

  // Buku Paket / Kitab Kuning state
  const [tagihanBukuPaketList, setTagihanBukuPaketList] = useState<TagihanBukuPaket[]>([]);
  const [bukuPaketSettings, setBukuPaketSettings] = useState<BukuPaketSettings>({
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7123456789",
    accountHolder: "Pondok Pesantren Baiturrahman",
    defaultNominal: 450000,
  });
  const [isBukuPaketModalOpen, setIsBukuPaketModalOpen] = useState(false);
  const [selectedBukuPaketTagihan, setSelectedBukuPaketTagihan] = useState<TagihanBukuPaket | null>(null);
  const [buktiBukuPaketBase64, setBuktiBukuPaketBase64] = useState<string>("");
  const [buktiBukuPaketFileName, setBuktiBukuPaketFileName] = useState<string>("");
  const [catatanBukuPaket, setCatatanBukuPaket] = useState<string>("");
  const [isSubmittingBukuPaket, setIsSubmittingBukuPaket] = useState(false);
  const [copiedBukuPaketRekening, setCopiedBukuPaketRekening] = useState(false);
  const [previewBukuPaketModal, setPreviewBukuPaketModal] = useState<string | null>(null);

  // Laundry state
  const [tagihanLaundryList, setTagihanLaundryList] = useState<TagihanLaundry[]>([]);
  const [laundrySettings, setLaundrySettings] = useState<LaundrySettings>({
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7123456789",
    accountHolder: "Pondok Pesantren Baiturrahman",
    defaultNominal: 100000,
  });
  const [isLaundryModalOpen, setIsLaundryModalOpen] = useState(false);
  const [selectedLaundryTagihan, setSelectedLaundryTagihan] = useState<TagihanLaundry | null>(null);
  const [buktiLaundryBase64, setBuktiLaundryBase64] = useState<string>("");
  const [buktiLaundryFileName, setBuktiLaundryFileName] = useState<string>("");
  const [catatanLaundry, setCatatanLaundry] = useState<string>("");
  const [isSubmittingLaundry, setIsSubmittingLaundry] = useState(false);
  const [copiedLaundryRekening, setCopiedLaundryRekening] = useState(false);
  const [previewLaundryModal, setPreviewLaundryModal] = useState<string | null>(null);

  // Peringatan / Warning state
  const [peringatanList, setPeringatanList] = useState<PeringatanTagihan[]>([]);
  const [isPeringatanModalOpen, setIsPeringatanModalOpen] = useState(false);
  const [selectedPeringatan, setSelectedPeringatan] = useState<PeringatanTagihan | null>(null);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  const handleOpenRiwayat = async (santri: Santri) => {
    setSelectedRiwayatSantri(santri);
    setIsRiwayatOpen(true);
    setIsLoadingRiwayat(true);

    try {
      const res = await fetch(`/api/saldo/riwayat?santriId=${santri.id}`);
      const data = await res.json();
      if (res.ok) {
        setRiwayatMutasi(data.riwayat || []);
      } else {
        toast.error("Gagal memuat riwayat saldo");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat memuat riwayat");
    } finally {
      setIsLoadingRiwayat(false);
    }
  };

  const handleCopyRekening = () => {
    navigator.clipboard.writeText(bankSettings.accountNumber);
    setCopiedRekening(true);
    toast.success("Nomor rekening berhasil disalin!");
    setTimeout(() => setCopiedRekening(false), 2000);
  };

  const handleCopyUangMasukRekening = () => {
    navigator.clipboard.writeText(uangMasukSettings.accountNumber);
    setCopiedUangMasukRekening(true);
    toast.success("Nomor rekening berhasil disalin!");
    setTimeout(() => setCopiedUangMasukRekening(false), 2000);
  };

  const handleCopySeragamRekening = () => {
    navigator.clipboard.writeText(seragamSettings.accountNumber);
    setCopiedSeragamRekening(true);
    toast.success("Nomor rekening berhasil disalin!");
    setTimeout(() => setCopiedSeragamRekening(false), 2000);
  };

  const handleCopyBukuPaketRekening = () => {
    navigator.clipboard.writeText(bukuPaketSettings.accountNumber);
    setCopiedBukuPaketRekening(true);
    toast.success("Nomor rekening berhasil disalin!");
    setTimeout(() => setCopiedBukuPaketRekening(false), 2000);
  };

  const handleCopyLaundryRekening = () => {
    navigator.clipboard.writeText(laundrySettings.accountNumber);
    setCopiedLaundryRekening(true);
    toast.success("Nomor rekening berhasil disalin!");
    setTimeout(() => setCopiedLaundryRekening(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setBuktiFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setBuktiBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUangMasukFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setBuktiUangMasukFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setBuktiUangMasukBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSeragamFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setBuktiSeragamFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setBuktiSeragamBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBukuPaketFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setBuktiBukuPaketFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setBuktiBukuPaketBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLaundryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setBuktiLaundryFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setBuktiLaundryBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenPayment = (tagihan: TagihanIuran) => {
    setSelectedTagihan(tagihan);
    setBuktiBase64(tagihan.buktiPembayaran || "");
    setBuktiFileName(tagihan.buktiFileName || "");
    setCatatanOrangTua(tagihan.catatanOrangTua || "");
    setIsPaymentModalOpen(true);
  };

  const handleOpenUangMasukPayment = (tagihan: TagihanUangMasuk) => {
    setSelectedUangMasukTagihan(tagihan);
    setBuktiUangMasukBase64(tagihan.buktiPembayaran || "");
    setBuktiUangMasukFileName(tagihan.buktiFileName || "");
    setCatatanUangMasuk(tagihan.catatanOrangTua || "");
    setIsUangMasukModalOpen(true);
  };

  const handleOpenSeragamPayment = (tagihan: TagihanSeragam) => {
    setSelectedSeragamTagihan(tagihan);
    setBuktiSeragamBase64(tagihan.buktiPembayaran || "");
    setBuktiSeragamFileName(tagihan.buktiFileName || "");
    setCatatanSeragam(tagihan.catatanOrangTua || "");
    setIsSeragamModalOpen(true);
  };

  const handleOpenBukuPaketPayment = (tagihan: TagihanBukuPaket) => {
    setSelectedBukuPaketTagihan(tagihan);
    setBuktiBukuPaketBase64(tagihan.buktiPembayaran || "");
    setBuktiBukuPaketFileName(tagihan.buktiFileName || "");
    setCatatanBukuPaket(tagihan.catatanOrangTua || "");
    setIsBukuPaketModalOpen(true);
  };

  const handleOpenLaundryPayment = (tagihan: TagihanLaundry) => {
    setSelectedLaundryTagihan(tagihan);
    setBuktiLaundryBase64(tagihan.buktiPembayaran || "");
    setBuktiLaundryFileName(tagihan.buktiFileName || "");
    setCatatanLaundry(tagihan.catatanOrangTua || "");
    setIsLaundryModalOpen(true);
  };

  const handleOpenPeringatanDetail = async (item: PeringatanTagihan) => {
    setSelectedPeringatan(item);
    setIsPeringatanModalOpen(true);
    if (item.status === "aktif") {
      try {
        await fetch("/api/peringatan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, status: "dibaca" }),
        });
        fetchData();
      } catch (err) {
        console.error("Error marking peringatan as read:", err);
      }
    }
  };

  const handleSubmitUangMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUangMasukTagihan) return;

    if (!buktiUangMasukBase64) {
      toast.error("Silakan pilih file bukti transfer terlebih dahulu");
      return;
    }

    setIsSubmittingUangMasuk(true);
    try {
      const res = await fetch("/api/uang-masuk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUangMasukTagihan.id,
          action: "submit_pembayaran",
          buktiPembayaran: buktiUangMasukBase64,
          buktiFileName: buktiUangMasukFileName || "bukti_uang_masuk.jpg",
          catatanOrangTua: catatanUangMasuk,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          "Bukti pembayaran uang masuk berhasil dikirim! Petugas akan segera memverifikasi."
        );
        setIsUangMasukModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "Gagal mengirim bukti pembayaran");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim bukti pembayaran");
    } finally {
      setIsSubmittingUangMasuk(false);
    }
  };

  const handleSubmitSeragam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeragamTagihan) return;

    if (!buktiSeragamBase64) {
      toast.error("Silakan pilih file bukti transfer terlebih dahulu");
      return;
    }

    setIsSubmittingSeragam(true);
    try {
      const res = await fetch("/api/seragam", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSeragamTagihan.id,
          action: "submit_pembayaran",
          buktiPembayaran: buktiSeragamBase64,
          buktiFileName: buktiSeragamFileName || "bukti_seragam.jpg",
          catatanOrangTua: catatanSeragam,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          "Bukti pembayaran seragam berhasil dikirim! Petugas akan segera memverifikasi."
        );
        setIsSeragamModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "Gagal mengirim bukti pembayaran");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim bukti pembayaran");
    } finally {
      setIsSubmittingSeragam(false);
    }
  };

  const handleSubmitBukuPaket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBukuPaketTagihan) return;

    if (!buktiBukuPaketBase64) {
      toast.error("Silakan pilih file bukti transfer terlebih dahulu");
      return;
    }

    setIsSubmittingBukuPaket(true);
    try {
      const res = await fetch("/api/buku-paket", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBukuPaketTagihan.id,
          action: "submit_pembayaran",
          buktiPembayaran: buktiBukuPaketBase64,
          buktiFileName: buktiBukuPaketFileName || "bukti_buku_paket.jpg",
          catatanOrangTua: catatanBukuPaket,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          "Bukti pembayaran buku paket / kitab berhasil dikirim! Petugas akan segera memverifikasi."
        );
        setIsBukuPaketModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "Gagal mengirim bukti pembayaran");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim bukti pembayaran");
    } finally {
      setIsSubmittingBukuPaket(false);
    }
  };

  const handleSubmitLaundry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLaundryTagihan) return;

    if (!buktiLaundryBase64) {
      toast.error("Silakan pilih file bukti transfer terlebih dahulu");
      return;
    }

    setIsSubmittingLaundry(true);
    try {
      const res = await fetch("/api/laundry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedLaundryTagihan.id,
          action: "submit_pembayaran",
          buktiPembayaran: buktiLaundryBase64,
          buktiFileName: buktiLaundryFileName || "bukti_laundry.jpg",
          catatanOrangTua: catatanLaundry,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          "Bukti pembayaran iuran laundry berhasil dikirim! Petugas akan segera memverifikasi."
        );
        setIsLaundryModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "Gagal mengirim bukti pembayaran");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim bukti pembayaran");
    } finally {
      setIsSubmittingLaundry(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTagihan) return;

    if (!buktiBase64) {
      toast.error("Silakan pilih file bukti transfer terlebih dahulu");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await fetch("/api/iuran", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTagihan.id,
          action: "submit_pembayaran",
          buktiPembayaran: buktiBase64,
          buktiFileName: buktiFileName || "bukti_transfer.jpg",
          catatanOrangTua,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          "Bukti pembayaran berhasil dikirim! Petugas akan segera memverifikasi."
        );
        setIsPaymentModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "Gagal mengirim bukti pembayaran");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim bukti pembayaran");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "orangtua") {
      toast.error("Halaman ini hanya untuk orang tua");
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Get parent data to find student IDs
      const parentRef = ref(database, `users/${session.user.id}`);
      const parentSnapshot = await get(parentRef);

      if (!parentSnapshot.exists()) {
        toast.error("Data orang tua tidak ditemukan");
        return;
      }

      const parentData = parentSnapshot.val();
      let studentIds: string[] = [];

      // Get student IDs
      if (parentData.studentIds && Array.isArray(parentData.studentIds)) {
        studentIds = parentData.studentIds;
      }

      if (studentIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch santri details
      const usersRef = ref(database, "users");
      const usersSnapshot = await get(usersRef);
      const santriData: Santri[] = [];

      if (usersSnapshot.exists()) {
        const users = usersSnapshot.val();
        studentIds.forEach((studentId) => {
          if (users[studentId]) {
            santriData.push({
              id: studentId,
              name: users[studentId].name || "Tidak ada nama",
              nis: users[studentId].nis || "",
              currentClass: users[studentId].currentClass || "",
            });
          }
        });
      }

      setSantriList(santriData);

      // Fetch Saldo
      const newSaldoMap: Record<string, number> = {};
      const saldoRef = ref(database, "saldo");
      const saldoSnapshot = await get(saldoRef);
      if (saldoSnapshot.exists()) {
        const saldoData = saldoSnapshot.val();
        studentIds.forEach(id => {
          if (saldoData[id]) {
            newSaldoMap[id] = saldoData[id].amount || 0;
          } else {
            newSaldoMap[id] = 0;
          }
        });
      }
      setSaldoMap(newSaldoMap);

      // Fetch Iuran / SPP data
      try {
        const iuranRes = await fetch("/api/iuran");
        if (iuranRes.ok) {
          const iuranData = await iuranRes.json();
          setTagihanList(iuranData.tagihanList || []);
          if (iuranData.bankSettings) {
            setBankSettings(iuranData.bankSettings);
          }
        }
      } catch (err) {
        console.error("Error fetching iuran on home:", err);
      }

      // Fetch Uang Masuk data
      try {
        const uangMasukRes = await fetch("/api/uang-masuk");
        if (uangMasukRes.ok) {
          const uangMasukData = await uangMasukRes.json();
          setTagihanUangMasukList(uangMasukData.tagihanList || []);
          if (uangMasukData.settings) {
            setUangMasukSettings(uangMasukData.settings);
          }
        }
      } catch (err) {
        console.error("Error fetching uang masuk on home:", err);
      }

      // Fetch Seragam data
      try {
        const seragamRes = await fetch("/api/seragam");
        if (seragamRes.ok) {
          const seragamData = await seragamRes.json();
          setTagihanSeragamList(seragamData.tagihanList || []);
          if (seragamData.settings) {
            setSeragamSettings(seragamData.settings);
          }
        }
      } catch (err) {
        console.error("Error fetching seragam on home:", err);
      }

      // Fetch Buku Paket data
      try {
        const bukuRes = await fetch("/api/buku-paket");
        if (bukuRes.ok) {
          const bukuData = await bukuRes.json();
          setTagihanBukuPaketList(bukuData.tagihanList || []);
          if (bukuData.settings) {
            setBukuPaketSettings(bukuData.settings);
          }
        }
      } catch (err) {
        console.error("Error fetching buku paket on home:", err);
      }

      // Fetch Laundry data
      try {
        const laundryRes = await fetch("/api/laundry");
        if (laundryRes.ok) {
          const laundryData = await laundryRes.json();
          setTagihanLaundryList(laundryData.tagihanList || []);
          if (laundryData.settings) {
            setLaundrySettings(laundryData.settings);
          }
        }
      } catch (err) {
        console.error("Error fetching laundry on home:", err);
      }

      // Fetch Peringatan data
      try {
        const peringatanRes = await fetch("/api/peringatan");
        if (peringatanRes.ok) {
          const peringatanData = await peringatanRes.json();
          setPeringatanList(peringatanData.peringatanList || []);
        }
      } catch (err) {
        console.error("Error fetching peringatan on home:", err);
      }

      // Fetch reports from Firestore
      const allReports: Report[] = [];

      // Fetch Quran reports
      const quranReportsRef = ref(database, "quranReports");
      const quranSnapshot = await get(quranReportsRef);
      if (quranSnapshot.exists()) {
        const quranReports = quranSnapshot.val();
        Object.keys(quranReports).forEach((reportId) => {
          const report = quranReports[reportId];
          if (studentIds.includes(report.studentId)) {
            allReports.push({
              id: reportId,
              kategori: "hafalan",
              santriId: report.studentId,
              santriName: report.studentName || "Unknown",
              ustadzName: report.ustadName || "Unknown",
              ustadId: report.ustadId || "",
              tanggal: report.testDate || report.createdAt,
              isi: {
                surat: report.surah,
                ayat: `${report.ayatStart}-${report.ayatEnd}`,
                predikat: report.fluencyLevel,
              },
              createdAt: report.createdAt,
            });
          }
        });
      }

      // Fetch Academic reports
      const academicReportsRef = ref(database, "academicReports");
      const academicSnapshot = await get(academicReportsRef);
      if (academicSnapshot.exists()) {
        const academicReports = academicSnapshot.val();
        Object.keys(academicReports).forEach((reportId) => {
          const report = academicReports[reportId];
          if (studentIds.includes(report.studentId)) {
            allReports.push({
              id: reportId,
              kategori: "akademik",
              santriId: report.studentId,
              santriName: report.studentName || "Unknown",
              ustadzName: report.ustadName || "Unknown",
              ustadId: report.ustadId || "",
              tanggal: report.createdAt,
              isi: {
                mapel: report.subject,
                nilai: report.gradeNumber,
              },
              createdAt: report.createdAt,
            });
          }
        });
      }

      // Fetch Behavior reports
      const behaviorReportsRef = ref(database, "behaviorReports");
      const behaviorSnapshot = await get(behaviorReportsRef);
      if (behaviorSnapshot.exists()) {
        const behaviorReports = behaviorSnapshot.val();
        Object.keys(behaviorReports).forEach((reportId) => {
          const report = behaviorReports[reportId];
          if (studentIds.includes(report.studentId)) {
            allReports.push({
              id: reportId,
              kategori: "perilaku",
              santriId: report.studentId,
              santriName: report.studentName || "Unknown",
              ustadzName: report.ustadName || "Unknown",
              ustadId: report.ustadId || "",
              tanggal: report.incidentDate || report.createdAt,
              isi: {
                catatan: report.description,
                jenis: report.priority === "low" ? "Prestasi" : "Pelanggaran",
              },
              createdAt: report.createdAt,
            });
          }
        });
      }

      // Sort by date (newest first)
      allReports.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.tanggal).getTime();
        const dateB = new Date(b.createdAt || b.tanggal).getTime();
        return dateB - dateA;
      });

      setReports(allReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  // Pending / Unpaid SPP bills for parent notification
  const tagihanPendingOrUnpaid = useMemo(() => {
    return tagihanList.filter(
      (t) =>
        t.status === "belum_bayar" ||
        t.status === "menunggu_verifikasi" ||
        t.status === "ditolak"
    );
  }, [tagihanList]);

  // Pending / Unpaid Uang Masuk bills for parent notification
  const tagihanUangMasukPending = useMemo(() => {
    return tagihanUangMasukList.filter(
      (t) =>
        t.status === "belum_bayar" ||
        t.status === "menunggu_verifikasi" ||
        t.status === "ditolak"
    );
  }, [tagihanUangMasukList]);

  // Pending / Unpaid Seragam bills for parent notification
  const tagihanSeragamPending = useMemo(() => {
    return tagihanSeragamList.filter(
      (t) =>
        t.status === "belum_bayar" ||
        t.status === "menunggu_verifikasi" ||
        t.status === "ditolak"
    );
  }, [tagihanSeragamList]);

  // Pending / Unpaid Buku Paket bills for parent notification
  const tagihanBukuPaketPending = useMemo(() => {
    return tagihanBukuPaketList.filter(
      (t) =>
        t.status === "belum_bayar" ||
        t.status === "menunggu_verifikasi" ||
        t.status === "ditolak"
    );
  }, [tagihanBukuPaketList]);

  // Pending / Unpaid Laundry bills for parent notification
  const tagihanLaundryPending = useMemo(() => {
    return tagihanLaundryList.filter(
      (t) =>
        t.status === "belum_bayar" ||
        t.status === "menunggu_verifikasi" ||
        t.status === "ditolak"
    );
  }, [tagihanLaundryList]);

  // Active warning notices for parent notification
  const peringatanActive = useMemo(() => {
    return peringatanList.filter(
      (p) => p.status === "aktif" || p.status === "dibaca"
    );
  }, [peringatanList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Laporan Perkembangan Santri
              </h1>
              <p className="text-gray-600">
                Pantau perkembangan putra-putri Anda di pesantren
              </p>
            </div>
            <Link href="/chat">
              <Button size="lg" className="gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat Guru
              </Button>
            </Link>
          </div>

          {/* ========== PEMBERITAHUAN SURAT PERINGATAN / TEGURAN TAGIHAN ========== */}
          {peringatanActive.length > 0 && (
            <Card className="mt-6 border-2 border-rose-400 bg-gradient-to-r from-rose-50 via-rose-50/80 to-red-50/60 shadow-lg animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-rose-950">
                    <div className="p-2 bg-rose-200/80 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-rose-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-rose-950 font-bold">
                        Surat Peringatan & Teguran Tagihan
                      </CardTitle>
                      <CardDescription className="text-xs text-rose-900 font-medium">
                        Perhatian: Anda memiliki surat peringatan / teguran keterlambatan pembayaran tagihan dari pihak pesantren.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-rose-600 text-white hover:bg-rose-700 font-bold">
                    {peringatanActive.length} Peringatan
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="divide-y divide-rose-200/80 rounded-xl bg-white/90 border border-rose-200 overflow-hidden shadow-sm">
                  {peringatanActive.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-rose-50/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm">
                            {item.santriName}
                          </p>
                          <Badge
                            className={`text-xs font-bold uppercase tracking-wider ${
                              item.tingkatPeringatan === "sp3"
                                ? "bg-red-600 text-white"
                                : item.tingkatPeringatan === "sp2"
                                  ? "bg-orange-600 text-white"
                                  : item.tingkatPeringatan === "sp1"
                                    ? "bg-amber-500 text-white"
                                    : "bg-rose-100 text-rose-800 border-rose-200"
                            }`}
                          >
                            {item.tingkatPeringatan ? item.tingkatPeringatan.toUpperCase() : "PERINGATAN"}
                          </Badge>
                          {item.jenisTagihan && (
                            <Badge variant="outline" className="text-xs border-rose-300 text-rose-800">
                              Tagihan: {item.jenisTagihan}
                            </Badge>
                          )}
                          {item.status === "aktif" && (
                            <Badge className="bg-rose-600 text-white text-xs gap-1 animate-ping">
                              Baru
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-rose-950">
                          {item.judul}
                        </p>
                        {item.nominalTunggakan ? (
                          <p className="text-xs font-bold text-rose-700">
                            Total Tunggakan: {formatRupiah(item.nominalTunggakan)}
                          </p>
                        ) : null}
                        {item.batasWaktu && (
                          <p className="text-xs font-semibold text-rose-800">
                            ⚠️ Batas Waktu Penyelesaian: {item.batasWaktu}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5 w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm"
                          onClick={() => handleOpenPeringatanDetail(item)}
                        >
                          <FileCheck className="h-4 w-4" />
                          Buka & Baca Surat Peringatan
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========== PEMBERITAHUAN TAGIHAN SPP BULANAN (NOTIF TANGGAL 1) ========== */}
          {tagihanPendingOrUnpaid.length > 0 && (
            <Card className="mt-6 border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50/50 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-amber-900">
                    <div className="p-2 bg-amber-200/70 rounded-lg">
                      <CreditCard className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-amber-950 font-bold">
                        Pemberitahuan Tagihan SPP Bulanan
                      </CardTitle>
                      <CardDescription className="text-xs text-amber-800">
                        Mohon lakukan pembayaran SPP santri melalui transfer ke rekening resmi pesantren.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                    {tagihanPendingOrUnpaid.length} Tagihan
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="divide-y divide-amber-200/60 rounded-xl bg-white/80 border border-amber-200/80 overflow-hidden">
                  {tagihanPendingOrUnpaid.map((tagihan) => (
                    <div
                      key={tagihan.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">
                            {tagihan.santriName}
                          </p>
                          <Badge variant="outline" className="text-xs font-normal">
                            SPP {tagihan.bulan} {tagihan.tahun}
                          </Badge>
                          {tagihan.status === "menunggu_verifikasi" && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 text-xs gap-1 animate-pulse">
                              <Clock className="h-3 w-3" />
                              Sedang Diverifikasi
                            </Badge>
                          )}
                          {tagihan.status === "ditolak" && (
                            <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 text-xs gap-1">
                              <XCircle className="h-3 w-3" />
                              Ditolak (Upload Ulang)
                            </Badge>
                          )}
                          {tagihan.status === "belum_bayar" && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 text-xs gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Belum Bayar
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-bold text-emerald-700">
                          {formatRupiah(tagihan.nominal)}
                        </p>
                        {tagihan.status === "ditolak" && tagihan.catatanPetugas && (
                          <p className="text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-100">
                            Alasan ditolak: {tagihan.catatanPetugas}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className={`gap-1.5 w-full sm:w-auto ${tagihan.status === "menunggu_verifikasi"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                            } text-white`}
                          onClick={() => handleOpenPayment(tagihan)}
                        >
                          <Receipt className="h-4 w-4" />
                          {tagihan.status === "menunggu_verifikasi"
                            ? "Lihat Bukti & Status"
                            : tagihan.status === "ditolak"
                              ? "Upload Bukti Ulang"
                              : "Bayar / Upload Bukti"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========== PEMBERITAHUAN TAGIHAN UANG MASUK (1x BAYAR) ========== */}
          {tagihanUangMasukPending.length > 0 && (
            <Card className="mt-4 border-2 border-teal-300 bg-gradient-to-r from-teal-50 via-teal-50/70 to-emerald-50/50 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-teal-900">
                    <div className="p-2 bg-teal-200/70 rounded-lg">
                      <Landmark className="h-5 w-5 text-teal-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-teal-950 font-bold">
                        Tagihan Uang Masuk Pesantren
                      </CardTitle>
                      <CardDescription className="text-xs text-teal-800">
                        Tagihan pendaftaran/masuk pesantren (1x bayar). Mohon segera selesaikan pembayaran.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-teal-600 text-white hover:bg-teal-700">
                    {tagihanUangMasukPending.length} Tagihan
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="divide-y divide-teal-200/60 rounded-xl bg-white/80 border border-teal-200/80 overflow-hidden">
                  {tagihanUangMasukPending.map((tagihan) => (
                    <div
                      key={tagihan.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-teal-50/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">
                            {tagihan.santriName}
                          </p>
                          <Badge variant="outline" className="text-xs font-normal border-teal-300 text-teal-700">
                            Uang Masuk {tagihan.tahun}
                          </Badge>
                          {tagihan.status === "menunggu_verifikasi" && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 text-xs gap-1 animate-pulse">
                              <Clock className="h-3 w-3" />
                              Sedang Diverifikasi
                            </Badge>
                          )}
                          {tagihan.status === "ditolak" && (
                            <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 text-xs gap-1">
                              <XCircle className="h-3 w-3" />
                              Ditolak (Upload Ulang)
                            </Badge>
                          )}
                          {tagihan.status === "belum_bayar" && (
                            <Badge className="bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100 text-xs gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Belum Bayar
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-bold text-teal-700">
                          {formatRupiah(tagihan.nominal)}
                        </p>
                        {tagihan.keterangan && (
                          <p className="text-xs text-gray-500">{tagihan.keterangan}</p>
                        )}
                        {tagihan.status === "ditolak" && tagihan.catatanPetugas && (
                          <p className="text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-100">
                            Alasan ditolak: {tagihan.catatanPetugas}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className={`gap-1.5 w-full sm:w-auto ${
                            tagihan.status === "menunggu_verifikasi"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-teal-600 hover:bg-teal-700"
                          } text-white`}
                          onClick={() => handleOpenUangMasukPayment(tagihan)}
                        >
                          <Receipt className="h-4 w-4" />
                          {tagihan.status === "menunggu_verifikasi"
                            ? "Lihat Bukti & Status"
                            : tagihan.status === "ditolak"
                              ? "Upload Bukti Ulang"
                              : "Bayar / Upload Bukti"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========== PEMBERITAHUAN TAGIHAN SERAGAM ========== */}
          {tagihanSeragamPending.length > 0 && (
            <Card className="mt-4 border-2 border-purple-300 bg-gradient-to-r from-purple-50 via-purple-50/70 to-indigo-50/50 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-purple-900">
                    <div className="p-2 bg-purple-200/70 rounded-lg">
                      <Shirt className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-purple-950 font-bold">
                        Tagihan Seragam Santri
                      </CardTitle>
                      <CardDescription className="text-xs text-purple-800">
                        Tagihan pemesanan paket seragam santri. Mohon lakukan pembayaran dan unggah bukti transfer.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-purple-600 text-white hover:bg-purple-700">
                    {tagihanSeragamPending.length} Tagihan
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="divide-y divide-purple-200/60 rounded-xl bg-white/80 border border-purple-200/80 overflow-hidden">
                  {tagihanSeragamPending.map((tagihan) => (
                    <div
                      key={tagihan.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-purple-50/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">
                            {tagihan.santriName}
                          </p>
                          <Badge variant="outline" className="text-xs font-normal border-purple-300 text-purple-700">
                            Seragam {tagihan.tahun}
                          </Badge>
                          {tagihan.ukuran && (
                            <Badge variant="secondary" className="text-xs font-semibold bg-purple-100 text-purple-800">
                              Ukuran: {tagihan.ukuran}
                            </Badge>
                          )}
                          {tagihan.status === "menunggu_verifikasi" && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 text-xs gap-1 animate-pulse">
                              <Clock className="h-3 w-3" />
                              Sedang Diverifikasi
                            </Badge>
                          )}
                          {tagihan.status === "ditolak" && (
                            <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 text-xs gap-1">
                              <XCircle className="h-3 w-3" />
                              Ditolak (Upload Ulang)
                            </Badge>
                          )}
                          {tagihan.status === "belum_bayar" && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 text-xs gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Belum Bayar
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-bold text-purple-700">
                          {formatRupiah(tagihan.nominal)}
                        </p>
                        {tagihan.keterangan && (
                          <p className="text-xs text-gray-500">{tagihan.keterangan}</p>
                        )}
                        {tagihan.status === "ditolak" && tagihan.catatanPetugas && (
                          <p className="text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-100">
                            Alasan ditolak: {tagihan.catatanPetugas}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className={`gap-1.5 w-full sm:w-auto ${
                            tagihan.status === "menunggu_verifikasi"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-purple-600 hover:bg-purple-700"
                          } text-white`}
                          onClick={() => handleOpenSeragamPayment(tagihan)}
                        >
                          <Receipt className="h-4 w-4" />
                          {tagihan.status === "menunggu_verifikasi"
                            ? "Lihat Bukti & Status"
                            : tagihan.status === "ditolak"
                              ? "Upload Bukti Ulang"
                              : "Bayar / Upload Bukti"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========== PEMBERITAHUAN TAGIHAN BUKU PAKET / KITAB KUNING ========== */}
          {tagihanBukuPaketPending.length > 0 && (
            <Card className="mt-4 border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 via-indigo-50/70 to-blue-50/50 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-indigo-900">
                    <div className="p-2 bg-indigo-200/70 rounded-lg">
                      <BookOpen className="h-5 w-5 text-indigo-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-indigo-950 font-bold">
                        Tagihan Buku Paket & Kitab Kuning
                      </CardTitle>
                      <CardDescription className="text-xs text-indigo-800">
                        Tagihan modul pelajaran & kitab santri. Mohon lakukan pembayaran dan unggah bukti transfer.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">
                    {tagihanBukuPaketPending.length} Tagihan
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="divide-y divide-indigo-200/60 rounded-xl bg-white/80 border border-indigo-200/80 overflow-hidden">
                  {tagihanBukuPaketPending.map((tagihan) => (
                    <div
                      key={tagihan.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-indigo-50/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">
                            {tagihan.santriName}
                          </p>
                          {tagihan.tingkatKelas && (
                            <Badge variant="outline" className="text-xs font-normal border-indigo-300 text-indigo-700">
                              {tagihan.tingkatKelas}
                            </Badge>
                          )}
                          {tagihan.tahunAjaran && (
                            <Badge variant="secondary" className="text-xs font-semibold bg-indigo-100 text-indigo-800">
                              T.A {tagihan.tahunAjaran}
                            </Badge>
                          )}
                          {tagihan.status === "menunggu_verifikasi" && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 text-xs gap-1 animate-pulse">
                              <Clock className="h-3 w-3" />
                              Sedang Diverifikasi
                            </Badge>
                          )}
                          {tagihan.status === "ditolak" && (
                            <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 text-xs gap-1">
                              <XCircle className="h-3 w-3" />
                              Ditolak (Upload Ulang)
                            </Badge>
                          )}
                          {tagihan.status === "belum_bayar" && (
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100 text-xs gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Belum Bayar
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-bold text-indigo-700">
                          {formatRupiah(tagihan.nominal)}
                        </p>
                        {tagihan.keterangan && (
                          <p className="text-xs text-gray-500">{tagihan.keterangan}</p>
                        )}
                        {tagihan.status === "ditolak" && tagihan.catatanPetugas && (
                          <p className="text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-100">
                            Alasan ditolak: {tagihan.catatanPetugas}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className={`gap-1.5 w-full sm:w-auto ${
                            tagihan.status === "menunggu_verifikasi"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          } text-white`}
                          onClick={() => handleOpenBukuPaketPayment(tagihan)}
                        >
                          <Receipt className="h-4 w-4" />
                          {tagihan.status === "menunggu_verifikasi"
                            ? "Lihat Bukti & Status"
                            : tagihan.status === "ditolak"
                              ? "Upload Bukti Ulang"
                              : "Bayar / Upload Bukti"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========== PEMBERITAHUAN TAGIHAN LAUNDRY SANTRI ========== */}
          {tagihanLaundryPending.length > 0 && (
            <Card className="mt-4 border-2 border-cyan-300 bg-gradient-to-r from-cyan-50 via-cyan-50/70 to-blue-50/50 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-cyan-900">
                    <div className="p-2 bg-cyan-200/70 rounded-lg">
                      <Receipt className="h-5 w-5 text-cyan-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-cyan-950 font-bold">
                        Tagihan Laundry Santri
                      </CardTitle>
                      <CardDescription className="text-xs text-cyan-800">
                        Tagihan iuran bulanan layanan cuci & setrika santri. Mohon lakukan pembayaran dan unggah bukti transfer.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-cyan-600 text-white hover:bg-cyan-700">
                    {tagihanLaundryPending.length} Tagihan
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="divide-y divide-cyan-200/60 rounded-xl bg-white/80 border border-cyan-200/80 overflow-hidden">
                  {tagihanLaundryPending.map((tagihan) => (
                    <div
                      key={tagihan.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-cyan-50/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">
                            {tagihan.santriName}
                          </p>
                          <Badge variant="outline" className="text-xs font-normal border-cyan-300 text-cyan-700">
                            Laundry {tagihan.bulan} {tagihan.tahun}
                          </Badge>
                          {tagihan.status === "menunggu_verifikasi" && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 text-xs gap-1 animate-pulse">
                              <Clock className="h-3 w-3" />
                              Sedang Diverifikasi
                            </Badge>
                          )}
                          {tagihan.status === "ditolak" && (
                            <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 text-xs gap-1">
                              <XCircle className="h-3 w-3" />
                              Ditolak (Upload Ulang)
                            </Badge>
                          )}
                          {tagihan.status === "belum_bayar" && (
                            <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-100 text-xs gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Belum Bayar
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-bold text-cyan-700">
                          {formatRupiah(tagihan.nominal)}
                        </p>
                        {tagihan.namaPaket && (
                          <p className="text-xs text-gray-500">{tagihan.namaPaket}</p>
                        )}
                        {tagihan.status === "ditolak" && tagihan.catatanPetugas && (
                          <p className="text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-100">
                            Alasan ditolak: {tagihan.catatanPetugas}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className={`gap-1.5 w-full sm:w-auto ${
                            tagihan.status === "menunggu_verifikasi"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-cyan-600 hover:bg-cyan-700"
                          } text-white`}
                          onClick={() => handleOpenLaundryPayment(tagihan)}
                        >
                          <Receipt className="h-4 w-4" />
                          {tagihan.status === "menunggu_verifikasi"
                            ? "Lihat Bukti & Status"
                            : tagihan.status === "ditolak"
                              ? "Upload Bukti Ulang"
                              : "Bayar / Upload Bukti"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Info Cards */}
          {santriList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {santriList.map((santri) => (
                <Card
                  key={santri.id}
                  className="bg-gradient-to-br from-primary/5 to-secondary/5"
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {santri.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            NIS: {santri.nis || "-"}
                          </Badge>
                          {santri.currentClass && (
                            <Badge className="text-xs flex gap-1 items-center bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
                              <GraduationCap className="w-3 h-3" />
                              Kelas {santri.currentClass}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="flex gap-1 items-center bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                            <Wallet className="w-3 h-3" />
                            {formatRupiah(saldoMap[santri.id] || 0)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-primary border-primary/20 hover:bg-primary/5"
                      onClick={() => handleOpenRiwayat(santri)}
                    >
                      <History className="w-4 h-4 mr-2" /> Riwayat Saldo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reports Feed */}
        {reports.length === 0 ? (
          <div className="space-y-6">
            <Card className="text-center py-10 px-4 shadow-sm border-dashed">
              <CardContent className="space-y-5 max-w-lg mx-auto p-0">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                  <BookOpen className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Belum Ada Laporan
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Laporan perkembangan santri akan muncul di sini setelah diinput oleh Guru / Ustadzah pengampu.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/chat">
                    <Button className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90">
                      <MessageCircle className="w-4 h-4" />
                      Chat Guru
                    </Button>
                  </Link>
                  {santriList.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto gap-2 border-primary/20 text-primary hover:bg-primary/5"
                      onClick={() => handleOpenRiwayat(santriList[0])}
                    >
                      <Wallet className="w-4 h-4" />
                      Riwayat Saldo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Feature Highlights Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/80 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-3">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">Hafalan Al-Qur'an</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Pantau perkembangan capaian hafalan surat & kelancaran ayat santri secara real-time.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">Nilai Akademik</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Evaluasi hasil belajar mata pelajaran santri yang diberikan oleh pengajar.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">Catatan Perilaku</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Informasi mengenai kedisiplinan, prestasi, dan perkembangan karakter santri.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="semua" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1">
              <TabsTrigger value="semua">Semua</TabsTrigger>
              <TabsTrigger value="hafalan">Hafalan</TabsTrigger>
              <TabsTrigger value="akademik">Akademik</TabsTrigger>
              <TabsTrigger value="perilaku">Perilaku</TabsTrigger>
            </TabsList>

            <TabsContent value="semua" className="space-y-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </TabsContent>

            <TabsContent value="hafalan" className="space-y-4">
              {reports
                .filter((r) => r.kategori === "hafalan")
                .map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              {reports.filter((r) => r.kategori === "hafalan").length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Belum Ada Laporan Hafalan
                    </h3>
                    <p className="text-gray-600">
                      Laporan hafalan Qur'an santri akan muncul di sini
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="akademik" className="space-y-4">
              {reports
                .filter((r) => r.kategori === "akademik")
                .map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              {reports.filter((r) => r.kategori === "akademik").length ===
                0 && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Belum Ada Laporan Akademik
                      </h3>
                      <p className="text-gray-600">
                        Laporan akademik santri akan muncul di sini
                      </p>
                    </CardContent>
                  </Card>
                )}
            </TabsContent>

            <TabsContent value="perilaku" className="space-y-4">
              {reports
                .filter((r) => r.kategori === "perilaku")
                .map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              {reports.filter((r) => r.kategori === "perilaku").length ===
                0 && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Belum Ada Laporan Perilaku
                      </h3>
                      <p className="text-gray-600">
                        Laporan perilaku santri akan muncul di sini
                      </p>
                    </CardContent>
                  </Card>
                )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* ========== MODAL DETAIL SURAT PERINGATAN / TEGURAN ========== */}
      <Dialog
        open={isPeringatanModalOpen}
        onOpenChange={setIsPeringatanModalOpen}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-2 border-rose-300">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-900">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Surat Peringatan & Teguran Resmi
            </DialogTitle>
            <DialogDescription className="text-rose-800 text-xs">
              Pemberitahuan resmi dari Bagian Keuangan / Pesantren mengenai keterlambatan pembayaran tagihan santri.
            </DialogDescription>
          </DialogHeader>

          {selectedPeringatan && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-rose-50/80 p-4 space-y-2 border border-rose-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Santri</span>
                  <span className="font-semibold text-gray-900">
                    {selectedPeringatan.santriName}
                  </span>
                </div>
                {selectedPeringatan.santriNis && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">NIS</span>
                    <span className="font-medium text-gray-700">
                      {selectedPeringatan.santriNis}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Tingkat Peringatan</span>
                  <Badge
                    className={`font-bold uppercase tracking-wider ${
                      selectedPeringatan.tingkatPeringatan === "sp3"
                        ? "bg-red-600 text-white"
                        : selectedPeringatan.tingkatPeringatan === "sp2"
                          ? "bg-orange-600 text-white"
                          : selectedPeringatan.tingkatPeringatan === "sp1"
                            ? "bg-amber-500 text-white"
                            : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {selectedPeringatan.tingkatPeringatan
                      ? selectedPeringatan.tingkatPeringatan.toUpperCase()
                      : "PERINGATAN"}
                  </Badge>
                </div>
                {selectedPeringatan.jenisTagihan && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Jenis Tagihan</span>
                    <span className="font-medium text-gray-800">
                      {selectedPeringatan.jenisTagihan}
                    </span>
                  </div>
                )}
                {selectedPeringatan.nominalTunggakan ? (
                  <div className="flex justify-between items-center text-sm pt-1 border-t border-rose-200">
                    <span className="font-medium text-gray-700">Total Nominal Tunggakan</span>
                    <span className="font-bold text-lg text-rose-700">
                      {formatRupiah(selectedPeringatan.nominalTunggakan)}
                    </span>
                  </div>
                ) : null}
                {selectedPeringatan.batasWaktu && (
                  <div className="flex justify-between items-center text-sm pt-1 border-t border-rose-200">
                    <span className="font-semibold text-rose-800">Batas Waktu Settlement</span>
                    <span className="font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded text-xs">
                      {selectedPeringatan.batasWaktu}
                    </span>
                  </div>
                )}
              </div>

              {/* Isi Surat / Pesan Peringatan */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Judul: {selectedPeringatan.judul}
                </p>
                <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 font-sans">
                  {selectedPeringatan.pesan}
                </div>
                {selectedPeringatan.createdByName && (
                  <p className="text-xs text-muted-foreground text-right italic pt-1">
                    Diterbitkan oleh: {selectedPeringatan.createdByName} (Petugas Pesantren)
                  </p>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  onClick={() => setIsPeringatanModalOpen(false)}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Saya Mengerti & Tutup
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== MODAL PEMBAYARAN & UPLOAD BUKTI LAUNDRY SANTRI ========== */}
      <Dialog open={isLaundryModalOpen} onOpenChange={setIsLaundryModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-cyan-600" />
              Pembayaran Laundry Santri
            </DialogTitle>
            <DialogDescription>
              Tagihan iuran laundry santri bulanan. Silakan transfer ke rekening resmi pesantren dan unggah bukti transfer.
            </DialogDescription>
          </DialogHeader>

          {selectedLaundryTagihan && (
            <form onSubmit={handleSubmitLaundry} className="space-y-5 pt-2">
              {/* Detail Tagihan */}
              <div className="rounded-xl bg-cyan-50/60 p-4 space-y-2 border border-cyan-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Santri</span>
                  <span className="font-semibold text-gray-900">
                    {selectedLaundryTagihan.santriName}
                  </span>
                </div>
                {selectedLaundryTagihan.santriNis && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">NIS</span>
                    <span className="font-medium text-gray-700">{selectedLaundryTagihan.santriNis}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Periode Tagihan</span>
                  <span className="font-medium text-gray-700">
                    {selectedLaundryTagihan.bulan} {selectedLaundryTagihan.tahun}
                  </span>
                </div>
                {selectedLaundryTagihan.namaPaket && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Nama Paket</span>
                    <Badge variant="outline" className="font-medium border-cyan-300 text-cyan-800">
                      {selectedLaundryTagihan.namaPaket}
                    </Badge>
                  </div>
                )}
                {selectedLaundryTagihan.kuotaKg && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Kuota Kuota / Bulan</span>
                    <span className="font-semibold text-cyan-800">
                      {selectedLaundryTagihan.kuotaKg} Kg
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-cyan-200">
                  <span className="font-medium text-gray-700">Total Pembayaran</span>
                  <span className="font-bold text-lg text-cyan-700">
                    {formatRupiah(selectedLaundryTagihan.nominal)}
                  </span>
                </div>
              </div>

              {/* Rekening Pesantren Card */}
              <div className="rounded-xl border-2 border-cyan-200 bg-cyan-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-cyan-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-800">
                      Rekening Resmi Pesantren
                    </span>
                  </div>
                  <Badge variant="outline" className="border-cyan-300 text-cyan-800 bg-white">
                    {laundrySettings.bankName}
                  </Badge>
                </div>

                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-cyan-200">
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor Rekening</p>
                    <p className="text-lg font-bold text-gray-900 font-mono tracking-wide">
                      {laundrySettings.accountNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      a.n. {laundrySettings.accountHolder}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLaundryRekening}
                    className="gap-1.5 border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                  >
                    {copiedLaundryRekening ? (
                      <>
                        <Check className="h-4 w-4 text-cyan-600" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Salin
                      </>
                    )}
                  </Button>
                </div>

                {laundrySettings.keterangan && (
                  <p className="text-xs text-cyan-800/90 italic">
                    ℹ️ {laundrySettings.keterangan}
                  </p>
                )}
              </div>

              {/* Status Info */}
              {selectedLaundryTagihan.status === "menunggu_verifikasi" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-sm text-blue-900">
                  <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Bukti Pembayaran Sudah Terkirim</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Petugas sedang memverifikasi pembayaran iuran laundry Anda. Anda dapat mengunggah bukti baru jika ingin memperbarui.
                    </p>
                  </div>
                </div>
              )}

              {selectedLaundryTagihan.status === "ditolak" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-900">
                  <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Pembayaran Sebelumnya Ditolak</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      {selectedLaundryTagihan.catatanPetugas || "Silakan periksa kembali nominal transfer dan unggah bukti pembayaran yang valid."}
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Input */}
              <div className="space-y-2">
                <Label htmlFor="buktiLaundryUpload" className="text-sm font-semibold">
                  Upload Bukti Transfer / Pembayaran:
                </Label>
                <div className="border-2 border-dashed border-cyan-200 hover:border-cyan-400/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white">
                  <input
                    id="buktiLaundryUpload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleLaundryFileChange}
                  />
                  <label htmlFor="buktiLaundryUpload" className="cursor-pointer block">
                    <UploadCloud className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      {buktiLaundryFileName || "Klik untuk memilih foto / screenshot bukti transfer"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: JPG, PNG, WebP (Maks. 5MB)
                    </p>
                  </label>
                </div>

                {/* Preview Image */}
                {buktiLaundryBase64 && (
                  <div className="relative mt-2 p-2 border rounded-xl bg-gray-50 flex items-center justify-center">
                    <img
                      src={buktiLaundryBase64}
                      alt="Pratinjau Bukti Laundry"
                      className="max-h-48 rounded object-contain cursor-pointer"
                      onClick={() => setPreviewLaundryModal(buktiLaundryBase64)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-xs bg-white/80 shadow-sm"
                      onClick={() => {
                        setBuktiLaundryBase64("");
                        setBuktiLaundryFileName("");
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                )}
              </div>

              {/* Catatan Orang Tua */}
              <div className="space-y-2">
                <Label htmlFor="catatanLaundry" className="text-sm">
                  Catatan Tambahan (Opsional):
                </Label>
                <Textarea
                  id="catatanLaundry"
                  placeholder="Contoh: Pembayaran laundry bulan September"
                  value={catatanLaundry}
                  onChange={(e) => setCatatanLaundry(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Footer */}
              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLaundryModalOpen(false)}
                  disabled={isSubmittingLaundry}
                >
                  Tutup
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingLaundry || !buktiLaundryBase64}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  {isSubmittingLaundry
                    ? "Mengirim..."
                    : selectedLaundryTagihan.status === "menunggu_verifikasi"
                      ? "Kirim Ulang Bukti"
                      : "Kirim Bukti Pembayaran"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Image Preview Modal - Laundry */}
      <Dialog
        open={!!previewLaundryModal}
        onOpenChange={(open) => !open && setPreviewLaundryModal(null)}
      >
        <DialogContent className="max-w-2xl p-4">
          <DialogHeader>
            <DialogTitle>Bukti Pembayaran Laundry</DialogTitle>
          </DialogHeader>
          {previewLaundryModal && (
            <div className="flex items-center justify-center p-2 bg-black/5 rounded-lg max-h-[75vh] overflow-auto">
              <img
                src={previewLaundryModal}
                alt="Bukti Transfer Laundry"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== MODAL PEMBAYARAN & UPLOAD BUKTI BUKU PAKET / KITAB KUNING ========== */}
      <Dialog open={isBukuPaketModalOpen} onOpenChange={setIsBukuPaketModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Pembayaran Buku Paket & Kitab Kuning
            </DialogTitle>
            <DialogDescription>
              Tagihan paket modul & kitab santri. Silakan transfer ke rekening resmi pesantren dan unggah bukti transfer.
            </DialogDescription>
          </DialogHeader>

          {selectedBukuPaketTagihan && (
            <form onSubmit={handleSubmitBukuPaket} className="space-y-5 pt-2">
              {/* Detail Tagihan */}
              <div className="rounded-xl bg-indigo-50/60 p-4 space-y-2 border border-indigo-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Santri</span>
                  <span className="font-semibold text-gray-900">
                    {selectedBukuPaketTagihan.santriName}
                  </span>
                </div>
                {selectedBukuPaketTagihan.santriNis && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">NIS</span>
                    <span className="font-medium text-gray-700">{selectedBukuPaketTagihan.santriNis}</span>
                  </div>
                )}
                {selectedBukuPaketTagihan.tingkatKelas && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tingkat Kelas</span>
                    <Badge variant="outline" className="font-bold border-indigo-300 text-indigo-800">
                      {selectedBukuPaketTagihan.tingkatKelas}
                    </Badge>
                  </div>
                )}
                {selectedBukuPaketTagihan.tahunAjaran && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tahun Ajaran</span>
                    <span className="font-medium text-gray-700">{selectedBukuPaketTagihan.tahunAjaran}</span>
                  </div>
                )}
                {/* Daftar Buku */}
                {selectedBukuPaketTagihan.daftarBuku && selectedBukuPaketTagihan.daftarBuku.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-indigo-200/80">
                    <p className="text-xs font-semibold text-indigo-800 mb-1.5">Daftar Buku & Kitab Kuning:</p>
                    <div className="space-y-1">
                      {selectedBukuPaketTagihan.daftarBuku.map((bukuName, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-600">
                          <span>• {bukuName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-indigo-200">
                  <span className="font-medium text-gray-700">Total Pembayaran</span>
                  <span className="font-bold text-lg text-indigo-700">
                    {formatRupiah(selectedBukuPaketTagihan.nominal)}
                  </span>
                </div>
              </div>

              {/* Rekening Pesantren Card */}
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-indigo-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                      Rekening Resmi Pesantren
                    </span>
                  </div>
                  <Badge variant="outline" className="border-indigo-300 text-indigo-800 bg-white">
                    {bukuPaketSettings.bankName}
                  </Badge>
                </div>

                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-indigo-200">
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor Rekening</p>
                    <p className="text-lg font-bold text-gray-900 font-mono tracking-wide">
                      {bukuPaketSettings.accountNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      a.n. {bukuPaketSettings.accountHolder}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBukuPaketRekening}
                    className="gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  >
                    {copiedBukuPaketRekening ? (
                      <>
                        <Check className="h-4 w-4 text-indigo-600" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Salin
                      </>
                    )}
                  </Button>
                </div>

                {bukuPaketSettings.keterangan && (
                  <p className="text-xs text-indigo-800/90 italic">
                    ℹ️ {bukuPaketSettings.keterangan}
                  </p>
                )}
              </div>

              {/* Status Info */}
              {selectedBukuPaketTagihan.status === "menunggu_verifikasi" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-sm text-blue-900">
                  <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Bukti Pembayaran Sudah Terkirim</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Petugas sedang memverifikasi pembayaran buku paket/kitab Anda. Anda dapat mengunggah bukti baru jika ingin memperbarui.
                    </p>
                  </div>
                </div>
              )}

              {selectedBukuPaketTagihan.status === "ditolak" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-900">
                  <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Pembayaran Sebelumnya Ditolak</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      {selectedBukuPaketTagihan.catatanPetugas || "Silakan periksa kembali nominal transfer dan unggah bukti pembayaran yang valid."}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Pengambilan Info */}
              {selectedBukuPaketTagihan.statusPengambilan && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-indigo-700" />
                    <span>Status Pengambilan Fisik Buku/Kitab:</span>
                  </div>
                  <Badge variant="outline" className="border-indigo-300 text-indigo-800 font-semibold bg-white">
                    {selectedBukuPaketTagihan.statusPengambilan === "sudah_diambil"
                      ? "Sudah Diambil"
                      : selectedBukuPaketTagihan.statusPengambilan === "siap_diambil"
                        ? "Siap Diambil di Pesantren"
                        : "Belum Diambil"}
                  </Badge>
                </div>
              )}

              {/* Upload Input */}
              <div className="space-y-2">
                <Label htmlFor="buktiBukuPaketUpload" className="text-sm font-semibold">
                  Upload Bukti Transfer / Pembayaran:
                </Label>
                <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white">
                  <input
                    id="buktiBukuPaketUpload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleBukuPaketFileChange}
                  />
                  <label htmlFor="buktiBukuPaketUpload" className="cursor-pointer block">
                    <UploadCloud className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      {buktiBukuPaketFileName || "Klik untuk memilih foto / screenshot bukti transfer"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: JPG, PNG, WebP (Maks. 5MB)
                    </p>
                  </label>
                </div>

                {/* Preview Image */}
                {buktiBukuPaketBase64 && (
                  <div className="relative mt-2 p-2 border rounded-xl bg-gray-50 flex items-center justify-center">
                    <img
                      src={buktiBukuPaketBase64}
                      alt="Pratinjau Bukti Buku Paket"
                      className="max-h-48 rounded object-contain cursor-pointer"
                      onClick={() => setPreviewBukuPaketModal(buktiBukuPaketBase64)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-xs bg-white/80 shadow-sm"
                      onClick={() => {
                        setBuktiBukuPaketBase64("");
                        setBuktiBukuPaketFileName("");
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                )}
              </div>

              {/* Catatan Orang Tua */}
              <div className="space-y-2">
                <Label htmlFor="catatanBukuPaket" className="text-sm">
                  Catatan Tambahan (Opsional):
                </Label>
                <Textarea
                  id="catatanBukuPaket"
                  placeholder="Contoh: Pembayaran paket kitab kelas 7"
                  value={catatanBukuPaket}
                  onChange={(e) => setCatatanBukuPaket(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Footer */}
              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBukuPaketModalOpen(false)}
                  disabled={isSubmittingBukuPaket}
                >
                  Tutup
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingBukuPaket || !buktiBukuPaketBase64}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  {isSubmittingBukuPaket
                    ? "Mengirim..."
                    : selectedBukuPaketTagihan.status === "menunggu_verifikasi"
                      ? "Kirim Ulang Bukti"
                      : "Kirim Bukti Pembayaran"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Image Preview Modal - Buku Paket */}
      <Dialog
        open={!!previewBukuPaketModal}
        onOpenChange={(open) => !open && setPreviewBukuPaketModal(null)}
      >
        <DialogContent className="max-w-2xl p-4">
          <DialogHeader>
            <DialogTitle>Bukti Pembayaran Buku Paket & Kitab</DialogTitle>
          </DialogHeader>
          {previewBukuPaketModal && (
            <div className="flex items-center justify-center p-2 bg-black/5 rounded-lg max-h-[75vh] overflow-auto">
              <img
                src={previewBukuPaketModal}
                alt="Bukti Transfer Buku Paket"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== MODAL PEMBAYARAN & UPLOAD BUKTI SERAGAM ========== */}
      <Dialog open={isSeragamModalOpen} onOpenChange={setIsSeragamModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shirt className="h-5 w-5 text-purple-600" />
              Pembayaran Seragam Santri
            </DialogTitle>
            <DialogDescription>
              Tagihan paket seragam santri. Silakan transfer ke rekening resmi pesantren dan unggah bukti transfer.
            </DialogDescription>
          </DialogHeader>

          {selectedSeragamTagihan && (
            <form onSubmit={handleSubmitSeragam} className="space-y-5 pt-2">
              {/* Detail Tagihan */}
              <div className="rounded-xl bg-purple-50/60 p-4 space-y-2 border border-purple-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Santri</span>
                  <span className="font-semibold text-gray-900">
                    {selectedSeragamTagihan.santriName}
                  </span>
                </div>
                {selectedSeragamTagihan.santriNis && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">NIS</span>
                    <span className="font-medium text-gray-700">{selectedSeragamTagihan.santriNis}</span>
                  </div>
                )}
                {selectedSeragamTagihan.ukuran && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Ukuran Seragam</span>
                    <Badge variant="outline" className="font-bold border-purple-300 text-purple-800">
                      {selectedSeragamTagihan.ukuran}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Tahun Pemesanan</span>
                  <span className="font-medium text-gray-700">{selectedSeragamTagihan.tahun}</span>
                </div>
                {/* Rincian Paket */}
                {selectedSeragamTagihan.rincianPaket && selectedSeragamTagihan.rincianPaket.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-purple-200/80">
                    <p className="text-xs font-semibold text-purple-800 mb-1.5">Rincian Isi Paket Seragam:</p>
                    <div className="space-y-1">
                      {selectedSeragamTagihan.rincianPaket.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-600">
                          <span>• {item.nama}</span>
                          <span className="font-medium">{item.jumlah} Pcs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-purple-200">
                  <span className="font-medium text-gray-700">Total Pembayaran</span>
                  <span className="font-bold text-lg text-purple-700">
                    {formatRupiah(selectedSeragamTagihan.nominal)}
                  </span>
                </div>
              </div>

              {/* Rekening Pesantren Card */}
              <div className="rounded-xl border-2 border-purple-200 bg-purple-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-purple-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                      Rekening Resmi Pesantren
                    </span>
                  </div>
                  <Badge variant="outline" className="border-purple-300 text-purple-800 bg-white">
                    {seragamSettings.bankName}
                  </Badge>
                </div>

                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-200">
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor Rekening</p>
                    <p className="text-lg font-bold text-gray-900 font-mono tracking-wide">
                      {seragamSettings.accountNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      a.n. {seragamSettings.accountHolder}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopySeragamRekening}
                    className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    {copiedSeragamRekening ? (
                      <>
                        <Check className="h-4 w-4 text-purple-600" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Salin
                      </>
                    )}
                  </Button>
                </div>

                {seragamSettings.keterangan && (
                  <p className="text-xs text-purple-800/90 italic">
                    ℹ️ {seragamSettings.keterangan}
                  </p>
                )}
              </div>

              {/* Status Info */}
              {selectedSeragamTagihan.status === "menunggu_verifikasi" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-sm text-blue-900">
                  <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Bukti Pembayaran Sudah Terkirim</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Petugas sedang memverifikasi pembayaran seragam Anda. Anda dapat mengunggah bukti baru jika ingin memperbarui.
                    </p>
                  </div>
                </div>
              )}

              {selectedSeragamTagihan.status === "ditolak" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-900">
                  <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Pembayaran Sebelumnya Ditolak</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      {selectedSeragamTagihan.catatanPetugas || "Silakan periksa kembali nominal transfer dan unggah bukti pembayaran yang valid."}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Pengambilan Info */}
              {selectedSeragamTagihan.statusPengambilan && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-700" />
                    <span>Status Pengambilan Fisik Seragam:</span>
                  </div>
                  <Badge variant="outline" className="border-purple-300 text-purple-800 font-semibold bg-white">
                    {selectedSeragamTagihan.statusPengambilan === "sudah_diambil"
                      ? "Sudah Diambil"
                      : selectedSeragamTagihan.statusPengambilan === "siap_diambil"
                        ? "Siap Diambil di Pesantren"
                        : "Belum Diambil"}
                  </Badge>
                </div>
              )}

              {/* Upload Input */}
              <div className="space-y-2">
                <Label htmlFor="buktiSeragamUpload" className="text-sm font-semibold">
                  Upload Bukti Transfer / Pembayaran:
                </Label>
                <div className="border-2 border-dashed border-purple-200 hover:border-purple-400/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white">
                  <input
                    id="buktiSeragamUpload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleSeragamFileChange}
                  />
                  <label htmlFor="buktiSeragamUpload" className="cursor-pointer block">
                    <UploadCloud className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      {buktiSeragamFileName || "Klik untuk memilih foto / screenshot bukti transfer"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: JPG, PNG, WebP (Maks. 5MB)
                    </p>
                  </label>
                </div>

                {/* Preview Image */}
                {buktiSeragamBase64 && (
                  <div className="relative mt-2 p-2 border rounded-xl bg-gray-50 flex items-center justify-center">
                    <img
                      src={buktiSeragamBase64}
                      alt="Pratinjau Bukti Seragam"
                      className="max-h-48 rounded object-contain cursor-pointer"
                      onClick={() => setPreviewSeragamModal(buktiSeragamBase64)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-xs bg-white/80 shadow-sm"
                      onClick={() => {
                        setBuktiSeragamBase64("");
                        setBuktiSeragamFileName("");
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                )}
              </div>

              {/* Catatan Orang Tua */}
              <div className="space-y-2">
                <Label htmlFor="catatanSeragam" className="text-sm">
                  Catatan Tambahan (Opsional):
                </Label>
                <Textarea
                  id="catatanSeragam"
                  placeholder="Contoh: Ukuran baju yang diinginkan L"
                  value={catatanSeragam}
                  onChange={(e) => setCatatanSeragam(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Footer */}
              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSeragamModalOpen(false)}
                  disabled={isSubmittingSeragam}
                >
                  Tutup
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingSeragam || !buktiSeragamBase64}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  {isSubmittingSeragam
                    ? "Mengirim..."
                    : selectedSeragamTagihan.status === "menunggu_verifikasi"
                      ? "Kirim Ulang Bukti"
                      : "Kirim Bukti Pembayaran"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Image Preview Modal - Seragam */}
      <Dialog
        open={!!previewSeragamModal}
        onOpenChange={(open) => !open && setPreviewSeragamModal(null)}
      >
        <DialogContent className="max-w-2xl p-4">
          <DialogHeader>
            <DialogTitle>Bukti Pembayaran Seragam</DialogTitle>
          </DialogHeader>
          {previewSeragamModal && (
            <div className="flex items-center justify-center p-2 bg-black/5 rounded-lg max-h-[75vh] overflow-auto">
              <img
                src={previewSeragamModal}
                alt="Bukti Transfer Seragam"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== MODAL PEMBAYARAN & UPLOAD BUKTI UANG MASUK ========== */}
      <Dialog open={isUangMasukModalOpen} onOpenChange={setIsUangMasukModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-teal-600" />
              Pembayaran Uang Masuk Pesantren
            </DialogTitle>
            <DialogDescription>
              Tagihan 1x bayar uang masuk pesantren. Silakan transfer ke rekening resmi dan unggah bukti.
            </DialogDescription>
          </DialogHeader>

          {selectedUangMasukTagihan && (
            <form onSubmit={handleSubmitUangMasuk} className="space-y-5 pt-2">
              {/* Detail Tagihan */}
              <div className="rounded-xl bg-teal-50/60 p-4 space-y-2 border border-teal-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Santri</span>
                  <span className="font-semibold text-gray-900">
                    {selectedUangMasukTagihan.santriName}
                  </span>
                </div>
                {selectedUangMasukTagihan.santriNis && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">NIS</span>
                    <span className="font-medium text-gray-700">{selectedUangMasukTagihan.santriNis}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Tahun Masuk</span>
                  <span className="font-medium text-gray-700">{selectedUangMasukTagihan.tahun}</span>
                </div>
                {/* Rincian Biaya */}
                {selectedUangMasukTagihan.rincianBiaya && selectedUangMasukTagihan.rincianBiaya.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-teal-200/80">
                    <p className="text-xs font-semibold text-teal-800 mb-1.5">Rincian Biaya:</p>
                    <div className="space-y-1">
                      {selectedUangMasukTagihan.rincianBiaya.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-600">
                          <span>• {item.nama}</span>
                          <span className="font-medium">{formatRupiah(item.nominal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-teal-200">
                  <span className="font-medium text-gray-700">Total Pembayaran</span>
                  <span className="font-bold text-lg text-teal-700">
                    {formatRupiah(selectedUangMasukTagihan.nominal)}
                  </span>
                </div>
              </div>

              {/* Rekening Pesantren Card */}
              <div className="rounded-xl border-2 border-teal-200 bg-teal-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-teal-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                      Rekening Resmi Pesantren
                    </span>
                  </div>
                  <Badge variant="outline" className="border-teal-300 text-teal-800 bg-white">
                    {uangMasukSettings.bankName}
                  </Badge>
                </div>

                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-teal-200">
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor Rekening</p>
                    <p className="text-lg font-bold text-gray-900 font-mono tracking-wide">
                      {uangMasukSettings.accountNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      a.n. {uangMasukSettings.accountHolder}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUangMasukRekening}
                    className="gap-1.5 border-teal-300 text-teal-700 hover:bg-teal-50"
                  >
                    {copiedUangMasukRekening ? (
                      <>
                        <Check className="h-4 w-4 text-teal-600" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Salin
                      </>
                    )}
                  </Button>
                </div>

                {uangMasukSettings.keterangan && (
                  <p className="text-xs text-teal-800/90 italic">
                    ℹ️ {uangMasukSettings.keterangan}
                  </p>
                )}
              </div>

              {/* Status Info */}
              {selectedUangMasukTagihan.status === "menunggu_verifikasi" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-sm text-blue-900">
                  <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Bukti Pembayaran Sudah Terkirim</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Petugas sedang memverifikasi pembayaran uang masuk Anda. Anda dapat mengunggah bukti baru jika ingin memperbarui.
                    </p>
                  </div>
                </div>
              )}

              {selectedUangMasukTagihan.status === "ditolak" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-900">
                  <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Pembayaran Sebelumnya Ditolak</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      {selectedUangMasukTagihan.catatanPetugas || "Silakan periksa kembali nominal transfer dan unggah bukti pembayaran yang valid."}
                    </p>
                  </div>
                </div>
              )}

              {/* Verifikasi info jika sudah ada bukti terverifikasi */}
              {selectedUangMasukTagihan.verifiedAt && selectedUangMasukTagihan.status === "menunggu_verifikasi" && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800">
                  <p className="font-medium">Diperiksa oleh: {selectedUangMasukTagihan.verifiedByName || "Petugas"}</p>
                  <p className="mt-0.5 text-teal-700">
                    {new Date(selectedUangMasukTagihan.verifiedAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              )}

              {/* Upload Input */}
              <div className="space-y-2">
                <Label htmlFor="buktiUangMasukUpload" className="text-sm font-semibold">
                  Upload Bukti Transfer / Pembayaran:
                </Label>
                <div className="border-2 border-dashed border-teal-200 hover:border-teal-400/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white">
                  <input
                    id="buktiUangMasukUpload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleUangMasukFileChange}
                  />
                  <label htmlFor="buktiUangMasukUpload" className="cursor-pointer block">
                    <UploadCloud className="h-8 w-8 text-teal-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      {buktiUangMasukFileName || "Klik untuk memilih foto / screenshot bukti transfer"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: JPG, PNG, WebP (Maks. 5MB)
                    </p>
                  </label>
                </div>

                {/* Preview Image */}
                {buktiUangMasukBase64 && (
                  <div className="relative mt-2 p-2 border rounded-xl bg-gray-50 flex items-center justify-center">
                    <img
                      src={buktiUangMasukBase64}
                      alt="Pratinjau Bukti Uang Masuk"
                      className="max-h-48 rounded object-contain cursor-pointer"
                      onClick={() => setPreviewUangMasukModal(buktiUangMasukBase64)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-xs bg-white/80 shadow-sm"
                      onClick={() => {
                        setBuktiUangMasukBase64("");
                        setBuktiUangMasukFileName("");
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                )}
              </div>

              {/* Catatan Orang Tua */}
              <div className="space-y-2">
                <Label htmlFor="catatanUangMasuk" className="text-sm">
                  Catatan Tambahan (Opsional):
                </Label>
                <Textarea
                  id="catatanUangMasuk"
                  placeholder="Contoh: Transfer dari rekening BCA a.n. Ayah Ahmad"
                  value={catatanUangMasuk}
                  onChange={(e) => setCatatanUangMasuk(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Footer */}
              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUangMasukModalOpen(false)}
                  disabled={isSubmittingUangMasuk}
                >
                  Tutup
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingUangMasuk || !buktiUangMasukBase64}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  {isSubmittingUangMasuk
                    ? "Mengirim..."
                    : selectedUangMasukTagihan.status === "menunggu_verifikasi"
                      ? "Kirim Ulang Bukti"
                      : "Kirim Bukti Pembayaran"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Image Preview Modal - Uang Masuk */}
      <Dialog
        open={!!previewUangMasukModal}
        onOpenChange={(open) => !open && setPreviewUangMasukModal(null)}
      >
        <DialogContent className="max-w-2xl p-4">
          <DialogHeader>
            <DialogTitle>Bukti Pembayaran Uang Masuk</DialogTitle>
          </DialogHeader>
          {previewUangMasukModal && (
            <div className="flex items-center justify-center p-2 bg-black/5 rounded-lg max-h-[75vh] overflow-auto">
              <img
                src={previewUangMasukModal}
                alt="Bukti Transfer Uang Masuk"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== MODAL PEMBAYARAN & UPLOAD BUKTI SPP ========== */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Pembayaran SPP Santri
            </DialogTitle>
            <DialogDescription>
              Silakan transfer sesuai nominal ke rekening resmi pesantren dan unggah bukti transfer.
            </DialogDescription>
          </DialogHeader>

          {selectedTagihan && (
            <form onSubmit={handleSubmitPayment} className="space-y-5 pt-2">
              {/* Detail Tagihan */}
              <div className="rounded-xl bg-muted/40 p-4 space-y-2 border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Santri</span>
                  <span className="font-semibold text-gray-900">
                    {selectedTagihan.santriName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Periode Tagihan</span>
                  <span className="font-semibold text-gray-900">
                    {selectedTagihan.bulan} {selectedTagihan.tahun}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t">
                  <span className="font-medium text-gray-700">Total Pembayaran</span>
                  <span className="font-bold text-lg text-emerald-600">
                    {formatRupiah(selectedTagihan.nominal)}
                  </span>
                </div>
              </div>

              {/* Rekening Pesantren Card */}
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-emerald-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Rekening Resmi Pesantren
                    </span>
                  </div>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-white">
                    {bankSettings.bankName}
                  </Badge>
                </div>

                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200">
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor Rekening</p>
                    <p className="text-lg font-bold text-gray-900 font-mono tracking-wide">
                      {bankSettings.accountNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      a.n. {bankSettings.accountHolder}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyRekening}
                    className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    {copiedRekening ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Salin
                      </>
                    )}
                  </Button>
                </div>

                {bankSettings.keterangan && (
                  <p className="text-xs text-emerald-800/90 italic">
                    ℹ️ {bankSettings.keterangan}
                  </p>
                )}
              </div>

              {/* Status Info */}
              {selectedTagihan.status === "menunggu_verifikasi" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-sm text-blue-900">
                  <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Bukti Pembayaran Sudah Terkirim</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Petugas sedang mengecek mutasi bank untuk menyetujui status lunas. Anda dapat mengunggah bukti baru jika ingin memperbarui.
                    </p>
                  </div>
                </div>
              )}

              {selectedTagihan.status === "ditolak" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-900">
                  <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Pembayaran Sebelumnya Ditolak</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      {selectedTagihan.catatanPetugas || "Silakan periksa kembali nominal transfer dan unggah bukti pembayaran yang valid."}
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Input */}
              <div className="space-y-2">
                <Label htmlFor="buktiUpload" className="text-sm font-semibold">
                  Upload Bukti Transfer / Pembayaran:
                </Label>
                <div className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white">
                  <input
                    id="buktiUpload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="buktiUpload" className="cursor-pointer block">
                    <UploadCloud className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      {buktiFileName || "Klik untuk memilih foto / screenshot bukti transfer"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: JPG, PNG, WebP (Maks. 5MB)
                    </p>
                  </label>
                </div>

                {/* Preview Image */}
                {buktiBase64 && (
                  <div className="relative mt-2 p-2 border rounded-xl bg-gray-50 flex items-center justify-center">
                    <img
                      src={buktiBase64}
                      alt="Pratinjau Bukti"
                      className="max-h-48 rounded object-contain cursor-pointer"
                      onClick={() => setPreviewBuktiModal(buktiBase64)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-xs bg-white/80 shadow-sm"
                      onClick={() => {
                        setBuktiBase64("");
                        setBuktiFileName("");
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                )}
              </div>

              {/* Catatan Orang Tua */}
              <div className="space-y-2">
                <Label htmlFor="catatan" className="text-sm">
                  Catatan Tambahan (Opsional):
                </Label>
                <Textarea
                  id="catatan"
                  placeholder="Contoh: Transfer dari rekening BCA a.n. Ayah Dinda"
                  value={catatanOrangTua}
                  onChange={(e) => setCatatanOrangTua(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Footer */}
              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={isSubmittingPayment}
                >
                  Tutup
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingPayment || !buktiBase64}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  {isSubmittingPayment
                    ? "Mengirim..."
                    : selectedTagihan.status === "menunggu_verifikasi"
                      ? "Kirim Ulang Bukti"
                      : "Kirim Bukti Pembayaran"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Riwayat Saldo */}
      <Dialog open={isRiwayatOpen} onOpenChange={setIsRiwayatOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Riwayat Saldo</DialogTitle>
            <DialogDescription>
              {selectedRiwayatSantri?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
            {isLoadingRiwayat ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : riwayatMutasi.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Belum ada riwayat transaksi</p>
              </div>
            ) : (
              riwayatMutasi.map((item) => (
                <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-full ${item.tipe === "tambah" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                      {item.tipe === "tambah" ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.keterangan}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(item.createdAt).toLocaleString("id-ID", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${item.tipe === "tambah" ? "text-green-600" : "text-red-600"}`}>
                      {item.tipe === "tambah" ? "+" : "-"}{formatRupiah(item.nominal)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sisa: {formatRupiah(item.saldoSesudah)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Image Preview Modal */}
      <Dialog
        open={!!previewBuktiModal}
        onOpenChange={(open) => !open && setPreviewBuktiModal(null)}
      >
        <DialogContent className="max-w-2xl p-4">
          <DialogHeader>
            <DialogTitle>Bukti Pembayaran</DialogTitle>
          </DialogHeader>
          {previewBuktiModal && (
            <div className="flex items-center justify-center p-2 bg-black/5 rounded-lg max-h-[75vh] overflow-auto">
              <img
                src={previewBuktiModal}
                alt="Bukti Transfer Penuh"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extract Report Card component for reusability
function ReportCard({ report }: { report: Report }) {
  const getReportIcon = (kategori: string) => {
    switch (kategori) {
      case "hafalan":
        return <BookOpen className="w-5 h-5 text-primary" />;
      case "akademik":
        return <GraduationCap className="w-5 h-5 text-secondary" />;
      case "perilaku":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getReportBadge = (kategori: string) => {
    switch (kategori) {
      case "hafalan":
        return (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            Hafalan
          </Badge>
        );
      case "akademik":
        return (
          <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/10">
            Akademik
          </Badge>
        );
      case "perilaku":
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            Perilaku
          </Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays < 7) return `${diffDays} hari yang lalu`;

      return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-white">
                {getUserInitials(report.santriName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{report.santriName}</p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>oleh {report.ustadzName}</span>
                <span>•</span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(report.createdAt || report.tanggal)}
                </span>
              </div>
            </div>
          </div>
          {getReportBadge(report.kategori)}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-start space-x-3">
          <div className="mt-1">{getReportIcon(report.kategori)}</div>
          <div className="flex-1">
            {/* Hafalan Report */}
            {report.kategori === "hafalan" && (
              <div className="space-y-2">
                <p className="font-medium">Hafalan: {report.isi.surat}</p>
                <p className="text-sm text-gray-600">Ayat {report.isi.ayat}</p>
                <div className="flex items-center space-x-2 pt-2">
                  {report.isi.predikat === "excellent" && (
                    <Badge className="bg-green-100 text-green-700">
                      <Award className="w-3 h-3 mr-1" />
                      Lancar
                    </Badge>
                  )}
                  {report.isi.predikat === "good" && (
                    <Badge className="bg-green-100 text-green-700">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Baik
                    </Badge>
                  )}
                  {report.isi.predikat === "fair" && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      Mengulang
                    </Badge>
                  )}
                  {report.isi.predikat === "poor" && (
                    <Badge className="bg-red-100 text-red-700">Kurang</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Academic Report */}
            {report.kategori === "akademik" && (
              <div className="space-y-2">
                <p className="font-medium">
                  Mata Pelajaran: {report.isi.mapel}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-green-600">
                    {report.isi.nilai}
                  </span>
                  <span className="text-gray-600">/ 100</span>
                </div>
              </div>
            )}

            {/* Behavior Report */}
            {report.kategori === "perilaku" && (
              <div className="space-y-2">
                <p className="font-medium">{report.isi.jenis}</p>
                <p className="text-sm text-gray-700">{report.isi.catatan}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Button at the bottom of each card */}
        <div className="mt-4 pt-4 border-t">
          <Link
            href={`/chat?userId=${report.ustadId}&userName=${encodeURIComponent(
              report.ustadzName
            )}`}
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 hover:bg-primary hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Tanyakan ke {report.ustadzName}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
