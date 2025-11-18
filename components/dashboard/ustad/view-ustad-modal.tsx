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

interface UstadDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

interface ViewUstadModalProps {
  ustadId: string;
  trigger?: React.ReactNode;
}

export function ViewUstadModal({ ustadId, trigger }: ViewUstadModalProps) {
  const [open, setOpen] = useState(false);
  const [ustad, setUstad] = useState<UstadDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUstadDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/ustads/${ustadId}`);

      if (response.status === 200) {
        setUstad(response.data.ustad);
      } else {
        console.error("Failed to fetch ustad details:", response.data.error);
      }
    } catch (error: any) {
      console.error("Error fetching ustad details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUstadDetails();
    }
  }, [open]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
          <DialogTitle>Detail Ustad</DialogTitle>
          <DialogDescription>
            Informasi lengkap mengenai data ustad
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p>Memuat data...</p>
          </div>
        ) : ustad ? (
          <div className="space-y-6">
            {/* Ustad Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Ustad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nama Lengkap
                  </p>
                  <p className="font-medium">{ustad.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-medium">{ustad.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    No. Telepon
                  </p>
                  <p className="font-medium">{ustad.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Peran</p>
                  <Badge variant="secondary">{ustad.role}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Tanggal Daftar
                  </p>
                  <p className="font-medium">{formatDate(ustad.createdAt)}</p>
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
