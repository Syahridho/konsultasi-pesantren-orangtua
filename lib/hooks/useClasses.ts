import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface Class {
  id: string;
  name: string;
  academicYear: string;
  ustadId: string;
  ustadName: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  studentIds: Record<
    string,
    {
      enrolledAt: string;
      status: string;
    }
  >;
  studentCount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  createdByName: string;
}

export interface CreateClassData {
  name: string;
  academicYear: string;
  ustadId: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  studentIds: string[];
}

export interface ClassesResponse {
  classes: Class[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface CreateClassResponse {
  message: string;
  classId: string;
  classData: Class;
}

export const useClasses = (filters?: {
  academicYear?: string;
  ustadId?: string;
  page?: number;
  limit?: number;
}) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(filters?.page || 1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.academicYear)
        params.append("academicYear", filters.academicYear);
      if (filters?.ustadId) params.append("ustadId", filters.ustadId);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());

      console.log("[useClasses] Starting fetchClasses with filters:", filters);
      const startTime = Date.now();

      const response = await api.get(`/api/classes?${params.toString()}`);

      const endTime = Date.now();
      console.log(
        `[useClasses] API call completed in ${endTime - startTime}ms`
      );

      if (response.status === 200) {
        const data: ClassesResponse = response.data;
        setClasses(data.classes);
        setTotal(data.total);
        if (data.page !== undefined) setCurrentPage(data.page);
        if (data.totalPages !== undefined) setTotalPages(data.totalPages);
      } else {
        setError(response.data?.error || "Gagal memuat data kelas");
      }
    } catch (err: any) {
      console.error("Error fetching classes:", err);
      setError(
        err.response?.data?.error || "Terjadi kesalahan saat memuat data kelas"
      );
    } finally {
      setLoading(false);
    }
  };

  const createClass = async (
    classData: CreateClassData
  ): Promise<CreateClassResponse | null> => {
    try {
      setError(null);
      const response = await api.post("/api/classes", classData);

      if (response.status === 200) {
        await fetchClasses(); // Refresh the list
        return response.data;
      } else {
        setError(response.data?.error || "Gagal membuat kelas");
        return null;
      }
    } catch (err: any) {
      console.error("Error creating class:", err);
      const errorMessage =
        err.response?.data?.error || "Terjadi kesalahan saat membuat kelas";
      setError(errorMessage);

      // Handle specific error cases
      if (err.response?.status === 409) {
        // Conflict error (duplicate or schedule conflict)
        if (err.response?.data?.conflict) {
          throw new Error(
            `${errorMessage}: ${err.response.data.conflict.className}`
          );
        }
      }

      throw new Error(errorMessage);
    }
  };

  const updateClass = async (
    id: string,
    classData: Partial<CreateClassData>
  ): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.put(`/api/classes?id=${id}`, classData);

      if (response.status === 200) {
        await fetchClasses(); // Refresh the list
        return true;
      } else {
        setError(response.data?.error || "Gagal memperbarui kelas");
        return false;
      }
    } catch (err: any) {
      console.error("Error updating class:", err);
      const errorMessage =
        err.response?.data?.error || "Terjadi kesalahan saat memperbarui kelas";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteClass = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.delete(`/api/classes?id=${id}`);

      if (response.status === 200) {
        await fetchClasses(); // Refresh the list
        return true;
      } else {
        setError(response.data?.error || "Gagal menghapus kelas");
        return false;
      }
    } catch (err: any) {
      console.error("Error deleting class:", err);
      setError(
        err.response?.data?.error || "Terjadi kesalahan saat menghapus kelas"
      );
      return false;
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [filters?.academicYear, filters?.ustadId, filters?.page, filters?.limit]);

  return {
    classes,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass,
    refetch: fetchClasses,
  };
};
