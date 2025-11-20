"use client";

import React, { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Class, useClasses } from "@/lib/hooks/useClasses";
import {
  generateAcademicYears,
  generateTimeOptions,
  DAYS_OF_WEEK,
} from "@/lib/validations/class-schema";

interface EditKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelas: Class | null;
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

  // Fetch teachers on component mount
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        // This would typically be an API call, but for now we'll use mock data
        // In a real implementation, you'd fetch from /api/ustads
        const mockTeachers = [
          { id: "teacher1", name: "Ustadz Ahmad" },
          { id: "teacher2", name: "Ustadz Budi" },
          { id: "teacher3", name: "Ustadz Charli" },
        ];
        setTeachers(mockTeachers);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    };

    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  // Reset form when kelas changes
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
    }
  }, [kelas]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => {
        const parentValue = prev[parent as keyof typeof prev];
        if (typeof parentValue === 'object' && parentValue !== null) {
          return {
            ...prev,
            [parent]: {
              ...parentValue,
              [child]: value,
            },
          };
        }
        return prev;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kelas) return;

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Nama kelas wajib diisi");
      return;
    }

    if (!formData.academicYear) {
      toast.error("Tahun akademik wajib dipilih");
      return;
    }

    if (!formData.ustadId) {
      toast.error("Pengajar wajib dipilih");
      return;
    }

    if (formData.schedule.days.length === 0) {
      toast.error("Pilih minimal 1 hari");
      return;
    }

    if (!formData.schedule.startTime || !formData.schedule.endTime) {
      toast.error("Waktu mulai dan selesai wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await updateClass(kelas.id, formData);
      if (success) {
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

  if (!kelas) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Kelas</DialogTitle>
          <DialogDescription>
            Perbarui informasi kelas {kelas.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
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
                  onValueChange={(value) => handleInputChange("ustadId", value)}
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

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle>Jadwal</CardTitle>
              <CardDescription>Atur jadwal pertemuan kelas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hari Pertemuan</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={formData.schedule.days.includes(day)}
                        onCheckedChange={(checked: boolean) =>
                          handleDayToggle(day, checked)
                        }
                      />
                      <Label htmlFor={day} className="text-sm">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Waktu Mulai</Label>
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
                  <Label htmlFor="endTime">Waktu Selesai</Label>
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

              {/* Schedule Preview */}
              {formData.schedule.days.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Preview Jadwal</Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {formData.schedule.days.join(", ")} -{" "}
                      {formData.schedule.startTime} s/d{" "}
                      {formData.schedule.endTime}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
