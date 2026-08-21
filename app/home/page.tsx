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

interface BankSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  defaultNominal: number;
  keterangan?: string;
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

  const handleOpenPayment = (tagihan: TagihanIuran) => {
    setSelectedTagihan(tagihan);
    setBuktiBase64(tagihan.buktiPembayaran || "");
    setBuktiFileName(tagihan.buktiFileName || "");
    setCatatanOrangTua(tagihan.catatanOrangTua || "");
    setIsPaymentModalOpen(true);
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
                Chat Ustadz
              </Button>
            </Link>
          </div>

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
                          className={`gap-1.5 w-full sm:w-auto ${
                            tagihan.status === "menunggu_verifikasi"
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
                    Laporan perkembangan santri akan muncul di sini setelah diinput oleh Ustadz / Ustadzah pengampu.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/chat">
                    <Button className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90">
                      <MessageCircle className="w-4 h-4" />
                      Chat Ustadz
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
