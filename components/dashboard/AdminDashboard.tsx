"use client";

import { useState, useEffect } from "react";
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
  MessageSquare,
  GraduationCap,
  School,
  FileText,
  Wallet,
  CreditCard,
  CheckCircle2,
  Clock,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  totalSantri: number;
  totalUstad: number;
  totalOrangtua: number;
  totalClasses: number;
  activeClasses: number;
  totalChats: number;
  activeChats: number;
  newUsersThisMonth: number;
  ustadOnline: number;
  totalLaporan: number;
  laporanThisMonth: number;
  totalSaldo?: number;
  tagihanIuranPending?: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/dashboard/stats");
      
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();
      
      if (data.role === "admin") {
        setStats(data.stats);
      } else {
        throw new Error("Invalid role");
      }
    } catch (error: any) {
      console.error("Error fetching admin stats:", error);
      setError(error.message || "Failed to load dashboard data");
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <Badge variant="default" className="text-sm">
            Administrator (Kuasa Penuh)
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <Badge variant="default" className="text-sm">
            Administrator
          </Badge>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Dashboard</CardTitle>
            <CardDescription className="text-red-600">
              {error || "Failed to load dashboard data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchStats} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pusat kendali dan otoritas penuh atas seluruh santri, akademik, dan keuangan pesantren.
          </p>
        </div>
        <Badge variant="default" className="text-sm bg-primary text-white">
          Administrator
        </Badge>
      </div>

      {/* Financial & SPP Quick Banner for Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo Santri */}
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo Santri</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatRupiah(stats.totalSaldo || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Seluruh saldo tabungan santri
            </p>
          </CardContent>
        </Card>

        {/* Verifikasi SPP Pending */}
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SPP Perlu Verifikasi</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.tagihanIuranPending || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bukti transfer menunggu persetujuan
            </p>
          </CardContent>
        </Card>

        {/* Total Santri */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Santri</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSantri}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Santri terdaftar aktif
            </p>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats.newUsersThisMonth} bulan ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUstad}</div>
            <p className="text-xs text-muted-foreground">
              {stats.ustadOnline} online sekarang
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orang Tua</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrangtua}</div>
            <p className="text-xs text-muted-foreground">
              Orang tua terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeClasses} kelas aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Laporan</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLaporan}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.laporanThisMonth} bulan ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat Admin</CardTitle>
            <CardDescription>
              Akses langsung ke pengelolaan data dan keuangan tertinggi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link href="/dashboard/santri">
                <Button className="w-full justify-start" variant="outline">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Kelola Data Santri
                </Button>
              </Link>
              <Link href="/dashboard/saldo">
                <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Wallet className="w-4 h-4 mr-2" />
                  Manajemen Saldo
                </Button>
              </Link>
              <Link href="/dashboard/iuran">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Iuran & SPP Santri
                </Button>
              </Link>
              <Link href="/dashboard/ustad">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Kelola Data Guru
                </Button>
              </Link>
              <Link href="/dashboard/kelas">
                <Button variant="outline" className="w-full justify-start">
                  <School className="w-4 h-4 mr-2" />
                  Kelola Data Kelas
                </Button>
              </Link>
              <Link href="/dashboard/chat">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Buka Chat
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistik Sistem</CardTitle>
            <CardDescription>Ringkasan aktivitas sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Registrasi bulan ini</span>
                <Badge variant="secondary">{stats.newUsersThisMonth}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Kelas aktif</span>
                <Badge variant="secondary">{stats.activeClasses}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Guru online</span>
                <Badge variant="secondary">{stats.ustadOnline}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Chat aktif hari ini</span>
                <Badge variant="secondary">{stats.activeChats}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Laporan bulan ini</span>
                <Badge variant="secondary">{stats.laporanThisMonth}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
