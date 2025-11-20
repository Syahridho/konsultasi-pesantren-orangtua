"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users, Calendar, Clock, User, BookOpen } from "lucide-react";
import { Class } from "@/lib/hooks/useClasses";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ViewKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelas: Class | null;
}

export default function ViewKelasModal({
  isOpen,
  onClose,
  kelas,
}: ViewKelasModalProps) {
  if (!kelas) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Kelas</DialogTitle>
          <DialogDescription>
            Informasi lengkap mengenai kelas {kelas.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{kelas.name}</CardTitle>
                  <CardDescription className="text-lg">
                    Tahun Akademik {kelas.academicYear}
                  </CardDescription>
                </div>
                <Badge
                  variant={kelas.status === "active" ? "default" : "secondary"}
                >
                  {kelas.status === "active" ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Class Details Grid */}
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
                  <p className="text-lg">{kelas.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Tahun Akademik
                  </label>
                  <p className="text-lg">{kelas.academicYear}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        kelas.status === "active" ? "default" : "secondary"
                      }
                    >
                      {kelas.status === "active" ? "Aktif" : "Tidak Aktif"}
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
                  <p className="text-lg">{formatDays(kelas.schedule.days)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Waktu
                  </label>
                  <div className="flex items-center gap-2 text-lg">
                    <Clock className="h-4 w-4" />
                    <span>
                      {kelas.schedule.startTime} - {kelas.schedule.endTime}
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
                  <p className="text-lg">{kelas.ustadName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    ID Pengajar
                  </label>
                  <p className="text-lg font-mono">{kelas.ustadId}</p>
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
                    {kelas.studentCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Santri</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      Object.values(kelas.studentIds || {}).filter(
                        (s) => s.status === "active"
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Santri Aktif</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {
                      Object.values(kelas.studentIds || {}).filter(
                        (s) => s.status !== "active"
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    Santri Tidak Aktif
                  </div>
                </div>
              </div>

              {kelas.studentIds && Object.keys(kelas.studentIds).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Daftar Santri
                  </label>
                  <div className="mt-2 max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>NIS</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tanggal Daftar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(kelas.studentIds).map(
                          ([studentId, studentInfo]) => (
                            <TableRow key={studentId}>
                              <TableCell className="font-medium">
                                {studentId}
                              </TableCell>
                              <TableCell>{studentInfo.nis || "-"}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    studentInfo.status === "active"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {studentInfo.status === "active"
                                    ? "Aktif"
                                    : "Tidak Aktif"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {formatDate(studentInfo.enrolledAt)}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pembuatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Dibuat oleh
                  </label>
                  <p className="text-lg">{kelas.createdByName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Tanggal Pembuatan
                  </label>
                  <p className="text-lg">{formatDate(kelas.createdAt)}</p>
                </div>
                {kelas.updatedAt && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Terakhir diperbarui
                      </label>
                      <p className="text-lg">{formatDate(kelas.updatedAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Diperbarui oleh
                      </label>
                      <p className="text-lg">
                        {(kelas as any).updatedByName || "-"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
