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

interface MuridDetails {
  id: string;
  name: string;
  email: string;
  age: number;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  registrationDate: string;
  status: "active" | "inactive";
  nis?: string;
  gender?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
}

interface ViewMuridModalProps {
  muridId: string;
  trigger?: React.ReactNode;
}

export function ViewMuridModal({ muridId, trigger }: ViewMuridModalProps) {
  const [open, setOpen] = useState(false);
  const [murid, setMurid] = useState<MuridDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMuridDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/murids/${muridId}`);

      if (response.status === 200) {
        setMurid(response.data.murid);
      } else {
        console.error("Failed to fetch murid details:", response.data.error);
      }
    } catch (error: any) {
      console.error("Error fetching murid details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMuridDetails();
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
          <DialogTitle>Detail Murid</DialogTitle>
          <DialogDescription>
            Informasi lengkap mengenai data murid
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p>Memuat data...</p>
          </div>
        ) : murid ? (
          <div className="space-y-6">
            {/* Student Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Murid</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nama Lengkap
                  </p>
                  <p className="font-medium">{murid.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">NIS</p>
                  <p className="font-medium">{murid.nis || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-medium">{murid.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Usia</p>
                  <p className="font-medium">{murid.age} tahun</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Jenis Kelamin
                  </p>
                  <p className="font-medium">{getGenderLabel(murid.gender)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Tempat Lahir
                  </p>
                  <p className="font-medium">{murid.tempatLahir || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Tanggal Lahir
                  </p>
                  <p className="font-medium">
                    {murid.tanggalLahir ? formatDate(murid.tanggalLahir) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Tanggal Daftar
                  </p>
                  <p className="font-medium">
                    {formatDate(murid.registrationDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge
                    variant={
                      murid.status === "active" ? "default" : "secondary"
                    }
                  >
                    {murid.status === "active" ? "Aktif" : "Tidak Aktif"}
                  </Badge>
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
                  <p className="font-medium">{murid.parentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Email Orang Tua
                  </p>
                  <p className="font-medium">{murid.parentEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    No. Telepon
                  </p>
                  <p className="font-medium">{murid.parentPhone || "-"}</p>
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
