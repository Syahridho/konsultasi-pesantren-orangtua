"use client";

import { useState } from "react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface UstadData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  specialization?: string;
}

interface FormValues {
  ustad: UstadData;
}

interface AddUstadModalProps {
  onUstadAdded?: () => void;
}

export function AddUstadModal({ onUstadAdded }: AddUstadModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      ustad: {
        name: "",
        email: "",
        phone: "",
        password: "",
        specialization: "",
      },
    },
  });

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

    if (!values.ustad.password || values.ustad.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/api/ustads", {
        ustadData: {
          ...values.ustad,
          role: "ustad",
        },
      });

      if (response.status === 200) {
        toast.success("Ustad berhasil ditambahkan");
        form.reset();
        setOpen(false);
        if (onUstadAdded) {
          onUstadAdded();
        }
      } else {
        toast.error("Gagal menambahkan ustad: " + response.data.error);
      }
    } catch (error: any) {
      console.error("Error adding ustad:", error);
      toast.error("Terjadi kesalahan saat menambahkan ustad");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Ustad
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Ustad Baru</DialogTitle>
          <DialogDescription>Tambahkan data ustad baru</DialogDescription>
        </DialogHeader>

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

                <FormField
                  control={form.control}
                  name="ustad.specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keahlian Mata Pelajaran</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Matematika, IPA, Al-Quran"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Pisahkan beberapa mata pelajaran dengan koma (,)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ustad.password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Minimal 6 karakter"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Password akan digunakan untuk login pertama kali
                      </FormDescription>
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
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
