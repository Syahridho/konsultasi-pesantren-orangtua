"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  GraduationCap,
  TrendingUp,
  Clock,
  RefreshCcw,
  Filter,
} from "lucide-react";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// ─── Types ──────────────────────────────────────────────
interface SantriData {
  id: string;
  name: string;
  gender: string;
  parentId?: string;
}

interface MutasiEntry {
  id: string;
  santriId: string;
  santriName: string;
  santriGender: string;
  createdAt: string;
  keterangan: string;
  nominal: number;
  tipe: "tambah" | "kurang";
  saldoSebelum: number;
  saldoSesudah: number;
  petugasName: string;
}

interface SaldoEntry {
  santriId: string;
  amount: number;
}

type GenderFilter = "semua" | "L" | "P";

// ─── Constants ──────────────────────────────────────────
const GENDER_COLORS = ["#3b82f6", "#ec4899"];
const SALDO_STATUS_COLORS = ["#059669", "#f59e0b"];

const FILTER_LABELS: Record<GenderFilter, string> = {
  semua: "Semua Santri",
  L: "Laki-laki",
  P: "Perempuan",
};

const FILTER_BADGE_STYLES: Record<GenderFilter, string> = {
  semua: "bg-gray-100 text-gray-700",
  L: "bg-blue-100 text-blue-700",
  P: "bg-pink-100 text-pink-700",
};

// ─── Component ──────────────────────────────────────────
export default function PetugasDashboard() {
  // Raw data (fetched once)
  const [allSantri, setAllSantri] = useState<SantriData[]>([]);
  const [allSaldo, setAllSaldo] = useState<SaldoEntry[]>([]);
  const [allMutasi, setAllMutasi] = useState<MutasiEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("semua");

  // ─── Fetch ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all users
      const usersRef = ref(database, "users");
      const usersSnapshot = await get(usersRef);
      const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};

      // Build santri list
      const santriList: SantriData[] = [];
      Object.entries(usersData).forEach(([id, u]: [string, any]) => {
        if (u.role === "santri") {
          santriList.push({
            id,
            name: u.name,
            gender: u.gender || "",
            parentId: u.parentId,
          });
        }
      });
      setAllSantri(santriList);

      // Build santri ID → gender map for fast lookups
      const santriGenderMap: Record<string, string> = {};
      santriList.forEach((s) => {
        santriGenderMap[s.id] = s.gender;
      });

      // Fetch saldo data
      const saldoRef = ref(database, "saldo");
      const saldoSnapshot = await get(saldoRef);
      const saldoData = saldoSnapshot.exists() ? saldoSnapshot.val() : {};

      const saldoList: SaldoEntry[] = [];
      Object.entries(saldoData).forEach(([id, s]: [string, any]) => {
        if (santriGenderMap[id] !== undefined) {
          saldoList.push({ santriId: id, amount: s.amount || 0 });
        }
      });
      setAllSaldo(saldoList);

      // Fetch mutasi data
      const mutasiRef = ref(database, "mutasi_saldo");
      const mutasiSnapshot = await get(mutasiRef);
      const mutasiData = mutasiSnapshot.exists() ? mutasiSnapshot.val() : {};

      const mutasiList: MutasiEntry[] = [];
      Object.entries(mutasiData).forEach(
        ([santriId, santriMutasi]: [string, any]) => {
          const santriUser = usersData[santriId];
          const santriName = santriUser?.name || "Unknown";
          const santriGender = santriGenderMap[santriId] || "";

          Object.entries(santriMutasi).forEach(
            ([mutasiId, m]: [string, any]) => {
              mutasiList.push({
                id: mutasiId,
                santriId,
                santriName,
                santriGender,
                createdAt: m.createdAt,
                keterangan: m.keterangan,
                nominal: m.nominal,
                tipe: m.tipe,
                saldoSebelum: m.saldoSebelum,
                saldoSesudah: m.saldoSesudah,
                petugasName: m.petugasName,
              });
            }
          );
        }
      );

      // Sort by most recent
      mutasiList.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllMutasi(mutasiList);
    } catch (error) {
      console.error("Error fetching petugas stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived / Filtered Data ──────────────────────────
  const filteredSantri = useMemo(() => {
    if (genderFilter === "semua") return allSantri;
    return allSantri.filter((s) => s.gender === genderFilter);
  }, [allSantri, genderFilter]);

  const filteredSantriIds = useMemo(
    () => new Set(filteredSantri.map((s) => s.id)),
    [filteredSantri]
  );

  const santriLakiLakiList = useMemo(
    () => allSantri.filter((s) => s.gender === "L"),
    [allSantri]
  );

  const santriPerempuanList = useMemo(
    () => allSantri.filter((s) => s.gender === "P"),
    [allSantri]
  );

  // Saldo stats for filtered santri
  const saldoStats = useMemo(() => {
    let totalSaldo = 0;
    let denganSaldo = 0;

    allSaldo.forEach((s) => {
      if (filteredSantriIds.has(s.santriId)) {
        totalSaldo += s.amount;
        if (s.amount > 0) denganSaldo++;
      }
    });

    return {
      totalSaldo,
      santriDenganSaldo: denganSaldo,
      santriTanpaSaldo: filteredSantri.length - denganSaldo,
    };
  }, [allSaldo, filteredSantriIds, filteredSantri.length]);

  // Mutasi stats for filtered santri
  const mutasiStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    let masukHariIni = 0;
    let keluarHariIni = 0;
    let masukBulanIni = 0;
    let keluarBulanIni = 0;
    let transaksiHariIni = 0;
    let transaksiBulanIni = 0;

    const filteredMutasi = allMutasi.filter((m) =>
      filteredSantriIds.has(m.santriId)
    );

    filteredMutasi.forEach((m) => {
      const date = new Date(m.createdAt);

      if (date >= monthStart) {
        transaksiBulanIni++;
        if (m.tipe === "tambah") masukBulanIni += m.nominal;
        if (m.tipe === "kurang") keluarBulanIni += m.nominal;
      }

      if (date >= today) {
        transaksiHariIni++;
        if (m.tipe === "tambah") masukHariIni += m.nominal;
        if (m.tipe === "kurang") keluarHariIni += m.nominal;
      }
    });

    return {
      masukHariIni,
      keluarHariIni,
      masukBulanIni,
      keluarBulanIni,
      transaksiHariIni,
      transaksiBulanIni,
      recentMutasi: filteredMutasi.slice(0, 5),
    };
  }, [allMutasi, filteredSantriIds]);

  // Chart data
  const genderChartData = useMemo(
    () => [
      { name: "Laki-laki", value: santriLakiLakiList.length },
      { name: "Perempuan", value: santriPerempuanList.length },
    ],
    [santriLakiLakiList.length, santriPerempuanList.length]
  );

  const saldoStatusData = useMemo(
    () => [
      { name: "Memiliki Saldo", value: saldoStats.santriDenganSaldo },
      { name: "Tanpa Saldo", value: saldoStats.santriTanpaSaldo },
    ],
    [saldoStats.santriDenganSaldo, saldoStats.santriTanpaSaldo]
  );

  const saldoBarData = useMemo(() => {
    // Show per-gender saldo comparison (only visible when filter is "semua")
    const saldoL = allSaldo
      .filter((s) => {
        const santri = allSantri.find((st) => st.id === s.santriId);
        return santri?.gender === "L";
      })
      .reduce((sum, s) => sum + s.amount, 0);

    const saldoP = allSaldo
      .filter((s) => {
        const santri = allSantri.find((st) => st.id === s.santriId);
        return santri?.gender === "P";
      })
      .reduce((sum, s) => sum + s.amount, 0);

    return [
      { name: "Laki-laki", saldo: saldoL },
      { name: "Perempuan", saldo: saldoP },
    ];
  }, [allSaldo, allSantri]);

  // ─── Helpers ──────────────────────────────────────────
  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const netHariIni = mutasiStats.masukHariIni - mutasiStats.keluarHariIni;
  const netBulanIni = mutasiStats.masukBulanIni - mutasiStats.keluarBulanIni;

  // Show separate gender lists only when filter is "semua"
  const showBothGenderLists = genderFilter === "semua";
  // The single filtered list to show when a gender is selected
  const filteredListForDisplay = genderFilter !== "semua" ? filteredSantri : [];

  // ─── Loading State ────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Dashboard Petugas
            </h2>
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-40"></div>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ========== Header + Filter ========== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Dashboard Petugas
          </h2>
          <p className="text-muted-foreground">
            Ringkasan data keuangan dan santri — diperbarui secara realtime.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Gender Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={genderFilter}
              onValueChange={(v) => setGenderFilter(v as GenderFilter)}
            >
              <SelectTrigger className="w-[160px]" id="gender-filter">
                <SelectValue placeholder="Filter Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    Semua Santri
                  </span>
                </SelectItem>
                <SelectItem value="L">
                  <span className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold text-xs">♂</span>
                    Laki-laki
                  </span>
                </SelectItem>
                <SelectItem value="P">
                  <span className="flex items-center gap-2">
                    <span className="text-pink-500 font-bold text-xs">♀</span>
                    Perempuan
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {genderFilter !== "semua" && (
        <div className="flex items-center gap-2">
          <Badge className={`${FILTER_BADGE_STYLES[genderFilter]} text-sm`}>
            {genderFilter === "L" ? "♂" : "♀"} Menampilkan data:{" "}
            {FILTER_LABELS[genderFilter]}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => setGenderFilter("semua")}
          >
            Reset
          </Button>
        </div>
      )}

      {/* ========== ROW 1: Main Stats (4 cards) ========== */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Santri */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {genderFilter === "semua"
                ? "Total Santri"
                : `Santri ${FILTER_LABELS[genderFilter]}`}
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSantri.length}</div>
            {genderFilter === "semua" ? (
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="text-xs border-blue-200 text-blue-700 bg-blue-50"
                >
                  ♂ {santriLakiLakiList.length} L
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs border-pink-200 text-pink-700 bg-pink-50"
                >
                  ♀ {santriPerempuanList.length} P
                </Badge>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                dari {allSantri.length} total santri
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total Saldo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(saldoStats.totalSaldo)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {saldoStats.santriDenganSaldo} santri memiliki saldo
            </p>
          </CardContent>
        </Card>

        {/* Pemasukan Hari Ini */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pemasukan Hari Ini
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatRupiah(mutasiStats.masukHariIni)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mutasiStats.transaksiHariIni} transaksi hari ini
            </p>
          </CardContent>
        </Card>

        {/* Pengeluaran Hari Ini */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pengeluaran Hari Ini
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatRupiah(mutasiStats.keluarHariIni)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Netto:{" "}
              <span
                className={
                  netHariIni >= 0 ? "text-emerald-600" : "text-red-600"
                }
              >
                {netHariIni >= 0 ? "+" : ""}
                {formatRupiah(netHariIni)}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========== ROW 2: Rekapitulasi Bulan Ini ========== */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Pemasukan Bulan Ini
                </p>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {formatRupiah(mutasiStats.masukBulanIni)}
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Pengeluaran Bulan Ini
                </p>
                <p className="text-xl font-bold text-red-600 mt-1">
                  {formatRupiah(mutasiStats.keluarBulanIni)}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Netto Bulan Ini
                </p>
                <p
                  className={`text-xl font-bold mt-1 ${
                    netBulanIni >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {netBulanIni >= 0 ? "+" : ""}
                  {formatRupiah(netBulanIni)}
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {mutasiStats.transaksiBulanIni} total transaksi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========== ROW 3: Charts ========== */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Gender Distribution / Filtered Saldo Status */}
        {genderFilter === "semua" ? (
          // When "semua": show gender pie chart
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Distribusi Gender Santri
              </CardTitle>
              <CardDescription>
                Perbandingan santri laki-laki dan perempuan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allSantri.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  Belum ada data santri
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={genderChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {genderChartData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={GENDER_COLORS[index % GENDER_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} santri`,
                        name,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        ) : (
          // When filtered: show saldo bar chart for the selected gender
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Perbandingan Saldo per Gender
              </CardTitle>
              <CardDescription>
                Total saldo santri laki-laki vs perempuan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allSantri.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  Belum ada data santri
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={saldoBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis
                      fontSize={11}
                      tickFormatter={(v) =>
                        `${(v / 1000).toLocaleString("id-ID")}k`
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatRupiah(value),
                        "Total Saldo",
                      ]}
                    />
                    <Bar dataKey="saldo" radius={[6, 6, 0, 0]}>
                      {saldoBarData.map((_entry, index) => (
                        <Cell
                          key={`bar-${index}`}
                          fill={GENDER_COLORS[index % GENDER_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Saldo Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Status Saldo{" "}
              {genderFilter !== "semua"
                ? `(${FILTER_LABELS[genderFilter]})`
                : "Santri"}
            </CardTitle>
            <CardDescription>
              Santri yang memiliki saldo vs tanpa saldo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSantri.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Belum ada data santri
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={saldoStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {saldoStatusData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          SALDO_STATUS_COLORS[
                            index % SALDO_STATUS_COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} santri`,
                      name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========== ROW 4: Santri Lists ========== */}
      {showBothGenderLists ? (
        // "Semua": Show side-by-side gender-separated lists
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Laki-laki */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      Santri Laki-laki
                    </CardTitle>
                    <CardDescription>
                      {santriLakiLakiList.length} santri terdaftar
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  {santriLakiLakiList.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {santriLakiLakiList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm px-4">
                  Belum ada data santri laki-laki
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">No</TableHead>
                        <TableHead className="text-xs">Nama</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {santriLakiLakiList.map((s, i) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs text-muted-foreground w-10">
                            {i + 1}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {s.name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Perempuan */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-pink-100 rounded-lg">
                    <Users className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      Santri Perempuan
                    </CardTitle>
                    <CardDescription>
                      {santriPerempuanList.length} santri terdaftar
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">
                  {santriPerempuanList.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {santriPerempuanList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm px-4">
                  Belum ada data santri perempuan
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">No</TableHead>
                        <TableHead className="text-xs">Nama</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {santriPerempuanList.map((s, i) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs text-muted-foreground w-10">
                            {i + 1}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {s.name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Filtered: Show single list for the selected gender
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    genderFilter === "L" ? "bg-blue-100" : "bg-pink-100"
                  }`}
                >
                  <Users
                    className={`h-4 w-4 ${
                      genderFilter === "L" ? "text-blue-600" : "text-pink-600"
                    }`}
                  />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Daftar Santri {FILTER_LABELS[genderFilter]}
                  </CardTitle>
                  <CardDescription>
                    {filteredListForDisplay.length} santri terdaftar
                  </CardDescription>
                </div>
              </div>
              <Badge
                className={`${FILTER_BADGE_STYLES[genderFilter]} hover:${FILTER_BADGE_STYLES[genderFilter]}`}
              >
                {filteredListForDisplay.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredListForDisplay.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm px-4">
                Belum ada data santri {FILTER_LABELS[genderFilter].toLowerCase()}
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">No</TableHead>
                      <TableHead className="text-xs">Nama</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredListForDisplay.map((s, i) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs text-muted-foreground w-10">
                          {i + 1}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {s.name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========== ROW 5: Recent Mutations + Quick Actions ========== */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Recent Mutations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">
                  Mutasi Terakhir
                  {genderFilter !== "semua" &&
                    ` (${FILTER_LABELS[genderFilter]})`}
                </CardTitle>
                <CardDescription>
                  5 transaksi terbaru yang tercatat
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {mutasiStats.recentMutasi.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {genderFilter !== "semua"
                  ? `Belum ada riwayat mutasi untuk santri ${FILTER_LABELS[genderFilter].toLowerCase()}`
                  : "Belum ada riwayat mutasi"}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Waktu</TableHead>
                        <TableHead className="text-xs">Santri</TableHead>
                        <TableHead className="text-xs">Keterangan</TableHead>
                        <TableHead className="text-xs text-right">
                          Nominal
                        </TableHead>
                        <TableHead className="text-xs text-center">
                          Tipe
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mutasiStats.recentMutasi.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(m.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {m.santriName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                            {m.keterangan}
                          </TableCell>
                          <TableCell
                            className={`text-sm font-semibold text-right ${
                              m.tipe === "tambah"
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {m.tipe === "tambah" ? "+" : "-"}
                            {formatRupiah(m.nominal)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                m.tipe === "tambah" ? "default" : "destructive"
                              }
                              className="text-xs"
                            >
                              {m.tipe === "tambah" ? "Masuk" : "Keluar"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-2 px-4 pb-4">
                  {mutasiStats.recentMutasi.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 border rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {m.santriName}
                        </span>
                        <Badge
                          variant={
                            m.tipe === "tambah" ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {m.tipe === "tambah" ? "Masuk" : "Keluar"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {m.keterangan}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(m.createdAt)}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            m.tipe === "tambah"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {m.tipe === "tambah" ? "+" : "-"}
                          {formatRupiah(m.nominal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
            <CardDescription>Menu yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/petugas/santri">
              <Button className="w-full justify-start gap-2" variant="outline">
                <GraduationCap className="h-4 w-4" />
                Data Santri
              </Button>
            </Link>
            <Link href="/dashboard/petugas/saldo">
              <Button className="w-full justify-start gap-2">
                <Wallet className="h-4 w-4" />
                Kelola Saldo
              </Button>
            </Link>
            <Link href="/dashboard/petugas/chat">
              <Button className="w-full justify-start gap-2" variant="outline">
                <Users className="h-4 w-4" />
                Chat
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
