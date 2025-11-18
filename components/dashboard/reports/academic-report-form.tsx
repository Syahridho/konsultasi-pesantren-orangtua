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
  CreateAcademicReportData,
  useAcademicReports,
} from "@/lib/hooks/useAcademicReports";
import { useSantri } from "@/lib/hooks/useSantri";

interface AcademicReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<CreateAcademicReportData>;
  studentId?: string;
}

export default function AcademicReportForm({
  onSuccess,
  onCancel,
  initialData,
  studentId,
}: AcademicReportFormProps) {
  const { data: session } = useSession();
  const { createReport } = useAcademicReports();
  const { students } = useSantri({ limit: 1000 }); // Get all students for selection

  const [formData, setFormData] = useState<CreateAcademicReportData>({
    studentId: studentId || "",
    subject: "",
    gradeType: "number",
    gradeNumber: undefined,
    gradeLetter: undefined,
    gradeDescription: "",
    semester: "",
    academicYear: new Date().getFullYear().toString(),
    notes: "",
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

    if (!formData.subject) {
      toast.error("Mata pelajaran wajib diisi");
      return;
    }

    if (!formData.semester) {
      toast.error("Semester wajib diisi");
      return;
    }

    // Validate grade based on grade type
    if (
      formData.gradeType === "number" &&
      (formData.gradeNumber === undefined ||
        formData.gradeNumber < 0 ||
        formData.gradeNumber > 100)
    ) {
      toast.error("Nilai angka harus antara 0-100");
      return;
    }

    if (formData.gradeType === "letter" && !formData.gradeLetter) {
      toast.error("Nilai huruf wajib dipilih");
      return;
    }

    if (formData.gradeType === "description" && !formData.gradeDescription) {
      toast.error("Deskripsi nilai wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createReport(formData);
      if (result) {
        toast.success("Laporan akademik berhasil dibuat");
        onSuccess?.();

        // Reset form if not editing
        if (!initialData) {
          setFormData({
            studentId: studentId || "",
            subject: "",
            gradeType: "number",
            gradeNumber: undefined,
            gradeLetter: undefined,
            gradeDescription: "",
            semester: "",
            academicYear: new Date().getFullYear().toString(),
            notes: "",
            attachments: [],
          });
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat laporan akademik");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s: any) => s.id === studentId);
    return student ? student.name : "Santri tidak ditemukan";
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit Laporan Akademik" : "Buat Laporan Akademik Baru"}
        </CardTitle>
        <CardDescription>
          Catat nilai dan perkembangan akademik santri
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
              <Label htmlFor="academicYear">Tahun Akademik</Label>
              <Input
                id="academicYear"
                type="text"
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({ ...formData, academicYear: e.target.value })
                }
                placeholder="Contoh: 2023/2024"
              />
            </div>
          </div>

          {/* Subject and Semester */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Mata Pelajaran</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Contoh: Matematika, Bahasa Arab"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select
                value={formData.semester}
                onValueChange={(value) =>
                  setFormData({ ...formData, semester: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grade Type and Grade Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gradeType">Tipe Nilai</Label>
              <Select
                value={formData.gradeType}
                onValueChange={(value: "number" | "letter" | "description") =>
                  setFormData({ ...formData, gradeType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Nilai Angka (0-100)</SelectItem>
                  <SelectItem value="letter">Nilai Huruf (A-E)</SelectItem>
                  <SelectItem value="description">Nilai Deskripsi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Grade Input Based on Type */}
            {formData.gradeType === "number" && (
              <div className="space-y-2">
                <Label htmlFor="gradeNumber">Nilai (0-100)</Label>
                <Input
                  id="gradeNumber"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.gradeNumber || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gradeNumber: parseInt(e.target.value),
                    })
                  }
                  placeholder="Masukkan nilai 0-100"
                />
              </div>
            )}

            {formData.gradeType === "letter" && (
              <div className="space-y-2">
                <Label htmlFor="gradeLetter">Nilai Huruf</Label>
                <Select
                  value={formData.gradeLetter || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      gradeLetter: value as "A" | "B" | "C" | "D" | "E",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih nilai huruf" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A (Sangat Baik)</SelectItem>
                    <SelectItem value="B">B (Baik)</SelectItem>
                    <SelectItem value="C">C (Cukup)</SelectItem>
                    <SelectItem value="D">D (Kurang)</SelectItem>
                    <SelectItem value="E">E (Sangat Kurang)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.gradeType === "description" && (
              <div className="space-y-2">
                <Label htmlFor="gradeDescription">Deskripsi Nilai</Label>
                <Textarea
                  id="gradeDescription"
                  value={formData.gradeDescription || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gradeDescription: e.target.value,
                    })
                  }
                  placeholder="Deskripsikan pencapaian santri secara detail"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan Tambahan</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Catatan tambahan tentang perkembangan santri"
              rows={4}
            />
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
