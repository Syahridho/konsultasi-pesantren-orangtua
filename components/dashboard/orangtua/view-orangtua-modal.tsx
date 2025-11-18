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

interface OrangtuaDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  santriList?: Array<{
    id: string;
    name: string;
    nis?: string;
    gender?: string;
    tahunDaftar?: string;
  }>;
}

interface ViewOrangtuaModalProps {
  orangtuaId: string;
  trigger?: React.ReactNode;
}

export function ViewOrangtuaModal({
  orangtuaId,
  trigger,
}: ViewOrangtuaModalProps) {
  const [open, setOpen] = useState(false);
  const [orangtua, setOrangtua] = useState<OrangtuaDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrangtuaDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/orangtua/${orangtuaId}`);

      if (response.status === 200) {
        setOrangtua(response.data.orangtua);
      } else {
        console.error("Failed to fetch orangtua details:", response.data.error);
      }
    } catch (error: any) {
      console.error("Error fetching orangtua details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOrangtuaDetails();
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
          <DialogTitle>Detail Orang Tua</DialogTitle>
          <DialogDescription>
            Informasi lengkap mengenai data orang tua
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p>Memuat data...</p>
          </div>
        ) : orangtua ? (
          <div className="space-y-6">
            {/* Parent Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Orang Tua</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nama Lengkap
                  </p>
                  <p className="font-medium">{orangtua.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-medium">{orangtua.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    No. Telepon
                  </p>
                  <p className="font-medium">{orangtua.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Peran</p>
                  <Badge variant="secondary">{orangtua.role}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Tanggal Daftar
                  </p>
                  <p className="font-medium">
                    {formatDate(orangtua.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Students Information */}
            {orangtua.santriList && orangtua.santriList.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Santri</h3>
                <div className="space-y-3">
                  {orangtua.santriList.map((santri) => (
                    <div
                      key={santri.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Nama Santri
                          </p>
                          <p className="font-medium">{santri.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            NIS
                          </p>
                          <p className="font-medium">{santri.nis || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Jenis Kelamin
                          </p>
                          <p className="font-medium">
                            {getGenderLabel(santri.gender)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Tahun Daftar
                          </p>
                          <p className="font-medium">
                            {santri.tahunDaftar || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
