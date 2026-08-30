"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  Archive,
} from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  academicYear: string;
  ustadName: string;
  status: string;
  studentCount: number;
  studentIds?: Record<string, { enrolledAt: string; status: string }>;
}

interface StudentInfo {
  id: string;
  name: string;
  email: string;
}

interface PromoteKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: ClassData[];
}

type Step = 1 | 2 | 3;

export default function PromoteKelasModal({
  isOpen,
  onClose,
  onSuccess,
  classes,
}: PromoteKelasModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [fromClassId, setFromClassId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [archiveFromClass, setArchiveFromClass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fromClass = classes.find((c) => c.id === fromClassId);
  const toClass = classes.find((c) => c.id === toClassId);

  // Reset state saat modal dibuka/ditutup
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setFromClassId("");
        setToClassId("");
        setStudents([]);
        setSelectedStudentIds(new Set());
        setArchiveFromClass(false);
        setIsSubmitting(false);
      }, 300);
    }
  }, [isOpen]);

  // Ambil daftar santri dari kelas asal ketika kelas asal dipilih
  useEffect(() => {
    if (!fromClassId) {
      setStudents([]);
      setSelectedStudentIds(new Set());
      return;
    }

    const fetchStudentsInClass = async () => {
      setLoadingStudents(true);
      try {
        // Ambil student IDs dari kelas asal
        const kelasAsal = classes.find((c) => c.id === fromClassId);
        if (!kelasAsal?.studentIds) {
          setStudents([]);
          setSelectedStudentIds(new Set());
          setLoadingStudents(false);
          return;
        }

        const studentIds = Object.keys(kelasAsal.studentIds);
        if (studentIds.length === 0) {
          setStudents([]);
          setSelectedStudentIds(new Set());
          setLoadingStudents(false);
          return;
        }

        // Fetch detail santri
        const response = await fetch(
          `/api/santri?limit=200&status=active`
        );
        if (!response.ok) throw new Error("Gagal mengambil data santri");

        const data = await response.json();
        const allStudents: StudentInfo[] = data.students || [];

        // Filter hanya santri yang ada di kelas asal
        const classStudents = allStudents.filter((s) =>
          studentIds.includes(s.id)
        );

        setStudents(classStudents);
        // Pilih semua santri secara default
        setSelectedStudentIds(new Set(classStudents.map((s) => s.id)));
      } catch (err) {
        console.error("Error fetching students:", err);
        toast.error("Gagal memuat daftar santri");
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudentsInClass();
  }, [fromClassId, classes]);

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const toggleAllStudents = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s.id)));
    }
  };

  const canProceedStep1 = fromClassId !== "";
  const canProceedStep2 = toClassId !== "" && toClassId !== fromClassId;
  const canSubmit = selectedStudentIds.size > 0;

  const handleNext = () => {
    if (step === 1 && canProceedStep1) setStep(2);
    else if (step === 2 && canProceedStep2) setStep(3);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/classes/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromClassId,
          toClassId,
          studentIds: Array.from(selectedStudentIds),
          archiveFromClass,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memproses naik kelas");
      }

      toast.success(data.message);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeClasses = classes.filter((c) => c.status === "active");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="h-6 w-6 text-primary" />
            Naik Kelas / Promosi Semester
          </DialogTitle>
          <DialogDescription>
            Pindahkan santri dari kelas lama ke kelas baru untuk semester
            berikutnya.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 py-3 border-b">
          {[
            { num: 1, label: "Kelas Asal" },
            { num: 2, label: "Kelas Tujuan" },
            { num: 3, label: "Konfirmasi" },
          ].map(({ num, label }, idx) => (
            <div key={num} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                  step > num
                    ? "bg-green-500 text-white"
                    : step === num
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > num ? <CheckCircle2 className="h-4 w-4" /> : num}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  step === num ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
              {idx < 2 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          {/* Step 1: Pilih Kelas Asal */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-2 block">
                  Pilih Kelas Asal
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Pilih kelas yang santrinya akan dipromosikan ke semester
                  berikutnya.
                </p>
                <Select value={fromClassId} onValueChange={setFromClassId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Pilih kelas asal --" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeClasses.map((kelas) => (
                      <SelectItem key={kelas.id} value={kelas.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{kelas.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({kelas.academicYear}) · {kelas.studentCount || 0}{" "}
                            santri
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {fromClass && (
                <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                  <p className="font-semibold text-sm">{fromClass.name}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {fromClass.studentCount || 0} santri terdaftar
                    </span>
                    <span>Tahun: {fromClass.academicYear}</span>
                    <span>Pengajar: {fromClass.ustadName}</span>
                  </div>
                  {(fromClass.studentCount || 0) === 0 && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm mt-1">
                      <AlertCircle className="h-4 w-4" />
                      Kelas ini tidak memiliki santri
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Pilih Kelas Tujuan */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-2 block">
                  Pilih Kelas Tujuan
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Pilih kelas yang akan menerima santri dari{" "}
                  <strong>{fromClass?.name}</strong>.
                </p>
                <Select value={toClassId} onValueChange={setToClassId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Pilih kelas tujuan --" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeClasses
                      .filter((c) => c.id !== fromClassId)
                      .map((kelas) => (
                        <SelectItem key={kelas.id} value={kelas.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{kelas.name}</span>
                            <span className="text-muted-foreground text-xs">
                              ({kelas.academicYear}) · {kelas.studentCount || 0}{" "}
                              santri
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview ringkasan perpindahan */}
              {fromClass && toClass && (
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="font-semibold text-sm">Ringkasan Perpindahan</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center bg-red-50 dark:bg-red-950/30 rounded-md p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Dari
                      </p>
                      <p className="font-bold text-sm">{fromClass.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fromClass.academicYear}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 text-center bg-green-50 dark:bg-green-950/30 rounded-md p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Ke
                      </p>
                      <p className="font-bold text-sm">{toClass.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {toClass.academicYear}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Opsi arsipkan kelas lama */}
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  id="archive-class"
                  checked={archiveFromClass}
                  onCheckedChange={(checked) =>
                    setArchiveFromClass(checked === true)
                  }
                />
                <div>
                  <Label
                    htmlFor="archive-class"
                    className="font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    Arsipkan kelas asal setelah promosi
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kelas <strong>{fromClass?.name}</strong> akan ditandai
                    sebagai &ldquo;Diarsipkan&rdquo;. Data tetap tersimpan namun
                    tidak aktif.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Konfirmasi & Pilih Santri */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-semibold">
                    Pilih Santri yang Naik Kelas
                  </Label>
                  <Badge variant="outline">
                    {selectedStudentIds.size} / {students.length} dipilih
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Centang santri yang akan dipromosikan. Santri yang tidak
                  dicentang akan tetap di kelas{" "}
                  <strong>{fromClass?.name}</strong> (tinggal kelas).
                </p>

                {loadingStudents ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Memuat daftar santri...
                    </span>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p>Tidak ada santri di kelas ini</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    {/* Select All */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b">
                      <Checkbox
                        id="select-all"
                        checked={selectedStudentIds.size === students.length}
                        onCheckedChange={toggleAllStudents}
                      />
                      <Label
                        htmlFor="select-all"
                        className="font-medium cursor-pointer text-sm"
                      >
                        Pilih Semua Santri
                      </Label>
                    </div>

                    {/* Daftar Santri */}
                    <div className="divide-y max-h-56 overflow-y-auto">
                      {students.map((student) => {
                        const isSelected = selectedStudentIds.has(student.id);
                        return (
                          <div
                            key={student.id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                              isSelected ? "" : "opacity-60"
                            }`}
                            onClick={() => toggleStudent(student.id)}
                          >
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleStudent(student.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {student.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {student.email}
                              </p>
                            </div>
                            {isSelected ? (
                              <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-0">
                                Naik Kelas
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs text-amber-600 border-amber-300"
                              >
                                Tinggal Kelas
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Ringkasan Akhir */}
              {students.length > 0 && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                  <p className="font-semibold text-sm">Ringkasan Aksi</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>
                      ✅{" "}
                      <strong>{selectedStudentIds.size} santri</strong> akan
                      dipindahkan ke{" "}
                      <strong>{toClass?.name}</strong>
                    </li>
                    {students.length - selectedStudentIds.size > 0 && (
                      <li>
                        ⚠️{" "}
                        <strong>
                          {students.length - selectedStudentIds.size} santri
                        </strong>{" "}
                        tetap di <strong>{fromClass?.name}</strong> (tinggal
                        kelas)
                      </li>
                    )}
                    {archiveFromClass && selectedStudentIds.size === students.length && (
                      <li>
                        📦 Kelas <strong>{fromClass?.name}</strong> akan
                        diarsipkan
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between border-t pt-4 mt-auto">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : handleBack}
            disabled={isSubmitting}
          >
            {step === 1 ? "Batal" : "← Kembali"}
          </Button>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2)
                }
              >
                Lanjut →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Proses Naik Kelas
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
