"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

export default function PetugasDashboard() {
  const [stats, setStats] = useState({
    totalSantri: 0,
    totalSaldo: 0,
    mutasiMasukHariIni: 0,
    mutasiKeluarHariIni: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // 1. Fetch total santri
        const usersRef = ref(database, "users");
        const usersSnapshot = await get(usersRef);
        let santriCount = 0;
        
        if (usersSnapshot.exists()) {
          const users = usersSnapshot.val();
          Object.values(users).forEach((u: any) => {
            if (u.role === "santri") santriCount++;
          });
        }

        // 2. Fetch total saldo
        const saldoRef = ref(database, "saldo");
        const saldoSnapshot = await get(saldoRef);
        let totalSaldoAmount = 0;

        if (saldoSnapshot.exists()) {
          const saldoData = saldoSnapshot.val();
          Object.values(saldoData).forEach((s: any) => {
            totalSaldoAmount += s.amount || 0;
          });
        }

        // 3. Fetch mutasi hari ini
        const mutasiRef = ref(database, "mutasi_saldo");
        const mutasiSnapshot = await get(mutasiRef);
        let masukHariIni = 0;
        let keluarHariIni = 0;

        if (mutasiSnapshot.exists()) {
          const mutasiData = mutasiSnapshot.val();
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          Object.values(mutasiData).forEach((santriMutasi: any) => {
            Object.values(santriMutasi).forEach((m: any) => {
              const mutasiDate = new Date(m.createdAt);
              if (mutasiDate >= today) {
                if (m.tipe === "tambah") masukHariIni += m.nominal;
                if (m.tipe === "kurang") keluarHariIni += m.nominal;
              }
            });
          });
        }

        setStats({
          totalSantri: santriCount,
          totalSaldo: totalSaldoAmount,
          mutasiMasukHariIni: masukHariIni,
          mutasiKeluarHariIni: keluarHariIni,
        });
      } catch (error) {
        console.error("Error fetching petugas stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Petugas</h2>
        <p className="text-muted-foreground">
          Ringkasan data keuangan dan mutasi saldo santri.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Santri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalSantri}
            </div>
            <p className="text-xs text-muted-foreground">Santri terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : formatRupiah(stats.totalSaldo)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total saldo seluruh santri
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pemasukan (Hari Ini)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : formatRupiah(stats.mutasiMasukHariIni)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total top-up hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengeluaran (Hari Ini)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? "..." : formatRupiah(stats.mutasiKeluarHariIni)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pemakaian hari ini
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
