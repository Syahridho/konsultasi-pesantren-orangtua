"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  UserCheck,
  TrendingUp,
  GraduationCap,
  School,
  Wallet,
  CreditCard,
  Clock,
  Landmark,
  ShoppingBag,
  Droplets,
  FileWarning,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  DollarSign,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface FinanceModuleStat {
  totalLunas: number;
  pendingCount: number;
  totalBills: number;
}

interface RecentTransaction {
  id: string;
  santriName: string;
  jenis: string;
  keterangan: string;
  nominal: number;
  status: string;
  date: string;
  href: string;
}

interface AdminStats {
  totalUsers: number;
  totalSantri: number;
  santriLaki?: number;
  santriPerempuan?: number;
  totalUstad: number;
  totalOrangtua: number;
  totalPetugas?: number;
  totalClasses: number;
  activeClasses: number;
  totalChats: number;
  activeChats: number;
  newUsersThisMonth: number;
  ustadOnline: number;
  totalLaporan: number;
  laporanThisMonth: number;
  totalSaldo?: number;
  totalPendingVerifikasi?: number;
  totalPemasukanLunas?: number;
  totalPeringatanAktif?: number;
  finance?: {
    spp: FinanceModuleStat;
    uangMasuk: FinanceModuleStat;
    seragam: FinanceModuleStat;
    bukuPaket: FinanceModuleStat;
    laundry: FinanceModuleStat;
  };
  recentTransactions?: RecentTransaction[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard/stats");

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();

      if (data.role === "admin" || data.stats) {
        setStats(data.stats);
      } else {
        throw new Error("Invalid role or stats missing");
      }
    } catch (error: any) {
      console.error("Error fetching admin stats:", error);
      setError(error.message || "Failed to load dashboard data");
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka || 0);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50 p-6 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-red-600 mx-auto" />
          <CardTitle className="text-red-700 text-lg">Gagal Memuat Dashboard</CardTitle>
          <CardDescription className="text-red-600">
            {error || "Terjadi kendala saat menghubungkan ke database"}
          </CardDescription>
          <Button onClick={fetchStats} variant="outline" className="mt-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
        </Card>
      </div>
    );
  }

  const pendingTotal = stats.totalPendingVerifikasi || 0;
  const finance = stats.finance || {
    spp: { totalLunas: 0, pendingCount: 0, totalBills: 0 },
    uangMasuk: { totalLunas: 0, pendingCount: 0, totalBills: 0 },
    seragam: { totalLunas: 0, pendingCount: 0, totalBills: 0 },
    bukuPaket: { totalLunas: 0, pendingCount: 0, totalBills: 0 },
    laundry: { totalLunas: 0, pendingCount: 0, totalBills: 0 },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Dashboard Utama Admin
            </h1>
            <Badge className="bg-primary text-white text-xs">
              Administrator
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pusat kendali eksekutif: pantau santri, keuangan, akademik, dan seluruh operasional pesantren secara realtime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ─── Executive Financial & Overview Cards ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo Tabungan Santri */}
        <Card className="border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50/70 to-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Total Saldo Santri
            </CardTitle>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatRupiah(stats.totalSaldo || 0)}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-emerald-700">
              <span>Dana tabungan santri</span>
              <Link href="/dashboard/saldo" className="font-semibold hover:underline flex items-center gap-0.5">
                Kelola <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Total Pemasukan Lunas Tagihan */}
        <Card className="border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50/70 to-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
              Pemasukan Tagihan (Lunas)
            </CardTitle>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatRupiah(stats.totalPemasukanLunas || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Akumulasi SPP, Uang Masuk, Seragam, Buku, Laundry
            </p>
          </CardContent>
        </Card>

        {/* Antrean Verifikasi Pending */}
        <Card className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${
          pendingTotal > 0 ? "border-l-amber-500 bg-gradient-to-br from-amber-50/80 to-white" : "border-l-gray-300 bg-white"
        }`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Antrean Verifikasi
            </CardTitle>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 flex items-center gap-2">
              {pendingTotal} Bukti Transfer
              {pendingTotal > 0 && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingTotal > 0 ? "Menunggu persetujuan petugas" : "Semua bukti transfer telah diverifikasi"}
            </p>
          </CardContent>
        </Card>

        {/* Total Surat Peringatan Aktif */}
        <Card className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${
          (stats.totalPeringatanAktif || 0) > 0 ? "border-l-rose-500 bg-gradient-to-br from-rose-50/80 to-white" : "border-l-gray-300 bg-white"
        }`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              Surat Peringatan Aktif
            </CardTitle>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <FileWarning className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700">
              {stats.totalPeringatanAktif || 0} Surat SP
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-rose-700">
              <span>Tunggakan tagihan santri</span>
              <Link href="/dashboard/peringatan" className="font-semibold hover:underline flex items-center gap-0.5">
                Periksa <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Verification Queue Action Banner ─────────────────────── */}
      {pendingTotal > 0 && (
        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Ada {pendingTotal} Pembayaran Menunggu Verifikasi
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Segera periksa foto bukti transfer orang tua santri untuk mengonfirmasi kelunasan tagihan.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {finance.spp.pendingCount > 0 && (
                <Link href="/dashboard/iuran">
                  <Badge variant="outline" className="bg-white hover:bg-amber-100 cursor-pointer text-xs py-1 px-2.5 border-amber-300 text-amber-900 gap-1">
                    <CreditCard className="w-3 h-3 text-blue-600" /> SPP ({finance.spp.pendingCount})
                  </Badge>
                </Link>
              )}
              {finance.uangMasuk.pendingCount > 0 && (
                <Link href="/dashboard/uang-masuk">
                  <Badge variant="outline" className="bg-white hover:bg-amber-100 cursor-pointer text-xs py-1 px-2.5 border-amber-300 text-amber-900 gap-1">
                    <Landmark className="w-3 h-3 text-emerald-600" /> Uang Masuk ({finance.uangMasuk.pendingCount})
                  </Badge>
                </Link>
              )}
              {finance.seragam.pendingCount > 0 && (
                <Link href="/dashboard/seragam">
                  <Badge variant="outline" className="bg-white hover:bg-amber-100 cursor-pointer text-xs py-1 px-2.5 border-amber-300 text-amber-900 gap-1">
                    <ShoppingBag className="w-3 h-3 text-indigo-600" /> Seragam ({finance.seragam.pendingCount})
                  </Badge>
                </Link>
              )}
              {finance.bukuPaket.pendingCount > 0 && (
                <Link href="/dashboard/buku-paket">
                  <Badge variant="outline" className="bg-white hover:bg-amber-100 cursor-pointer text-xs py-1 px-2.5 border-amber-300 text-amber-900 gap-1">
                    <BookOpen className="w-3 h-3 text-teal-600" /> Kitab/Buku ({finance.bukuPaket.pendingCount})
                  </Badge>
                </Link>
              )}
              {finance.laundry.pendingCount > 0 && (
                <Link href="/dashboard/laundry">
                  <Badge variant="outline" className="bg-white hover:bg-amber-100 cursor-pointer text-xs py-1 px-2.5 border-amber-300 text-amber-900 gap-1">
                    <Droplets className="w-3 h-3 text-cyan-600" /> Laundry ({finance.laundry.pendingCount})
                  </Badge>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 5 Modul Tagihan & Keuangan Pesantren Breakdown ────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Rincian 5 Pos Keuangan & Tagihan Pesantren
          </h2>
          <span className="text-xs text-muted-foreground">Status Realtime</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Modul 1: Iuran SPP Bulanan */}
          <Card className="hover:border-blue-300 transition-colors">
            <CardHeader className="p-3.5 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700">1. Iuran & SPP</span>
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-1.5">
              <div className="text-base font-bold text-gray-900">
                {formatRupiah(finance.spp.totalLunas)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{finance.spp.totalBills} Tagihan</span>
                {finance.spp.pendingCount > 0 ? (
                  <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">
                    {finance.spp.pendingCount} Pending
                  </Badge>
                ) : (
                  <span className="text-emerald-600 font-medium">Beres</span>
                )}
              </div>
              <Link href="/dashboard/iuran" className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-1 pt-1 border-t">
                Buka SPP <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Modul 2: Uang Masuk */}
          <Card className="hover:border-emerald-300 transition-colors">
            <CardHeader className="p-3.5 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700">2. Uang Masuk (1x)</span>
                <Landmark className="w-4 h-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-1.5">
              <div className="text-base font-bold text-gray-900">
                {formatRupiah(finance.uangMasuk.totalLunas)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{finance.uangMasuk.totalBills} Tagihan</span>
                {finance.uangMasuk.pendingCount > 0 ? (
                  <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">
                    {finance.uangMasuk.pendingCount} Pending
                  </Badge>
                ) : (
                  <span className="text-emerald-600 font-medium">Beres</span>
                )}
              </div>
              <Link href="/dashboard/uang-masuk" className="text-[11px] text-emerald-600 font-medium hover:underline flex items-center gap-1 pt-1 border-t">
                Buka Uang Masuk <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Modul 3: Seragam */}
          <Card className="hover:border-indigo-300 transition-colors">
            <CardHeader className="p-3.5 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700">3. Paket Seragam</span>
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-1.5">
              <div className="text-base font-bold text-gray-900">
                {formatRupiah(finance.seragam.totalLunas)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{finance.seragam.totalBills} Tagihan</span>
                {finance.seragam.pendingCount > 0 ? (
                  <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">
                    {finance.seragam.pendingCount} Pending
                  </Badge>
                ) : (
                  <span className="text-emerald-600 font-medium">Beres</span>
                )}
              </div>
              <Link href="/dashboard/seragam" className="text-[11px] text-indigo-600 font-medium hover:underline flex items-center gap-1 pt-1 border-t">
                Buka Seragam <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Modul 4: Buku Paket / Kitab Kuning */}
          <Card className="hover:border-teal-300 transition-colors">
            <CardHeader className="p-3.5 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-700">4. Buku & Kitab</span>
                <BookOpen className="w-4 h-4 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-1.5">
              <div className="text-base font-bold text-gray-900">
                {formatRupiah(finance.bukuPaket.totalLunas)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{finance.bukuPaket.totalBills} Tagihan</span>
                {finance.bukuPaket.pendingCount > 0 ? (
                  <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">
                    {finance.bukuPaket.pendingCount} Pending
                  </Badge>
                ) : (
                  <span className="text-emerald-600 font-medium">Beres</span>
                )}
              </div>
              <Link href="/dashboard/buku-paket" className="text-[11px] text-teal-600 font-medium hover:underline flex items-center gap-1 pt-1 border-t">
                Buka Buku/Kitab <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Modul 5: Laundry Bulanan */}
          <Card className="hover:border-cyan-300 transition-colors">
            <CardHeader className="p-3.5 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-700">5. Laundry Bulanan</span>
                <Droplets className="w-4 h-4 text-cyan-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-1.5">
              <div className="text-base font-bold text-gray-900">
                {formatRupiah(finance.laundry.totalLunas)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{finance.laundry.totalBills} Tagihan</span>
                {finance.laundry.pendingCount > 0 ? (
                  <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">
                    {finance.laundry.pendingCount} Pending
                  </Badge>
                ) : (
                  <span className="text-emerald-600 font-medium">Beres</span>
                )}
              </div>
              <Link href="/dashboard/laundry" className="text-[11px] text-cyan-600 font-medium hover:underline flex items-center gap-1 pt-1 border-t">
                Buka Laundry <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Demografi Pengguna & Akademik Pesantren ────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Demografi & Pengguna Pesantren
          </h2>
          <span className="text-xs text-muted-foreground">Total: {stats.totalUsers} Akun</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Santri Card */}
          <Card className="border-t-4 border-t-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Santri</CardTitle>
              <GraduationCap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalSantri} Santri</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="text-blue-600 font-medium">♂ {stats.santriLaki || 0} Ikhwan</span>
                <span>•</span>
                <span className="text-pink-600 font-medium">♀ {stats.santriPerempuan || 0} Akhwat</span>
              </div>
            </CardContent>
          </Card>

          {/* Guru / Ustadz Card */}
          <Card className="border-t-4 border-t-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Guru / Ustadz</CardTitle>
              <BookOpen className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalUstad} Guru</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-emerald-700 font-medium">{stats.ustadOnline} online sekarang</span>
              </div>
            </CardContent>
          </Card>

          {/* Petugas Administrasi Card */}
          <Card className="border-t-4 border-t-teal-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Staf Petugas</CardTitle>
              <UserCheck className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPetugas || 0} Petugas</div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">Admin & Keuangan</span>
                <Link href="/dashboard/data-petugas" className="text-teal-700 font-semibold hover:underline flex items-center gap-0.5">
                  Kelola <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Orang Tua Card */}
          <Card className="border-t-4 border-t-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Orang Tua / Wali</CardTitle>
              <Users className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalOrangtua} Orang Tua</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.newUsersThisMonth} akun baru bulan ini
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Recent Transactions & Quick Action Hub ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Recent Transactions Feed (7 Cols) */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Aktivitas & Transaksi Terkini
                </CardTitle>
                <CardDescription className="text-xs">
                  Catatan transaksi pembayaran santri terbaru di semua modul
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Realtime Feed
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {(!stats.recentTransactions || stats.recentTransactions.length === 0) ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Belum ada transaksi pembayaran yang tercatat
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.recentTransactions.map((tx, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl text-xs font-bold ${
                        tx.jenis.includes("SPP")
                          ? "bg-blue-100 text-blue-700"
                          : tx.jenis.includes("Uang Masuk")
                          ? "bg-emerald-100 text-emerald-700"
                          : tx.jenis.includes("Seragam")
                          ? "bg-indigo-100 text-indigo-700"
                          : tx.jenis.includes("Buku")
                          ? "bg-teal-100 text-teal-700"
                          : "bg-cyan-100 text-cyan-700"
                      }`}>
                        {tx.jenis.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-900">
                          {tx.santriName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx.jenis} • <span className="font-medium text-gray-700">{tx.keterangan}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-bold text-sm text-gray-900">
                        {formatRupiah(tx.nominal)}
                      </div>
                      <div>
                        {tx.status === "lunas" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0 border-emerald-200">
                            Lunas
                          </Badge>
                        ) : tx.status === "menunggu_verifikasi" ? (
                          <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 border-amber-200 animate-pulse">
                            Perlu Verifikasi
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-rose-700 border-rose-200">
                            Belum Bayar
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Col: Admin Quick Actions Hub (5 Cols) */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Pusat Kendali & Aksi Cepat
            </CardTitle>
            <CardDescription className="text-xs">
              Akses instan ke seluruh menu pengelolaan data & keuangan
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Group 1: Modul Keuangan */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Modul Keuangan & Pembayaran
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link href="/dashboard/saldo">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs border-emerald-200 hover:bg-emerald-50 text-emerald-800">
                    <Wallet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Saldo Santri
                  </Button>
                </Link>
                <Link href="/dashboard/iuran">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs border-blue-200 hover:bg-blue-50 text-blue-800">
                    <CreditCard className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Iuran & SPP
                  </Button>
                </Link>
                <Link href="/dashboard/uang-masuk">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs border-emerald-200 hover:bg-emerald-50 text-emerald-800">
                    <Landmark className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Uang Masuk
                  </Button>
                </Link>
                <Link href="/dashboard/seragam">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs border-indigo-200 hover:bg-indigo-50 text-indigo-800">
                    <ShoppingBag className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Seragam
                  </Button>
                </Link>
                <Link href="/dashboard/buku-paket">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs border-teal-200 hover:bg-teal-50 text-teal-800">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5 text-teal-600" /> Buku / Kitab
                  </Button>
                </Link>
                <Link href="/dashboard/laundry">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs border-cyan-200 hover:bg-cyan-50 text-cyan-800">
                    <Droplets className="w-3.5 h-3.5 mr-1.5 text-cyan-600" /> Laundry
                  </Button>
                </Link>
              </div>
            </div>

            {/* Group 2: Data Pengguna & Akademik */}
            <div className="pt-2 border-t">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Data Master & Administrasi
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link href="/dashboard/santri">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-primary" /> Data Santri
                  </Button>
                </Link>
                <Link href="/dashboard/data-petugas">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs bg-teal-50/50 hover:bg-teal-100/50 border-teal-200 text-teal-900 font-semibold">
                    <UserCheck className="w-3.5 h-3.5 mr-1.5 text-teal-600" /> Data Petugas
                  </Button>
                </Link>
                <Link href="/dashboard/ustad">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Data Guru
                  </Button>
                </Link>
                <Link href="/dashboard/kelas">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <School className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Data Kelas
                  </Button>
                </Link>
                <Link href="/dashboard/orangtua">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <Users className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Data Orang Tua
                  </Button>
                </Link>
                <Link href="/dashboard/peringatan">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs border-rose-200 hover:bg-rose-50 text-rose-800">
                    <FileWarning className="w-3.5 h-3.5 mr-1.5 text-rose-600" /> Surat Peringatan
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
