"use client";

import { useState, useEffect } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, UserPlus, Minus, Eye } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface OrangtuaData {
  name: string;
  email: string;
  phone?: string;
}

interface SantriData {
  id?: string;
  name: string;
  nis?: string;
  tahunDaftar: string;
  gender: "L" | "P" | "";
  tempatLahir?: string;
  tanggalLahir: string;
}

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
    tahunDaftar: string;
    gender: string;
    tempatLahir?: string;
    tanggalLahir: string;
    createdAt?: string;
  }>;
}

interface FormValues {
  orangtua: OrangtuaData;
  santriList: SantriData[];
}

interface EditOrangtuaModalProps {
  orangtuaId: string;
  trigger?: React.ReactNode;
  onOrangtuaUpdated?: () => void;
}

export function EditOrangtuaModal({
  orangtuaId,
  trigger,
  onOrangtuaUpdated,
}: EditOrangtuaModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orangtua, setOrangtua] = useState<OrangtuaDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      orangtua: {
        name: "",
        email: "",
        phone: "",
      },
      santriList: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "santriList",
  });

  const fetchOrangtuaDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/orangtua/${orangtuaId}`);

      if (response.status === 200) {
        setOrangtua(response.data.orangtua);
        // Reset form with orangtua data
        form.reset({
          orangtua: {
            name: response.data.orangtua.name || "",
            email: response.data.orangtua.email || "",
            phone: response.data.orangtua.phone || "",
          },
          santriList: response.data.orangtua.santriList || [],
        });
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

  const onSubmit = async (values: FormValues) => {
    // Basic validation
    if (!values.orangtua.name || values.orangtua.name.length < 3) {
      toast.error("Nama orang tua minimal 3 karakter");
      return;
    }

    if (!values.orangtua.email || !values.orangtua.email.includes("@")) {
      toast.error("Email tidak valid");
      return;
    }

    // Basic validation for new santri if any
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
      const response = await api.put(`/api/orangtua/${orangtuaId}`, {
        orangtuaData: values.orangtua,
        newSantriList: values.santriList,
      });

      if (response.status === 200) {
        toast.success("Data orang tua berhasil diperbarui");
        setOpen(false);
        if (onOrangtuaUpdated) {
          onOrangtuaUpdated();
        }
      } else {
        toast.error("Gagal memperbarui data orang tua: " + response.data.error);
      }
    } catch (error: any) {
      console.error("Error updating orangtua:", error);
      toast.error("Terjadi kesalahan saat memperbarui data orang tua");
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
          <DialogTitle>Edit Data Orang Tua</DialogTitle>
          <DialogDescription>
            Perbarui informasi data orang tua
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p>Memuat data...</p>
          </div>
        ) : orangtua ? (
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

                {fields.length === 0 &&
                (!orangtua?.santriList ||
                  orangtua?.santriList?.length === 0) ? (
                  <p className="text-muted-foreground text-sm">
                    Belum ada data santri. Klik "Tambah Santri" untuk
                    menambahkan.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Display existing santri from database */}
                    {orangtua?.santriList &&
                      orangtua.santriList.map((santri, index) => (
                        <div
                          key={`existing-${santri.id}`}
                          className="border rounded-lg p-4 space-y-4 relative bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Santri #{index + 1}</h4>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    `/dashboard/santri?view=${santri.id}`,
                                    "_blank"
                                  )
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Nama:</span>{" "}
                              {santri.name}
                            </div>
                            <div>
                              <span className="font-medium">NIS:</span>{" "}
                              {santri.nis || "-"}
                            </div>
                            <div>
                              <span className="font-medium">Tahun Daftar:</span>{" "}
                              {santri.tahunDaftar}
                            </div>
                            <div>
                              <span className="font-medium">
                                Jenis Kelamin:
                              </span>{" "}
                              {santri.gender === "L"
                                ? "Laki-laki"
                                : "Perempuan"}
                            </div>
                            <div>
                              <span className="font-medium">Tempat Lahir:</span>{" "}
                              {santri.tempatLahir || "-"}
                            </div>
                            <div>
                              <span className="font-medium">
                                Tanggal Lahir:
                              </span>{" "}
                              {santri.tanggalLahir}
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* Display new santri being added */}
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="border rounded-lg p-4 space-y-4 relative"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            Santri Baru #
                            {orangtua?.santriList?.length
                              ? orangtua.santriList.length + index + 1
                              : index + 1}
                          </h4>
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
                                    <option value="">
                                      Pilih jenis kelamin
                                    </option>
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
