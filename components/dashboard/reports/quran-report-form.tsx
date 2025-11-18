"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CreateQuranReportData,
  useQuranReports,
} from "@/lib/hooks/useQuranReports";
import { useSantri } from "@/lib/hooks/useSantri";

// Common Quran surahs for selection
const QURAN_SURAHS = [
  "Al-Fatihah",
  "Al-Baqarah",
  "Aali Imran",
  "An-Nisa",
  "Al-Maidah",
  "Al-Anam",
  "Al-Araf",
  "Al-Anfal",
  "At-Tawbah",
  "Yunus",
  "Hud",
  "Yusuf",
  "Ar-Rad",
  "Ibrahim",
  "Al-Hijr",
  "An-Nahl",
  "Al-Isra",
  "Al-Kahf",
  "Maryam",
  "Ta-Ha",
  "As-Saffat",
  "Al-Jumuah",
  "Al-Mujadila",
  "Al-Muminun",
  "Fussilat",
  "Ya-Sin",
  "Al-Ahqaf",
  "An-Najm",
  "Al-Qamar",
  "Ar-Rahman",
  "Al-Furqan",
  "Ya-Sin",
  "Al-Waqiah",
  "An-Naba",
  "An-Nazi-at",
  "Al-Jinn",
  "Al-Mulk",
  "Al-Qalam",
  "Al-Baqarah",
  "Al-Insan",
];

interface QuranReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<CreateQuranReportData>;
  studentId?: string;
}

export default function QuranReportForm({
  onSuccess,
  onCancel,
  initialData,
  studentId,
}: QuranReportFormProps) {
  const { data: session } = useSession();
  const { createReport } = useQuranReports();
  const { students } = useSantri({ limit: 1000 }); // Get all students for selection

  const [formData, setFormData] = useState<CreateQuranReportData>({
    studentId: studentId || "",
    surah: "",
    ayatStart: 1,
    ayatEnd: 1,
    fluencyLevel: "good",
    testDate: new Date().toISOString().split("T")[0],
    notes: "",
    nextAssignment: "",
    attachments: [],
    ...initialData,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toast.error("Anda harus login untuk membuat laporan");
      return;
    }

    if (!formData.studentId) {
      toast.error("Santri wajib dipilih");
      return;
    }

    if (!formData.surah) {
      toast.error("Nama surat wajib diisi");
      return;
    }

    if (!formData.testDate) {
      toast.error("Tanggal uji wajib diisi");
      return;
    }

    if (formData.ayatStart > formData.ayatEnd) {
      toast.error("Ayat awal tidak boleh lebih besar dari ayat akhir");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createReport(formData);
      if (result) {
        toast.success("Laporan hafalan Quran berhasil dibuat");
        onSuccess?.();

        // Reset form if not editing
        if (!initialData) {
          setFormData({
            studentId: studentId || "",
            surah: "",
            ayatStart: 1,
            ayatEnd: 1,
            fluencyLevel: "good",
            testDate: new Date().toISOString().split("T")[0],
            notes: "",
            nextAssignment: "",
            attachments: [],
          });
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat laporan hafalan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s: any) => s.id === studentId);
    return student ? student.name : "Santri tidak ditemukan";
  };

  const getFluencyColor = (level: string) => {
    switch (level) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData
            ? "Edit Laporan Hafalan Quran"
            : "Buat Laporan Hafalan Quran Baru"}
        </CardTitle>
        <CardDescription>
          Catat perkembangan hafalan Al-Quran santri
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e: any) => handleSubmit(e)} className="space-y-6">
          {/* Student Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Santri</Label>
              <Select
                value={formData.studentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, studentId: value })
                }
                disabled={!!studentId || !!initialData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih santri" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testDate">Tanggal Uji</Label>
              <Input
                id="testDate"
                type="date"
                value={formData.testDate}
                onChange={(e) =>
                  setFormData({ ...formData, testDate: e.target.value })
                }
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Surah Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surah">Surah</Label>
              <Select
                value={formData.surah}
                onValueChange={(value) =>
                  setFormData({ ...formData, surah: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih surah" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {QURAN_SURAHS.map((surah) => (
                    <SelectItem key={surah} value={surah}>
                      {surah}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fluencyLevel">Tingkat Kelancaran</Label>
              <Select
                value={formData.fluencyLevel}
                onValueChange={(
                  value: "excellent" | "good" | "fair" | "poor"
                ) => setFormData({ ...formData, fluencyLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">
                    <div className="flex items-center gap-2">
                      <span>Sangat Lancar</span>
                      <Badge
                        className={`text-xs ${getFluencyColor("excellent")}`}
                      >
                        Excellent
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="good">
                    <div className="flex items-center gap-2">
                      <span>Lancar</span>
                      <Badge className={`text-xs ${getFluencyColor("good")}`}>
                        Good
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="fair">
                    <div className="flex items-center gap-2">
                      <span>Cukup Lancar</span>
                      <Badge className={`text-xs ${getFluencyColor("fair")}`}>
                        Fair
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="poor">
                    <div className="flex items-center gap-2">
                      <span>Kurang Lancar</span>
                      <Badge className={`text-xs ${getFluencyColor("poor")}`}>
                        Poor
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ayat Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ayatStart">Ayat Awal</Label>
              <Input
                id="ayatStart"
                type="number"
                min="1"
                value={formData.ayatStart}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ayatStart: parseInt(e.target.value),
                  })
                }
                placeholder="Nomor ayat awal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ayatEnd">Ayat Akhir</Label>
              <Input
                id="ayatEnd"
                type="number"
                min="1"
                value={formData.ayatEnd}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ayatEnd: parseInt(e.target.value),
                  })
                }
                placeholder="Nomor ayat akhir"
              />
            </div>
          </div>

          {/* Notes and Next Assignment */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Catatan tentang hafalan santri"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextAssignment">Tugas Selanjutnya</Label>
              <Input
                id="nextAssignment"
                value={formData.nextAssignment || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nextAssignment: e.target.value })
                }
                placeholder="Hafalan berikutnya yang ditugaskan"
              />
            </div>
          </div>

          {/* Selected Student Info */}
          {formData.studentId && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Informasi Santri Terpilih
              </h4>
              <p className="text-blue-700">
                <span className="font-medium">Nama:</span>{" "}
                {getStudentName(formData.studentId)}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Batal
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting
                ? "Menyimpan..."
                : initialData
                ? "Perbarui"
                : "Simpan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
