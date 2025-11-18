import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface AcademicReport {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  gradeType: "number" | "letter" | "description";
  gradeNumber?: number;
  gradeLetter?: string;
  gradeDescription?: string;
  semester: string;
  academicYear: string;
  notes?: string;
  attachments?: string[];
  ustadId: string;
  ustadName: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
}

export interface CreateAcademicReportData {
  studentId: string;
  subject: string;
  gradeType: "number" | "letter" | "description";
  gradeNumber?: number;
  gradeLetter?: string;
  gradeDescription?: string;
  semester: string;
  academicYear: string;
  notes?: string;
  attachments?: string[];
}

export interface AcademicReportsResponse {
  reports: AcademicReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAcademicReportResponse {
  message: string;
  reportId: string;
  reportData: AcademicReport;
}

export const useAcademicReports = (filters?: {
  studentId?: string;
  subject?: string;
  semester?: string;
  academicYear?: string;
  ustadId?: string;
  page?: number;
  limit?: number;
}) => {
  const [reports, setReports] = useState<AcademicReport[]>([]);
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
      if (filters?.subject) params.append("subject", filters.subject);
      if (filters?.semester) params.append("semester", filters.semester);
      if (filters?.academicYear)
        params.append("academicYear", filters.academicYear);
      if (filters?.ustadId) params.append("ustadId", filters.ustadId);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());

      console.log(
        "[useAcademicReports] Starting fetchReports with filters:",
        filters
      );
      const startTime = Date.now();

      const response = await api.get(
        `/api/reports/academic?${params.toString()}`
      );

      const endTime = Date.now();
      console.log(
        `[useAcademicReports] API call completed in ${endTime - startTime}ms`
      );

      if (response.status === 200) {
        const data: AcademicReportsResponse = response.data;
        setReports(data.reports);
        setTotal(data.total);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
      } else {
        setError(response.data?.error || "Gagal memuat data laporan akademik");
      }
    } catch (err: any) {
      console.error("Error fetching academic reports:", err);
      setError(
        err.response?.data?.error ||
          "Terjadi kesalahan saat memuat data laporan akademik"
      );
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (
    reportData: CreateAcademicReportData
  ): Promise<CreateAcademicReportResponse | null> => {
    try {
      setError(null);
      const response = await api.post("/api/reports/academic", reportData);

      if (response.status === 200) {
        await fetchReports(); // Refresh the list
        return response.data;
      } else {
        setError(response.data?.error || "Gagal membuat laporan akademik");
        return null;
      }
    } catch (err: any) {
      console.error("Error creating academic report:", err);
      const errorMessage =
        err.response?.data?.error ||
        "Terjadi kesalahan saat membuat laporan akademik";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateReport = async (
    id: string,
    reportData: Partial<CreateAcademicReportData>
  ): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.put(
        `/api/reports/academic?id=${id}`,
        reportData
      );

      if (response.status === 200) {
        await fetchReports(); // Refresh the list
        return true;
      } else {
        setError(response.data?.error || "Gagal memperbarui laporan akademik");
        return false;
      }
    } catch (err: any) {
      console.error("Error updating academic report:", err);
      const errorMessage =
        err.response?.data?.error ||
        "Terjadi kesalahan saat memperbarui laporan akademik";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteReport = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.delete(`/api/reports/academic?id=${id}`);

      if (response.status === 200) {
        await fetchReports(); // Refresh the list
        return true;
      } else {
        setError(response.data?.error || "Gagal menghapus laporan akademik");
        return false;
      }
    } catch (err: any) {
      console.error("Error deleting academic report:", err);
      setError(
        err.response?.data?.error ||
          "Terjadi kesalahan saat menghapus laporan akademik"
      );
      return false;
    }
  };

  useEffect(() => {
    fetchReports();
  }, [
    filters?.studentId,
    filters?.subject,
    filters?.semester,
    filters?.academicYear,
    filters?.ustadId,
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
