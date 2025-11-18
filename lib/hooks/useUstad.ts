import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface Teacher {
  id: string;
  name: string;
  email: string;
  specialization: string;
  phone: string;
  currentClasses?: number;
  available?: boolean;
  createdAt: string;
}

export interface TeachersResponse {
  teachers: Teacher[];
  total: number;
}

export const useUstad = (filters?: {
  search?: string;
  available?: boolean;
  specialization?: string;
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.available !== undefined)
        params.append("available", filters.available.toString());
      if (filters?.specialization)
        params.append("specialization", filters.specialization);

      const response = await api.get(`/api/ustad?${params.toString()}`);

      if (response.status === 200) {
        const data: TeachersResponse = response.data;
        setTeachers(data.teachers);
        setTotal(data.total);
      } else {
        setError(response.data?.error || "Gagal memuat data pengajar");
      }
    } catch (err: any) {
      console.error("Error fetching teachers:", err);
      setError(
        err.response?.data?.error ||
          "Terjadi kesalahan saat memuat data pengajar"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [filters?.search, filters?.available, filters?.specialization]);

  return {
    teachers,
    loading,
    error,
    total,
    fetchTeachers,
    refetch: fetchTeachers,
  };
};
