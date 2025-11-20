"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Save,
  ChevronRight,
  Users,
} from "lucide-react";

// Type definitions
interface Kelas {
  id: string;
  name: string;
  academicYear: string;
  studentIds?: Record<string, any>;
}

interface Santri {
  id: string;
  name: string;
  nis: string;
  email: string;
}

export default function LaporPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Select Kelas
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>("");

  // Step 2: Select Santri
  const [allSantriList, setAllSantriList] = useState<Santri[]>([]);
  const [selectedSantri, setSelectedSantri] = useState<string>("");

  // Step 3: Select Report Type
  const [activeTab, setActiveTab] = useState<
    "hafalan" | "akademik" | "perilaku"
  >("hafalan");

  // Form states
  const [hafalanForm, setHafalanForm] = useState({
    surat: "",
    ayat: "",
    predikat: "Lancar",
  });

  const [akademikForm, setAkademikForm] = useState({
    mapel: "",
    nilai: 0,
  });

  const [perilakuForm, setPerilakuForm] = useState({
    catatan: "",
    jenis: "Prestasi",
  });

  // Form validation
  const validateHafalan = () => {
    if (!hafalanForm.surat.trim()) {
      toast.error("Nama surat harus diisi");
      return false;
    }
    if (!hafalanForm.ayat.trim()) {
      toast.error("Ayat harus diisi");
      return false;
    }
    return true;
  };

  const validateAkademik = () => {
    if (!akademikForm.mapel.trim()) {
      toast.error("Mata pelajaran harus diisi");
      return false;
    }
    if (akademikForm.nilai < 0 || akademikForm.nilai > 100) {
      toast.error("Nilai harus antara 0-100");
      return false;
    }
    return true;
  };

  const validatePerilaku = () => {
    if (!perilakuForm.catatan.trim()) {
      toast.error("Catatan harus diisi");
      return false;
    }
    return true;
  };

  // Fetch kelas and santri data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);

        // Fetch kelas that belong to current ustad
        const kelasResponse = await fetch(
          `/api/classes?ustadId=${session.user.id}`
        );
        if (!kelasResponse.ok) throw new Error("Failed to fetch classes");

        const kelasData = await kelasResponse.json();
        setKelasList(kelasData.classes || []);

        // Fetch all santri from Firebase Realtime Database
        const { ref, get } = await import("firebase/database");
        const { database } = await import("@/lib/firebase");

        const usersRef = ref(database, "users");
        const usersSnapshot = await get(usersRef);

        if (usersSnapshot.exists()) {
          const users = usersSnapshot.val();
          const santriData: Santri[] = [];

          Object.keys(users).forEach((userId) => {
            const user = users[userId];
            if (user.role === "santri") {
              santriData.push({
                id: userId,
                name: user.name || "",
                nis: user.nis || "",
                email: user.email || "",
              });
            }
          });

          setAllSantriList(santriData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  // Filter santri based on selected kelas using useMemo for performance
  const filteredSantriList = useMemo(() => {
    if (!selectedKelas || !kelasList.length || !allSantriList.length) {
      return [];
    }

    const selectedKelasData = kelasList.find((k) => k.id === selectedKelas);
    if (!selectedKelasData?.studentIds) return [];

    const studentIdsInKelas = Object.keys(selectedKelasData.studentIds);
    return allSantriList.filter((santri) =>
      studentIdsInKelas.includes(santri.id)
    );
  }, [selectedKelas, kelasList, allSantriList]);

  // Cek autentikasi
  useEffect(() => {
    if (!session) {
      router.push("/login");
    } else if (session.user.role !== "ustad") {
      toast.error("Halaman ini hanya untuk Ustadz");
      router.push("/dashboard");
    }
  }, [session, router]);

  // Reset selections on step back
  const handleKelasChange = (kelasId: string) => {
    setSelectedKelas(kelasId);
    setSelectedSantri(""); // Reset santri selection
  };

  const handleSantriChange = (santriId: string) => {
    setSelectedSantri(santriId);
  };

  // Submit handlers
  const onSubmitHafalan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri || submitting || !validateHafalan()) return;

    setSubmitting(true);
    try {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      // Map predikat to fluency level
      const fluencyMap: Record<string, string> = {
        Lancar: "excellent",
        Mengulang: "fair",
        Kurang: "poor",
      };

      const response = await fetch("/api/reports/quran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedSantri,
          surah: hafalanForm.surat,
          ayatStart: parseInt(hafalanForm.ayat.split("-")[0]) || 1,
          ayatEnd:
            parseInt(hafalanForm.ayat.split("-")[1] || hafalanForm.ayat) || 1,
          fluencyLevel: fluencyMap[hafalanForm.predikat] || "good",
          testDate: new Date().toISOString().split("T")[0],
          notes: "",
          mataPelajaran: "Al-Quran", // Tambahkan field mata pelajaran
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create report");
      }

      toast.success("Laporan hafalan berhasil disimpan");
      setHafalanForm({ surat: "", ayat: "", predikat: "Lancar" });
    } catch (error: any) {
      console.error("Error submitting hafalan report:", error);
      toast.error(error.message || "Gagal menyimpan laporan hafalan");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitAkademik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri || submitting || !validateAkademik()) return;

    setSubmitting(true);
    try {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/reports/academic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedSantri,
          subject: akademikForm.mapel,
          gradeType: "number",
          gradeNumber: akademikForm.nilai,
          semester: "1",
          academicYear: new Date().getFullYear().toString(),
          notes: "",
          mataPelajaran: akademikForm.mapel, // Tambahkan field mata pelajaran
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create report");
      }

      toast.success("Laporan akademik berhasil disimpan");
      setAkademikForm({ mapel: "", nilai: 0 });
    } catch (error: any) {
      console.error("Error submitting akademik report:", error);
      toast.error(error.message || "Gagal menyimpan laporan akademik");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitPerilaku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri || submitting || !validatePerilaku()) return;

    setSubmitting(true);
    try {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const selectedSantriData = allSantriList.find(
        (s) => s.id === selectedSantri
      );

      const response = await fetch("/api/reports/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedSantri,
          category: "behavior",
          priority: perilakuForm.jenis === "Prestasi" ? "low" : "medium",
          title: `Laporan ${perilakuForm.jenis}: ${
            selectedSantriData?.name || "Santri"
          }`,
          description: perilakuForm.catatan,
          incidentDate: new Date().toISOString().split("T")[0],
          status: "open",
          followUpRequired: false,
          mataPelajaran: "Perilaku", // Tambahkan field mata pelajaran
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create report");
      }

      toast.success("Laporan perilaku berhasil disimpan");
      setPerilakuForm({ catatan: "", jenis: "Prestasi" });
    } catch (error: any) {
      console.error("Error submitting perilaku report:", error);
      toast.error(error.message || "Gagal menyimpan laporan perilaku");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Input Laporan Harian
          </h1>
          <p className="text-muted-foreground">
            Catat perkembangan santri setiap harinya
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={selectedKelas ? "text-primary font-medium" : ""}>
          1. Pilih Kelas
        </span>
        <ChevronRight className="h-4 w-4" />
        <span className={selectedSantri ? "text-primary font-medium" : ""}>
          2. Pilih Santri
        </span>
        <ChevronRight className="h-4 w-4" />
        <span className={selectedSantri ? "text-primary font-medium" : ""}>
          3. Input Laporan
        </span>
      </div>

      {/* Step 1: Select Kelas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pilih Kelas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kelas-select">Kelas yang Anda Ampu</Label>
            <select
              id="kelas-select"
              value={selectedKelas}
              onChange={(e) => handleKelasChange(e.target.value)}
              disabled={submitting || loading}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">Pilih kelas...</option>
              {kelasList.map((kelas) => (
                <option key={kelas.id} value={kelas.id}>
                  {kelas.name} - {kelas.academicYear}
                </option>
              ))}
            </select>
            {kelasList.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                Tidak ada kelas yang diampu. Silakan hubungi admin.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Select Santri (shown only if kelas is selected) */}
      {selectedKelas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Pilih Santri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="santri-select">
                Nama Santri dari Kelas Terpilih
              </Label>
              <select
                id="santri-select"
                value={selectedSantri}
                onChange={(e) => handleSantriChange(e.target.value)}
                disabled={submitting}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">Pilih santri...</option>
                {filteredSantriList.map((santri) => (
                  <option key={santri.id} value={santri.id}>
                    {santri.name} - {santri.nis || "No NIS"}
                  </option>
                ))}
              </select>
              {filteredSantriList.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Tidak ada santri di kelas ini.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSantri && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Input Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Custom Tabs Implementation */}
            <div className="border-b border-border">
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("hafalan")}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "hafalan"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Hafalan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("akademik")}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "akademik"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Akademik/Nilai
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("perilaku")}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "perilaku"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Perilaku
                </button>
              </div>
            </div>

            {/* Tab Hafalan */}
            {activeTab === "hafalan" && (
              <form onSubmit={onSubmitHafalan} className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="surat">Nama Surat/Juz</Label>
                    <Input
                      id="surat"
                      placeholder="Contoh: Al-Baqarah"
                      value={hafalanForm.surat}
                      onChange={(e) =>
                        setHafalanForm({
                          ...hafalanForm,
                          surat: e.target.value,
                        })
                      }
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ayat">Ayat</Label>
                    <Input
                      id="ayat"
                      placeholder="Contoh: 1-5"
                      value={hafalanForm.ayat}
                      onChange={(e) =>
                        setHafalanForm({ ...hafalanForm, ayat: e.target.value })
                      }
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="predikat">Predikat</Label>
                  <select
                    id="predikat"
                    value={hafalanForm.predikat}
                    onChange={(e) =>
                      setHafalanForm({
                        ...hafalanForm,
                        predikat: e.target.value as
                          | "Lancar"
                          | "Mengulang"
                          | "Kurang",
                      })
                    }
                    disabled={submitting}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="Lancar">Lancar</option>
                    <option value="Mengulang">Mengulang</option>
                    <option value="Kurang">Kurang</option>
                  </select>
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Laporan Hafalan
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Tab Akademik */}
            {activeTab === "akademik" && (
              <form onSubmit={onSubmitAkademik} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="mapel">Mata Pelajaran</Label>
                  <select
                    id="mapel"
                    value={akademikForm.mapel}
                    onChange={(e) =>
                      setAkademikForm({
                        ...akademikForm,
                        mapel: e.target.value,
                      })
                    }
                    disabled={submitting}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="">Pilih mata pelajaran</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Fiqih">Fiqih</option>
                    <option value="Aqidah">Aqidah</option>
                    <option value="Bahasa Arab">Bahasa Arab</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="IPA">IPA</option>
                    <option value="IPS">IPS</option>
                    <option value="Al-Quran">Al-Quran</option>
                    <option value="Hadis">Hadis</option>
                    <option value="Tarikh">Tarikh</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nilai">Nilai (0-100)</Label>
                  <Input
                    id="nilai"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Masukkan nilai"
                    value={akademikForm.nilai}
                    onChange={(e) =>
                      setAkademikForm({
                        ...akademikForm,
                        nilai: parseInt(e.target.value) || 0,
                      })
                    }
                    disabled={submitting}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Laporan Akademik
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Tab Perilaku */}
            {activeTab === "perilaku" && (
              <form onSubmit={onSubmitPerilaku} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="jenis">Jenis</Label>
                  <select
                    id="jenis"
                    value={perilakuForm.jenis}
                    onChange={(e) =>
                      setPerilakuForm({
                        ...perilakuForm,
                        jenis: e.target.value as "Prestasi" | "Pelanggaran",
                      })
                    }
                    disabled={submitting}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="Prestasi">Prestasi</option>
                    <option value="Pelanggaran">Pelanggaran</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catatan">Catatan Kejadian</Label>
                  <Textarea
                    id="catatan"
                    placeholder="Jelaskan prestasi atau pelanggaran yang terjadi..."
                    rows={4}
                    value={perilakuForm.catatan}
                    onChange={(e) =>
                      setPerilakuForm({
                        ...perilakuForm,
                        catatan: e.target.value,
                      })
                    }
                    disabled={submitting}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Laporan Perilaku
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
