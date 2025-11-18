import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface BehaviorReport {
  id: string;
  studentId: string;
  studentName: string;
  category: "academic" | "behavior" | "discipline" | "health" | "other";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  incidentDate: string;
  location?: string;
  actionTaken?: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  followUpRequired: boolean;
  followUpDate?: string;
  attachments?: string[];
  ustadId: string;
  ustadName: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
}

export interface CreateBehaviorReportData {
  studentId: string;
  category: "academic" | "behavior" | "discipline" | "health" | "other";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  incidentDate: string;
  location?: string;
  actionTaken?: string;
  status?: "open" | "in_progress" | "resolved" | "closed";
  followUpRequired?: boolean;
  followUpDate?: string;
  attachments?: string[];
}

export interface BehaviorReportsResponse {
  reports: BehaviorReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateBehaviorReportResponse {
  message: string;
  reportId: string;
  reportData: BehaviorReport;
}

export const useBehaviorReports = (filters?: {
  studentId?: string;
  category?: string;
  priority?: string;
  status?: string;
  ustadId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) => {
  const [reports, setReports] = useState<BehaviorReport[]>([]);
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
      if (filters?.category) params.append("category", filters.category);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.ustadId) params.append("ustadId", filters.ustadId);
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.append("dateTo", filters.dateTo);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());

      console.log(
        "[useBehaviorReports] Starting fetchReports with filters:",
        filters
      );
      const startTime = Date.now();

      const response = await api.get(
        `/api/reports/behavior?${params.toString()}`
      );

      const endTime = Date.now();
      console.log(
        `[useBehaviorReports] API call completed in ${endTime - startTime}ms`
      );

      if (response.status === 200) {
        const data: BehaviorReportsResponse = response.data;
        setReports(data.reports);
        setTotal(data.total);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
      } else {
        setError(response.data?.error || "Gagal memuat data laporan perilaku");
      }
    } catch (err: any) {
      console.error("Error fetching behavior reports:", err);
      setError(
        err.response?.data?.error ||
          "Terjadi kesalahan saat memuat data laporan perilaku"
      );
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (
    reportData: CreateBehaviorReportData
  ): Promise<CreateBehaviorReportResponse | null> => {
    try {
      setError(null);
      const response = await api.post("/api/reports/behavior", reportData);

      if (response.status === 200) {
        await fetchReports(); // Refresh list
        return response.data;
      } else {
        setError(response.data?.error || "Gagal membuat laporan perilaku");
        return null;
      }
    } catch (err: any) {
      console.error("Error creating behavior report:", err);
      const errorMessage =
        err.response?.data?.error ||
        "Terjadi kesalahan saat membuat laporan perilaku";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateReport = async (
    id: string,
    reportData: Partial<CreateBehaviorReportData>
  ): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.put(
        `/api/reports/behavior?id=${id}`,
        reportData
      );

      if (response.status === 200) {
        await fetchReports(); // Refresh list
        return true;
      } else {
        setError(response.data?.error || "Gagal memperbarui laporan perilaku");
        return false;
      }
    } catch (err: any) {
      console.error("Error updating behavior report:", err);
      const errorMessage =
        err.response?.data?.error ||
        "Terjadi kesalahan saat memperbarui laporan perilaku";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteReport = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.delete(`/api/reports/behavior?id=${id}`);

      if (response.status === 200) {
        await fetchReports(); // Refresh list
        return true;
      } else {
        setError(response.data?.error || "Gagal menghapus laporan perilaku");
        return false;
      }
    } catch (err: any) {
      console.error("Error deleting behavior report:", err);
      setError(
        err.response?.data?.error ||
          "Terjadi kesalahan saat menghapus laporan perilaku"
      );
      return false;
    }
  };

  useEffect(() => {
    fetchReports();
  }, [
    filters?.studentId,
    filters?.category,
    filters?.priority,
    filters?.status,
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
