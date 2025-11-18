import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface Student {
  id: string;
  name: string;
  email: string;
  entryYear: string;
  status: string;
  orangTuaId: string;
  createdAt: string;
}

export interface StudentsResponse {
  students: Student[];
  total: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    entryYears: string[];
    availableStatuses: string[];
  };
}

export const useSantri = (filters?: {
  entryYear?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState<StudentsResponse["pagination"]>({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [availableFilters, setAvailableFilters] = useState<
    StudentsResponse["filters"]
  >({
    entryYears: [],
    availableStatuses: [],
  });

  const fetchStudents = async (page?: number) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.entryYear) params.append("entryYear", filters.entryYear);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.search) params.append("search", filters.search);
      if (page || filters?.page)
        params.append("page", (page || filters?.page || 1).toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const response = await api.get(`/api/santri?${params.toString()}`);

      if (response.status === 200) {
        const data: StudentsResponse = response.data;
        setStudents(data.students);
        setTotal(data.total);
        setPagination(data.pagination);
        setAvailableFilters(data.filters);
      } else {
        setError(response.data?.error || "Gagal memuat data santri");
      }
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setError(
        err.response?.data?.error || "Terjadi kesalahan saat memuat data santri"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectAllVisible = () => {
    return students.map((student) => student.id);
  };

  const selectAllFiltered = async () => {
    // Fetch all students with current filters (without pagination)
    try {
      const params = new URLSearchParams();
      if (filters?.entryYear) params.append("entryYear", filters.entryYear);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.search) params.append("search", filters.search);
      // Don't include pagination to get all filtered students

      const response = await api.get(`/api/santri?${params.toString()}`);

      if (response.status === 200) {
        const data: StudentsResponse = response.data;
        return data.students.map((student) => student.id);
      }
      return [];
    } catch (err) {
      console.error("Error fetching all filtered students:", err);
      return [];
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [
    filters?.entryYear,
    filters?.status,
    filters?.search,
    filters?.page,
    filters?.limit,
  ]);

  return {
    students,
    loading,
    error,
    total,
    pagination,
    availableFilters,
    fetchStudents,
    selectAllVisible,
    selectAllFiltered,
    refetch: () => fetchStudents(filters?.page),
  };
};
