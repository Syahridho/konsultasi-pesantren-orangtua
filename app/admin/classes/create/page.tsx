"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import CreateClassWizard from "@/components/admin/class-wizard";
import { useClasses } from "@/lib/hooks/useClasses";

export default function CreateClassPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { classes } = useClasses();
  const [isWizardOpen, setIsWizardOpen] = useState(true);

  // Check authentication and authorization
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  if (session.user.role !== "admin") {
    toast.error("Anda tidak memiliki akses ke halaman ini");
    router.push("/dashboard");
    return null;
  }

  const handleWizardSuccess = () => {
    // Optional: Redirect to classes list
    router.push("/admin/classes");
  };

  const handleWizardClose = () => {
    router.push("/admin/classes");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/classes")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Daftar Kelas
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Total Kelas: {classes.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Buat Kelas Baru
                </h1>
                <p className="mt-2 text-gray-600">
                  Buat kelas baru dengan pengajar dan santri yang ditentukan.
                  Wizard ini akan memandu Anda melalui 3 langkah: Detail Kelas,
                  Pendaftaran Santri, dan Konfirmasi.
                </p>
              </div>

              <Button
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Mulai Wizard
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Kelas Aktif
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {classes.filter((c) => c.status === "active").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Santri
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {classes.reduce(
                      (total, c) => total + (c.studentCount || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Plus className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Rata-rata Santri/Kelas
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {classes.length > 0
                      ? Math.round(
                          classes.reduce(
                            (total, c) => total + (c.studentCount || 0),
                            0
                          ) / classes.length
                        )
                      : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Class Creation Wizard */}
          <CreateClassWizard
            isOpen={isWizardOpen}
            onClose={handleWizardClose}
            onSuccess={handleWizardSuccess}
          />
        </div>
      </div>
    </div>
  );
}
