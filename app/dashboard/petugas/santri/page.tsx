"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Eye, Wallet, GraduationCap, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Santri {
  id: string;
  name: string;
  nis: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  tahunDaftar: string;
  orangTuaName: string;
  orangTuaEmail: string;
  orangTuaPhone: string;
  dataSource: string;
}

interface SaldoInfo {
  amount: number;
  updatedAt?: string;
}

export default function PetugasSantriPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [filteredList, setFilteredList] = useState<Santri[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<"semua" | "L" | "P">("semua");
  const [loading, setLoading] = useState(true);
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [saldoMap, setSaldoMap] = useState<Record<string, SaldoInfo>>({});
  const [viewOpen, setViewOpen] = useState(false);
  const [loadingSaldo, setLoadingSaldo] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (session.user.role !== "petugas" && session.user.role !== "admin") {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      router.push("/dashboard");
      return;
    }
    fetchSantri();
  }, [session, status, router]);

  useEffect(() => {
    const q = searchTerm.toLowerCase();
    setFilteredList(
      santriList.filter((s) => {
        const matchesSearch =
          s.name.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          s.orangTuaName.toLowerCase().includes(q);
        const matchesGender =
          genderFilter === "semua" || s.jenisKelamin === genderFilter;
        return matchesSearch && matchesGender;
      })
    );
  }, [santriList, searchTerm, genderFilter]);

  const fetchSantri = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/santri/enhanced");
      const data = await res.json();
      if (res.ok) {
        const list: Santri[] = data.santriList || data.students || [];
        setSantriList(list);
        // Prefetch saldo for all santri
        fetchBatchSaldo(list.map((s) => s.id));
      } else {
        toast.error(data.error || "Gagal memuat data santri");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memuat data santri");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchSaldo = async (ids: string[]) => {
    const results: Record<string, SaldoInfo> = {};
    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/saldo?santriId=${id}`);
          const data = await res.json();
          if (res.ok) results[id] = data;
        } catch {
          // ignore individual failures
        }
      })
    );
    setSaldoMap(results);
  };

  const handleView = async (santri: Santri) => {
    setSelectedSantri(santri);
    setViewOpen(true);
    // Refresh saldo for this specific santri
    setLoadingSaldo(true);
    try {
      const res = await fetch(`/api/saldo?santriId=${santri.id}`);
      const data = await res.json();
      if (res.ok) {
        setSaldoMap((prev) => ({ ...prev, [santri.id]: data }));
      }
    } finally {
      setLoadingSaldo(false);
    }
  };

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Memuat data santri...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            Data Santri
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Daftar santri dan informasi saldo — tampilan petugas keuangan
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {filteredList.length} santri
        </Badge>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIS, atau orang tua..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <Select
                value={genderFilter}
                onValueChange={(v) => setGenderFilter(v as "semua" | "L" | "P")}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Gender</SelectItem>
                  <SelectItem value="L">
                    <span className="flex items-center gap-1.5">
                      <span className="text-blue-500 font-bold text-xs">♂</span>
                      Laki-laki
                    </span>
                  </SelectItem>
                  <SelectItem value="P">
                    <span className="flex items-center gap-1.5">
                      <span className="text-pink-500 font-bold text-xs">♀</span>
                      Perempuan
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table (desktop) */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Daftar Santri</CardTitle>
          <CardDescription>
            Klik tombol detail untuk melihat info lengkap dan saldo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIS</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Orang Tua</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      {searchTerm ? "Tidak ada santri yang sesuai pencarian" : "Belum ada data santri"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((santri) => (
                    <TableRow key={santri.id}>
                      <TableCell className="font-medium">{santri.name}</TableCell>
                      <TableCell className="text-muted-foreground">{santri.nis || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={santri.jenisKelamin === "L" ? "default" : "secondary"}>
                          {santri.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                        </Badge>
                      </TableCell>
                      <TableCell>{santri.orangTuaName || "-"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {saldoMap[santri.id] !== undefined
                          ? formatRupiah(saldoMap[santri.id].amount || 0)
                          : <span className="text-muted-foreground text-xs">Memuat...</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(santri)}
                          className="gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Card list (mobile) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm ? "Tidak ada santri yang sesuai pencarian" : "Belum ada data santri"}
          </div>
        ) : (
          filteredList.map((santri) => (
            <Card key={santri.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{santri.name}</p>
                    <p className="text-xs text-muted-foreground">NIS: {santri.nis || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate">Orang tua: {santri.orangTuaName || "-"}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {saldoMap[santri.id] !== undefined
                          ? formatRupiah(saldoMap[santri.id].amount || 0)
                          : "Memuat..."}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(santri)}
                    className="gap-1.5 shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Detail
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Detail Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Santri</DialogTitle>
          </DialogHeader>
          {selectedSantri && (
            <div className="space-y-5">
              {/* Saldo highlight */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo saat ini</p>
                  {loadingSaldo ? (
                    <div className="h-7 w-28 bg-muted animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      {formatRupiah(saldoMap[selectedSantri.id]?.amount || 0)}
                    </p>
                  )}
                </div>
              </div>

              {/* Santri info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Nama</p>
                  <p className="font-medium">{selectedSantri.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">NIS</p>
                  <p className="font-medium">{selectedSantri.nis || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Jenis Kelamin</p>
                  <Badge variant={selectedSantri.jenisKelamin === "L" ? "default" : "secondary"}>
                    {selectedSantri.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Tahun Daftar</p>
                  <p className="font-medium">{selectedSantri.tahunDaftar || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Tempat Lahir</p>
                  <p className="font-medium">{selectedSantri.tempatLahir || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Tanggal Lahir</p>
                  <p className="font-medium">{formatDate(selectedSantri.tanggalLahir)}</p>
                </div>
              </div>

              {/* Orang tua info */}
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Informasi Orang Tua
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama</span>
                    <span className="font-medium text-right max-w-[60%] truncate">{selectedSantri.orangTuaName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-right max-w-[60%] truncate">{selectedSantri.orangTuaEmail || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telepon</span>
                    <span className="font-medium">{selectedSantri.orangTuaPhone || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Quick action */}
              <Button
                className="w-full gap-2"
                onClick={() => {
                  setViewOpen(false);
                  router.push(`/dashboard/petugas/saldo`);
                }}
              >
                <Wallet className="h-4 w-4" />
                Kelola Saldo Santri Ini
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
