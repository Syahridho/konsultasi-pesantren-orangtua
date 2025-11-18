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

interface DeleteSantriModalProps {
  santriId: string;
  santriName: string;
  trigger?: React.ReactNode;
  onSantriDeleted?: () => void;
}

export function DeleteSantriModal({
  santriId,
  santriName,
  trigger,
  onSantriDeleted,
}: DeleteSantriModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.delete(`/api/santri/${santriId}`);

      if (response.status === 200) {
        toast.success(`Santri "${santriName}" berhasil dihapus`);
        setOpen(false);
        if (onSantriDeleted) {
          onSantriDeleted();
        }
      } else {
        toast.error("Gagal menghapus santri: " + response.data.error);
      }
    } catch (error: any) {
      console.error("Error deleting santri:", error);
      toast.error("Terjadi kesalahan saat menghapus santri");
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
          <DialogTitle>Konfirmasi Hapus Santri</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus data santri ini? Tindakan ini
            tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Nama Santri:</span> {santriName}
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
