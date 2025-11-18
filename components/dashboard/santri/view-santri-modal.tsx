"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import api from "@/lib/api";

interface SantriDetails {
  id: string;
  userId: string;
  name: string;
  nis?: string;
  gender?: "L" | "P" | "";
  tempatLahir?: string;
  tanggalLahir?: string;
  tahunDaftar?: string;
  createdAt?: string;
  orangtua: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

interface ViewSantriModalProps {
  santriId: string;
  trigger?: React.ReactNode;
}

export function ViewSantriModal({ santriId, trigger }: ViewSantriModalProps) {
  const [open, setOpen] = useState(false);
  const [santri, setSantri] = useState<SantriDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSantriDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/santri/${santriId}`);

      if (response.status === 200) {
        setSantri(response.data.santri);
      } else {
        console.error("Failed to fetch santri details:", response.data.error);
      }
    } catch (error: any) {
      console.error("Error fetching santri details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSantriDetails();
    }
  }, [open]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case "L":
        return "Laki-laki";
      case "P":
        return "Perempuan";
      default:
        return "Tidak diketahui";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Santri</DialogTitle>
          <DialogDescription>
            Informasi lengkap mengenai data santri
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p>Memuat data...</p>
          </div>
        ) : santri ? (
          <div className="space-y-6">
            {/* Student Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Santri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nama Lengkap
                  </p>
                  <p className="font-medium">{santri.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">NIS</p>
                  <p className="font-medium">{santri.nis || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Jenis Kelamin
                  </p>
                  <p className="font-medium">{getGenderLabel(santri.gender)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Tempat Lahir
                  </p>
                  <p className="font-medium">{santri.tempatLahir || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Tanggal Lahir
                  </p>
                  <p className="font-medium">
                    {santri.tanggalLahir
                      ? formatDate(santri.tanggalLahir)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Tahun Daftar
                  </p>
                  <p className="font-medium">{santri.tahunDaftar || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Tanggal Pendaftaran
                  </p>
                  <p className="font-medium">
                    {santri.createdAt ? formatDate(santri.createdAt) : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Orang Tua</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nama Orang Tua
                  </p>
                  <p className="font-medium">{santri.orangtua.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Email Orang Tua
                  </p>
                  <p className="font-medium">{santri.orangtua.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    No. Telepon
                  </p>
                  <p className="font-medium">{santri.orangtua.phone || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p>Data tidak ditemukan</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
