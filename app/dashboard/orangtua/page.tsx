"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firestore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, TrendingUp, User } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Type definitions
interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  santriId?: string[];
}

interface Santri {
  id: string;
  name: string;
  nis?: string;
  kelas?: string;
}

interface Laporan {
  id: string;
  kategori: "hafalan" | "akademik" | "perilaku";
  tanggal: string;
  isi: {
    // For hafalan
    surat?: string;
    ayat?: string;
    predikat?: string;
    // For akademik
    mapel?: string;
    nilai?: number;
    // For perilaku
    catatan?: string;
  };
}

export default function OrangtuaDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [santri, setSantri] = useState<Santri | null>(null);
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [activeTab, setActiveTab] = useState<
    "hafalan" | "akademik" | "perilaku"
  >("hafalan");

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "orangtua") {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get current user from Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("User tidak terautentikasi");
        return;
      }

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (!userDoc.exists()) {
        toast.error("Data user tidak ditemukan");
        return;
      }

      const userData = userDoc.data() as User;
      setUser(userData);

      // Get first santri ID
      if (!userData.santriId || userData.santriId.length === 0) {
        toast.error("Anda belum terhubung dengan santri");
        setLoading(false);
        return;
      }

      const santriId = userData.santriId[0];

      // Get santri data
      const santriDoc = await getDoc(doc(db, "santri", santriId));
      if (santriDoc.exists()) {
        setSantri({ id: santriDoc.id, ...santriDoc.data() } as Santri);
      }

      // Get laporan data for this santri
      const laporanQuery = query(
        collection(db, "laporan"),
        where("santriId", "==", santriId),
        orderBy("tanggal", "desc")
      );
      const laporanSnapshot = await getDocs(laporanQuery);

      const laporanData: Laporan[] = [];
      laporanSnapshot.forEach((doc) => {
        laporanData.push({ id: doc.id, ...doc.data() } as Laporan);
      });

      setLaporan(laporanData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getPredikatColor = (predikat: string) => {
    switch (predikat?.toLowerCase()) {
      case "mumtaz":
        return "bg-green-500 text-white";
      case "jayyid jiddan":
        return "bg-blue-500 text-white";
      case "jayyid":
        return "bg-yellow-500 text-white";
      case "mengulang":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Filter laporan by category
  const hafalanLaporan = laporan.filter((l) => l.kategori === "hafalan");
  const akademikLaporan = laporan.filter((l) => l.kategori === "akademik");
  const perilakuLaporan = laporan.filter((l) => l.kategori === "perilaku");

  // Prepare data for chart
  const chartData = akademikLaporan.map((item) => ({
    name: item.isi.mapel || "",
    nilai: item.isi.nilai || 0,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>

        <div className="flex space-x-1 mb-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !santri) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">
            {user
              ? "Anda belum terhubung dengan santri"
              : "Data tidak tersedia"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Orang Tua
          </h1>
          <p className="text-muted-foreground">
            Monitoring perkembangan{" "}
            <span className="font-medium text-foreground">{santri.name}</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("hafalan")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "hafalan"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Hafalan
          </div>
        </button>
        <button
          onClick={() => setActiveTab("akademik")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "akademik"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Akademik
          </div>
        </button>
        <button
          onClick={() => setActiveTab("perilaku")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "perilaku"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perilaku
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "hafalan" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Progress Hafalan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hafalanLaporan.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Belum ada laporan hafalan
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {hafalanLaporan.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {item.isi.surat} Ayat {item.isi.ayat}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(item.tanggal)}
                        </p>
                      </div>
                      <Badge
                        className={getPredikatColor(item.isi.predikat || "")}
                      >
                        {item.isi.predikat}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "akademik" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Nilai Akademik
            </CardTitle>
          </CardHeader>
          <CardContent>
            {akademikLaporan.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Belum ada laporan akademik
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="nilai" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">
                          Mata Pelajaran
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium">
                          Nilai
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium">
                          Tanggal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {akademikLaporan.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-2">{item.isi.mapel}</td>
                          <td className="px-4 py-2 font-medium">
                            {item.isi.nilai}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {formatDate(item.tanggal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "perilaku" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Catatan Perilaku
            </CardTitle>
          </CardHeader>
          <CardContent>
            {perilakuLaporan.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Belum ada catatan perilaku
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {perilakuLaporan.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm">{item.isi.catatan}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.tanggal)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
