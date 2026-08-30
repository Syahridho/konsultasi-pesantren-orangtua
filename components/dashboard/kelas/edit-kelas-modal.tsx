"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  UserPlus,
  Trash2,
  Search,
  Users,
  Loader2,
  BookOpen,
  Calendar,
} from "lucide-react";
import { Class, useClasses } from "@/lib/hooks/useClasses";
import {
  generateAcademicYears,
  generateTimeOptions,
  DAYS_OF_WEEK,
} from "@/lib/validations/class-schema";
import { ref, get, update } from "firebase/database";
import { database } from "@/lib/firebase";

interface EditKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelas: Class | null;
}

interface StudentDetail {
  id: string;
  name: string;
  email: string;
  nis?: string;
  enrolledAt: string;
  status: string;
}

interface AvailableStudent {
  id: string;
  name: string;
  email: string;
  nis?: string;
}

export default function EditKelasModal({
  isOpen,
  onClose,
  onSuccess,
  kelas,
}: EditKelasModalProps) {
  const { updateClass } = useClasses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [formData, setFormData] = useState({
    name: "",
    academicYear: "",
    ustadId: "",
    schedule: {
      days: [] as string[],
      startTime: "",
      endTime: "",
    },
  });

  // Santri state
  const [enrolledStudents, setEnrolledStudents] = useState<StudentDetail[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [searchAdd, setSearchAdd] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [isAddingStudents, setIsAddingStudents] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<StudentDetail | null>(null);
  const [isRemovingStudent, setIsRemovingStudent] = useState(false);

  // ─── Fetch teachers ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const fetchTeachers = async () => {
      try {
        const res = await fetch("/api/ustads");
        if (res.ok) {
          const data = await res.json();
          const list = data.ustadList || data.ustads || [];
          setTeachers(
            list.map((u: any) => ({ id: u.id, name: u.name }))
          );
        }
      } catch {
        console.error("Error fetching teachers");
      }
    };
    fetchTeachers();
  }, [isOpen]);

  // ─── Reset form & fetch santri saat kelas berubah ─────────────────
  useEffect(() => {
    if (kelas) {
      setFormData({
        name: kelas.name,
        academicYear: kelas.academicYear,
        ustadId: kelas.ustadId,
        schedule: {
          days: kelas.schedule.days,
          startTime: kelas.schedule.startTime,
          endTime: kelas.schedule.endTime,
        },
      });
      fetchEnrolledStudents(kelas);
    }
  }, [kelas]);

  // ─── Ambil detail nama santri yang terdaftar ──────────────────────
  const fetchEnrolledStudents = useCallback(async (classData: Class) => {
    if (!classData.studentIds || Object.keys(classData.studentIds).length === 0) {
      setEnrolledStudents([]);
      return;
    }
    setLoadingStudents(true);
    try {
      const usersRef = ref(database, "users");
      const snap = await get(usersRef);
      if (!snap.exists()) { setEnrolledStudents([]); return; }
      const users = snap.val();
      const list: StudentDetail[] = Object.entries(classData.studentIds).map(
        ([studentId, info]) => ({
          id: studentId,
          name: users[studentId]?.name || `ID: ${studentId}`,
          email: users[studentId]?.email || "-",
          nis: users[studentId]?.nis || "-",
          enrolledAt: info.enrolledAt,
          status: info.status,
        })
      );
      list.sort((a, b) => a.name.localeCompare(b.name));
      setEnrolledStudents(list);
    } catch (err) {
      console.error("Error fetching enrolled students:", err);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  // ─── Ambil santri yang belum masuk kelas ini ─────────────────────
  const fetchAvailableStudents = useCallback(async () => {
    setLoadingAvailable(true);
    try {
      const res = await fetch("/api/santri?limit=500&status=active");
      if (!res.ok) throw new Error("Gagal mengambil data santri");
      const data = await res.json();
      const allStudents: AvailableStudent[] = (data.students || []).map(
        (s: any) => ({ id: s.id, name: s.name, email: s.email, nis: s.nis })
      );

      const enrolledIds = new Set(enrolledStudents.map((s) => s.id));
      const available = allStudents.filter((s) => !enrolledIds.has(s.id));
      available.sort((a, b) => a.name.localeCompare(b.name));
      setAvailableStudents(available);
    } catch {
      toast.error("Gagal memuat daftar santri");
    } finally {
      setLoadingAvailable(false);
    }
  }, [enrolledStudents]);

  // ─── Form helpers ─────────────────────────────────────────────────
  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => {
        const parentValue = prev[parent as keyof typeof prev];
        if (typeof parentValue === "object" && parentValue !== null) {
          return { ...prev, [parent]: { ...parentValue, [child]: value } };
        }
        return prev;
      });
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        days: checked
          ? [...prev.schedule.days, day]
          : prev.schedule.days.filter((d) => d !== day),
      },
    }));
  };

  // ─── Submit form info kelas ───────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelas) return;

    if (!formData.name.trim()) return toast.error("Nama kelas wajib diisi");
    if (!formData.academicYear) return toast.error("Tahun akademik wajib dipilih");
    if (!formData.ustadId) return toast.error("Pengajar wajib dipilih");
    if (formData.schedule.days.length === 0) return toast.error("Pilih minimal 1 hari");
    if (!formData.schedule.startTime || !formData.schedule.endTime)
      return toast.error("Waktu mulai dan selesai wajib diisi");

    setIsSubmitting(true);
    try {
      const success = await updateClass(kelas.id, formData);
      if (success) {
        // Jika nama kelas berubah, update currentClass di semua santri terdaftar
        if (formData.name !== kelas.name && enrolledStudents.length > 0) {
          const studentUpdates: Record<string, any> = {};
          enrolledStudents.forEach((s) => {
            studentUpdates[`users/${s.id}/currentClass`] = formData.name;
          });
          await update(ref(database), studentUpdates);
        }
        toast.success("Kelas berhasil diperbarui");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui kelas");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Tambah santri ke kelas ───────────────────────────────────────
  const handleAddStudents = async () => {
    if (!kelas || selectedToAdd.size === 0) return;
    setIsAddingStudents(true);
    try {
      const now = new Date().toISOString();
      const updates: Record<string, any> = {};

      selectedToAdd.forEach((studentId) => {
        updates[`classes/${kelas.id}/studentIds/${studentId}`] = {
          enrolledAt: now,
          status: "active",
        };
        // Update currentClass di profil santri
        updates[`users/${studentId}/currentClass`] = kelas.name;
      });

      await update(ref(database), updates);

      toast.success(`${selectedToAdd.size} santri berhasil ditambahkan ke kelas`);
      setSelectedToAdd(new Set());
      setSearchAdd("");

      // Refresh daftar santri
      const updatedStudentIds = {
        ...kelas.studentIds,
        ...Object.fromEntries(
          Array.from(selectedToAdd).map((id) => [
            id,
            { enrolledAt: now, status: "active" },
          ])
        ),
      };
      await fetchEnrolledStudents({ ...kelas, studentIds: updatedStudentIds });
      await fetchAvailableStudents();
      onSuccess();
    } catch {
      toast.error("Gagal menambahkan santri");
    } finally {
      setIsAddingStudents(false);
    }
  };

  // ─── Hapus santri dari kelas ──────────────────────────────────────
  const handleRemoveStudent = async () => {
    if (!kelas || !studentToRemove) return;
    setIsRemovingStudent(true);
    try {
      const updates: Record<string, any> = {};
      updates[`classes/${kelas.id}/studentIds/${studentToRemove.id}`] = null;
      // Hapus currentClass dari profil santri
      updates[`users/${studentToRemove.id}/currentClass`] = null;

      await update(ref(database), updates);

      toast.success(`${studentToRemove.name} berhasil dikeluarkan dari kelas`);
      setEnrolledStudents((prev) =>
        prev.filter((s) => s.id !== studentToRemove.id)
      );
      setStudentToRemove(null);
      await fetchAvailableStudents();
      onSuccess();
    } catch {
      toast.error("Gagal mengeluarkan santri dari kelas");
    } finally {
      setIsRemovingStudent(false);
    }
  };

  // ─── Filter santri tersedia ───────────────────────────────────────
  const filteredAvailable = availableStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(searchAdd.toLowerCase()) ||
      s.email.toLowerCase().includes(searchAdd.toLowerCase()) ||
      (s.nis || "").toLowerCase().includes(searchAdd.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!kelas) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Edit Kelas — {kelas.name}
            </DialogTitle>
            <DialogDescription>
              Perbarui informasi kelas dan kelola daftar santri
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Informasi Kelas
              </TabsTrigger>
              <TabsTrigger
                value="students"
                className="flex items-center gap-2"
                onClick={() => {
                  if (availableStudents.length === 0) fetchAvailableStudents();
                }}
              >
                <Users className="h-4 w-4" />
                Santri
                <Badge variant="secondary" className="ml-1 text-xs px-1.5">
                  {enrolledStudents.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Informasi Kelas ─────────────────────────────── */}
            <TabsContent value="info" className="flex-1 overflow-y-auto mt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Informasi Dasar</CardTitle>
                    <CardDescription>Informasi umum mengenai kelas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nama Kelas</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Masukkan nama kelas"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="academicYear">Tahun Akademik</Label>
                      <Select
                        value={formData.academicYear}
                        onValueChange={(value) =>
                          handleInputChange("academicYear", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tahun akademik" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateAcademicYears().map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="ustadId">Pengajar</Label>
                      <Select
                        value={formData.ustadId}
                        onValueChange={(value) =>
                          handleInputChange("ustadId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pengajar" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Jadwal</CardTitle>
                    <CardDescription>Atur jadwal pertemuan kelas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Hari Pertemuan</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${day}`}
                              checked={formData.schedule.days.includes(day)}
                              onCheckedChange={(checked: boolean) =>
                                handleDayToggle(day, checked)
                              }
                            />
                            <Label htmlFor={`edit-${day}`} className="text-sm cursor-pointer">
                              {day}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Waktu Mulai</Label>
                        <Select
                          value={formData.schedule.startTime}
                          onValueChange={(value) =>
                            handleInputChange("schedule.startTime", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih waktu mulai" />
                          </SelectTrigger>
                          <SelectContent>
                            {generateTimeOptions().map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Waktu Selesai</Label>
                        <Select
                          value={formData.schedule.endTime}
                          onValueChange={(value) =>
                            handleInputChange("schedule.endTime", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih waktu selesai" />
                          </SelectTrigger>
                          <SelectContent>
                            {generateTimeOptions().map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.schedule.days.length > 0 && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-sm font-medium">Preview Jadwal</Label>
                        <div className="mt-1">
                          <Badge variant="outline">
                            {formData.schedule.days.join(", ")} —{" "}
                            {formData.schedule.startTime} s/d{" "}
                            {formData.schedule.endTime}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pb-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[130px]">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Perubahan"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* ── Tab: Santri ─────────────────────────────────────── */}
            <TabsContent value="students" className="flex-1 overflow-hidden flex flex-col mt-4 gap-4">
              {/* Santri terdaftar */}
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="pb-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Santri Terdaftar
                      <Badge variant="secondary">{enrolledStudents.length}</Badge>
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Klik ikon hapus untuk mengeluarkan santri dari kelas ini
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto pt-0">
                  {loadingStudents ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Memuat santri...</span>
                    </div>
                  ) : enrolledStudents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Belum ada santri di kelas ini</p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>NIS</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Terdaftar</TableHead>
                            <TableHead className="text-right">Hapus</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enrolledStudents.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{student.name}</p>
                                  <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{student.nis || "-"}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={student.status === "active" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {student.status === "active" ? "Aktif" : "Tidak Aktif"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDate(student.enrolledAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setStudentToRemove(student)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tambah santri baru */}
              <Card className="shrink-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Tambah Santri ke Kelas
                  </CardTitle>
                  <CardDescription>
                    Cari dan pilih santri yang belum terdaftar di kelas ini
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama, email, atau NIS santri..."
                      value={searchAdd}
                      onChange={(e) => setSearchAdd(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Daftar santri tersedia */}
                  {loadingAvailable ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Memuat santri...</span>
                    </div>
                  ) : filteredAvailable.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      {availableStudents.length === 0
                        ? "Semua santri aktif sudah terdaftar di kelas ini"
                        : "Tidak ada santri yang cocok dengan pencarian"}
                    </div>
                  ) : (
                    <div className="rounded-md border max-h-48 overflow-y-auto divide-y">
                      {filteredAvailable.map((student) => {
                        const isSelected = selectedToAdd.has(student.id);
                        return (
                          <div
                            key={student.id}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors ${
                              isSelected ? "bg-primary/5" : ""
                            }`}
                            onClick={() => {
                              setSelectedToAdd((prev) => {
                                const next = new Set(prev);
                                isSelected ? next.delete(student.id) : next.add(student.id);
                                return next;
                              });
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => {
                                setSelectedToAdd((prev) => {
                                  const next = new Set(prev);
                                  isSelected ? next.delete(student.id) : next.add(student.id);
                                  return next;
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{student.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                            </div>
                            {student.nis && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                NIS: {student.nis}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tombol tambah */}
                  {selectedToAdd.size > 0 && (
                    <Button
                      className="w-full"
                      onClick={handleAddStudents}
                      disabled={isAddingStudents}
                    >
                      {isAddingStudents ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Menambahkan...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Tambah {selectedToAdd.size} Santri ke Kelas
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus santri */}
      <AlertDialog
        open={!!studentToRemove}
        onOpenChange={(open) => !open && setStudentToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluarkan Santri dari Kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{studentToRemove?.name}</strong> akan dikeluarkan dari kelas{" "}
              <strong>{kelas.name}</strong>. Data santri tidak akan dihapus, hanya
              keanggotaan kelasnya yang dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingStudent}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveStudent}
              disabled={isRemovingStudent}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemovingStudent ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Ya, Keluarkan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
