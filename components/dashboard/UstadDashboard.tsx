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
  MessageSquare,
  FileText,
  School,
  TrendingUp,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface UstadStats {
  totalClasses: number;
  totalStudents: number;
  totalChats: number;
  activeChats: number;
  totalLaporan: number;
  laporanThisWeek: number;
  laporanThisMonth: number;
  laporanByCategory: {
    hafalan: number;
    akademik: number;
    perilaku: number;
  };
}

export default function UstadDashboard() {
  const [stats, setStats] = useState<UstadStats | null>(null);
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
      
      if (data.role === "ustad") {
        setStats(data.stats);
      } else {
        throw new Error("Invalid role");
      }
    } catch (error: any) {
      console.error("Error fetching ustad stats:", error);
      setError(error.message || "Failed to load dashboard data");
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard Ustadz</h1>
          <Badge variant="default" className="text-sm">
            Ustadz
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
          <h1 className="text-3xl font-bold">Dashboard Ustadz</h1>
          <Badge variant="default" className="text-sm">
            Ustadz
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
        <h1 className="text-3xl font-bold">Dashboard Ustadz</h1>
        <Badge variant="default" className="text-sm">
          Ustadz
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Diampu</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              Total kelas aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Santri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Santri yang diampu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Percakapan</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChats}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeChats} aktif hari ini
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

      {/* Laporan Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Hafalan</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.laporanByCategory.hafalan}
            </div>
            <p className="text-xs text-muted-foreground">
              Total laporan hafalan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Akademik</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {stats.laporanByCategory.akademik}
            </div>
            <p className="text-xs text-muted-foreground">
              Total laporan nilai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Perilaku</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.laporanByCategory.perilaku}
            </div>
            <p className="text-xs text-muted-foreground">
              Total catatan perilaku
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>
              Tindakan yang sering dilakukan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/ustad/lapor">
              <Button className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Input Laporan Santri
              </Button>
            </Link>
            <Link href="/dashboard/santri">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Lihat Data Santri
              </Button>
            </Link>
            <Link href="/dashboard/chat">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Buka Chat dengan Orang Tua
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Minggu Ini</CardTitle>
            <CardDescription>Ringkasan kegiatan 7 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Laporan minggu ini</span>
                <Badge variant="secondary">{stats.laporanThisWeek}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Laporan bulan ini</span>
                <Badge variant="secondary">{stats.laporanThisMonth}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Chat aktif</span>
                <Badge variant="secondary">{stats.activeChats}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rata-rata laporan/hari</span>
                <Badge variant="secondary">
                  {(stats.laporanThisWeek / 7).toFixed(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Laporan Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Laporan</CardTitle>
          <CardDescription>
            Persentase jenis laporan yang dibuat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Hafalan</span>
                <span className="text-sm text-muted-foreground">
                  {stats.laporanByCategory.hafalan} laporan
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{
                    width: `${
                      (stats.laporanByCategory.hafalan / stats.totalLaporan) *
                        100 || 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Akademik/Nilai</span>
                <span className="text-sm text-muted-foreground">
                  {stats.laporanByCategory.akademik} laporan
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-secondary h-2.5 rounded-full"
                  style={{
                    width: `${
                      (stats.laporanByCategory.akademik / stats.totalLaporan) *
                        100 || 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Perilaku</span>
                <span className="text-sm text-muted-foreground">
                  {stats.laporanByCategory.perilaku} laporan
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-orange-600 h-2.5 rounded-full"
                  style={{
                    width: `${
                      (stats.laporanByCategory.perilaku / stats.totalLaporan) *
                        100 || 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
