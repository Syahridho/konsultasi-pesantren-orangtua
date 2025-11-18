"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  Users,
  Clock,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ClassDetailsInput,
  StudentEnrollmentInput,
} from "@/lib/validations/class-schema";
import { useUstad } from "@/lib/hooks/useUstad";
import { useSantri } from "@/lib/hooks/useSantri";

interface ConfirmationStepProps {
  classData: ClassDetailsInput & StudentEnrollmentInput;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export function ConfirmationStep({
  classData,
  onSubmit,
  isSubmitting,
  canSubmit,
}: ConfirmationStepProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showFullStudentList, setShowFullStudentList] = useState(false);

  // Get teacher details
  const { teachers } = useUstad();
  const selectedTeacher = teachers.find((t) => t.id === classData.ustadId);

  // Get student details
  const { students } = useSantri();
  const selectedStudents = students.filter((s) =>
    classData.studentIds.includes(s.id)
  );

  const formatScheduleDisplay = (schedule: ClassDetailsInput["schedule"]) => {
    const dayNames = {
      Senin: "Senin",
      Selasa: "Selasa",
      Rabu: "Rabu",
      Kamis: "Kamis",
      Jumat: "Jumat",
      Sabtu: "Sabtu",
    };

    const days = schedule.days.map(
      (day) => dayNames[day as keyof typeof dayNames] || day
    );
    return `${days.join(", ")}, ${schedule.startTime} - ${schedule.endTime}`;
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      return;
    }
    await onSubmit();
  };

  const displayedStudents = showFullStudentList
    ? selectedStudents
    : selectedStudents.slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Konfirmasi Pembuatan Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Class Information Summary */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Informasi Kelas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Nama Kelas</p>
                  <p className="font-medium text-blue-900">{classData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Tahun Akademik</p>
                  <p className="font-medium text-blue-900">
                    {classData.academicYear}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-blue-700">Jadwal</p>
                <p className="font-medium text-blue-900">
                  {formatScheduleDisplay(classData.schedule)}
                </p>
              </div>
            </div>

            {/* Teacher Information */}
            {selectedTeacher && (
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Informasi Pengajar
                </h3>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-green-700">Nama Pengajar</p>
                    <p className="font-medium text-green-900">
                      {selectedTeacher.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Email</p>
                    <p className="font-medium text-green-900">
                      {selectedTeacher.email}
                    </p>
                  </div>
                  {selectedTeacher.specialization && (
                    <div>
                      <p className="text-sm text-green-700">Spesialisasi</p>
                      <p className="font-medium text-green-900">
                        {selectedTeacher.specialization}
                      </p>
                    </div>
                  )}
                  {selectedTeacher.currentClasses !== undefined && (
                    <div>
                      <p className="text-sm text-green-700">
                        Jumlah Kelas Aktif
                      </p>
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        {selectedTeacher.currentClasses} kelas
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Student Enrollment Summary */}
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pendaftaran Santri
              </h3>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-purple-700">
                    Total Santri Dipilih
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {selectedStudents.length}
                  </p>
                </div>
                {selectedStudents.length > 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullStudentList(!showFullStudentList)}
                  >
                    {showFullStudentList
                      ? "Tampilkan Lebih Sedikit"
                      : "Tampilkan Semua"}
                  </Button>
                )}
              </div>

              {/* Student List Preview */}
              <div className="space-y-2">
                {displayedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-purple-900">
                        {student.name}
                      </p>
                      <p className="text-sm text-purple-700">{student.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-purple-700">Tahun Masuk</p>
                      <Badge variant="outline">
                        {student.entryYear || "Tidak diketahui"}
                      </Badge>
                    </div>
                  </div>
                ))}

                {!showFullStudentList && selectedStudents.length > 5 && (
                  <div className="text-center py-3">
                    <p className="text-sm text-purple-600">
                      ... dan {selectedStudents.length - 5} santri lainnya
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Alerts */}
            {selectedStudents.length === 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Tidak ada santri yang dipilih. Silakan kembali ke langkah
                  pendaftaran santri.
                </AlertDescription>
              </Alert>
            )}

            {selectedStudents.length > 50 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Jumlah santri melebihi batas maksimal (50 santri per kelas).
                  Silakan kurangi pilihan santri.
                </AlertDescription>
              </Alert>
            )}

            {/* Terms and Conditions */}
            <div className="border-t pt-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Syarat dan Ketentuan
                </h4>

                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
                  <p>
                    • Dengan membuat kelas ini, Anda menyatakan bahwa semua
                    informasi yang dimasukkan sudah benar.
                  </p>
                  <p>
                    • Pengajar yang ditugaskan bertanggung jawab atas
                    pelaksanaan pembelajaran.
                  </p>
                  <p>
                    • Santri yang didaftarkan akan secara otomatis masuk ke
                    kelas ini.
                  </p>
                  <p>
                    • Jadwal kelas tidak boleh bertentangan dengan jadwal
                    pengajar lainnya.
                  </p>
                  <p>
                    • Data kelas dapat diubah kapan saja melalui menu
                    administrasi.
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked: boolean) =>
                      setTermsAccepted(checked)
                    }
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Saya menyetujui syarat dan ketentuan yang berlaku
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit || !termsAccepted || isSubmitting}
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  "Buat Kelas"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConfirmationStep;
