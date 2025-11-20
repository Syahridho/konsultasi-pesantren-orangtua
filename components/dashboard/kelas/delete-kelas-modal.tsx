"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Class, useClasses } from "@/lib/hooks/useClasses";

interface DeleteKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelas: Class | null;
}

export default function DeleteKelasModal({
  isOpen,
  onClose,
  onSuccess,
  kelas,
}: DeleteKelasModalProps) {
  const { deleteClass } = useClasses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kelas) return;

    // Verify confirmation text matches class name
    if (confirmText !== kelas.name) {
      toast.error("Nama kelas tidak cocok. Masukkan nama kelas dengan benar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await deleteClass(kelas.id);
      if (success) {
        toast.success("Kelas berhasil dihapus");
        onSuccess();
        onClose();
        setConfirmText(""); // Reset confirmation text
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus kelas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setConfirmText(""); // Reset confirmation text
    }
  };

  if (!kelas) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Hapus Kelas
          </DialogTitle>
          <DialogDescription>
            Tindakan ini tidak dapat dibatalkan. Semua data terkait kelas akan
            dihapus secara permanen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Anda akan menghapus kelas <strong>{kelas.name}</strong> dengan{" "}
              {kelas.studentCount || 0} santri terdaftar.
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium">
              Ketik nama kelas untuk konfirmasi:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={kelas.name}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || confirmText !== kelas.name}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                "Hapus Kelas"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
