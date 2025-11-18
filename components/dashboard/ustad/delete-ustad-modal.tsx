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

interface DeleteUstadModalProps {
  ustadId: string;
  ustadName: string;
  trigger?: React.ReactNode;
  onUstadDeleted?: () => void;
}

export function DeleteUstadModal({
  ustadId,
  ustadName,
  trigger,
  onUstadDeleted,
}: DeleteUstadModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.delete(`/api/ustads/${ustadId}`);

      if (response.status === 200) {
        toast.success(`Ustad "${ustadName}" berhasil dihapus`);
        setOpen(false);
        if (onUstadDeleted) {
          onUstadDeleted();
        }
      } else {
        toast.error("Gagal menghapus ustad: " + response.data.error);
      }
    } catch (error: any) {
      console.error("Error deleting ustad:", error);
      toast.error("Terjadi kesalahan saat menghapus ustad");
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
          <DialogTitle>Konfirmasi Hapus Ustad</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus data ustad ini? Tindakan ini tidak
            dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Nama Ustad:</span> {ustadName}
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
