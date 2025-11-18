"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface UstadData {
  name: string;
  email: string;
  phone?: string;
}

interface UstadDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

interface FormValues {
  ustad: UstadData;
}

interface EditUstadModalProps {
  ustadId: string;
  trigger?: React.ReactNode;
  onUstadUpdated?: () => void;
}

export function EditUstadModal({
  ustadId,
  trigger,
  onUstadUpdated,
}: EditUstadModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ustad, setUstad] = useState<UstadDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      ustad: {
        name: "",
        email: "",
        phone: "",
      },
    },
  });

  const fetchUstadDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/ustads/${ustadId}`);

      if (response.status === 200) {
        setUstad(response.data.ustad);
        // Reset form with ustad data
        form.reset({
          ustad: {
            name: response.data.ustad.name || "",
            email: response.data.ustad.email || "",
            phone: response.data.ustad.phone || "",
          },
        });
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

  const onSubmit = async (values: FormValues) => {
    // Basic validation
    if (!values.ustad.name || values.ustad.name.length < 3) {
      toast.error("Nama ustad minimal 3 karakter");
      return;
    }

    if (!values.ustad.email || !values.ustad.email.includes("@")) {
      toast.error("Email tidak valid");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.put(`/api/ustads/${ustadId}`, {
        ustadData: values.ustad,
      });

      if (response.status === 200) {
        toast.success("Data ustad berhasil diperbarui");
        setOpen(false);
        if (onUstadUpdated) {
          onUstadUpdated();
        }
      } else {
        toast.error("Gagal memperbarui data ustad: " + response.data.error);
      }
    } catch (error: any) {
      console.error("Error updating ustad:", error);
      toast.error("Terjadi kesalahan saat memperbarui data ustad");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Ustad</DialogTitle>
          <DialogDescription>Perbarui informasi data ustad</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p>Memuat data...</p>
          </div>
        ) : ustad ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Ustad</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ustad.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama ustad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ustad.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ustad.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. Telepon (Opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="08123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p>Data tidak ditemukan</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
