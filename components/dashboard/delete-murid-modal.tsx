"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface DeleteMuridModalProps {
  muridId: string;
  muridName: string;
  trigger?: React.ReactNode;
  onMuridDeleted?: () => void;
}

export function DeleteMuridModal({
  muridId,
  muridName,
  trigger,
  onMuridDeleted,
}: DeleteMuridModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.delete(`/api/murids/${muridId}`);

      if (response.status === 200) {
        toast.success(`Murid "${muridName}" berhasil dihapus`);
        setOpen(false);
        if (onMuridDeleted) {
          onMuridDeleted();
        }
      } else {
        toast.error("Gagal menghapus murid: " + response.data.error);
      }
    } catch (error: any) {
      console.error("Error deleting murid:", error);
      toast.error("Terjadi kesalahan saat menghapus murid");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Konfirmasi Hapus Murid</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus data murid ini? Tindakan ini tidak
            dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Nama Murid:</span> {muridName}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
