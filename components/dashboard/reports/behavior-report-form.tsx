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
  CreateBehaviorReportData,
  useBehaviorReports,
} from "@/lib/hooks/useBehaviorReports";
import { useSantri } from "@/lib/hooks/useSantri";

interface BehaviorReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<CreateBehaviorReportData>;
  studentId?: string;
}

export default function BehaviorReportForm({
  onSuccess,
  onCancel,
  initialData,
  studentId,
}: BehaviorReportFormProps) {
  const { data: session } = useSession();
  const { createReport } = useBehaviorReports();
  const { students } = useSantri({ limit: 1000 }); // Get all students for selection

  const [formData, setFormData] = useState<CreateBehaviorReportData>({
    studentId: studentId || "",
    category: "behavior",
    priority: "medium",
    title: "",
    description: "",
    incidentDate: new Date().toISOString().split("T")[0],
    location: "",
    actionTaken: "",
    status: "open",
    followUpRequired: false,
    followUpDate: "",
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

    if (!formData.title) {
      toast.error("Judul laporan wajib diisi");
      return;
    }

    if (!formData.description || formData.description.length < 10) {
      toast.error("Deskripsi laporan minimal 10 karakter");
      return;
    }

    if (!formData.incidentDate) {
      toast.error("Tanggal kejadian wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createReport(formData);
      if (result) {
        toast.success("Laporan perilaku berhasil dibuat");
        onSuccess?.();

        // Reset form if not editing
        if (!initialData) {
          setFormData({
            studentId: studentId || "",
            category: "behavior",
            priority: "medium",
            title: "",
            description: "",
            incidentDate: new Date().toISOString().split("T")[0],
            location: "",
            actionTaken: "",
            status: "open",
            followUpRequired: false,
            followUpDate: "",
            attachments: [],
          });
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat laporan perilaku");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s: any) => s.id === studentId);
    return student ? student.name : "Santri tidak ditemukan";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "bg-green-100 text-green-800";
      case "behavior":
        return "bg-purple-100 text-purple-800";
      case "discipline":
        return "bg-red-100 text-red-800";
      case "health":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit Laporan Perilaku" : "Buat Laporan Perilaku Baru"}
        </CardTitle>
        <CardDescription>
          Catat masalah atau perkembangan perilaku santri
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
              <Label htmlFor="incidentDate">Tanggal Kejadian</Label>
              <Input
                id="incidentDate"
                type="date"
                value={formData.incidentDate}
                onChange={(e) =>
                  setFormData({ ...formData, incidentDate: e.target.value })
                }
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(
                  value:
                    | "academic"
                    | "behavior"
                    | "discipline"
                    | "health"
                    | "other"
                ) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">
                    <div className="flex items-center gap-2">
                      <span>Akademik</span>
                      <Badge
                        className={`text-xs ${getCategoryColor("academic")}`}
                      >
                        Pelajaran
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="behavior">
                    <div className="flex items-center gap-2">
                      <span>Perilaku</span>
                      <Badge
                        className={`text-xs ${getCategoryColor("behavior")}`}
                      >
                        Sosial
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="discipline">
                    <div className="flex items-center gap-2">
                      <span>Disiplin</span>
                      <Badge
                        className={`text-xs ${getCategoryColor("discipline")}`}
                      >
                        Kedisiplinan
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="health">
                    <div className="flex items-center gap-2">
                      <span>Kesehatan</span>
                      <Badge
                        className={`text-xs ${getCategoryColor("health")}`}
                      >
                        Medis
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <span>Lainnya</span>
                      <Badge className={`text-xs ${getCategoryColor("other")}`}>
                        Umum
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioritas</Label>
              <Select
                value={formData.priority}
                onValueChange={(
                  value: "low" | "medium" | "high" | "critical"
                ) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <span>Rendah</span>
                      <Badge className={`text-xs ${getPriorityColor("low")}`}>
                        Low
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <span>Sedang</span>
                      <Badge
                        className={`text-xs ${getPriorityColor("medium")}`}
                      >
                        Medium
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <span>Tinggi</span>
                      <Badge className={`text-xs ${getPriorityColor("high")}`}>
                        High
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <span>Kritis</span>
                      <Badge
                        className={`text-xs ${getPriorityColor("critical")}`}
                      >
                        Critical
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Laporan</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Judul singkat laporan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokasi (Opsional)</Label>
              <Input
                id="location"
                value={formData.location || ""}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Contoh: Kelas, Masjid, Lapangan"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Kejadian</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Jelaskan secara detail kejadian yang terjadi"
              rows={4}
            />
          </div>

          {/* Action Taken */}
          <div className="space-y-2">
            <Label htmlFor="actionTaken">Tindakan yang Diambil</Label>
            <Textarea
              id="actionTaken"
              value={formData.actionTaken || ""}
              onChange={(e) =>
                setFormData({ ...formData, actionTaken: e.target.value })
              }
              placeholder="Tindakan yang telah diambil terkait laporan ini"
              rows={3}
            />
          </div>

          {/* Status and Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(
                  value: "open" | "in_progress" | "resolved" | "closed"
                ) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Terbuka</SelectItem>
                  <SelectItem value="in_progress">Dalam Proses</SelectItem>
                  <SelectItem value="resolved">Selesai</SelectItem>
                  <SelectItem value="closed">Ditutup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      followUpRequired: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <Label
                  htmlFor="followUpRequired"
                  className="text-sm font-medium text-gray-700"
                >
                  Perlu Tindak Lanjutan
                </Label>
              </div>

              {formData.followUpRequired && (
                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Tanggal Tindak Lanjutan</Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={formData.followUpDate || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, followUpDate: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Selected Student Info */}
          {formData.studentId && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                Informasi Santri Terpilih
              </h4>
              <p className="text-green-700">
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
