"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Plus, Minus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface OrangtuaData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface SantriData {
  name: string;
  nis?: string;
  tahunDaftar: string;
  gender: "L" | "P" | "";
  tempatLahir?: string;
  tanggalLahir: string;
}

interface FormValues {
  orangtua: OrangtuaData;
  santriList: SantriData[];
}

interface AddOrangtuaModalProps {
  onOrangtuaAdded?: () => void;
}

export function AddOrangtuaModal({ onOrangtuaAdded }: AddOrangtuaModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      orangtua: {
        name: "",
        email: "",
        phone: "",
        password: "",
      },
      santriList: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "santriList",
  });

  const onSubmit = async (values: FormValues) => {
    // Basic validation for orangtua
    if (!values.orangtua.name || values.orangtua.name.length < 3) {
      toast.error("Nama orang tua minimal 3 karakter");
      return;
    }

    if (!values.orangtua.email || !values.orangtua.email.includes("@")) {
      toast.error("Email tidak valid");
      return;
    }

    if (!values.orangtua.password || values.orangtua.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    // Basic validation for santri if any
    if (values.santriList.length > 0) {
      for (const santri of values.santriList) {
        if (!santri.name || santri.name.length < 3) {
          toast.error("Nama santri minimal 3 karakter");
          return;
        }
        if (!santri.tanggalLahir) {
          toast.error("Tanggal lahir santri harus diisi");
          return;
        }
        if (!santri.gender) {
          toast.error("Jenis kelamin santri harus dipilih");
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/api/orangtua", {
        orangtuaData: {
          ...values.orangtua,
          role: "orangtua",
        },
        santriList: values.santriList,
      });

      if (response.status === 201) {
        toast.success("Orang tua berhasil ditambahkan");
        form.reset();
        setOpen(false);
        if (onOrangtuaAdded) {
          onOrangtuaAdded();
        }
      } else {
        toast.error("Gagal menambahkan orang tua: " + response.data.error);
      }
    } catch (error: any) {
      console.error("Error adding orangtua:", error);
      toast.error("Terjadi kesalahan saat menambahkan orang tua");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Orang Tua
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Orang Tua Baru</DialogTitle>
          <DialogDescription>Tambahkan data orang tua baru</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Orang Tua</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orangtua.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama orang tua" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orangtua.email"
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
                  name="orangtua.phone"
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
                  name="orangtua.password"
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Data Santri</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      name: "",
                      nis: "",
                      tahunDaftar: new Date().getFullYear().toString(),
                      gender: "",
                      tempatLahir: "",
                      tanggalLahir: "",
                    })
                  }
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tambah Santri
                </Button>
              </div>

              {fields.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Belum ada data santri. Klik "Tambah Santri" untuk menambahkan.
                </p>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-4 relative"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Santri #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`santriList.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Lengkap</FormLabel>
                              <FormControl>
                                <Input placeholder="Nama santri" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`santriList.${index}.nis`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NIS (Opsional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nomor Induk Santri"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`santriList.${index}.tahunDaftar`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tahun Daftar</FormLabel>
                              <FormControl>
                                <Input placeholder="2024" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`santriList.${index}.gender`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jenis Kelamin</FormLabel>
                              <FormControl>
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                >
                                  <option value="">Pilih jenis kelamin</option>
                                  <option value="L">Laki-laki</option>
                                  <option value="P">Perempuan</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`santriList.${index}.tempatLahir`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tempat Lahir (Opsional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Kota kelahiran"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`santriList.${index}.tanggalLahir`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tanggal Lahir</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
