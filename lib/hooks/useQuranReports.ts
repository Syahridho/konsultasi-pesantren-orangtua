import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface QuranReport {
  id: string;
  studentId: string;
  studentName: string;
  surah: string;
  ayatStart: number;
  ayatEnd: number;
  fluencyLevel: "excellent" | "good" | "fair" | "poor";
  testDate: string;
  notes?: string;
  nextAssignment?: string;
  attachments?: string[];
  ustadId: string;
  ustadName: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
}

export interface CreateQuranReportData {
  studentId: string;
  surah: string;
  ayatStart: number;
  ayatEnd: number;
  fluencyLevel: "excellent" | "good" | "fair" | "poor";
  testDate: string;
  notes?: string;
  nextAssignment?: string;
  attachments?: string[];
}

export interface QuranReportsResponse {
  reports: QuranReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateQuranReportResponse {
  message: string;
  reportId: string;
  reportData: QuranReport;
}

export const useQuranReports = (filters?: {
  studentId?: string;
  surah?: string;
  fluencyLevel?: string;
  ustadId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) => {
  const [reports, setReports] = useState<QuranReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(filters?.page || 1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.studentId) params.append("studentId", filters.studentId);
      if (filters?.surah) params.append("surah", filters.surah);
      if (filters?.fluencyLevel)
        params.append("fluencyLevel", filters.fluencyLevel);
      if (filters?.ustadId) params.append("ustadId", filters.ustadId);
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.append("dateTo", filters.dateTo);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());

      console.log(
        "[useQuranReports] Starting fetchReports with filters:",
        filters
      );
      const startTime = Date.now();

      const response = await api.get(`/api/reports/quran?${params.toString()}`);

      const endTime = Date.now();
      console.log(
        `[useQuranReports] API call completed in ${endTime - startTime}ms`
      );

      if (response.status === 200) {
        const data: QuranReportsResponse = response.data;
        setReports(data.reports);
        setTotal(data.total);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
      } else {
        setError(response.data?.error || "Gagal memuat data laporan hafalan");
      }
    } catch (err: any) {
      console.error("Error fetching Quran reports:", err);
      setError(
        err.response?.data?.error ||
          "Terjadi kesalahan saat memuat data laporan hafalan"
      );
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (
    reportData: CreateQuranReportData
  ): Promise<CreateQuranReportResponse | null> => {
    try {
      setError(null);
      const response = await api.post("/api/reports/quran", reportData);

      if (response.status === 200) {
        await fetchReports(); // Refresh list
        return response.data;
      } else {
        setError(response.data?.error || "Gagal membuat laporan hafalan");
        return null;
      }
    } catch (err: any) {
      console.error("Error creating Quran report:", err);
      const errorMessage =
        err.response?.data?.error ||
        "Terjadi kesalahan saat membuat laporan hafalan";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateReport = async (
    id: string,
    reportData: Partial<CreateQuranReportData>
  ): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.put(`/api/reports/quran?id=${id}`, reportData);

      if (response.status === 200) {
        await fetchReports(); // Refresh list
        return true;
      } else {
        setError(response.data?.error || "Gagal memperbarui laporan hafalan");
        return false;
      }
    } catch (err: any) {
      console.error("Error updating Quran report:", err);
      const errorMessage =
        err.response?.data?.error ||
        "Terjadi kesalahan saat memperbarui laporan hafalan";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteReport = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.delete(`/api/reports/quran?id=${id}`);

      if (response.status === 200) {
        await fetchReports(); // Refresh list
        return true;
      } else {
        setError(response.data?.error || "Gagal menghapus laporan hafalan");
        return false;
      }
    } catch (err: any) {
      console.error("Error deleting Quran report:", err);
      setError(
        err.response?.data?.error ||
          "Terjadi kesalahan saat menghapus laporan hafalan"
      );
      return false;
    }
  };

  useEffect(() => {
    fetchReports();
  }, [
    filters?.studentId,
    filters?.surah,
    filters?.fluencyLevel,
    filters?.ustadId,
    filters?.dateFrom,
    filters?.dateTo,
    filters?.page,
    filters?.limit,
  ]);

  return {
    reports,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    refetch: fetchReports,
  };
};
