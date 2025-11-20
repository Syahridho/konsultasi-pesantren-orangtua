"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  User,
  BookOpen,
  Edit,
  Trash2,
} from "lucide-react";
import { useClasses } from "@/lib/hooks/useClasses";
import { Class } from "@/lib/hooks/useClasses";
import ViewKelasModal from "@/components/dashboard/kelas/view-kelas-modal";
import EditKelasModal from "@/components/dashboard/kelas/edit-kelas-modal";
import DeleteKelasModal from "@/components/dashboard/kelas/delete-kelas-modal";

export default function KelasDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Get all classes to find the specific one
  const { classes, loading, error, refetch } = useClasses(
    session?.user?.id ? { ustadId: session.user.id } : undefined
  );

  const handleSuccess = () => {
    // Refresh the data after successful operation
    refetch();
  };

  const selectedClass = classes?.find((c: Class) => c.id === classId);

  const formatDays = (days: string[]) => {
    const dayNames: { [key: string]: string } = {
      Senin: "Senin",
      Selasa: "Selasa",
      Rabu: "Rabu",
      Kamis: "Kamis",
      Jumat: "Jumat",
      Sabtu: "Sabtu",
    };
    return days.map((day) => dayNames[day] || day).join(", ");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Memuat data kelas...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Kelas tidak ditemukan</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
          <h1 className="text-3xl font-bold">Detail Kelas</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewModalOpen(true)}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Lihat Data Lengkap
          </Button>
          <Button
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Header Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedClass.name}</CardTitle>
                <CardDescription className="text-lg">
                  Tahun Akademik {selectedClass.academicYear}
                </CardDescription>
              </div>
              <Badge
                variant={
                  selectedClass.status === "active" ? "default" : "secondary"
                }
              >
                {selectedClass.status === "active" ? "Aktif" : "Tidak Aktif"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Nama Kelas
                </label>
                <p className="text-lg">{selectedClass.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tahun Akademik
                </label>
                <p className="text-lg">{selectedClass.academicYear}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedClass.status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedClass.status === "active"
                      ? "Aktif"
                      : "Tidak Aktif"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Jadwal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Hari
                </label>
                <p className="text-lg">
                  {formatDays(selectedClass.schedule.days)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Waktu
                </label>
                <div className="flex items-center gap-2 text-lg">
                  <Clock className="h-4 w-4" />
                  <span>
                    {selectedClass.schedule.startTime} -{" "}
                    {selectedClass.schedule.endTime}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Pengajar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Nama Pengajar
                </label>
                <p className="text-lg">{selectedClass.ustadName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  ID Pengajar
                </label>
                <p className="text-lg font-mono">{selectedClass.ustadId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informasi Santri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedClass.studentCount || 0}
                </div>
                <div className="text-sm text-gray-600">Total Santri</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {
                    Object.values(selectedClass.studentIds || {}).filter(
                      (s) => s.status === "active"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">Santri Aktif</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {
                    Object.values(selectedClass.studentIds || {}).filter(
                      (s) => s.status !== "active"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">Santri Tidak Aktif</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ViewKelasModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        kelas={selectedClass}
      />

      <EditKelasModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleSuccess}
        kelas={selectedClass}
      />

      <DeleteKelasModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleSuccess}
        kelas={selectedClass}
      />
    </div>
  );
}
