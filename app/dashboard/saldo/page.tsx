"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Wallet,
  Clock,
  Trash2,
  X,
  RefreshCw,
  TrendingUp,
  TrendingDown,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Santri {
  id: string;
  name: string;
  nis: string;
  kelas?: string;
}

interface RiwayatMutasi {
  id: string;
  tipe: "tambah" | "kurang";
  nominal: number;
  saldoSebelum: number;
  saldoSesudah: number;
  keterangan: string;
  petugasName: string;
  createdAt: string;
}

export default function ManajemenSaldoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Santri[]>([]);

  // Selected santri state
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [currentSaldo, setCurrentSaldo] = useState<number>(0);
  const [riwayat, setRiwayat] = useState<RiwayatMutasi[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Mutasi modal
  const [isMutasiOpen, setIsMutasiOpen] = useState(false);
  const [mutasiType, setMutasiType] = useState<"tambah" | "kurang">("tambah");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<RiwayatMutasi | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user.role !== "admin" && session.user.role !== "petugas")) {
      router.push("/dashboard");
      toast.error("Anda tidak memiliki akses ke halaman ini");
    }
  }, [session, status, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/santri?search=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.students || []);
        if ((data.students || []).length === 0) {
          toast.info("Santri tidak ditemukan");
        }
      } else {
        toast.error(data.error || "Gagal mencari santri");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mencari santri");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSantri = (santri: Santri) => {
    setSelectedSantri(santri);
    setSearchResults([]);
    setSearchQuery("");
    fetchSaldoDetails(santri.id);
  };

  const handleClearSantri = () => {
    setSelectedSantri(null);
    setCurrentSaldo(0);
    setRiwayat([]);
  };

  const fetchSaldoDetails = async (santriId: string) => {
    setIsLoadingDetails(true);
    try {
      const [saldoRes, riwayatRes] = await Promise.all([
        fetch(`/api/saldo?santriId=${santriId}`),
        fetch(`/api/saldo/riwayat?santriId=${santriId}`),
      ]);

      const saldoData = await saldoRes.json();
      const riwayatData = await riwayatRes.json();

      if (saldoRes.ok) setCurrentSaldo(saldoData.amount || 0);
      if (riwayatRes.ok) setRiwayat(riwayatData.riwayat || []);
    } catch {
      toast.error("Gagal memuat data saldo santri");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) return;

    const nominalNum = parseInt(nominal.replace(/\D/g, ""));
    if (isNaN(nominalNum) || nominalNum <= 0) {
      toast.error("Nominal tidak valid");
      return;
    }
    if (mutasiType === "kurang" && currentSaldo < nominalNum) {
      toast.error("Saldo tidak mencukupi");
      return;
    }
    if (!keterangan.trim()) {
      toast.error("Keterangan harus diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santriId: selectedSantri.id,
          nominal: nominalNum,
          tipe: mutasiType,
          keterangan,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Berhasil ${mutasiType === "tambah" ? "menambah" : "mengurangi"} saldo`
        );
        setIsMutasiOpen(false);
        setNominal("");
        setKeterangan("");
        fetchSaldoDetails(selectedSantri.id);
      } else {
        toast.error(data.error || "Gagal memproses transaksi");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRiwayat = async () => {
    if (!deleteTarget || !selectedSantri) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/saldo/riwayat?santriId=${selectedSantri.id}&mutasiId=${deleteTarget.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Riwayat transaksi berhasil dihapus");
        setDeleteTarget(null);
        fetchSaldoDetails(selectedSantri.id);
      } else {
        toast.error(data.error || "Gagal menghapus riwayat");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus riwayat");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  const formatNumberInput = (value: string) => {
    const number = value.replace(/\D/g, "");
    if (!number) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(number));
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalMasuk = riwayat
    .filter((r) => r.tipe === "tambah")
    .reduce((acc, r) => acc + r.nominal, 0);

  const totalKeluar = riwayat
    .filter((r) => r.tipe === "kurang")
    .reduce((acc, r) => acc + r.nominal, 0);

  if (status === "loading") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wallet className="h-7 w-7 text-primary" />
          Manajemen Saldo Santri
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tambah, kurangi saldo, dan kelola riwayat transaksi santri.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ====== LEFT: Search + Info ====== */}
        <div className="space-y-5">
          {/* Search Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cari Santri</CardTitle>
              <CardDescription className="text-xs">
                Cari berdasarkan nama atau NIS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Nama / NIS santri..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  size="sm"
                >
                  {isSearching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    "Cari"
                  )}
                </Button>
              </form>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg divide-y overflow-hidden shadow-sm">
                  {searchResults.map((santri) => (
                    <button
                      key={santri.id}
                      className="w-full p-3 text-left hover:bg-muted transition-colors"
                      onClick={() => handleSelectSantri(santri)}
                    >
                      <p className="font-medium text-sm">{santri.name}</p>
                      <p className="text-xs text-muted-foreground">
                        NIS: {santri.nis || "-"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Santri Saldo Info */}
          {selectedSantri && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3 bg-primary/5 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Info Saldo</CardTitle>
                  <button
                    onClick={handleClearSantri}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Santri name */}
                <div>
                  <p className="text-xs text-muted-foreground">Nama Santri</p>
                  <p className="font-semibold text-base">{selectedSantri.name}</p>
                  <p className="text-xs text-muted-foreground">
                    NIS: {selectedSantri.nis || "-"}
                  </p>
                </div>

                {/* Saldo */}
                <div className="p-4 bg-muted/50 rounded-xl border">
                  <p className="text-xs text-muted-foreground mb-1">Sisa Saldo</p>
                  {isLoadingDetails ? (
                    <div className="h-9 w-32 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-3xl font-bold text-primary">
                      {formatRupiah(currentSaldo)}
                    </p>
                  )}
                </div>

                {/* Summary mini stats */}
                {!isLoadingDetails && riwayat.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-green-50 border border-green-100 p-2.5">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <p className="text-xs text-green-700 font-medium">Total Masuk</p>
                      </div>
                      <p className="text-sm font-bold text-green-700">
                        {formatRupiah(totalMasuk)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-red-50 border border-red-100 p-2.5">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        <p className="text-xs text-red-700 font-medium">Total Keluar</p>
                      </div>
                      <p className="text-sm font-bold text-red-700">
                        {formatRupiah(totalKeluar)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      setMutasiType("tambah");
                      setIsMutasiOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Top Up
                  </Button>
                  <Button
                    className="flex-1 gap-1.5"
                    variant="destructive"
                    onClick={() => {
                      setMutasiType("kurang");
                      setIsMutasiOpen(true);
                    }}
                    disabled={currentSaldo <= 0}
                  >
                    <Minus className="h-4 w-4" />
                    Pakai
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ====== RIGHT: Riwayat ====== */}
        <div className="xl:col-span-2">
          <Card className="flex flex-col min-h-[400px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Riwayat Mutasi
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {selectedSantri
                      ? `Transaksi untuk ${selectedSantri.name}`
                      : "Pilih santri untuk melihat riwayat"}
                  </CardDescription>
                </div>
                {selectedSantri && !isLoadingDetails && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchSaldoDetails(selectedSantri.id)}
                    className="gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {!selectedSantri ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground min-h-[280px] gap-3">
                  <Wallet className="h-14 w-14 opacity-15" />
                  <p className="text-sm">
                    Cari dan pilih santri terlebih dahulu
                  </p>
                </div>
              ) : isLoadingDetails ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 border rounded-lg animate-pulse"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-1/3 bg-muted rounded" />
                        <div className="h-3 w-1/2 bg-muted rounded" />
                      </div>
                      <div className="h-5 w-20 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : riwayat.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground min-h-[280px] gap-2">
                  <Clock className="h-10 w-10 opacity-15" />
                  <p className="text-sm">Belum ada riwayat transaksi</p>
                </div>
              ) : (
                <ScrollArea className="h-[480px] pr-2">
                  <div className="space-y-2.5">
                    {riwayat.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3.5 border rounded-xl hover:bg-muted/30 transition-colors group"
                      >
                        {/* Icon */}
                        <div
                          className={`p-2 rounded-full shrink-0 ${
                            item.tipe === "tambah"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {item.tipe === "tambah" ? (
                            <Plus className="h-4 w-4" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.keterangan}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <span>{formatDate(item.createdAt)}</span>
                            <span>•</span>
                            <span>Oleh: {item.petugasName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sisa:{" "}
                            <span className="font-medium text-foreground">
                              {formatRupiah(item.saldoSesudah)}
                            </span>
                          </p>
                        </div>

                        {/* Amount + Delete */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p
                            className={`font-bold text-sm ${
                              item.tipe === "tambah"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {item.tipe === "tambah" ? "+" : "-"}
                            {formatRupiah(item.nominal)}
                          </p>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            title="Hapus riwayat"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ====== Mutasi Modal ====== */}
      <Dialog open={isMutasiOpen} onOpenChange={setIsMutasiOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mutasiType === "tambah" ? (
                <Plus className="h-5 w-5 text-green-600" />
              ) : (
                <Minus className="h-5 w-5 text-red-600" />
              )}
              {mutasiType === "tambah"
                ? "Tambah Saldo (Top Up)"
                : "Kurangi Saldo (Pemakaian)"}
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium">{selectedSantri?.name}</span> —
              Sisa Saldo:{" "}
              <span className="font-semibold text-primary">
                {formatRupiah(currentSaldo)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMutasi} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal (Rp)</Label>
              <Input
                id="nominal"
                value={nominal}
                onChange={(e) => setNominal(formatNumberInput(e.target.value))}
                placeholder="Contoh: 50.000"
                className="text-lg font-semibold"
                autoComplete="off"
              />
              {mutasiType === "kurang" && nominal && (
                <p className="text-xs text-muted-foreground">
                  Sisa setelah:{" "}
                  <span className="font-medium">
                    {formatRupiah(
                      currentSaldo - parseInt(nominal.replace(/\D/g, "") || "0")
                    )}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder={
                  mutasiType === "tambah"
                    ? "Contoh: Titipan orang tua via transfer"
                    : "Contoh: Jajan kantin / Beli kitab"
                }
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsMutasiOpen(false);
                  setNominal("");
                  setKeterangan("");
                }}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !nominal || !keterangan}
                className={
                  mutasiType === "tambah"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  "Simpan Transaksi"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ====== Delete Confirm Dialog ====== */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Riwayat Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Anda akan menghapus riwayat:{" "}
                  <span className="font-medium text-foreground">
                    &ldquo;{deleteTarget.keterangan}&rdquo;
                  </span>{" "}
                  sebesar{" "}
                  <span
                    className={
                      deleteTarget.tipe === "tambah"
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {deleteTarget.tipe === "tambah" ? "+" : "-"}
                    {formatRupiah(deleteTarget.nominal)}
                  </span>
                  .<br />
                  <span className="text-destructive font-medium">
                    Catatan: Tindakan ini tidak akan mengubah saldo secara otomatis.
                  </span>{" "}
                  Hanya data log yang dihapus.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRiwayat}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Menghapus...
                </span>
              ) : (
                "Ya, Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
